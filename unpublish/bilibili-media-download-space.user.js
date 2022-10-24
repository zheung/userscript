// ==UserScript==
// @name        bilibili-media-download-space
// @description bilibili-media-download-space
// @namespace   https://danor.app/
// @version     0.1.1-2022.10.24.01
// @author      Nuogz
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @resource    notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @match       *://space.bilibili.com/*/video*
// ==/UserScript==

/* global Notyf */


const G = {
	log(...params) { console.log('bilibili-media-download-space: ', ...params); },
	error(...params) { console.error('bilibili-media-download-space: ', ...params); },
};


GM_addStyle(GM_getResourceText('notyf_css'));
GM_addStyle(`
	.nz-tmd-notify {
		background: #1da1f2;
		box-shadow: rgb(136 153 166 / 20%) 0px 0px 15px, rgb(136 153 166 / 15%) 0px 0px 3px 1px;
		border-radius: 4px;
		max-width: unset;
	}

	.nz-tmd-notify .inline {
		display: inline-block;
		vertical-align: top;
	}

	.nz-tmd-notify>.notyf__wrapper {
		padding-right: 0px;
	}

	.nz-tmd-notify progress {
		width: 100px;
		border: none;
	}
	.nz-tmd-notify .prog {
		text-align: right;
	}
	.nz-tmd-notify .save {
		color: white;
		text-decoration: none;
		margin-left: 5px;
	}

	.nz-tmd-notify progress::-webkit-progress-bar {
		background-color: #ffffff;
		border-radius: 4px;
	}
	.nz-tmd-notify progress::-webkit-progress-value {
		background: #17bf63;
		border-radius: 4px;
	}

	[nz-text-block] {
		text-align: right;
		overflow: hidden;
		white-space: nowrap;
	}
`);



const notyf = new Notyf({
	duration: 0,
	position: { x: 'right', y: 'top' },
	types: [
		{
			type: 'tmd',
			icon: false,
			className: 'nz-tmd-notify',
		}
	]
});



const onClickDownAll = async p_ => {
	G.log('download-start', '...');

	const urls = [...document.querySelectorAll('.small-item>a.title')].map(a => a.href).reverse();


	const random = (Math.random() * 1000).toFixed(0);
	const noty = notyf.open({
		type: 'tmd',
		message: `<div id="nz-tmd-dbox-${random}"></div>`
	});

	const dbox = document.querySelector(`#nz-tmd-dbox-${random}`);
	dbox.addEventListener('click', () => notyf.dismiss(noty));


	let i = ~~window.prompt('从倒数第几个投稿开始？', '1');
	const download = () => {
		const url = urls[i - 1];

		window.open(`${url}?bilibili-media-download-auto-download=1`, `bmdad${i}`, 'noreferrer');

		dbox.innerHTML = `<div class="title">已打开第${i}个投稿，共${urls.length}个</div>`;
		console.log(i, url);

		i++;

		if(i > urls.length) { clearInterval(intervalOpen); }
	};

	download();
	const intervalOpen = setInterval(download, 1000 * 14);
};


const initButton = () => {
	const iconList = document.querySelector('.item.style>.icon');

	const iconDown = iconList.cloneNode(true);
	iconList.parentNode.insertBefore(iconDown, iconList);

	iconDown.style.backgroundPosition = '-1495px -471px';

	iconDown.classList.add('nz-tmd-button');
	iconDown.classList.remove('active');
	iconDown.title = '下载';

	return iconDown;
};



(async () => {
	new MutationObserver(() => {
		try {
			if(!document.querySelector('.nz-tmd-button')) {
				console.log('init');
				const buttonDown = initButton();

				if(buttonDown) {
					buttonDown.addEventListener('click', event => (
						event.stopPropagation(),
						onClickDownAll()
					));

					G.log('add-download-button', '✔');
				}
			}
		}
		catch(error) {
			G.error(error.message, error.stack);
		}
	}).observe(document.body, { childList: true, subtree: true });
})();
