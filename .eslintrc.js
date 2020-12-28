const rc = {
	env: {
		es2020: true,
		browser: true,
		greasemonkey: true
	},
	extends: [
		'eslint:recommended',
	],
	rules: {
		indent: [2, 'tab', { ignoreComments: true, SwitchCase: 1 }],
		linebreakStyle: [2, 'unix'],
		quotes: [2, 'single', { allowTemplateLiterals: true }],
		semi: [2, 'always'],
		noUnusedVars: [2, { vars: 'all', args: 'after-used' }],
		noConsole: [0],
		noVar: [2],
		quoteProps: [2, 'as-needed'],
		requireAtomicUpdates: [0],
	},
	globals: {}
};

for(const key in rc.rules) {
	const keyCamel = key.split(/(?=[A-Z])/).join('-').toLowerCase();
	if(keyCamel != key) {
		rc.rules[keyCamel] = rc.rules[key];

		delete rc.rules[key];
	}
}

// eslint-disable-next-line no-undef
module.exports = rc;