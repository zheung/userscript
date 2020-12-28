// ==UserScript==
// @name         SauceNAO Moder
// @description  Easy to Use SauceNAO
// @version      1.0.1702056
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://saucenao.com/*
// ==/UserScript==

(function() {
	var qsa = function(selector) {
		var result = [], arr = document.querySelectorAll(selector), i;

		for(i=0; i<arr.length; i++) result.push(arr[i]);
		return result;
	};

	setTimeout(function() {
		window.togglenao();

		var as = qsa('div.resultcontentcolumn>a'), i, a;

		for(i in as) {
			a = as[i];

			a.target = '_blank';

			if(a.innerHTML.indexOf('hentai-foundry')+1) {
				var r = a.href.match(/com\/\w\/(.*?\/\d+?)\//);

				if(r)
					a.href = 'http://www.hentai-foundry.com/pictures/user/' + r[1];

				a.innerHTML = 'hentai-foundry.com';
			}
		}
	}, 2014);
})();