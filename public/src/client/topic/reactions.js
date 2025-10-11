// File: public/src/client/topic/reactions.js
// Add this file to handle reaction button clicks

'use strict';

define('forum/topic/reactions', ['api'], function () {
	const Reactions = {};

	Reactions.init = function () {
		// Handle reaction button clicks
		$(document).on('click', '.reaction-btn', function (e) {
			e.preventDefault();
            
			const btn = $(this);
			const emoji = btn.data('emoji');
			const pid = btn.closest('[data-component="post/reactions"]').data('pid');
            
			// Disable button temporarily to prevent double-clicks
			if (btn.prop('disabled')) {
				return;
			}
			btn.prop('disabled', true);
            
			// Call the socket event to toggle the reaction
			socket.emit('plugins.reactions.toggle', { pid, emoji }, function (err, data) {
				btn.prop('disabled', false);
                
				if (err) {
					return app.alertError(err.message);
				}
                
				// Update the UI with the new counts
				if (data && data.counts) {
					updateReactionUI(pid, data.counts, emoji);
				}
			});
		});
	};
    
	function updateReactionUI(pid, counts, toggledEmoji) {
		const reactionContainer = $('[data-component="post/reactions"][data-pid="' + pid + '"]');
        
		// Update each reaction button
		reactionContainer.find('.reaction-btn').each(function () {
			const btn = $(this);
			const emoji = btn.data('emoji');
			const countSpan = btn.find('.reaction-count');
			const count = counts[emoji] || 0;
            
			// Update count display
			if (count > 0) {
				countSpan.text(count).removeClass('hidden');
			} else {
				countSpan.text('0').addClass('hidden');
			}
            
			// Toggle pressed state for the clicked emoji
			if (emoji === toggledEmoji) {
				const isPressed = btn.attr('aria-pressed') === 'true';
				btn.attr('aria-pressed', !isPressed);
                
				if (!isPressed) {
					btn.addClass('active');
				} else {
					btn.removeClass('active');
				}
			}
		});
	}
    
	return Reactions;
});