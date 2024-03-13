const plugin = require('tailwindcss/plugin');



/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.sass'],
	theme: {
		extend: {
			boxShadow: {
				mdd: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
			},
		},
		trans: {
			DEFAULT: '0.2s',
			'04': '0.4s',
			'07': '0.7s',
			2: '2s',
		},
	},
	plugins: [
		plugin(({ addUtilities, matchUtilities, theme }) => {
			addUtilities({
				// inblock = inline-block + top vertical align
				'.inblock': {
					display: 'inline-block',
					verticalAlign: 'top',
				},

				// text ellipsis
				'.elli': {
					overflow: 'hidden',
					whiteSpace: 'nowrap',
					textOverflow: 'ellipsis',
				},
			});

			// animation
			matchUtilities({
				trans: duration => ({
					transitionProperty: 'all',
					transitionDuration: duration,
					transform: 'translateZ(0)',
				}),
			},
				{ values: theme('trans') }
			);

			// line height with border
			matchUtilities({
				'lead-b1': size => ({ 'line-height': `calc(${size} - 1px * 2)` }),
				'lead-b2': size => ({ 'line-height': `calc(${size} - 2px * 2)` }),
				'lead-b4': size => ({ 'line-height': `calc(${size} - 4px * 2)` }),
			},
				{ values: theme('lineHeight') }
			);
		}),
	],
};
