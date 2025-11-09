
/* eslint-disable strict */
//var request = require('request');

const translatorApi = module.exports;

// eslint-disable-next-line no-unused-vars
translatorApi.translate = function (postData) {
	// Default: assume posts are in English, no translation needed
	return [true, ''];
};

// translatorApi.translate = async function (postData) {
//  Edit the translator URL below
//  const TRANSLATOR_API = "TODO"
//  const response = await fetch(TRANSLATOR_API+'/?content='+postData.content);
//  const data = await response.json();
//  return ['is_english','translated_content'];
// };
