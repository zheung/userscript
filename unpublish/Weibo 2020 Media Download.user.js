// ==UserScript==
// @name      Weibo 2020 Media Download
// @namespace https://danor.app/
// @version   1.4.0-2021.11.28.01
// @author    Nuogz
// @grant     GM_getResourceText
// @grant     GM_addStyle
// @grant     unsafeWindow
// @require   https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @resource  notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @include   *weibo.com/*
// ==/UserScript==
/* global Notyf */

const L = (...args) => console.log(GM_info.script.name, GM_info.script.version, ...args);
const LE = (...args) => console.error(GM_info.script.name, GM_info.script.version, ...args);
const QS = (selector, el = document) => el.querySelector(selector);
const QA = (selector, el = document) => [...el.querySelectorAll(selector)];

const parseURLName = str => str.split('/').pop();

GM_addStyle(GM_getResourceText('notyf_css'));
GM_addStyle(`
	.nz-notify {
		background: #1da1f2;
		box-shadow: rgb(136 153 166 / 20%) 0px 0px 15px, rgb(136 153 166 / 15%) 0px 0px 3px 1px;
		border-radius: 4px;
		max-width: unset;
	}

	.nz-notify .inline {
		display: inline-block;
		vertical-align: top;
	}

	.nz-notify>.notyf__wrapper {
		padding-right: 0px;
	}

	.nz-notify progress {
		border: none;
	}
	.nz-notify .prog>.inline {
		text-align: right;
	}
	.nz-notify .prog {
		display: inline-block;
		vertical-align: top;
	}
	.nz-notify .save {
		display: inline-block;
		vertical-align: top;
		color: white;
		text-decoration: none;
		margin-left: 5px;
	}

	.nz-notify progress::-webkit-progress-bar {
		background-color: #ffffff;
		border-radius: 4px;
	}
	.nz-notify progress::-webkit-progress-value {
		background: #17bf63;
		border-radius: 4px;
	}
`);
GM_addStyle(`
	.nz-wmd-button {
		position: absolute;
		display: block;
		top: 0px;
		right: 0px;
		width: 18px;
		color: darkcyan;
		text-align: center;
		background: rgba(0, 0, 0, 0.7);
		user-select: none;
		cursor: pointer;
		font-size: 11px;
		padding: 1px;
	}
	.nz-wmd-button._search {
		top: 19px;
		border-radius: 0px 0px 0px 4px;
	}
	.nz-wmd-button:hover {
		color: white;
	}
	.nz-dbox-title {
		cursor: pointer;
	}
`);

const renderSize = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2)} ${['By', 'KB', 'MB', 'GB'][index]}`;
};

const notyf = new Notyf({
	duration: 0,
	position: { x: 'right', y: 'top' },
	types: [
		{
			type: 'tmd',
			icon: false,
			className: 'nz-notify',
		}
	]
});


const domTextDBox = `
<div class="inline prog">Preparing...</div>
<progress value="0" max="100"></progress><br>
`;
const openDBox = text => {
	const random = (Math.random() * 1000).toFixed(0);

	const noty = notyf.open({
		type: 'tmd',
		message: `<div id="nz-dbox-${random}"><div class="nz-dbox-title" title="点击关闭">${text} Fetching...</div><div class="down"></div></div>`
	});

	const dbox = QS(`#nz-dbox-${random}`);
	const boxTitle = QS('.nz-dbox-title', dbox);
	const boxDown = QS('.down', dbox);

	const initer = (text, count) => {
		dbox.title = text;
		boxTitle.innerHTML = boxTitle.innerHTML.replace(' Fetching...', '');
		boxDown.innerHTML = domTextDBox.repeat(count);

		const progs = QA('progress', dbox);
		const textsProg = QA('.prog', dbox);
		const textsInfo = QA('.info', dbox);

		return { progs, textsProg, textsInfo, };
	};

	boxTitle.addEventListener('click', () => notyf.dismiss(noty));

	return { noty, initer };
};


const downloadMedia = async (url, nameSave, prog, textProg, textLine) => {
	const response = await fetch(url);
	const reader = response.body.getReader();

	const sizeTotal = +response.headers.get('Content-Length');

	prog.max = sizeTotal;

	let sizeLoaded = 0;
	let datasMedia = new Uint8Array(sizeTotal);
	let isWhile = true;
	while(isWhile) {
		const { done, value } = await reader.read();

		if(!done || sizeLoaded == 0) {
			datasMedia.set(value, sizeLoaded);
			sizeLoaded += value.length;

			textProg.innerHTML = `
				<div class="inline" style="width: 40px">${textLine} </div>
				<div class="inline" style="width: 90px">[${renderSize(sizeTotal)}]</div>
				<div class="inline" style="width: 70px">${(sizeLoaded * 100 / sizeTotal).toFixed(2).padStart(5, '0')}%</div>
			`.replace(/\t|\n/g, '');

			prog.value = sizeLoaded;
		}
		else {
			isWhile = false;
		}
	}

	const a = document.createElement('a');
	a.classList.add('inline', 'save');
	a.innerHTML = '保存';
	a.download = nameSave;
	a.href = URL.createObjectURL(new Blob([datasMedia]));
	textProg.parentNode.insertBefore(a, textProg.nextElementSibling.nextElementSibling);
	a.click();

	L(`已保存: ${a.download}`);

	return datasMedia;
};


const downloadPictures = async toolbar => {
	const feed = QS('[class*=Feed_body_]', QA('[class*=Feed_wrap_]').find(feed => feed.contains(toolbar)));

	const partsURLWeibo = QA('a[title]', feed).pop().href.split('/');
	const idWeibo = partsURLWeibo.pop();


	const weibo = await (await fetch(`https://weibo.com/ajax/statuses/show?id=${idWeibo}`)).json();
	// 历史编辑记录https://weibo.com/ajax/statuses/editHistory?mid=4694110357689194&page=1


	let hasMedia = false;

	const imagesRaw = Object.values(weibo?.pic_infos ?? {});
	if(imagesRaw.length) { hasMedia = true; }

	const videosRaw = weibo?.page_info?.media_info?.playback_list ?? [];
	if(videosRaw.length) { hasMedia = true; }

	if(!hasMedia) { return LE(`微博[${idWeibo}]没有任何媒体`); }


	const idUser = weibo?.user?.id;

	const medias = [];
	imagesRaw.forEach((media, index_) => {
		const index = index_ + 1;

		medias.push({
			show: `P${index}`,
			url: media.largest.url,
			nameFile: `Weibo@${idUser}@${idWeibo}@${index}@${parseURLName(new URL(media.largest.url).pathname)}`,
		});

		if(media.video) {
			medias.push({
				show: `L${index}`,
				url: media.video,
				nameFile: `Weibo@${idUser}@${idWeibo}@${index}@${parseURLName(new URL(new URL(media.video).searchParams.get('livephoto')).pathname)}`,
			});
		}
	});

	videosRaw.sort((a, b) => a?.meta?.quality_index > b?.meta?.quality_index);
	const urlVideo = videosRaw[0]?.play_info?.url;
	if(urlVideo) {
		medias.push({
			show: 'V1',
			url: urlVideo,
			nameFile: `Weibo@${idUser}@${idWeibo}@1@${parseURLName(new URL(urlVideo).pathname)}`,
		});
	}


	const { noty, initer } = openDBox(`下载 ${idUser}@${idWeibo}`);
	const { progs, textsProg } = initer(`${idUser}@${idWeibo}`, medias.length);

	let unfinish = medias.length;
	medias.forEach(async ({ url, nameFile, show }, index) => {
		await downloadMedia(url, nameFile, progs[index], textsProg[index], show);

		if(--unfinish == 0) { setTimeout(() => notyf.dismiss(noty), 24777); }
	});
};


let imageWeiboNow;
const downloadPicture = async () => {
	const feed = QA('[class*=Feed_body_]').find(feed => feed.contains(imageWeiboNow));

	const partsURLWeibo = QA('a[title]', feed).pop().href.split('/');
	const idWeibo = partsURLWeibo.pop();
	const idUser = partsURLWeibo.pop();

	const weibo = await (await fetch(`https://weibo.com/ajax/statuses/show?id=${idWeibo}`)).json();
	const imagesRaw = Object.values(weibo?.pic_infos ?? {});

	const index = [...imageWeiboNow.parentNode.childNodes].indexOf(imageWeiboNow) + 1;

	const media = imagesRaw[index - 1];
	const medias = [];

	medias.push({
		show: `P${index}`,
		url: media.largest.url,
		nameFile: `Weibo@${idUser}@${idWeibo}@${index}@${parseURLName(new URL(media.largest.url).pathname)}`,
	});

	if(media.video) {
		medias.push({
			show: `L${index}`,
			url: media.video,
			nameFile: `Weibo@${idUser}@${idWeibo}@${index}@${parseURLName(new URL(new URL(media.video).searchParams.get('livephoto')).pathname)}`,
		});
	}

	const { noty, initer } = openDBox(`下载 ${idUser}@${idWeibo} 第${index}张`);
	const { progs, textsProg } = initer(`${idUser}@${idWeibo}`, medias.length);

	let unfinish = medias.length;
	medias.forEach(async ({ url, nameFile, show }, index) => {
		await downloadMedia(url, nameFile, progs[index], textsProg[index], show);

		if(--unfinish == 0) { setTimeout(() => notyf.dismiss(noty), 24777); }
	});

};

const searchPicture = () => {
	unsafeWindow.open(`https://simg.danor.app/${parseURLName(QS('img.woo-picture-img, img[class*=picture_focusImg_]', imageWeiboNow).src)}`);
};


const initImageButton = () => {
	const btnDown = document.createElement('div');
	const btnSearch = document.createElement('div');

	btnDown.innerHTML = '存';
	btnSearch.innerHTML = '救';

	btnDown.classList.add('nz-wmd-button');
	btnSearch.classList.add('nz-wmd-button', '_search');

	btnDown.addEventListener('click', (event) => { event.stopPropagation(); downloadPicture(); });
	btnSearch.addEventListener('click', (event) => { event.stopPropagation(); searchPicture(); });

	return [btnDown, btnSearch];
};
const [btnDown, btnSearch] = initImageButton();


const atMouseEnterImage = event => {
	imageWeiboNow = event.target;

	imageWeiboNow.appendChild(btnDown);
	imageWeiboNow.appendChild(btnSearch);

	event.stopPropagation();
};


const elsItemPicture = new Set();
const initElImage = itemPicture => {
	itemPicture.addEventListener('mouseenter', atMouseEnterImage);

	elsItemPicture.add(itemPicture);
};

const initElToolbar = toolbar => {
	const itemIcon = toolbar.childNodes[0].cloneNode(true);

	QS('[class*=toolbar_num_]', itemIcon).innerHTML = '';

	const icon = QS('.woo-font', itemIcon);
	icon.classList.remove('woo-font--retweet');
	icon.classList.add('woo-font--download');
	icon.title = '下载';

	itemIcon.addEventListener('click', () => downloadPictures(toolbar));

	toolbar.appendChild(itemIcon);
};


const observer = new MutationObserver(() => {
	// 判断是否新版微博
	if(QS('[class*=woo-box]')) {
		try {
			QA('.woo-box-item-inlineBlock[class*=picture_item_]').forEach(el => {
				if(!elsItemPicture.has(el)) {
					initElImage(el);
				}
			});

			elsItemPicture.forEach(el => { if(!document.contains(el)) { elsItemPicture.delete(el); } });

			QA('[class*=toolbar_main_]').forEach(el => {
				if(!QS('.woo-font--download', el)) {
					initElToolbar(el);
				}
			});
		}
		catch(error) {
			LE(error.message, error.stack);
		}
	}
	else {
		observer.disconnect();
	}
});

observer.observe(document.body, { childList: true, subtree: true });