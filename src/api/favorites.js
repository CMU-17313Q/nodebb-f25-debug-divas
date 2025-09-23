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

	try {
		await db.insert('favorites', {
			student_id: studentId,
			announcement_id: announcementId,
			timestamp: new Date(),
		});
	} catch (err) {
		if (err.message.includes('unique constraint')) {
			// Already favorited, ignore or throw your own message
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

	await db.delete('favorites', {
		student_id: studentId,
		announcement_id: announcementId,
	});
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

	const rows = await db.getObjects(
		`SELECT announcement_id, timestamp
		 FROM favorites
		 WHERE student_id = ?
		 ORDER BY timestamp DESC`,
		[studentId]
	);

	return rows;
};

module.exports = Favorites;
