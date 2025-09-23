'use strict';

const db = require('../database');

module.exports = {
	name: 'add-favorites-table',
	timestamp: Date.now(),
	method: async function () {
		await db.createTable('favorites', {
			id: { type: 'serial', primaryKey: true },
			student_id: { type: 'int', notNull: true },
			announcement_id: { type: 'int', notNull: true },
			timestamp: { type: 'datetime', notNull: true, defaultTo: 'CURRENT_TIMESTAMP' },
		});

		// adding the indexes
		await db.addIndex('favorites', ['student_id']);
		await db.addIndex('favorites', ['announcement_id']);

		// preventing the same student favoriting the same announcement twice on it
		await db.addUnique('favorites', ['student_id', 'announcement_id']);
	},  
};

