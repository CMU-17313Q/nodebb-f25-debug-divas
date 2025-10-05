'use strict';
const db = require.main.require('./src/database');
const Favorites = {};

/**
 * Add a favorite announcement for a student
 * @param {number} studentId - The user ID of the student
 * @param {number} announcementId - The ID of the announcement
 */
Favorites.add = async function (studentId, announcementId) {
	if (!studentId || !announcementId) {
		throw new Error('Missing studentId or announcementId');
	}
	
	const favoriteKey = `user:${studentId}:favorites`;
	const favoriteId = `${studentId}:${announcementId}`;
	
	// Check if already favorited using sorted set
	const exists = await db.isSortedSetMember(favoriteKey, announcementId);
	if (exists) {
		throw new Error('Already favorited this announcement');
	}
	
	// Add to sorted set with current timestamp as score
	const timestamp = Date.now();
	await db.sortedSetAdd(favoriteKey, timestamp, announcementId);
	
	// Also store detailed favorite data in a hash
	await db.setObject(`favorite:${favoriteId}`, {
		studentId: studentId,
		announcementId: announcementId,
		timestamp: timestamp,
	});
};

/**
 * Remove a favorite announcement
 * @param {number} studentId
 * @param {number} announcementId
 */
Favorites.remove = async function (studentId, announcementId) {
	if (!studentId || !announcementId) {
		throw new Error('Missing studentId or announcementId');
	}
	
	const favoriteKey = `user:${studentId}:favorites`;
	const favoriteId = `${studentId}:${announcementId}`;
	
	// Remove from sorted set
	await db.sortedSetRemove(favoriteKey, announcementId);
	
	// Remove detailed data
	await db.delete(`favorite:${favoriteId}`);
};

/**
 * Get all favorites for a student
 * @param {number} studentId
 * @returns {Promise<object[]>}
 */
Favorites.getAll = async function (studentId) {
	if (!studentId) {
		throw new Error('Missing studentId');
	}

	const favoriteKey = `user:${studentId}:favorites`;

	// newest first (we used timestamp scores when adding)
	const ids = await db.getSortedSetRevRange(favoriteKey, 0, -1); // returns array of announcementIds (as strings)
	if (!ids || !ids.length) {
		return [];
	}

	// fetch scores (timestamps) for each id
	// NodeBB db adapter supports fetching scores per member
	const scores = await db.sortedSetScores(favoriteKey, ids); // array of numbers (timestamps)

	return ids.map((id, i) => ({
		announcement_id: Number(id),
		timestamp: new Date(Number(scores[i] || 0)).toISOString(),
	}));
};

module.exports = Favorites;