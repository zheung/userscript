import { C } from '@nuogz/pangu/index.js?config=_';

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { rollup } from 'rollup';
import pluginSCSS from 'rollup-plugin-scss';
import { string as pluginString } from 'rollup-plugin-string';
import { nodeResolve as pluginNodeResolve } from '@rollup/plugin-node-resolve';
import pluginReplace from '@rollup/plugin-replace';
import pluginCommonjs from '@rollup/plugin-commonjs';

import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssPrefixSelector from 'postcss-prefix-selector';
import tailwindcss from 'tailwindcss';
import plugin$Tailwind from 'tailwindcss/plugin.js';



if('2' in process.argv == false) { throw Error('缺少目标脚本参数'); }


const cwd = process.cwd();
const fileInput = process.argv[2];
const pathInput = resolve(cwd, fileInput);
const infoInput = parse(pathInput);

const pathOutput = resolve(C.dirDist, infoInput.base);


globalThis.console.log('目标脚本', infoInput.base);


const bundle = await rollup({
	input: pathInput,
	plugins: [
		pluginSCSS({
			output: false,
			indentedSyntax: true,
			processor: () => postcss([
				tailwindcss({
					content: ['./src/**/*.sass'],
					theme: {
						extend: {
							boxShadow: {
								mdd: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
							},
						},
						trans: {
							DEFAULT: '0.2s',
							'04': '0.4s',
							'07': '0.7s',
							2: '2s',
						},
					},
					plugins: [
						plugin$Tailwind(({ addUtilities, matchUtilities, theme }) => {
							addUtilities({
								// inblock = inline-block + top vertical align
								'.inblock': {
									display: 'inline-block',
									verticalAlign: 'top',
								},

								// text ellipsis
								'.elli': {
									overflow: 'hidden',
									whiteSpace: 'nowrap',
									textOverflow: 'ellipsis',
								},
							});

							// animation
							matchUtilities(
								{
									trans: duration => ({
										transitionProperty: 'all',
										transitionDuration: duration,
										transform: 'translateZ(0)',
									}),
								},
								{ values: theme('trans') }
							);

							// line height with border
							matchUtilities(
								{
									'lead-b1': size => ({ 'line-height': `calc(${size} - 1px * 2)` }),
									'lead-b2': size => ({ 'line-height': `calc(${size} - 2px * 2)` }),
									'lead-b4': size => ({ 'line-height': `calc(${size} - 4px * 2)` }),
								},
								{ values: theme('lineHeight') }
							);
						}),
					],
				}),
				postcssPrefixSelector({
					prefix: `danor-${infoInput.name.replace('.user', '')}`,
					transform: (prefix, selector, prefixedSelector) =>
						['html', 'body'].includes(selector) ? prefix : prefixedSelector
				}),
				autoprefixer({}),
			]),
		}),
		pluginString({
			include: '**/*.html',
		}),
		pluginNodeResolve(),
		pluginCommonjs(),
		pluginReplace({
			'preventAssignment': true,
			'process.env.NODE_ENV': JSON.stringify('production'),
		})
	]
});

const output = await bundle.write({ file: pathOutput, format: 'esm', generatedCode: 'es2015', inlineDynamicImports: true });


if(output.output.length) {
	// 出现因上一段代码不规范，导致两段代码连在一起的情况，故追加换行符到文件头中
	writeFileSync(pathOutput, '\n' + readFileSync(pathOutput, 'utf-8'));

	spawnSync(C.pathChrome, [pathOutput]);
}
