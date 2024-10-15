// ==UserScript==
// @name         LOL Universe Quick Jumper
// @description  LOL Universe quick jump betweem english, sim-chinese and trad-chinese
// @version      1.2.19011701
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://yz.lol.qq.com/*
// @include      *://universe.leagueoflegends.com/*
// @require     https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// ==/UserScript==

var run = function($) {
	console.log('Quick Jumper');

	$('#Qcump').remove();

	var big = $('<div id="Qcump">').prependTo('body')
		.css({
			'position': 'fixed',
			'top': '64px',
			'left': '-2px',
			'display': 'block',
			'width': '50px',
			'height': '104px',
			'background': '#121212',
			'border': '2px solid #c9aa71',
			'border-radius': '4px',
			'z-index': '3000001'
		});

	var cssSamll = {
		'display': 'block',
		'width': '100%',
		'height': '20px',
		'line-height': '20px',
		'font-size': '14px',
		'text-align': 'center',
		'color': '#c9aa71',
		'cursor': 'pointer'
	};

	$('<a>简</a>').attr('target', '_blank').appendTo(big).css(cssSamll)
		.hover(function() {
			$(this)
				.css('background', '#5a4d34')
				.attr('href', window.location.href.replace(/^.*?com\/\w\w_\w\w\//, 'https://yz.lol.qq.com/zh_cn/'));
		}, function() { $(this).css('background', '#121212'); });

	$('<a>英</a>').attr('target', '_blank').appendTo(big).css(cssSamll)
		.hover(function() {
			$(this)
				.css('background', '#5a4d34')
				.attr('href', window.location.href.replace(/^.*?com\/\w\w_\w\w\//, 'https://universe.leagueoflegends.com/en_us/'));
		}, function() { $(this).css('background', '#121212'); });

	$('<a>繁</a>').attr('target', '_blank').appendTo(big).css(cssSamll)
		.hover(function() {
			$(this)
				.css('background', '#5a4d34')
				.attr('href', window.location.href.replace(/^.*?com\/\w\w_\w\w\//, 'https://universe.leagueoflegends.com/zh_tw/'));
		}, function() { $(this).css('background', '#121212'); });

	$('<a>中</a>').attr('target', '_blank').appendTo(big).css(cssSamll)
		.hover(function() {
			$(this)
				.css('background', '#5a4d34')
				.attr('href', window.location.href.replace(/^(.*?com)\/\w\w_\w\w\//, 'https://universe-meeps.leagueoflegends.com/v1/zh_cn/').replace('/champion/', '/champions/') + 'index.json');
		}, function() { $(this).css('background', '#121212'); });

	$('<a>英</a>').attr('target', '_blank').appendTo(big).css(cssSamll)
		.hover(function() {
			$(this)
				.css('background', '#5a4d34')
				.attr('href', window.location.href.replace(/^(.*?com)\/\w\w_\w\w\//, 'https://universe-meeps.leagueoflegends.com/v1/en_us/').replace('/champion/', '/champions/') + 'index.json');
		}, function() { $(this).css('background', '#121212'); });
};

var it = setInterval(function() {
	var $ = window.$;

	if($) {
		clearInterval(it);
		run($);
	}
}, 1400);
