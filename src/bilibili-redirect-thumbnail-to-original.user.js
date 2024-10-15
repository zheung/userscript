// ==UserScript==
// @name        bilibili-redirect-thumbnail-to-original
// @description 2024.10.15 21
// @namespace   https://danor.app/
// @version     1.1.1
// @author      DanoR
// @grant       none
// @match       *://*.hdslb.com/bfs/*/*
// ==/UserScript==



if(location.hostname.split('.').slice(-3, -2)[0].startsWith('i')
	&& /@.*\.(png|jpg|avif|webp)$/.test(location.pathname)
) {
	const url = new URL(location);

	url.pathname = url.pathname.replace(/@.*\.(png|jpg|avif|webp)$/, '');

	location = url;
}
