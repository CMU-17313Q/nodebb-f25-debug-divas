'use strict';

const assert = require('assert');
const db = require('./mocks/databasemock');
const topics = require('../src/topics');
const user = require('../src/user');
const categories = require('../src/categories');
const messaging = require('../src/messaging');
const profanityFilter = require('../src/profanity/filter');
const api = require('../src/api');
const meta = require('../src/meta');

describe('Profanity Filter', () => {
	let testUid;
	let cid;

	before(async () => {
		testUid = await user.create({ username: 'profanityuser' });
		({ cid } = await categories.create({
			name: 'Test Category',
			description: 'Test category for profanity filter',
		}));
	});

	describe('Filter Service', () => {
		it('should clean profanity from text', () => {
			const dirtyText = 'This is a damn test';
			const cleanText = profanityFilter.clean(dirtyText);
			assert.notStrictEqual(cleanText, dirtyText);
			assert(cleanText.includes('***'));
		});

		it('should detect profane text', () => {
			const profaneText = 'This is a damn test';
			const cleanText = 'This is a clean test';
			assert.strictEqual(profanityFilter.isProfane(profaneText), true);
			assert.strictEqual(profanityFilter.isProfane(cleanText), false);
		});

		it('should get list of banned words', () => {
			const words = profanityFilter.getWords();
			assert(Array.isArray(words));
			assert(words.length > 0);
		});

		it('should add a word to banned list', () => {
			const testWord = 'testbadword';
			profanityFilter.addWord(testWord);
			const words = profanityFilter.getWords();
			assert(words.includes(testWord));
		});

		it('should remove a word from banned list', () => {
			const testWord = 'testbadword';
			profanityFilter.addWord(testWord);
			profanityFilter.removeWord(testWord);
			const words = profanityFilter.getWords();
			assert(!words.includes(testWord));
		});
	});

	describe('Post Integration', () => {
		it('should filter profanity in new posts', async () => {
			const result = await topics.post({
				uid: testUid,
				cid: cid,
				title: 'Test Topic',
				content: 'This is a damn test post',
			});
			assert(result.postData.content.includes('***'));
			assert(!result.postData.content.includes('damn'));
		});

		it('should filter profanity in edited posts', async () => {
			const result = await topics.post({
				uid: testUid,
				cid: cid,
				title: 'Test Topic 2',
				content: 'This is a clean post',
			});
			const posts = require('../src/posts');
			await posts.edit({
				pid: result.postData.pid,
				uid: testUid,
				content: 'This is a damn edited post',
			});
			const editedPost = await posts.getPostData(result.postData.pid);
			assert(editedPost.content.includes('***'));
			assert(!editedPost.content.includes('damn'));
		});
	});

	describe('Chat Integration', () => {
		let roomId;
		let otherUid;

		before(async () => {
			otherUid = await user.create({ username: 'chatuser2' });
			roomId = await messaging.newRoom(testUid, { uids: [otherUid] });
		});

		it('should filter profanity in chat messages', async () => {
			const message = await messaging.addMessage({
				uid: testUid,
				roomId: roomId,
				content: 'This is a damn chat message',
				timestamp: Date.now(),
			});
			const messages = await messaging.getMessages({
				callerUid: testUid,
				uid: testUid,
				roomId: roomId,
				start: 0,
			});
			const lastMessage = messages[messages.length - 1];
			assert(lastMessage.content.includes('***'));
			assert(!lastMessage.content.includes('damn'));
		});
	});

	describe('API Profanity Check', () => {
		beforeEach(async () => {
			await meta.configs.set('profanityAction', 'block');
		});

		it('should detect profanity and return block action', async () => {
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result.hasProfanity, true);
			assert.strictEqual(result.action, 'block');
			assert(Array.isArray(result.foundWords));
			assert(result.foundWords.length > 0);
		});

		it('should not detect profanity in clean content', async () => {
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a clean test' });
			assert.strictEqual(result.hasProfanity, false);
			assert.strictEqual(result.action, 'block');
			assert(Array.isArray(result.foundWords));
			assert.strictEqual(result.foundWords.length, 0);
		});

		it('should return filter action when configured', async () => {
			await meta.configs.set('profanityAction', 'filter');
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result.hasProfanity, true);
			assert.strictEqual(result.action, 'filter');
			assert(result.filteredContent.includes('***'));
			assert(!result.filteredContent.includes('damn'));
		});

		it('should provide filtered content for filter action', async () => {
			await meta.configs.set('profanityAction', 'filter');
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test with shit content' });
			assert.strictEqual(result.hasProfanity, true);
			assert.strictEqual(result.action, 'filter');
			assert(result.filteredContent.includes('***'));
			assert(!result.filteredContent.includes('damn'));
			assert(!result.filteredContent.includes('shit'));
		});

		it('should default to block action when no setting is configured', async () => {
			await meta.configs.set('profanityAction', '');
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result.hasProfanity, true);
			assert.strictEqual(result.action, 'block');
		});
	});

	describe('Admin Settings Integration', () => {
		it('should persist profanity action setting', async () => {
			await meta.configs.set('profanityAction', 'filter');
			const setting = await meta.configs.get('profanityAction');
			assert.strictEqual(setting, 'filter');
		});

		it('should change profanity behavior when admin changes setting', async () => {
			await meta.configs.set('profanityAction', 'block');
			let result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result.action, 'block');

			await meta.configs.set('profanityAction', 'filter');
			result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result.action, 'filter');
			assert(result.filteredContent.includes('***'));
		});

		it('should handle empty or invalid profanity action gracefully', async () => {
			await meta.configs.set('profanityAction', 'invalid');
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result.action, 'invalid');

			await meta.configs.set('profanityAction', '');
			const result2 = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			assert.strictEqual(result2.action, 'block');
		});

		it('should maintain setting consistency across API calls', async () => {
			await meta.configs.set('profanityAction', 'filter');

			const result1 = await api.posts.checkProfanity({ uid: testUid }, { content: 'This is a damn test' });
			const result2 = await api.posts.checkProfanity({ uid: testUid }, { content: 'Another shit test' });

			assert.strictEqual(result1.action, 'filter');
			assert.strictEqual(result2.action, 'filter');
			assert(result1.filteredContent.includes('***'));
			assert(result2.filteredContent.includes('***'));
		});
	});
});
