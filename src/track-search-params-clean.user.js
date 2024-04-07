// ==UserScript==
// @name        track-search-params-clean
// @description 2024.03.13.15
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @run-at      document-end
// @grant       none
// @match       *://*/*
// ==/UserScript==

import Logger from './lib/logger.js';



const G = new Logger(GM_info.script.name);


/** @param {string[]} keys */
const createCleaner = keys => {
	let timesRun = 0;
	const interval = setInterval(() => {
		if(timesRun > 20) { return clearInterval(interval); }


		const url = new URL(location);

		let hasKeyOnce = false;
		for(const key of keys) {
			if(!url.searchParams.has(key)) { continue; }

			hasKeyOnce = true;

			url.searchParams.delete(key);

			G.info(`key ${key}`, '✔ cleaned');
		}

		if(hasKeyOnce) { history.replaceState({ url: url.toString() }, '', url.toString()); }
	}, 5000);
};



if(location.hostname.includes('bilibili.com')) { createCleaner(['vd_source', 'spm_id_from']); }
if(location.hostname.includes('live.bilibili.com')) { createCleaner(['broadcast_type', 'live_from', 'visit_id']); }
