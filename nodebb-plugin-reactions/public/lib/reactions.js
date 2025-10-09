'use strict';
/* global $, socket */

function showError(msg) {
  try { require(['alerts'], (alerts) => alerts.error(msg)); }
  catch { console.error(msg); }
}

console.log('✅ [reactions.js] loaded');

$(window).on('action:ajaxify.end', function () {
  $(document)
    .off('click', '.reaction-btn')
    .on('click', '.reaction-btn', function () {
      const $btn = $(this);
      const emoji = $btn.data('emoji');
      const $container = $btn.closest('[data-component="post/reactions"]');
      const pid = $container.data('pid');

      if (!pid || !emoji) return;

      console.log(`🧩 Click detected: pid=${pid}, emoji=${emoji}`);

      socket.emit('plugins.reactions.toggle', { pid, emoji }, (err, result) => {
        if (err) { showError(err.message || 'Failed to toggle reaction'); return; }
        if (!result || !result.counts) return;

        // Update counts
        Object.entries(result.counts).forEach(([key, value]) => {
          const $target = $container.find(`[data-emoji="${key}"]`);
          const $count = $target.find('.reaction-count');
          if (value > 0) $count.text(value).removeClass('hidden');
          else $count.text('0').addClass('hidden');
        });

        // Toggle pressed state
        const pressed = $btn.attr('aria-pressed') === 'true';
        $btn.attr('aria-pressed', !pressed).toggleClass('active', !pressed);
      });
    });
});
