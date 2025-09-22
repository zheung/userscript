// ==UserScript==
// @name        bilibili-watchlater-open-video-page
// @version     1.2.0+25092115
// @description 【哔哩哔哩-稍后再看】直接打开视频页
// @author      DanoR
// @namespace   https://danor.app
// @grant       GM_xmlhttpRequest
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
			linkVideo.style.display = 'inline-block';
			linkVideo.style.fontSize = '20px';
			linkVideo.style.color = 'var(--text1)';
			linkVideo.style.lineHeight = '1.5';

			linkVideo.href = `https://www.bilibili.com/video/${bv}`;

			link.setAttribute(namePackage, '');


			const linkHelper = document.createElement('a');

			linkHelper.setAttribute(namePackage, '');
			linkHelper.innerHTML = '用档案1打开';
			linkHelper.target = '_blank';
			linkHelper.style.display = 'inline-block';
			linkHelper.style.fontSize = '20px';
			linkHelper.style.color = 'var(--text1)';
			linkHelper.style.lineHeight = '1.5';
			linkHelper.style.paddingLeft = '10px';


			linkHelper.href = `http://chrome-cross-profile-open-link.tool.localhost/open?profile=${encodeURIComponent('Profile 1')}&url=${encodeURIComponent(`https://www.bilibili.com/video/${bv}`)}`;
			linkHelper.addEventListener('click', e => (
				e.preventDefault(),
				GM_xmlhttpRequest({ method: 'GET', url: linkHelper.href })
			));

			link.setAttribute(namePackage, '');


			const elWrap = document.createElement('div');
			elWrap.appendChild(linkVideo);
			elWrap.appendChild(linkHelper);

			link.parentNode.appendChild(elWrap);
		}
	}
	catch(error) { G.error('✖', error.message, error.stack); }
});
observer.observe(document.body, { childList: true, subtree: true });
