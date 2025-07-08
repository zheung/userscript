<template>
	<p-fetch-manager>
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
				<details v-if="panel.type == 'select-grid'" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer" :title="$values[panel.keyValue]">{{ panel.title }} 已选: {{ $values[panel.keyValue] }}</summary>
					<table select-grid>
						<tr>
							<th v-for="head of panel.heads" :key="head.id || head.key">{{ head.text }}</th>
						</tr>
						<template v-for="option of panel.options" :key="panel.handle.getOptionKey(option)">
							<tr
								style-button
								:actived="brop($values[panel.keyValue] == panel.handle.getOptionKey(option))"
								@click="$values[panel.keyValue] = panel.handle.getOptionKey(option)">
								<template v-for="head of panel.heads" :key="head.id || head.key">
									<td :title="option[head.keyTitle]">{{ option[head.key] }}</td>
								</template>
							</tr>
						</template>
					</table>
				</details>
				<details v-if="panel.type == 'functions'" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer">{{ panel.title }}</summary>

					<template v-for="func of panel.functions" :key="func.id">
						<p-function-button v-if="func.type == 'button' || !func.type" style-button @click="func.handle(states)">
							<Icon v-if="func.icon" :icon="func.icon" />{{ func.text }}
						</p-function-button>
					</template>
				</details>
				<details v-if="panel.type == 'configs'" :open="brop(!panel.closedDefault)">
					<summary class="cursor-pointer">{{ panel.title }}</summary>

					<template v-for="config of panel.configs" :key="config.key">
						<p-switch-button v-if="config.type == 'switch-button'"
							:style="{ width: config.width || 'fit-content' }"
							:title="$handlesDefault.apply(config, 'showValuesText')"
							@click="$handlesDefault.apply(config, 'clickSwitchButton', 'click')">
							<p-label>{{ config.label }}</p-label>
							<p-value>
								{{ $handlesDefault.apply(config, 'showValueText') }}
							</p-value>
						</p-switch-button>
					</template>
				</details>
			</template>
		</p-main-box>
	</p-fetch-manager>
</template>

<script>
import { ref } from 'vue';



export const $openedPanel = ref(false);
export const $pinnedPanel = ref(GM_getValue('default-pinnedPanel', false));
export const $panels = ref([]);
export const $widthPanel = ref('480px');
export const $willStorageValue = ref(false);

export const $values = ref({
	video: null,
	audio: null,
	hiddenInvalidFormat: false,
	hiddenInvalidFormat1: 3,
});

const states = { $openedPanel, $pinnedPanel, $panels, $widthPanel, $willStorageValue, $values };

export const $handlesDefault = {
	apply(config, key, keyConfig) { return config[keyConfig ?? key] ? config[keyConfig ?? key](config, states, $handlesDefault[key]) : $handlesDefault[key](config, states); },

	showValuesText(config) {
		const { options } = config;

		return `选项：${options.map(option => option.text).join(' | ')}`;
	},
	showValueText(config) {
		const { key, options } = config;

		return options.find(option => option.value === $values.value[key])?.text ?? $values.value[key] ?? '';
	},
	clickSwitchButton(config, willReturnOption = false) {
		const { key, options } = config;

		const indexNow = options.findIndex(option => option.value === $values.value[key]);
		const indexNext = indexNow < options.length - 1 ? indexNow + 1 : 0;

		const option = options[indexNext];
		const valueNow = $values.value[key] = option.value;

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

	--cBase: #00AEEC
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
	font-family: 'Cascadia Code'

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
		@apply bg-[var(--cBack)] rounded-l-md shadow-mdd
		@apply border-2 border-[var(--cMain)] overflow-auto

		p-main
			@apply block pb-2

			p-main-title
				@apply inline-block pr-8 text-base font-semibold text-[var(--cMain)] select-none

			p-main-button
				@apply float-right mr-2 px-2 rounded
				@apply text-xs leading-6 bg-[var(--cBack)]

		details
			@apply block select-none mb-2 max-h-64 overflow-auto

			summary
				@apply sticky top-0 z-1
				@apply w-full mb-2 elli cursor-pointer bg-[var(--cBack)]
				&::marker
					content: "○ "
			&[open]
				summary::marker
					content: "● "

			[select-grid]
				@apply mb-2 text-right relative w-full
				tr
					@apply h-[calc(1rem+2px)] rounded-sm
				th,td
					@apply leading-4 px-4 text-right

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

</style>
