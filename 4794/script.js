// ==UserScript==
// @name         Bangumi.tv(Bangumi 番组计划) HomePage Anime Chinese-Name Shower
// @description  Bangumi.tv(Bangumi 番组计划)-首页-动画-中文名称-显示-不智能
// @version      0.4.1411231215
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      http://bangumi.tv/
// @include      http://bgm.tv/
// ==/UserScript==

//替换数据
var wordsName =
{
//	"":"",
//	14年10月番
	"牙狼〈GARO〉-炎の刻印-":"牙狼GARO 炎之刻印",
	"selector spread WIXOSS":"选择扩散者",
	"魔弾の王と戦姫":"魔弹之王与战姬",
	"テラフォーマーズ":"火星异种",
	"寄生獣 セイの格率":"寄生兽",
	"四月は君の嘘":"四月是你的谎言",
	"PSYCHO-PASS サイコパス 2":"心理测量者 第二季",
	"棺姫のチャイカ AVENGING BATTLE":"棺姬嘉依卡 第二季",
	"Hi☆sCoool! セハガール":"世嘉硬件女孩",
	"トリニティセブン 7人の魔書使い":"七人魔法使",
	"暁のヨナ":"晨曦公主",
	"異能バトルは日常系のなかで":"日常系的异能战斗",
	"ガールフレンド(仮)":"临时女友",
	"SHIROBAKO":"白箱",
	"俺、ツインテールになります。":"我，要成为双马尾",
	"ログ・ホライズン 第2シリーズ":"记录的地平线 第二季",
	"甘城ブリリアントパーク":"甘城光辉游乐园",
	"大図書館の羊飼い":"大图书馆的牧羊人",
	"繰繰れ! コックリさん":"银仙",
	"弱虫ペダル GRANDE ROAD":"飙速宅男 GRANDE ROAD",
	"旦那が何を言っているかわからない件":"关于完全听不懂老公在说什么的事",
	"愛・天地無用!":"爱·天地无用!",
	"デンキ街の本屋さん":"电器街的漫画店",
//	14年07月番
	"PSYCHO-PASS サイコパス 新編集版":"心理测量者 新编集版",
	"ソードアート・オンラインII":"刀剑神域 第二季",
	"白銀の意思 アルジェヴォルン":"白银的意志",
	"アカメが斬る!":"斩·赤红之瞳!",
	"フランチェスカ":"法兰雀丝卡",
	"ヤマノススメ セカンドシーズン":"向山进发 第二季",
//	长篇
	"ドラゴンボール改 魔人ブウ編":"龙珠改 魔人布欧篇",
	"FAIRY TAIL 新シリーズ":"妖精的尾巴 第二期",
	"美少女戦士セーラームーンCrystal":"美少女战士 Crystal",
	"ONE PIECE":"海贼王"
};
//替换代码
var as = document.querySelectorAll("div.tinyHeader>a:nth-of-type(2)");
var spans = document.querySelectorAll("li.clearit[subject_type=\"2\"]>a.subjectItem.title>span");
var as2 = document.querySelectorAll("div.clearit[subject_type=\"2\"]>div.header.clearit>div.headerInner>h3>a.l");

for(i=0; i<as.length; i++)
	if(wordsName[as[i].innerHTML])
	{
		as[i].innerHTML = wordsName[as[i].innerHTML];
		spans[i].innerHTML = wordsName[spans[i].innerHTML];
		as2[i].innerHTML = wordsName[as2[i].innerHTML];
	}