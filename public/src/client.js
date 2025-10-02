'use strict';

require('./app');

// scripts-client.js is generated during build, it contains javascript files
// from plugins that add files to "scripts" block in plugin.json
require('../scripts-client');

app.onDomReady();


// Here i'm working on the word count + show a live chip in the composer
// Here i'm working on the word count + show a live chip in the composer

(function () {
  'use strict';

  // --- helpers: words & chars ---
  function wc_countWords(text) {
    if (!text) return 0;
    // ignore fenced & inline code so counts aren't inflated
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    // defensive: strip any tags
    text = text.replace(/<[^>]+>/g, ' ');
    const m = text.trim().match(/\b[\p{L}\p{N}’'-]+\b/gu);
    return m ? m.length : 0;
  }

  // calculate without spaces or with spaces (default)
  function wc_countChars(text, mode = 'withSpaces') {
    if (!text) return 0;
    const s = mode === 'withoutSpaces' ? text.replace(/\s+/g, '') : text;
    return [...s].length; // unicode-safe
  }

  // --- UI: find a good place to mount the chip ---
  function wc_findMountPoint(composerEl) {
    return (
      composerEl.querySelector('.formatting-bar') ||                  // toolbar row (icons)
      composerEl.querySelector('.composer-footer .control-bar') ||    // some themes
      composerEl.querySelector('.form-actions') ||                    // fallback
      composerEl.querySelector('.composer-footer') ||                 // fallback
      composerEl                                                     // last resort
    );
  }

  // --- UI: create the chip once per composer ---
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

    // put it at the start so it’s visible but unobtrusive
    mount.insertBefore(chip, mount.firstChild);
    return chip;
  }

  // --- main wire-up: compute + emit + update chip ---
  function wc_wireComposer(composerEl, charMode = 'withSpaces') {
    if (!composerEl) return;

    const input = composerEl.querySelector('textarea.write');
    if (!input || input.dataset.wcHooked === '1') return;
    input.dataset.wcHooked = '1';

    // make sure UI chip exists
    const chip = wc_ensureChip(composerEl);

    const update = () => {
      const v = input.value || '';
      const words = wc_countWords(v);
      const chars = wc_countChars(v, charMode);

      // expose for quick checks / other code
      input.dataset.wordCount = String(words);
      input.dataset.charCount = String(chars);

      // update chip text if present
      if (chip) {
        const wLabel = words === 1 ? 'word' : 'words';
        const cLabel = chars === 1 ? 'char' : 'chars';
        chip.textContent = `${words} ${wLabel} • ${chars} ${cLabel}`;
      }

      // fire event for anything else (e.g., reading-time code)
      input.dispatchEvent(new CustomEvent('composer:metrics', {
        bubbles: true,
        detail: { words, chars, charMode },
      }));
    };

    // live updates
    input.addEventListener('input', update);
    input.addEventListener('paste', () => requestAnimationFrame(update));

    // first render
    update();
  }

  // show when there is a new discussion / reply / edit (composer appears dynamically)
  const wcObserver = new MutationObserver(() => {
    document.querySelectorAll('.composer').forEach((c) => wc_wireComposer(c));
  });
  wcObserver.observe(document.documentElement, { childList: true, subtree: true });

  // run once on load too
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.composer').forEach((c) => wc_wireComposer(c));
    });
  } else {
    document.querySelectorAll('.composer').forEach((c) => wc_wireComposer(c));
  }

})();
