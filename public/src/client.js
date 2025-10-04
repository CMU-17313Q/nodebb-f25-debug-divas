'use strict';

require('./app');

// scripts-client.js is generated during build, it contains javascript files
// from plugins that add files to "scripts" block in plugin.json
require('../scripts-client');

app.onDomReady();


// Here i'm working on the word count + show a live chip in the composer
(function () {
	'use strict';

	// helper to calculate word count
	function countWords(text) {
		if (!text) return 0;
		text = text.replace(/```[\s\S]*?```/g, ' ');
		text = text.replace(/`[^`]*`/g, ' ');
		text = text.replace(/<[^>]+>/g, ' ');
		const m = text.trim().match(/\b[\p{L}\p{N}’'-]+\b/gu);
		return m ? m.length : 0;
	}

	// helper to calculate character count
	function countChars(text, mode = 'withSpaces') {
		if (!text) return 0;
		const s = mode === 'withoutSpaces' ? text.replace(/\s+/g, '') : text;
		return [...s].length;
	}

	// helper to calculate reading time
	function estimateReadingTime(words, wpm = 200) {
		if (!words) return '<30s';
		// 200 wpm ≈ 100 words per 30 seconds
		if (words < 100) return '<30s';
		const mins = Math.max(1, Math.round(words / wpm));
		return `~${mins} min read`;
	}


	function getChipMount(composerEl) {
		return (
			composerEl.querySelector('.formatting-bar') ||
      composerEl.querySelector('.composer-footer .control-bar') ||
      composerEl.querySelector('.form-actions') ||
      composerEl.querySelector('.composer-footer') ||
      composerEl
		);
	}

	//  create chip which will show the counts
	function ensureMetricsChip(composerEl) {
		const mount = getChipMount(composerEl);
		if (!mount) return null;

		let chip = mount.querySelector('.wc-chip');
		if (chip) return chip;

		chip = document.createElement('span');
		chip.className = 'wc-chip';
		chip.setAttribute('aria-live', 'polite');
		chip.title = 'Live word, character count, and reading time';
		chip.textContent = '0 words • 0 chars • <30s';


		mount.insertBefore(chip, mount.firstChild);
		return chip;
	}


	function wireComposerMetrics(composerEl, charMode = 'withSpaces') {
		if (!composerEl) return;

		const input = composerEl.querySelector('textarea.write');
		if (!input || input.dataset.wcHooked === '1') return;
		input.dataset.wcHooked = '1';

		// make sure UI chip exists which is used to show counts
		const chip = ensureMetricsChip(composerEl);

		const update = () => {
			const v = input.value || '';
			const words = countWords(v);
			const chars = countChars(v, charMode);
			const rtime = estimateReadingTime(words);


			input.dataset.wordCount = String(words);
			input.dataset.charCount = String(chars);

			if (chip) {
				const wLabel = words === 1 ? 'word' : 'words';
				const cLabel = chars === 1 ? 'char' : 'chars';
				chip.textContent = `${words} ${wLabel} • ${chars} ${cLabel} • ${rtime}`;


			}

			input.dispatchEvent(new CustomEvent('composer:metrics', {
				bubbles: true,
				detail: { words, chars, charMode },
			}));
		};

		// show while typing or pasting
		input.addEventListener('input', update);
		input.addEventListener('paste', () => requestAnimationFrame(update));

		update();
	}

	// show when there is a new discussion 
	const wcObserver = new MutationObserver(() => {
		document.querySelectorAll('.composer').forEach((c) => wireComposerMetrics(c));
	});
	wcObserver.observe(document.documentElement, { childList: true, subtree: true });

	// also work if its a draft loaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			document.querySelectorAll('.composer').forEach((c) => wireComposerMetrics(c));
		});
	} else {
		document.querySelectorAll('.composer').forEach((c) => wireComposerMetrics(c));
	}

})();
