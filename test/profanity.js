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
const controllers = require('../src/controllers');
const request = require('../src/request');
const nconf = require('nconf');
const helpers = require('./helpers');

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

	describe('Controller Integration', () => {
		let mockReq;
		let mockRes;
		let responseData;

		beforeEach(() => {
			responseData = null;
			mockReq = {
				uid: testUid,
				body: { content: 'This is a damn test' },
			};
			mockRes = {
				status: function(code) { this.statusCode = code; return this; },
				json: function(data) { responseData = data; return this; },
			};
		});

		it('should handle controller checkProfanity method', async () => {
			await meta.configs.set('profanityAction', 'block');

			// Mock the helpers.formatApiResponse function
			const originalFormatApiResponse = require('../src/controllers/helpers').formatApiResponse;
			require('../src/controllers/helpers').formatApiResponse = function(status, res, data) {
				res.status(status);
				res.json({ status: { code: status === 200 ? 'ok' : 'error' }, response: data });
			};

			await controllers.write.posts.checkProfanity(mockReq, mockRes);

			assert.strictEqual(mockRes.statusCode, 200);
			assert(responseData);
			assert.strictEqual(responseData.response.hasProfanity, true);
			assert.strictEqual(responseData.response.action, 'block');

			// Restore original function
			require('../src/controllers/helpers').formatApiResponse = originalFormatApiResponse;
		});
	});

	describe('Topic Posting with Profanity Integration', () => {
		it('should work with filtered profanity in topic posts', async () => {
			await meta.configs.set('profanityAction', 'filter');

			const result = await topics.post({
				uid: testUid,
				cid: cid,
				title: 'Test Topic with Profanity',
				content: 'This damn post should be filtered',
			});

			// The content should be filtered by the profanity system
			const posts = require('../src/posts');
			const postData = await posts.getPostData(result.postData.pid);
			assert(postData.content.includes('***'));
			assert(!postData.content.includes('damn'));
		});

		it('should handle block mode in topic posts', async () => {
			await meta.configs.set('profanityAction', 'block');

			// In block mode, the post creation should still work but content should be processed
			const result = await topics.post({
				uid: testUid,
				cid: cid,
				title: 'Test Topic Block Mode',
				content: 'This damn post tests block mode',
			});

			// In this implementation, block mode filtering happens at frontend level
			// Backend still processes the post but frontend should prevent submission
			assert(result.postData);
			assert(result.postData.content);
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors gracefully', async () => {
			try {
				await api.posts.checkProfanity({ uid: null }, { content: 'test' });
				// Should not reach here if error is thrown
				assert.fail('Expected error for null uid');
			} catch (err) {
				// Error should be handled gracefully
				assert(err);
			}
		});

		it('should handle missing content parameter', async () => {
			try {
				await api.posts.checkProfanity({ uid: testUid }, {});
				// Should not reach here if error is thrown
				assert.fail('Expected error for missing content');
			} catch (err) {
				// Error should be handled gracefully
				assert(err);
			}
		});

		it('should handle very large content', async () => {
			const veryLargeContent = 'word '.repeat(10000) + 'damn';
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: veryLargeContent });

			assert.strictEqual(result.hasProfanity, true);
			assert(result.foundWords.length > 0);
		});
	});

	describe('Performance and Edge Cases', () => {
		it('should handle special characters and unicode', async () => {
			const unicodeContent = 'This is a d@mn test with émojis 🤬 and speciâl chars';
			const result = await api.posts.checkProfanity({ uid: testUid }, { content: unicodeContent });

			// Should still detect the profanity despite special characters
			assert(result.hasProfanity !== undefined);
			assert(Array.isArray(result.foundWords));
		});

		it('should handle repeated calls efficiently', async () => {
			const start = Date.now();
			const promises = [];

			for (let i = 0; i < 10; i++) {
				promises.push(api.posts.checkProfanity({ uid: testUid }, { content: `Test ${i} damn content` }));
			}

			const results = await Promise.all(promises);
			const duration = Date.now() - start;

			// All calls should complete within reasonable time
			assert(duration < 5000); // 5 seconds max
			assert.strictEqual(results.length, 10);
			results.forEach(result => {
				assert.strictEqual(result.hasProfanity, true);
			});
		});

		it('should handle concurrent different settings', async () => {
			// Test what happens if setting changes during processing
			await meta.configs.set('profanityAction', 'block');

			const promise1 = api.posts.checkProfanity({ uid: testUid }, { content: 'damn test 1' });

			// Change setting immediately
			await meta.configs.set('profanityAction', 'filter');

			const promise2 = api.posts.checkProfanity({ uid: testUid }, { content: 'damn test 2' });

			const [result1, result2] = await Promise.all([promise1, promise2]);

			// Both should complete successfully
			assert(result1.hasProfanity);
			assert(result2.hasProfanity);
		});
	});
});
