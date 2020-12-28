<<<<<<< HEAD
// ==UserScript==
// @name         Twitter Thumbnail-InNewWindow Auto Larger
// @description  推特-缩略图-在新窗口打开时-自动跳转大图
// @version      1.0.1904301
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://pbs.twimg.com/media/*
// ==/UserScript==

if(/name=/.test(location.href)) {
	if(!/name=large/.test(location.href)) {
		location.href = location.href.replace(/name=\w+/, 'name=large');
	}
}
else if(!/:large$/.test(location.href)) {
	location.href += ':large';
=======
// ==UserScript==
// @name         Twitter Thumbnail-InNewWindow Auto Larger
// @description  推特-缩略图-在新窗口打开时-自动跳转大图
// @version      2.1.19052702
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://pbs.twimg.com/media/*
// ==/UserScript==

if(/name=/.test(location.href)) {
	if(!/name=orig/.test(location.href)) {
		location.href = location.href.replace(/name=\w+/, 'name=orig');
	}
}
else if(!/:orig$/.test(location.href)) {
	if(/:\w+$/.test(location.href)) {
		location.href = location.href.replace(/:\w+$/, ':orig');
	}
	else {
		location.href += ':orig';
	}
>>>>>>> 41ed5231b87cb0e767983856caac4eb5f89a1e04
}