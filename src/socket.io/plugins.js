'use strict';

console.log('🚀 [NodeBB] Custom Reactions socket handler file is being loaded.');

const Reactions = require('../plugins/reactions');
const Plugins = {};

Plugins.reactions = {};

// ✅ Modern NodeBB v3+ socket handler (no callbacks)
Plugins.reactions.toggle = async function (socket, data) {
	console.log('🧩 [Reactions] toggle handler registered');

	try {
		const { pid, emoji } = data || {};
		const { uid } = socket;

		console.log('🧠 [Reactions] toggle called -> pid:', pid, 'emoji:', emoji, 'uid:', uid);

		if (!uid) {
			throw new Error('Not logged in');
		}

		if (!pid || !emoji) {
			throw new Error('Missing pid or emoji');
		}

		// Run your backend toggle logic
		const counts = await Reactions.toggleReaction(pid, emoji, uid);

		// ✅ Return value (NodeBB 3+ expects this)
		return { pid, counts };
	} catch (err) {
		console.error('[Reactions.toggle] Error:', err);
		// ✅ Throw error instead of callback
		throw err;
	}
};

console.log('🔍 [TEST] sockets.plugins.reactions.toggle type:', typeof Plugins.reactions?.toggle);

module.exports = Plugins;
