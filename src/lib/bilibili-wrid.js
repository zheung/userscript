const stringWBI = localStorage.getItem('wbi_img_urls');
// const stringWBI = 'https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png-https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png';


const urlsWBI = stringWBI.split('-');

const extractWBIKey = url => url.substring(url.lastIndexOf('/') + 1, url.length).split('.')[0];
const keyImgWBI = extractWBIKey(urlsWBI[0]);
const keySubWBI = extractWBIKey(urlsWBI[1]);
const keyRawWBI = keyImgWBI + keySubWBI;

const positionsKey = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52];
const keyWBIFull = positionsKey.map(pos => keyRawWBI.charAt(pos)).join('');
const keyWBI = keyWBIFull.slice(0, 32);



const transform0 = (e0, e1, e2, e3, word, bit, offset) => {
	const c = e0 + (e1 & e2 | ~e1 & e3) + (word >>> 0) + offset;

	return (c << bit | c >>> 32 - bit) + e1;
};
const transform1 = (e0, e1, e2, e3, word, bit, offset) => {
	const c = e0 + (e1 & e3 | e2 & ~e3) + (word >>> 0) + offset;

	return (c << bit | c >>> 32 - bit) + e1;
};
const transform2 = (e0, e1, e2, e3, word, bit, offset) => {
	const c = e0 + (e1 ^ e2 ^ e3) + (word >>> 0) + offset;

	return (c << bit | c >>> 32 - bit) + e1;
};
const transform3 = (e0, e1, e2, e3, word, bit, offset) => {
	const c = e0 + (e2 ^ (e1 | ~e3)) + (word >>> 0) + offset;

	return (c << bit | c >>> 32 - bit) + e1;
};


const calcWRID = string => {
	const bufferStr = [];
	for(let i = 0; i < string.length; i++) {
		bufferStr.push(255 & string.charCodeAt(i));
	}

	const words = [];
	for(let i = 0, step = 0; i < bufferStr.length; i++, step += 8) {
		words[step >>> 5] |= bufferStr[i] << 24 - step % 32;
	}


	for(let indexWord = 0; indexWord < words.length; indexWord++) {
		words[indexWord] =
			16711935 &
			(words[indexWord] << 8 | words[indexWord] >>> 24) |
			4278255360 &
			(words[indexWord] << 24 | words[indexWord] >>> 8);
	}

	const sizeBits = 8 * bufferStr.length;

	words[sizeBits >>> 5] |= 128 << sizeBits % 32;
	words[14 + (sizeBits + 64 >>> 9 << 4)] = sizeBits;


	let block0 = 1732584193;
	let block1 = -271733879;
	let block2 = -1732584194;
	let block3 = 271733878;
	for(let d = 0; d < words.length; d += 16) {
		const block0Original = block0;
		const block1Original = block1;
		const block2Original = block2;
		const block3Original = block3;


		block0 = transform0(block0, block1, block2, block3, words[d + 0], 7, -680876936);
		block3 = transform0(block3, block0, block1, block2, words[d + 1], 12, -389564586);
		block2 = transform0(block2, block3, block0, block1, words[d + 2], 17, 606105819);
		block1 = transform0(block1, block2, block3, block0, words[d + 3], 22, -1044525330);
		block0 = transform0(block0, block1, block2, block3, words[d + 4], 7, -176418897);
		block3 = transform0(block3, block0, block1, block2, words[d + 5], 12, 1200080426);
		block2 = transform0(block2, block3, block0, block1, words[d + 6], 17, -1473231341);
		block1 = transform0(block1, block2, block3, block0, words[d + 7], 22, -45705983);
		block0 = transform0(block0, block1, block2, block3, words[d + 8], 7, 1770035416);
		block3 = transform0(block3, block0, block1, block2, words[d + 9], 12, -1958414417);
		block2 = transform0(block2, block3, block0, block1, words[d + 10], 17, -42063);
		block1 = transform0(block1, block2, block3, block0, words[d + 11], 22, -1990404162);
		block0 = transform0(block0, block1, block2, block3, words[d + 12], 7, 1804603682);
		block3 = transform0(block3, block0, block1, block2, words[d + 13], 12, -40341101);
		block2 = transform0(block2, block3, block0, block1, words[d + 14], 17, -1502002290);
		block1 = transform0(block1, block2, block3, block0, words[d + 15], 22, 1236535329);


		block0 = transform1(block0, block1, block2, block3, words[d + 1], 5, -165796510);
		block3 = transform1(block3, block0, block1, block2, words[d + 6], 9, -1069501632);
		block2 = transform1(block2, block3, block0, block1, words[d + 11], 14, 643717713);
		block1 = transform1(block1, block2, block3, block0, words[d + 0], 20, -373897302);
		block0 = transform1(block0, block1, block2, block3, words[d + 5], 5, -701558691);
		block3 = transform1(block3, block0, block1, block2, words[d + 10], 9, 38016083);
		block2 = transform1(block2, block3, block0, block1, words[d + 15], 14, -660478335);
		block1 = transform1(block1, block2, block3, block0, words[d + 4], 20, -405537848);
		block0 = transform1(block0, block1, block2, block3, words[d + 9], 5, 568446438);
		block3 = transform1(block3, block0, block1, block2, words[d + 14], 9, -1019803690);
		block2 = transform1(block2, block3, block0, block1, words[d + 3], 14, -187363961);
		block1 = transform1(block1, block2, block3, block0, words[d + 8], 20, 1163531501);
		block0 = transform1(block0, block1, block2, block3, words[d + 13], 5, -1444681467);
		block3 = transform1(block3, block0, block1, block2, words[d + 2], 9, -51403784);
		block2 = transform1(block2, block3, block0, block1, words[d + 7], 14, 1735328473);
		block1 = transform1(block1, block2, block3, block0, words[d + 12], 20, -1926607734);


		block0 = transform2(block0, block1, block2, block3, words[d + 5], 4, -378558);
		block3 = transform2(block3, block0, block1, block2, words[d + 8], 11, -2022574463);
		block2 = transform2(block2, block3, block0, block1, words[d + 11], 16, 1839030562);
		block1 = transform2(block1, block2, block3, block0, words[d + 14], 23, -35309556);
		block0 = transform2(block0, block1, block2, block3, words[d + 1], 4, -1530992060);
		block3 = transform2(block3, block0, block1, block2, words[d + 4], 11, 1272893353);
		block2 = transform2(block2, block3, block0, block1, words[d + 7], 16, -155497632);
		block1 = transform2(block1, block2, block3, block0, words[d + 10], 23, -1094730640);
		block0 = transform2(block0, block1, block2, block3, words[d + 13], 4, 681279174);
		block3 = transform2(block3, block0, block1, block2, words[d + 0], 11, -358537222);
		block2 = transform2(block2, block3, block0, block1, words[d + 3], 16, -722521979);
		block1 = transform2(block1, block2, block3, block0, words[d + 6], 23, 76029189);
		block0 = transform2(block0, block1, block2, block3, words[d + 9], 4, -640364487);
		block3 = transform2(block3, block0, block1, block2, words[d + 12], 11, -421815835);
		block2 = transform2(block2, block3, block0, block1, words[d + 15], 16, 530742520);
		block1 = transform2(block1, block2, block3, block0, words[d + 2], 23, -995338651);


		block0 = transform3(block0, block1, block2, block3, words[d + 0], 6, -198630844);
		block3 = transform3(block3, block0, block1, block2, words[d + 7], 10, 1126891415);
		block2 = transform3(block2, block3, block0, block1, words[d + 14], 15, -1416354905);
		block1 = transform3(block1, block2, block3, block0, words[d + 5], 21, -57434055);
		block0 = transform3(block0, block1, block2, block3, words[d + 12], 6, 1700485571);
		block3 = transform3(block3, block0, block1, block2, words[d + 3], 10, -1894986606);
		block2 = transform3(block2, block3, block0, block1, words[d + 10], 15, -1051523);
		block1 = transform3(block1, block2, block3, block0, words[d + 1], 21, -2054922799);
		block0 = transform3(block0, block1, block2, block3, words[d + 8], 6, 1873313359);
		block3 = transform3(block3, block0, block1, block2, words[d + 15], 10, -30611744);
		block2 = transform3(block2, block3, block0, block1, words[d + 6], 15, -1560198380);
		block1 = transform3(block1, block2, block3, block0, words[d + 13], 21, 1309151649);
		block0 = transform3(block0, block1, block2, block3, words[d + 4], 6, -145523070);
		block3 = transform3(block3, block0, block1, block2, words[d + 11], 10, -1120210379);
		block2 = transform3(block2, block3, block0, block1, words[d + 2], 15, 718787259);
		block1 = transform3(block1, block2, block3, block0, words[d + 9], 21, -343485551);


		block0 = block0 + block0Original >>> 0;
		block1 = block1 + block1Original >>> 0;
		block2 = block2 + block2Original >>> 0;
		block3 = block3 + block3Original >>> 0;
	}


	const blocksFinal = [block0, block1, block2, block3];
	const blocksFinalEndian = blocksFinal.map(block =>
		16711935 & (block << 8 | block >>> 32 - 8) |
		4278255360 & (block << 24 | block >>> 32 - 24)
	);

	const hexsWRID = [];
	for(let i = 0; i < blocksFinalEndian.length; i++) {
		hexsWRID.push((blocksFinalEndian[i] >>> 4).toString(16));
		hexsWRID.push((15 & blocksFinalEndian[i]).toString(16));
	}


	return hexsWRID.join('');
};


const signWRIDParams = params => {
	const timestamp = Math.round(Date.now() / 1e3);

	const wrid = calcWRID(`${new URLSearchParams(params)}&wts=${timestamp}${keyWBI}`);


	return Object.assign({}, params, {
		w_rid: wrid,
		wts: timestamp,
	});
};



export { signWRIDParams, calcWRID };
