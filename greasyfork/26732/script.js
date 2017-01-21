// ==UserScript==
// @name         Xiami Music(虾米音乐) Homepage Auto Signer
// @description  虾米音乐-首页-自动签到
// @version      1.0.17012101
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://www.xiami.com/
// @include      *://www.xiami.com/?*
// ==/UserScript==

(function() {
	var itr = setInterval(function() {
		if(document.querySelector('b.icon.tosign.done'))
			clearInterval(itr);
		else
			document.querySelector('b.icon.tosign').click();
	}, 2014);
})();