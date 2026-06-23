/** @import { FetchFileDataOption } from './util.d.ts' */



/**
 * 查询单个元素
 * @param {string} selector - CSS 选择器
 * @param {Document|Element} [element=document] - 搜索根元素
 * @returns {Element | null} 匹配的第一个元素，无匹配时为 null
 */
export function querySelector(selector, element = document) {
	return element.querySelector(selector);
}

/**
 * 查询所有匹配元素
 * @param {string} selector - CSS 选择器
 * @param {Document|Element} [element=document] - 搜索根元素
 * @returns {Element[]} 匹配的元素数组
 */
export function querySelectorAll(selector, element = document) {
	return [...element.querySelectorAll(selector)];
}



/**
 * 保存文件
 * @param {string} url
 * @param {string} [name]
 */
export function saveFile(url, name) {
	const a = document.createElement('a');

	a.download = name;
	a.href = url;
	a.click();
}



/**
 * 创建保存链接
 * @param {string} [download]
 * @param {string} [href]
 * @param {string} [innerHTML]
 * @param {string} [title]
 * @returns {HTMLAnchorElement}
 */
export const createSaveLink = (download, href, innerHTML = '', title) => {
	const a = document.createElement('a');

	a.setAttribute('saver', '');

	a.innerHTML = innerHTML;

	if(download) { a.download = download; }
	if(href) { a.href = href; }
	if(title) { a.title = title; }

	return a;
};


/**
 * 获取文件大小
 * @param {string} url - 文件 URL
 * @returns {Promise<number>} 文件字节数
 */
export const fetchFileSize = async url => {
	const controller = new AbortController();

	const responseSize = await fetch(new Request(url, { method: 'GET', signal: controller.signal }));

	const size = +responseSize.headers.get('Content-Length');

	controller.abort();

	return size;
};


/**
 * 逐块读取 ReadableStream，每读取一块就调用一次 handle
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader - 流读取器
 * @param {(data: Uint8Array, sizeReadAfter: number, sizeReadBefore: number) => Promise<void>} handle - 每块数据的回调
 */
export const readReader = async (reader, handle) => {
	let sizeRead = 0;
	let isWhile = true;

	while(isWhile) {
		const { done, value } = await reader.read();

		if(!done || sizeRead == 0) {
			await handle(value, sizeRead += value.length, sizeRead - value.length);
		}
		else {
			isWhile = false;
		}
	}
};

/**
 * 获取远程文件完整数据
 *
 * 有 `options.size` 时预分配 Uint8Array 一次写入；否则分片收集后合并。
 *
 * @param {string} url - 文件 URL
 * @param {FetchFileDataOption} [options={}] - 可选配置
 * @returns {Promise<Uint8Array>} 文件完整二进制数据
 */
export const fetchFileData = async (url, options = {}) => {
	const sizeFile = options.size;
	const nameSave = options.nameSave;

	const willSaveNow = options.willSaveNow ?? false;

	const atProgress = options.atProgress ?? (() => { });
	const atFinish = options.atFinish ?? (() => { });
	const atError = options.atError ?? (() => { });


	try {
		const responseGet = await fetch(url);

		const reader = responseGet.body.getReader();

		/** 有 sizeFile 时优先预分配，否则直接用分片模式 */
		let datasFile = sizeFile ? new Uint8Array(sizeFile) : null;
		/** @type {Uint8Array[]|null} 仅在超出预分配大小时启用 */
		let partsFile = null;
		let sizeActual = 0;

		await readReader(reader, async (data, sizeReadAfter, sizeRead) => {
			const partFileNew = data;

			if(datasFile) {
				if(sizeReadAfter <= sizeFile) {
					datasFile.set(partFileNew, sizeRead);
				}
				else {
					// 数据量超出预期，将已写入部分转存为分片，切换为分片模式
					partsFile = [datasFile.slice(0, sizeRead)];
					partsFile.push(partFileNew);
					datasFile = null;
				}
			}
			else {
				partsFile.push(partFileNew);
			}

			sizeActual = sizeReadAfter;

			atProgress(sizeReadAfter, url, options);
		});

		if(partsFile) {
			// 分片模式：合并所有分片
			const sizeTotal = partsFile.reduce((acc, part) => acc + part.length, 0);
			datasFile = new Uint8Array(sizeTotal);
			let offset = 0;
			for(const partFile of partsFile) {
				datasFile.set(partFile, offset);
				offset += partFile.length;
			}
		}
		else if(sizeActual < sizeFile) {
			// 实际数据量小于预期，截去多余容量
			datasFile = datasFile.slice(0, sizeActual);
		}


		if(willSaveNow) {
			createSaveLink(nameSave, URL.createObjectURL(new Blob([datasFile]))).click();
		}


		atFinish(datasFile, url, options);


		return datasFile;
	}
	catch(error) {
		atError(error, url, options);

		throw error;
	}
};
