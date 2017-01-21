// ==UserScript==
// @name         Weibo.com(新浪微博) Thumbnail-InNewWindow Auto Larger
// @description  新浪微博-缩略图-在新窗口打开时-自动跳转大图
// @version      1.0.17012101
// @author       DanoR
// @namespace    https://danor.top/
// @grant        none
// @include      http?://*.sinaimg.cn/*
// @include      /^https?://.*?\.sinaimg\.cn/.*$/
// ==/UserScript==

if (!/sinaimg\.cn\/large\//.test(location.href))
	location.href = location.href.replace(/sinaimg\.cn\/.*?\//, 'sinaimg.cn/large/');