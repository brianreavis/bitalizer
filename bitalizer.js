/**
 * Bitalizer v2
 * by Brian Reavis (@brianreavis)
 * http://thirdroute.com
 *
 * Licensed under a do-whatever-the-heck-you-like-with-it license!
 * The only catch is that you have to ping me with a link if you make
 * something neat with it.
 */
 
(function($) {
	$(function() {
		var $window    = $(window);
		var $bitalizer = $('#bitalizer');
		
		// check for proper browser support
		
		// bitalizer render core
		// ------------------------------------------------------------------------
		
		var bitalizer = (function() {
			// constants
			var COLOR_BG = 0;
			var BLOCK_SIZE = 256;
			var HALF_BLOCK_SIZE = BLOCK_SIZE / 2;
			var RENDER_INTERVAL = 20; /* ms */
			var RENDER_INTERVAL_CHUNK_SIZE = 1024; /* bytes */
			var D_X = 0.5;
			var D_THETA = Math.PI / 8;
			var BORDER_WIDTH = 1;
		
			// globals
			var buffer     = '';
			var buffer_pos = 0;
			var rendering  = false;
			var blocks     = {};
		
			var cur_x      = 0;
			var cur_y      = 0;
			var cur_theta  = 0;
		
			/**
			 * Generates
			 * @param {int} i - x index.
			 * @param {int} j - y index.
			 */
			var createRenderBlock = function(i, j) {
				var canvas  = document.createElement('canvas');
				canvas.setAttribute('data-i', i);
				canvas.setAttribute('data-j', j);
				canvas.width = BLOCK_SIZE;
				canvas.height = BLOCK_SIZE;
				var context = canvas.getContext('2d');
				var x = i * BLOCK_SIZE - HALF_BLOCK_SIZE + (i * BORDER_WIDTH);
				var y = j * BLOCK_SIZE - HALF_BLOCK_SIZE + (j * BORDER_WIDTH);
				canvas.style.left = x.toString() + 'px';
				canvas.style.top  = y.toString() + 'px';
				$bitalizer[0].appendChild(canvas);
				return context;
			};
			
			/**
			 * Returns the appropriate block to use at a particular
			 * coordinate. If it doesn't already exist, it will be created.
			 * @param {int} x - Global x coordinate.
			 * @param {int} y - Global y coordinate.
			 */
			var getRenderBlock = function(x, y) {
				var i = Math.ceil((x - HALF_BLOCK_SIZE) / BLOCK_SIZE);
				var j = Math.ceil((y - HALF_BLOCK_SIZE) / BLOCK_SIZE);
				
				var block_idx = i.toString() + ',' + j.toString();
				if (!blocks.hasOwnProperty(block_idx)) {
					blocks[block_idx] = {i: i, j: j, context: createRenderBlock(i, j)};
				}
				
				return blocks[block_idx];
			};
			
			/**
			 * Returns the local position in a render block.
			 *
			 * @param {int} x - Global x coordinate.
			 * @param {int} y - Global y coordinate.
			 * @param {int} i - Render block x index.
			 * @param {int} j - Render block y index.
			 */
			var getContextPoint = function(x, y, i, j) {
				return {
					x: x - ((i - 1) * BLOCK_SIZE + HALF_BLOCK_SIZE),
					y: y - ((j - 1) * BLOCK_SIZE + HALF_BLOCK_SIZE)
				};
			};
			
			var renderLine = function(pt0, pt1, context, style) {
				context.lineWidth = 1;
				context.strokeStyle = '#ffc730';
				context.beginPath();
				context.moveTo(pt0.x, pt0.y);
				context.lineTo(pt1.x, pt1.y);
				context.stroke();
			};
						
			/**
			 * Renders current data in the buffer.
			 */
			var renderBuffer = function() {
				var x, y, i, pt, bite, theta, block_last, block;
				
				if (rendering) return;
				rendering = true;
				
				var render = function() {
					var max_pos = buffer_pos + RENDER_INTERVAL_CHUNK_SIZE;
					
					while (buffer_pos < buffer.length && buffer_pos < max_pos) {
						bite = buffer.charCodeAt(buffer_pos) & 0xFF;
						for (i = 0; i < 8; i++) {
							cur_theta += ((bite >> i) & 0x01) ? D_THETA : -D_THETA;
							
							x     = cur_x + Math.cos(cur_theta) * D_X;
							y     = cur_y + Math.sin(cur_theta) * D_X;
							block = getRenderBlock(x, y);
							pt0   = getContextPoint(cur_x, cur_y, block.i, block.j);
							pt1   = getContextPoint(x, y, block.i, block.j);
							
							renderLine(pt0, pt1, block.context);
							if (block_last && block !== block_last) {
								pt0 = getContextPoint(cur_x, cur_y, block_last.i, block_last.j);
								pt1 = getContextPoint(x, y, block_last.i, block_last.j);
								renderLine(pt0, pt1, block_last.context);
							}
							
							cur_x = x;
							cur_y = y;
							block_last = block;
						}
						buffer_pos++;
					}
					
					if (buffer_pos >= buffer.length) {
						rendering = false;
					} else {
						window.setTimeout(render, RENDER_INTERVAL);
					}
				};
				
				render();
			};
			
			/**
			 * Frees the portion of the buffer that has already been render.
			 */
			var freeBuffer = function() {
				buffer = buffer.substring(buffer_pos);
				buffer_pos = 0;
			};
		
			/**
			 * Queues data to be rendered. 
			 * @param {string} data - Raw data to be rendered.
			 */
			var render = function(data) {
				buffer += data;
				if (!rendering) renderBuffer();
			};
			
			/**
			 * Public Interface
			 */
			return {
				render: render
			};
		})();
		
		// view
		// ------------------------------------------------------------------------
		
		$window.on('resize', function() {
			$bitalizer.css({
				left : Math.round($window.width() / 2),
				top  : Math.round($window.height() / 2)
			});
		}).trigger('resize');
		
		// start render
		// ------------------------------------------------------------------------
		
		var data = '';
		for (var i = 0; i < 1024 * 10; i++) {
			data += String.fromCharCode(Math.round(Math.random() * 256));
		}
		
		bitalizer.render(data); //document.body.innerHTML
	});
})(jQuery);