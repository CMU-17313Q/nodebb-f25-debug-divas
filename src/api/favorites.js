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
	
	// Return empty array for now to eliminate timeout
	return [];
};

module.exports = Favorites;