/** 批量打开视频连接 */

(async (count) => {
	const links = [...document.querySelectorAll('div.video-card>div.video-card__right>a')].slice(0, count);
	if(!links.length) { return; }

	localStorage.setItem('bilibili-media-fetch/auto-start', '1');

	let now = 1;
	for(const link of links) {
		const urlWatchlater = new URL(link.href);
		const bv = urlWatchlater.searchParams.get('bvid');

		window.open(`https://www.bilibili.com/video/${bv}`, '_blank');

		globalThis.console.log('auto-open', `${now++}/${links.length}`, bv, link.innerHTML.trim());

		document.title = `(${now-1}/${links.length}) ${document.title.replace(/^\(\d+\/\d+\) /, '')}`;

		await new Promise(resolve => setTimeout(resolve, 5000));
	}

	localStorage.removeItem('bilibili-media-fetch/auto-start');
})(5);
