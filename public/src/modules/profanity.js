'use strict';

define('profanity', ['api', 'alerts'], function (api, alerts) {
	const Profanity = {};


	function checkProfanityAPI(text) {
		return new Promise((resolve, reject) => {
			api.post('/posts/profanity-check', { content: text }, function (err, result) {
				if (err) {
					console.error('Profanity check failed:', err);
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	Profanity.check = function (text) {
		return checkProfanityAPI(text);
	};

	Profanity.showAlert = function (action) {
		if (action === 'block') {
			alerts.alert({
				type: 'danger',
				title: 'Cannot Post',
				message: 'You wrote a swear word. Please remove inappropriate language and try again.',
				timeout: 10000,
			});
		}
	};

	return Profanity;
});