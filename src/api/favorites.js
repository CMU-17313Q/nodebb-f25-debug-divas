'use strict';

const db = require.main.require('./src/database');
const { withTimeout } = require('./utils'); // Add this utility below

const Favorites = {};

const DB_TIMEOUT = 5000; // 5 seconds timeout

/**
 * Add a favorite announcement for a student
 * @param {number} studentId - The user ID of the student
 * @param {number} announcementId - The ID of the announcement
 */
Favorites.add = async function (studentId, announcementId) {
	if (!studentId || !announcementId) {
		throw new Error('Missing studentId or announcementId');
	}

	try {
		await withTimeout(
			db.insert('favorites', {
				student_id: studentId,
				announcement_id: announcementId,
				timestamp: new Date(),
			}),
			DB_TIMEOUT,
			'Database timeout while adding favorite'
		);
	} catch (err) {
		if (err.message.includes('unique constraint')) {
			throw new Error('Already favorited this announcement');
		}
		throw err;
	}
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

	try {
		await withTimeout(
			db.delete('favorites', {
				student_id: studentId,
				announcement_id: announcementId,
			}),
			DB_TIMEOUT,
			'Database timeout while removing favorite'
		);
	} catch (err) {
		throw new Error(`Failed to remove favorite: ${err.message}`);
	}
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

	try {
		const rows = await withTimeout(
			db.getObjects(
				`SELECT announcement_id, timestamp
                 FROM favorites
                 WHERE student_id = ?
                 ORDER BY timestamp DESC`,
				[studentId]
			),
			DB_TIMEOUT,
			'Database timeout while fetching favorites'
		);
		return rows;
	} catch (err) {
		throw new Error(`Failed to fetch favorites: ${err.message}`);
	}
};

module.exports = Favorites;
