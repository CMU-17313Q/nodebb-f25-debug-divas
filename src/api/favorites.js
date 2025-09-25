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
	
	// Simple approach - just add to sorted set with timestamp
	const timestamp = Date.now();
	await db.sortedSetAdd(favoriteKey, timestamp, announcementId);
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
	
	// Remove from sorted set
	await db.sortedSetRemove(favoriteKey, announcementId);
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
	
	// Use the simplest method that definitely exists
	const announcementIds = await db.getSortedSetRevRange(favoriteKey, 0, -1);
	
	// Transform to the expected format
	const items = announcementIds.map(announcementId => ({
		announcement_id: parseInt(announcementId, 10),
		timestamp: new Date()
	}));
	
	return items;
};

module.exports = Favorites;