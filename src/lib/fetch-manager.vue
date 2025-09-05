<template>
	<p-fetch-manager
		:style="{ '--cMain': $colorMain }"
	>
		<p-open-button v-show="!$openedPanel" style-button @mouseenter="$openedPanel = true">&lt;</p-open-button>
		<p-main-box
			v-show="$pinnedPanel || $openedPanel"
			:style="{ width: $widthPanel }"
			@mouseleave="$openedPanel = false">
			<p-main>
				<p-main-title>下载管理</p-main-title>
				<p-main-button style-button @click="$pinnedPanel = false, $openedPanel = false">
					<Icon :icon="faXmark" /> 关闭
				</p-main-button>
				<p-main-button style-button :actived="brop($pinnedPanel)" @click="switchPanelPin">
					<Icon :icon="faThumbTack" /> 固定
				</p-main-button>
			</p-main>

			<template v-for="panel of $panels" :key="panel.id">
				<details v-if="panel.type == 'select-grid'" :panel="panel.type" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer" :title="panel.value">{{ panel.title }} 已选: {{ panel.getOptionLabel?.(panel.value) || option.id }}</summary>
					<table select-grid>
						<tr>
							<th v-for="head of panel.heads" :key="head.id || head.key">{{ head.text }}</th>
						</tr>
						<template v-for="option of panel.options" :key="panel.getOptionKey?.(option) || option.id">
							<tr
								style-button
								:actived="brop(panel.value == option)"
								@click="panel.value = option">
								<template v-for="head of panel.heads" :key="head.id || head.key">
									<td :title="option[head.keyTitle]">{{ option[head.key] }}</td>
								</template>
							</tr>
						</template>
					</table>
				</details>

				<details v-if="panel.type == 'functions'" :panel="panel.type" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer">{{ panel.title }}</summary>

					<template v-for="func of panel.functions" :key="func.id">
						<p-function-button v-if="func.type == 'button' || !func.type" style-button @click="func.handle($states)">
							<Icon v-if="func.icon" :icon="func.icon" />{{ func.text }}
						</p-function-button>
					</template>
				</details>

				<p-panel v-if="panel.type == 'functions-collapseless'" :open="brop(!panel.closedDefault)">
					<summary v-if="panel.title" class="cursor-pointer">{{ panel.title }}</summary>

					<template v-for="func of panel.functions" :key="func.id">
						<p-function-button v-if="func.type == 'button' || !func.type" style-button @click="func.handle($states)">
							<Icon v-if="func.icon" :icon="func.icon" />{{ func.text }}
						</p-function-button>
					</template>
				</p-panel>

				<details v-if="panel.type == 'configs'" :panel="panel.type" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer">{{ panel.title }}</summary>

					<template v-for="config of panel.configs" :key="config.key">
						<p-switch-button v-if="config.type == 'switch-button'"
							:style="{ width: config.width || 'fit-content' }"
							:title="$handlesDefault.apply(config, panel, 'showValuesText')"
							@click="$handlesDefault.apply(config, panel, 'clickSwitchButton', 'click')">
							<p-label>{{ config.label }}</p-label>
							<p-value>
								{{ $handlesDefault.apply(config, panel, 'showValueText') }}
							</p-value>
						</p-switch-button>
					</template>
				</details>

				<details v-if="panel.type == 'progresses'" :panel="panel.type" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer">{{ panel.title }}</summary>

					<table select-grid>
						<tr>
							<th class="w-50">名称</th>
							<th>进度</th>
						</tr>
						<tr v-for="prog, i of panel.progs" :key="i" :title="prog.name">
							<td class="ws-pre">{{ prog.name }}</td>
							<td>
								<p-progress-info>
									<p-function-button v-if="prog.button" @click="prog.button.click(prog)">{{ prog.button.text }}</p-function-button>
									<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
									<p-text v-html="prog.text" />
								</p-progress-info>
								<progress :okay="brop(prog.value == prog.max && prog.max)" :fail="brop(prog.error)" :value="prog.value" :max="prog.max" />
							</td>
						</tr>
					</table>
				</details>
			</template>
		</p-main-box>
	</p-fetch-manager>
</template>

<script>
import 'virtual:uno.css';

import { createApp, ref } from 'vue';

import pMap from 'p-map';

import App from './fetch-manager.vue';



export class FetchManager {
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


	set $panels(value) { $panels.value = value; }

	set $widthPanel(value) { $widthPanel.value = value; }

	set $willStorageValue(value) { $willStorageValue.value = value; }
}



export const $openedPanel = ref(false);
export const $pinnedPanel = ref(GM_getValue('default-pinnedPanel', false));
export const $panels = ref([]);
export const $widthPanel = ref('480px');
export const $willStorageValue = ref(false);
export const $colorMain = ref('#1FAAF1');


const $states = { $openedPanel, $pinnedPanel, $panels, $widthPanel, $willStorageValue };

export const $handlesDefault = {
	apply(config, panel, key, keyConfig) {
		return config[keyConfig ?? key]
			? config[keyConfig ?? key](config, panel, $states, $handlesDefault[key])
			: $handlesDefault[key](config, panel, $states);
	},

	showValuesText(config) {
		const { options } = config;

		return `选项：${options.map(option => option.text).join(' | ')}`;
	},
	showValueText(config) {
		const { options } = config;

		return options.find(option => option.value === config.value)?.text ?? config.value ?? '';
	},
	clickSwitchButton(config, panel, states, handleDefault, willReturnOption = false) {
		const { key, options } = config;

		const indexNow = options.findIndex(option => option.value === config.value);
		const indexNext = indexNow < options.length - 1 ? indexNow + 1 : 0;

		const option = options[indexNext];
		const valueNow = config.value = option.value;

		if($willStorageValue.value) { GM_setValue?.(`default-${key}`, valueNow); }


		return willReturnOption ? option : valueNow;
	}
};
</script>
<script setup>
import { FontAwesomeIcon as Icon } from '@fortawesome/vue-fontawesome';
import { faThumbTack, faXmark } from '@fortawesome/free-solid-svg-icons';

const brop = value => value ? '' : undefined;

const switchPanelPin = () => GM_setValue('default-pinnedPanel', $pinnedPanel.value = !$pinnedPanel.value);
</script>

<style lang="sass" scoped>
p-fetch-manager
	--spc: 0.25rem

	--cWhite: #FAFAFA
	--cBlack: #27272A

	--cBase: #1FAAF1
	--cBaseComple: rgb(from var(--cBase) calc(255 - r) calc(255 - g) calc(255 - b))

	--cBaseOnWhite: #00AEEC
	--cTextBaseOnWhite: #FAFAFA
	--cSplitOnWhite: #A3A3A3

	--cBaseOnBlack: #00AEEC
	--cTextBaseOnBlack: #27272A
	--cSplitOnBlack: #9C9C9C

	@media (prefers-color-scheme: light)
		color-scheme: light
		--cBack: var(--cWhite)
		--cText: var(--cBlack)
		--cMain: var(--cBaseOnWhite)
		--cTextMain: var(--cTextBaseOnWhite)
		--cGary: var(--cSplitOnWhite)

	@media (prefers-color-scheme: dark)
		color-scheme: dark
		--cBack: var(--cBlack)
		--cText: var(--cWhite)
		--cMain: var(--cBaseOnBlack)
		--cTextMain: var(--cTextBaseOnBlack)
		--cGary: var(--cSplitOnBlack)

	&[color-scheme="dark"]
		color-scheme: dark
		--cBack: var(--cBlack)
		--cText: var(--cWhite)
		--cMain: var(--cBaseOnBlack)
		--cTextMain: var(--cTextBaseOnBlack)
		--cGary: var(--cSplitOnBlack)
	&
		--cOkay: #16A34A
		--cFail: #DC2626

p-fetch-manager
	@apply fixed inblock z-[9998] text-sm text-[var(--cText)]
	font-family: 'Maple Mono NF CN', 'Cascadia Code', 微软雅黑

	[style-button]
		@apply select-none cursor-pointer filter ring-[var(--cMain)]
		&:hover, &[hovered]
			@apply brightness-110 ring-1
		&:active, &[actived]
			@apply brightness-110 shadow-md ring-1
			@apply text-[var(--cTextMain)] bg-[var(--cMain)]

	p-open-button
		@apply fixed top-16 right-0 p-2
		@apply text-[var(--cTextMain)] bg-[var(--cMain)] rounded-l
		@apply cursor-pointer select-none

	p-main-box
		@apply fixed block top-16 right-[-2px] p-2 max-h-[calc(100vh-5rem-2vh)]
		@apply bg-[var(--cBack)] rounded-l-md shadow-md
		@apply border-2 border-[var(--cMain)] overflow-auto

		p-main
			@apply block pb-2

			p-main-title
				@apply inline-block pr-8 text-base font-semibold text-[var(--cMain)] select-none

			p-main-button
				@apply float-right ml-2 px-2 rounded
				@apply text-xs leading-6 bg-[var(--cBack)]

		details[panel], p-panel
			@apply block select-none my-1 max-h-64 overflow-auto

			summary
				@apply sticky top-0 z-1
				@apply w-full elli cursor-pointer bg-[var(--cBack)]
				&::marker
					content: "+ "
					@apply font-bold text-[var(--cMain)]
			&[open]
				summary
					@apply mb-1
					&::marker
						content: "- "
						@apply font-bold text-[var(--cMain)]

			[select-grid]
				@apply text-right relative w-[calc(100%-4px)] left-[2px]
				tr
					@apply h-[calc(1rem+2px)] leading-normal rounded-sm
				th, td
					@apply px-4 text-right

			p-function-button
				@apply inblock px-2 py-0.5 mr-2 rounded text-[var(--cTextMain)] bg-[var(--cMain)]
				svg
					@apply w-4
			p-switch-button
				@apply inblock my-0.5 mr-2 cursor-pointer
				p-label
					@apply inblock w-auto px-2 py-0.5 border border-r-0 rounded-l border-[var(--cGary)]
				p-value
					@apply inblock float-right px-2 py-0.5 border rounded-r border-[var(--cMain)] text-[var(--cTextMain)] bg-[var(--cMain)]

			p-progress-info
				@apply block mb-1 leading-5
				p-text
					@apply inblock py-0.5

			progress
				@apply appearance-none w-full h-4
				&::-webkit-progress-bar
					@apply bg-[var(--cGary)]
				&::-webkit-progress-value
					@apply bg-[var(--cMain)]
				&[okay]::-webkit-progress-value
					@apply bg-[var(--cOkay)]
				&[fail]::-webkit-progress-value
					@apply bg-[var(--cFail)]
</style>
