export class Logger {
	/** @type {string} */
	namePackage;

	/**
	 * @param {string} namePackage
	 */
	constructor(namePackage) {
		this.namePackage = namePackage;
	}

	info(...params) { globalThis.console.info(`${this.namePackage}:`, ...params); }
	error(...params) { globalThis.console.error(`${this.namePackage}:`, ...params); }
	warn(...params) { globalThis.console.warn(`${this.namePackage}:`, ...params); }
}


export const G = new Logger(GM_info.script.name);
