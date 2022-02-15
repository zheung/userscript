const dictTrans = `
>select:.g2, .g3
Report Gallery:报告画廊
Archive Download:存档下载
Torrent Download:种子下载
Petition to Expunge:请求隐藏
Petition to Rename:请求重命名
Multi-Page Viewer:多页浏览器

>select:#taglist .tc
language:语言
parody:作品
character:角色
group:社团
artist:作者
female:女性
male:男性
misc:其他
reclass:新分类

>select:.gt>a, .gtl>a, .gtw>a
# 画廊分类
chinese:中文
english:英文
spanish:西班牙文
translated:已翻译
group:合集
tankoubon:单行本
original:原创
uncensored:无修正
full color:全彩
mosaic censorship:马赛克修正
multi-work series:多卷连载
non-nude:无裸体
variant set:差分合集

## 表现手法
x-ray:透视


# 行为、动作

## 双人行为、体位
pegging:逆肛交
footjob:足交
assjob:臀交
anal intercourse:肛交
anal:插肛
blowjob:口交
handjob:手交
fisting:拳交
paizuri:乳交
clothed paizuri:衣服乳交
multiple paizuri:多重乳交
tribadism:磨豆腐
spanking:打屁股
cbt:下体责罚
enema:浣肠
foot licking:舔足
nipple fuck:乳头交
brain fuck:脑交
facesitting:颜面骑乘
prostate massage:前列腺按摩
rimjob:舔肛
kissing:接吻
parasite:寄生
bondage:捆绑
electric shocks:电击
shibari:绳艺
sumata:素股
wrestling:摔跤

##行为细节
wormhole:虫洞交
nakadashi:中出
sleeping:睡奸
large insertions:扩张插入
double penetration:双重插入
urethra insertion:尿道插入

bestiality:兽交
low bestiality:轻度兽交

## 单人行为
masturbation:自慰
table masturbation:磨台角
anal birth:肛交产出
scat:排粪
eggs:产卵
urination:放尿
farting:放屁

# 关系
femdom:女主调教
rape:强暴
incest:乱伦
prostitution:卖淫
harem:后宫

## 性别关系
ffm threesome:女女男
mmt threesome:男男妖
females only:只有女性
dickgirls only:只有扶她
dickgirl on dickgirl:扶她日扶她
dickgirl on male:扶她日男生
male on dickgirl:男生日扶她
sole dickgirl:只有扶她
sole dickgirl:只有人妖
sole male:单男
sole female:单女
yuri:百合
lesbians:百合
yuri | lesbians:百合



# 场景、物品
sex toys:性玩具
strap-on:假阴茎
machine:机械
gag:口球
tentacles:触手

## 人体产物
smegma:包皮垢
lactation:母乳

## 剧情物品
blackmail:威胁信


# 角色

## 角色特征
milf:熟女
oppai loli:巨乳萝莉
lolicon:萝莉控
sister:姐妹
twins:双胞胎
shotacon:正太
tomgirl:女性化男
futanari:扶她
shemale:人妖
twintails:双马尾
small breasts:贫乳
big breasts:巨乳
huge breasts:豪乳
gigantic breasts:爆乳
wings:翅膀
tail:尾巴
kemonomimi:兽耳
dark skin:黑皮肤
inverted nipples:凹乳
dark sclera:黑眼膜
onahole:人工阴道
unusual pupils:奇怪的瞳孔
beauty mark:美人痣
hairy:阴毛

## 着装
masked face:蒙面
blindfold:蒙眼
bodystocking:全身裤袜
bodysuit:全身服装
leotard:舞蹈紧身衣
gloves:手套
stockings:丝袜
latex:橡胶
pantyhose:裤袜
business suit:职业装
school swimsuit:学校泳衣
swimsuit:泳衣
hotpants:热裤
bikini:比基尼
glasses:眼镜
schoolgirl uniform:校服
garter belt:吊带袜
lingerie:性感内衣
kimono:和服
corset:塑腰
eyemask:眼罩
eyepatch:单眼带
thigh high boots:过膝靴
chastity belt:贞操带

## 角色
maid:女仆
teacher:教师
policewoman:女警
gothic lolita:哥特萝莉
slave:奴隶
witch:女巫
miko:巫女

## 物种
minigirl:迷你娘

angel:天使
fairy:妖精
zombie:僵尸
oni:日本鬼

monoeye:独眼娘
mermaid:人鱼
catgirl:猫娘
fox girl:狐娘
wolf girl:狼娘
snake girl:蛇娘
bunny girl:兔娘
frog girl:青蛙娘
plant girl:植物娘
insect girl:昆虫娘
slime girl:史莱姆娘

alien girl:外星娘
demon girl:恶魔娘
monster girl:怪物娘
giantess:巨大娘

draenei:德莱尼
harpy:哈比

## 状态
virginity:破处
defloration:破处出血
cervix penetration:子宫颈突破
ahegao:阿黑颜
blowjob face:口交颜
impregnation:受精
sweating:流汗
pregnant:怀孕
gaping:事后扩张
prolapse:垂脱
drunk:醉
feminization:女性化
inflation:胃膨胀
cumflation:精液满腹
mind break:精神崩坏
stomach deformation:胃突出
dick growth:阴茎强勃
crossdressing:变装
petrification:石化
amputee:截肢
tanlines:晒痕
crotch tattoo:淫纹
smell:剧臭

## 性格
bisexual:双性恋
humiliation:耻辱
exhibitionism:暴露狂
`
	.split('\n')
	.reduce((dict, line) => {
		line = line.trim();

		if(line.startsWith('#')) { return dict; }
		else if(line.startsWith('>select:')) {
			dict[line.replace('>select:', '')] = dict._now = [];
		}
		else if(line) {
			dict._now.push(line.split(':').map(str => str.trim()));
		}

		return dict;
	}, {});
delete dictTrans._now;

for(const xPath in dictTrans) {
	dictTrans[xPath]
		.sort((a, b) => {
			return b[0].length - a[0].length || b[0] - a[0];
		});

	document.querySelectorAll(xPath).forEach(element =>
		element.innerHTML = dictTrans[xPath]
			.reduce(
				(pre, [fext, trans]) => pre.replace(new RegExp(fext, 'g'), trans),
				element.innerHTML
			));
}
