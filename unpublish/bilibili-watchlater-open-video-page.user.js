// ==UserScript==
// @name        bilibili-watchlater-open-video-page
// @description as the title
// @namespace   https://danor.app/
// @version     1.0.0-2023.01.17.01
// @author      Nuogz
// @grant       none
// @grant       GM_addStyle
// @match       *://www.bilibili.com/watchlater/*
// ==/UserScript==



const namePackage = GM_info.script.name;


const G = {
	log(...params) { console.log(`${namePackage}: `, ...params); },
	error(...params) { console.error(`${namePackage}: `, ...params); },
};


const observer = new MutationObserver(() => {
	try {
		[...document.querySelectorAll('.av-about>a.t:not(.t-d)')]
			.filter(link => link.nextElementSibling.tagName == 'DIV' && !link.hasAttribute(namePackage))
			.forEach(link => {
				const linkRaw = link.cloneNode(true);
				linkRaw.setAttribute(namePackage, '');
				linkRaw.innerHTML = '[打开视频页]';
				linkRaw.target = '_blank';
				linkRaw.style.fontSize = '12px';
				linkRaw.style.color = 'gray';
				linkRaw.style.fontWeight = 'normal';


				const url = new URL(linkRaw.href);
				const bv = url.pathname.split('/').pop();

				url.pathname = `video/${bv}`;
				linkRaw.href = url.toString();


				link.parentNode.insertBefore(linkRaw, link.nextElementSibling);
			});
	}
	catch(error) { G.error('✖', error.message, error.stack); }
});
observer.observe(document.body, { childList: true, subtree: true });
