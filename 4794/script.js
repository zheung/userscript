// ==UserScript==
// @name         Bangumi.tv(Bangumi 番组计划) HomePage Anime Chinese-Name Shower
// @description  Bangumi.tv(Bangumi 番组计划)-首页-动画-中文名称-显示-不智能
// @version      0.4.1501271259
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
//	15年01月番
	"ぱんきす!2次元":"PUNKISS！2次元",
	"みんな集まれ! ファルコム学園 SC":"大家集合！Falcom学园 第二季",
	"デス・パレード":"死亡游行",
	"戦国無双":"战国无双",
	"ISUCA":"ISUCA 依丝卡",
	"聖剣使いの禁呪詠唱":"圣剑使的禁咒咏唱",
	"夜ノヤッターマン":"夜之小双侠",
	"黒子のバスケ 第3期":"黑子的篮球 第三季",
	"純潔のマリア":"纯洁的玛利亚",
	"DOG DAYS''":"DOG DAYS 第三季",
	"アルドノア・ゼロ 第2期":"ALDNOAH ZERO 第二季",
	"暗殺教室":"暗杀教室",
	"ジョジョの奇妙な冒険 スターダストクルセイダース エジプト編":"JOJO的奇妙冒险 星尘斗士 埃及篇",
	"アイドルマスター シンデレラガールズ":"偶像大师 灰姑娘女孩",
	"血液型くん!2":"血型君 第二季",
	"銃皇無尽のファフニール":"铳皇无尽的法夫纳",
	"幸腹グラフィティ":"幸腹涂鸦",
	"冴えない彼女の育てかた":"路人女主的养成方法",
	"東京喰種トーキョーグール √A":"东京食尸鬼√A",
	"新妹魔王の契約者":"新妹魔王的契约者",
	"艦隊これくしょん -艦これ-":"舰队Collection",
	"みりたり!":"军人少女",
	"神様はじめました◎":"元气少女缘结神◎",
	"ユリ熊嵐":"百合熊岚",
	"アブソリュート・デュオ":"绝对双刃",
//	14年10月番
	"暁のヨナ":"拂晓的尤娜",
	"ワールドトリガー":"境界触发者",
	"七つの大罪":"七大罪",
	"失われた未来を求めて":"寻找失去的未来",
	"クロスアンジュ 天使と竜の輪舞":"天使与龙的轮舞",
	"牙狼〈GARO〉-炎の刻印-":"牙狼GARO 炎之刻印",
	"寄生獣 セイの格率":"寄生兽",
	"四月は君の嘘":"四月是你的谎言",
	"PSYCHO-PASS サイコパス 2":"心理测量者 第二季",
	"SHIROBAKO":"白箱",
	"ログ・ホライズン 第2シリーズ":"记录的地平线 第二季",
	"弱虫ペダル GRANDE ROAD":"飙速宅男 GRANDE ROAD",
//	长篇
	"ドラゴンボール改 魔人ブウ編":"龙珠改 魔人布欧篇",
	"FAIRY TAIL 新シリーズ":"妖精的尾巴 第二期",
	"美少女戦士セーラームーンCrystal":"美少女战士 Crystal",
	"ONE PIECE":"海贼王",
//	旧番
	"ツバサ・クロニクル 第2シリーズ":"翼·年代记 第二部"
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