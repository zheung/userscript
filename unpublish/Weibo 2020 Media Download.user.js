// ==UserScript==
// @name      Weibo 2020 Media Download
// @namespace https://danor.app/
// @version   1.0.0-20210518
// @author    Nuogz
// @grant     GM_getResourceText
// @grant     GM_addStyle
// @grant     unsafeWindow
// @require   https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @resource  notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @include   *weibo.com/*
// ==/UserScript==
/* global Notyf */

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
	}
	.nz-wmd-button._search {
		top: 19px;
		border-radius: 0px 0px 0px 4px;
	}
	.nz-wmd-button:hover {
		color: white;
	}
`);

const renderSize = function(value) {
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
		message: `<div id="nz-dbox-${random}"><div class="title">${text} Fetching...</div><div class="down"></div></div>`
	});

	const dbox = document.querySelector(`#nz-dbox-${random}`);
	const boxTitle = dbox.querySelector('.title');
	const boxDown = dbox.querySelector('.down');

	const initer = (text, count) => {
		dbox.title = text;
		boxTitle.innerHTML = boxTitle.innerHTML.replace(' Fetching...', '');
		boxDown.innerHTML = domTextDBox.repeat(count);

		const progs = dbox.querySelectorAll('progress');
		const textsProg = dbox.querySelectorAll('.prog');
		const textsInfo = dbox.querySelectorAll('.info');

		return { progs, textsProg, textsInfo, };
	};

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
				<div class="inline" style="width: 40px">${textLine}: </div>
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
	a.innerHTML = 'Save';
	a.download = nameSave;
	a.href = URL.createObjectURL(new Blob([datasMedia]));
	textProg.parentNode.insertBefore(a, textProg.nextElementSibling.nextElementSibling);
	a.click();

	console.log(`Saved: ${a.download}`);

	return datasMedia;
};


const downloadPictures = async function(toolbar) {
	const feed = [...document.querySelectorAll('[class*=Feed_wrap_]')]
		.find(feed => feed.contains(toolbar))
		.querySelector('[class*=Feed_body_]');

	const partsURLWeibo = feed.querySelector('a[title]').href.split('/');
	const idWeibo = partsURLWeibo.pop();
	const idUser = partsURLWeibo.pop();

	const elsImage = [...feed.querySelectorAll('img.woo-picture-img')];
	const { noty, initer } = openDBox(`下载 ${idUser}@${idWeibo}`);
	const { progs, textsProg } = initer(`${idUser}@${idWeibo}`, elsImage.length);

	let unfinish = elsImage.length;
	elsImage.forEach(async (el, index) => {
		const urlImage = el.src;
		const nameFile = urlImage.split('/').pop();

		await downloadMedia(
			urlImage.replace(/\.cn\/.*?\//, '.cn/large/'),
			`Weibo@${idUser}@${idWeibo}@${index + 1}@${nameFile}`,
			progs[index], textsProg[index], index + 1
		);

		if(unfinish-- == 0) { setTimeout(() => notyf.dismiss(noty), 24777); }
	});
};
const downloadPicture = async function() {
	const feed = [...document.querySelectorAll('[class*=Feed_body_]')].find(feed => feed.contains(weibo));

	const partsURLWeibo = feed.querySelector('a[title]').href.split('/');
	const idWeibo = partsURLWeibo.pop();
	const idUser = partsURLWeibo.pop();

	const urlImage = weibo.querySelector('img.woo-picture-img').src;
	const nameFile = urlImage.split('/').pop();

	const weibos = [...weibo.parentNode.childNodes];

	const indexImage = weibos.indexOf(weibo) + 1;

	const { noty, initer } = openDBox(`下载 ${idUser}@${idWeibo} 第${indexImage}张`);

	const { progs, textsProg } = initer(`${idUser}@${idWeibo} 第${indexImage}张`, 1);

	await downloadMedia(
		urlImage.replace(/\.cn\/.*?\//, '.cn/large/'),
		`Weibo@${idUser}@${idWeibo}@${indexImage}@${nameFile}`,
		progs[0], textsProg[0], indexImage
	);

	setTimeout(() => notyf.dismiss(noty), 24777);
};

const searchPicture = function() {
	unsafeWindow.open(`https://simg.danor.app/${weibo.querySelector('img.woo-picture-img').src.split('/').pop()}`);
};



const initImageButton = function() {
	const btnDown = document.createElement('div');
	const btnSearch = document.createElement('div');

	btnDown.innerHTML = 'D';
	btnSearch.innerHTML = 'S';

	btnDown.classList.add('nz-wmd-button');
	btnSearch.classList.add('nz-wmd-button', '_search');

	btnDown.addEventListener('click', (event) => { event.stopPropagation(); downloadPicture(); });
	btnSearch.addEventListener('click', (event) => { event.stopPropagation(); searchPicture(); });

	return [btnDown, btnSearch];
};
const [btnDown, btnSearch] = initImageButton();

const atMouseEnterImage = function(event) {
	weibo = event.target;

	weibo.appendChild(btnDown);
	weibo.appendChild(btnSearch);

	event.stopPropagation();
};


const elsItemPicture = new Set();
const initElImage = function(itemPicture) {
	itemPicture.addEventListener('mouseenter', atMouseEnterImage);

	elsItemPicture.add(itemPicture);
};

const initElToolbar = function(toolbar) {
	const itemIcon = toolbar.childNodes[0].cloneNode(true);

	itemIcon.querySelector('[class*=toolbar_num_]').innerHTML = '';

	const icon = itemIcon.querySelector('.woo-font');
	icon.classList.remove('woo-font--retweet');
	icon.classList.add('woo-font--download');
	icon.title = '下载';

	itemIcon.addEventListener('click', () => downloadPictures(toolbar));

	toolbar.appendChild(itemIcon);
};


let weibo;


const observer = new MutationObserver(() => {
	// 判断是否新版微博
	if(document.querySelector('[class*=woo-box]')) {
		try {
			document.querySelectorAll('.woo-box-item-inlineBlock[class*=picture_item_]').forEach(el => {
				if(!elsItemPicture.has(el)) {
					initElImage(el);
				}
			});

			elsItemPicture.forEach(el => { if(!document.contains(el)) { elsItemPicture.delete(el); } });

			document.querySelectorAll('[class*=toolbar_main_]').forEach(el => {
				if(!el.querySelector('.woo-font--download')) {
					initElToolbar(el);
				}
			});
		}
		catch(error) {
			console.error(error.message, error.stack);
		}
	}
	else {
		observer.disconnect();
	}
});

observer.observe(document.body, { childList: true, subtree: true });