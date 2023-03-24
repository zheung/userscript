/* global module */

const rcBrowser = {
	root: true,
	env: { es2022: true, browser: true, greasemonkey: true },
	extends: ['eslint:recommended'],
	parserOptions: { sourceType: 'script' },
	rules: {
		indent: [2, 'tab', { ignoreComments: true, SwitchCase: 1 }],
		linebreakStyle: [2],
		quotes: [2, 'single', { allowTemplateLiterals: true }],
		semi: [2],
		noUnusedVars: [2, { vars: 'all', args: 'none' }],
		noVar: [2],
		noConsole: [0],
		requireAtomicUpdates: [1, { allowProperties: true }],
	},
	overrides: []
};


const parseKey = (raw, target) => { const key = raw.split(/(?=[A-Z])/).join('-').toLowerCase(); if(key != raw) { target[key] = target[raw]; delete target[raw]; } };
Object.keys(rcBrowser.rules).forEach(key => parseKey(key, rcBrowser.rules));


module.exports = rcBrowser;
