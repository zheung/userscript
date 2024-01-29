// ==UserScript==
// @name        fantia-post-save
// @description 2024.01.28.15
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       none
// @match       *://fantia.jp/posts/*
// ==/UserScript==

import { saveFile } from './lib/util.js';
import FetchManager from './lib/fetch-manager.js';
import Logger from './lib/logger.js';



const G = new Logger(GM_info.script.name);



try {
	const idPost = Number(location.pathname.split('/')[2]);
	const tokenCSRF = document.querySelector('meta[name="csrf-token"]').content;


	const { post } = await (await fetch(`https://fantia.jp/api/v1/posts/${idPost}`, {
		credentials: 'include',
		headers: {
			'x-csrf-token': tokenCSRF,
			'x-requested-with': 'XMLHttpRequest',
		}
	})).json();


	const files = [];

	const postFine = {
		id: post.id,
		title: post.title,
		comment: post.comment,
		thumbnail: post.thumb?.original,
		timePost: new Date(post.posted_at).getTime(),
		rating: post.rating,
		fanclub: {
			id: post.fanclub.id,
			name: post.fanclub.name,
			title: post.fanclub.title,
			comment: post.fanclub.comment,
			cover: post.fanclub.cover.original,
			icon: post.fanclub.icon.original,
		},
		user: {
			id: post.fanclub.user.id,
			name: post.fanclub.user.name,
			header: post.fanclub.user.image.lagre,
		},
		contents: post.post_contents.map(raw => {
			const content = {
				id: raw.id,
				title: raw.title,
				type: raw.category,
				statePublish: raw.published_state,
				comment: raw.comment,
			};

			if(content.type == 'file') {
				content.nameFile = raw.filename;

				files.push({
					name: `fantia@${post.fanclub.id}@${post.id}@content@${content.id}@${raw.filename}`,
					url: raw.download_uri,
				});
			}
			else if(content.type == 'photo_gallery') {
				content.galleries = [];

				for(const photoRaw of raw.post_content_photos) {
					const url = new URL(photoRaw.url.original);
					const nameFile = url.pathname.split('/').pop();

					files.push({
						name: `fantia@${post.fanclub.id}@${post.id}@content@${content.id}@${photoRaw.id}@${nameFile}`,
						url: photoRaw.url.original,
					});

					content.galleries.push({ id: photoRaw.id });
				}
			}
			else if(content.type == 'blog') {
				try {
					content.comment = JSON.parse(content.comment);

					for(const op of content.comment.ops) {
						const image = op.insert?.fantiaImage;

						if(!image || !image.original_url) { continue; }

						const url = new URL(location.origin + image.original_url);
						const nameFile = url.pathname.split('/').pop();

						files.push({
							name: `fantia@${post.fanclub.id}@${post.id}@content@${content.id}@blog-image@${image.id}@${nameFile}`,
							url: image.original_url,
						});
					}
				}
				catch(error) {
					document.title = `✖ ${document.title}`;
					alert(`parse blog comment error: ${error?.message ?? error}`);
				}
			}
			else if(content.type == 'text') {
				void 0;
			}
			else if(content.type == 'product') {
				content.product = {
					id: raw.product.id,
					name: raw.product.name,
				};
			}
			else {
				document.title = `!! ${document.title}`;
				alert(`new content type: ${content.type}`);
			}


			return content;
		}),
		files,
	};

	if(post.blog_comment != post.comment) { G.warn('post.blog_comment != post.comment'); }

	setTimeout(() => document.querySelector('h1.post-title').innerText = `${postFine.id}-${postFine.title}`, 1000 * 10);

	if(postFine.thumbnail) {
		files.push({
			name: `fantia@${post.fanclub.id}@${post.id}@thumbnail@${new URL(postFine.thumbnail).pathname.split('/').pop()}`,
			url: postFine.thumbnail,
		});
	}

	saveFile(
		URL.createObjectURL(new Blob([new TextEncoder().encode(JSON.stringify(postFine, null, '\t'))], { type: 'application/json;charset=utf-8' })),
		`fantia@${post.fanclub.id}@${post.id}@meta.json`
	);


	G.info('文件数量', files.length);


	const FM = new FetchManager();

	await FM.create(files, async file => {
		await new Promise(r => setTimeout(r, 1000 * 2));


		const response = await fetch(file.url);

		saveFile(URL.createObjectURL(await response.blob()), file.name);


		G.info(file.name, '✔');
	}, 3);


	G.info('done');
	document.title = `✔ ${document.title}`;
}
catch(error) {
	document.title = `✖ ${document.title}`;
	alert(`script error: ${error?.message ?? error}`);
}
