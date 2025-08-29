import 'virtual:uno.css';

import pMap from 'p-map';
import { createApp } from 'vue';

import App, { $panels, $values, $widthPanel, $willStorageValue, $colorMain } from './fetch-manager.vue';



export default class FetchManager {
	static pMap = pMap;


	constructor(colorMain) { this.initUI(colorMain); }

	create(urls, mapper, concurrency = Infinity) {
		return pMap(urls, mapper, { concurrency });
	}

	elApp;
	app;

	initUI(colorMain = '#1FAAF1') {
		const elApp = this.elApp = document.createElement(`danor-${GM_info.script.name}`);

		document.body.appendChild(elApp);

		this.app = createApp(App).mount(`danor-${GM_info.script.name}`);

		$colorMain.value = colorMain;
	}


	set $values(value) { $values.value = value; }
	set $panels(value) { $panels.value = value; }

	set $widthPanel(value) { $widthPanel.value = value; }

	set $willStorageValue(value) { $willStorageValue.value = value; }
}
