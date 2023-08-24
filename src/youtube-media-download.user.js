// ==UserScript==
// @name        youtube-media-download
// @description 2023.01.17.01
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getResourceURL
// @grant       unsafeWindow
// @run-at      document-end
// @match       *://www.youtube.com/watch*

// @require     https://cdn.jsdelivr.net/npm/gbk.js@0.3.0/dist/gbk2.min.js

// @resource    index ./youtube-media-download/index.js

// @resource    fetchManager ./lib/fetch-manager.js

// @resource    parseData ./youtube-media-download/parse-data.js

// @resource    indexHTML ./youtube-media-download/index.html
// @resource    indexCSS ./youtube-media-download/index.css
// ==/UserScript==



const spaceUserScript = unsafeWindow.spaceUserScript ?? (unsafeWindow.spaceUserScript = {});
spaceUserScript[GM_info.script.name] = { GM_addStyle, GM_getResourceText, GM_getResourceURL };

try {
	await import(GM_getResourceURL('index'));
}
catch(error) { globalThis.console.error(error); }
