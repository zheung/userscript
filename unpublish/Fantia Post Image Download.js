// ==UserScript==
// @name      Fantia Post Image Download
// @namespace https://danor.app/
// @version   0.2.0-20210605
// @author    Nuogz
// @grant     GM_getResourceText
// @grant     GM_addStyle
// @require   https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js
// @require   https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @resource  notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @include   *fantia.jp/posts/*
// ==/UserScript==
/* global Notyf, JSZip */

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
		vertical-align: middle;
	}

	.nz-tmd-notify>.notyf__wrapper {
		padding-right: 0px;
	}

	.nz-tmd-notify progress {
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
			className: 'nz-tmd-notify',
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
		message: `<div id="nz-tmd-dbox-${random}"><div class="title">${text} Fetching...</div><div class="down"></div></div>`
	});

	const dbox = document.querySelector(`#nz-tmd-dbox-${random}`);
	const boxTitle = dbox.querySelector('.title');
	const boxDown = dbox.querySelector('.down');

	const initer = (count, text) => {
		if(text || text === 0 || text === false) { dbox.title = text; }
		boxTitle.innerHTML = boxTitle.innerHTML.replace(' Fetching...', '');
		boxDown.innerHTML = domTextDBox.repeat(count);

		const progs = dbox.querySelectorAll('progress');
		const textsProg = dbox.querySelectorAll('.prog');
		const textsInfo = dbox.querySelectorAll('.info');

		return { progs, textsProg, textsInfo, };
	};

	return { noty, initer };
};
const downloadMedia = async (infos, prog, textProg, title, optionFetch) => {
	const response = await fetch(infos[0], optionFetch);
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
				<div class="inline" style="width: 40px">${title}: </div>
				<div class="inline" style="width: 65px">[${renderSize(sizeTotal)}]</div>
				<div class="inline" style="width: 55px">${(sizeLoaded * 100 / sizeTotal).toFixed(2).padStart(5, '0')}%</div>
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
	a.download = infos[1];
	a.href = URL.createObjectURL(new Blob([datasMedia]));
	textProg.parentNode.insertBefore(a, textProg.nextElementSibling.nextElementSibling);
	// a.click();

	console.log(`Saved: ${a.download}`);

	return datasMedia;
};

// -------FPIS-------

GM_addStyle(`
	.nz-fpis-button {
		position: relative;
		top: 3px;
		display: inline-block;
		vertical-align: top;
		width: 40px;
		height: 34px;
		cursor: pointer;
	}
	.nz-fpis-button:hover {
		fill: #337ab7;
	}
	h1.post-title {
		display: inline-block;
		vertical-align: top;
	}
`);

const fetchURLImageFull = async function(image) {
	const imageID = image.src.match(/file\/(\d+)\//)[1];

	const resContainer = await fetch(`https://fantia.jp/posts/537150/post_content_photo/${imageID}`);
	const htmlContainer = await resContainer.text();
	const urlImageFull = htmlContainer.match(/src="(.*?)"/)[1].replace(/&amp;/g, '&');

	return urlImageFull;
};

const onClickDown = async function(event) {
	event.stopPropagation();

	document.querySelectorAll('.image-thumbnails').forEach((group, gid) => {
		const images = group.querySelectorAll('.image-container>.img-fluid');

		const { noty, initer } = openDBox(gid + 1);
		const { progs, textsProg, } = initer(images.length + 1);

		let unfinish = images.length;
		const datasMediaAll = {};
		images.forEach(async (image, iid) => {
			const urlImageFull = await fetchURLImageFull(image);
			const prefix = `${String(gid + 1).padStart(2, '0')}-${String(iid + 1).padStart(2, '0')}`;

			const name = `[${prefix}]${decodeURI(new URL(urlImageFull).pathname.split('/').pop())}`;
			const infos = [
				urlImageFull,
				name,
				iid
			];

			const datasMedia = await downloadMedia(infos, progs[iid], textsProg[iid], prefix, {
				referrer: 'https://fantia.jp/',
				credentials: 'include'
			});

			datasMediaAll[name] = datasMedia;

			unfinish--;

			if(unfinish == 0) {
				const zip = new JSZip();

				for(const name in datasMediaAll) {
					if(Object.hasOwnProperty.call(datasMediaAll, name)) {
						const datasMedia = datasMediaAll[name];
						zip.file(name, datasMedia);
					}
				}

				const textProgZip = textsProg[textsProg.length - 1];

				const datasZip = await zip.generateAsync({ type: 'uint8array' }, (metadata) => {
					textProgZip.innerHTML = `
						<div class="inline" style="width: 105px">[Zip File]: </div>
						<div class="inline" style="width: 55px">${metadata.percent.toFixed(2).padStart(5, '0')}%</div>
					`.replace(/\t|\n/g, '');
				});

				const a = document.createElement('a');
				a.classList.add('inline', 'save');
				a.innerHTML = 'Save';
				a.download = `[${gid + 1}].zip`;
				a.href = URL.createObjectURL(new Blob([datasZip]));
				textProgZip.parentNode.insertBefore(a, textProgZip.nextElementSibling.nextElementSibling);
				a.click();

				setTimeout(() => notyf.dismiss(noty), 14777);
			}
		});
	});
};

const initButton = function() {
	const buttonSetting = document.querySelector('h1.post-title');

	if(buttonSetting) {
		const buttonDown = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		buttonSetting.parentNode.insertBefore(buttonDown, buttonSetting.nextElementSibling);

		buttonDown.setAttribute('viewBox', '0 -5 26 36');
		buttonDown.innerHTML = '<polygon points="12.732,26 25.464,13.27 18.026,13.27 18.026,0 7.438,0 7.438,13.27 0,13.27" />';

		buttonDown.classList.add('nz-fpis-button');
		buttonDown.title = '下载';
		if(buttonDown.childNodes[1]) { buttonDown.removeChild(buttonDown.childNodes[1]); }

		return buttonDown;
	}
};


new MutationObserver(() => {
	try {
		if(!document.querySelector('.nz-fpis-button')) {
			const buttonDown = initButton();

			if(buttonDown) { buttonDown.addEventListener('click', onClickDown); }
		}
	}
	catch(error) {
		console.error(error.message, error.stack);
	}
}).observe(document.body, { childList: true, subtree: true });
