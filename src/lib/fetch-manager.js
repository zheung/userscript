import pMap from '../../node_modules/p-map/index.js';
// import { createApp, ref } from 'vue';
import { createApp, ref } from 'vue/dist/vue.esm-browser.prod.js';
import { FontAwesomeIcon as Icon } from '@fortawesome/vue-fontawesome';
import { faThumbTack, faXmark } from '@fortawesome/free-solid-svg-icons';

import templateUI from './fetch-manager.html';
import cssUI from './fetch-manager.sass';



export default class FetchManager {
	static pMap = pMap;


	constructor() { this.initUI(); }

	create(urls, mapper, concurrency = Infinity) {
		return pMap(urls, mapper, { concurrency });
	}


	elBox;
	app;

	initUI(colorTheme = '#1FAAF1') {
		const elBox = this.elBox = document.createElement(`danor-${GM_info.script.name}`);

		document.body.appendChild(elBox);

		GM_addStyle(cssUI.replace(/_colorTheme_/g, colorTheme));


		this.app = createApp({
			setup: this.setup(),
			template: templateUI,
			compilerOptions: {
				isCustomElement: tag => /^((module-|comp-|p-).+?|module)$/.test(tag)
			},
			components: { Icon }
		}).mount('danor-bilibili-media-fetch');
	}

	setup() {
		const C = this.C;

		return function setup() {
			const handlesDefault = {
				apply(config, key, keyConfig) { return config[keyConfig ?? key] ? config[keyConfig ?? key](config, C.value, handlesDefault[key]) : handlesDefault[key](config, C.value); },

				showValuesText(config, C) {
					const { options } = config;

					return `选项：${options.map(option => option.text).join(' | ')}`;
				},
				showValueText(config, C) {
					const { key, options } = config;

					return options.find(option => option.value === C.values[key])?.text ?? C.values[key] ?? '';
				},
				clickSwitchButton(config, C, willReturnOption = false) {
					const { key, options } = config;

					const indexNow = options.findIndex(option => option.value === C.values[key]);
					const indexNext = indexNow < options.length - 1 ? indexNow + 1 : 0;

					const option = options[indexNext];
					const valueNow = C.values[key] = option.value;

					if(C.willStorageValue) { globalThis.GM_setValue?.(`default-${key}`, valueNow); }


					return willReturnOption ? option : valueNow;
				}
			};

			return {
				openedPanel: ref(false),
				pinnedPanel: ref(true),

				C,

				handlesDefault,

				brop: value => value ? '' : undefined,

				faThumbTack, faXmark,
			};
		};
	}

	C = ref({
		values: {},
		panels: [],

		widthPanel: 'auto',

		willStorageValue: true,
	});
	set $values(value) { this.C.value.values = value; }
	set $panels(value) { this.C.value.panels = value; }

	set $widthPanel(value) { this.C.value.widthPanel = value; }

	set $willStorageValue(value) { this.C.value.willStorageValue = value; }
}
