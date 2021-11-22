// ==UserScript==
// @name         Dmhy.org(动漫花园) New-Animation-Index All Shower
// @description  Dmhy.org-动漫花园-新番资源索引-全部显示
// @version      1.0.17012101
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://share.dmhy.org/*
// ==/UserScript==

(function() {
	document.querySelector('.jmd').style.display = 'none';

	const jmd_base = document.querySelector('.jmd_base');

	jmd_base.removeAttribute('style');
	jmd_base.className += ' jmd';

	const tr = jmd_base.querySelectorAll('tbody>tr');

	tr[new Date().getDay()].className += 'today ';

	for(let i = 0; i < tr.length; i++)
		tr[i].className += (i % 2 == 1 ? 'even' : 'odd');
})();