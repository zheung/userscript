// ==UserScript==
// @name         Twitter Thumbnail-InNewWindow Auto Larger
// @description  推特-缩略图-在新窗口打开时-自动跳转大图
// @version      1.0.17012101
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://pbs.twimg.com/media/*
// ==/UserScript==

if (!/:large$/.test(location.href))
	location.href += ':large';