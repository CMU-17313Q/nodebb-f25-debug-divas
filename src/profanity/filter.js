'use strict';

const Filter = require('bad-words');

const filter = new Filter();

const profanityFilter = {};

profanityFilter.clean = function (text) {
	if (!text || typeof text !== 'string') {
		return text;
	}
	const cleaned = filter.clean(text);
	// Ensure we always return a string, never null or undefined
	return cleaned || text;
};

profanityFilter.isProfane = function (text) {
	if (!text || typeof text !== 'string') {
		return false;
	}
	return filter.isProfane(text);
};

profanityFilter.getWords = function () {
	const allWords = Array.from(filter.list);
	const excludedWords = filter.exclude || [];
	return allWords.filter(word => !excludedWords.includes(word));
};


profanityFilter.addWord = function (word) {
	if (!word || typeof word !== 'string') {
		throw new Error('[[error:invalid-word]]');
	}
	filter.addWords(word.toLowerCase());
	return true;
};

profanityFilter.removeWord = function (word) {
	if (!word || typeof word !== 'string') {
		throw new Error('[[error:invalid-word]]');
	}
	filter.removeWords(word.toLowerCase());
	return true;
};

module.exports = profanityFilter;
