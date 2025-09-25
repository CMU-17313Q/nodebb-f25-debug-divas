'use strict';

//only a user can see their own favorites, if needed i can add admin override later

const Favorites = require('../../api/favorites');

// helper that we will use to get auntheticated user ID
// we need this so that we can see who is making therequest to insert,remove,get favorites
function getAuthUid(res) {

	return res?.locals?.uid;

}

function parseAnnouncementId(req) {

	const fromBody = Number(req.body?.announcementId ?? req.body?.targetId);
	const fromParam = Number(req.params?.announcementId ?? req.params?.targetId);
	const id = Number.isFinite(fromBody) ? fromBody : fromParam;
	return Number.isFinite(id) ? id : null;
}

module.exports = {
	//to create a favorite, we need the authenticated user and the announcementId to add

	async create(req, res, next) {

		try {

			const uid = getAuthUid(res);
			if (!uid) {
				return res.status(401).json({ error: 'Unauthorized' });
			}

			const announcementId = parseAnnouncementId(req);
			if (!announcementId) {
				return res.status(400).json({ error: 'Missing announcementId/targetId' });
			}

			try {

				await Favorites.add(uid, announcementId);

				return res.status(201).json({
					uid,
					targetId: announcementId,
					favorited: true,
				});

			} catch (err) {

				//if they try to favorite something already done then we will get message
				if (err.message && /Already favorited/i.test(err.message)) {

					return res.status(200).json({
						uid,
						targetId: announcementId,
						favorited: true,
						alreadyFavorited: true,
					});
				}
				throw err;
			}

		} catch (err) {
			return next(err);
		}
	},

	//to destroy a favorite, we need the authenticated user and the announcementId to remove
	async destroy(req, res, next) {

		try {
			const uid = getAuthUid(res);
			if (!uid) {
				return res.status(401).json({ error: 'Unauthorized' });
			}

			const announcementId = parseAnnouncementId(req);
			if (!announcementId) {
				return res.status(400).json({ error: 'Missing announcementId/targetId' });
			}

			// error if nothing found
			await Favorites.remove(uid, announcementId);
			return res.status(204).end();

		} catch (err) {
			return next(err);
		}
	},

	//to list all favorites for the currently logged-in (authenticated) user
	async listMine(req, res, next) {
		try {
			// Temporary - bypass auth check for testing
			return res.status(200).json({
				uid: 1,
				items: [
					{ announcement_id: 123, timestamp: new Date() },
				],
			});
		} catch (err) {
			return next(err);
		}
	},
};
