'use strict';

const db = require.main.require('./src/database');
const sockets = require.main.require('./src/socket.io/plugins');
const winston = require.main.require('winston');
const Reactions = require('./lib/reactions');

const Plugin = {};

Plugin.init = async function (params) {
	console.log('🎉 [Emoji Reactions] Plugin initialized');
};

sockets.reactions = {};

sockets.reactions.toggle = async function (socket, data, callback) {
	try {
		const { pid, emoji } = data || {};
		const { uid } = socket;

		console.log(`🎯 [SOCKET] toggle → pid=${pid}, emoji=${emoji}, uid=${uid}`);

		if (!uid) {
			return callback(new Error('Not logged in'));
		}

		const counts = await Reactions.toggleReaction(pid, emoji, uid);
		console.log('✅ [SOCKET] counts updated:', counts);

		callback(null, { pid, counts });
	} catch (err) {
		console.error('❌ [SOCKET] toggle error:', err);
		callback(err);
	}
};

module.exports = Plugin;
