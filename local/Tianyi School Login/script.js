// ==UserScript==
// @name 校园天翼(广东校园网)自动登录
// @namespace  http://weibo.com/zheung
// @version    0.2.1505081444
// @description  我不厉害,只是写这登录网页的人是傻逼
// @include http://*wlanuserip=*
// @grant none
// @copyright  DanoR
// ==/UserScript==

function gogo() {
	var ifdoc = window.frames[1].document;

	ifdoc.querySelector('input#rand').value = ifdoc.querySelector('input#confirmrand').value;
	ifdoc.querySelector('input#userName1').value = '15360791275';
	ifdoc.querySelector('input#password1').value = '123456';

	ifdoc.querySelector('form#login1').submit();
}

setTimeout(gogo, 1400);