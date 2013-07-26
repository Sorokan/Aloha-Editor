define(['aloha/jquery'], function ($) {
	'use strict';

	var $DOCUMENT = $(document);
	var $WINDOW = $(window);

	/**
	 * Checks whether the overlay is visible.
	 *
	 * @param {Overlay} overlay
	 * @return {boolean}
	 *         True if the overlay is visible.
	 */
	function isOverlayVisible(overlay) {
		return overlay.$element.css('display') === 'table';
	}

	/**
	 * Prepares the overlay to close when a click event is triggered on the body
	 * document.
	 *
	 * @param {Overlay} overlay
	 */
	function hideOnBodyClick(overlay, button) {
		overlay.$element.click(function (event) {
			event.stopPropagation();
		});

		$('body').click(function (event) {
			// Because click events on the overlay ui should not cause it to
			// hide itself.
			if (!overlay._active
					|| (event.target === overlay.$element[0])
					|| $(button).is(event.target)
					|| $(button).find(event.target).length) {
				return;
			}
			overlay.hide();
		});
	}

	/**
	 * Prepares the given overlay to close when the ESC button is clicked.
	 *
	 * @param {Overlay} overlay
	 */
	function hideOnEsc(overlay) {
		$DOCUMENT.keyup(function (event) {
			if ((27 === event.keyCode) && isOverlayVisible(overlay)) {
				overlay.hide();
			}
		});
	}

	/**
	 * Enables navigation through the overlay table with the arrow keys and
	 * select one with the enter key.
	 *
	 * @param {Overlay} overlay
	 * @param {function} onSelect Function to invoke when Enter is pressed.
	 */
	function movements(overlay, onSelect) {
		var keys = {
			// ←┘
			13: function select($current) {
				overlay.hide();
				onSelect($current[0]);
			},
			// ←
			37: function left($current) {
				var $prev = $current.prev();
				if ($prev.length) {
					$prev.addClass('focused');
					$current.removeClass('focused');
				}
			},
			// ↑
			38: function up($current) {
				var $prevRow = $current.parent().prev();
				if ($prevRow.length) {
					var $prev = $(
						$prevRow.children()[$current.index()]
					).addClass('focused');
					if ($prev.length) {
						$current.removeClass('focused');
					}
				}
			},
			// →
			39: function right($current) {
				var $next = $current.next().addClass('focused');
				if ($next.length) {
					$current.removeClass('focused');
				}
			},
			// ↓
			40: function down($current) {
				var $nextRow = $current.parent().next();
				if ($nextRow.length) {
					var $next = $(
						$nextRow.children()[$current.index()]
					).addClass('focused');
					if ($next.length) {
						$current.removeClass('focused');
					}
				}
			}
		};
		$DOCUMENT.keydown(function (event) {
			event.stopPropagation();
			if (keys[event.keyCode] && isOverlayVisible(overlay)) {
				keys[event.keyCode](overlay.$element.find('.focused'));
				return false;
			}
		});
	}

	/**
	 * Calculates the offset at which to position the overlay element.
	 *
	 * @param {jQuery.<DOMObject>} $element
	 *        A DOM element around which to calculate the offset.
	 */
	function calculateOffset($element, positionStyle) {
		var offset = $element.offset();
		if ('fixed' === positionStyle) {
			offset.top -= $WINDOW.scrollTop();
			offset.left -= $WINDOW.scrollLeft();
		}
		return offset;
	}

	function populate(overlay, items, onSelect) {
		var table = ['<tr>'];
		var i = 0;
		var item = items[i];
		while (item) {
			// New row every 15 items
			if (0 !== i && (0 === (i % 15))) {
				table.push('</tr><tr>');
			}
			table.push('<td unselectable="on">' + item + '</td>');
			item = items[++i];
		}
		table.push('</tr>');

		overlay.$element.find('tbody').empty().append(table.join(''));

		overlay.$element.delegate('td', 'mouseover', function () {
			overlay.$element.find('.focused').removeClass('focused');
			$(this).addClass('focused');
		}).delegate('td', 'mouseout', function () {
			$(this).removeClass('focused');
		}).delegate('td', 'click', function () {
			overlay.$element.hide();
			onSelect(this);
		});
	}

	/**
	 * Overlay object.
	 *
	 * @param {function} onSelect
	 * @type {Overlay}
	 */
	function Overlay(items, onSelect, button) {
		var overlay = this;
		overlay.$element = $(
			'<table unselectable="on" role="dialog"><tbody></tbody></table>'
		).appendTo('body');
		hideOnBodyClick(overlay, button);
		hideOnEsc(overlay);
		movements(overlay, onSelect);
		populate(overlay, items, onSelect);
	}

	Overlay.prototype = {

		/**
		 * Shows the overlay at the given button's position.
		 *
		 * @param {DOMElement} button
		 */
		show: function (button, offset) {
			var overlay = this;

			// Because the overlay needs to be reposition relative its button.
			overlay.$element
			       .css(offset)
			       .show()
			       .find('.focused')
			       .removeClass('focused');

			if (0 === overlay.$element.find('.focused').length) {
				overlay.$element
					   .find('td')
					   .eq(0)
					   .addClass('focused');
			}

			overlay._active = true;
		},

		/**
		 * Hides the overlay.
		 */
		hide: function () {
			this.$element.hide();
			this._active = false;
		}
	};

	Overlay.calculateOffset = calculateOffset;

	return Overlay;
});
