// ==UserScript==
// @name      Weibo 2020 Advertisement Hide
// @namespace https://danor.app/
// @version   1.2.1-2021.07.18.01
// @author    Nuogz
// @grant     none
// @include   *weibo.com/*
// ==/UserScript==

const L = (...args) => console.log(GM_info.script.name, GM_info.script.version, ...args);
const LE = (...args) => console.error(GM_info.script.name, GM_info.script.version, ...args);

const QS = (selector, el = document) => el.querySelector(selector);
const QA = (selector, el = document) => [...el.querySelectorAll(selector)];

const EP = (el, func) => {
	let now = el.parentNode;

	while(now) {
		func(now);

		now = now.parentNode;
	}
};

L();


const observer = new MutationObserver(() => {
	// 判断是否新版微博
	if(QS('[class*=woo-box]')) {
		try {
			QA('.vue-recycle-scroller__item-view').forEach(top => {
				top.style.filter = 'none';
				top.style.pointerEvents = '';
			});
			QA('.head-info_authtag_29zK2').forEach(ad => {
				let top;

				EP(ad, parent => {
					if(parent?.classList?.contains('vue-recycle-scroller__item-view')) {
						top = parent;
					}
				});

				top.style.filter = 'blur(20px)';
				top.style.pointerEvents = 'none';
			});
		}
		catch(error) {
			LE(error.message, error.stack);
		}
	}
	else {
		observer.disconnect();

		LE('非2020 新版微博，退出脚本');
	}
});

observer.observe(document.body, { childList: true, subtree: true });
