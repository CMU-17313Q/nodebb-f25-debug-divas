'use strict';

const assert = require('assert');
const db = require('./mocks/databasemock');
const topics = require('../src/topics');
const user = require('../src/user');
const categories = require('../src/categories');
const messaging = require('../src/messaging');
const profanityFilter = require('../src/profanity/filter');

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
});
