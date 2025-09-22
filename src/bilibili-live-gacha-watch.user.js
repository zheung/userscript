// ==UserScript==
// @name        bilibili-live-gacha-watch
// @description 【哔哩哔哩】直播天选/上舰红包监控提醒
// @namespace   https://danor.app
// @version     2.0.2+25090520
// @author      DanoR
// @grant       GM_getResourceURL
// @resource    tianxuan.wav file:///D:/project/userscript/src/bilibili-live-gacha-watch/tianxuan.wav
// @resource    jianbao.wav file:///D:/project/userscript/src/bilibili-live-gacha-watch/jianbao.wav
// @resource    tianxuan-opened.wav file:///D:/project/userscript/src/bilibili-live-gacha-watch/tianxuan-opened.wav
// @resource    jianbao-opened.wav file:///D:/project/userscript/src/bilibili-live-gacha-watch/jianbao-opened.wav
// @match       *://live.bilibili.com/*
// ==/UserScript==

import { G } from './lib/logger.js';



const playAlert = (name, typeMine) => {
	const audio = new Audio(GM_getResourceURL(name).replace(/^data:application;/, `data:${typeMine};`));
	audio.volume = 0.5;

	return audio.play();
};


const config$type = {
	tianxuan: {
		elLast: null,
		openedLast: false,
		textOpen: '已开奖',
		textAlert: '【天选】',
		audioFound: { name: 'tianxuan.wav', typeMine: 'audio/wav' },
		audioOpened: { name: 'tianxuan-opened.wav', typeMine: 'audio/wav' },
	},
	jianbao: {
		elLast: null,
		openedLast: false,
		textOpen: '已开奖',
		textAlert: '【舰包】',
		audioFound: { name: 'jianbao.wav', typeMine: 'audio/wav' },
		audioOpened: { name: 'jianbao-opened.wav', typeMine: 'audio/wav' },
	},
};


const documentTop = window.top.document;

/**
 * @param {string} type
 * @param {string|Function} selector
 */
const checkGacha = (type, selector) => {
	const el = typeof selector == 'function' ? selector(type, document) : document.querySelector(selector);

	const config = config$type[type];
	const { elLast, openedLast, textOpen, textAlert, audioFound, audioOpened } = config;

	const titleTop = documentTop.title;

	// 有抽奖
	if(el) {
		const opened = el.innerText.includes(textOpen);

		// 抽奖未开奖
		if(!opened) {
			// 上次无抽奖 或 上次元素不同 ==> 通知
			if(
				!elLast ||
				elLast !== el
			) {
				playAlert(audioFound.name, audioFound.typeMine);

				G.info(`发现新${textAlert}！`);
			}


			// 来回切换网页标题提示
			documentTop.title = titleTop.includes(textAlert) ? titleTop.replace(textAlert, '') : `${textAlert}${titleTop}`;
		}
		// 抽奖已开奖
		else {
			// 上次无抽奖 或 上次未开奖 或 上次元素不同 ==> 通知
			if(
				!elLast ||
				!openedLast ||
				elLast !== el
			) {
				playAlert(audioOpened.name, audioOpened.typeMine);

				G.info(`${textAlert}开奖啦！`);
			}
		}

		config.openedLast = opened;
	}
	// 无抽奖 ==> 清理
	else {
		documentTop.title = titleTop.replace(textAlert, '');

		config.openedLast = false;
	}

	config.elLast = el;
};



setInterval(() => {
	checkGacha('tianxuan', '.anchor-lottery-entry');
	checkGacha('jianbao', '.popularity-red-envelope-entry:has(.entry-icon[style*=guard-icon])');
}, 2000);
