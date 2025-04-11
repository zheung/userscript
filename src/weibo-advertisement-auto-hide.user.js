// ==UserScript==
// @name        weibo-advertisement-auto-hide
// @description 2025.04.11 09
// @namespace   https://danor.app
// @version     2.1.0
// @author      DanoR
// @grant       none
// @match       *://weibo.com/*
// @noframes
// ==/UserScript==

import { Logger } from './lib/logger.js';



const G = new Logger(GM_info.script.name);


let countHidden = 0;
new MutationObserver(() => {
	try {
		for(const elMore of document.querySelectorAll('.morepop_cross_1Q1PF')) {
			elMore.click();

			for(const elButton of elMore.parentNode?.parentNode?.parentNode
				?.querySelectorAll('.woo-box-flex.woo-box-alignCenter.woo-pop-item-main') ?? []) {
				if(elButton.innerHTML.includes('不感兴趣') && elButton.getAttribute(GM_info.script.name) != 'clicked') {
					elButton.setAttribute(GM_info.script.name, 'clicked');
					elButton.click();

					const elBody = elMore.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode;
					const link = elBody?.querySelector('.head-info_time_6sFQg')?.href ?? '';
					const textHidden = elBody?.querySelector('.detail_wbtext_4CRf9')?.innerText ?? '';

					G.info('✔ click to hide', ++countHidden, '\n', link, '\n', textHidden);
				}
			}
		}
	}
	catch(error) { G.error('✖', error.message, '\n' + error.stack); }
})
	.observe(document.body, { childList: true, subtree: true });

G.info('✔ running');
