// ==UserScript==
// @name        lol-universe-quick-jump
// @description 2024.09.26 09
// @namespace   https://danor.app/
// @version     2.0.0
// @author      DanoR
// @grant       GM_addStyle
// @match      *://yz.lol.qq.com/*
// @match      *://universe.leagueoflegends.com/*
// ==/UserScript==

import templatePanel from './lol-universe-quick-jump/panel.html';
import cssPanel from './lol-universe-quick-jump/panel.sass';
GM_addStyle(cssPanel);



const elBox = document.createElement(`danor-${GM_info.script.name}`);
document.body.appendChild(elBox);
elBox.innerHTML = templatePanel;

const elPanel = elBox.querySelector('p-quick-jump');



/** @type {HTMLAnchorElement} */
const elPageZHCN = elPanel.querySelector('a[page][zh-cn]');
elPageZHCN.addEventListener('mouseenter', () => {
	const url = new URL(window.location.href);

	url.host = 'yz.lol.qq.com';

	const segements = url.pathname.replace(/^\/|\/$/g, '').split('/');
	segements[0] = 'zh_cn';
	url.pathname = segements.join('/');


	elPageZHCN.href = url.toString();
});


/** @type {HTMLAnchorElement} */
const elPageENUS = elPanel.querySelector('a[page][en-us]');
elPageENUS.addEventListener('mouseenter', () => {
	const url = new URL(window.location.href);

	url.host = 'universe.leagueoflegends.com';

	const segements = url.pathname.replace(/^\/|\/$/g, '').split('/');
	segements[0] = 'en_us';
	url.pathname = segements.join('/');


	elPageENUS.href = url.toString();
});


/** @type {HTMLAnchorElement} */
const elPageZHTW = elPanel.querySelector('a[page][zh-tw]');
elPageZHTW.addEventListener('mouseenter', () => {
	const url = new URL(window.location.href);

	url.host = 'universe.leagueoflegends.com';

	const segements = url.pathname.replace(/^\/|\/$/g, '').split('/');
	segements[0] = 'zh_tw';
	url.pathname = segements.join('/');


	elPageZHTW.href = url.toString();
});



/** @type {HTMLAnchorElement} */
const elDataZHCN = elPanel.querySelector('a[data][zh-cn]');
elDataZHCN.addEventListener('mouseenter', () => {
	const url = new URL(window.location.href);

	url.host = 'universe-meeps.leagueoflegends.com';

	let segements = url.pathname.replace(/^\/|\/$/g, '').split('/');
	if(segements.includes('champion')) {
		segements = ['v1', 'zh_cn', 'champions', segements.pop(), 'index.json'];
	}
	else {
		segements = ['v1', 'zh_cn', 'story', segements.pop(), 'index.json'];
	}


	url.pathname = segements.join('/');


	elDataZHCN.href = url.toString();
});


/** @type {HTMLAnchorElement} */
const elDataENUS = elPanel.querySelector('a[data][en-us]');
elDataENUS.addEventListener('mouseenter', () => {
	const url = new URL(window.location.href);

	url.host = 'universe-meeps.leagueoflegends.com';

	let segements = url.pathname.replace(/^\/|\/$/g, '').split('/');
	if(segements.includes('champion')) {
		segements = ['v1', 'en_us', 'champions', segements.pop(), 'index.json'];
	}
	else {
		segements = ['v1', 'en_us', 'story', segements.pop(), 'index.json'];
	}


	url.pathname = segements.join('/');


	elDataENUS.href = url.toString();
});
