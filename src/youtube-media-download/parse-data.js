/**
 * @param {string} url
 * @returns {Promise<number>}
 */
const fetchMediaSize = async url => {
	const responseSize = await fetch(new Request(url, { method: 'HEAD', cache: 'reload' }));

	return +responseSize.headers.get('Content-Length');
};


const parseFormat = async (formatRaw, prefix) => {
	const [typeMime = '', codecs = ''] = formatRaw.mimeType.split(';');
	const [mime, ext] = typeMime.trim().split('/');

	if(!Number(formatRaw.contentLength)) { formatRaw.contentLength = await fetchMediaSize(formatRaw.url); }

	return {
		itag: formatRaw.itag,
		type: `${prefix}-${mime}`,
		mime,
		ext,
		codecs: codecs.match(/codecs="(.*?)"/)?.[1] ?? 'unknown',
		width: formatRaw.width,
		height: formatRaw.height,
		size: Number(formatRaw.contentLength),
		bitrate: formatRaw.bitrate,
		qualityLabel: formatRaw.qualityLabel,
		url: formatRaw.url,
	};
};

const parseFormats = async dataStreaming => {
	const { formats, adaptiveFormats } = dataStreaming;


	const result = [];


	for(const formatRaw of formats) {
		const format = await parseFormat(formatRaw, 'fixed');

		result.push(format);
	}

	for(const formatRaw of adaptiveFormats) {
		const format = await parseFormat(formatRaw, 'adaptive');

		result.push(format);
	}

	return result.sort((a, b) => b.bitrate - a.bitrate);
};


const IR = window.ytInitialPlayerResponse;
const detailsVideo = IR.videoDetails;

const formats = await parseFormats(IR.streamingData);


export const I = {
	nameSavePrefix: `youtube@${detailsVideo.channelId}@${detailsVideo.author}@${detailsVideo.videoId}@${detailsVideo.title}`,
	formats,
};
