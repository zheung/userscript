// ==UserScript==
// @name         Fuck ESBR Twitch Drops
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fuck ESBR Twitch Drops
// @author       You
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

if(location.pathname == '/drops/inventory') {
	console.log('自动刷宝: 领取模式');

	// 4分钟后刷新
	setTimeout(() => location.reload(), 1000 * 60 * 4);

	// 15秒领取一次
	setInterval(() => document.querySelectorAll('.hZEZfD').forEach(btn => btn.click()), 1000 * 15);
}
else if(location.pathname.startsWith('/directory/game')) {
	console.log('自动刷宝: 选台模式', `\n上次选择: ${localStorage.idFuck}, ${localStorage.urlFuck}`);

	// 10秒后选台
	setTimeout(() => {
		const lists = document.querySelectorAll('.ihchdw>.tw-link');

		const idFuck = ~~localStorage.idFuck;
		localStorage.idFuck = lists.length - 1 >= idFuck ? 0 : idFuck + 1;

		const href = document.querySelectorAll('.ihchdw>.tw-link')[idFuck].href;
		localStorage.urlFuck = href;

		location = href;
	}, 1000 * 10);
}
else {
	console.log('自动刷宝: 播放模式');

	// 30秒检查一次是否播放器错误，是则马上刷新
	setInterval(() => {
		document.querySelector('[data-a-target="player-play-pause-button"]').dataset.aPlayerState == 'playing';
	});


	// 30秒检查一次是否播放器错误，是则马上刷新
	const iError = setInterval(() => document.querySelectorAll('.hreeIo').forEach(() => {
		window.open(window.location.href);
		clearInterval(iError);
		console.log('自动刷新: 播放器报错停止');
	}), 1000 * 30);

	// 30秒检查一次是否直播时间，如果没有进入转频道流程
	setInterval(() => (
		!document.querySelectorAll('.live-time').length ?
			(location = 'https://www.twitch.tv/directory/game/Eternal%20Return%3A%20Black%20Survival?tl=c2542d6d-cd10-4532-919b-3d19f30a768b') :
			void 0
	), 1000 * 30);
}