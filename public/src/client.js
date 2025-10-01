'use strict';

require('./app');

// scripts-client.js is generated during build, it contains javascript files
// from plugins that add files to "scripts" block in plugin.json
require('../scripts-client');

app.onDomReady();



//Here i'm working on the word count 


(function () {
  'use strict';

  function wc_countWords(text) {
    if (!text) return 0;
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    const m = text.trim().match(/\b[\p{L}\p{N}’'-]+\b/gu);
    return m ? m.length : 0;
  }

  //calculate without spaces or with spaces
  function wc_countChars(text, mode = 'withSpaces') {
    if (!text) return 0;
    const s = mode === 'withoutSpaces' ? text.replace(/\s+/g, '') : text;
    return [...s].length; 
  }

  function wc_wireComposer(composerEl, charMode = 'withSpaces') {
    if (!composerEl) return;
    const input = composerEl.querySelector('textarea.write');
    if (!input || input.dataset.wcHooked === '1') return;
    input.dataset.wcHooked = '1';

    const update = () => {
      const v = input.value || '';
      const words = wc_countWords(v);
      const chars = wc_countChars(v, charMode);

      
      input.dataset.wordCount = String(words);
      input.dataset.charCount = String(chars);

    
      input.dispatchEvent(new CustomEvent('composer:metrics', {
        bubbles: true,
        detail: { words, chars, charMode },
      }));
    };

    input.addEventListener('input', update);
    input.addEventListener('paste', () => requestAnimationFrame(update));
    update();
  }

  // show when there is a new discussion
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


  window.__composerMetrics = { wc_countWords, wc_countChars };
})();


