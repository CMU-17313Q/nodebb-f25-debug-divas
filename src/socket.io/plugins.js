'use strict';

const Reactions = require('../plugins/reactions'); // This is your backend logic file

const Plugins = {};

// Register the reactions namespace
Plugins.reactions = {};

/**
 * Socket event: plugins.reactions.toggle
 * Called from frontend when a user clicks a reaction
 */
Plugins.reactions.toggle = async function (socket, { pid, emoji }) {
	const {uid} = socket;
	console.log('Actual UID from socket:', uid); // ← Add this
	if (!uid) {
		throw new Error('Not logged in');
	}

	const counts = await Reactions.toggleReaction(pid, emoji, uid);
	return { pid, counts };
};

module.exports = Plugins;
