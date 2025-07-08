import { defineConfig, presetWind3 as getPresetWind3 } from 'unocss';



const presetWind3 = getPresetWind3();
export default defineConfig({
	content: ['./src/**/*.{vue,sass}'],
	shortcuts: {
		inblock: 'inline-block align-top',
		elli: 'overflow-hidden whitespace-nowrap text-ellipsis',
	},
	presets: [presetWind3],
	rules: [
		[/^shadow-d(\d)(?:-(.+))?$/, ([match, alphaAdd_, styleShadow], context) => {
			const [, rulerBoxShadow] = presetWind3.rules.find(([r]) => r.toString().includes('^shadow(?:-(.+))?$'));
			const alphaAdd = Number(alphaAdd_) / 10 || 0;

			const boxShadowThemeNew = {};

			for(const [type, styles] of Object.entries(context.theme.boxShadow)) {
				if(typeof styles == 'string') {
					boxShadowThemeNew[type] = styles.replace(/rgb\(0 0 0 \/ (0\.\d+)\)/, (_, alpha) => `rgb(0 0 0 / ${(Number(alpha) + alphaAdd).toFixed(2)})`);
				}
				else if(styles instanceof Array) {
					boxShadowThemeNew[type] = styles.map(style => style.replace(/rgb\(0 0 0 \/ (0\.\d+)\)/, (_, alpha) => `rgb(0 0 0 / ${(Number(alpha) + alphaAdd).toFixed(2)})`));
				}
			}

			return rulerBoxShadow([match, styleShadow], Object.assign({}, context, {
				theme: Object.assign({}, context.theme, { boxShadow: boxShadowThemeNew })
			}));
		}, { autocomplete: ['shadow-d<num>-$colors', 'shadow-d<num>-$boxShadow'] }],
		[/^lead-b(\d)-(\d+)$/, ([match, widthBorder, heightLine], context) => {
			const [, ruleLineHeight] = presetWind3.rules.find(([r]) => r.toString().includes('^(?:font-)?(?:leading|lh|line-height)-(.+)$'));

			const styleLineHeight = ruleLineHeight([match, heightLine], context);

			styleLineHeight['line-height'] = `calc(${styleLineHeight['line-height']} - ${widthBorder}px * 2)`;

			return styleLineHeight;
		}, { autocomplete: 'lead-b<num>-<num>' }],
		[/^trans(?:-(0)?(\d+))?$/, ([match, zero, duration]) => {
			return {
				transitionProperty: 'all',
				transitionDuration: duration ? `${zero == '0' ? (Number(duration) / 10).toFixed(2) : Number(duration)}s` : '0.2s',
				transform: 'translateZ(0)',
			};
		}, { autocomplete: ['trans', 'trans-0<num>', 'trans-<num>'] }],
	]
});
