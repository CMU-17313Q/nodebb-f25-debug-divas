/* eslint-disable strict */
//var request = require('request');

	try {
		const url = TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content);
		const response = await fetch(url);

translatorApi.translate = function (postData) {
	return ['is_english', postData];
};

translatorApi.translate = async function (postData) {
	//  Edit the translator URL below
	const TRANSLATOR_API = 'http://crs-17313-debug-divas-gpu.qatar.cmu.edu:8080';
	const response = await fetch(
		TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content)
	);
	const data = await response.json();

	return [data.is_english, data.translated_content];
};
