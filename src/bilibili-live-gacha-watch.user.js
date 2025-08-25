// ==UserScript==
// @name        bilibili-live-gacha-watch
// @description 2025.08.24 19
// @namespace   https://danor.app/
// @version     1.3.0
// @author      DanoR
// @grant       GM_getResourceURL
// @resource    tianxuan.wav file:///D:/desk/@v/voice/tianxuan.wav
// @resource    tianxuan-kaijiang.mp3 file:///D:/desk/@v/voice/tianxuan-kaijiang.mp3
// @resource    jianbao.wav file:///D:/desk/@v/voice/jianbao-maimai.wav
// @match       *://live.bilibili.com/*
// ==/UserScript==

import { G } from './lib/logger.js';



let hasTianxuanLast = false;
let domTianxuanLast = null;

let hasJianbaoLast = false;
let domJianbaoLast = null;

const prefixAlertTianxuan = '【天选】';
const prefixAlertJianbao = '【舰包】';
setInterval(() => {
	const documentTop = window.top.document;
	const titleTop = documentTop.title;


	let domTianxuan = document.querySelector('.anchor-lottery-entry');

	if(domTianxuan?.innerText.includes('已开奖')) {
		if(domTianxuanLast) {
			domTianxuanLast = null;

			G.info(`${prefixAlertTianxuan}已开奖啦`);

			new Audio(GM_getResourceURL('tianxuan-kaijiang.mp3').replace(/^data:application;/, 'data:audio/wav;')).play();
		}

		domTianxuan = null;
	}

	if(domTianxuan) {
		if(!hasTianxuanLast || domTianxuanLast !== domTianxuan) {
			new Audio(GM_getResourceURL('tianxuan.wav').replace(/^data:application;/, 'data:audio/wav;')).play();

			G.info(`发现有一个${prefixAlertTianxuan}`);
		}


		domTianxuanLast = domTianxuan;
		hasTianxuanLast = true;


		if(titleTop.includes(prefixAlertTianxuan)) {
			documentTop.title = titleTop.replace(prefixAlertTianxuan, '');
		}
		else {
			documentTop.title = prefixAlertTianxuan + titleTop;
		}
	}
	else if(hasTianxuanLast) {
		hasTianxuanLast = false;

		documentTop.title = titleTop.replace(prefixAlertTianxuan, '');
	}


	const domJianbao = document.querySelector('.popularity-red-envelope-entry:has(.entry-icon[style*=guard-icon])');
	if(domJianbao || domJianbaoLast !== domJianbao) {
		if(!hasJianbaoLast) {
			new Audio(GM_getResourceURL('jianbao.wav').replace(/^data:application;/, 'data:audio/wav;')).play();

			G.info(`发现有一个${prefixAlertJianbao}`);
		}


		domJianbaoLast = domJianbao;
		hasJianbaoLast = true;


		if(titleTop.includes(prefixAlertJianbao)) {
			documentTop.title = titleTop.replace(prefixAlertJianbao, '');
		}
		else {
			documentTop.title = prefixAlertJianbao + titleTop;
		}
	}
	else if(hasJianbaoLast) {
		hasJianbaoLast = false;

		documentTop.title = titleTop.replace(prefixAlertJianbao, '');
	}
}, 2000);
