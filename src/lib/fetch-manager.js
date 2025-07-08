import pMap from 'p-map';

import { createApp } from 'vue';

import App, { $panels, $values, $widthPanel, $willStorageValue } from './manager.vue';



export default class FetchManager {
	static pMap = pMap;


	constructor() { this.initUI(); }

	create(urls, mapper, concurrency = Infinity) {
		return pMap(urls, mapper, { concurrency });
	}

	elApp;
	app;

	initUI(colorTheme = '#1FAAF1') {
		const elApp = this.elApp = document.createElement(`danor-${GM_info.script.name}`);

		document.body.appendChild(elApp);

		this.app = createApp(App).mount(`danor-${GM_info.script.name}`);
	}


	set $values(value) { $values.value = value; }
	set $panels(value) { $panels.value = value; }

	set $widthPanel(value) { $widthPanel.value = value; }

	set $willStorageValue(value) { $willStorageValue.value = value; }
}
