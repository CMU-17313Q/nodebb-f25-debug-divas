'use strict';

// This file is testing favorites routes

const assert = require('assert');
const request = require('../../src/request'); // NodeBB request helper
const Favorites = require('../../src/controllers/api/favorites');

describe('Favorites API', () => {
	const uid = 1;
	const targetId = 123;
	const anotherUid = 2;
    
	before(async () => {
		// Clean state: remove test favorites
		await Favorites.remove(uid, targetId);
		await Favorites.remove(anotherUid, targetId);
	});


	after(async () => {
		// Cleanup after tests
		await Favorites.remove(uid, targetId);
		await Favorites.remove(anotherUid, targetId);
	});

	describe('POST /api/favorites', () => {
		it('should create a favorite', async () => {
			const { response, body } = await request.post('/api/favorites', {
				body: { targetId },
				headers: { 'Authorization': 'Bearer fake-token' } // mock auth if needed
			});

			assert.equal(response.statusCode, 201);
			assert.equal(body.favorited, true);
			assert.equal(body.targetId, targetId);
		});

		it('should return 400 if targetId missing', async () => {
			const { response, body } = await request.post('/api/favorites', { body: {} });
			assert.equal(response.statusCode, 400);
			assert.ok(body.error.includes('Missing'));
		});

		it('should return 200 if already favorited', async () => {
			// Add same favorite again
			const { response, body } = await request.post('/api/favorites', {
				body: { targetId }
			});

			assert.equal(response.statusCode, 200);
			assert.equal(body.favorited, true);
			assert.ok(body.alreadyFavorited);
		});
	});

	describe('GET /api/favorites/me', () => {
		it('should list my favorites', async () => {
			const { response, body } = await request.get('/api/favorites/me');
			assert.equal(response.statusCode, 200);
			assert.ok(Array.isArray(body.items));
			assert.ok(body.items.includes(targetId));
		});
	});

	describe('DELETE /api/favorites/:targetId', () => {
		it('should delete a favorite', async () => {
			const { response } = await request.delete(`/api/favorites/${targetId}`);
			assert.equal(response.statusCode, 204);
		});

		it('should still return 204 if favorite does not exist', async () => {
			const { response } = await request.delete(`/api/favorites/${targetId}`);
			assert.equal(response.statusCode, 204);
		});
	});

	describe('GET /api/favorites/:uid', () => {
		before(async () => {
			// Add a favorite for another user
			await Favorites.add(anotherUid, targetId);
		});

		it('should return another user\'s favorites if authorized', async () => {
			const { response, body } = await request.get(`/api/favorites/${anotherUid}`);
			assert.equal(response.statusCode, 200);
			assert.ok(Array.isArray(body.items));
			assert.ok(body.items.includes(targetId));
		});

		it('should return 401 if unauthorized to view another user', async () => {
			// Mock unauthorized: your middleware might check res.locals.uid != anotherUid
			// This depends on your permissions setup
		});

		after(async () => {
			await Favorites.remove(anotherUid, targetId);
		});
	});
});

