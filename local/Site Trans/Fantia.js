let dictTrans = {
	'.globalnav-primary': {
		'とらのあな': '虎之穴',
		'インフォ': '信息',
		'店舗': '店铺',
		'通販': '邮购',
		'ファンティア': 'Fantia',
		'イラスト展': '展览',
		'電子書籍': '电子书',
		'古物': '中古物',
		'イベント取置': '活动寄存',
		'グッズ製作': '周边制作',
		'同人誌印刷': '同人志印刷',
		'とら婚': '虎婚',
		'サークルポータル': '圈子传送',
		'キャリア採用': '职业介绍',
		'アルバイト': '兼职',
	},
	'.breadcrumb': {
		'ファンティア': 'Fantia',
		'さんと': '',
		'さん': '',
		'プロフィール': '档案',
		'の': '的',
		'ファン': '用户',
		'バックナンバー': '旧刊',
	},
	'span.name': {
		'ランキング': '排名',
		'お知らせ': '通知',
		'メッセージ': '消息',
		'お気に入り': '收藏',
		'カート': '购物车',
		'FC開設': '创建FC',
		'アカウント': '帐户',
	},
	'.coin-widget': {
		'Fantiaコイン残高': 'Fantia币余额',
	},
	'.tab-item-text': {
		'ホーム': '主页',
		'プラン': '计划',
		'ファン': '用户',
		'バックナンバー': '旧刊',
		'メッセージ': '消息',
	},
	'': {
		'': '',
	},
}

for(let xPath in dictTrans) {
	if(!xPath) {
		continue;
	}

	let elementList = document.querySelectorAll(xPath);
	let dict = dictTrans[xPath];

	for(let element of elementList) {
		let html = element.innerHTML;

		for(let fext in dict) {
			html = html.replace(new RegExp(fext, 'g'), dict[fext]);
		}

		element.innerHTML = html;
	}
}
