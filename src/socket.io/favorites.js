'use strict';

const Favorites = require('../api/favorites'); 

const FavoritesSockets = {};

FavoritesSockets.toggle = function (socket, data, callback) {
	(async () => {
		const uid = socket.uid;
		if (!uid) {
			const err = new Error('Unauthorized');
			err.status = 401;
			throw err;
		}

		const tid = Number(data && data.tid);
		if (!Number.isFinite(tid)) {
			const err = new Error('Invalid tid');
			err.status = 400;
			throw err;
		}

		// Try to add; if "already favorited" then remove (toggle).
		try {
			await Favorites.add(uid, tid);
			return { favorited: true, targetId: tid };
		} catch (e) {
			if (e && /already\s*favorited/i.test(e.message || '')) {
				await Favorites.remove(uid, tid);
				return { favorited: false, targetId: tid };
			}
			throw e;
		}
	})()
		.then((result) => callback && callback(null, result))
		.catch((err) => callback && callback(err));
};

module.exports = FavoritesSockets;
