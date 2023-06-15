import js from '@eslint/js';
import globals from 'globals';



const rulesBase = {
	...js.configs.recommended.rules,

	indent: [1, 'tab', { ignoreComments: true, SwitchCase: 1 }],
	linebreakStyle: [1],
	quotes: [1, 'single', { allowTemplateLiterals: true }],
	semi: [1],
	noUnusedVars: [1, { vars: 'all', args: 'none' }],
	noVar: [1],
	noConsole: [1],
	requireAtomicUpdates: [1, { allowProperties: true }],
};


/** @type {import('eslint').Linter.FlatConfig[]} */
const configs = [
	{ ignores: ['dist/**/*.js'] },
	{
		files: ['eslint.config.js'],
		languageOptions: { globals: globals.node },
		rules: rulesBase,
	},
	{
		files: ['**/*.js'],
		ignores: ['eslint.config.js'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.greasemonkey,
			},
		},
		rules: rulesBase,
	}
];



const convertKey = (raw, target) => {
	const key = raw.split(/(?=[A-Z])/).join('-').toLowerCase();

	if(key != raw) { target[key] = target[raw]; delete target[raw]; }
};
const convertKeys = config => (config.rules && Object.keys(config.rules).forEach(key => convertKey(key, config.rules)), config);

configs.forEach(config => convertKeys(config));



export default configs;
