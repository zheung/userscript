/** @type {import('p-map')} */
const { default: pMap } = await import('https://unpkg.com/p-map@6.0.0/index.js');


export default class FetchManager {
	static pMap = pMap;


	constructor() {

	}

	create(urls, mapper, concurrency = Infinity) {
		return pMap(urls, mapper, { concurrency });
	}
}
