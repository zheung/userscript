// ==UserScript==
// @name        bilibili-live-banned-danmaku-mark
// @description 2024.04.07.08
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       GM_addStyle
// @grant       unsafeWindow
// @match       *://live.bilibili.com/*
// @run-at      document-start
// @noframes
// ==/UserScript==



import { hookFetch } from './lib/hook-http-response.js';



GM_addStyle(`
	.banned-danmaku {
		text-decoration: line-through;
		color: #F87171;
	}
`);


hookFetch(
	url => url.includes('//api.live.bilibili.com/msg/send'),
	async response => {
		const result = await response.json();

		const banned = result.msg == 'f';
		if(!banned) { return; }


		const extra = JSON.parse(result.data.mode_info.extra);


		const eItemsDanmaku = document.querySelector('#chat-items');
		if(eItemsDanmaku) {
			const observer = new MutationObserver(mutations => {
				mutations: for(const mutation of mutations) {
					/** @type {(Node & HTMLElement)[]} */
					const nodes = [...mutation.addedNodes];
					for(const node of nodes) {
						if(node?.dataset?.danmaku == extra.content) {
							const eItemDanmaku = node?.querySelector('.danmaku-item-right');

							eItemDanmaku.classList.add('banned-danmaku');

							observer.disconnect();

							break mutations;
						}
					}
				}
			});

			observer.observe(eItemsDanmaku, { childList: true, subtree: true });

			setTimeout(() => {
				try { observer.disconnect(); }
				catch(error) { void 0; }
			}, 1000 * 30);
		}
	}
);
