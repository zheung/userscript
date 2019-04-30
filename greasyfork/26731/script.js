// ==UserScript==
// @name         Twitter Thumbnail-InNewWindow Auto Larger
// @description  推特-缩略图-在新窗口打开时-自动跳转大图
// @version      1.0.19050101
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
}