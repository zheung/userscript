// ==UserScript==
// @name        gm-xhr-expose
// @description 2023.06.19.01
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @match       *://*/*
// ==/UserScript==



if(unsafeWindow && GM_xmlhttpRequest) {
	unsafeWindow.XMLHttpRequestGM = GM_xmlhttpRequest;
}
