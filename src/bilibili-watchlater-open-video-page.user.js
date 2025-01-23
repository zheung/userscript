// ==UserScript==
// @name        bilibili-watchlater-open-video-page
// @description 2025.01.23.23
// @namespace   https://danor.app/
// @version     1.1.0
// @author      DanoR
// @grant       none
// @match       *://www.bilibili.com/watchlater/*
// ==/UserScript==

import { querySelectorAll } from './lib/util.js';
import { G } from './lib/logger.js';



const namePackage = GM_info.script.name;




const observer = new MutationObserver(() => {
	try {
		const links = [...querySelectorAll('div.video-card>div.video-card__right>a')]
			.filter(link => !link.hasAttribute(namePackage));

		for(const link of links) {
			const urlWatchlater = new URL(link.href);
			const bv = urlWatchlater.searchParams.get('bvid');


			const linkVideo = document.createElement('a');

			linkVideo.setAttribute(namePackage, '');
			linkVideo.innerHTML = '打开视频页';
			linkVideo.target = '_blank';
			linkVideo.style.fontSize = '14px';
			linkVideo.style.color = 'var(--text3)';

			linkVideo.href = `https://www.bilibili.com/video/${bv}`;


			link.setAttribute(namePackage, '');
			link.parentNode.appendChild(linkVideo);
		}
	}
	catch(error) { G.error('✖', error.message, error.stack); }
});
observer.observe(document.body, { childList: true, subtree: true });
