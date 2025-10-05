'use strict';

const db = require('../database');

const ALLOWED_REACTIONS = ['👍', '😂', '🎉', '😢', '😡', '👏', '🙌', '👀'];

const Reactions = {};


Reactions.toggleReaction = async function (pid, emoji, uid) {
	console.log(`🧪 ToggleReaction called: pid=${pid}, emoji=${emoji}, uid=${uid}`); //new 

	if (!pid || !emoji || !uid) {
		throw new Error('Missing required fields (pid, emoji, uid)');
	}

	if (!ALLOWED_REACTIONS.includes(emoji)) {
		throw new Error('Unsupported emoji');
	}

	const countKey = `post:${pid}:reactions`;
	///const setKey = `post:${pid}:reaction:${emoji}`;
	const encodedEmoji = encodeURIComponent(emoji); //new
	const setKey = `post:${pid}:reaction:${encodedEmoji}`; //new 


	const hasReacted = await db.isSetMember(setKey, uid);

	if (hasReacted) {
		// Remove reaction
		await db.setRemove(setKey, uid);
		await db.incrObjectFieldBy(countKey, emoji, -1);
	} else {
		// Add reaction
		await db.setAdd(setKey, uid);
		await db.incrObjectFieldBy(countKey, emoji, 1);
	}

	// Get updated emoji counts
	let counts = await db.getObject(countKey);
	counts = counts || {}; 

	// Remove any emojis with 0 or negative counts
	// eslint-disable-next-line no-restricted-syntax
	for (const key in counts) {
		const count = parseInt(counts[key], 10);
		if (!count || count < 1) {
			delete counts[key];
		}
	}

	return counts;
};


Reactions.attachReactionsToPost = async function (post, uid) {
	const countKey = `post:${post.pid}:reactions`;

	let counts = await db.getObject(countKey);
	counts = counts || {}; // ✅ Prevent null

	post.reactions = counts;

	const myReactions = [];

	for (const emoji of Object.keys(post.reactions)) {
		//const setKey = `post:${post.pid}:reaction:${emoji}`;
		const encodedEmoji = encodeURIComponent(emoji); //new
		const setKey = `post:${post.pid}:reaction:${encodedEmoji}`; //new 

		// eslint-disable-next-line no-await-in-loop
		const hasReacted = await db.isSetMember(setKey, uid);
		if (hasReacted) {
			myReactions.push(emoji);
		}
	}

	post.myReactions = myReactions;
};

module.exports = Reactions;
