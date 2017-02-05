// ==UserScript==
// @name         SauceNAO Moder
// @description  Advanced-options auto expand | Change link on hentai-foundry result from picutre to illust-page
// @version      1.0.1702052
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://saucenao.com/*
// ==/UserScript==

(function() {
	var qs = function(selector) { return document.querySelector(selector); },
		qsa = function(selector) {
			var result = [], arr = document.querySelectorAll(selector), i;

			for(i=0; i<arr.length; i++) result.push(arr[i]);
			return result;
		};

	setTimeout(function() {
		window.togglenao();

		var as = qsa('div.resultcontentcolumn>a'), i, a;

		for(i in as) {
			a = as[i];

			if(a.innerHTML.indexOf('hentai-foundry')+1) {
				a.href = 'http://www.hentai-foundry.com/pictures/user/' +
					a.href.match(/\/b\/(.*?\/\d+?)\//)[1];
			}
		}
	}, 2014);
})();