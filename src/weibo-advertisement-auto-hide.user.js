// ==UserScript==
// @name        weibo-advertisement-hide
// @description 2023.07.31 18
// @namespace   https://danor.app/
// @version     2.0.0
// @author      DanoR
// @grant       none
// @match       *://weibo.com/*
// ==/UserScript==


new MutationObserver(() => {
	try {
		document.querySelectorAll('.morepop_cross_1Q1PF').forEach(more => {
			more.click();

			more.parentNode?.parentNode?.parentNode
				?.querySelectorAll('.woo-box-flex.woo-box-alignCenter.woo-pop-item-main')?.[0]?.click();
		});
	}
	catch(error) { globalThis.console.error('weibo-advertisement-hide', '✖', error.message, '\n' + error.stack); }
})
	.observe(document.body, { childList: true, subtree: true });
