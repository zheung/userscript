// ==UserScript==
// @name        bilibili-watchlater-export-html
// @version     1.1.0+26052901
// @description 【哔哩哔哩-稍后再看】导出数据为网页
// @author      DanoR
// @namespace   https://danor.app
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @match       *://www.bilibili.com/watchlater/*
// @updateURL   http://userscript.localhost/bilibili-watchlater-export-html.user.js
// ==/UserScript==

import { FetchManager } from './lib/fetch-manager.vue';
import { G } from './lib/logger.js';

import { faFileExport } from '@fortawesome/free-solid-svg-icons';



const FM = new FetchManager();

FM.$willStorageValue = true;

FM.$panels = [{
	id: 'functions',
	title: '导出',
	type: 'functions-collapseless',
	functions: [{
		id: 'export-html',
		text: '导出为网页',
		icon: faFileExport,
		async handle(states) {
			const count = document.querySelector('.watchlater-list-title__count').innerText.match(/\d+/)[0];
			if(!count) { return; }


			const response = await fetch(`https://api.bilibili.com/x/v2/history/toview/web?pn=1&ps=${count}`, {
				credentials: 'include',
			});


			let datas;
			try {
				datas = await response.json();
				datas = datas.data.list;
				if(!datas || !datas.length) {
					globalThis.console.debug(datas);

					throw new Error('数据异常');
				};
			}
			catch(error) {
				G.error('请求数据失败', error);

				return;
			}


			let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<title>哔哩哔哩稍后再看</title>
	<style>
		html {
			font-family: PingFang SC, HarmonyOS_Regular, Helvetica Neue, Microsoft YaHei, sans-serif !important;
			font-size: 32px;
			color: snow;
			background: #17181a;
		}
		body {
			margin: 0.5rem;
			display: grid;
			gap: 0.5rem;
			grid-template-columns: 100%;
		}
		.card {
			display: grid;
			grid-template-columns: 12rem 12rem 1fr;
			gap: 0.5rem;
		}
		.cover {
			display: inline-block;
			width: 100%;
			aspect-ratio: 16 / 9;
			object-fit: cover;
		}
		.info {
			display: inline-block;
			max-width: 50%;
			position: relative;
		}
		.title {
			width: 12rem;
			display: block;
			margin-bottom: 0.5rem;
			overflow: hidden;
			color: snow;
			white-space: nowrap;
			text-overflow: ellipsis;
			text-decoration: none;
		}
		.text {
			font-size: 0.75rem;
		}
		.opener {
			position: absolute;
			bottom: 0;
			color: snow;
			white-space: nowrap;
			text-decoration: none;
		}
	</style>
</head>
<body>`;

			for(const data of datas) {
				const { bvid, title, pic, first_frame, owner, stat: { view } } = data;

				html += `
<div class="card">
	<img class="cover" src="${pic}" title="${title}">
	<img class="cover" src="${first_frame}" title="${title}">
	<div class="info">
		<a class="title" href="https://www.bilibili.com/video/${bvid}" target="_blank" title="${title}">${title}</a>
		<div class="text"><a class="title" href="https://space.bilibili.com/${owner.mid}" target="_blank">${owner.name}</a></div>
		<div class="text">播放量 ${view}</div>
		<a class="opener"
			href="http://chrome-cross-profile-open-link.tool.localhost/open?profile=Profile%201&url=https%3A%2F%2Fwww.bilibili.com%2Fvideo%2F${bvid}"
			target="_blank"
			onclick="event.preventDefault();fetch(this.href);"
		>用档案1打开</a>
	</div>
</div>\n
`;
			}

			html += `</body></html>`;

			const blob = new Blob([html], { type: 'text/html' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.setAttribute('href', url);
			a.setAttribute('download', `bilibili-watchlater-${Date.now()}.html`);
			a.click();

			window.open(url, '_blank');
		}
	}]
}];



// 手动脚本
// (async (count) => {
// 	const links = [...document.querySelectorAll('div.video-card>div.video-card__right>a')].slice(0, count);
// 	if(!links.length) { return; }

// 	localStorage.setItem('bilibili-media-fetch/auto-start', '1');

// 	let now = 1;
// 	for(const link of links) {
// 		const urlWatchlater = new URL(link.href);
// 		const bv = urlWatchlater.searchParams.get('bvid');

// 		window.open(`https://www.bilibili.com/video/${bv}`, '_blank');

// 		globalThis.console.log('auto-open', `${now++}/${links.length}`, bv, link.innerHTML.trim());

// 		document.title = `(${now-1}/${links.length}) ${document.title.replace(/^\(\d+\/\d+\) /, '')}`;

// 		await new Promise(resolve => setTimeout(resolve, 5000));
// 	}

// 	localStorage.removeItem('bilibili-media-fetch/auto-start');
// })(5);
