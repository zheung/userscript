// ==UserScript==
// @name         Tencent-Weibo(腾讯微博) Thumbnail-InNewWindow Auto Larger
// @description  腾讯微博-缩略图-在新窗口打开时-自动跳转大图
// @version      1.0.17012102
// @author       DanoR
// @namespace    https://danor.top/
// @grant        none
// @include      *://*.qpic.cn/*
// ==/UserScript==

var regex = /\d*$/, num = location.href.match(regex);

if (num && ~~num[0] < 2000) location.href = location.href.replace(regex, '2000');