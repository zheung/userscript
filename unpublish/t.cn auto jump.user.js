// ==UserScript==
// @name      t.cn Auto Redirect
// @namespace https://danor.app/
// @version   0.1.0-20210101
// @author    Nuogz
// @grant     none
// @match     *://t.cn/*
// ==/UserScript==

const i = setInterval(() => {
	try {
		const link = document.querySelector('.link').innerHTML;

		if(link) {
			location.href = link;

			clearInterval(i);
		}
	}
	catch(error) { void 0; }
}, 14);