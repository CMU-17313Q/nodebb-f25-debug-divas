'use strict';

const { add, remove } = require('../api/favorites');

const FavoritesSockets = {};

FavoritesSockets.toggle = function (socket, data, callback) {
	(async () => {
		const { uid } = socket;
		if (!uid) {
			const err = new Error('Unauthorized');
			err.status = 401;
			throw err;
		}

		const tid = Number(data?.tid);
		if (!Number.isFinite(tid)) {
			const err = new Error('Invalid tid');
			err.status = 400;
			throw err;
		}

		try {
			await add(uid, tid);
			return { favorited: true, targetId: tid };
		} catch (e) {
			if (e && /already\s*favorited/i.test(e.message || '')) {
				await remove(uid, tid);
				return { favorited: false, targetId: tid };
			}
			throw e;
		}
	})()
		.then(result => callback && callback(null, result))
		.catch(err => callback && callback(err));
};

module.exports = FavoritesSockets;
