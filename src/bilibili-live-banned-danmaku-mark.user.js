// ==UserScript==
// @name        bilibili-live-banned-danmaku-mark
// @description 2026.01.29.00
// @namespace   https://danor.app/
// @version     1.1.0
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


		const elItemsDanmaku = document.querySelector('#chat-items');
		if(elItemsDanmaku) {
			/** @type {(Node & HTMLElement)[]} */
			const elsDanmaku = [...elItemsDanmaku.querySelectorAll('.chat-item')];
			for(const el of elsDanmaku) {
				if(el?.dataset?.danmaku == extra.content) {
					const eItemDanmaku = el?.querySelector('.danmaku-item-right');

					eItemDanmaku.classList.add('banned-danmaku');

					return;
				}
			}



			const observer = new MutationObserver(mutations => {
				mutations: for(const mutation of mutations) {
					/** @type {(Node & HTMLElement)[]} */
					const els = [...mutation.addedNodes];
					for(const el of els) {
						if(el?.dataset?.danmaku == extra.content) {
							const eItemDanmaku = el?.querySelector('.danmaku-item-right');

							eItemDanmaku.classList.add('banned-danmaku');

							observer.disconnect();

							break mutations;
						}
					}
				}
			});

			observer.observe(elItemsDanmaku, { childList: true, subtree: true });

			setTimeout(() => {
				try { observer.disconnect(); }
				catch { void 0; }
			}, 1000 * 30);
		}
	}
);
