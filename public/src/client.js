'use strict';

require('./app');

// scripts-client.js is generated during build, it contains javascript files
// from plugins that add files to "scripts" block in plugin.json
require('../scripts-client');

app.onDomReady();


// Here i'm working on the word count + show a live chip in the composer
(function () {
  'use strict';

  // helpers to calculate word count
  function wc_countWords(text) {
    if (!text) return 0;
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    const m = text.trim().match(/\b[\p{L}\p{N}’'-]+\b/gu);
    return m ? m.length : 0;
  }

  function wc_countChars(text, mode = 'withSpaces') {
    if (!text) return 0;
    const s = mode === 'withoutSpaces' ? text.replace(/\s+/g, '') : text;
    return [...s].length;
  }


  function wc_findMountPoint(composerEl) {
    return (
      composerEl.querySelector('.formatting-bar') ||
      composerEl.querySelector('.composer-footer .control-bar') ||
      composerEl.querySelector('.form-actions') ||
      composerEl.querySelector('.composer-footer') ||
      composerEl
    );
  }

  //  createchip which will show the counts
  function wc_ensureChip(composerEl) {
    const mount = wc_findMountPoint(composerEl);
    if (!mount) return null;

    let chip = mount.querySelector('.wc-chip');
    if (chip) return chip;

    chip = document.createElement('span');
    chip.className = 'wc-chip';
    chip.setAttribute('aria-live', 'polite');
    chip.title = 'Live word & character count';
    chip.textContent = '0 words • 0 chars';

    mount.insertBefore(chip, mount.firstChild);
    return chip;
  }


  function wc_wireComposer(composerEl, charMode = 'withSpaces') {
    if (!composerEl) return;

    const input = composerEl.querySelector('textarea.write');
    if (!input || input.dataset.wcHooked === '1') return;
    input.dataset.wcHooked = '1';

    // make sure UI chip exists which is used to show counts
    const chip = wc_ensureChip(composerEl);

    const update = () => {
      const v = input.value || '';
      const words = wc_countWords(v);
      const chars = wc_countChars(v, charMode);

      input.dataset.wordCount = String(words);
      input.dataset.charCount = String(chars);

      if (chip) {
        const wLabel = words === 1 ? 'word' : 'words';
        const cLabel = chars === 1 ? 'char' : 'chars';
        chip.textContent = `${words} ${wLabel} • ${chars} ${cLabel}`;
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
    document.querySelectorAll('.composer').forEach((c) => wc_wireComposer(c));
  });
  wcObserver.observe(document.documentElement, { childList: true, subtree: true });

  // also work if its a draft loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.composer').forEach((c) => wc_wireComposer(c));
    });
  } else {
    document.querySelectorAll('.composer').forEach((c) => wc_wireComposer(c));
  }

})();
