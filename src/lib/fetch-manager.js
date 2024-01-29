import pMap from '../../node_modules/p-map/index.js';



export default class FetchManager {
	static pMap = pMap;


	constructor() { }

	create(urls, mapper, concurrency = Infinity) {
		return pMap(urls, mapper, { concurrency });
	}
}
