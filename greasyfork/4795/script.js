// ==UserScript==
// @name         Bilibili(哔哩哔哩) BangumiTwo Raw Hider
// @description  哔哩哔哩-番剧-连载动画-生肉-隐藏
// @version      1.0.17012101
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://www.bilibili.*/video/bangumi-two-*.html*
// ==/UserScript==

(function() {
	setInterval(function() {
		var list = document.querySelectorAll('.vd-list.l2>li'), i;

		for(i=0; i<list.length; i++)
			if(list[i].innerHTML.indexOf('生肉')+1)
				list[i].style.display = 'none';
	}, 2014);
})();