translatorApi.translate = async function (postData) {
	// If translation is disabled (for CI etc), just echo the content back
	if (process.env.SKIP_TRANSLATION === '1') {
		return [true, postData.content];
	}

	const TRANSLATOR_API =
		process.env.TRANSLATOR_API ||
		'http://crs-17313-debug-divas-gpu.qatar.cmu.edu:8080';

	try {
		const url = TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content);
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error('Bad status ' + response.status);
		}

		const data = await response.json();

		return [!!data.is_english, data.translated_content || postData.content];
	} catch (err) {
		console.warn('Translator fetch failed, falling back:', err.message);
		return [true, postData.content];
	}
};
