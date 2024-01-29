// ==UserScript==
// @name        saucenao-improve
// @description 2023.09.04.15
// @namespace   https://danor.app/
// @version     1.0.1
// @author      DanoR
// @grant       GM_addStyle
// @grant       unsafeWindow
// @run-at      document-end
// @match       *://saucenao.com/search.php*
// ==/UserScript==




GM_addStyle(`
	#imagePreview {
		display: flex;
		justify-content: center;
		align-content: center;
		flex-direction: column;
		width: 100%;
		height: 150px;
		margin-top: 0.2em;
		margin-bottom: 0.2em;
		z-index: 2;
	}
	#imagePreview img {
		max-width:100%;
		max-height:100%;
	}
	.previewInfoText {
		color: #aaa;
		font-size: 0.9rem;
	}
	.previewErrorText {
		color: #d83800;
	}
`.trim());


unsafeWindow.togglenao();


const eForm = unsafeWindow.document.querySelector('form');
const eInputURL = document.querySelector('input[name=url]');
/** @type {HTMLInputElement} */
const eInputFile = document.querySelector('input[name=file]');


const ePreview = document.createElement('div');
ePreview.id = 'imagePreview';
ePreview.innerHTML = '<span class="previewInfoText">Browse, Drop, or Ctrl+V to Paste an Image~</span>';
eForm.parentElement.insertBefore(ePreview, eForm);




unsafeWindow.imageURLError = () => ePreview.innerHTML = '<span class="previewInfoText">Image Preview Unavailable</span>';


const updateURLInput = value => {
	if(value == '') { return eInputURL.value = eInputURL.defaultValue; }


	eInputURL.value = value;
	eInputFile.value = '';

	ePreview.innerHTML = /^((http|https|data):)/.test(value)
		? '<div style="width: 100%; height: 100%;"><img src="' + value + '" onerror="imageURLError();"></div>'
		: '<span class="previewErrorText">Invalid Image URL!</span>';
};
const checkImageFile = async () => {
	const file = eInputFile.files[0];

	const nameFile = file.name.trim().toLowerCase();

	const sizeFileMB = file.size / 1024 / 1024;
	const sizeFileMBMax = parseInt(localStorage.getItem('fsizeMax')) || 15;


	if(!/\.(png|jpe?g|gif|bmp|webp)$/.test(nameFile)) {
		ePreview.innerHTML = '<span class="previewErrorText">Image Type Not Supported!</span>';
		eInputFile.value = '';

		return;
	}

	if(sizeFileMB > sizeFileMBMax) {
		const urlFile = URL.createObjectURL(file);

		const image = new Image;
		const [width, height] = await new Promise(resolve => {
			image.src = urlFile;

			image.addEventListener('load', () => resolve([image.width, image.height]));
		});

		const scale = 200 / (width > height ? width : height);

		const canvas = document.createElement('canvas');
		canvas.getContext('2d').drawImage(image, 0, 0, canvas.width = width * scale, canvas.height = height * scale);


		const fileThumbnail = await new Promise(resolver => canvas.toBlob(blob => resolver(new File([blob], `thumb-${file.name}`, { type: file.type }))));

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(fileThumbnail);
		eInputFile.files = dataTransfer.files;


		ePreview.innerHTML = '<div style="width: 100%; height: 100%;"><img src="' + canvas.toDataURL(file.type) + '" onerror="imageURLError();"></div>';


		URL.revokeObjectURL(urlFile);
	}
	else {
		eInputURL.value = eInputURL.defaultValue;


		const fileReader = new FileReader();
		fileReader.addEventListener('load', () =>
			ePreview.innerHTML = /^((http|https|data):)/.test(fileReader.result)
				? '<div style="width: 100%; height: 100%;"><img src="' + fileReader.result + '" onerror="imageURLError();"></div>'
				: '<span class="previewErrorText">Invalid Image URL!</span>'
		);


		fileReader.readAsDataURL(file);
	}
};


eInputFile.addEventListener('change', checkImageFile);


unsafeWindow.document.addEventListener('paste', event => {
	event.preventDefault();

	const dataClipboard = event.clipboardData;
	if(eInputURL == event.target) {
		return updateURLInput(dataClipboard.getData('text'));
	}
	else {
		if(!dataClipboard.files.length) {
			updateURLInput(dataClipboard.getData('text'));
		}
		else {
			checkImageFile(eInputFile.files = dataClipboard.files);
		}
	}
});


document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragenter', event => event.preventDefault());
document.addEventListener('drop', event => {
	if(event.target == eInputFile) { return; }


	event.preventDefault();

	const dataTransfer = event.dataTransfer;
	if(!dataTransfer.files.length) {
		updateURLInput(dataTransfer.getData('text/uri-list'));
	}
	else {
		checkImageFile(eInputFile.files = dataTransfer.files);
	}
});
