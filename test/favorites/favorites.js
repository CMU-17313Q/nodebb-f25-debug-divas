'use strict';

const assert = require('assert');
const path = require('path');

describe('controllers/api/favorites', () => {
	let controller;
    

	function freshControllerWithStubs(stubs = {}) {
		const abs = path.resolve(__dirname, '../../src/api/favorites.js');
		// Inject stub into require cache to avoid loading real module
		require.cache[abs] = {
			id: abs,
			filename: abs,
			loaded: true,
			exports: Object.assign({
				add: async () => {},
				remove: async () => {},
				getAll: async () => [],
			}, stubs),
		};

		delete require.cache[require.resolve('../../src/controllers/api/favorites')];
		controller = require('../../src/controllers/api/favorites');
	}

	function makeRes(uid) {
		const out = { statusCode: null, jsonBody: null, ended: false };
		const res = {
			locals: { uid },
			status(code) {
				out.statusCode = code;
				return this;
			},
			json(obj) {
				out.jsonBody = obj;
				return this;
			},
			end() {
				out.ended = true;
				return this;
			},
		};
		return { res, out };
	}

	it('create -> 401 when no uid', async () => {
		freshControllerWithStubs();
		const req = { body: {} };
		const { res, out } = makeRes(undefined);
		let nextCalled = false;
		await controller.create(req, res, () => { nextCalled = true; });
		assert.strictEqual(out.statusCode, 401);
		assert.strictEqual(Boolean(out.jsonBody && out.jsonBody.error), true);
		assert.strictEqual(nextCalled, false);
	});

	it('create -> 400 when missing announcementId/targetId', async () => {
		freshControllerWithStubs();
		const req = { body: {}, params: {} };
		const { res, out } = makeRes(10);
		await controller.create(req, res, () => {});
		assert.strictEqual(out.statusCode, 400);
	});

	it('create -> 201 on success', async () => {
		freshControllerWithStubs({ add: async () => {} });
		const req = { body: { announcementId: 42 } };
		const { res, out } = makeRes(7);
		await controller.create(req, res, () => {});
		assert.strictEqual(out.statusCode, 201);
		assert.strictEqual(out.jsonBody.uid, 7);
		assert.strictEqual(out.jsonBody.targetId, 42);
		assert.strictEqual(out.jsonBody.favorited, true);
	});

	it('create -> 200 alreadyFavorited', async () => {
		freshControllerWithStubs({ add: async () => { throw new Error('Already favorited'); } });
		const req = { body: { targetId: 99 } };
		const { res, out } = makeRes(1);
		await controller.create(req, res, () => {});
		assert.strictEqual(out.statusCode, 200);
		assert.strictEqual(out.jsonBody.alreadyFavorited, true);
	});

	it('destroy -> 401 when no uid', async () => {
		freshControllerWithStubs();
		const req = { params: { targetId: 5 } };
		const { res, out } = makeRes(undefined);
		await controller.destroy(req, res, () => {});
		assert.strictEqual(out.statusCode, 401);
	});

	it('destroy -> 400 when missing announcementId/targetId', async () => {
		freshControllerWithStubs();
		const req = { params: {} };
		const { res, out } = makeRes(3);
		await controller.destroy(req, res, () => {});
		assert.strictEqual(out.statusCode, 400);
	});

	it('destroy -> 204 on success', async () => {
		freshControllerWithStubs({ remove: async () => {} });
		const req = { params: { targetId: 5 } };
		const { res, out } = makeRes(3);
		await controller.destroy(req, res, () => {});
		assert.strictEqual(out.statusCode, 204);
		assert.strictEqual(out.ended, true);
	});

	it('listMine -> 401 when no uid', async () => {
		freshControllerWithStubs();
		const req = {};
		const { res, out } = makeRes(undefined);
		await controller.listMine(req, res, () => {});
		assert.strictEqual(out.statusCode, 401);
	});

	it('listMine -> 200 with items', async () => {
		freshControllerWithStubs({ getAll: async (uid) => [{ id: 1, owner: uid }] });
		const req = {};
		const { res, out } = makeRes(11);
		await controller.listMine(req, res, () => {});
		assert.strictEqual(out.statusCode, 200);
		assert.strictEqual(out.jsonBody.uid, 11);
		assert.deepStrictEqual(out.jsonBody.items, [{ id: 1, owner: 11 }]);
	});
});


