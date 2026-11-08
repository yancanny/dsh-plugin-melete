// Melete 的浏览器半侧：左边栏入口 + 主面板（主页、复盘卡片、设置）。
// 手写的 DSH 客户端模块格式：向页面的模块加载器登记包名和一个 factory(require)。
// 不需要打包工具；改完 DSH 会自动重新载入。
window.__ModuleLoader__.load({
  id: 'dsh-plugin-melete',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useSyncExternalStore, useMemo } = React

    const PANEL_ID = 'melete'
    const NS = 'melete'
    const API = '/melete'
    const REPO_URL = 'https://github.com/yancanny/dsh-plugin-melete'

    // ---------- 用语 ----------
    // 左边栏只放各语言自己的"复盘"一词；点进去才显示"Melete + 这个词"。Melete 不翻译。
    const TERMS = { zh: '复盘', en: 'Debrief', ja: '感想戦', es: 'Análisis', fr: 'Débrief', de: 'Nachlese', ru: 'Разбор', pt: 'Análise' }
    const LANGUAGE_NAMES = { zh: '中文', en: 'English', ja: '日本語', es: 'Español', fr: 'Français', de: 'Deutsch', ru: 'Русский', pt: 'Português' }

    const zh = {
  loading: '正在打开……',
  tagline: '看看这段时间，你和 AI 是怎么一起做事的。',
  intentionLabel: '这段时间你在意什么？',
  intentionHint: '可以不填。写了意图，复盘才会给出小实验。',
  intentionPlaceholder: '你希望复盘时更看重什么？可以在这里告诉我。此处可以不填写。',
  chips: '想更高效|想学会新东西|想保住自己的文风|想让交出去的东西更可靠|只是想看看',
  rangeLabel: '回看',
  r7: '7 天', r30: '30 天', r90: '90 天', r365: '1 年', rAll: '全部', rCustom: '手选日期',
  rFrom: '从', rTo: '到',
  'error.bad-range': '日期范围不对，请检查起止日期。',
  rangeAllHint: '记录很多时，会沿时间均匀抽取，让前后各段都有代表。',
  settingsMore: '更多',
  changelogBtn: '更新日志', philosophyBtn: 'Melete 理念', letterBtn: '制作者给你的信',
  back: '返回设置',
  changelogTitle: '更新日志',
  changelogSub: "第1版 · 2026 年 11 月 8 日",
  changelogItems: "## 复盘|DSH 左边栏多了一个“复盘”：只读本机会话，照见你和 AI 是怎么一起做事的；不评分、不排名、不上报。|主页一句话说明，正中是“开始复盘”；当前回看范围与所用模型随时看得见。|意图输入默认展开，可以写下这段时间在意什么，也可以点一句现成的短语；写了意图，复盘才会给出针对它的小实验。|回看范围有 7 天、30 天、90 天、1 年、全部、手选日期与按年份；默认按 3 月 1 日跨年切换，1—2 月默认上一年，记录太多时沿时间均匀抽取。|一次复盘三步走：读取本机记录 → 你选的模型书写 → 装订成卡片；通常一两分钟，可以先去做别的事。|复盘请求由插件直接发给你在 DSH 里选的模型，不新建会话，也不会出现在会话记录里。|## 卡片|一次复盘是一叠卡片：封面写清这次的范围与“谁在看谁”，下面分人用 AI、AI 对你、与社会、本心四个方向。|每面镜子先给一小段正文，出处与当时的考量折叠在后面；每条观察至少给两种读法，看不清就说看不清。|出处可以点开“查看对话原文及上下文”，就地读到当时的脱敏原话，不必回去翻会话。|正文里的核心判断用温暖荧光笔标出，再配一两枚特性胶囊，一眼看清你最近的协作习惯。|AI 这一侧、与外面的往来、一个问题各自成卡；每面镜子末尾还有一句契合当时情境的古国名言。|“本心”是一封封存的信：默认收起，暂不生成内容，留给之后的版本打开。|复盘记录里能翻看以前的复盘、删除单期；每份复盘同时存成 JSON 与 Markdown，旧复盘尽量保持可打开。|每次复盘结束显示本次 token 消耗与按所选模型预估的花费，本机计算，不联网。|## 众声|主页右侧是“众声 · 对话摘录”：多位 AI 与朋友对四个问题的回答，一问一卡，双列缓缓滚动，悬停暂停，点击读全文。|也能添加自己的对话摘录卡片：只存在本机，保存前有一份隐私自查清单。|## 你的新世界|“你的新世界：抢先预览”有新疆风景轮播，也有精选的开源 AI 工作流与 Skill 推荐，并按你最近的协作习惯标出“和你最近的做法相近”。|每张推荐卡都写着简介、契合原因、仓库、许可与可直接打开的出处；照片和推荐都随插件本地打包，运行时不上网。|页面老实说：这块地还在长，是以后方法地图的雏形。|## 分享|“分享我的复盘”默认已经排好版：明信片式预览，可切浅色或深色，可换正方形、卡片、竖版或长图尺寸。|不想要的版块或句子，移上去点一下就能藏起来；文字也能就地改。|一键复制图片、复制配文、保存长图或 HTML；完整复盘也能导出成一份 HTML。|分享里不放本心，也会避开可识别的项目名、会话出处与编号；没有社交平台按钮，也不催你分享。|## 外观|八种古文明外衣：古希腊、中国古代、古巴比伦、古印度、古埃及、古罗马、玛雅、印加，各有配色、天色、徽记、编号、装饰与页角引文。|背景是用代码画的天地山水和建筑线描：在复盘记录里往下滑，建筑一笔一笔长出来；日月、云、人物与动物会跟鼠标互动，古国名言像弹幕一样轻轻掠过。|默认按地区挑风格，也可以固定一种；“偶尔换一换”时，一半机会露出你本地的文明，一半从其余文明里随机。|明暗跟随 DSH 或手动切；字体、减少动效都跟随 DSH 与系统；小屏、键盘操作与读屏标签也照顾到了。|## 语言|界面八种语言全量覆盖：简体中文、English、日本語、Español、Français、Deutsch、Русский、Português；众声、推荐、分享文案、名言与设置都会跟着换。|复盘正文用你当时的界面语言来写；左边栏名称跟着 DSH 的语言走，点进去标题是“Melete”加上各语言自己的那个词。|## 隐私与数据|只取你亲手写的话；邮箱、电话、密钥先在本地替换掉，再交给你自己选的模型。不联网、不上报、不运营服务器，也没有任何遥测。|复盘与设置只存在 ~/.melete/，设置页能看到位置，也能随时删除单期或全部数据。|失败时只在本机记长度、结束原因这类数字，不记内容；旧数据、缺字段、断线重试都有对应的降级与提示。|## 设置与文档|设置里有语言、外观、默认回看、隐私说明、数据位置与一键删除，以及关于（版本、照见图谱版本、许可）。|内置“Melete 理念”（相对稳定 / 还在想 / 目标 / 写在前面的话）、“制作者给你的信”和这份更新日志。|这一版是 0.1.1 Telos Ultra，照见图谱 0.4.0；代码 Apache-2.0，照见图谱 CC BY 4.0。",
  philosophyTitle: 'Melete 理念',
  philosophySub: '回看你和 AI 是怎么一起做事的。',
  philosophyStableTitle: '相对稳定',
  philosophyStableItems: '照见：让你的用法被看见。|好坏由你定义：不预设“好用户”的标准；建议只对照你自己说过的目标，你没说过，就只呈现、不建议。|每句话都有出处：每个观察都能追溯到具体的对话，并给出至少两种读法；看不清就说看不清。|AI 也在镜子里：不只照你，也照 AI 待你的方式。|本地优先：Melete 不运营服务器，不收集任何数据，不联网。你的记录只交给你自己正在用的 AI，复盘开头会写明是谁在看。|写给你自己的信不外传：默认收着，不存盘，永远不进分享。|随时可退出：说一声，就删除 Melete 生成的全部文件。|不做“查看他人数据”：Melete 只给你看你自己。',
  philosophyThinkingTitle: '还在想',
  philosophyThinkingItems: '不评判：现在 Melete 不评判。将来如果大家一起总结出公认的好做法，可能会作为参照加进来，用不用由你选。|分享卡上的数字：现在允许出现“312 段对话”这样的数字，以后再看。|“与社会”这一面：看你们的产出走向哪里、碰到谁。看的范围和说法可能还要收一收。|写给你自己的信：AI 能对你做多少猜测（尤其是情绪与健康），怎么打开、怎么保存，都还在调整。|云同步和账号：现在不做，将来再议。|照见图谱：维度的数量和名字还会调整。|许可：将来的版本可能调整，已经发布的版本不变。',
  philosophyGoalTitle: '目标',
  philosophyGoalText: '让社会整体尽可能幸福，也让尽可能多的人幸福。Melete 走向它的方式只有一种：照见。看得清、选得了的人多了，世界会更好一点。',
  philosophyAuthorTitle: '写在前面的话',
  philosophyAuthorText: '实不相瞒，目前的 Melete 几乎凭我自己拍脑袋折腾出来，免不了带着极强烈的个人盲目和偏执。往后我难保不对它下狠手、搞几次彻底的“破坏性大修”，但我还没混账到把梯子全抽了，该垫的软着陆和旧兼容其实做了一部分。真理不在我兜里，我特别想听听五湖四海有趣的人怎么骂它、改它，大家一起敲敲打打，这东西才不至于沦为一具自娱自乐的标本。\n\n每份复盘都会记下当时用的图谱版本，尽量让旧的复盘以后还能打开。\n\n欢迎在 Issues 里骂它、改它、提想法。',
  makerLetterTitle: '制作者给你的信',
  makerLetterSub: '写在喧嚣浪潮里',
  makerLetterBody: '你好，欢迎来到 Melete。|世界上有两种镜子：一种是游乐场里的哈哈镜，把你照得又高又体面，专门逗人开心；另一种是清晨梳洗时的普通水银镜，冷冰冰的，连你昨夜没睡好的黑眼圈都照得一清二楚。|社交网络上的年终盘点大抵是前一种。但当我看到有人开始用冷静的眼光，去复盘一个人在 AI 面前展现出的思考习惯与工具素养时，我感到了一种久违的痛快——这才是尊重一个有智识的人该有的样子。|Melete 就诞生于这种不服气。我们不打算做任何装模作样的包装，只想把前沿的技能、清晰的方法，以及最重要的——你自己的思维痕迹，干干净净地摊在你面前。|我从不相信什么救世主似的技术狂潮，我只相信具体的、活生生的人。希望在这里，你能通过那些曾经敲下的字符，把自己的形状摸得更清楚一些；也希望这点微小的努力，能帮你在喧嚣的浪潮里，守住属于自己的自由与清醒。',
  makerLetterSign: 'Yan Canny · 2026 年 11 月 8 日',
  start: '开始复盘',
  privacyNote: '摘要只取你亲手写的话，邮箱、电话、密钥先在本地替换掉，再交给你在 DSH 里选的模型（{model}）来写。Melete 不联网、不上报，与外界的交互只与你自己配置的模型相关。',
  noModel: 'DSH 里还没有可用的模型，先在 DSH 里选一个模型。',
  run1: '读取本机记录', run2: '{model} 正在书写', run3: '装订成卡片',
  runHint: '通常要一两分钟。可以先去做别的事，回来再看。',
  'error.no-records': '这段时间没有找到你亲手输入的会话。换一个更长的时间范围再试试。',
  'error.no-model': 'DSH 里还没有可用的模型，先在 DSH 里选一个模型。',
  'error.empty-review': '模型这次没有写出镜子，可以再试一次。',
  'error.bad-output': '模型这次的回答没能整理成卡片，可以再试一次。',
  'error.busy': '已经有一次复盘在进行。',
  'error.generic': '这次复盘没有完成：{msg}',
  retry: '再试一次',
  navReviews: '复盘记录', navNew: '主页', navUltra: '你的新世界：抢先预览', navSettings: '设置',
  ultraTitle: '你的新世界',
  ultraKicker: '抢先预览',
  ultraSub: '根据你最近的协作习惯，挑了几个可能用得上的 AI 工作流和 Skill。它们都来自开源社区的公开项目，许可宽松，可以直接去出处看原文。',
  ultraRecKicker: '工作流与 Skill',
  ultraRecTitle: '适合你的 AI 方法',
  ultraFilterAll: '全部推荐',
  ultraMatchedBadge: '★ 和你最近的做法相近',
  ultraVisitLink: '前往出处 ↗',
  ultraRepoLabel: '开源仓库：',
  ultraAboutKicker: '写在前面',
  ultraAboutTitle: '关于这一页',
  ultraPara1Label: '关于现在的样子',
  ultraPara1: '这块地方还没正经完工，底下其实还是一片乱砖碎瓦。我总觉得，一个人光在屏幕前忙活是不够的，总该有一片属于自己的树林子，哪怕是拿代码和想法慢慢栽出来的。',
  ultraPara2Label: '关于 Melete',
  ultraPara2: '往后，Melete 想做的事挺简单：从你平时做事的野路子或正经习惯，在全世界的网兜里扒拉点趁手的家伙和好玩的技巧交给你。AI 要点起什么样的火星，还要看你自己的心意。若能帮你在生活里多看清一点、多学到一点，把日子过得更舒展些，Melete 的使命就达到了。',
  ultraPara3Label: '关于这片景色',
  ultraPara3: '背景里的林子取自中国新疆。山高水阔，风光极好。世界各地的朋友有空都来走走看看——现实世界里真实的草木与山川，总归比屏幕里的好看得多。',
  ultraCreditsKicker: '背景照片与许可',
  ultraCreditsTitle: '新疆风景照片来源',
  ultraCommonsLink: 'Wikimedia Commons 来源 ↗',
  ultraDotAria: '切换至照片 {n}',
  ultraResume: '▶ 继续轮播',
  ultraPause: '❚❚ 暂停轮播',
  ultraCurrent: '当前：{title}',
  usageExact: '本次消耗 {total} tokens（输入 {in} · 输出 {out}） · 按 {model} 预估花费约 {cost}（{code}）',
  usageEst: '本次消耗约 {total} tokens（输入约 {in} · 输出约 {out}） · 按 {model} 预估花费约 {cost}（{code}）',
  intentionOpen: '添加这段时间的意图（可选）',
  intentionFold: '收起意图',
  pastReviews: '以前的复盘',
  mirrors: '几面镜子',
  domainPos: '共 {n} 面',
  seen: '当时的情境',
  evidence: '出处',
  byYou: '你这边的考虑', byAi: 'AI 当时的表现与缘由', byThing: '事情本身的要求',
  readings: '出处与当时的考量',
  aiSide: 'AI 这一侧',
  noteToAi: '给 AI 的话',
  noteToAiHint: '如果愿意，可以把它粘贴进 AI 的自定义指令。',
  society: '与外面的往来',
  question: '一个问题',
  experiments: '针对意图的小实验',
  intentExpTitle: '针对你写下的意图给出的小实验',
  check: '下次看',
  letterTitle: '一封写给你自己的信',
  letterBody: '作者诚实地告诉你，这个地方没做好，也没想好，先不出。',
  notCovered: '这次没展开：{list}。想看哪一面，下次复盘时写进意图里。',
  lensFoot: '照见图谱 {v} · 由 {by} 来看',
  intentionShown: '你写下的意图',
  settingsLanguage: '语言', followDsh: '跟随 DSH',
  settingsStyle: '外观', styleAuto: '跟随地区', greek: '古希腊', chinese: '中国古代', babylonian: '古巴比伦', indian: '古印度', egyptian: '古埃及', roman: '古罗马', maya: '玛雅', inca: '印加',
  occasional: '偶尔换一换风格',
  settingsDays: '默认回看',
  settingsPrivacy: '隐私',
  privacyText: 'Melete 不联网、不上报，与外界的交互只与你自己配置的模型相关。复盘时，摘要交给你在 DSH 里选的模型来写，不经过任何会话，所以不会出现在会话记录里。',
  settingsData: '数据',
  dataText: '复盘和设置只存在 {dir}。',
  deleteAll: '删除全部数据',
  deleteConfirm: '确定删除 {dir} 下的全部复盘和设置吗？删除后无法恢复。',
  deleted: '已删除。',
  deleteThis: '删除这一期', deleteThisConfirm: '确定删除这一期复盘（{date}）吗？删除后无法恢复。',
  confirmDeleteBtn: '确认删除',
  confirmDeleteAllBtn: '确认清空全部数据',
  cancelBtn: '取消',
  deleteThisPrompt: '确定删除这一期复盘吗？此操作无法撤销。',
  settingsAbout: '关于',
  aboutText: 'Melete {v} {ed} · 照见图谱 {lv} · Apache-2.0',
  projectRepo: "仓库地址",
  cornerGreek: 'Melete（Μελέτη），希腊神话里掌管练习与沉思的缪斯。',
  cornerChinese: '吾日三省吾身。——《论语》',
  cornerBabylonian: '他看见了深渊，于是知晓万物。——《吉尔伽美什史诗》',
  cornerIndian: '我们的一切，都由心念而来。——《法句经》',
  cornerEgyptian: '没有人生来就有智慧。——《普塔霍特普箴言》',
  cornerRoman: '教人者，亦在学习。——塞涅卡',
  voicesTitle: '众声 · 对话摘录',
  voicesSub: '{n} 位 AI 与朋友对四个问题的回答，一问一张卡片 · 悬停暂停 · 点击细读',
  voicesAdd: '+ 添加卡片',
  voicesRead: '读这一段 ↗',
  voicesQNum: '问题{n}',
  voicesQ1: '你希望人怎么用 AI？',
  voicesQ2: '你希望 AI 给用户提供内容时，能做些什么？',
  voicesQ3: '你希望用户用 AI 的产出，对社会有什么意义？',
  voicesQ4: '你希望用户在使用 AI 时，怎么面对自己？',
  voicesQs1: '怎么用 AI',
  voicesQs2: 'AI 该做什么',
  voicesQs3: '对社会的意义',
  voicesQs4: '怎么面对自己',
  voicesKindAI: 'AI',
  voicesKindFriend: '朋友的回答',
  voicesNoteAI: '摘自 Yan Canny 与 {name} 在 2026 年 11 月 8 日的一段对话。按原文摘录，只做了分段。同一个问题再问一次，答案可能不同。它不代表该模型开发方的立场，名称只用来标明出处。',
  voicesNoteFriend: '摘自 Yan Canny 与一位朋友的聊天，经本人同意后展示，使用的是昵称。按原文摘录，只做了分段。',
  voicesTranslated: '',
  voicesClose: '关闭',
  voicesAria: '阅读 {name} 对“{q}”的回答',
  voicesFormTitle: '添加对话摘录卡片',
  voicesFormName: '人物 / 模型名称 *',
  voicesFormNamePh: '例如：Claude Opus 5.5；朋友请写昵称，不写真名',
  voicesFormKind: '类别标签',
  voicesFormKindPh: '例如：AI、朋友的回答',
  voicesFormExcerpt: '卡面上的一句话 *',
  voicesFormExcerptPh: '一句有启发的话……',
  voicesFormFull: '问答全文 *',
  voicesFormFullPh: '按「问题一：……」「问题二：……」分段粘贴回答，会自动拆成一个问题一张卡片。',
  voicesFormNote: '备注（可选）',
  voicesFormNotePh: '例如：2026 年关于人与 AI 协作的思考',
  voicesSafety: '保存前请检查一遍：删掉真名、公司名、项目名、联系方式和任何截图里的个人信息。卡片只存在这台电脑上，不会上传；但你分享截图时，别人能看到卡面上的字。',
  voicesSafetyOk: '我已删掉以上信息；如果是朋友的话，已征得对方同意展示',
  voicesCancel: '取消',
  voicesSave: '保存卡片',
  homeRange: '当前范围：{r}',
  homeModel: '使用模型：{m}',
  homeNoModel: '未连接模型（请在 DSH 中配置）',
  homeAdv: '高级操作 · 范围与意图',
  homeCollapse: '收起 ▴',
  homeExpand: '展开 ▾',
  homeRangeLabel: '选择复盘范围',
  homeByYear: '按年份',
  homeCustom: '手选范围',
  homeAll: '全部记录',
  homeYearOpt: '{y} 年',
  homeDefault: '（默认）',
  homeYearHint: '每年 3 月 1 日起自动切换至当年；1—2 月默认选择上一年。',
  homeIntentLabel: '写更希望复盘的内容（可选）',
  rangeYearFmt: '{y} 年（{a} 至 {b}）',
  rangeSpanFmt: '{a} 至 {b}',
  rangeAllText: '全部历史记录',
  rangeDaysText: '最近 {n} 天',
  shareLight: '浅色',
  shareDark: '深色',
  sharePhMoment: '写下一个瞬间',
  sharePhAi: '写一句 AI 那边的事',
  sharePhQ: '留给自己的问题',
  shareHashtag: '#Melete复盘',
  cornerMaya: '愿所有人都站起来，不让一个人落在后面。——《波波尔·乌》',
  cornerInca: '莫偷盗，莫欺瞒，莫怠惰。——印加三箴言',
  settingsNotSaved: '这次没有保存上。完全退出 DSH（⌘Q）再打开，新风格就能用了。',
  details: '出处与当时的考量（{e} 处出处 · {r} 种可能）',
  viewContextBtn: '查看对话原文及上下文',
  contextModalTitle: '出处对话上下文',
  contextLoading: '正在读取该段对话记录……',
  contextEmpty: '未找到该对话的本地记录，可能已被清理。',
  contextClose: '收起上下文',
  domH: '人用 AI', domHsub: '你怎么用 AI',
  domA: 'AI 对你', domAsub: 'AI 怎么待你',
  domS: '与社会', domSsub: '你们和外面的往来',
  domI: '本心', domIsub: '你自己',
  mirrorCount: '{n} 面镜子', sealed: '信封 · 暂不开放',
  sealedHint: '后续版本再揭开这封信吧。',
  emptyH: '这一次没有从这个方向挑出镜子。',
  emptyA: '这一次没有从 AI 这一侧挑出镜子。',
  emptyS: '这段时间的记录里，没有看到和外面往来的痕迹。这一面只写出现过的，没看到就不写。',
  "ultraTag_all": "全部推荐",
  "ultraTag_specFirst": "工单先行",
  "ultraTag_twoStageEval": "证据核验",
  "ultraTag_modularPatterns": "一步一事",
  "ultraTag_invertedInquiry": "先问再做",
  "ultraTag_chunkMapReduce": "分段合并",
  "ultraSlide_fir-forest_title": "天山 · 雪岭云杉林",
  "ultraSlide_fir-forest_credit": "摄影：lwtt93（上海）· 许可：CC BY 2.0（需署名，可商用可演绎）",
  "ultraSlide_moon-bay_title": "喀纳斯 · 卧龙湾林海",
  "ultraSlide_moon-bay_credit": "摄影：Niranarm · 许可：公有领域（Public domain）",
  "ultraSlide_foggy-lake_title": "阿勒泰 · 喀纳斯湖畔雾林",
  "ultraSlide_foggy-lake_credit": "摄影：Muye Ma（muyema，原载 Unsplash）· 许可：CC0 1.0",
  "ultraSlide_autumn-lake_title": "喀纳斯 · 秋林与雪峰",
  "ultraSlide_autumn-lake_credit": "摄影：Charlie fong · 许可：公有领域（Public domain）",
  "ultraRec_spec-first_badge": "工单先行",
  "ultraRec_spec-first_title": "先写工单，再动手（Spec-First）",
  "ultraRec_spec-first_summary": "出自 Anthropic 的提示词教程。动手前，先把任务写成一张工单：AI 扮演什么角色、能看哪些材料、哪些事不能做、结果要什么格式。这几项写清楚了，AI 就不容易擅自扩大范围，也不容易编造。",
  "ultraRec_spec-first_matchReason": "你习惯先划边界、定规矩，再把整段工作交出去。",
  "ultraRec_two-stage-eval_badge": "证据核验",
  "ultraRec_two-stage-eval_title": "先找证据，再下结论（两阶段核验）",
  "ultraRec_two-stage-eval_summary": "一种常见的核查做法。把任务拆成两步：第一步只摘出原文证据，第二步再根据证据下判断。证据和结论分开写，就能看出哪句话有出处，哪句话是推测。",
  "ultraRec_two-stage-eval_matchReason": "你很在意「什么算证据」，会逐条核对引语。",
  "ultraRec_modular-patterns_badge": "一步一事",
  "ultraRec_modular-patterns_title": "一步只做一件事（模块化 Skill）",
  "ultraRec_modular-patterns_summary": "把常做的步骤做成独立的小工具，例如「提炼要点」「写提纲」「审读」。每个工具只做一件事，用的时候按顺序串起来。哪一步出了问题，就只改那一步。",
  "ultraRec_modular-patterns_matchReason": "适合把又长又杂的流程拆成几步。",
  "ultraRec_inverted-inquiry_badge": "先问再做",
  "ultraRec_inverted-inquiry_title": "让 AI 先提问（反向澄清）",
  "ultraRec_inverted-inquiry_summary": "开工前，先让 AI 问你三个它拿不准的问题。你答完，它再动手。很多返工来自一开始没说清的细节，这一步能提前把它们找出来。",
  "ultraRec_inverted-inquiry_matchReason": "适合需求还没想清楚、希望 AI 帮你补全细节的时候。",
  "ultraRec_chunk-map-reduce_badge": "分段合并",
  "ultraRec_chunk-map-reduce_title": "长材料分段处理，再合并（MapReduce）",
  "ultraRec_chunk-map-reduce_summary": "材料太长时，先分成几段，各自摘出要点和数字，最后由一个总的会话核对并合并。这样每一段都看得仔细，合并时也容易发现遗漏。",
  "ultraRec_chunk-map-reduce_matchReason": "适合要从多段长对话里汇总信息的时候。",
  emptyReviewsHint: "还没有复盘记录。回到主页即可开始你的第一次复盘。",
  'error.network-error': "连接插件服务失败，请稍后重试。",
  sharePostcardBtn: '分享我的复盘',
  exportReviewBtn: '导出这份复盘 (HTML)',
  shareTitle: '分享这段时间',
  shareSub: '默认已经做好，点一下就能保存',
  shareCopyImg: '⧉ 复制图片',
  shareSaveImg: '↓ 保存长图',
  shareCopyText: '✎ 复制文案',
  shareSaveHtml: '⌂ 保存 HTML',
  shareCopiedImgToast: '已复制到剪贴板，可以直接粘贴到社交平台',
  shareSavedImgToast: '已保存到 ~/.melete/shares/，可以在访达中显示',
  shareCopiedTextToast: '已复制配文：标题、一个瞬间和 #Melete复盘',
  shareSavedHtmlToast: '已保存 HTML 到 ~/.melete/shares/',
  shareExportedToast: '已导出完整复盘 HTML 到 ~/.melete/shares/',
  shareRevealFinder: '在访达中显示',
  shareHideBlockHint: '移到任一块上点 ◉ 即可隐藏；点文字可以直接改',
  shareMoreOptions: '更多：风格 · 尺寸 · 外观 · 签名条',
  shareTagCover: '这几天',
  shareTagNums: '数字',
  shareTagPractices: '我的做法',
  shareTagMoment: '一个瞬间',
  shareTagSplit: '我和 AI 的分工',
  shareTagAiNote: 'AI 那边',
  shareTagDial: '我们一起做事的时辰',
  shareTagQuestion: '留给自己的问题',
  shareMine: '我留给自己',
  shareAi: '交给 AI',
  shareSessions: '段会话',
  shareUserMsgs: '句我亲手写的话',
  shareToolCalls: '次 AI 替我动手',
  shareModelsCount: '个模型轮流上阵',
  shareSignature: '我的 AI 复盘',
  traitSpec: '开工单立规矩',
  traitEvidence: '严格核对证据',
  traitDelegate: '整段托付放手',
  traitBoundaries: '守住交付红线',
  traitExplore: '敏捷探索试探',
  traitTone: '在意文风口径',
  traitPace: '把控协作节奏',
  contextWhoUser: '用户',
}


    const en = {
  loading: 'Opening…',
  tagline: 'See how you and AI have been working together lately.',
  intentionLabel: 'What do you care about lately?',
  intentionHint: 'Optional. With an intention, the debrief can suggest small experiments.',
  intentionPlaceholder: 'What would you like the debrief to focus on? You can tell me here, or leave it blank.',
  chips: 'Work faster|Learn something new|Keep my own voice|Make what I ship more reliable|Just curious',
  rangeLabel: 'Look back',
  r7: '7 days', r30: '30 days', r90: '90 days', r365: '1 year', rAll: 'All', rCustom: 'Pick dates',
  rFrom: 'From', rTo: 'To',
  'error.bad-range': 'The date range is not valid. Please check the start and end dates.',
  rangeAllHint: 'When there are many records, they are sampled evenly over time so every stretch is represented.',
  settingsMore: 'More',
  changelogBtn: 'Changelog', philosophyBtn: 'The Melete idea', letterBtn: 'A letter from the maker',
  back: 'Back to settings',
  changelogTitle: 'Changelog',
  changelogSub: "Version 1 · 8 November 2026",
  changelogItems: "## Debrief|A new “Debrief” entry in the DSH sidebar. It reads only your local sessions and shows how you and AI have been working together — no scores, no rankings, no reporting.|The home page says it in one line, with “Start debrief” at the centre; your current range and model are always in view.|The intention box is open by default: write what you care about lately, or tap a ready-made phrase. Only with an intention will the debrief suggest experiments that target it.|Ranges: 7 days, 30 days, 90 days, 1 year, all, custom dates, and by year. By default it rolls over on 1 March (January and February default to last year), and long histories are sampled evenly across time.|One debrief runs in three steps: read local records → the model you chose writes → bind the cards. It usually takes a minute or two, so you can go and do something else.|The request goes straight from the plugin to the model you picked in DSH. No session is created, so the debrief never shows up in your session logs.|## Cards|One debrief is a stack of cards: the cover states the range and “who is looking at whom”, followed by four directions — you using AI, AI toward you, you and the world, and the inner self.|Each mirror opens with a short passage; sources and considerations fold away underneath. Every observation offers at least two readings, and says so when things are unclear.|Click a source to “view the original dialog and context” and read the redacted words right there, without hunting through sessions.|Core judgements are marked with a warm highlighter, followed by one or two trait pills, so your recent working habits are visible at a glance.|The AI’s side, you and the world, and one question each get a card; every mirror ends with a line from an ancient culture that fits the moment.|“Inner self” is a sealed letter: folded by default, with no content generated yet, waiting for a later version.|Debrief records let you revisit past debriefs and delete a single one. Each debrief is saved as both JSON and Markdown, and old debriefs are kept openable where possible.|After each debrief you see the tokens used and an estimate of the cost on the chosen model, calculated locally with no network calls.|## Voices|On the right of the home page is “Voices · Conversation excerpts”: AIs and friends answering four questions, one card per answer, two columns drifting slowly, pausing on hover, full text on click.|You can add conversation cards of your own: stored only on this computer, with a privacy checklist before saving.|## Your new world|“Your new world: Sneak peek” holds a Xinjiang landscape loop and a curated set of open-source AI workflows and skills, marking the ones that match “your recent way of working”.|Each recommendation lists a summary, why it fits, its repository, licence and a link straight to the source. Photos and recommendations ship inside the plugin and make no network requests at runtime.|The page is honest about it: this ground is still growing — a first sketch of a future method map.|## Sharing|“Share my debrief” is laid out for you by default: a postcard preview with light or dark theme and square, card, portrait or long-image sizes.|Want to hide a block or sentence? Hover and click it away. Text can be edited in place.|Copy the image, copy the post text, save a long image or HTML; the full debrief can also be exported as an HTML file.|Sharing leaves out the inner self and avoids identifiable project names, session sources and IDs. There are no social buttons and no nudging you to share.|## Look and feel|Eight ancient-civilisation skins — ancient Hellas, ancient China, ancient Babylon, ancient India, ancient Egypt, ancient Rome, Maya and Inca — each with its own palette, sky, emblem, numbering, ornament and corner quotation.|The backdrop is drawn in code: landscapes and architectural line work. Scroll down a debrief record and the building grows stroke by stroke; sun, moon, clouds, figures and animals respond to the pointer, while ancient quotations drift past like faint floating comments.|The style follows your region by default and can be pinned; “occasionally switch” shows your local civilisation half the time and a random other one the rest.|Light and dark follow DSH or your choice; fonts and reduced motion follow DSH and the system; small screens, keyboard use and screen-reader labels are covered too.|## Languages|The interface is fully translated into eight languages: 简体中文, English, 日本語, Español, Français, Deutsch, Русский and Português. Voices, recommendations, share copy, quotations and settings all switch with it.|Debrief text is written in the interface language you were using; the sidebar name follows DSH, and the page title is “Melete” plus each language’s own word for debrief.|## Privacy and data|Only words you typed yourself are used; emails, phone numbers and keys are replaced locally before anything goes to the model you chose. No network, no reporting, no servers, no telemetry.|Debriefs and settings live only in ~/.melete/. Settings show the location and let you delete a single debrief or everything at any time.|On failure, only numbers such as length and finish reason are logged locally, never content. Old data, missing fields and dropped connections each have their own fallback and retry path.|## Settings and docs|Settings cover language, appearance, default range, privacy notes, data location and one-click delete, plus About (version, Lens version, licence).|Built in: “The Melete idea” (relatively stable / still exploring / the goal / a note from the creator), “A letter from the maker”, and this changelog.|This version is 0.1.1 Telos Ultra with Lens 0.4.0; code is Apache-2.0, the Lens is CC BY 4.0.",
  philosophyTitle: 'The Melete idea',
  philosophySub: 'Look back at how you and AI work together.',
  philosophyStableTitle: 'Relatively stable',
  philosophyStableItems: 'A mirror: letting your habits be seen.|Good and bad defined by you: no predefined “ideal user” standards; suggestions only benchmark against your own stated goals.|Every statement has an origin: every observation can be traced back to a specific conversation, with at least two possible readings.|AI is also in the mirror: reflecting not just you, but how AI treats you.|Local first: Melete runs no servers, collects no data, and makes no telemetry calls.|Letters to yourself stay private: folded by default, unsaved to disk, never shared.|Exit anytime: delete all Melete-generated files with a single action.|No “manager view”: Melete is only for you to look at yourself.',
  philosophyThinkingTitle: 'Still exploring',
  philosophyThinkingItems: 'Non-judgmental: Melete does not judge today. If collective best practices emerge, they may be offered as optional references.|Numbers on share cards: currently allowing counts like “312 conversations”; subject to revisit.|The “with society” dimension: observing where outputs go and who they touch.|Letters to yourself: how many guesses AI can make (especially mood and health).|Cloud sync and accounts: none today, open to future review.|The Melete Lens: dimensions and terminology will continue to evolve.|Licensing: future versions may adjust terms, but published ones remain.',
  philosophyGoalTitle: 'The Goal',
  philosophyGoalText: 'To make society as happy as possible, and to bring happiness to as many people as possible. Melete approaches this through one path: reflection. When more people can see clearly and choose freely, the world gets a little better.',
  philosophyAuthorTitle: 'A note from the creator',
  philosophyAuthorText: 'To be honest, Melete was born out of my own head, carrying all my strong personal blind spots and obsessions. Going forward, I might make radical overhauls, but I’ve built in backward compatibility and soft landings. Truth isn’t in my pocket—I genuinely want people from everywhere to critique, modify, and shape it, so this doesn’t become a museum piece of self-indulgence.\n\nEvery debrief records the Lens version used, keeping past debriefs accessible.\n\nCritiques, edits, and ideas are warmly welcomed on Issues.',
  makerLetterTitle: 'A letter from the maker',
  makerLetterSub: 'Written amidst the rising tide',
  makerLetterBody: 'Hello, and welcome to Melete.|There are two kinds of mirrors in this world: one is the funhouse mirror in an amusement park, making you look tall and grand just to amuse the crowd; the other is the plain mercury mirror at your morning sink, cold and unflinching, reflecting even the dark circles under your eyes from last night’s sleeplessness.|Year-end recaps on social media are almost always the former. But when I saw people beginning to look with sober clarity at a person’s thinking habits and intellectual tools before AI, I felt a rare sense of exhilaration—this is what respecting an intelligent person ought to look like.|Melete was born out of that defiance. We have no intention of dressing things up. We simply want to lay out the cutting-edge skills, clear methods, and above all—the footprints of your own thinking, cleanly and honestly before you.|I have never believed in savior-like tech frenzies; I believe only in concrete, living individuals. I hope that through the characters you once typed, you can trace your own contours a little more clearly, and hold on to your own freedom and sober clarity amidst the clamor of the tides.',
  makerLetterSign: 'Yan Canny · November 8, 2026',
  start: 'Start debrief',
  privacyNote: 'The digest keeps only what you typed yourself; emails, phone numbers and keys are replaced locally first. It is then written up by the model you chose in DSH ({model}). Melete makes no network requests of its own and collects nothing.',
  noModel: 'No model is available in DSH yet. Choose one in DSH first.',
  run1: 'Reading local records', run2: '{model} is writing', run3: 'Binding the cards',
  runHint: 'This usually takes a minute or two. Feel free to come back later.',
  'error.no-records': 'No sessions with your own input were found in this period. Try a longer range.',
  'error.no-model': 'No model is available in DSH yet. Choose one in DSH first.',
  'error.empty-review': 'The model did not produce any mirrors this time. Try again.',
  'error.bad-output': 'The answer could not be turned into cards this time. Try again.',
  'error.busy': 'A debrief is already running.',
  'error.generic': 'The debrief did not finish: {msg}',
  retry: 'Try again',
  navReviews: 'Debrief records', navNew: 'Home', navUltra: 'Your new world: Sneak peek', navSettings: 'Settings',
  ultraTitle: 'Your New World',
  ultraKicker: 'Sneak Peek',
  ultraSub: 'Curated open-source AI workflows, skills, and patterns tailored to your collaboration habits. Sourced from high-reputation open-source repositories (permissive licenses) — click external links to explore directly.',
  ultraRecKicker: 'Curated Workflows & Skills',
  ultraRecTitle: 'AI patterns that fit you',
  ultraFilterAll: 'All',
  ultraMatchedBadge: '★ Fits your recent collaboration patterns',
  ultraVisitLink: 'View source ↗',
  ultraRepoLabel: 'Repository: ',
  ultraAboutKicker: 'A brief note',
  ultraAboutTitle: 'About this page',
  ultraPara1Label: 'About how it looks now',
  ultraPara1: 'This corner isn’t properly finished yet; under the surface, it’s still a scattered pile of bricks and tiles. I’ve always felt that spending all one’s time busy in front of a screen just isn’t enough. Everyone deserves a grove of their own, even if it has to be planted one tree at a time out of code and ideas.',
  ultraPara2Label: 'About Melete',
  ultraPara2: 'Going forward, what Melete wants to do is quite simple: take your everyday habits—whether by-the-book or off-the-beaten-path—and fish out some genuinely handy tools and delightful techniques from across the global web to hand over to you. What kind of spark AI kindles is entirely up to your own heart. If it helps you see things a little more clearly, learn a little more, and live with a bit more ease and room to breathe, Melete has done its job.',
  ultraPara3Label: 'About the scenery',
  ultraPara3: 'The forest in the background is from Xinjiang, China. The mountains are towering and the waters wide; the scenery is magnificent. Friends from all around the world are warmly invited to come visit whenever you have time—after all, the living trees and mountains of the real world will always be far more breathtaking than anything on a screen.',
  ultraCreditsKicker: 'Photos & Licenses',
  ultraCreditsTitle: 'Xinjiang landscape photo credits',
  ultraCommonsLink: 'Wikimedia Commons source ↗',
  ultraDotAria: 'Switch to photo {n}',
  ultraResume: '▶ Resume loop',
  ultraPause: '❚❚ Pause loop',
  ultraCurrent: 'Current: {title}',
  usageExact: 'Used {total} tokens ({in} in · {out} out) · Est. cost on {model}: ~{cost} ({code})',
  usageEst: 'Used ~{total} tokens (~{in} in · ~{out} out) · Est. cost on {model}: ~{cost} ({code})',
  intentionOpen: 'Add an intention for this period (optional)',
  intentionFold: 'Hide intention',
  pastReviews: 'Past debriefs',
  mirrors: 'A few mirrors',
  domainPos: '{n} mirrors',
  seen: 'Context',
  evidence: 'Sources',
  byYou: 'Your side', byAi: "AI's perspective", byThing: 'Nature of the task',
  readings: 'Sources and considerations',
  aiSide: "The AI's side",
  noteToAi: 'A note for your AI',
  noteToAiHint: 'If you like, paste it into your AI’s custom instructions.',
  society: 'You and the world',
  question: 'A question',
  experiments: 'Experiments based on your intention',
  intentExpTitle: 'Experiments tailored to your stated intention',
  check: 'Next time, look at',
  letterTitle: 'A letter to yourself',
  letterBody: 'The author is being honest with you: this part is not done well, and not thought through yet. It stays closed for now.',
  notCovered: 'Not covered this time: {list}. To look at one next time, mention it in your intention.',
  lensFoot: 'Lens {v} · seen by {by}',
  intentionShown: 'Your intention',
  settingsLanguage: 'Language', followDsh: 'Follow DSH',
  settingsStyle: 'Appearance', styleAuto: 'By region', greek: 'Ancient Hellas', chinese: 'Ancient China', babylonian: 'Ancient Babylon', indian: 'Ancient India', egyptian: 'Ancient Egypt', roman: 'Ancient Rome', maya: 'Maya', inca: 'Inca',
  occasional: 'Occasionally switch style',
  settingsDays: 'Default range',
  settingsPrivacy: 'Privacy',
  privacyText: 'Melete makes no network requests of its own and collects nothing. The interactions with the outside world only depend on your configured model.',
  settingsData: 'Data',
  dataText: 'Debriefs and settings live only in {dir}.',
  deleteAll: 'Delete all data',
  deleteConfirm: 'Delete every debrief and setting in {dir}? This cannot be undone.',
  deleted: 'Deleted.',
  deleteThis: 'Delete this debrief', deleteThisConfirm: 'Delete this debrief ({date})? This cannot be undone.',
  confirmDeleteBtn: 'Confirm delete',
  confirmDeleteAllBtn: 'Yes, delete all data',
  cancelBtn: 'Cancel',
  deleteThisPrompt: 'Delete this debrief? This cannot be undone.',
  settingsAbout: 'About',
  aboutText: 'Melete {v} {ed} · Lens {lv} · Apache-2.0',
  projectRepo: "Repository",
  cornerGreek: 'Melete (Μελέτη), the muse of practice and contemplation in Hellas.',
  cornerChinese: '"Each day I examine myself on three counts." — The Analects',
  cornerBabylonian: '"He who saw the deep, who knew all things." — Epic of Gilgamesh',
  cornerIndian: '"All that we are is the result of what we have thought." — Dhammapada',
  cornerEgyptian: '"No one is born wise." — Maxims of Ptahhotep',
  cornerRoman: '"While we teach, we learn." — Seneca',
  voicesTitle: 'Voices · Conversation excerpts',
  voicesSub: '{n} AIs and friends answer four questions, one card per answer · hover to pause · click to read',
  voicesAdd: '+ Add card',
  voicesRead: 'Read ↗',
  voicesQNum: 'Q{n}',
  voicesQ1: 'How do you hope people use AI?',
  voicesQ2: 'What should AI do when it provides content to users?',
  voicesQ3: 'What should the things people make with AI mean for society?',
  voicesQ4: 'How should people face themselves while using AI?',
  voicesQs1: 'How to use AI',
  voicesQs2: 'What AI should do',
  voicesQs3: 'Meaning for society',
  voicesQs4: 'Facing yourself',
  voicesKindAI: 'AI',
  voicesKindFriend: 'A friend',
  voicesNoteAI: 'From a conversation between Yan Canny and {name} on 8 November 2026. Quoted as written, only split into paragraphs. Asking the same question again may give a different answer. It does not represent the views of the model’s developer; the name only marks the source.',
  voicesNoteFriend: 'From a chat between Yan Canny and a friend, shown with their consent under a nickname. Quoted as written, only split into paragraphs.',
  voicesTranslated: 'Translated from the original Chinese.',
  voicesClose: 'Close',
  voicesAria: 'Read {name}’s answer to “{q}”',
  voicesFormTitle: 'Add a conversation card',
  voicesFormName: 'Person / model name *',
  voicesFormNamePh: 'e.g. Claude Opus 5.5; for friends, use a nickname, not a real name',
  voicesFormKind: 'Label',
  voicesFormKindPh: 'e.g. AI, A friend',
  voicesFormExcerpt: 'One line for the card *',
  voicesFormExcerptPh: 'A line that made you think…',
  voicesFormFull: 'Full answer *',
  voicesFormFullPh: 'Paste answers as “Q1: …”, “Q2: …”; they are split into one card per question.',
  voicesFormNote: 'Note (optional)',
  voicesFormNotePh: 'e.g. thoughts on working with AI, 2026',
  voicesSafety: 'Before saving, check once: remove real names, company names, project names, contact details and any personal information in screenshots. Cards stay on this computer and are never uploaded, but anyone who sees a screenshot can read them.',
  voicesSafetyOk: 'I’ve removed the above; for a friend’s words, I have their consent to show them',
  voicesCancel: 'Cancel',
  voicesSave: 'Save card',
  homeRange: 'Range: {r}',
  homeModel: 'Model: {m}',
  homeNoModel: 'No model connected (set one up in DSH)',
  homeAdv: 'More · range and intent',
  homeCollapse: 'Hide ▴',
  homeExpand: 'Show ▾',
  homeRangeLabel: 'Choose a range',
  homeByYear: 'By year',
  homeCustom: 'Custom',
  homeAll: 'All',
  homeYearOpt: '{y}',
  homeDefault: ' (default)',
  homeYearHint: 'From 1 March each year it switches to the current year; in January and February the previous year is the default.',
  homeIntentLabel: 'What would you like the debrief to focus on? (optional)',
  rangeYearFmt: '{y} ({a} to {b})',
  rangeSpanFmt: '{a} to {b}',
  rangeAllText: 'All history',
  rangeDaysText: 'Last {n} days',
  shareLight: 'Light',
  shareDark: 'Dark',
  sharePhMoment: 'A moment worth keeping',
  sharePhAi: 'A note about the AI side',
  sharePhQ: 'A question for myself',
  shareHashtag: '#MeleteDebrief',
  cornerMaya: '"Let all rise up, let no one be left behind." — Popol Vuh',
  cornerInca: '"Do not steal, do not lie, do not be lazy." — Inca Triad (Ama sua, ama llulla, ama quella)',
  settingsNotSaved: 'This was not saved. Quit DSH completely (⌘Q) and reopen it, then try again.',
  details: 'Sources & considerations ({e} sources · {r} possibilities)',
  viewContextBtn: 'View original dialog and context',
  contextModalTitle: 'Dialog context',
  contextLoading: 'Loading conversation context…',
  contextEmpty: 'Local conversation record not found or has been purged.',
  contextClose: 'Close context',
  domH: 'You → AI', domHsub: 'How you use AI',
  domA: 'AI → You', domAsub: 'How the AI treats you',
  domS: 'You & the world', domSsub: 'What flows in and out',
  domI: 'Inner self', domIsub: 'Just you',
  mirrorCount: '{n} mirrors', sealed: 'Sealed · not open yet',
  sealedHint: 'Let this letter be opened in a later version.',
  emptyH: 'No mirrors were picked from this side this time.',
  emptyA: 'No mirrors were picked from the AI side this time.',
  emptyS: 'Nothing in these records showed how you met the world. This side only shows what appeared.',
  "ultraTag_all": "All",
  "ultraTag_specFirst": "Spec-first",
  "ultraTag_twoStageEval": "Strict Evidence",
  "ultraTag_modularPatterns": "Atomic Steps",
  "ultraTag_invertedInquiry": "Deep Inquiry",
  "ultraTag_chunkMapReduce": "Map-Reduce",
  "ultraSlide_fir-forest_title": "Tianshan · Schrenk’s Spruce Forest",
  "ultraSlide_fir-forest_credit": "Photo: lwtt93 (Shanghai) · License: CC BY 2.0 (Attribution required, commercial & derivative allowed)",
  "ultraSlide_moon-bay_title": "Kanas · Moon Bay Forest",
  "ultraSlide_moon-bay_credit": "Photo: Niranarm · License: Public domain",
  "ultraSlide_foggy-lake_title": "Altay · Misty Shore of Kanas Lake",
  "ultraSlide_foggy-lake_credit": "Photo: Muye Ma (muyema, via Unsplash) · License: CC0 1.0",
  "ultraSlide_autumn-lake_title": "Kanas · Autumn Woods & Snowy Peaks",
  "ultraSlide_autumn-lake_credit": "Photo: Charlie fong · License: Public domain",
  "ultraRec_spec-first_badge": "Task Spec",
  "ultraRec_spec-first_title": "Spec-First Structured Task & System Prompting",
  "ultraRec_spec-first_summary": "From Anthropic’s prompt engineering tutorial. Deconstruct complex tasks into role personas, background context, clear guardrails, and output schemas to prevent drift.",
  "ultraRec_spec-first_matchReason": "Fits your preference for defining explicit boundaries before handing over whole tasks",
  "ultraRec_two-stage-eval_badge": "Fact Check",
  "ultraRec_two-stage-eval_title": "Two-Stage Verification & Chain-of-Thought Auditing",
  "ultraRec_two-stage-eval_summary": "A recognized verification pattern that decouples factual extraction from final assessment, ensuring all findings are grounded in verbatim quotes.",
  "ultraRec_two-stage-eval_matchReason": "Fits your meticulous attention to verifiable evidence and citation accuracy",
  "ultraRec_modular-patterns_badge": "Atomic Steps",
  "ultraRec_modular-patterns_title": "Modular Micro-Skills & Pattern Chaining (Fabric)",
  "ultraRec_modular-patterns_summary": "A minimalist modular workflow system. Turns tasks like extraction, outlining, and review into reusable atomic tools piped together cleanly.",
  "ultraRec_modular-patterns_matchReason": "Ideal for breaking down complex workflows into clear, modular stages",
  "ultraRec_inverted-inquiry_badge": "Clarification",
  "ultraRec_inverted-inquiry_title": "Inverted Clarification & Interactive Alignment",
  "ultraRec_inverted-inquiry_summary": "An interactive prompt pattern where AI asks three targeted boundary questions before executing, resolving ambiguities upfront.",
  "ultraRec_inverted-inquiry_matchReason": "Suited for sessions where you want AI to surface blind spots and clarify scope beforehand",
  "ultraRec_chunk-map-reduce_badge": "Synthesis",
  "ultraRec_chunk-map-reduce_title": "Hierarchical Text Extraction & MapReduce Synthesis",
  "ultraRec_chunk-map-reduce_summary": "A long-context synthesis pattern that delegates extraction across chunks before merging, preserving critical figures and nuances without loss.",
  "ultraRec_chunk-map-reduce_matchReason": "Suited for summarizing multi-session dialogues and large document collections",
  emptyReviewsHint: "No debrief records yet. Go to Home to start your first debrief.",
  'error.network-error': "Failed to connect to local plugin service. Please retry.",
  sharePostcardBtn: 'Share my debrief',
  exportReviewBtn: 'Export Review (HTML)',
  shareTitle: 'Share This Period',
  shareSub: 'Ready by default, save with a single click',
  shareCopyImg: '⧉ Copy Image',
  shareSaveImg: '↓ Save long image',
  shareCopyText: '✎ Copy Text',
  shareSaveHtml: '⌂ Save HTML',
  shareCopiedImgToast: 'Copied to clipboard, ready to paste into social media',
  shareSavedImgToast: 'Saved to ~/.melete/shares/, ready to reveal in Finder',
  shareCopiedTextToast: 'Copied post text: title, moment and #MeleteDebrief',
  shareSavedHtmlToast: 'Saved HTML to ~/.melete/shares/',
  shareExportedToast: 'Exported full review HTML to ~/.melete/shares/',
  shareRevealFinder: 'Reveal in Finder',
  shareHideBlockHint: 'Hover to click ◉ to hide; click text to edit directly',
  shareMoreOptions: 'More: Style · Size · Theme · Signature',
  shareTagCover: 'This Period',
  shareTagNums: 'Numbers',
  shareTagPractices: 'My Practices',
  shareTagMoment: 'A Moment',
  shareTagSplit: 'Division of Work',
  shareTagAiNote: 'On the AI Side',
  shareTagDial: 'When We Worked Together',
  shareTagQuestion: 'A Question for Myself',
  shareMine: 'Kept for Myself',
  shareAi: 'Handed to AI',
  shareSessions: 'sessions',
  shareUserMsgs: 'messages from me',
  shareToolCalls: 'AI tool actions',
  shareModelsCount: 'models used',
  shareSignature: 'My AI Reflection',
  traitSpec: 'Set specifications',
  traitEvidence: 'Verify evidence',
  traitDelegate: 'Delegate & trust',
  traitBoundaries: 'Guard boundaries',
  traitExplore: 'Explore & probe',
  traitTone: 'Tone & precision',
  traitPace: 'Master the pace',
  contextWhoUser: 'User',
}


    const ja = {
  loading: '読み込み中……',
  tagline: '最近、あなたとAIがどんなふうに一緒に取り組んできたかを振り返ります。',
  intentionLabel: '最近、何を意識していましたか？',
  intentionHint: '未記入でも構いません。入力すると、それに合わせた小さな実験を提案します。',
  intentionPlaceholder: '振り返りで特に重視したいことがあれば教えてください。空欄のままでも構いません。',
  chips: '効率を高めたい|新しいことを学びたい|自分の文体を保ちたい|成果物の信頼性を上げたい|ただ眺めてみたい',
  rangeLabel: '振り返り期間',
  r7: '7日間', r30: '30日間', r90: '90日間', r365: '1年間', rAll: 'すべて', rCustom: '日付指定',
  rFrom: '開始日', rTo: '終了日',
  'error.bad-range': '日付の範囲が正しくありません。開始日と終了日を確認してください。',
  rangeAllHint: '記録が多い場合は、前後の時期が均等に含まれるよう時間軸に沿って抽出します。',
  settingsMore: 'その他',
  changelogBtn: '更新履歴', philosophyBtn: 'Meleteの理念', letterBtn: '制作者からの手紙',
  back: '設定に戻る',
  changelogTitle: '更新履歴',
  changelogSub: "第1版 · 2026年11月8日",
  changelogItems: "## 感想戦|DSH のサイドバーに「感想戦」が加わりました。ローカルのセッションだけを読み、あなたと AI がどう一緒に仕事をしてきたかを映し出します。点数も順位もなく、どこにも報告しません。|ホームでは一行で説明し、中央に「感想戦をはじめる」があります。現在の振り返りの範囲と使っているモデルはいつでも目に入ります。|意図の入力欄は最初から開いていて、このところ気にかけていることを書くことも、用意されたフレーズを選ぶこともできます。意図を書いたときだけ、感想戦はそれに向けた小さな実験を提案します。|振り返りの範囲は 7 日、30 日、90 日、1 年、すべて、日付の手動選択、年ごと。既定では 3 月 1 日に年が切り替わり、1〜2 月は前年が既定です。記録が多いときは時間軸に沿って均等に抽出します。|感想戦は三つの手順で進みます：ローカルの記録を読む → 選んだモデルが書く → カードを綴じる。ふつう 1〜2 分なので、その間に別のことをしていても大丈夫です。|感想戦のリクエストは、プラグインから DSH で選んだモデルへ直接送られます。新しいセッションは作られず、会話記録にも残りません。|## カード|1 回の感想戦はカードの束です。表紙に今回の範囲と「誰が誰を見ているか」が書かれ、その下に「人が AI を使う」「AI からあなたへ」「社会との関わり」「本心」の四つの方向が並びます。|どの鏡もまず短い本文から始まり、出処とそのときの考えは折りたたんで後ろに置かれます。観察にはそれぞれ少なくとも二通りの読み方を添え、はっきり見えないときはそう書きます。|出処をクリックすると「会話の原文と文脈を見る」が開き、その場で当時の伏せ字済みの言葉が読めます。セッションを探しに戻る必要はありません。|本文の核心となる判断は温かな蛍光マーカーで示され、特性タグが一つか二つ添えられて、最近の協働の癖がひと目でわかります。|AI 側の視点、外との往来、ひとつの問いがそれぞれカードになり、どの鏡の末尾にも、そのときの状況に合った古国の名言が一句添えられます。|「本心」は封じられた手紙です。既定では閉じたままで、内容はまだ生成せず、後のバージョンで開けられるようにしてあります。|感想戦記録では過去の感想戦を見返し、1 回分だけ削除できます。各感想戦は JSON と Markdown の両方で保存され、古い感想戦もできるだけ開けるようにしています。|感想戦が終わるたびに、今回消費したトークンと、選んだモデルでの概算費用が表示されます。計算は本機で行い、ネットにはつながりません。|## 声|ホームの右側には「声 · 対話の抜粋」があります。複数の AI と友人が四つの問いに答えたもので、一問につき一枚のカード、二列でゆっくり流れ、ホバーで止まり、クリックで全文が読めます。|自分の対話カードも追加できます。保存先はこのパソコンだけで、保存前にプライバシー確認のチェックリストがあります。|## あなたの新しい世界|「あなたの新しい世界：先行プレビュー」には新疆の風景のスライドショーがあり、厳選したオープンソースの AI ワークフローと Skill の推薦も並びます。最近の協働の癖に応じて「最近のやり方に近い」と印が付きます。|どの推薦カードにも、概要、合う理由、リポジトリ、ライセンス、そのまま開ける出処が書かれています。写真も推薦もプラグインに同梱され、実行時にネットへ出ません。|ページにも正直に書いてあります。この土地はまだ育っている途中で、これからの方法地図の雛形です。|## 共有|「私の感想戦をシェア」は最初からレイアウト済みです。ポストカード風のプレビューで、ライト／ダークを切り替えられ、正方形、カード、縦長、長い画像のサイズを選べます。|いらないブロックや文は、上にカーソルを置いてクリックすれば隠せます。文字もその場で直せます。|ワンクリックで画像をコピー、投稿文をコピー、長い画像や HTML の保存ができます。感想戦の全体も HTML 一枚に書き出せます。|共有には本心を入れず、特定できるプロジェクト名、会話の出処、番号も避けます。SNS のボタンはなく、共有を急かすこともありません。|## 外観|八つの古代文明の装い：古代ギリシャ、古代中国、古代バビロニア、古代インド、古代エジプト、古代ローマ、マヤ、インカ。それぞれに配色、空の色、紋章、番号、装飾、ページ隅の引用があります。|背景はコードで描いた天地山水と建築の線画です。感想戦記録を下へスクロールすると、建物が一筆ずつ伸びていきます。太陽と月、雲、人物や動物はマウスに反応し、古国の名言が弾幕のようにそっと流れていきます。|既定では地域に合わせてスタイルを選び、一つのスタイルに固定することもできます。「たまに切り替える」では、半分の確率で自分の地域の文明が、残りはほかの文明からランダムに現れます。|明暗は DSH に従うか手動で切り替えられます。フォントと動きの軽減は DSH とシステムに従い、小さな画面、キーボード操作、読み上げラベルにも配慮しています。|## 言語|インターフェースは八つの言語を完全にカバーしています：简体中文、English、日本語、Español、Français、Deutsch、Русский、Português。声、推薦、共有の文案、名言、設定もすべて切り替わります。|感想戦の本文は、そのとき使っていたインターフェースの言語で書かれます。サイドバーの名称は DSH の言語に従い、開いた先の見出しは「Melete」に各言語でその言葉を足したものです。|## プライバシーとデータ|使うのはあなた自身が書いた言葉だけです。メールアドレス、電話番号、鍵はまず本機で置き換えてから、自分で選んだモデルに渡します。ネットにつながず、どこにも報告せず、サーバーも持たず、テレメトリもありません。|感想戦と設定は ~/.melete/ にだけ保存されます。設定ページで場所を確認でき、いつでも 1 回分だけ、またはすべてのデータを削除できます。|失敗したときは、長さや終了理由といった数字だけを本機に記録し、内容は残しません。古いデータ、欠けた項目、接続が切れたときの再試行には、それぞれに応じたフォールバックと案内があります。|## 設定とドキュメント|設定には、言語、外観、既定の期間、プライバシー説明、データの場所、ワンクリック削除、そして Melete について（バージョン、照見図譜のバージョン、ライセンス）があります。|「Meleteの理念」（比較的安定 / まだ考え中 / 目標 / はじめに）、「制作者からの手紙」、そしてこの更新履歴を内蔵しています。|このバージョンは 0.1.1 Telos Ultra、照見図譜 0.4.0。コードは Apache-2.0、照見図譜は CC BY 4.0 です。",
  philosophyTitle: 'Meleteの理念',
  philosophySub: 'あなたとAIがどう一緒に取り組んでいるかを振り返ります。',
  philosophyBody: 'MeleteはあなたとAIの関わり方を映し出します。良し悪しはあなたが決めることです。同じ進め方でも、目的によってそれぞれ理があります。|点数をつけない、順位づけしない、決めつけない。|すべての観察は実際の対話に根ざし、少なくとも2通りの見方ができます。|AI自身も照らし出されます：安易に同調していないか、勝手に決めていないか。|記録はすべてあなたの手元の端末でのみ処理されます。サーバーを持たず、データを収集しません。いつでも全消去できます。|鏡を覗いたあと、何かを試してみる：振り返り、小さな実験、そしてまた次へ。',
  philosophyNote: 'このページは原則に基づいた下書きです。制作者が後日改稿します。',
  makerLetterTitle: '制作者からの手紙',
  makerLetterSub: '喧騒の波の中で',
  makerLetterBody: 'こんにちは、Meleteへようこそ。|世の中には二種類の鏡があります。ひとつは遊園地のびっくり鏡。人を引き伸ばして立派に見せ、笑わせるためのもの。もうひとつは朝の洗面台にある普通の水銀鏡。冷徹で、昨夜の寝不足の隈までありのままに映し出します。|SNSの年末振り返りは、たいてい前者の鏡です。しかし、AIの前で見せたその人の思考の癖や道具の扱い方を、冷静な眼差しで振り返る試みを目にしたとき、私は久しぶりに胸のすく思いがしました——知性ある人を尊重するとは、まさにこういうことだと。|Meleteは、そんな意地から生まれました。飾り立てる気は毛頭ありません。最先端のスキル、明快な方法、そして何より——あなた自身の思考の痕跡を、曇りなく目の前に広げることだけを目指しています。|私は救世主のような技術の狂騒を信じません。信じるのは具体的で、今を生きる血の通った人間だけです。あなたが打ち込んできた文字を通して、自分自身の輪郭をより鮮明に確かめられるように。そしてこのささやかな試みが、喧騒の波の中で、あなた自身の自由と覚醒を守る支えとなることを願っています。',
  makerLetterSign: 'Yan Canny · 2026年11月8日',
  start: '感想戦をはじめる',
  privacyNote: '手動入力した言葉のみを抽出し、メールアドレス・電話番号・秘密鍵をあらかじめ手元で伏せ字にしてからDSHで選択したモデル（{model}）に渡します。外部とのやり取りはあなたが設定したモデルのみに依存します。',
  noModel: 'DSHでモデルが選択されていません。先にDSHでモデルを選んでください。',
  run1: 'ローカルの記録を読み込み中', run2: '{model} が執筆中', run3: 'カードを綴じています',
  runHint: '通常1〜2分ほどかかります。他の作業をしてから戻ってきても大丈夫です。',
  'error.no-records': '指定された期間に手動入力の記録が見つかりませんでした。より長い期間でお試しください。' ,
  'error.no-model': 'DSHでモデルが選択されていません。先にDSHでモデルを選んでください。',
  'error.empty-review': 'モデルから鏡が出力されませんでした。もう一度お試しください。',
  'error.bad-output': 'モデルの回答をカードに変換できませんでした。もう一度お試しください。',
  'error.busy': 'すでに感想戦が実行中です。',
  'error.generic': '感想戦が完了しませんでした：{msg}',
  retry: 'もう一度試す',
  navReviews: '感想戦記録', navNew: 'ホーム', navUltra: 'あなたの新しい世界：先行プレビュー', navSettings: '設定',
  ultraTitle: 'あなたの新しい世界',
  ultraKicker: '先行プレビュー',
  ultraSub: 'あなたの協働の傾向に合わせて、適したAIワークフローやスキル、実践パターンを厳選してご紹介します。寛容なオープンソースライセンスを持つ定評あるリポジトリから集めています。外部リンクからそのまま学べます。',
  ultraRecKicker: '厳選ワークフローとスキル',
  ultraRecTitle: 'あなたに合ったAIの手法',
  ultraFilterAll: 'すべて表示',
  ultraMatchedBadge: '★ 最近の協働パターンに適合',
  ultraVisitLink: 'リポジトリへ ↗',
  ultraRepoLabel: 'リポジトリ：',
  ultraAboutKicker: 'まえがき',
  ultraAboutTitle: 'このページについて',
  ultraPara1Label: '現在の様子について',
  ultraPara1: 'この場所はまだまともに完成しておらず、足元はがれきの山のようなものです。けれど私は、画面の前で忙しく立ち回るばかりでは物足りない気がしてなりません。コードと考えを寄せ集めて少しずつ植えていくのだとしても、人はだれしも自分だけの森を持つべきだと思うのです。',
  ultraPara2Label: 'Melete について',
  ultraPara2: 'これから Melete がやりたいことは、いたって素朴です。いつもの我流や整った仕事のやり方に寄り添いながら、世界中の網の中から手に馴染む道具や面白い工夫を拾い集めて手渡すこと。AI でどんな火花を散らすかは、あなた自身の心次第です。暮らしのなかで少しでも物事がよく見え、新しいことを学び、肩の力を抜いて伸びやかに過ごす手助けになれば、Melete の役目は十分果たせたと言えます。',
  ultraPara3Label: '背景の風景について',
  ultraPara3: '背景の木々は中国・新疆で撮影されたものです。山は高く水は澄み渡り、息をのむような美しい景色が広がっています。世界中の友人に、機会があればぜひ足を運んでほしい場所です——現実の世界に息づく草木や山川は、画面に映る何ものよりも、ずっと美しいのですから。',
  ultraCreditsKicker: '写真とライセンス',
  ultraCreditsTitle: '新疆の風景写真 出典',
  ultraCommonsLink: 'Wikimedia Commons 出典 ↗',
  ultraDotAria: '写真 {n} に切り替え',
  ultraResume: '▶ 再生',
  ultraPause: '❚❚ 一時停止',
  ultraCurrent: '現在：{title}',
  usageExact: '消費トークン：{total}（入力 {in} · 出力 {out}） · {model} 推定費用：約 {cost}（{code}）',
  usageEst: '消費トークン：約 {total}（入力約 {in} · 出力約 {out}） · {model} 推定費用：約 {cost}（{code}）',
  intentionOpen: 'この期間の意図を追加（任意）',
  intentionFold: '意図を閉じる',
  pastReviews: 'これまでの感想戦',
  mirrors: '鏡の数々',
  domainPos: '全 {n} 面',
  seen: '当時の文脈',
  evidence: '出処',
  byYou: 'あなたの側の視点', byAi: '当時のAIの振る舞いと背景', byThing: '課題自体の要請',
  readings: '出処と当時の考察',
  aiSide: 'AI側の視点',
  noteToAi: 'AIへの申し送り',
  noteToAiHint: 'よろしければ、AIのカスタム指示に貼り付けてみてください。',
  society: '外との往来',
  question: 'ひとつの問い',
  experiments: '意図に合わせた小さな実験',
  intentExpTitle: 'あなたが書いた意図に合わせた小さな実験',
  check: '次回見つめる点',
  letterTitle: 'あなた自身への手紙',
  letterBody: '率直にお伝えすると、ここはまだ準備が整っておらず、構想が固まるまで閉じたままにしています。',
  notCovered: '今回取り上げなかった面：{list}。見つめたい面があれば、次回の意図に書き添えてみてください。',
  lensFoot: '照見図譜 {v} · {by} の視点',
  intentionShown: '入力された意図',
  settingsLanguage: '言語', followDsh: 'DSHに従う',
  settingsStyle: '外観', styleAuto: '地域に合わせる', greek: '古代ギリシャ', chinese: '古代中国', babylonian: '古代バビロニア', indian: '古代インド', egyptian: '古代エジプト', roman: '古代ローマ', maya: 'マヤ', inca: 'インカ',
  occasional: 'たまにスタイルを切り替える',
  settingsDays: 'デフォルト期間',
  settingsPrivacy: 'プライバシー',
  privacyText: 'Meleteは独自通信を行わず、データを収集しません。外部とのやり取りはあなたが設定したモデルのみに依存します。感想戦の際、抽出内容はDSHで選択したモデルに直接渡され、通常の会話記録には残りません。',
  settingsData: 'データ',
  dataText: '感想戦の記録と設定は {dir} のみに保存されます。',
  deleteAll: '全データを削除',
  deleteConfirm: '{dir} 内のすべての感想戦と設定を削除しますか？この操作は取り消せません。',
  deleted: '削除しました。',
  deleteThis: 'この記録を削除', deleteThisConfirm: 'この感想戦（{date}）を削除しますか？この操作は取り消せません。',
  confirmDeleteBtn: '削除を確定',
  confirmDeleteAllBtn: '全データの消去を確定',
  cancelBtn: 'キャンセル',
  deleteThisPrompt: 'この感想戦を削除しますか？この操作は取り消せません。',
  settingsAbout: 'Meleteについて',
  aboutText: 'Melete {v} {ed} · 照見図譜 {lv} · Apache-2.0',
  projectRepo: "リポジトリ",
  cornerGreek: 'Melete（Μελέτη）——ギリシャ神話で練習と思索を司るムーサ。',
  cornerChinese: '吾日に三たび吾が身を省みる。——『論語』',
  cornerBabylonian: '深淵を見た者は、すべてを知った。——『ギルガメシュ叙事詩』',
  cornerIndian: '私たちのすべては、心の思いから生まれる。——『法句経』',
  cornerEgyptian: '生まれながらに賢い者はいない。——『プタハヘテプの教訓』',
  cornerRoman: '教えることで、私たちは学ぶ。——セネカ',
  voicesTitle: '声 · 対話の抜粋',
  voicesSub: '{n} の AI と友人が四つの問いに答えました。一問一枚 · ホバーで一時停止 · クリックで全文',
  voicesAdd: '+ カードを追加',
  voicesRead: '読む ↗',
  voicesQNum: '問{n}',
  voicesQ1: '人に AI をどう使ってほしいですか？',
  voicesQ2: 'AI がユーザーに内容を出すとき、何をしてほしいですか？',
  voicesQ3: 'ユーザーが AI で生み出すものは、社会にとってどんな意味を持ってほしいですか？',
  voicesQ4: 'AI を使うとき、ユーザーには自分自身とどう向き合ってほしいですか？',
  voicesQs1: 'AI の使い方',
  voicesQs2: 'AI がすべきこと',
  voicesQs3: '社会にとっての意味',
  voicesQs4: '自分との向き合い方',
  voicesKindAI: 'AI',
  voicesKindFriend: '友人の答え',
  voicesNoteAI: 'Yan Canny と {name} の 2026 年 11 月 8 日の対話から。原文のまま抜粋し、段落分けだけしています。同じ質問をもう一度すると、答えは変わるかもしれません。モデル開発元の立場を示すものではなく、名称は出典を示すためだけのものです。',
  voicesNoteFriend: 'Yan Canny と友人の会話から。本人の同意を得て、ニックネームで掲載しています。原文のまま抜粋し、段落分けだけしています。',
  voicesTranslated: '中国語の原文からの翻訳です。',
  voicesClose: '閉じる',
  voicesAria: '{name} の「{q}」への答えを読む',
  voicesFormTitle: '対話カードを追加',
  voicesFormName: '人物 / モデル名 *',
  voicesFormNamePh: '例：Claude Opus 5.5。友人は本名ではなくニックネームで',
  voicesFormKind: 'ラベル',
  voicesFormKindPh: '例：AI、友人の答え',
  voicesFormExcerpt: 'カードに載せる一文 *',
  voicesFormExcerptPh: '心に残った一文……',
  voicesFormFull: '回答の全文 *',
  voicesFormFullPh: '「問1：……」「問2：……」の形で貼り付けると、一問一枚に分けます。',
  voicesFormNote: 'メモ（任意）',
  voicesFormNotePh: '例：2026 年、人と AI の協働についての考え',
  voicesSafety: '保存する前に確認してください。本名、会社名、プロジェクト名、連絡先、スクリーンショット内の個人情報を消してください。カードはこのパソコンにだけ保存され、アップロードされませんが、スクリーンショットを共有すると内容は見えます。',
  voicesSafetyOk: '上記を消しました。友人の言葉なら、掲載の同意を得ています',
  voicesCancel: 'キャンセル',
  voicesSave: 'カードを保存',
  homeRange: '範囲：{r}',
  homeModel: 'モデル：{m}',
  homeNoModel: 'モデル未接続（DSH で設定してください）',
  homeAdv: '詳細 · 範囲と意図',
  homeCollapse: '閉じる ▴',
  homeExpand: '開く ▾',
  homeRangeLabel: '振り返りの範囲',
  homeByYear: '年ごと',
  homeCustom: '期間を指定',
  homeAll: 'すべて',
  homeYearOpt: '{y} 年',
  homeDefault: '（既定）',
  homeYearHint: '毎年 3 月 1 日からその年に切り替わります。1〜2 月は前年が既定です。',
  homeIntentLabel: '振り返りで重視したいこと（任意）',
  rangeYearFmt: '{y} 年（{a}〜{b}）',
  rangeSpanFmt: '{a}〜{b}',
  rangeAllText: 'すべての履歴',
  rangeDaysText: '直近 {n} 日',
  shareLight: 'ライト',
  shareDark: 'ダーク',
  sharePhMoment: '残しておきたい瞬間',
  sharePhAi: 'AI 側について一言',
  sharePhQ: '自分への問い',
  shareHashtag: '#Melete感想戦',
  cornerMaya: '皆が立ち上がるように。誰ひとり取り残されないように。——『ポポル・ヴフ』',
  cornerInca: '盗むな、偽るな、怠るな。——インカの三箇条（アマ・スワ、アマ・リュリャ、アマ・ケリャ）',
  settingsNotSaved: '保存できませんでした。DSH を完全に終了（⌘Q）して開き直してから、もう一度お試しください。',
  details: '出処と考察（出処 {e} 箇所 · 可能性 {r} 種）',
  viewContextBtn: '会話の原文と文脈を見る',
  contextModalTitle: '会話の文脈',
  contextLoading: '会話ログを読み込み中……',
  contextEmpty: '該当する対話ログが見つかりませんでした。すでに削除された可能性があります。',
  contextClose: '文脈を閉じる',
  domH: '人からAIへ', domHsub: 'AIをどう使っているか',
  domA: 'AIからあなたへ', domAsub: 'AIがどう接しているか',
  domS: '社会との関わり', domSsub: '外とのやり取り',
  domI: '本心', domIsub: 'あなた自身',
  mirrorCount: '{n} 面の鏡', sealed: '手紙 · 準備中',
  sealedHint: 'この手紙は、今後のバージョンで開けてみてください。',
  emptyH: '今回はこの方向から選ばれた鏡はありませんでした。',
  emptyA: '今回はAI側から選ばれた鏡はありませんでした。',
  emptyS: 'この期間の記録には、外部との往来の痕跡が見られませんでした。現れたことのみを記します。',
  "ultraTag_all": "すべて",
  "ultraTag_specFirst": "仕様先行",
  "ultraTag_twoStageEval": "根拠検証",
  "ultraTag_modularPatterns": "手順分割",
  "ultraTag_invertedInquiry": "対話明確化",
  "ultraTag_chunkMapReduce": "分担総括",
  "ultraSlide_fir-forest_title": "天山 · シュレンクオウヒの原生林",
  "ultraSlide_fir-forest_credit": "撮影：lwtt93（上海）· ライセンス：CC BY 2.0（表示義務、商用・改変可）",
  "ultraSlide_moon-bay_title": "カナス · 月亮湾の樹海",
  "ultraSlide_moon-bay_credit": "撮影：Niranarm · ライセンス：パブリックドメイン",
  "ultraSlide_foggy-lake_title": "アルタイ · 霧に包まれるカナス湖畔の森",
  "ultraSlide_foggy-lake_credit": "撮影：Muye Ma（Unsplash経由）· ライセンス：CC0 1.0",
  "ultraSlide_autumn-lake_title": "カナス · 秋の森と雪峰",
  "ultraSlide_autumn-lake_credit": "撮影：Charlie fong · ライセンス：パブリックドメイン",
  "ultraRec_spec-first_badge": "指示仕様",
  "ultraRec_spec-first_title": "Spec-First 構造化指示書とシステム仕様",
  "ultraRec_spec-first_summary": "Anthropic公式プロンプト講座より。役割、前提情報、明確な制約条件と形式を定義し、AIの脱線や幻覚を防ぎます。",
  "ultraRec_spec-first_matchReason": "あらかじめ境界や基準を定めてから作業を一任するあなたの習慣に合致",
  "ultraRec_two-stage-eval_badge": "事実検証",
  "ultraRec_two-stage-eval_title": "2段階の事実検証と思考プロセス確認",
  "ultraRec_two-stage-eval_summary": "客観的な事実の抽出と判断を分離し、引用を正確に固定して推論の正確性を高める手法です。",
  "ultraRec_two-stage-eval_matchReason": "客観的な根拠と確かな引用を重視するあなたの姿勢に合致",
  "ultraRec_modular-patterns_badge": "手順分割",
  "ultraRec_modular-patterns_title": "モジュール型マイクロスキルとパイプライン連携",
  "ultraRec_modular-patterns_summary": "要点抽出や構成作成、精読などの工程を単機能ツールに切り出し、連携させるワークフローです。",
  "ultraRec_modular-patterns_matchReason": "入り組んだタスクを整然とした単位に切り分ける用途に適しています",
  "ultraRec_inverted-inquiry_badge": "対話確認",
  "ultraRec_inverted-inquiry_title": "着工前の逆質問と前提確認",
  "ultraRec_inverted-inquiry_summary": "着手前に見落としがちな前提や境界条件をAI側から質問させ、認識のズレを解消する対話法です。",
  "ultraRec_inverted-inquiry_matchReason": "着手前に盲点を点検し、多角的な視点を引き出したい場面に適しています",
  "ultraRec_chunk-map-reduce_badge": "分担集約",
  "ultraRec_chunk-map-reduce_title": "長文の階層的抽出と統合集約 (MapReduce)",
  "ultraRec_chunk-map-reduce_summary": "長大な記録を複数に分散して要点や数値を拾い出し、最後に統合して網羅性を保つ手法です。",
  "ultraRec_chunk-map-reduce_matchReason": "複数の対話や長文テキストを漏れなくまとめる作業に適しています",
  emptyReviewsHint: "感想戦の記録はまだありません。ホームに戻って最初の感想戦をはじめましょう。",
  'error.network-error': "ローカルプラグインサービスへの接続に失敗しました。時間をおいて再試行してください。",
  sharePostcardBtn: '私の振り返りをシェア',
  exportReviewBtn: 'この振り返りを書き出す (HTML)',
  shareTitle: 'この期間を共有',
  shareSub: 'すでに準備完了、ワンクリックで保存できます',
  shareCopyImg: '⧉ 画像をコピー',
  shareSaveImg: '↓ 縦長画像を保存',
  shareCopyText: '✎ 投稿文をコピー',
  shareSaveHtml: '⌂ HTML を保存',
  shareCopiedImgToast: 'クリップボードにコピーしました',
  shareSavedImgToast: '保存しました (~/.melete/shares/)',
  shareCopiedTextToast: '投稿文をコピーしました',
  shareSavedHtmlToast: 'HTML を保存しました (~/.melete/shares/)',
  shareExportedToast: '振り返り全体を保存しました (~/.melete/shares/)',
  shareRevealFinder: 'Finder で表示',
  shareHideBlockHint: '各ブロックの ◉ をクリックすると非表示にできます',
  shareMoreOptions: '詳細設定：スタイル・寸法・外観・署名',
  shareTagCover: 'この期間',
  shareTagNums: '数字',
  shareTagPractices: '私の工夫',
  shareTagMoment: 'ひとつの瞬間',
  shareTagSplit: '私とAIの分担',
  shareTagAiNote: 'AIの様子',
  shareTagDial: '一緒に作業した時間帯',
  shareTagQuestion: '自分への問い',
  shareMine: '自分で担当',
  shareAi: 'AIに委託',
  shareSessions: 'セッション',
  shareUserMsgs: '件のメッセージ',
  shareToolCalls: '回のAIツール実行',
  shareModelsCount: '種のモデル',
  shareSignature: 'AIとの振り返り',
  traitSpec: '仕様を先に定義',
  traitEvidence: '根拠を厳密に照合',
  traitDelegate: '一任して任せる',
  traitBoundaries: '納品基準を遵守',
  traitExplore: '柔軟に探索',
  traitTone: '文体と表現に配慮',
  traitPace: '協調ペースを掌握',
  contextWhoUser: 'ユーザー',
}


    const es = {
  loading: 'Abriendo…',
  tagline: 'Mira cómo tú y la IA han trabajado juntos últimamente.',
  intentionLabel: '¿Qué has tenido en mente últimamente?',
  intentionHint: 'Opcional. Si anotas una intención, el análisis puede sugerir pequeños experimentos.',
  intentionPlaceholder: '¿En qué te gustaría que se centre el análisis? Puedes contármelo aquí o dejarlo en blanco.',
  chips: 'Trabajar más rápido|Aprender algo nuevo|Mantener mi propia voz|Hacer entregas más fiables|Simple curiosidad',
  rangeLabel: 'Periodo a revisar',
  r7: '7 días', r30: '30 días', r90: '90 días', r365: '1 año', rAll: 'Todo', rCustom: 'Elegir fechas',
  rFrom: 'Desde', rTo: 'Hasta',
  'error.bad-range': 'El rango de fechas no es válido. Comprueba las fechas de inicio y fin.',
  rangeAllHint: 'Cuando hay muchos registros, se muestrean de forma uniforme para representar cada etapa.',
  settingsMore: 'Más',
  changelogBtn: 'Registro de cambios', philosophyBtn: 'La filosofía de Melete', letterBtn: 'Carta del creador',
  back: 'Volver a ajustes',
  changelogTitle: 'Registro de cambios',
  changelogSub: "Versión 1 · 8 de noviembre de 2026",
  changelogItems: "## Análisis|Hay una nueva entrada «Análisis» en la barra lateral de DSH. Solo lee tus sesiones locales y refleja cómo habéis trabajado juntos tú y la IA; sin puntuaciones, sin clasificaciones y sin enviar nada a ninguna parte.|El inicio lo explica en una línea, con «Iniciar análisis» en el centro; el rango actual y el modelo que usas están siempre a la vista.|El campo de intención aparece abierto por defecto: puedes escribir lo que te importa últimamente o tocar una frase ya preparada. Solo si hay una intención, el análisis propondrá pequeños experimentos dirigidos a ella.|Los rangos son 7 días, 30 días, 90 días, 1 año, todo, fechas a mano y por año. Por defecto el cambio de año ocurre el 1 de marzo (enero y febrero usan el año anterior), y cuando hay muchos registros se muestrean de forma uniforme a lo largo del tiempo.|Un análisis se hace en tres pasos: leer los registros locales → el modelo que elegiste escribe → encuadernar las tarjetas. Suele tardar uno o dos minutos, así que puedes ir a hacer otra cosa.|La petición va del plugin directamente al modelo que elegiste en DSH. No se crea ninguna sesión, así que el análisis nunca aparece en tus registros de conversación.|## Tarjetas|Un análisis es un mazo de tarjetas: la portada indica el rango y «quién mira a quién», y debajo se ordenan cuatro direcciones: tú usando la IA, la IA hacia ti, tú y el mundo, y el ser interior.|Cada espejo abre con un breve texto; las fuentes y lo que se consideró entonces quedan plegados debajo. Cada observación ofrece al menos dos lecturas, y dice claramente cuando algo no se ve bien.|Al hacer clic en una fuente se abre «Ver diálogo original y contexto» y puedes leer allí mismo las palabras anonimizadas de entonces, sin volver a buscar en las sesiones.|Los juicios centrales del texto se marcan con un rotulador cálido y se acompañan de una o dos píldoras de rasgos, para que tus hábitos recientes de colaboración se vean de un vistazo.|El lado de la IA, el trato con el exterior y una pregunta tienen cada uno su tarjeta; cada espejo termina con una cita de una civilización antigua que encaja con el momento.|El «ser interior» es una carta sellada: plegada por defecto, sin contenido generado todavía, esperando a una versión posterior.|El historial de análisis permite revisar análisis anteriores y borrar uno solo. Cada análisis se guarda en JSON y en Markdown, y se procura que los antiguos sigan abriéndose.|Al terminar cada análisis se muestran los tokens consumidos y un coste estimado según el modelo elegido, calculado en tu ordenador y sin conexión.|## Voces|A la derecha del inicio está «Voces · Fragmentos de conversación»: respuestas de varias IA y amigos a cuatro preguntas, una tarjeta por pregunta, dos columnas que se deslizan despacio, se detienen al pasar el ratón y muestran el texto completo al hacer clic.|También puedes añadir tus propias tarjetas de conversación: se guardan solo en este ordenador y antes de guardar hay una lista de comprobación de privacidad.|## Tu nuevo mundo|«Tu nuevo mundo: Vista previa» incluye un carrusel de paisajes de Xinjiang y una selección de flujos de trabajo de IA y Skill de código abierto, y marca los que «se parecen a tu forma reciente de trabajar» según tus hábitos de colaboración.|Cada tarjeta de recomendación indica un resumen, por qué encaja, el repositorio, la licencia y un enlace directo a la fuente. Las fotos y las recomendaciones vienen dentro del plugin y no hacen peticiones de red al ejecutarse.|La página lo dice con sinceridad: este terreno todavía está creciendo, es el primer esbozo de un mapa de métodos futuro.|## Compartir|«Compartir mi balance» ya viene maquetado por defecto: una vista previa tipo postal, con tema claro u oscuro y tamaños cuadrado, tarjeta, vertical o imagen larga.|Si no quieres un bloque o una frase, pasa el cursor y haz clic para ocultarlo; el texto también se puede editar en el sitio.|Con un clic puedes copiar la imagen, copiar el texto de la publicación, guardar la imagen larga o el HTML; el análisis completo también se puede exportar como un archivo HTML.|Al compartir no se incluye el ser interior y se evitan nombres de proyectos identificables, fuentes de sesiones e identificadores. No hay botones de redes sociales ni te insiste para compartir.|## Apariencia|Ocho pieles de civilizaciones antiguas: Hélade antigua, China antigua, Babilonia antigua, India antigua, Egipto antiguo, Roma antigua, Maya e Inca, cada una con su paleta, su cielo, su emblema, su numeración, sus adornos y una cita en la esquina.|El fondo está dibujado con código: paisajes y arquitectura a línea. Al bajar por el historial de análisis, el edificio crece trazo a trazo; el sol y la luna, las nubes, las figuras y los animales responden al ratón, y las citas antiguas pasan flotando como comentarios tenues.|El estilo sigue tu región por defecto y también se puede fijar; con «cambiar de vez en cuando», la mitad de las veces aparece tu civilización local y la otra mitad una de las demás al azar.|El modo claro y oscuro sigue a DSH o se elige a mano; la tipografía y la reducción de movimiento siguen a DSH y al sistema; también se cuidan las pantallas pequeñas, el uso con teclado y las etiquetas de lector de pantalla.|## Idiomas|La interfaz está traducida por completo a ocho idiomas: 简体中文, English, 日本語, Español, Français, Deutsch, Русский y Português. Voces, recomendaciones, textos para compartir, citas y ajustes cambian con ella.|El texto del análisis se escribe en el idioma de la interfaz que estabas usando; el nombre de la barra lateral sigue a DSH, y el título al entrar es «Melete» más la palabra que cada idioma usa para el análisis.|## Privacidad y datos|Solo se usan las palabras que escribiste tú; los correos, los teléfonos y las claves se sustituyen en local antes de entregar nada al modelo que elegiste. Sin conexión, sin envíos, sin servidores y sin telemetría.|Los análisis y los ajustes viven solo en ~/.melete/; en los ajustes puedes ver la ubicación y borrar un análisis o todos los datos cuando quieras.|Cuando algo falla, solo se anotan en local números como la longitud y el motivo de finalización, nunca el contenido; los datos antiguos, los campos que faltan y los reintentos por desconexión tienen su propia alternativa y su aviso.|## Ajustes y documentación|Los ajustes incluyen idioma, apariencia, periodo por defecto, nota de privacidad, ubicación de los datos y borrado en un clic, además de Acerca de (versión, versión del Mapa de observación, licencia).|Incluye «La filosofía de Melete» (lo relativamente estable / lo que aún estoy pensando / el objetivo / unas palabras a modo de prólogo), «Carta del creador» y este registro de cambios.|Esta versión es 0.1.1 Telos Ultra, con Mapa de observación 0.4.0; el código es Apache-2.0 y el Mapa de observación, CC BY 4.0.",
  philosophyTitle: 'La filosofía de Melete',
  philosophySub: 'Repasa cómo tú y la IA trabajan juntos.',
  philosophyBody: 'Melete te permite ver cómo colaboras con la IA. Tú decides qué es lo adecuado: un mismo hábito puede tener sentido según el objetivo.|Sin puntuaciones, sin clasificaciones, sin etiquetas.|Cada observación surge de una conversación real y tiene al menos dos interpretaciones posibles.|La IA también pasa por el espejo: si asiente sin cuestionar o si decide por ti.|Tus datos se procesan únicamente en tu ordenador. Melete no tiene servidores ni recopila información; puedes borrarlo todo cuando quieras.|Después del espejo, pasa a la acción: reflexiona, prueba un experimento y vuelve a mirar.',
  philosophyNote: 'Esta página es un borrador basado en los principios del proyecto; el creador la redactará de nuevo.',
  makerLetterTitle: 'Carta del creador',
  makerLetterSub: 'Escrito en medio del clamor de las olas',
  makerLetterBody: 'Hola, bienvenido a Melete.|Hay dos tipos de espejos en este mundo: uno es el espejo de la risa de un parque de atracciones, que te hace lucir alto y elegante solo para divertir a la multitud; el otro es el espejo de mercurio corriente del lavabo por la mañana, frío e implacable, que refleja con nitidez hasta las ojeras de una mala noche.|Los balances de fin de año en las redes sociales son casi siempre lo primero. Pero cuando vi que alguien empezaba a examinar con ojos serenos los hábitos de pensamiento y el dominio de herramientas de una persona frente a la IA, sentí un regocijo largamente esperado: así es como se respeta a una persona inteligente.|Melete nació de esa rebeldía. No pretendemos disfrazar nada; solo queremos poner ante ti, con total nitidez, las habilidades de vanguardia, los métodos claros y, sobre todo, las huellas de tu propio pensamiento.|Nunca he creído en fiebres tecnológicas mesiánicas; solo creo en las personas concretas y vivas. Ojalá aquí, a través de los caracteres que tecleaste, puedas palpar los contornos de tu propia forma con mayor claridad; y que este modesto esfuerzo te ayude a guardar tu libertad y lucidez en medio del rumor del oleaje.',
  makerLetterSign: 'Yan Canny · 8 de noviembre de 2026',
  start: 'Iniciar análisis',
  privacyNote: 'El resumen solo conserva lo que tú escribiste directamente; correos, teléfonos y claves se anonimizan localmente antes de enviarse al modelo que elegiste en DSH ({model}). Melete no realiza peticiones externas ni recopila nada.',
  noModel: 'No hay modelos disponibles en DSH. Selecciona uno en DSH primero.',
  run1: 'Leyendo registros locales', run2: '{model} está redactando', run3: 'Encuadernando tarjetas',
  runHint: 'Suele tardar uno o dos minutos. Puedes hacer otra cosa y regresar luego.',
  'error.no-records': 'No se encontraron conversaciones con aportaciones tuyas en este periodo. Prueba un rango mayor.',
  'error.no-model': 'No hay modelos disponibles en DSH. Selecciona uno en DSH primero.',
  'error.empty-review': 'El modelo no generó espejos en esta ocasión. Vuelve a intentarlo.',
  'error.bad-output': 'La respuesta no pudo estructurarse en tarjetas esta vez. Vuelve a intentarlo.',
  'error.busy': 'Ya hay un análisis en curso.',
  'error.generic': 'El análisis no pudo completarse: {msg}',
  retry: 'Reintentar',
  navReviews: 'Historial de análisis', navNew: 'Inicio', navUltra: 'Tu nuevo mundo: Vista previa', navSettings: 'Ajustes',
  ultraTitle: 'Tu Nuevo Mundo',
  ultraKicker: 'Vista previa',
  ultraSub: 'Flujos de trabajo, habilidades y patrones de IA seleccionados según tus hábitos de colaboración. Procedentes de proyectos de código abierto con licencias permisivas; puedes visitar las fuentes directamente.',
  ultraRecKicker: 'Flujos de trabajo y habilidades recomendadas',
  ultraRecTitle: 'Patrones de IA adecuados para ti',
  ultraFilterAll: 'Todo',
  ultraMatchedBadge: '★ Coincide con tus patrones recientes',
  ultraVisitLink: 'Ir a la fuente ↗',
  ultraRepoLabel: 'Repositorio: ',
  ultraAboutKicker: 'Un apunte previo',
  ultraAboutTitle: 'Sobre esta página',
  ultraPara1Label: 'Sobre el estado actual',
  ultraPara1: 'Este rincón aún no está terminado del todo; por debajo no es más que un montón de ladrillos y escombros. Siempre he creído que no basta con pasarse la vida ajetreado frente a una pantalla. Todos deberíamos tener un bosque propio, aunque tengamos que ir plantándolo poco a poco con código e ideas.',
  ultraPara2Label: 'Sobre Melete',
  ultraPara2: 'De aquí en adelante, lo que Melete pretende es muy sencillo: fijarse en tus manías cotidianas, ya sean métodos ortodoxos o atajos improvisados, y rebuscar en la red de todo el mundo herramientas útiles y trucos ingeniosos para ponértelos en la mano. La chispa que deba encender la IA dependerá siempre de lo que te dicte el corazón. Si consigue que en tu día a día veas un poco más claro, aprendas algo nuevo y vivas con más soltura y sosiego, Melete habrá cumplido su cometido.',
  ultraPara3Label: 'Sobre el paisaje de fondo',
  ultraPara3: 'Los bosques del fondo provienen de Sinkiang, en China. Es una tierra de montañas majestuosas y aguas inmensas, de una belleza sobrecogedora. Ojalá los amigos de cualquier rincón del mundo se animen a visitarla cuando tengan ocasión: al fin y al cabo, los árboles y ríos del mundo real siempre serán infinitamente más hermosos que los de una pantalla.',
  ultraCreditsKicker: 'Fotografías y licencias',
  ultraCreditsTitle: 'Créditos de las fotos de Xinjiang',
  ultraCommonsLink: 'Fuente en Wikimedia Commons ↗',
  ultraDotAria: 'Cambiar a foto {n}',
  ultraResume: '▶ Reanudar carrusel',
  ultraPause: '❚❚ Pausar carrusel',
  ultraCurrent: 'Actual: {title}',
  usageExact: 'Consumo: {total} tokens ({in} entrada · {out} salida) · Coste estimado con {model}: ~{cost} ({code})',
  usageEst: 'Consumo: ~{total} tokens (~{in} entrada · ~{out} salida) · Coste estimado con {model}: ~{cost} ({code})',
  intentionOpen: 'Añadir una intención para este periodo (opcional)',
  intentionFold: 'Ocultar intención',
  pastReviews: 'Análisis anteriores',
  mirrors: 'Espejos observados',
  domainPos: '{n} espejos en total',
  seen: 'Contexto de entonces',
  evidence: 'Fuentes',
  byYou: 'Tu perspectiva', byAi: 'Actitud de la IA en ese momento', byThing: 'Exigencias de la tarea',
  readings: 'Fuentes y lecturas posibles',
  aiSide: 'El lado de la IA',
  noteToAi: 'Mensaje para tu IA',
  noteToAiHint: 'Si quieres, cópialo en las instrucciones personalizadas de tu IA.',
  society: 'Tú y el mundo exterior',
  question: 'Una pregunta',
  experiments: 'Pequeños experimentos según tu intención',
  intentExpTitle: 'Experimentos basados en la intención que anotaste',
  check: 'Para la próxima vez',
  letterTitle: 'Una carta para ti',
  letterBody: 'Con total sinceridad: esta parte aún no está lista ni madura, por lo que permanece cerrada por ahora.',
  notCovered: 'No explorado esta vez: {list}. Si quieres ver alguno la próxima vez, menciónalo en tu intención.',
  lensFoot: 'Mapa de observación {v} · mirado por {by}',
  intentionShown: 'Tu intención anotada',
  settingsLanguage: 'Idioma', followDsh: 'Seguir a DSH',
  settingsStyle: 'Apariencia', styleAuto: 'Según región', greek: 'Hélade antigua', chinese: 'China antigua', babylonian: 'Babilonia antigua', indian: 'India antigua', egyptian: 'Egipto antiguo', roman: 'Roma antigua', maya: 'Maya', inca: 'Inca',
  occasional: 'Cambiar de estilo de vez en cuando',
  settingsDays: 'Periodo por defecto',
  settingsPrivacy: 'Privacidad',
  privacyText: 'Melete no se conecta a internet por su cuenta ni recopila datos. La interacción con el exterior depende únicamente del modelo que configures. En los análisis, el extracto se envía al modelo de DSH y no se guarda en los registros de chat.',
  settingsData: 'Datos',
  dataText: 'Los análisis y ajustes solo se guardan en {dir}.',
  deleteAll: 'Eliminar todos los datos',
  deleteConfirm: '¿Eliminar todos los análisis y ajustes en {dir}? Esta acción no se puede deshacer.',
  deleted: 'Eliminado.',
  deleteThis: 'Eliminar este análisis', deleteThisConfirm: '¿Eliminar este análisis ({date})? Esta acción no se puede deshacer.',
  confirmDeleteBtn: 'Confirmar eliminación',
  confirmDeleteAllBtn: 'Confirmar borrado total',
  cancelBtn: 'Cancelar',
  deleteThisPrompt: '¿Eliminar este análisis? Esta acción no se puede deshacer.',
  settingsAbout: 'Acerca de',
  aboutText: 'Melete {v} {ed} · Mapa de observación {lv} · Apache-2.0',
  projectRepo: "Repositorio",
  cornerGreek: 'Melete (Μελέτη), musa griega de la práctica y la contemplación.',
  cornerChinese: '«Cada día me examino a mí mismo en tres aspectos.» — Analectas',
  cornerBabylonian: '«El que vio lo profundo conoció todas las cosas». — Poema de Gilgamesh',
  cornerIndian: '«Todo lo que somos es resultado de lo que hemos pensado». — Dhammapada',
  cornerEgyptian: '«Nadie nace sabio». — Máximas de Ptahhotep',
  cornerRoman: '«Enseñando, aprendemos». — Séneca',
  voicesTitle: 'Voces · Fragmentos de conversación',
  voicesSub: '{n} IA y amigos responden a cuatro preguntas, una tarjeta por respuesta · pausa al pasar el ratón · clic para leer',
  voicesAdd: '+ Añadir tarjeta',
  voicesRead: 'Leer ↗',
  voicesQNum: 'P{n}',
  voicesQ1: '¿Cómo esperas que la gente use la IA?',
  voicesQ2: '¿Qué debería hacer la IA al dar contenido a los usuarios?',
  voicesQ3: '¿Qué sentido debería tener para la sociedad lo que la gente produce con IA?',
  voicesQ4: '¿Cómo deberían enfrentarse a sí mismos los usuarios al usar la IA?',
  voicesQs1: 'Cómo usar la IA',
  voicesQs2: 'Qué debe hacer la IA',
  voicesQs3: 'Sentido para la sociedad',
  voicesQs4: 'Mirarse a uno mismo',
  voicesKindAI: 'IA',
  voicesKindFriend: 'Un amigo',
  voicesNoteAI: 'De una conversación entre Yan Canny y {name} el 8 de noviembre de 2026. Citado tal cual, solo dividido en párrafos. Si se repite la pregunta, la respuesta puede cambiar. No representa la postura del desarrollador del modelo; el nombre solo indica la fuente.',
  voicesNoteFriend: 'De una charla entre Yan Canny y un amigo, mostrada con su consentimiento y con un apodo. Citado tal cual, solo dividido en párrafos.',
  voicesTranslated: 'Traducido del original en chino.',
  voicesClose: 'Cerrar',
  voicesAria: 'Leer la respuesta de {name} a «{q}»',
  voicesFormTitle: 'Añadir una tarjeta de conversación',
  voicesFormName: 'Persona / modelo *',
  voicesFormNamePh: 'p. ej.: Claude Opus 5.5; para amigos, un apodo, no el nombre real',
  voicesFormKind: 'Etiqueta',
  voicesFormKindPh: 'p. ej.: IA, un amigo',
  voicesFormExcerpt: 'Una frase para la tarjeta *',
  voicesFormExcerptPh: 'Una frase que te hizo pensar…',
  voicesFormFull: 'Respuesta completa *',
  voicesFormFullPh: 'Pega las respuestas como «P1: …», «P2: …»; se dividen en una tarjeta por pregunta.',
  voicesFormNote: 'Nota (opcional)',
  voicesFormNotePh: 'p. ej.: reflexiones de 2026 sobre trabajar con IA',
  voicesSafety: 'Antes de guardar, revisa: quita nombres reales, empresas, proyectos, datos de contacto y cualquier dato personal en capturas. Las tarjetas se quedan en este ordenador y no se suben, pero quien vea una captura podrá leerlas.',
  voicesSafetyOk: 'He quitado lo anterior; si son palabras de un amigo, tengo su consentimiento',
  voicesCancel: 'Cancelar',
  voicesSave: 'Guardar tarjeta',
  homeRange: 'Rango: {r}',
  homeModel: 'Modelo: {m}',
  homeNoModel: 'Sin modelo conectado (configúralo en DSH)',
  homeAdv: 'Más · rango e intención',
  homeCollapse: 'Ocultar ▴',
  homeExpand: 'Mostrar ▾',
  homeRangeLabel: 'Elige el rango',
  homeByYear: 'Por año',
  homeCustom: 'Personalizado',
  homeAll: 'Todo',
  homeYearOpt: '{y}',
  homeDefault: ' (predeterminado)',
  homeYearHint: 'Desde el 1 de marzo pasa al año en curso; en enero y febrero se usa el año anterior.',
  homeIntentLabel: '¿En qué quieres que se centre el análisis? (opcional)',
  rangeYearFmt: '{y} ({a} a {b})',
  rangeSpanFmt: '{a} a {b}',
  rangeAllText: 'Todo el historial',
  rangeDaysText: 'Últimos {n} días',
  shareLight: 'Claro',
  shareDark: 'Oscuro',
  sharePhMoment: 'Un momento que guardar',
  sharePhAi: 'Una nota sobre la IA',
  sharePhQ: 'Una pregunta para mí',
  shareHashtag: '#MeleteAnálisis',
  cornerMaya: '«Que se levanten todos, que no se quede nadie atrás». — Popol Vuh',
  cornerInca: '«Ama sua, ama llulla, ama quella (No robes, no mientas, no seas ocioso)». — Sabiduría inca',
  settingsNotSaved: 'No se guardó. Cierra DSH por completo (⌘Q), vuelve a abrirlo e inténtalo de nuevo.',
  details: 'Fuentes y posibles motivos ({e} fuentes · {r} posibilidades)',
  viewContextBtn: 'Ver diálogo original y contexto',
  contextModalTitle: 'Contexto del diálogo',
  contextLoading: 'Cargando conversación original…',
  contextEmpty: 'No se encontró el registro local del diálogo; puede que se haya borrado.',
  contextClose: 'Cerrar contexto',
  domH: 'Tú → IA', domHsub: 'Cómo usas la IA',
  domA: 'IA → Ti', domAsub: 'Cómo te trata la IA',
  domS: 'Tú y el mundo', domSsub: 'Lo que fluye hacia afuera y adentro',
  domI: 'Ser interior', domIsub: 'Solo tú',
  mirrorCount: '{n} espejos', sealed: 'Carta · Próximamente',
  sealedHint: 'Abriremos esta carta en una versión posterior.',
  emptyH: 'Esta vez no se seleccionaron espejos en este ámbito.',
  emptyA: 'Esta vez no se seleccionaron espejos del lado de la IA.',
  emptyS: 'No se observaron intercambios con el exterior en este periodo. Solo reflejamos lo que apareció.',
  "ultraTag_all": "Todo",
  "ultraTag_specFirst": "Especificación previa",
  "ultraTag_twoStageEval": "Verificación estricta",
  "ultraTag_modularPatterns": "Pasos atómicos",
  "ultraTag_invertedInquiry": "Aclaración previa",
  "ultraTag_chunkMapReduce": "Síntesis jerárquica",
  "ultraSlide_fir-forest_title": "Tianshan · Bosque de abetos de Schrenk",
  "ultraSlide_fir-forest_credit": "Fotografía: lwtt93 (Shanghái) · Licencia: CC BY 2.0 (Atribución requerida, comercial y obras derivadas permitidas)",
  "ultraSlide_moon-bay_title": "Kanas · Bosque de Moon Bay",
  "ultraSlide_moon-bay_credit": "Fotografía: Niranarm · Licencia: Dominio público",
  "ultraSlide_foggy-lake_title": "Altay · Ribera brumosa del lago Kanas",
  "ultraSlide_foggy-lake_credit": "Fotografía: Muye Ma (vía Unsplash) · Licencia: CC0 1.0",
  "ultraSlide_autumn-lake_title": "Kanas · Arboleda otoñal y cumbres nevadas",
  "ultraSlide_autumn-lake_credit": "Fotografía: Charlie fong · Licencia: Dominio público",
  "ultraRec_spec-first_badge": "Especificación",
  "ultraRec_spec-first_title": "Spec-First: Encargo estructurado y directrices",
  "ultraRec_spec-first_summary": "Del tutorial oficial de Anthropic. Desglosa tareas en rol, contexto, líneas rojas y formato para evitar divagaciones.",
  "ultraRec_spec-first_matchReason": "Se adapta a tu costumbre de fijar límites claros antes de delegar tareas completas",
  "ultraRec_two-stage-eval_badge": "Verificación",
  "ultraRec_two-stage-eval_title": "Verificación en dos fases y cadena de contraste",
  "ultraRec_two-stage-eval_summary": "Separa la recopilación de evidencias objetivas de la conclusión final, asegurando citas textuales precisas.",
  "ultraRec_two-stage-eval_matchReason": "Se adapta a tu meticulosidad con las evidencias verificables y las citas exactas",
  "ultraRec_modular-patterns_badge": "Pasos atómicos",
  "ultraRec_modular-patterns_title": "Microhabilidades modulares y patrones combinados",
  "ultraRec_modular-patterns_summary": "Un sistema minimalista que convierte extracción, síntesis y revisión en herramientas estándar conectadas por tuberías.",
  "ultraRec_modular-patterns_matchReason": "Ideal para descomponer tareas amplias en etapas atómicas y manejables",
  "ultraRec_inverted-inquiry_badge": "Aclaración",
  "ultraRec_inverted-inquiry_title": "Aclaración inversa y alineación previa",
  "ultraRec_inverted-inquiry_summary": "La IA formula preguntas clave sobre detalles del encargo antes de empezar, despejando ambigüedades a tiempo.",
  "ultraRec_inverted-inquiry_matchReason": "Adecuado cuando deseas que la IA señale dudas y explore nuevas perspectivas antes de actuar",
  "ultraRec_chunk-map-reduce_badge": "Síntesis",
  "ultraRec_chunk-map-reduce_title": "Extracción jerárquica y agregación por fases",
  "ultraRec_chunk-map-reduce_summary": "Divide textos extensos en subsecciones para extraer datos clave y los consolida al final sin perder detalles.",
  "ultraRec_chunk-map-reduce_matchReason": "Adecuado para compilar materiales de múltiples diálogos y documentos extensos",
  emptyReviewsHint: "Aún no hay análisis guardados. Ve al inicio para comenzar tu primer análisis.",
  'error.network-error': "Error de conexión con el servicio local del plugin. Inténtalo de nuevo.",
  sharePostcardBtn: 'Compartir mi balance',
  exportReviewBtn: 'Exportar balance (HTML)',
  shareTitle: 'Compartir este período',
  shareSub: 'Listo por defecto, guarda con un clic',
  shareCopyImg: '⧉ Copiar imagen',
  shareSaveImg: '↓ Guardar imagen larga',
  shareCopyText: '✎ Copiar texto',
  shareSaveHtml: '⌂ Guardar HTML',
  shareCopiedImgToast: 'Copiado al portapapeles',
  shareSavedImgToast: 'Guardado en ~/.melete/shares/',
  shareCopiedTextToast: 'Texto copiado con #MeleteDebrief',
  shareSavedHtmlToast: 'HTML guardado en ~/.melete/shares/',
  shareExportedToast: 'Balance completo guardado en ~/.melete/shares/',
  shareRevealFinder: 'Mostrar en Finder',
  shareHideBlockHint: 'Haz clic en ◉ para ocultar; edita el texto directamente',
  shareMoreOptions: 'Más: Estilo · Tamaño · Tema · Firma',
  shareTagCover: 'Este período',
  shareTagNums: 'Cifras',
  shareTagPractices: 'Mis prácticas',
  shareTagMoment: 'Un momento',
  shareTagSplit: 'División del trabajo',
  shareTagAiNote: 'Del lado de la IA',
  shareTagDial: 'Horas de trabajo en común',
  shareTagQuestion: 'Una pregunta personal',
  shareMine: 'Hecho por mí',
  shareAi: 'Delegado a la IA',
  shareSessions: 'sesiones',
  shareUserMsgs: 'mensajes míos',
  shareToolCalls: 'acciones de herramientas',
  shareModelsCount: 'modelos usados',
  shareSignature: 'Mi balance de IA',
  traitSpec: 'Definir especificaciones',
  traitEvidence: 'Verificar evidencias',
  traitDelegate: 'Delegar con confianza',
  traitBoundaries: 'Cuidar los límites',
  traitExplore: 'Explorar y probar',
  traitTone: 'Cuidar el tono',
  traitPace: 'Ritmo equilibrado',
  contextWhoUser: 'Usuario',
}


    const fr = {
  loading: 'Ouverture…',
  tagline: 'Regardez comment vous et l’IA avez travaillé ensemble ces derniers temps.',
  intentionLabel: 'Qu’aviez-vous à cœur ces derniers temps ?',
  intentionHint: 'Facultatif. En précisant une intention, le débrief peut proposer de petites expériences.',
  intentionPlaceholder: 'Sur quoi souhaitez-vous porter votre attention ? Vous pouvez l’écrire ici, ou laisser vide.',
  chips: 'Gagner en efficacité|Apprendre du nouveau|Préserver mon style|Rendre mes livrables plus fiables|Simple curiosité',
  rangeLabel: 'Période analysée',
  r7: '7 jours', r30: '30 jours', r90: '90 jours', r365: '1 an', rAll: 'Tout', rCustom: 'Choisir les dates',
  rFrom: 'Du', rTo: 'Au',
  'error.bad-range': 'La plage de dates n’est pas valide. Vérifiez la date de début et de fin.',
  rangeAllHint: 'Quand les enregistrements sont nombreux, un échantillonnage régulier est effectué dans le temps.',
  settingsMore: 'Plus',
  changelogBtn: 'Notes de version', philosophyBtn: 'La philosophie de Melete', letterBtn: 'Lettre de l’auteur',
  back: 'Retour aux paramètres',
  changelogTitle: 'Notes de version',
  changelogSub: "Version 1 · 8 novembre 2026",
  changelogItems: "## Débrief|Une nouvelle entrée « Débrief » dans la barre latérale de DSH : elle ne lit que vos sessions locales et montre comment vous et l’IA travaillez ensemble ; pas de notes, pas de classement, rien n’est envoyé.|La page d’accueil le résume en une phrase, avec « Démarrer le débrief » au centre ; la période et le modèle en cours restent visibles à tout moment.|Le champ d’intention est ouvert par défaut : notez ce qui vous importe en ce moment, ou cliquez sur une phrase toute prête. C’est seulement avec une intention que le débrief propose de petites expériences adaptées.|La période se choisit en 7 jours, 30 jours, 90 jours, 1 an, tout l’historique, dates manuelles ou par année ; par défaut, l’année bascule au 1er mars (janvier et février comptent l’année précédente), et les historiques volumineux sont échantillonnés uniformément dans le temps.|Un débrief se déroule en trois étapes : lire les enregistrements locaux → le modèle choisi rédige → assembler les cartes ; cela prend généralement une à deux minutes, vous pouvez vaquer à autre chose.|La requête part directement du plugin vers le modèle que vous avez choisi dans DSH. Aucune session n’est créée, le débrief n’apparaît donc jamais dans l’historique de vos sessions.|## Cartes|Un débrief, c’est une pile de cartes : la couverture indique la période et « qui regarde qui », puis quatre directions — vous avec l’IA, l’IA face à vous, vous et le monde, et le soi intérieur.|Chaque miroir commence par un court passage ; les sources et les considérations d’alors se replient juste en dessous. Chaque observation propose au moins deux lectures, et le dit quand les choses restent floues.|Un clic sur une source ouvre « Voir le dialogue original et son contexte » : vous lisez sur place les mots d’origine, anonymisés, sans avoir à fouiller vos sessions.|Les jugements essentiels sont soulignés au surligneur chaleureux, accompagnés d’une ou deux pastilles de synthèse, pour voir d’un coup d’œil vos habitudes de collaboration récentes.|Le côté IA, les échanges avec l’extérieur et une question ont chacun leur carte ; chaque miroir se termine par une citation d’une civilisation ancienne qui colle au moment.|« Soi intérieur » est une lettre scellée : repliée par défaut, sans contenu généré pour l’instant, à ouvrir dans une version ultérieure.|L’historique des débriefs permet de relire les débriefs passés et d’en supprimer un seul ; chaque débrief est enregistré en JSON et en Markdown, et les anciens restent ouvrables dans la mesure du possible.|À la fin de chaque débrief, vous voyez le nombre de jetons consommés et une estimation du coût sur le modèle choisi, calculée en local, sans réseau.|## Voix|À droite de la page d’accueil, « Voix · Extraits de conversations » : plusieurs IA et amis répondent à quatre questions, une carte par question, deux colonnes qui défilent lentement, pause au survol, texte complet au clic.|Vous pouvez aussi ajouter vos propres cartes de conversation : elles restent uniquement sur cet ordinateur, avec une liste de vérification de confidentialité avant l’enregistrement.|## Votre nouveau monde|« Votre nouveau monde : Aperçu » propose un carrousel de paysages du Xinjiang, ainsi qu’une sélection de flux de travail et de Skills open source, avec la mention « proche de votre façon de faire récente » pour ceux qui correspondent à vos habitudes.|Chaque carte de recommandation indique un résumé, la raison de la correspondance, le dépôt, la licence et un lien direct vers la source ; photos et recommandations sont embarquées dans le plugin et ne font aucun appel réseau à l’exécution.|La page le dit franchement : ce terrain pousse encore, c’est la première esquisse d’une future carte des méthodes.|## Partage|« Partager mon bilan » est déjà mis en page par défaut : un aperçu façon carte postale, en clair ou en sombre, aux formats carré, carte, portrait ou image longue.|Un bloc ou une phrase de trop ? Survolez-le et cliquez pour le masquer. Le texte se modifie aussi sur place.|En un clic : copier l’image, copier le texte de publication, enregistrer une image longue ou le HTML ; le débrief complet peut aussi être exporté en HTML.|Le partage laisse de côté le soi intérieur et évite les noms de projets, les sources de sessions et les identifiants reconnaissables ; aucun bouton de réseau social, aucune invitation à partager.|## Apparence|Huit habits de civilisations anciennes : Hellade antique, Chine antique, Babylone antique, Inde antique, Égypte antique, Rome antique, Maya et Inca, chacun avec sa palette, son ciel, son emblème, sa numérotation, ses ornements et sa citation en coin de page.|Le fond est dessiné en code : paysages et architectures au trait. En faisant défiler un débrief, le bâtiment pousse trait après trait ; soleil, lune, nuages, silhouettes et animaux réagissent à la souris, et les citations anciennes glissent doucement comme des commentaires défilants.|Le style suit votre région par défaut, et peut être figé ; avec « Changer de style occasionnellement », la moitié du temps votre civilisation locale apparaît, l’autre moitié une civilisation tirée au hasard parmi les autres.|Le clair et le sombre suivent DSH ou votre choix ; les polices et la réduction des animations suivent DSH et le système ; petits écrans, navigation au clavier et libellés pour lecteurs d’écran sont aussi pris en compte.|## Langues|L’interface est entièrement traduite en huit langues : 简体中文, English, 日本語, Español, Français, Deutsch, Русский, Português ; Voix, recommandations, textes de partage, citations et paramètres suivent.|Le texte du débrief est écrit dans la langue d’interface que vous utilisiez ; le nom dans la barre latérale suit DSH, et une fois ouvert, le titre est « Melete » suivi du mot propre à chaque langue.|## Confidentialité et données|Seuls les mots que vous avez écrits vous-même sont utilisés ; adresses courriel, numéros de téléphone et clés sont remplacés localement avant d’être confiés au modèle que vous avez choisi. Aucun réseau, aucun envoi, aucun serveur, aucune télémétrie.|Les débriefs et les réglages vivent uniquement dans ~/.melete/ ; la page des paramètres montre l’emplacement et permet de supprimer un débrief ou toutes les données à tout moment.|En cas d’échec, seuls des chiffres comme la longueur et la raison de fin sont consignés en local, jamais le contenu ; données anciennes, champs manquants et reconnexions ont chacun leur repli et leur message.|## Paramètres et documentation|Les paramètres réunissent langue, apparence, période par défaut, note de confidentialité, emplacement des données et suppression en un clic, plus À propos (version, version du Miroir d’observation, licence).|On y trouve aussi « La philosophie de Melete » (relativement stable / encore en réflexion / l’objectif / un mot d’introduction), la « Lettre de l’auteur » et ces notes de version.|Cette version est 0.1.1 Telos Ultra, avec le Miroir d’observation 0.4.0 ; le code est sous Apache-2.0, le Miroir d’observation sous CC BY 4.0.",
  philosophyTitle: 'La philosophie de Melete',
  philosophySub: 'Revenez sur la façon dont vous et l’IA travaillez ensemble.',
  philosophyBody: 'Melete vous montre comment vous collaborez avec l’IA. Vous seul décidez de la valeur : une même pratique peut être pertinente selon vos objectifs.|Pas de notes, pas de classements, pas d’étiquettes.|Chaque observation s’appuie sur des échanges réels et propose au moins deux lectures possibles.|L’IA passe aussi devant le miroir : acquiesce-t-elle sans recul, choisit-elle à votre place ?|Vos données sont traitées uniquement sur votre appareil. Melete n’a aucun serveur et ne collecte rien ; vous pouvez tout supprimer à tout moment.|Après le miroir, passez à l’action : prenez du recul, essayez une petite expérience, et observez à nouveau.',
  philosophyNote: 'Cette page est une ébauche tirée des principes du projet ; l’auteur la réécrira.',
  makerLetterTitle: 'Lettre de l’auteur',
  makerLetterSub: 'Écrit dans le fracas de la marée',
  makerLetterBody: 'Bonjour et bienvenue sur Melete.|Il existe deux sortes de miroirs en ce monde : le premier est le miroir déformant des fêtes foraines, qui vous grandit et vous donne belle allure pour amuser la galerie ; le second est le miroir ordinaire au réveil, froid et impitoyable, qui révèle sans fard jusqu’aux cernes d’une nuit sans sommeil.|Les rétrospectives de fin d’année sur les réseaux sociaux relèvent presque toujours du premier. Mais en voyant des regards sereins se poser enfin sur les habitudes de réflexion et la maîtrise des outils d’un être face à l’IA, j’ai éprouvé un soulagement rare : voilà enfin ce que signifie respecter l’intelligence d’une personne.|Melete est né de ce refus du faux-semblant. Nous n’avons nulle intention de travestir quoi que ce soit : nous voulons simplement poser sous vos yeux les compétences de pointe, les méthodes limpides et, avant tout, les empreintes de votre propre pensée.|Je n’ai jamais cru aux déferlantes technologiques providentielles ; je ne crois qu’aux êtres concrets et vivants. J’espère qu’à travers ces mots que vous avez frappés, vous discernerez un peu plus nettement vos propres contours, et que ce modeste effort vous aidera à préserver votre liberté et votre lucidité au cœur du tumulte.',
  makerLetterSign: 'Yan Canny · 8 novembre 2026',
  start: 'Démarrer le débrief',
  privacyNote: 'Le résumé ne retient que ce que vous avez vous-même saisi ; adresses courriel, téléphones et clés secrètes sont anonymisés localement avant transmission au modèle choisi dans DSH ({model}). Melete ne fait aucun appel distant et ne collecte rien.',
  noModel: 'Aucun modèle disponible dans DSH. Choisissez-en un d’abord dans DSH.',
  run1: 'Lecture des enregistrements locaux', run2: '{model} rédige', run3: 'Assemblage des cartes',
  runHint: 'Cela prend généralement une à deux minutes. Vous pouvez vaquer à d’autres occupations.',
  'error.no-records': 'Aucune session avec vos propres saisies trouvée sur cette période. Essayez une durée plus large.',
  'error.no-model': 'Aucun modèle disponible dans DSH. Choisissez-en un d’abord dans DSH.',
  'error.empty-review': 'Le modèle n’a pas produit de miroirs cette fois-ci. Réessayez.',
  'error.bad-output': 'La réponse n’a pas pu être convertie en cartes cette fois-ci. Réessayez.',
  'error.busy': 'Un débrief est déjà en cours.',
  'error.generic': 'Le débrief n’a pas pu aboutir : {msg}',
  retry: 'Réessayer',
  navReviews: 'Historique des débriefs', navNew: 'Accueil', navUltra: 'Votre nouveau monde : Aperçu', navSettings: 'Paramètres',
  ultraTitle: 'Votre Nouveau Monde',
  ultraKicker: 'Aperçu',
  ultraSub: 'Flux de travail, compétences et pratiques d’IA sélectionnés selon vos habitudes de travail. Issus de dépôts open source renommés (licences permissives) — cliquez pour explorer les sources.',
  ultraRecKicker: 'Flux de travail et compétences recommandés',
  ultraRecTitle: 'Des approches IA adaptées à vos besoins',
  ultraFilterAll: 'Tout',
  ultraMatchedBadge: '★ En accord avec vos habitudes récentes',
  ultraVisitLink: 'Voir le dépôt ↗',
  ultraRepoLabel: 'Dépôt : ',
  ultraAboutKicker: 'Un mot d’introduction',
  ultraAboutTitle: 'À propos de cette page',
  ultraPara1Label: 'À propos de l’état actuel',
  ultraPara1: 'Cet endroit n’est pas encore tout à fait fini ; sous la surface, ce n’est encore qu’un amas de gravats et de briques. J’ai toujours pensé qu’on ne pouvait se contenter de s’agiter devant un écran. Chacun devrait avoir un petit bout de forêt à soi, quitte à le faire pousser arbre après arbre, avec quelques lignes de code et des idées.',
  ultraPara2Label: 'À propos de Melete',
  ultraPara2: 'Pour la suite, le souhait de Melete est très simple : partir de vos habitudes quotidiennes — qu’elles soient méthodiques ou tout à fait buissonnières — pour dénicher sur la vaste toile mondiale des outils commodes et des tours de main ingénieux à vous glisser entre les mains. Quelle étincelle l’IA doit allumer, cela ne dépend que de votre propre cœur. Si cela peut vous aider à y voir un peu plus clair, à apprendre un peu plus et à vivre avec un peu plus d’aisance et de souffle, Melete aura rempli sa mission.',
  ultraPara3Label: 'À propos du paysage',
  ultraPara3: 'La forêt en arrière-plan a été photographiée dans le Xinjiang, en Chine. Les montagnes y sont grandioses et les eaux immenses ; le paysage y est d’une beauté saisissante. Que les amis du monde entier n’hésitent pas à venir s’y promener à l’occasion — les arbres et les rivières du monde réel restent, après tout, infiniment plus beaux que tout ce que peut montrer un écran.',
  ultraCreditsKicker: 'Photographies et licences',
  ultraCreditsTitle: 'Crédits photographiques du Xinjiang',
  ultraCommonsLink: 'Source Wikimedia Commons ↗',
  ultraDotAria: 'Afficher la photo {n}',
  ultraResume: '▶ Reprendre le défilement',
  ultraPause: '❚❚ Suspendre le défilement',
  ultraCurrent: 'Actuel : {title}',
  usageExact: 'Consommation : {total} jetons ({in} entrée · {out} sortie) · Coût estimé ({model}) : ~{cost} ({code})',
  usageEst: 'Consommation : ~{total} jetons (~{in} entrée · ~{out} sortie) · Coût estimé ({model}) : ~{cost} ({code})',
  intentionOpen: 'Ajouter une intention pour cette période (facultatif)',
  intentionFold: 'Masquer l’intention',
  pastReviews: 'Débriefs passés',
  mirrors: 'Quelques miroirs',
  domainPos: '{n} miroirs au total',
  seen: 'Le contexte d’alors',
  evidence: 'Sources',
  byYou: 'Votre angle de vue', byAi: 'L’attitude de l’IA à ce moment', byThing: 'Ce que demandait le sujet',
  readings: 'Sources et lectures envisageables',
  aiSide: 'Du côté de l’IA',
  noteToAi: 'Un mot pour votre IA',
  noteToAiHint: 'Si vous le souhaitez, insérez ce mot dans les instructions personnalisées de votre IA.',
  society: 'Vous et le monde extérieur',
  question: 'Une question',
  experiments: 'Petites expériences selon votre intention',
  intentExpTitle: 'Expériences adaptées à l’intention que vous avez notée',
  check: 'À observer la prochaine fois',
  letterTitle: 'Une lettre pour vous-même',
  letterBody: 'Pour être tout à fait honnête : cette partie n’est ni aboutie ni prête, elle reste donc close pour l’instant.',
  notCovered: 'Non abordé cette fois-ci : {list}. Si vous souhaitez explorer un aspect particulier, mentionnez-le dans votre prochaine intention.',
  lensFoot: 'Miroir d’observation {v} · examiné par {by}',
  intentionShown: 'Votre intention formulée',
  settingsLanguage: 'Langue', followDsh: 'Suivre DSH',
  settingsStyle: 'Apparence', styleAuto: 'Selon la région', greek: 'Hellade antique', chinese: 'Chine antique', babylonian: 'Babylone antique', indian: 'Inde antique', egyptian: 'Égypte antique', roman: 'Rome antique', maya: 'Maya', inca: 'Inca',
  occasional: 'Changer de style occasionnellement',
  settingsDays: 'Période par défaut',
  settingsPrivacy: 'Confidentialité',
  privacyText: 'Melete ne se connecte pas à internet et ne collecte aucune donnée. Les interactions extérieures dépendent uniquement du modèle configuré. Lors d’un débrief, l’extrait est soumis au modèle choisi dans DSH et ne transite pas par vos fils de discussion ordinaires.',
  settingsData: 'Données',
  dataText: 'Les débriefs et réglages sont stockés exclusivement dans {dir}.',
  deleteAll: 'Supprimer toutes les données',
  deleteConfirm: 'Supprimer tous les débriefs et réglages dans {dir} ? Cette action est irréversible.',
  deleted: 'Données supprimées.',
  deleteThis: 'Supprimer ce débrief', deleteThisConfirm: 'Supprimer ce débrief ({date}) ? Cette action est irréversible.',
  confirmDeleteBtn: 'Confirmer la suppression',
  confirmDeleteAllBtn: 'Confirmer la suppression totale',
  cancelBtn: 'Annuler',
  deleteThisPrompt: 'Supprimer ce débrief ? Cette action est irréversible.',
  settingsAbout: 'À propos',
  aboutText: 'Melete {v} {ed} · Miroir d’observation {lv} · Apache-2.0',
  projectRepo: "Dépôt",
  cornerGreek: 'Melete (Μελέτη), muse grecque de la pratique et de la méditation.',
  cornerChinese: '« Chaque jour, je m’examine sur trois points. » — Entretiens de Confucius',
  cornerBabylonian: '« Celui qui a vu les profondeurs connut toute chose. » — Épopée de Gilgamesh',
  cornerIndian: '« Tout ce que nous sommes naît de nos pensées. » — Dhammapada',
  cornerEgyptian: '« Nul ne naît sage. » — Maximes de Ptahhotep',
  cornerRoman: '« En enseignant, nous apprenons. » — Sénèque',
  voicesTitle: 'Voix · Extraits de conversations',
  voicesSub: '{n} IA et amis répondent à quatre questions, une carte par réponse · survol pour mettre en pause · clic pour lire',
  voicesAdd: '+ Ajouter une carte',
  voicesRead: 'Lire ↗',
  voicesQNum: 'Q{n}',
  voicesQ1: 'Comment espérez-vous que les gens utilisent l’IA ?',
  voicesQ2: 'Que devrait faire l’IA quand elle fournit du contenu aux utilisateurs ?',
  voicesQ3: 'Que devrait signifier pour la société ce que les gens produisent avec l’IA ?',
  voicesQ4: 'Comment les utilisateurs devraient-ils se regarder eux-mêmes en utilisant l’IA ?',
  voicesQs1: 'Utiliser l’IA',
  voicesQs2: 'Le rôle de l’IA',
  voicesQs3: 'Sens pour la société',
  voicesQs4: 'Se regarder soi-même',
  voicesKindAI: 'IA',
  voicesKindFriend: 'Un ami',
  voicesNoteAI: 'Extrait d’une conversation entre Yan Canny et {name} le 8 novembre 2026. Cité tel quel, seulement découpé en paragraphes. La même question reposée peut donner une autre réponse. Cela ne représente pas la position de l’éditeur du modèle ; le nom indique seulement la source.',
  voicesNoteFriend: 'Extrait d’une discussion entre Yan Canny et un ami, publiée avec son accord sous un pseudonyme. Cité tel quel, seulement découpé en paragraphes.',
  voicesTranslated: 'Traduit de l’original chinois.',
  voicesClose: 'Fermer',
  voicesAria: 'Lire la réponse de {name} à « {q} »',
  voicesFormTitle: 'Ajouter une carte de conversation',
  voicesFormName: 'Personne / modèle *',
  voicesFormNamePh: 'ex. : Claude Opus 5.5 ; pour un ami, un pseudo, pas son vrai nom',
  voicesFormKind: 'Étiquette',
  voicesFormKindPh: 'ex. : IA, un ami',
  voicesFormExcerpt: 'Une phrase pour la carte *',
  voicesFormExcerptPh: 'Une phrase qui fait réfléchir…',
  voicesFormFull: 'Réponse complète *',
  voicesFormFullPh: 'Collez les réponses sous la forme « Q1 : … », « Q2 : … » ; elles sont réparties en une carte par question.',
  voicesFormNote: 'Note (facultatif)',
  voicesFormNotePh: 'ex. : réflexions de 2026 sur le travail avec l’IA',
  voicesSafety: 'Avant d’enregistrer, vérifiez : retirez vrais noms, entreprises, projets, coordonnées et toute info personnelle dans les captures. Les cartes restent sur cet ordinateur et ne sont jamais envoyées, mais une capture partagée les rend lisibles.',
  voicesSafetyOk: 'J’ai retiré ces informations ; pour les mots d’un ami, j’ai son accord',
  voicesCancel: 'Annuler',
  voicesSave: 'Enregistrer',
  homeRange: 'Période : {r}',
  homeModel: 'Modèle : {m}',
  homeNoModel: 'Aucun modèle connecté (à configurer dans DSH)',
  homeAdv: 'Plus · période et intention',
  homeCollapse: 'Masquer ▴',
  homeExpand: 'Afficher ▾',
  homeRangeLabel: 'Choisir la période',
  homeByYear: 'Par année',
  homeCustom: 'Personnalisé',
  homeAll: 'Tout',
  homeYearOpt: '{y}',
  homeDefault: ' (par défaut)',
  homeYearHint: 'À partir du 1er mars, l’année en cours est choisie ; en janvier et février, l’année précédente.',
  homeIntentLabel: 'Sur quoi le débrief doit-il porter ? (facultatif)',
  rangeYearFmt: '{y} ({a} au {b})',
  rangeSpanFmt: '{a} au {b}',
  rangeAllText: 'Tout l’historique',
  rangeDaysText: '{n} derniers jours',
  shareLight: 'Clair',
  shareDark: 'Sombre',
  sharePhMoment: 'Un moment à garder',
  sharePhAi: 'Un mot sur le côté IA',
  sharePhQ: 'Une question pour moi',
  shareHashtag: '#MeleteDébrief',
  cornerMaya: '« Que tous se lèvent, que personne ne reste en arrière. » — Popol Vuh',
  cornerInca: '« Ne vole point, ne mens point, ne sois point paresseux. » — Maxime inca (Ama sua, ama llulla, ama quella)',
  settingsNotSaved: 'Non enregistré. Quittez complètement DSH (⌘Q), rouvrez-le, puis réessayez.',
  details: 'Sources et lectures possibles ({e} sources · {r} lectures)',
  viewContextBtn: 'Voir le dialogue original et son contexte',
  contextModalTitle: 'Contexte du dialogue',
  contextLoading: 'Chargement des échanges originaux…',
  contextEmpty: 'Échange local introuvable ou déjà nettoyé.',
  contextClose: 'Fermer le contexte',
  domH: 'Vous → IA', domHsub: 'Comment vous utilisez l’IA',
  domA: 'IA → Vous', domAsub: 'Comment l’IA agit envers vous',
  domS: 'Vous et le monde', domSsub: 'Ce qui circule avec l’extérieur',
  domI: 'Soi intérieur', domIsub: 'Vous-même',
  mirrorCount: '{n} miroirs', sealed: 'Lettre · Bientôt disponible',
  sealedHint: 'Vous pourrez ouvrir cette lettre dans une version ultérieure.',
  emptyH: 'Aucun miroir n’a été retenu sous cet angle cette fois-ci.',
  emptyA: 'Aucun miroir n’a été retenu du côté de l’IA cette fois-ci.',
  emptyS: 'Aucun échange avec l’extérieur n’a été relevé sur cette période. Seul ce qui est apparu est consigné.',
  "ultraTag_all": "Tout",
  "ultraTag_specFirst": "Cahier des charges",
  "ultraTag_twoStageEval": "Vérification factuelle",
  "ultraTag_modularPatterns": "Étapes atomiques",
  "ultraTag_invertedInquiry": "Clarification préalable",
  "ultraTag_chunkMapReduce": "Synthèse par étapes",
  "ultraSlide_fir-forest_title": "Tianshan · Forêt d’épicéas de Schrenk",
  "ultraSlide_fir-forest_credit": "Photo : lwtt93 (Shanghai) · Licence : CC BY 2.0 (Attribution requise, usage commercial et dérivés autorisés)",
  "ultraSlide_moon-bay_title": "Kanas · Forêt de Moon Bay",
  "ultraSlide_moon-bay_credit": "Photo : Niranarm · Licence : Domaine public",
  "ultraSlide_foggy-lake_title": "Altay · Rives brumeuses du lac Kanas",
  "ultraSlide_foggy-lake_credit": "Photo : Muye Ma (via Unsplash) · Licence : CC0 1.0",
  "ultraSlide_autumn-lake_title": "Kanas · Forêt d’automne et sommets enneigés",
  "ultraSlide_autumn-lake_credit": "Photo : Charlie fong · Licence : Domaine public",
  "ultraRec_spec-first_badge": "Cahier des charges",
  "ultraRec_spec-first_title": "Spec-First : Ordre de mission structuré et règles cadres",
  "ultraRec_spec-first_summary": "Tiré du guide d’ingénierie de prompts d’Anthropic. Décompose les tâches en rôles, contexte, limites strictes et formats attendus.",
  "ultraRec_spec-first_matchReason": "Correspond à votre habitude de poser les limites avant de déléguer l’ensemble de la tâche",
  "ultraRec_two-stage-eval_badge": "Vérification",
  "ultraRec_two-stage-eval_title": "Vérification factuelle en deux étapes et traçabilité",
  "ultraRec_two-stage-eval_summary": "Sépare l’extraction des faits de la synthèse finale pour ancrer chaque conclusion dans des citations vérifiées.",
  "ultraRec_two-stage-eval_matchReason": "Correspond à votre exigence de preuves concrètes et de citations rigoureuses",
  "ultraRec_modular-patterns_badge": "Étapes atomiques",
  "ultraRec_modular-patterns_title": "Micro-compétences modulaires et chaîne d’outils",
  "ultraRec_modular-patterns_summary": "Transforme les étapes de synthèse, de plan et de relecture en modules indépendants enchaînés avec clarté.",
  "ultraRec_modular-patterns_matchReason": "Idéal pour découper les flux de travail complexes en étapes simples et maîtrisées",
  "ultraRec_inverted-inquiry_badge": "Clarification",
  "ultraRec_inverted-inquiry_title": "Questionnement inversé et cadrage préalable",
  "ultraRec_inverted-inquiry_summary": "L’IA pose quelques questions ciblées sur les angles morts avant d’exécuter la tâche, évitant les malentendus.",
  "ultraRec_inverted-inquiry_matchReason": "Utile lorsque vous souhaitez que l’IA vérifie les détails et propose de nouvelles pistes avant d’écrire",
  "ultraRec_chunk-map-reduce_badge": "Synthèse",
  "ultraRec_chunk-map-reduce_title": "Extraction hiérarchique et agrégation de textes longs",
  "ultraRec_chunk-map-reduce_summary": "Répartit l’analyse de documents étendus sur plusieurs volets avant de fusionner les données essentielles.",
  "ultraRec_chunk-map-reduce_matchReason": "Adapté pour synthétiser des séries d’échanges ou de longs documents sans omission",
  emptyReviewsHint: "Aucun historique de débrief pour le moment. Rendez-vous sur l’accueil pour lancer votre premier débrief.",
  'error.network-error': "Échec de connexion au service local du plugin. Veuillez réessayer.",
  sharePostcardBtn: 'Partager mon bilan',
  exportReviewBtn: 'Exporter le bilan (HTML)',
  shareTitle: 'Partager cette période',
  shareSub: 'Prêt par défaut, enregistrez en un clic',
  shareCopyImg: '⧉ Copier l’image',
  shareSaveImg: '↓ Enregistrer l’image longue',
  shareCopyText: '✎ Copier le texte',
  shareSaveHtml: '⌂ Enregistrer le HTML',
  shareCopiedImgToast: 'Copié dans le presse-papiers',
  shareSavedImgToast: 'Enregistré dans ~/.melete/shares/',
  shareCopiedTextToast: 'Texte copié avec #MeleteDebrief',
  shareSavedHtmlToast: 'HTML enregistré dans ~/.melete/shares/',
  shareExportedToast: 'Bilan complet enregistré dans ~/.melete/shares/',
  shareRevealFinder: 'Afficher dans le Finder',
  shareHideBlockHint: 'Cliquez sur ◉ pour masquer ; cliquez sur le texte pour modifier',
  shareMoreOptions: 'Plus : Style · Format · Thème · Signature',
  shareTagCover: 'Cette période',
  shareTagNums: 'Chiffres',
  shareTagPractices: 'Mes pratiques',
  shareTagMoment: 'Un instant',
  shareTagSplit: 'Répartition du travail',
  shareTagAiNote: 'Du côté de l’IA',
  shareTagDial: 'Nos heures de travail',
  shareTagQuestion: 'Une question pour moi',
  shareMine: 'Gardé pour moi',
  shareAi: 'Confié à l’IA',
  shareSessions: 'sessions',
  shareUserMsgs: 'messages rédigés',
  shareToolCalls: 'actions d’outils',
  shareModelsCount: 'modèles utilisés',
  shareSignature: 'Mon bilan IA',
  traitSpec: 'Définir le cadre',
  traitEvidence: 'Vérifier les preuves',
  traitDelegate: 'Déléguer et faire confiance',
  traitBoundaries: 'Respecter les limites',
  traitExplore: 'Explorer et tester',
  traitTone: 'Soigner le style',
  traitPace: 'Maîtriser le rythme',
  contextWhoUser: 'Utilisateur',
}


    const de = {
  loading: 'Wird geöffnet…',
  tagline: 'Sieh dir an, wie du und die KI zuletzt zusammengearbeitet habt.',
  intentionLabel: 'Worauf hast du zuletzt geachtet?',
  intentionHint: 'Optional. Mit einem Vorhaben kann die Nachlese kleine Experimente vorschlagen.',
  intentionPlaceholder: 'Worauf soll die Nachlese besonders achten? Du kannst es hier notieren oder freilassen.',
  chips: 'Effizienter arbeiten|Neues lernen|Eigenen Sprachstil wahren|Ergebnisse verlässlicher machen|Einfach neugierig',
  rangeLabel: 'Zeitraum',
  r7: '7 Tage', r30: '30 Tage', r90: '90 Tage', r365: '1 Jahr', rAll: 'Alles', rCustom: 'Datum wählen',
  rFrom: 'Von', rTo: 'Bis',
  'error.bad-range': 'Der Datumsbereich ist ungültig. Bitte Start- und Enddatum prüfen.',
  rangeAllHint: 'Bei vielen Einträgen wird gleichmäßig über die Zeit verteilt stichprobenartig ausgewählt.',
  settingsMore: 'Mehr',
  changelogBtn: 'Änderungsprotokoll', philosophyBtn: 'Die Melete-Idee', letterBtn: 'Brief des Entwicklers',
  back: 'Zurück zu Einstellungen',
  changelogTitle: 'Änderungsprotokoll',
  changelogSub: "Version 1 · 8. November 2026",
  changelogItems: "## Nachlese|Ein neuer Eintrag „Nachlese“ in der DSH-Seitenleiste: Er liest nur deine lokalen Sitzungen und zeigt, wie du und die KI zusammengearbeitet habt; keine Noten, keine Ranglisten, keine Weitergabe.|Die Startseite sagt es in einem Satz, in der Mitte steht „Nachlese starten“; der aktuelle Zeitraum und das Modell sind jederzeit sichtbar.|Das Feld für das Vorhaben ist standardmäßig geöffnet: Notiere, was dir in dieser Zeit wichtig ist, oder tippe auf einen fertigen Satz. Erst mit einem Vorhaben schlägt die Nachlese kleine Experimente dazu vor.|Zeiträume: 7 Tage, 30 Tage, 90 Tage, 1 Jahr, alles, frei gewählte Daten und nach Jahr; standardmäßig wechselt das Jahr am 1. März (Januar und Februar zählen zum Vorjahr), und bei sehr vielen Einträgen wird gleichmäßig über die Zeit ausgewählt.|Eine Nachlese läuft in drei Schritten: lokale Protokolle lesen → das gewählte Modell schreibt → Karten zusammenstellen; meist dauert das ein bis zwei Minuten, du kannst derweil etwas anderes tun.|Die Anfrage geht direkt vom Plugin an das Modell, das du in DSH gewählt hast. Es wird keine Sitzung angelegt, die Nachlese taucht also nie im Sitzungsverlauf auf.|## Karten|Eine Nachlese ist ein Stapel Karten: Das Deckblatt nennt den Zeitraum und „wer auf wen schaut“, darunter folgen vier Richtungen — du im Umgang mit KI, die KI dir gegenüber, du und die Welt, und das innere Selbst.|Jeder Spiegel beginnt mit einem kurzen Text; Quellen und die damaligen Überlegungen klappen darunter auf. Jede Beobachtung bietet mindestens zwei Lesarten und sagt es, wenn etwas unklar bleibt.|Ein Klick auf eine Quelle öffnet „Originaldialog und Kontext ansehen“: Du liest die damaligen Worte, lokal maskiert, direkt an Ort und Stelle, ohne in Sitzungen zu suchen.|Zentrale Einschätzungen sind mit einem warmen Textmarker hervorgehoben, dazu ein oder zwei Schlagwort-Karten, sodass deine jüngsten Arbeitsgewohnheiten auf einen Blick sichtbar sind.|Die KI-Seite, der Austausch mit der Außenwelt und eine Frage bekommen jeweils eine Karte; jeder Spiegel endet mit einem Zitat aus einer alten Kultur, das zum Moment passt.|Das „innere Selbst“ ist ein versiegelter Brief: standardmäßig zugeklappt, noch ohne Inhalt, wartet darauf, in einer späteren Version geöffnet zu werden.|In den Nachlese-Aufzeichnungen kannst du frühere Nachlesen ansehen und eine einzelne löschen; jede Nachlese wird als JSON und als Markdown gespeichert, alte bleiben nach Möglichkeit weiter zu öffnen.|Nach jeder Nachlese siehst du, wie viele Token verbraucht wurden, und eine Schätzung der Kosten für das gewählte Modell, lokal berechnet, ohne Netz.|## Stimmen|Rechts auf der Startseite steht „Stimmen · Gesprächsauszüge“: mehrere KIs und Freunde antworten auf vier Fragen, eine Karte pro Frage, zwei Spalten scrollen langsam, Hover pausiert, Klick zeigt den ganzen Text.|Du kannst auch eigene Gesprächskarten hinzufügen: Sie bleiben nur auf diesem Rechner, vor dem Speichern gibt es eine Datenschutz-Checkliste.|## Deine neue Welt|„Deine neue Welt: Vorschau“ bietet eine Diashow mit Landschaften aus Xinjiang sowie eine Auswahl an Open-Source-KI-Workflows und Skills und markiert die, die zu deinen jüngsten Gewohnheiten passen, mit „passt zu deiner jüngsten Arbeitsweise“.|Jede Empfehlungskarte nennt eine Kurzbeschreibung, den Grund der Passung, das Repository, die Lizenz und einen direkt anklickbaren Quellenlink; Fotos und Empfehlungen sind im Plugin mitgeliefert und laden zur Laufzeit nichts aus dem Netz.|Die Seite sagt es ehrlich: Dieses Stück Land wächst noch, es ist der erste Entwurf einer künftigen Methodenkarte.|## Teilen|„Meinen Rückblick teilen“ ist standardmäßig schon fertig gesetzt: eine Vorschau im Postkartenstil, hell oder dunkel, im Format quadratisch, Karte, Hochformat oder Langbild.|Ein Block oder Satz zu viel? Einfach darüberfahren und wegklicken. Auch Texte lassen sich direkt an Ort und Stelle ändern.|Mit einem Klick das Bild kopieren, den Begleittext kopieren, ein Langbild oder HTML speichern; die vollständige Nachlese lässt sich ebenfalls als HTML exportieren.|Beim Teilen bleibt das innere Selbst draußen, und erkennbare Projektnamen, Sitzungsquellen und Kennungen werden vermieden; keine Social-Media-Buttons, kein Drängen zum Teilen.|## Erscheinungsbild|Acht Gewänder alter Zivilisationen: Antikes Hellas, Altes China, Altes Babylon, Altes Indien, Altes Ägypten, Antikes Rom, Maya und Inka, jedes mit eigener Farbpalette, Himmel, Emblem, Nummerierung, Ornament und Zitat in der Seitenecke.|Der Hintergrund ist im Code gezeichnet: Landschaften und Architektur-Strichzeichnungen. Scrollst du in einer Nachlese nach unten, wächst das Gebäude Strich für Strich; Sonne, Mond, Wolken, Figuren und Tiere reagieren auf die Maus, und alte Zitate ziehen wie flüchtige Kommentare vorbei.|Der Stil folgt standardmäßig deiner Region und lässt sich auch festlegen; bei „Stil gelegentlich wechseln“ erscheint zur Hälfte deine eigene Zivilisation, zur anderen Hälfte eine zufällige andere.|Hell und dunkel folgen DSH oder deiner Wahl; Schriften und reduzierte Animationen folgen DSH und dem System; kleine Bildschirme, Tastaturbedienung und Screenreader-Beschriftungen sind ebenfalls berücksichtigt.|## Sprachen|Die Oberfläche ist vollständig in acht Sprachen übersetzt: 简体中文, English, 日本語, Español, Français, Deutsch, Русский, Português; Stimmen, Empfehlungen, Texte zum Teilen, Zitate und Einstellungen wechseln mit.|Der Text der Nachlese wird in der Oberflächensprache geschrieben, die du damals verwendet hast; der Name in der Seitenleiste folgt DSH, und nach dem Öffnen lautet der Titel „Melete“ plus das jeweilige Wort der Sprache.|## Privatsphäre und Daten|Nur Worte, die du selbst geschrieben hast, werden verwendet; E-Mails, Telefonnummern und Schlüssel werden lokal ersetzt, bevor sie an das von dir gewählte Modell gehen. Kein Netz, keine Weitergabe, kein Server, keine Telemetrie.|Nachlesen und Einstellungen liegen nur in ~/.melete/; die Einstellungsseite zeigt den Ort und erlaubt jederzeit, eine einzelne Nachlese oder alle Daten zu löschen.|Bei einem Fehler werden lokal nur Zahlen wie Länge und Endgrund protokolliert, nie Inhalte; alte Daten, fehlende Felder und Verbindungsabbrüche haben jeweils ihre eigene Rückfallebene und ihren eigenen Hinweis.|## Einstellungen und Dokumentation|Die Einstellungen umfassen Sprache, Erscheinungsbild, Standard-Zeitraum, Datenschutzhinweis, Datenort und Löschen mit einem Klick sowie „Über Melete“ (Version, Spiegel-Kompass-Version, Lizenz).|Enthalten sind „Die Melete-Idee“ (relativ stabil / noch am Überlegen / das Ziel / ein Wort vorweg), der „Brief des Entwicklers“ und dieses Änderungsprotokoll.|Diese Version ist 0.1.1 Telos Ultra mit Spiegel-Kompass 0.4.0; der Code steht unter Apache-2.0, der Spiegel-Kompass unter CC BY 4.0.",
  philosophyTitle: 'Die Melete-Idee',
  philosophySub: 'Ein Blick zurück darauf, wie du und die KI zusammenarbeitet.',
  philosophyBody: 'Melete zeigt dir, wie du und die KI zusammenarbeiten. Du entscheidest, was stimmig ist: Ein Vorgehen kann je nach Zweck sinnvoll sein.|Keine Noten, keine Ranglisten, keine Etiketten.|Jede Beobachtung geht auf reale Gespräche zurück und lässt mindestens zwei Lesarten zu.|Auch die KI wird gespiegelt: ob sie dir bloß nach dem Mund redet oder Entscheidungen vorwegnimmt.|Deine Daten bleiben auf deinem Rechner. Melete betreibt keinen Server und sammelt nichts; du kannst alles jederzeit löschen.|Nach dem Spiegelbild: innehalten, ein kleines Experiment wagen und beim nächsten Mal wieder hinsehen.',
  philosophyNote: 'Diese Seite ist ein Entwurf anhand der Projektprinzipien; der Entwickler wird sie überarbeiten.',
  makerLetterTitle: 'Brief des Entwicklers',
  makerLetterSub: 'Geschrieben im Rauschen der Brandung',
  makerLetterBody: 'Hallo und willkommen bei Melete.|Es gibt zwei Arten von Spiegeln auf dieser Welt: Der eine ist das Zerrspiegelkabinett auf dem Jahrmarkt, das einen groß und stattlich wirken lässt, nur um das Publikum zu belustigen; der andere ist der schlichte Spiegel am morgendlichen Waschbecken – kalt, unbestechlich, und er zeigt selbst die Augenringe einer durchwachten Nacht schonungslos.|Jahresrückblicke in den sozialen Medien gehören fast ausnahmslos zur ersten Kategorie. Als ich jedoch sah, wie Menschen begannen, mit nüchternem Blick die Denkgewohnheiten und Werkzeugkompetenzen eines Menschen im Angesicht der KI zu reflektieren, empfand ich eine lang ersehnte Genugtuung: Genau so begegnet man denkenden Menschen mit echtem Respekt.|Aus diesem Widerspruchsgeist heraus entstand Melete. Wir haben nicht vor, irgendetwas zu beschönigen. Wir wollen Ihnen einfach die fortschrittlichsten Fähigkeiten, klare Methoden und vor allem die Spuren Ihres eigenen Denkens sauber und unverstellt vor Augen führen.|Ich habe nie an heilsbringende Technik-Räusche geglaubt; ich glaube allein an konkrete, lebendige Menschen. Ich hoffe, dass Sie anhand der Zeichen, die Sie einst getippt haben, Ihre eigenen Konturen ein Stück klarer ertasten können – und dass dieser kleine Beitrag Ihnen hilft, inmitten des tosenden Zeitgeists Ihre eigene Freiheit und Wachheit zu bewahren.',
  makerLetterSign: 'Yan Canny · 8. November 2026',
  start: 'Nachlese starten',
  privacyNote: 'Die Zusammenfassung erfasst nur deine eigenen Eingaben; E-Mails, Telefonnummern und Schlüssel werden lokal maskiert, bevor sie an dein in DSH gewähltes Modell ({model}) übergeben werden. Melete führt keine eigenen Online-Anfragen aus und sammelt nichts.',
  noModel: 'In DSH ist noch kein Modell gewählt. Bitte zuerst ein Modell in DSH auswählen.',
  run1: 'Lokale Protokolle lesen', run2: '{model} formuliert', run3: 'Karten zusammenstellen',
  runHint: 'Dauert meist ein bis zwei Minuten. Du kannst derweil etwas anderes tun.',
  'error.no-records': 'In diesem Zeitraum wurden keine Sitzungen mit eigenen Eingaben gefunden. Wähle einen längeren Zeitraum.',
  'error.no-model': 'In DSH ist noch kein Modell gewählt. Bitte zuerst ein Modell in DSH auswählen.',
  'error.empty-review': 'Das Modell hat diesmal keine Spiegelbilder formuliert. Bitte erneut versuchen.',
  'error.bad-output': 'Die Antwort konnte diesmal nicht in Karten umgewandelt werden. Bitte erneut versuchen.',
  'error.busy': 'Eine Nachlese läuft bereits.',
  'error.generic': 'Die Nachlese konnte nicht abgeschlossen werden: {msg}',
  retry: 'Erneut versuchen',
  navReviews: 'Nachlese-Aufzeichnungen', navNew: 'Start', navUltra: 'Deine neue Welt: Vorschau', navSettings: 'Einstellungen',
  ultraTitle: 'Deine Neue Welt',
  ultraKicker: 'Vorschau',
  ultraSub: 'Ausgewählte KI-Workflows, Skills und bewährte Methoden, abgestimmt auf deine Gewohnheiten. Aus bewährten Open-Source-Projekten (mit liberalen Lizenzen) – klicke auf die Links, um direkt dorthin zu gelangen.',
  ultraRecKicker: 'Empfohlene Workflows & Skills',
  ultraRecTitle: 'Zu dir passende KI-Ansätze',
  ultraFilterAll: 'Alle',
  ultraMatchedBadge: '★ Passt zu deinen jüngsten Mustern',
  ultraVisitLink: 'Zum Projekt ↗',
  ultraRepoLabel: 'Repository: ',
  ultraAboutKicker: 'Ein kurzer Hinweis',
  ultraAboutTitle: 'Über diese Seite',
  ultraPara1Label: 'Über den aktuellen Zustand',
  ultraPara1: 'Dieser Winkel ist noch nicht ansatzweise fertiggestellt; darunter liegt im Grunde noch ein Haufen Schutt und Ziegel. Ich war schon immer der Meinung, dass es nicht reicht, sein Dasein nur geschäftig vor dem Bildschirm zu fristen. Jeder Mensch sollte einen eigenen Wald besitzen dürfen, und sei es einer, den man geduldig aus Zeilen von Code und Gedanken pflanzt.',
  ultraPara2Label: 'Über Melete',
  ultraPara2: 'Was Melete für die Zukunft vorhat, ist denkbar einfach: Wir schauen auf deine ganz eigenen Gewohnheiten – ob nun eigensinnige Schleichwege oder akkurate Routinen – und fischen im weltweiten Netz nach handfestem Werkzeug und klugen Kniffen, um sie dir in die Hand zu drücken. Welche Funken die KI schlagen soll, liegt ganz bei dir. Wenn es dir hilft, im Alltag etwas klarer zu sehen, ein wenig dazuzulernen und unbeschwerter durchs Leben zu gehen, hat Melete seine Bestimmung erfüllt.',
  ultraPara3Label: 'Über die Hintergrundmotive',
  ultraPara3: 'Die Wälder im Hintergrund stammen aus Xinjiang in China. Weite Wasser, ragende Berge und ein großartiger Ausblick. Freunde aus aller Welt sind herzlich eingeladen, dort vorbeizuschauen, wann immer Zeit dafür ist – denn die echten Wälder und Flüsse der greifbaren Welt sind am Ende ungleich schöner als alles, was ein Bildschirm abbilden kann.',
  ultraCreditsKicker: 'Fotos & Lizenzen',
  ultraCreditsTitle: 'Quellen der Xinjiang-Landschaftsbilder',
  ultraCommonsLink: 'Wikimedia-Commons-Quelle ↗',
  ultraDotAria: 'Zu Foto {n} wechseln',
  ultraResume: '▶ Wiedergabe fortsetzen',
  ultraPause: '❚❚ Diashow anhalten',
  ultraCurrent: 'Aktuell: {title}',
  usageExact: 'Verbrauch: {total} Token ({in} Eingabe · {out} Ausgabe) · Geschätzte Kosten mit {model}: ~{cost} ({code})',
  usageEst: 'Verbrauch: ~{total} Token (~{in} Eingabe · ~{out} Ausgabe) · Geschätzte Kosten mit {model}: ~{cost} ({code})',
  intentionOpen: 'Vorhaben für diesen Zeitraum hinzufügen (optional)',
  intentionFold: 'Vorhaben ausblenden',
  pastReviews: 'Frühere Nachlesen',
  mirrors: 'Einige Spiegel',
  domainPos: '{n} Spiegel insgesamt',
  seen: 'Der damalige Kontext',
  evidence: 'Quellen',
  byYou: 'Deine Perspektive', byAi: 'Verhalten der KI damals', byThing: 'Anforderungen der Aufgabe',
  readings: 'Quellen und Deutungsmöglichkeiten',
  aiSide: 'Die Seite der KI',
  noteToAi: 'Hinweis für deine KI',
  noteToAiHint: 'Du kannst diesen Text bei Bedarf in die benutzerdefinierten Anweisungen deiner KI einfügen.',
  society: 'Du und die Außenwelt',
  question: 'Eine Frage',
  experiments: 'Experimente passend zu deinem Vorhaben',
  intentExpTitle: 'Kleine Experimente passend zu deinem notierten Vorhaben',
  check: 'Beim nächsten Mal beachten',
  letterTitle: 'Ein Brief an dich selbst',
  letterBody: 'Ganz offen gesagt: Dieser Bereich ist noch nicht ausgereift und bleibt daher vorerst verschlossen.',
  notCovered: 'Diesmal nicht betrachtet: {list}. Wenn du einen Aspekt vertiefen möchtest, erwähne ihn beim nächsten Mal in deinem Vorhaben.',
  lensFoot: 'Spiegel-Kompass {v} · betrachtet von {by}',
  intentionShown: 'Dein notiertes Vorhaben',
  settingsLanguage: 'Sprache', followDsh: 'DSH folgen',
  settingsStyle: 'Erscheinungsbild', styleAuto: 'Nach Region', greek: 'Antikes Hellas', chinese: 'Altes China', babylonian: 'Altes Babylon', indian: 'Altes Indien', egyptian: 'Altes Ägypten', roman: 'Antikes Rom', maya: 'Maya', inca: 'Inka',
  occasional: 'Stil gelegentlich wechseln',
  settingsDays: 'Standard-Zeitraum',
  settingsPrivacy: 'Datenschutz',
  privacyText: 'Melete stellt keine eigenen Netzwerkverbindungen her und sammelt keine Daten. Externe Zugriffe erfolgen ausschließlich über dein konfiguriertes Modell. Die Zusammenfassung wird direkt an das DSH-Modell übergeben und taucht nicht im Chatverlauf auf.',
  settingsData: 'Daten',
  dataText: 'Nachlesen und Einstellungen werden nur in {dir} gespeichert.',
  deleteAll: 'Alle Daten löschen',
  deleteConfirm: 'Alle Nachlesen und Einstellungen in {dir} unwiderruflich löschen?',
  deleted: 'Gelöscht.',
  deleteThis: 'Diesen Eintrag löschen', deleteThisConfirm: 'Diese Nachlese ({date}) unwiderruflich löschen?',
  confirmDeleteBtn: 'Löschen bestätigen',
  confirmDeleteAllBtn: 'Gesamtlöschung bestätigen',
  cancelBtn: 'Abbrechen',
  deleteThisPrompt: 'Diese Nachlese löschen? Dies kann nicht rückgängig gemacht werden.',
  settingsAbout: 'Über Melete',
  aboutText: 'Melete {v} {ed} · Spiegel-Kompass {lv} · Apache-2.0',
  projectRepo: "Repository",
  cornerGreek: 'Melete (Μελέτη), die griechische Muse der Übung und des Nachdenkens.',
  cornerChinese: '„Dreimal täglich prüfe ich mich selbst.“ — Konfuzius, Gespräche',
  cornerBabylonian: '„Der die Tiefe sah, erkannte alle Dinge.“ — Gilgamesch-Epos',
  cornerIndian: '„Alles, was wir sind, entspringt unseren Gedanken.“ — Dhammapada',
  cornerEgyptian: '„Niemand wird weise geboren.“ — Lehre des Ptahhotep',
  cornerRoman: '„Indem wir lehren, lernen wir.“ — Seneca',
  voicesTitle: 'Stimmen · Gesprächsauszüge',
  voicesSub: '{n} KIs und Freunde beantworten vier Fragen, eine Karte pro Antwort · Hover pausiert · Klick zum Lesen',
  voicesAdd: '+ Karte hinzufügen',
  voicesRead: 'Lesen ↗',
  voicesQNum: 'F{n}',
  voicesQ1: 'Wie sollten Menschen deiner Meinung nach KI nutzen?',
  voicesQ2: 'Was sollte KI tun, wenn sie Nutzern Inhalte liefert?',
  voicesQ3: 'Was sollte das, was Menschen mit KI schaffen, für die Gesellschaft bedeuten?',
  voicesQ4: 'Wie sollten Menschen sich selbst begegnen, während sie KI nutzen?',
  voicesQs1: 'KI nutzen',
  voicesQs2: 'Was KI tun sollte',
  voicesQs3: 'Bedeutung für die Gesellschaft',
  voicesQs4: 'Sich selbst begegnen',
  voicesKindAI: 'KI',
  voicesKindFriend: 'Ein Freund',
  voicesNoteAI: 'Aus einem Gespräch zwischen Yan Canny und {name} am 8. November 2026. Wörtlich zitiert, nur in Absätze geteilt. Dieselbe Frage kann beim nächsten Mal anders beantwortet werden. Es gibt nicht die Position des Modellentwicklers wieder; der Name nennt nur die Quelle.',
  voicesNoteFriend: 'Aus einem Chat zwischen Yan Canny und einem Freund, mit dessen Zustimmung unter einem Spitznamen gezeigt. Wörtlich zitiert, nur in Absätze geteilt.',
  voicesTranslated: 'Aus dem chinesischen Original übersetzt.',
  voicesClose: 'Schließen',
  voicesAria: '{name}s Antwort auf „{q}“ lesen',
  voicesFormTitle: 'Gesprächskarte hinzufügen',
  voicesFormName: 'Person / Modell *',
  voicesFormNamePh: 'z. B. Claude Opus 5.5; bei Freunden einen Spitznamen, nicht den echten Namen',
  voicesFormKind: 'Bezeichnung',
  voicesFormKindPh: 'z. B. KI, ein Freund',
  voicesFormExcerpt: 'Ein Satz für die Karte *',
  voicesFormExcerptPh: 'Ein Satz, der zum Nachdenken bringt …',
  voicesFormFull: 'Vollständige Antwort *',
  voicesFormFullPh: 'Antworten als „F1: …“, „F2: …“ einfügen; sie werden in eine Karte pro Frage geteilt.',
  voicesFormNote: 'Notiz (optional)',
  voicesFormNotePh: 'z. B. Gedanken 2026 zur Zusammenarbeit mit KI',
  voicesSafety: 'Vor dem Speichern prüfen: echte Namen, Firmen, Projekte, Kontaktdaten und persönliche Angaben in Screenshots entfernen. Karten bleiben auf diesem Computer und werden nicht hochgeladen, aber wer einen Screenshot sieht, kann sie lesen.',
  voicesSafetyOk: 'Ich habe das entfernt; bei Worten eines Freundes habe ich seine Zustimmung',
  voicesCancel: 'Abbrechen',
  voicesSave: 'Karte speichern',
  homeRange: 'Zeitraum: {r}',
  homeModel: 'Modell: {m}',
  homeNoModel: 'Kein Modell verbunden (in DSH einrichten)',
  homeAdv: 'Mehr · Zeitraum und Absicht',
  homeCollapse: 'Ausblenden ▴',
  homeExpand: 'Einblenden ▾',
  homeRangeLabel: 'Zeitraum wählen',
  homeByYear: 'Nach Jahr',
  homeCustom: 'Benutzerdefiniert',
  homeAll: 'Alles',
  homeYearOpt: '{y}',
  homeDefault: ' (Standard)',
  homeYearHint: 'Ab dem 1. März wird das laufende Jahr gewählt; im Januar und Februar das Vorjahr.',
  homeIntentLabel: 'Worauf soll der Rückblick achten? (optional)',
  rangeYearFmt: '{y} ({a} bis {b})',
  rangeSpanFmt: '{a} bis {b}',
  rangeAllText: 'Gesamter Verlauf',
  rangeDaysText: 'Letzte {n} Tage',
  shareLight: 'Hell',
  shareDark: 'Dunkel',
  sharePhMoment: 'Ein Moment zum Festhalten',
  sharePhAi: 'Eine Notiz zur KI-Seite',
  sharePhQ: 'Eine Frage an mich',
  shareHashtag: '#MeleteNachlese',
  cornerMaya: '„Mögen alle sich erheben, möge keiner zurückbleiben.“ — Popol Vuh',
  cornerInca: '„Stiehl nicht, lüge nicht, sei nicht träge.“ — Inka-Dreiheit (Ama sua, ama llulla, ama quella)',
  settingsNotSaved: 'Nicht gespeichert. Beende DSH vollständig (⌘Q), öffne es erneut und versuche es noch einmal.',
  details: 'Quellen & Deutungen ({e} Belege · {r} Möglichkeiten)',
  viewContextBtn: 'Originaldialog und Kontext ansehen',
  contextModalTitle: 'Dialog-Kontext',
  contextLoading: 'Lade Gesprächskontext…',
  contextEmpty: 'Kein lokales Protokoll zu diesem Dialog gefunden; womöglich bereits aufgeräumt.',
  contextClose: 'Kontext schließen',
  domH: 'Mensch → KI', domHsub: 'Wie du die KI nutzt',
  domA: 'KI → Dich', domAsub: 'Wie die KI dir begegnet',
  domS: 'Du und die Welt', domSsub: 'Austausch mit der Außenwelt',
  domI: 'Inneres Selbst', domIsub: 'Nur du',
  mirrorCount: '{n} Spiegel', sealed: 'Brief · Noch verschlossen',
  sealedHint: 'Diesen Brief kannst du in einer späteren Version öffnen.',
  emptyH: 'Aus diesem Bereich wurden diesmal keine Spiegelbilder gewählt.',
  emptyA: 'Von Seiten der KI wurden diesmal keine Spiegelbilder gewählt.',
  emptyS: 'In diesen Aufzeichnungen zeigten sich keine Spuren von Außenkontakten. Es wird nur festgehalten, was sichtbar war.',
  "ultraTag_all": "Alle",
  "ultraTag_specFirst": "Vorgaben zuerst",
  "ultraTag_twoStageEval": "Faktenprüfung",
  "ultraTag_modularPatterns": "Modulare Schritte",
  "ultraTag_invertedInquiry": "Klärung vorab",
  "ultraTag_chunkMapReduce": "Stufenweise Synthese",
  "ultraSlide_fir-forest_title": "Tianshan · Schrenk-Fichtenwald",
  "ultraSlide_fir-forest_credit": "Foto: lwtt93 (Shanghai) · Lizenz: CC BY 2.0 (Namensnennung, kommerziell & Bearbeitung erlaubt)",
  "ultraSlide_moon-bay_title": "Kanas · Wälder der Moon Bay",
  "ultraSlide_moon-bay_credit": "Foto: Niranarm · Lizenz: Gemeinfrei (Public Domain)",
  "ultraSlide_foggy-lake_title": "Altay · Nebliger Uferwald am Kanas-See",
  "ultraSlide_foggy-lake_credit": "Foto: Muye Ma (über Unsplash) · Lizenz: CC0 1.0",
  "ultraSlide_autumn-lake_title": "Kanas · Herbstwälder und Schneegipfel",
  "ultraSlide_autumn-lake_credit": "Foto: Charlie fong · Lizenz: Gemeinfrei (Public Domain)",
  "ultraRec_spec-first_badge": "Aufgaben-Spec",
  "ultraRec_spec-first_title": "Spec-First: Strukturierte Arbeitsaufträge & Leitplanken",
  "ultraRec_spec-first_summary": "Aus dem offiziellen Anthropic-Leitfaden. Zerlegt komplexe Aufgaben in Rollen, Kontext, Grenzen und Formate.",
  "ultraRec_spec-first_matchReason": "Passt zu deiner Gewohnheit, klare Rahmenbedingungen vor der Übergabe festzulegen",
  "ultraRec_two-stage-eval_badge": "Verifikation",
  "ultraRec_two-stage-eval_title": "Zweistufige Faktenprüfung & Rückverfolgbarkeit",
  "ultraRec_two-stage-eval_summary": "Trennt das Erfassen objektiver Belege von der Schlussfolgerung, um Zitate und Fakten verlässlich abzusichern.",
  "ultraRec_two-stage-eval_matchReason": "Passt zu deinem Augenmerk auf nachprüfbare Belege und verlässliche Zitate",
  "ultraRec_modular-patterns_badge": "Modulare Schritte",
  "ultraRec_modular-patterns_title": "Modulare Teilaufgaben & Verknüpfung",
  "ultraRec_modular-patterns_summary": "Formt Auszüge, Gliederungen und Prüfungen in eigenständige Werkzeuge, die hintereinander geschaltet werden.",
  "ultraRec_modular-patterns_matchReason": "Geeignet, um verschachtelte Abläufe in überschaubare Einzelschritte zu gliedern",
  "ultraRec_inverted-inquiry_badge": "Rückfrage",
  "ultraRec_inverted-inquiry_title": "Invertierte Klärung & Abstimmung vorab",
  "ultraRec_inverted-inquiry_summary": "Die KI fragt vor Arbeitsbeginn gezielt nach offenen Randbedingungen, um Unklarheiten vorab zu beseitigen.",
  "ultraRec_inverted-inquiry_matchReason": "Hilfreich, wenn die KI vor dem Start Lücken hinterfragen und neue Blickwinkel eröffnen soll",
  "ultraRec_chunk-map-reduce_badge": "Zusammenfassung",
  "ultraRec_chunk-map-reduce_title": "Hierarchische Textextraktion & MapReduce-Synthese",
  "ultraRec_chunk-map-reduce_summary": "Verteilt die Analyse umfangreicher Texte auf Abschnitte und führt die Kerndaten verlustfrei zusammen.",
  "ultraRec_chunk-map-reduce_matchReason": "Geeignet für die Auswertung mehrteiliger Dialoge und umfangreicher Dokumente",
  emptyReviewsHint: "Noch keine Nachlesen vorhanden. Gehe zur Startseite, um deine erste Nachlese zu beginnen.",
  'error.network-error': "Verbindung zum lokalen Plugin-Dienst fehlgeschlagen. Bitte erneut versuchen.",
  sharePostcardBtn: 'Meinen Rückblick teilen',
  exportReviewBtn: 'Rückblick exportieren (HTML)',
  shareTitle: 'Diesen Zeitraum teilen',
  shareSub: 'Standardmäßig fertig, mit einem Klick speichern',
  shareCopyImg: '⧉ Bild kopieren',
  shareSaveImg: '↓ Langbild speichern',
  shareCopyText: '✎ Text kopieren',
  shareSaveHtml: '⌂ HTML speichern',
  shareCopiedImgToast: 'In die Zwischenablage kopiert',
  shareSavedImgToast: 'Gespeichert unter ~/.melete/shares/',
  shareCopiedTextToast: 'Text mit #MeleteDebrief kopiert',
  shareSavedHtmlToast: 'HTML gespeichert unter ~/.melete/shares/',
  shareExportedToast: 'Vollständiger Rückblick gespeichert unter ~/.melete/shares/',
  shareRevealFinder: 'Im Finder anzeigen',
  shareHideBlockHint: 'Klicke auf ◉ zum Ausblenden; klicke auf Text zum Bearbeiten',
  shareMoreOptions: 'Mehr: Stil · Format · Design · Signatur',
  shareTagCover: 'Dieser Zeitraum',
  shareTagNums: 'Zahlen',
  shareTagPractices: 'Meine Arbeitsweisen',
  shareTagMoment: 'Ein Moment',
  shareTagSplit: 'Aufgabenteilung',
  shareTagAiNote: 'Auf Seiten der KI',
  shareTagDial: 'Unsere Arbeitszeiten',
  shareTagQuestion: 'Eine Frage an mich selbst',
  shareMine: 'Selbst übernommen',
  shareAi: 'Der KI übertragen',
  shareSessions: 'Sitzungen',
  shareUserMsgs: 'eigene Nachrichten',
  shareToolCalls: 'Werkzeugaufrufe',
  shareModelsCount: 'Modelle im Einsatz',
  shareSignature: 'Mein KI-Rückblick',
  traitSpec: 'Vorgaben definieren',
  traitEvidence: 'Belege überprüfen',
  traitDelegate: 'Vollständig übergeben',
  traitBoundaries: 'Grenzen wahren',
  traitExplore: 'Agil erkunden',
  traitTone: 'Stil und Ton beachten',
  traitPace: 'Arbeitstempo steuern',
  contextWhoUser: 'Benutzer',
}


    const ru = {
  loading: 'Открываем…',
  tagline: 'Посмотрите, как вы и ИИ работали вместе в последнее время.',
  intentionLabel: 'На что вы обращали внимание в последнее время?',
  intentionHint: 'Необязательно. Если указать намерение, разбор предложит небольшие эксперименты.',
  intentionPlaceholder: 'На чём хотелось бы сделать акцент при разборе? Напишите здесь или оставьте пустым.',
  chips: 'Работать продуктивнее|Узнать новое|Сохранить свой слог|Повысить надёжность результатов|Просто посмотреть',
  rangeLabel: 'Период разбора',
  r7: '7 дней', r30: '30 дней', r90: '90 дней', r365: '1 год', rAll: 'Все записи', rCustom: 'Выбрать даты',
  rFrom: 'С', rTo: 'По',
  'error.bad-range': 'Неверный диапазон дат. Проверьте даты начала и окончания.',
  rangeAllHint: 'При большом числе записей выборка распределяется равномерно по времени.',
  settingsMore: 'Ещё',
  changelogBtn: 'История изменений', philosophyBtn: 'Идея Melete', letterBtn: 'Письмо автора',
  back: 'Назад к настройкам',
  changelogTitle: 'История изменений',
  changelogSub: "Версия 1 · 8 ноября 2026 г.",
  changelogItems: "## Разбор|В левой панели DSH появился «Разбор»: он читает только локальные сессии и показывает, как вы и ИИ работаете вместе; без оценок, рейтингов и отчётов наружу.|На главной всё сказано одной строкой, в центре — «Начать разбор»; выбранный период и модель всегда на виду.|Поле намерения раскрыто по умолчанию: можно написать, что для вас важно сейчас, или выбрать готовую фразу. Только при наличии намерения разбор предложит небольшие эксперименты под него.|Периоды: 7 дней, 30 дней, 90 дней, 1 год, всё время, свои даты и по годам. По умолчанию год меняется 1 марта (январь и февраль относятся к прошлому году), а при большом объёме записей они равномерно выбираются по времени.|Один разбор идёт в три шага: чтение локальных записей → выбранная вами модель пишет → карточки оформляются. Обычно это занимает одну-две минуты, так что можно заняться другими делами.|Запрос идёт от плагина напрямую к модели, выбранной вами в DSH. Новая сессия не создаётся, и разбор не появляется в истории сессий.|## Карточки|Один разбор — это стопка карточек: на обложке указаны период и «кто на кого смотрит», а дальше четыре направления — вы → ИИ, ИИ → вам, вы и мир, внутреннее «я».|Каждая грань начинается с короткого текста, а цитаты и тогдашние соображения сложены под ним. У каждого наблюдения есть как минимум два прочтения; если что-то неясно, так и сказано.|Цитату можно раскрыть — «Посмотреть исходный диалог и контекст» — и прочитать обезличенные слова на месте, не разыскивая их по сессиям.|Ключевые суждения в тексте отмечены тёплым маркером, рядом — один-два кратких тега, чтобы привычки совместной работы были видны с первого взгляда.|Сторона ИИ, связи с внешним миром и один вопрос получают по карточке; каждая грань заканчивается цитатой древней культуры, подходящей к моменту.|«Внутреннее „я“» — это запечатанное письмо: по умолчанию сложено, содержимое пока не создаётся и ждёт следующей версии.|В записях разбора можно вернуться к прошлым разборам и удалить отдельный. Каждый разбор сохраняется сразу в JSON и Markdown, а старые разборы по возможности остаются открываемыми.|После каждого разбора видно, сколько токенов потрачено, и оценка стоимости по выбранной модели — расчёт идёт локально, без сети.|## Голоса|Справа на главной — «Голоса · Фрагменты разговоров»: ответы нескольких ИИ и друзей на четыре вопроса, один вопрос — одна карточка, две колонки медленно плывут, при наведении останавливаются, по клику открывается полный текст.|Можно добавить и свои карточки с фрагментами разговоров: они хранятся только на этом компьютере, а перед сохранением есть список для проверки приватности.|## Ваш новый мир|В «Вашем новом мире: Превью» есть карусель пейзажей Синьцзяна и подборка открытых рабочих процессов и Skill для ИИ, где отмечено «близко к вашим недавним привычкам».|У каждой рекомендации есть описание, причина соответствия, репозиторий, лицензия и ссылка прямо на источник; фотографии и рекомендации упакованы в плагин локально, во время работы сеть не используется.|Страница честно говорит: этот участок ещё растёт — это первый набросок будущей карты методов.|## Поделиться|«Поделиться моим разбором» уже свёрстано по умолчанию: превью в виде открытки, светлая или тёмная тема, размеры — квадрат, карточка, портрет или длинное изображение.|Ненужный блок или предложение можно убрать: наведите и щёлкните. Текст тоже правится на месте.|Копирование изображения, копирование текста для публикации, сохранение длинного изображения или HTML; полный разбор тоже экспортируется в HTML-файл.|В публикацию не попадает внутреннее «я», а также узнаваемые названия проектов, источники сессий и номера. Кнопок соцсетей нет, и делиться вас никто не подталкивает.|## Оформление|Восемь обликов древних цивилизаций — Древняя Эллада, Древний Китай, Древний Вавилон, Древняя Индия, Древний Египет, Древний Рим, Майя и Инки — у каждой своя палитра, небо, эмблема, нумерация, орнамент и цитата в углу.|Фон нарисован кодом: пейзажи и линейные рисунки зданий. Если прокручивать запись разбора вниз, здание прорисовывается штрих за штрихом; солнце, луна, облака, фигуры и животные откликаются на курсор, а цитаты древних культур легко проплывают, словно летящие комментарии.|Стиль по умолчанию подбирается по региону, но его можно закрепить; в режиме «Иногда менять стиль» в половине случаев показывается ваша местная цивилизация, а в остальных — случайная из прочих.|Светлая или тёмная тема следует за DSH или выбирается вручную; шрифты и уменьшение анимации — за DSH и системой; небольшие экраны, работа с клавиатуры и подписи для программ чтения с экрана тоже учтены.|## Языки|Интерфейс полностью переведён на восемь языков: 简体中文, English, 日本語, Español, Français, Deutsch, Русский и Português; «Голоса», рекомендации, тексты для публикации, цитаты и настройки переключаются вместе с ним.|Текст разбора пишется на том языке интерфейса, который был у вас включён; название в левой панели следует за DSH, а заголовок страницы — «Melete» плюс своё слово для разбора в каждом языке.|## Приватность и данные|Используются только слова, написанные вами; почта, телефоны и ключи заменяются локально, прежде чем попасть к выбранной вами модели. Ни сети, ни отчётов, ни серверов, ни телеметрии.|Разборы и настройки хранятся только в ~/.melete/; в настройках видно расположение, а также можно в любой момент удалить один разбор или все данные.|При сбое локально записываются только числа — длина, причина завершения, — но не содержимое; для старых данных, недостающих полей и обрывов связи есть свои запасные варианты, подсказки и повторные попытки.|## Настройки и документация|В настройках есть язык, оформление, период по умолчанию, пояснения о приватности, расположение данных и удаление в один клик, а также «О программе» (версия, версия Схемы наблюдений, лицензия).|Встроены «Идея Melete» (относительно устойчивое / ещё обдумывается / цель / слово в начале), «Письмо автора» и эта история изменений.|Это версия 0.1.1 Telos Ultra со Схемой наблюдений 0.4.0; код — Apache-2.0, Схема наблюдений — CC BY 4.0.",
  philosophyTitle: 'Идея Melete',
  philosophySub: 'Оглянитесь на то, как вы и ИИ работаете вместе.',
  philosophyBody: 'Melete помогает увидеть, как вы взаимодействуете с ИИ. Что хорошо, решаете вы: один и тот же подход может быть оправдан для разных задач.|Без баллов, без рейтингов, без ярлыков.|Каждое наблюдение опирается на реальные диалоги и допускает как минимум две трактовки.|ИИ тоже оказывается перед зеркалом: поддакивает ли он вам или решает за вас.|Ваши записи обрабатываются только на вашем компьютере. У Melete нет серверов и сбора данных; всё можно удалить в любой момент.|Посмотрев в зеркало, сделайте шаг: осмыслите, попробуйте эксперимент и взгляните снова в следующий раз.',
  philosophyNote: 'Эта страница составлена по принципам проекта; автор позже перепишет её.',
  makerLetterTitle: 'Письмо автора',
  makerLetterSub: 'Написано в шуме прибоя',
  makerLetterBody: 'Здравствуйте и добро пожаловать в Melete.|В этом мире есть два рода зеркал: одно — кривое зеркало в парке аттракционов, делающее вас выше и краше лишь ради всеобщей забавы; другое — простое зеркало утреннего умывальника, холодное и неумолимое, в котором до мельчайших деталей видны даже круги под глазами после бессонной ночи.|Итоги года в социальных сетях почти всегда принадлежат к первому роду. Но когда я увидел, как люди начинают трезвым взглядом оценивать привычки мышления и владение инструментами человека перед лицом ИИ, я ощутил редкое чувство радости: именно так выглядит подлинное уважение к мыслящему существу.|Melete родился из этого внутреннего несогласия. Мы не намерены ничего приукрашивать. Мы хотим лишь положить перед вами передовые навыки, ясные методы и главное — следы вашей собственной мысли, в чистом и первозданном виде.|Я никогда не верил в мессианские волны технологий; я верю только в конкретных, живых людей. Надеюсь, что через набранные когда-то строки вы сможете отчетливее нащупать собственные очертания, а этот скромный труд поможет вам сохранить свободу и ясность ума среди шумных приливов времени.',
  makerLetterSign: 'Yan Canny · 8 ноября 2026 г.',
  start: 'Начать разбор',
  privacyNote: 'В выжимку попадают только ваши собственные слова; адреса почты, телефоны и ключи маскируются локально перед передачей выбранной в DSH модели ({model}). Melete не делает внешних сетевых запросов и ничего не собирает.',
  noModel: 'В DSH пока не выбрана модель. Сначала укажите модель в DSH.',
  run1: 'Чтение локальных записей', run2: '{model} пишет текст', run3: 'Оформление карточек',
  runHint: 'Обычно это занимает одну-две минуты. Вы можете заняться другими делами.',
  'error.no-records': 'За выбранный период не найдено бесед с вашими репликами. Попробуйте увеличить интервал.',
  'error.no-model': 'В DSH пока не выбрана модель. Сначала укажите модель в DSH.',
  'error.empty-review': 'Модель не выделила граней в этот раз. Попробуйте ещё раз.',
  'error.bad-output': 'Не удалось превратить ответ модели в карточки. Попробуйте ещё раз.',
  'error.busy': 'Разбор уже выполняется.',
  'error.generic': 'Разбор не удалось завершить: {msg}',
  retry: 'Повторить попытку',
  navReviews: 'Записи разбора', navNew: 'Главная', navUltra: 'Ваш новый мир: Превью', navSettings: 'Настройки',
  ultraTitle: 'Ваш Новый Мир',
  ultraKicker: 'Превью',
  ultraSub: 'Подборка открытых рабочих процессов, навыков и подходов ИИ с учётом ваших привычек работы. Отобрано из репозиториев со свободными лицензиями — переходите по ссылкам для подробностей.',
  ultraRecKicker: 'Рекомендуемые процессы и навыки',
  ultraRecTitle: 'Подходящие для вас методы работы с ИИ',
  ultraFilterAll: 'Все',
  ultraMatchedBadge: '★ Соответствует вашим недавним привычкам',
  ultraVisitLink: 'К источнику ↗',
  ultraRepoLabel: 'Репозиторий: ',
  ultraAboutKicker: 'Несколько слов',
  ultraAboutTitle: 'Об этой странице',
  ultraPara1Label: 'О текущем виде',
  ultraPara1: 'Этот уголок ещё толком не достроен; под ногами здесь пока лишь груда кирпичей и щебня. Мне всегда казалось, что человеку мало просто суетиться перед экраном — у каждого должна быть собственная роща, пусть даже выращенная по крупицам из кода и мыслей.',
  ultraPara2Label: 'О Melete',
  ultraPara2: 'Впредь замысел Melete будет предельно прост: приглядеться к вашим привычкам — будь то строгие методы или окольные тропы — и выудить из мировой паутины толковые подручные инструменты и занятные приёмы, чтобы вложить их вам в руки. Какую искру высечет ИИ, зависит только от вашего собственного желания. Если это поможет чуточку яснее смотреть на вещи, узнать что-то новое и жить свободнее и спокойнее, Melete исполнит своё назначение.',
  ultraPara3Label: 'О пейзажах на фоне',
  ultraPara3: 'Леса на фоне сняты в Синьцзяне, в Китае. Высокие горы, просторные озёра и невероятные пейзажи. Друзьям со всего мира непременно стоит побывать там при первой возможности: живые травы, деревья и реки настоящего мира всё равно несравнимо краше любого изображения на экране.',
  ultraCreditsKicker: 'Фотографии и лицензии',
  ultraCreditsTitle: 'Источники фотографий Синьцзяна',
  ultraCommonsLink: 'Источник на Викискладе ↗',
  ultraDotAria: 'Перейти к фото {n}',
  ultraResume: '▶ Продолжить показ',
  ultraPause: '❚❚ Приостановить показ',
  ultraCurrent: 'Сейчас: {title}',
  usageExact: 'Расход токенов: {total} ({in} ввод · {out} вывод) · Расчётная стоимость ({model}): ~{cost} ({code})',
  usageEst: 'Расход токенов: ~{total} (~{in} ввод · ~{out} вывод) · Расчётная стоимость ({model}): ~{cost} ({code})',
  intentionOpen: 'Указать намерение на этот период (необязательно)',
  intentionFold: 'Скрыть намерение',
  pastReviews: 'Предыдущие разборы',
  mirrors: 'Грани наблюдений',
  domainPos: '{n} граней всего',
  seen: 'Обстановка в тот момент',
  evidence: 'Цитаты',
  byYou: 'Ваш взгляд', byAi: 'Поведение ИИ в тот момент', byThing: 'Требования самой задачи',
  readings: 'Цитаты и возможные прочтения',
  aiSide: 'Со стороны ИИ',
  noteToAi: 'Памятка для вашего ИИ',
  noteToAiHint: 'При желании можно скопировать это в пользовательские инструкции вашего ИИ.',
  society: 'Связи с миром',
  question: 'Вопрос для размышления',
  experiments: 'Эксперименты под ваше намерение',
  intentExpTitle: 'Небольшие эксперименты с учётом вашего намерения',
  check: 'На что обратить внимание в следующий раз',
  letterTitle: 'Письмо самому себе',
  letterBody: 'Честно говоря, эта часть ещё не готова и не до конца продумана, поэтому пока остаётся закрытой.',
  notCovered: 'Не затронуто в этот раз: {list}. Если хотите разобрать какую-то грань, укажите её в следующий раз в намерении.',
  lensFoot: 'Схема наблюдений {v} · взгляд: {by}',
  intentionShown: 'Ваше намерение',
  settingsLanguage: 'Язык', followDsh: 'Как в DSH',
  settingsStyle: 'Оформление', styleAuto: 'По региону', greek: 'Древняя Эллада', chinese: 'Древний Китай', babylonian: 'Древний Вавилон', indian: 'Древняя Индия', egyptian: 'Древний Египет', roman: 'Древний Рим', maya: 'Майя', inca: 'Инки',
  occasional: 'Иногда менять стиль',
  settingsDays: 'Период по умолчанию',
  settingsPrivacy: 'Конфиденциальность',
  privacyText: 'Melete не выходит в сеть самостоятельно и ничего не собирает. Взаимодействие с внешним миром зависит только от выбранной вами модели. При разборе выжимка передаётся модели напрямую и не сохраняется в истории чатов.',
  settingsData: 'Данные',
  dataText: 'Разборы и настройки хранятся только в {dir}.',
  deleteAll: 'Удалить все данные',
  deleteConfirm: 'Удалить все разборы и настройки из {dir}? Это действие нельзя отменить.',
  deleted: 'Данные удалены.',
  deleteThis: 'Удалить этот разбор', deleteThisConfirm: 'Удалить этот разбор ({date})? Это действие нельзя отменить.',
  confirmDeleteBtn: 'Подтвердить удаление',
  confirmDeleteAllBtn: 'Подтвердить полное удаление',
  cancelBtn: 'Отмена',
  deleteThisPrompt: 'Удалить этот разбор? Это действие нельзя отменить.',
  settingsAbout: 'О программе',
  aboutText: 'Melete {v} {ed} · Схема наблюдений {lv} · Apache-2.0',
  projectRepo: "Репозиторий",
  cornerGreek: 'Melete (Μελέτη) — муза упражнений и размышлений в древнегреческой мифологии.',
  cornerChinese: '«Каждый день я трижды проверяю себя.» — Конфуций, Беседы и суждения',
  cornerBabylonian: '«Тот, кто видел глубины, познал всё». — Эпос о Гильгамеше',
  cornerIndian: '«Всё, что мы есть, — плод наших мыслей». — Дхаммапада',
  cornerEgyptian: '«Никто не рождается мудрым». — Поучение Птахотепа',
  cornerRoman: '«Уча, мы учимся». — Сенека',
  voicesTitle: 'Голоса · Фрагменты разговоров',
  voicesSub: '{n} ИИ и друзей отвечают на четыре вопроса, одна карточка на ответ · наведите для паузы · нажмите, чтобы прочесть',
  voicesAdd: '+ Добавить карточку',
  voicesRead: 'Читать ↗',
  voicesQNum: 'В{n}',
  voicesQ1: 'Как, по-вашему, людям стоит пользоваться ИИ?',
  voicesQ2: 'Что должен делать ИИ, когда даёт пользователям содержание?',
  voicesQ3: 'Что должно значить для общества то, что люди создают с ИИ?',
  voicesQ4: 'Как людям смотреть на себя, пользуясь ИИ?',
  voicesQs1: 'Как пользоваться ИИ',
  voicesQs2: 'Что делать ИИ',
  voicesQs3: 'Смысл для общества',
  voicesQs4: 'Взгляд на себя',
  voicesKindAI: 'ИИ',
  voicesKindFriend: 'Друг',
  voicesNoteAI: 'Из разговора Yan Canny и {name} 8 ноября 2026 года. Приведено дословно, только разбито на абзацы. Если задать тот же вопрос снова, ответ может быть другим. Это не позиция разработчика модели; название лишь указывает источник.',
  voicesNoteFriend: 'Из переписки Yan Canny с другом; показано с его согласия, под псевдонимом. Приведено дословно, только разбито на абзацы.',
  voicesTranslated: 'Перевод с китайского оригинала.',
  voicesClose: 'Закрыть',
  voicesAria: 'Прочитать ответ {name} на «{q}»',
  voicesFormTitle: 'Добавить карточку разговора',
  voicesFormName: 'Человек / модель *',
  voicesFormNamePh: 'например: Claude Opus 5.5; для друзей — псевдоним, не настоящее имя',
  voicesFormKind: 'Метка',
  voicesFormKindPh: 'например: ИИ, друг',
  voicesFormExcerpt: 'Одна фраза для карточки *',
  voicesFormExcerptPh: 'Фраза, которая заставила задуматься…',
  voicesFormFull: 'Полный ответ *',
  voicesFormFullPh: 'Вставьте ответы как «В1: …», «В2: …» — они разделятся по карточке на вопрос.',
  voicesFormNote: 'Примечание (необязательно)',
  voicesFormNotePh: 'например: мысли 2026 года о работе с ИИ',
  voicesSafety: 'Перед сохранением проверьте: уберите настоящие имена, названия компаний и проектов, контакты и личные данные на скриншотах. Карточки хранятся только на этом компьютере и никуда не загружаются, но на скриншоте их смогут прочесть.',
  voicesSafetyOk: 'Я убрал(а) это; если это слова друга, у меня есть его согласие',
  voicesCancel: 'Отмена',
  voicesSave: 'Сохранить',
  homeRange: 'Период: {r}',
  homeModel: 'Модель: {m}',
  homeNoModel: 'Модель не подключена (настройте в DSH)',
  homeAdv: 'Ещё · период и намерение',
  homeCollapse: 'Скрыть ▴',
  homeExpand: 'Показать ▾',
  homeRangeLabel: 'Выберите период',
  homeByYear: 'По году',
  homeCustom: 'Свой период',
  homeAll: 'Всё',
  homeYearOpt: '{y}',
  homeDefault: ' (по умолчанию)',
  homeYearHint: 'С 1 марта выбирается текущий год; в январе и феврале — предыдущий.',
  homeIntentLabel: 'На чём сосредоточить разбор? (необязательно)',
  rangeYearFmt: '{y} ({a} — {b})',
  rangeSpanFmt: '{a} — {b}',
  rangeAllText: 'Вся история',
  rangeDaysText: 'Последние {n} дн.',
  shareLight: 'Светлая',
  shareDark: 'Тёмная',
  sharePhMoment: 'Момент, который хочется сохранить',
  sharePhAi: 'Пара слов о стороне ИИ',
  sharePhQ: 'Вопрос самому себе',
  shareHashtag: '#MeleteРазбор',
  cornerMaya: '«Пусть поднимутся все, пусть никто не останется позади». — «Пополь-Вух»',
  cornerInca: '«Не воруй, не лги, не ленись». — Триада инков (Ama sua, ama llulla, ama quella)',
  settingsNotSaved: 'Не сохранилось. Полностью закройте DSH (⌘Q), откройте снова и повторите.',
  details: 'Цитаты и возможные трактовки ({e} цитат · {r} версий)',
  viewContextBtn: 'Посмотреть исходный диалог и контекст',
  contextModalTitle: 'Контекст диалога',
  contextLoading: 'Загрузка фрагмента беседы…',
  contextEmpty: 'Локальная запись беседы не найдена; возможно, была удалена.',
  contextClose: 'Закрыть контекст',
  domH: 'Вы → ИИ', domHsub: 'Как вы работаете с ИИ',
  domA: 'ИИ → Вам', domAsub: 'Как ИИ относится к вам',
  domS: 'Вы и мир', domSsub: 'Связи с внешним миром',
  domI: 'Внутреннее «я»', domIsub: 'Только вы',
  mirrorCount: '{n} граней', sealed: 'Письмо · Пока закрыто',
  sealedHint: 'Это письмо можно будет открыть в одной из следующих версий.',
  emptyH: 'В этот раз в данном направлении не выделено граней.',
  emptyA: 'В этот раз со стороны ИИ не выделено граней.',
  emptyS: 'В записях за этот период не замечено контактов с внешним миром. Отмечается лишь то, что проявилось.',
  "ultraTag_all": "Все",
  "ultraTag_specFirst": "Спецификация",
  "ultraTag_twoStageEval": "Проверка фактов",
  "ultraTag_modularPatterns": "Атомарные шаги",
  "ultraTag_invertedInquiry": "Уточнение деталей",
  "ultraTag_chunkMapReduce": "Поэтапный сбор",
  "ultraSlide_fir-forest_title": "Тянь-Шань · Еловый лес Шренка",
  "ultraSlide_fir-forest_credit": "Фото: lwtt93 (Шанхай) · Лицензия: CC BY 2.0 (С указанием автора, коммерческое и производное использование разрешено)",
  "ultraSlide_moon-bay_title": "Канас · Лесной залив Лунной бухты",
  "ultraSlide_moon-bay_credit": "Фото: Niranarm · Лицензия: Общественное достояние",
  "ultraSlide_foggy-lake_title": "Алтай · Туманный берег озера Канас",
  "ultraSlide_foggy-lake_credit": "Фото: Muye Ma (через Unsplash) · Лицензия: CC0 1.0",
  "ultraSlide_autumn-lake_title": "Канас · Осенний лес и снежные вершины",
  "ultraSlide_autumn-lake_credit": "Фото: Charlie fong · Лицензия: Общественное достояние",
  "ultraRec_spec-first_badge": "Техзадание",
  "ultraRec_spec-first_title": "Spec-First: Структурированное задание и системные рамки",
  "ultraRec_spec-first_summary": "Из руководства Anthropic. Разделяет задачу на роль, контекст, строгие ограничения и формат вывода.",
  "ultraRec_spec-first_matchReason": "Соответствует вашей привычке задавать границы перед передачей задачи целиком",
  "ultraRec_two-stage-eval_badge": "Проверка",
  "ultraRec_two-stage-eval_title": "Двухэтапная проверка фактов и цепочка обоснования",
  "ultraRec_two-stage-eval_summary": "Разделяет сбор точных цитат и выводы, предотвращая появление неточностей в тексте.",
  "ultraRec_two-stage-eval_matchReason": "Соответствует вашему вниманию к проверяемым источникам и точности формулировок",
  "ultraRec_modular-patterns_badge": "Атомарные шаги",
  "ultraRec_modular-patterns_title": "Модульные навыки и цепочки микрозадач",
  "ultraRec_modular-patterns_summary": "Превращает выжимку, структуру и проверку в стандартизированные шаги, соединённые в цепочку.",
  "ultraRec_modular-patterns_matchReason": "Подходит для разделения сложных процессов на ясные последовательные этапы",
  "ultraRec_inverted-inquiry_badge": "Уточнение",
  "ultraRec_inverted-inquiry_title": "Встречное уточнение и согласование до начала работы",
  "ultraRec_inverted-inquiry_summary": "ИИ перед началом работы задаёт уточняющие вопросы по неочевидным деталям, снимая неясности.",
  "ultraRec_inverted-inquiry_matchReason": "Подходит для ситуаций, когда полезно заранее проверить пробелы и взглянуть шире",
  "ultraRec_chunk-map-reduce_badge": "Синтез",
  "ultraRec_chunk-map-reduce_title": "Иерархическое извлечение и объединение длинных текстов",
  "ultraRec_chunk-map-reduce_summary": "Распределяет сбор ключевых данных по фрагментам и аккуратно сводит их в итоговый отчёт.",
  "ultraRec_chunk-map-reduce_matchReason": "Подходит для разбора многодневных диалогов и больших объёмов материалов",
  emptyReviewsHint: "Записей разбора пока нет. Перейдите на главную, чтобы начать первый разбор.",
  'error.network-error': "Не удалось связаться с локальной службой плагина. Повторите попытку.",
  sharePostcardBtn: 'Поделиться моим разбором',
  exportReviewBtn: 'Экспортировать обзор (HTML)',
  shareTitle: 'Поделиться этим периодом',
  shareSub: 'Всё готово, сохранение в один клик',
  shareCopyImg: '⧉ Скопировать изображение',
  shareSaveImg: '↓ Сохранить длинное изображение',
  shareCopyText: '✎ Скопировать текст',
  shareSaveHtml: '⌂ Сохранить HTML',
  shareCopiedImgToast: 'Скопировано в буфер обмена',
  shareSavedImgToast: 'Сохранено в ~/.melete/shares/',
  shareCopiedTextToast: 'Текст скопирован с тегом #MeleteDebrief',
  shareSavedHtmlToast: 'HTML сохранен в ~/.melete/shares/',
  shareExportedToast: 'Полный обзор сохранен в ~/.melete/shares/',
  shareRevealFinder: 'Показать в Finder',
  shareHideBlockHint: 'Нажмите ◉ чтобы скрыть блок; текст можно редактировать',
  shareMoreOptions: 'Ещё: Стиль · Размер · Тема · Подпись',
  shareTagCover: 'Этот период',
  shareTagNums: 'Цифры',
  shareTagPractices: 'Мои подходы',
  shareTagMoment: 'Один момент',
  shareTagSplit: 'Разделение задач',
  shareTagAiNote: 'Со стороны ИИ',
  shareTagDial: 'Время нашей совместной работы',
  shareTagQuestion: 'Вопрос к себе',
  shareMine: 'Оставил себе',
  shareAi: 'Поручил ИИ',
  shareSessions: 'сессий',
  shareUserMsgs: 'моих сообщений',
  shareToolCalls: 'действий инструментов',
  shareModelsCount: 'моделей задействовано',
  shareSignature: 'Мой ИИ-обзор',
  traitSpec: 'Четкие спецификации',
  traitEvidence: 'Проверка фактов',
  traitDelegate: 'Делегирование задач',
  traitBoundaries: 'Соблюдение границ',
  traitExplore: 'Быстрое исследование',
  traitTone: 'Внимание к стилю',
  traitPace: 'Управление ритмом',
  contextWhoUser: 'Пользователь',
}


    const pt = {
  loading: 'Abrindo…',
  tagline: 'Veja como você e a IA trabalharam juntos ultimamente.',
  intentionLabel: 'Em que você esteve focado ultimamente?',
  intentionHint: 'Opcional. Com uma intenção definida, a análise pode sugerir pequenos experimentos.',
  intentionPlaceholder: 'No que você gostaria que a análise focasse? Pode anotar aqui ou deixar em branco.',
  chips: 'Trabalhar mais rápido|Aprender algo novo|Manter minha própria voz|Tornar entregas mais confiáveis|Apenas curiosidade',
  rangeLabel: 'Período a revisar',
  r7: '7 dias', r30: '30 dias', r90: '90 dias', r365: '1 ano', rAll: 'Tudo', rCustom: 'Escolher datas',
  rFrom: 'De', rTo: 'Até',
  'error.bad-range': 'Intervalo de datas inválido. Verifique as datas de início e fim.',
  rangeAllHint: 'Quando há muitos registros, uma amostragem equilibrada é feita ao longo do tempo.',
  settingsMore: 'Mais',
  changelogBtn: 'Notas de atualização', philosophyBtn: 'A ideia do Melete', letterBtn: 'Carta do autor',
  back: 'Voltar às configurações',
  changelogTitle: 'Notas de atualização',
  changelogSub: "Versão 1 · 8 de novembro de 2026",
  changelogItems: "## Análise|Há uma nova entrada “Análise” na barra lateral do DSH: ela lê apenas as sessões locais e mostra como você e a IA vêm trabalhando juntos; sem notas, sem rankings, sem envio de relatórios.|A página inicial explica em uma frase, com “Iniciar análise” no centro; o período e o modelo em uso ficam sempre à vista.|O campo de intenção já vem aberto: escreva o que importa para você ultimamente ou toque em uma frase pronta. Só com uma intenção a análise sugere pequenos experimentos voltados para ela.|Períodos: 7 dias, 30 dias, 90 dias, 1 ano, tudo, datas personalizadas e por ano. Por padrão, a virada acontece em 1º de março (janeiro e fevereiro contam como ano anterior), e históricos longos são amostrados de forma equilibrada ao longo do tempo.|Uma análise acontece em três etapas: ler os registros locais → o modelo que você escolheu escreve → os cartões são montados. Costuma levar um ou dois minutos, então dá para cuidar de outra coisa.|O pedido vai do plugin direto para o modelo que você escolheu no DSH. Nenhuma sessão é criada, então a análise nunca aparece no histórico de sessões.|## Cartões|Uma análise é uma pilha de cartões: a capa diz o período e “quem olha para quem”, e abaixo vêm quatro direções — você → IA, IA → você, você e o mundo, e o eu interior.|Cada espelho abre com um pequeno texto, e as fontes e considerações da época ficam recolhidas logo abaixo. Toda observação oferece pelo menos duas leituras e, quando algo não está claro, diz isso.|Dá para abrir uma fonte em “Ver diálogo original e contexto” e ler ali mesmo as palavras mascaradas, sem precisar voltar às sessões.|Os julgamentos centrais do texto ganham um marca-texto quente, seguidos de uma ou duas etiquetas, para que seus hábitos recentes de colaboração fiquem visíveis de imediato.|O lado da IA, a relação com o mundo e uma pergunta ganham um cartão cada; todo espelho termina com uma citação de uma cultura antiga que combina com o momento.|O “eu interior” é uma carta lacrada: recolhida por padrão, ainda sem conteúdo gerado, à espera de uma versão futura.|Os registros de análise permitem rever análises anteriores e excluir uma delas; cada análise é salva em JSON e Markdown, e as antigas continuam abríveis sempre que possível.|Ao fim de cada análise aparecem os tokens usados e uma estimativa de custo no modelo escolhido, calculada localmente e sem chamadas de rede.|## Vozes|À direita da página inicial fica “Vozes · Trechos de conversas”: IAs e amigos respondendo a quatro perguntas, um cartão por resposta, duas colunas deslizando devagar, pausa ao passar o mouse e texto completo ao clicar.|Também dá para adicionar seus próprios cartões de conversa: ficam só neste computador, com uma lista de checagem de privacidade antes de salvar.|## Seu novo mundo|“Seu novo mundo: Prévia” tem um carrossel de paisagens de Xinjiang e uma seleção de fluxos de trabalho e Skill de IA de código aberto, marcando o que está “próximo do seu jeito recente de trabalhar”.|Cada recomendação traz resumo, motivo da afinidade, repositório, licença e um link direto para a fonte; fotos e recomendações vêm empacotadas no plugin e não fazem requisições de rede em execução.|A página é honesta: este terreno ainda está crescendo — um primeiro esboço do futuro mapa de métodos.|## Compartilhar|“Compartilhar minha reflexão” já vem diagramado: prévia em formato de cartão-postal, tema claro ou escuro e tamanhos quadrado, cartão, retrato ou imagem longa.|Para esconder um bloco ou uma frase, basta passar o mouse e clicar; o texto também pode ser editado ali mesmo.|Copiar a imagem, copiar o texto da publicação, salvar uma imagem longa ou HTML; a análise completa também pode ser exportada como um arquivo HTML.|O compartilhamento deixa de fora o eu interior e evita nomes de projetos, origens de sessão e números identificáveis; não há botões de redes sociais nem convites para compartilhar.|## Aparência|Oito roupagens de civilizações antigas — Hélade antiga, China antiga, Babilônia antiga, Índia antiga, Egito antigo, Roma antiga, Maia e Inca — cada uma com paleta, céu, emblema, numeração, ornamento e citação de canto próprios.|O fundo é desenhado em código: paisagens e traços de arquitetura. Ao rolar um registro de análise para baixo, o edifício cresce traço a traço; sol, lua, nuvens, figuras e animais reagem ao ponteiro, e citações antigas passam suaves como comentários flutuantes.|O estilo segue a sua região por padrão e também pode ser fixado; em “Alternar estilo ocasionalmente”, metade das vezes mostra a civilização local e o restante sorteia entre as outras.|Claro e escuro seguem o DSH ou a sua escolha; fontes e redução de movimento seguem o DSH e o sistema; telas pequenas, uso do teclado e rótulos para leitores de tela também foram considerados.|## Idiomas|A interface está totalmente traduzida em oito idiomas: 简体中文, English, 日本語, Español, Français, Deutsch, Русский e Português; Vozes, recomendações, textos de compartilhamento, citações e configurações mudam junto.|O texto da análise é escrito no idioma em que você estava usando a interface; o nome na barra lateral segue o DSH, e o título da página é “Melete” mais a palavra de cada idioma para análise.|## Privacidade e dados|Só entram as palavras que você mesmo escreveu; e-mails, telefones e chaves são substituídos localmente antes de irem para o modelo que você escolheu. Sem rede, sem envio de relatórios, sem servidores e sem telemetria.|Análises e configurações ficam só em ~/.melete/; a página de configurações mostra o local e permite excluir uma análise ou todos os dados a qualquer momento.|Em caso de falha, só números como duração e motivo de encerramento são registrados localmente, nunca o conteúdo; dados antigos, campos ausentes e conexões interrompidas têm seus próprios caminhos de contingência, avisos e nova tentativa.|## Configurações e documentação|As configurações reúnem idioma, aparência, período padrão, notas de privacidade, local dos dados e exclusão em um clique, além de “Sobre” (versão, versão do Mapa de observação, licença).|Vêm incluídos “A ideia do Melete” (relativamente estável / ainda em aberto / o objetivo / uma palavra inicial), “Carta do autor” e estas notas de atualização.|Esta versão é 0.1.1 Telos Ultra com Mapa de observação 0.4.0; o código é Apache-2.0 e o Mapa de observação, CC BY 4.0.",
  philosophyTitle: 'A ideia do Melete',
  philosophySub: 'Reveja como você e a IA trabalham juntos.',
  philosophyBody: 'O Melete mostra como você e a IA colaboram no dia a dia. Você decide o valor: uma mesma atitude pode fazer sentido dependendo do objetivo.|Sem notas, sem classificações, sem rótulos.|Cada observação parte de conversas reais e admite pelo menos duas interpretações.|A IA também passa pelo espelho: se apenas concorda com tudo ou se toma decisões por você.|Seus registros ficam apenas no seu computador. O Melete não tem servidores nem coleta dados; você pode apagar tudo a qualquer momento.|Depois de olhar no espelho: reflita, tente um pequeno experimento e volte a observar.',
  philosophyNote: 'Esta página é um rascunho baseado nos princípios do projeto; o autor irá reescrevê-la.',
  makerLetterTitle: 'Carta do autor',
  makerLetterSub: 'Escrito no clamor das marés',
  makerLetterBody: 'Olá, boas-vindas ao Melete.|Existem dois tipos de espelhos neste mundo: um é o espelho de parque de diversões, que faz você parecer alto e imponente só para divertir os outros; o outro é o espelho de mercúrio da pia pela manhã, frio e implacável, que reflete até as olheiras de uma noite mal dormida.|As retrospectivas de fim de ano nas redes sociais quase sempre pertencem ao primeiro tipo. Mas quando vi alguém começar a olhar com serenidade para os hábitos de pensamento e a destreza com ferramentas de uma pessoa diante da IA, senti uma satisfação há muito esperada: é assim que se respeita um ser inteligente.|O Melete nasceu dessa inconformidade. Não temos a intenção de enfeitar nada; queremos apenas colocar diante de você, com total clareza, habilidades de ponta, métodos transparentes e, acima de tudo, as pegadas do seu próprio pensamento.|Nunca acreditei em euforias tecnológicas milagrosas; acredito apenas em pessoas concretas e vivas. Espero que, através dos caracteres que você digitou, possa sentir os contornos da sua própria forma com mais clareza; e que este pequeno esforço ajude você a preservar sua liberdade e sobriedade em meio ao rumor das marés.',
  makerLetterSign: 'Yan Canny · 8 de novembro de 2026',
  start: 'Iniciar análise',
  privacyNote: 'O resumo considera apenas o que você mesmo digitou; e-mails, telefones e chaves são mascarados localmente antes de serem enviados ao modelo escolhido no DSH ({model}). O Melete não faz requisições remotas próprias e não coleta nada.',
  noModel: 'Nenhum modelo disponível no DSH. Escolha um modelo no DSH primeiro.',
  run1: 'Lendo registros locais', run2: '{model} está redigindo', run3: 'Organizando os cartões',
  runHint: 'Costuma levar um ou dois minutos. Fique à vontade para fazer outra coisa e voltar depois.',
  'error.no-records': 'Não encontramos sessões com mensagens suas neste período. Tente um intervalo maior.',
  'error.no-model': 'Nenhum modelo disponível no DSH. Escolha um modelo no DSH primeiro.',
  'error.empty-review': 'O modelo não gerou espelhos desta vez. Tente novamente.',
  'error.bad-output': 'A resposta não pôde ser convertida em cartões desta vez. Tente novamente.',
  'error.busy': 'Já existe uma análise em andamento.',
  'error.generic': 'A análise não pôde ser concluída: {msg}',
  retry: 'Tentar novamente',
  navReviews: 'Registros de análise', navNew: 'Início', navUltra: 'Seu novo mundo: Prévia', navSettings: 'Configurações',
  ultraTitle: 'Seu Novo Mundo',
  ultraKicker: 'Prévia',
  ultraSub: 'Fluxos de trabalho, habilidades e padrões de IA selecionados para combinar com seus hábitos de colaboração. Extraídos de projetos de código aberto com licenças permissivas — explore as fontes diretamente pelos links.',
  ultraRecKicker: 'Fluxos e habilidades recomendados',
  ultraRecTitle: 'Padrões de IA que combinam com você',
  ultraFilterAll: 'Tudo',
  ultraMatchedBadge: '★ Alinhado aos seus padrões recentes',
  ultraVisitLink: 'Ver repositório ↗',
  ultraRepoLabel: 'Repositório: ',
  ultraAboutKicker: 'Uma breve nota',
  ultraAboutTitle: 'Sobre esta página',
  ultraPara1Label: 'Sobre o estado atual',
  ultraPara1: 'Este canto ainda não ficou pronto de verdade; por baixo, ainda é quase um montão de tijolos e cascalho. Sempre achei que não basta passar a vida atarefado diante de uma tela. Todo mundo deveria ter uma floresta para chamar de sua, mesmo que tenha de ser plantada aos poucos, com linhas de código e ideias.',
  ultraPara2Label: 'Sobre o Melete',
  ultraPara2: 'Daqui em diante, o que o Melete quer fazer é bem simples: olhar para o seu jeito de trabalhar — sejam atalhos improvisados ou métodos bem certinhos — e pescar na rede mundial ferramentas práticas e boas ideias para colocar nas suas mãos. A faísca que a IA vai acender depende unicamente da sua própria vontade. Se isso ajudar você a enxergar um pouco mais longe no dia a dia, aprender algo novo e viver com mais leveza e respiro, o Melete já terá cumprido a sua missão.',
  ultraPara3Label: 'Sobre a paisagem de fundo',
  ultraPara3: 'As matas do fundo foram registradas em Xinjiang, na China. Montanhas imponentes e águas sem fim; uma paisagem formidável. Amigos de todas as partes do mundo estão mais do que convidados a passear por lá quando puderem — afinal, as árvores e os rios de verdade do mundo real serão sempre infinitamente mais bonitos do que qualquer tela.',
  ultraCreditsKicker: 'Fotos e licenças',
  ultraCreditsTitle: 'Créditos das fotos de Xinjiang',
  ultraCommonsLink: 'Fonte no Wikimedia Commons ↗',
  ultraDotAria: 'Mudar para foto {n}',
  ultraResume: '▶ Retomar reprodução',
  ultraPause: '❚❚ Pausar carrossel',
  ultraCurrent: 'Atual: {title}',
  usageExact: 'Consumo: {total} tokens ({in} entrada · {out} saída) · Custo estimado com {model}: ~{cost} ({code})',
  usageEst: 'Consumo: ~{total} tokens (~{in} entrada · ~{out} saída) · Custo estimado com {model}: ~{cost} ({code})',
  intentionOpen: 'Adicionar uma intenção para este período (opcional)',
  intentionFold: 'Ocultar intenção',
  pastReviews: 'Análises anteriores',
  mirrors: 'Espelhos observados',
  domainPos: '{n} espelhos no total',
  seen: 'Contexto da época',
  evidence: 'Fontes',
  byYou: 'Sua perspectiva', byAi: 'Atitude da IA na ocasião', byThing: 'Exigências da própria tarefa',
  readings: 'Fontes e leituras possíveis',
  aiSide: 'Do lado da IA',
  noteToAi: 'Mensagem para sua IA',
  noteToAiHint: 'Se quiser, você pode colar isso nas instruções personalizadas da sua IA.',
  society: 'Você e o mundo exterior',
  question: 'Uma pergunta',
  experiments: 'Experimentos conforme sua intenção',
  intentExpTitle: 'Pequenos experimentos baseados na intenção registrada',
  check: 'Para observar na próxima vez',
  letterTitle: 'Uma carta para você mesmo',
  letterBody: 'Sendo bem honesto: esta parte ainda não está pronta nem madura, portanto permanece fechada por enquanto.',
  notCovered: 'Não abordado desta vez: {list}. Se quiser observar algum ponto na próxima vez, anote-o em sua intenção.',
  lensFoot: 'Mapa de observação {v} · visto por {by}',
  intentionShown: 'Sua intenção registrada',
  settingsLanguage: 'Idioma', followDsh: 'Seguir o DSH',
  settingsStyle: 'Aparência', styleAuto: 'Conforme região', greek: 'Hélade antiga', chinese: 'China antiga', babylonian: 'Babilônia antiga', indian: 'Índia antiga', egyptian: 'Egito antigo', roman: 'Roma antiga', maya: 'Maya', inca: 'Inca',
  occasional: 'Alternar estilo ocasionalmente',
  settingsDays: 'Período padrão',
  settingsPrivacy: 'Privacidade',
  privacyText: 'O Melete não se conecta à internet e não coleta dados. A comunicação com o exterior depende exclusivamente do modelo que você configurar. Durante a análise, o extrato é enviado ao modelo do DSH e não fica registrado nas conversas comuns.',
  settingsData: 'Dados',
  dataText: 'Análises e configurações ficam salvas apenas em {dir}.',
  deleteAll: 'Excluir todos os dados',
  deleteConfirm: 'Excluir todas as análises e configurações em {dir}? Esta ação não pode ser desfeita.',
  deleted: 'Excluído.',
  deleteThis: 'Excluir esta análise', deleteThisConfirm: 'Excluir esta análise ({date})? Esta ação não pode ser desfeita.',
  confirmDeleteBtn: 'Confirmar exclusão',
  confirmDeleteAllBtn: 'Confirmar exclusão total',
  cancelBtn: 'Cancelar',
  deleteThisPrompt: 'Excluir esta análise? Esta ação não pode ser desfeita.',
  settingsAbout: 'Sobre',
  aboutText: 'Melete {v} {ed} · Mapa de observação {lv} · Apache-2.0',
  projectRepo: "Repositório",
  cornerGreek: 'Melete (Μελέτη), a musa grega do exercício e da contemplação.',
  cornerChinese: '“Todos os dias examino a mim mesmo em três pontos.” — Os Analectos',
  cornerBabylonian: '“Aquele que viu o abismo conheceu todas as coisas.” — Epopeia de Gilgamesh',
  cornerIndian: '“Tudo o que somos é resultado do que pensamos.” — Dhammapada',
  cornerEgyptian: '“Ninguém nasce sábio.” — Máximas de Ptahhotep',
  cornerRoman: '“Ensinando, aprendemos.” — Sêneca',
  voicesTitle: 'Vozes · Trechos de conversas',
  voicesSub: '{n} IAs e amigos respondem a quatro perguntas, um cartão por resposta · passe o mouse para pausar · clique para ler',
  voicesAdd: '+ Adicionar cartão',
  voicesRead: 'Ler ↗',
  voicesQNum: 'P{n}',
  voicesQ1: 'Como você espera que as pessoas usem a IA?',
  voicesQ2: 'O que a IA deveria fazer ao fornecer conteúdo aos usuários?',
  voicesQ3: 'Que sentido deveria ter para a sociedade o que as pessoas produzem com IA?',
  voicesQ4: 'Como as pessoas deveriam encarar a si mesmas ao usar IA?',
  voicesQs1: 'Como usar a IA',
  voicesQs2: 'O que a IA deve fazer',
  voicesQs3: 'Sentido para a sociedade',
  voicesQs4: 'Encarar a si mesmo',
  voicesKindAI: 'IA',
  voicesKindFriend: 'Um amigo',
  voicesNoteAI: 'De uma conversa entre Yan Canny e {name} em 8 de novembro de 2026. Citado como escrito, apenas dividido em parágrafos. A mesma pergunta pode ter outra resposta se feita de novo. Não representa a posição do desenvolvedor do modelo; o nome só indica a fonte.',
  voicesNoteFriend: 'De uma conversa entre Yan Canny e um amigo, exibida com o consentimento dele e com apelido. Citado como escrito, apenas dividido em parágrafos.',
  voicesTranslated: 'Traduzido do original em chinês.',
  voicesClose: 'Fechar',
  voicesAria: 'Ler a resposta de {name} a “{q}”',
  voicesFormTitle: 'Adicionar cartão de conversa',
  voicesFormName: 'Pessoa / modelo *',
  voicesFormNamePh: 'ex.: Claude Opus 5.5; para amigos, use um apelido, não o nome real',
  voicesFormKind: 'Rótulo',
  voicesFormKindPh: 'ex.: IA, um amigo',
  voicesFormExcerpt: 'Uma frase para o cartão *',
  voicesFormExcerptPh: 'Uma frase que fez você pensar…',
  voicesFormFull: 'Resposta completa *',
  voicesFormFullPh: 'Cole as respostas como “P1: …”, “P2: …”; elas são divididas em um cartão por pergunta.',
  voicesFormNote: 'Nota (opcional)',
  voicesFormNotePh: 'ex.: reflexões de 2026 sobre trabalhar com IA',
  voicesSafety: 'Antes de salvar, confira: remova nomes reais, empresas, projetos, contatos e qualquer dado pessoal em capturas de tela. Os cartões ficam só neste computador e não são enviados, mas quem vir uma captura poderá lê-los.',
  voicesSafetyOk: 'Removi as informações acima; se forem palavras de um amigo, tenho o consentimento dele',
  voicesCancel: 'Cancelar',
  voicesSave: 'Salvar cartão',
  homeRange: 'Período: {r}',
  homeModel: 'Modelo: {m}',
  homeNoModel: 'Nenhum modelo conectado (configure no DSH)',
  homeAdv: 'Mais · período e intenção',
  homeCollapse: 'Ocultar ▴',
  homeExpand: 'Mostrar ▾',
  homeRangeLabel: 'Escolha o período',
  homeByYear: 'Por ano',
  homeCustom: 'Personalizado',
  homeAll: 'Tudo',
  homeYearOpt: '{y}',
  homeDefault: ' (padrão)',
  homeYearHint: 'A partir de 1º de março, muda para o ano atual; em janeiro e fevereiro, o padrão é o ano anterior.',
  homeIntentLabel: 'No que a análise deve focar? (opcional)',
  rangeYearFmt: '{y} ({a} a {b})',
  rangeSpanFmt: '{a} a {b}',
  rangeAllText: 'Todo o histórico',
  rangeDaysText: 'Últimos {n} dias',
  shareLight: 'Claro',
  shareDark: 'Escuro',
  sharePhMoment: 'Um momento para guardar',
  sharePhAi: 'Uma nota sobre o lado da IA',
  sharePhQ: 'Uma pergunta para mim',
  shareHashtag: '#MeleteAnálise',
  cornerMaya: '“Que todos se levantem, que ninguém fique para trás.” — Popol Vuh',
  cornerInca: '“Não roubes, não mintas, não sejas preguiçoso.” — Sabedoria inca (Ama sua, ama llulla, ama quella)',
  settingsNotSaved: 'Não foi salvo. Feche o DSH por completo (⌘Q), abra de novo e tente outra vez.',
  details: 'Fontes e possíveis motivos ({e} fontes · {r} possibilidades)',
  viewContextBtn: 'Ver diálogo original e contexto',
  contextModalTitle: 'Contexto do diálogo',
  contextLoading: 'Carregando diálogo original…',
  contextEmpty: 'Registro local da conversa não encontrado; pode ter sido excluído.',
  contextClose: 'Fechar contexto',
  domH: 'Você → IA', domHsub: 'Como você usa a IA',
  domA: 'IA → Você', domAsub: 'Como a IA trata você',
  domS: 'Você e o mundo', domSsub: 'O que flui com o exterior',
  domI: 'Eu interior', domIsub: 'Apenas você',
  mirrorCount: '{n} espelhos', sealed: 'Carta · Em breve',
  sealedHint: 'Abriremos esta carta em uma versão futura.',
  emptyH: 'Nenhum espelho foi selecionado desta vertente desta vez.',
  emptyA: 'Nenhum espelho foi selecionado do lado da IA desta vez.',
  emptyS: 'Não observamos registros de contato com o exterior neste período. Apenas o que ocorreu é registrado.',
  "ultraTag_all": "Tudo",
  "ultraTag_specFirst": "Especificação prévia",
  "ultraTag_twoStageEval": "Verificação estrita",
  "ultraTag_modularPatterns": "Etapas atômicas",
  "ultraTag_invertedInquiry": "Alinhamento prévio",
  "ultraTag_chunkMapReduce": "Síntese em etapas",
  "ultraSlide_fir-forest_title": "Tianshan · Floresta de abetos de Schrenk",
  "ultraSlide_fir-forest_credit": "Foto: lwtt93 (Xangai) · Licença: CC BY 2.0 (Atribuição necessária, uso comercial e derivados permitidos)",
  "ultraSlide_moon-bay_title": "Kanas · Bosque de Moon Bay",
  "ultraSlide_moon-bay_credit": "Foto: Niranarm · Licença: Domínio público",
  "ultraSlide_foggy-lake_title": "Altay · Margens enevoadas do lago Kanas",
  "ultraSlide_foggy-lake_credit": "Foto: Muye Ma (via Unsplash) · Licença: CC0 1.0",
  "ultraSlide_autumn-lake_title": "Kanas · Bosque de outono e picos nevados",
  "ultraSlide_autumn-lake_credit": "Foto: Charlie fong · Licença: Domínio público",
  "ultraRec_spec-first_badge": "Especificação",
  "ultraRec_spec-first_title": "Spec-First: Instruções estruturadas e diretrizes",
  "ultraRec_spec-first_summary": "Do tutorial oficial da Anthropic. Divide tarefas em persona, contexto, limites estritos e formato de saída.",
  "ultraRec_spec-first_matchReason": "Combina com seu hábito de delimitar bem o escopo antes de delegar a tarefa por completo",
  "ultraRec_two-stage-eval_badge": "Verificação",
  "ultraRec_two-stage-eval_title": "Verificação em duas fases e auditoria de raciocínio",
  "ultraRec_two-stage-eval_summary": "Separa a coleta de evidências da conclusão final, assegurando citações precisas e fatos consistentes.",
  "ultraRec_two-stage-eval_matchReason": "Combina com sua atenção rigorosa a evidências verificáveis e citações exatas",
  "ultraRec_modular-patterns_badge": "Etapas atômicas",
  "ultraRec_modular-patterns_title": "Micro-habilidades modulares e encadeamento",
  "ultraRec_modular-patterns_summary": "Converte extração, estruturação e revisão em ferramentas atômicas encadeadas com clareza.",
  "ultraRec_modular-patterns_matchReason": "Ideal para desmembrar processos complexos em etapas pontuais e objetivas",
  "ultraRec_inverted-inquiry_badge": "Esclarecimento",
  "ultraRec_inverted-inquiry_title": "Perguntas inversas e alinhamento prévio",
  "ultraRec_inverted-inquiry_summary": "A IA faz perguntas pontuais sobre pontos cegos antes de iniciar, resolvendo ambiguidades a tempo.",
  "ultraRec_inverted-inquiry_matchReason": "Útil quando você deseja que a IA aponte dúvidas e traga novas perspectivas antes da execução",
  "ultraRec_chunk-map-reduce_badge": "Síntese",
  "ultraRec_chunk-map-reduce_title": "Extração hierárquica e consolidação de textos longos",
  "ultraRec_chunk-map-reduce_summary": "Distribui a leitura de materiais extensos em subpartes e os consolida ao final sem perda de detalhes.",
  "ultraRec_chunk-map-reduce_matchReason": "Adequado para sintetizar sequências de conversas e documentos longos",
  emptyReviewsHint: "Ainda não há registros de análise. Vá para o início para começar sua primeira análise.",
  'error.network-error': "Falha na conexão com o serviço local do plugin. Tente novamente.",
  sharePostcardBtn: 'Compartilhar minha reflexão',
  exportReviewBtn: 'Exportar reflexão (HTML)',
  shareTitle: 'Compartilhar este período',
  shareSub: 'Pronto por padrão, salve com um clique',
  shareCopyImg: '⧉ Copiar imagem',
  shareSaveImg: '↓ Salvar imagem longa',
  shareCopyText: '✎ Copiar texto',
  shareSaveHtml: '⌂ Salvar HTML',
  shareCopiedImgToast: 'Copiado para a área de transferência',
  shareSavedImgToast: 'Salvo em ~/.melete/shares/',
  shareCopiedTextToast: 'Texto copiado com #MeleteDebrief',
  shareSavedHtmlToast: 'HTML salvo em ~/.melete/shares/',
  shareExportedToast: 'Reflexão completa salva em ~/.melete/shares/',
  shareRevealFinder: 'Mostrar no Finder',
  shareHideBlockHint: 'Clique em ◉ para ocultar; clique no texto para editar',
  shareMoreOptions: 'Mais: Estilo · Dimensões · Tema · Assinatura',
  shareTagCover: 'Este período',
  shareTagNums: 'Números',
  shareTagPractices: 'Minhas práticas',
  shareTagMoment: 'Um momento',
  shareTagSplit: 'Divisão de trabalho',
  shareTagAiNote: 'Do lado da IA',
  shareTagDial: 'Horas de trabalho conjunto',
  shareTagQuestion: 'Uma pergunta para mim',
  shareMine: 'Feito por mim',
  shareAi: 'Entregue à IA',
  shareSessions: 'sessões',
  shareUserMsgs: 'mensagens minhas',
  shareToolCalls: 'ações de ferramentas',
  shareModelsCount: 'modelos utilizados',
  shareSignature: 'Minha reflexão com IA',
  traitSpec: 'Definir especificações',
  traitEvidence: 'Verificar evidências',
  traitDelegate: 'Delegar com confiança',
  traitBoundaries: 'Proteger os limites',
  traitExplore: 'Explorar e testar',
  traitTone: 'Atenção ao tom',
  traitPace: 'Controlar o ritmo',
  contextWhoUser: 'Usuário',
}


    const DICTS = { zh, en, ja, es, fr, de, ru, pt }
    const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : ''))
    const makeT = lang => (key, vars) => fill((DICTS[lang] && DICTS[lang][key]) ?? en[key] ?? key, vars)

    // ---------- 风格 ----------
    const CHINA_ZONES = ['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Harbin', 'Asia/Urumqi', 'Asia/Hong_Kong', 'Asia/Macau', 'Asia/Taipei']
    // 八种文明风格：古希腊、中国古代、古巴比伦、古印度、古埃及、古罗马、玛雅、印加
    const STYLE_IDS = ['greek', 'chinese', 'babylonian', 'indian', 'egyptian', 'roman', 'maya', 'inca']
    const CULTURE_STYLE = { greece: 'greek', china: 'chinese', babylon: 'babylonian', india: 'indian', egypt: 'egyptian', rome: 'roman', maya: 'maya', inca: 'inca' }
    function regionStyle() {
      try { return CULTURE_STYLE[regionCulture()] || 'greek' } catch { return 'greek' }
    }
    function regionCulture() {
      let tz = ''
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch {}
      const lg = (navigator.language || '').toLowerCase()
      if (CHINA_ZONES.includes(tz) || /^zh|^ja|^ko/.test(lg)) return 'china'
      if (/^Asia\/(Kolkata|Calcutta|Colombo|Kathmandu|Dhaka|Karachi)/.test(tz) || /^hi|^bn|^ta|^te|^mr|^ur/.test(lg)) return 'india'
      if (/^Asia\/(Baghdad|Tehran|Riyadh|Dubai|Kuwait|Qatar|Bahrain|Muscat|Amman|Damascus|Beirut|Jerusalem)/.test(tz) || /^fa|^ar-(iq|sy|jo|lb|sa|ae|kw|qa|om|bh)/.test(lg)) return 'babylon'
      if (/^Africa\/(Cairo|Khartoum|Tripoli|Tunis|Algiers|Casablanca)/.test(tz) || /^ar/.test(lg)) return 'egypt'
      if (/^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Tijuana|Chihuahua|Mazatlan|Hermosillo|Guatemala|Belize|El_Salvador|Tegucigalpa|Managua|Costa_Rica|Panama)/.test(tz)) return 'maya'
      if (/^America\/(Bogota|Lima|La_Paz|Quito|Santiago|Guayaquil|Cusco|Asuncion|Montevideo|Argentina|Buenos_Aires)/.test(tz) || /^qu|^ay/.test(lg)) return 'inca'
      if (/^Europe\/(Rome|Madrid|Paris|Lisbon|Bucharest|Brussels)/.test(tz) || /^America\//.test(tz) || /^(it|es|fr|pt|ro|la)/.test(lg)) return 'rome'
      return 'greece'
    }

    // 六大古国经典名言（精简素材库，远小于 1MB；当复盘文件未包含 maxim 时按卡片维度与所在地区文化自动匹配，保证至少 50% 为最近古文化）
    const MAXIM_BANK = {
      china: [
        { d: 'H1.1', text: '凡事预则立，不预则废。', from: '中国 · 《礼记·中庸》', enText: 'In all things, preparation brings success; without it, things fall apart.', enFrom: 'Ancient China · Book of Rites' },
        { d: 'H1.2', text: '天下难事，必作于易；天下大事，必作于细。', from: '中国 · 《道德经》', enText: 'Difficult things in the world begin from what is easy; great things begin from what is small.', enFrom: 'Ancient China · Tao Te Ching' },
        { d: 'H1.3', text: '辞达而已矣。', from: '中国 · 《论语·卫灵公》', enText: 'In words, it is enough that they convey the meaning.', enFrom: 'Ancient China · The Analects' },
        { d: 'H1.3', text: '工欲善其事，必先利其器。', from: '中国 · 《论语·卫灵公》', enText: 'A craftsman who wishes to do good work first sharpens his tools.', enFrom: 'Ancient China · The Analects' },
        { d: 'H1.4', text: '大匠诲人，必以规矩。', from: '中国 · 《孟子·告子上》', enText: 'A master craftsman teaches others by compass and square.', enFrom: 'Ancient China · Mencius' },
        { d: 'H1.4', text: '一张一弛，文武之道也。', from: '中国 · 《礼记·杂记下》', enText: 'Now taut, now relaxed — such is the way of Wen and Wu.', enFrom: 'Ancient China · Book of Rites' },
        { d: 'H2.1', text: '博学之，审问之，慎思之，明辨之。', from: '中国 · 《礼记·中庸》', enText: 'Study widely, question closely, think carefully, discern clearly.', enFrom: 'Ancient China · Book of Rites' },
        { d: 'H2.2', text: '尽信《书》，则不如无《书》。', from: '中国 · 《孟子·尽心下》', enText: 'To believe the book in every word is worse than having no book at all.', enFrom: 'Ancient China · Mencius' },
        { d: 'H2.2', text: '多闻阙疑，慎言其余。', from: '中国 · 《论语·为政》', enText: 'Hear much, set aside what is doubtful, and speak cautiously of the rest.', enFrom: 'Ancient China · The Analects' },
        { d: 'H2.3', text: '如切如磋，如琢如磨。', from: '中国 · 《诗经·卫风·淇奥》', enText: 'Like bone cut and smoothed, like jade carved and polished.', enFrom: 'Ancient China · Book of Odes' },
        { d: 'H2.4', text: '慎终如始，则无败事。', from: '中国 · 《道德经》', enText: 'Be as careful at the end as at the beginning, and nothing will go awry.', enFrom: 'Ancient China · Tao Te Ching' },
        { d: 'H3.3', text: '君子生非异也，善假于物也。', from: '中国 · 《荀子·劝学》', enText: 'The wise are no different by birth; they are skilled at borrowing the strength of things.', enFrom: 'Ancient China · Xunzi' },
        { d: 'H3.4', text: '物物而不物于物。', from: '中国 · 《庄子·山木》', enText: 'Make use of things, without being used by things.', enFrom: 'Ancient China · Zhuangzi' },
        { d: 'H4', text: '温故而知新，可以为师矣。', from: '中国 · 《论语·为政》', enText: 'Reviewing the old and learning the new — in this one finds a teacher.', enFrom: 'Ancient China · The Analects' },
        { d: 'A1', text: '君子和而不同。', from: '中国 · 《论语·子路》', enText: 'The noble harmonize without merely echoing.', enFrom: 'Ancient China · The Analects' },
        { d: 'A2', text: '知人者智，自知者明。', from: '中国 · 《道德经》', enText: 'Knowing others is wisdom; knowing oneself is clarity.', enFrom: 'Ancient China · Tao Te Ching' },
      ],
      greece: [
        { d: 'H1', text: '认识你自己。', from: '古希腊 · 德尔斐箴言', enText: 'Know thyself.', enFrom: 'Hellas · Delphic Maxim' },
        { d: 'H1.1', text: '良好的开端，乃是事情的一半。', from: '古希腊 · 柏拉图《法律篇》', enText: 'The beginning is half of the whole.', enFrom: 'Hellas · Plato, Laws' },
        { d: 'H2.2', text: '眼睛是比耳朵更准确的见证人。', from: '古希腊 · 赫拉克利特《残篇》', enText: 'Eyes are more accurate witnesses than ears.', enFrom: 'Hellas · Heraclitus, Fragments' },
        { d: 'H2.3', text: '凡事皆有度。', from: '古希腊 · 德尔斐箴言', enText: 'Measure in all things.', enFrom: 'Hellas · Delphic Maxim' },
        { d: 'A1', text: '能听进不同声音的人，方显明智。', from: '古希腊 · 欧里庇得斯', enText: 'Wise is the one who listens to more than one voice.', enFrom: 'Hellas · Euripides' },
        { d: 'A2', text: '常怀省察之心，方知所行之路。', from: '古希腊 · 苏格拉底（《申辩篇》）', enText: 'An examined life illuminates the path ahead.', enFrom: 'Hellas · Socrates, Apology' },
      ],
      rome: [
        { d: 'H1.1', text: '不知道驶向哪个港口的人，吹什么风都不顺。', from: '古罗马 · 塞涅卡《道德书简》', enText: 'If one does not know to which port one is sailing, no wind is favorable.', enFrom: 'Ancient Rome · Seneca, Letters' },
        { d: 'H1.4', text: '从容赶路。', from: '古罗马 · 奥古斯都箴言', enText: 'Make haste slowly.', enFrom: 'Ancient Rome · Augustus (Festina lente)' },
        { d: 'H2.2', text: '兼听双方之言。', from: '古罗马 · 塞涅卡《美狄亚》', enText: 'Hear the other side as well.', enFrom: 'Ancient Rome · Seneca, Medea' },
        { d: 'H3', text: '人随时可以退回自己的内心，那里最是安静。', from: '古罗马 · 马可·奥勒留《沉思录》', enText: 'Nowhere can one find a quieter retreat than in one’s own soul.', enFrom: 'Ancient Rome · Marcus Aurelius, Meditations' },
        { d: 'A1', text: '坦率的真话，胜过顺耳的赞美。', from: '古罗马 · 西塞罗《论友谊》', enText: 'Candid truth serves better than sweet flattery.', enFrom: 'Ancient Rome · Cicero, On Friendship' },
        { d: 'A2', text: '先分辨哪些事由自己做主，哪些事不由自己做主。', from: '古罗马 · 爱比克泰德《手册》', enText: 'Some things are up to us, and some things are not.', enFrom: 'Ancient Rome · Epictetus, Enchiridion' },
      ],
      egypt: [
        { d: 'H1.3', text: '好的言辞比绿宝石更难寻，却也能在磨石旁找到。', from: '古埃及 · 《普塔霍特普箴言》', enText: 'Good speech is more hidden than emerald, yet it may be found by the grindstones.', enFrom: 'Ancient Egypt · Maxims of Ptahhotep' },
        { d: 'H2.1', text: '静心倾听的人，能走进话语深处。', from: '古埃及 · 《普塔霍特普箴言》', enText: 'He who listens well enters into the heart of speech.', enFrom: 'Ancient Egypt · Maxims of Ptahhotep' },
        { d: 'H2.4', text: '掌舵之人，目光常在水流前方。', from: '古埃及 · 《阿蒙涅莫普教诲》', enText: 'The pilot keeps his eyes upon the waters ahead.', enFrom: 'Ancient Egypt · Instruction of Amenemope' },
        { d: 'A1', text: '心若如天平，便不会因轻重之言而倾斜。', from: '古埃及 · 《阿蒙涅莫普教诲》', enText: 'Let your heart be steady as the balance scales.', enFrom: 'Ancient Egypt · Instruction of Amenemope' },
        { d: 'A2', text: '对未曾亲眼核实的事，且留一分审慎。', from: '古埃及 · 《阿尼教诲》', enText: 'Keep a measure of caution for what you have not yet seen.', enFrom: 'Ancient Egypt · Instruction of Ani' },
      ],
      babylon: [
        { d: 'H1.2', text: '三股拧成的绳子，不易折断。', from: '古巴比伦 · 《吉尔伽美什史诗》', enText: 'A three-ply cord is not easily broken.', enFrom: 'Ancient Babylon · Epic of Gilgamesh' },
        { d: 'H1.4', text: '早早动身的人，会在日落前看清道路。', from: '古巴比伦 · 《苏美尔谚语》', enText: 'He who sets out early sees the road clearly before dusk.', enFrom: 'Ancient Mesopotamia · Sumerian Proverbs' },
        { d: 'H2.2', text: '未经称量的银子，还不算定数。', from: '古巴比伦 · 《苏美尔谚语》', enText: 'Silver unweighed is not yet a settled account.', enFrom: 'Ancient Mesopotamia · Sumerian Proverbs' },
        { d: 'H2.3', text: '泥板未干之前，字迹随时可以重修。', from: '古巴比伦 · 《苏美尔谚语》', enText: 'While the clay tablet is still moist, the script can be reshaped.', enFrom: 'Ancient Mesopotamia · Sumerian Proverbs' },
        { d: 'A', text: '言语如火，看清风向再添柴。', from: '古巴比伦 · 《阿希卡尔箴言》', enText: 'Words are like fire; know the wind before adding wood.', enFrom: 'Ancient Mesopotamia · Words of Ahiqar' },
      ],
      india: [
        { d: 'H1.1', text: '人心中怀着怎样的志向，便会走向怎样的行动。', from: '古印度 · 《奥义书》', enText: 'As is one’s deep resolve, so becomes one’s deed.', enFrom: 'Ancient India · Upanishads' },
        { d: 'H1.4', text: '专注于眼前的行动，心便安定。', from: '古印度 · 《薄伽梵歌》', enText: 'Set your heart upon the work at hand, and the mind stays steady.', enFrom: 'Ancient India · Bhagavad Gita' },
        { d: 'H2.2', text: '如金匠试金：先炼、先切、先磨，而后采信。', from: '古印度 · 《古印哲箴言》', enText: 'As a goldsmith tests gold by fire, cutting, and rubbing, so examine words before accepting them.', enFrom: 'Ancient India · Classical Maxim' },
        { d: 'H3.4', text: '智慧如缰绳，心意如骏马，御者清醒方能致远。', from: '古印度 · 《卡塔奥义书》', enText: 'Know the self as the rider, the intellect as the charioteer, and the mind as the reins.', enFrom: 'Ancient India · Katha Upanishad' },
        { d: 'A', text: '良匠制箭，使其笔直；智者调心，使其清明。', from: '古印度 · 《法句经》', enText: 'Fletchers straighten arrows; the wise steady their own minds.', enFrom: 'Ancient India · Dhammapada' },
      ],
      maya: [
        { d: 'H1.1', text: '愿所有人都站起来，不让一个人落在后面。', from: '玛雅 · 《波波尔·乌》', enText: 'Let all rise up, let no one be left behind.', enFrom: 'Maya · Popol Vuh' },
        { d: 'H2.1', text: '他们的目光看得很远，他们认识了世间的一切。', from: '玛雅 · 《波波尔·乌》', enText: 'Their sight reached far; they came to know all that is in the world.', enFrom: 'Maya · Popol Vuh' },
        { d: 'H4', text: '我们真心感谢你们，两次、三次地感谢！', from: '玛雅 · 《波波尔·乌》', enText: 'Truly we thank you, twice, three times!', enFrom: 'Maya · Popol Vuh' },
        { d: 'A2', text: '所有的月、所有的年、所有的日、所有的风，都在行走，也终将过去。', from: '玛雅 · 《楚马耶尔的奇兰·巴兰》', enText: 'Every moon, every year, every day, every wind walks on and passes away.', enFrom: 'Maya · Chilam Balam of Chumayel' },
      ],
      inca: [
        { d: 'H1.1', text: '莫偷盗，莫说谎，莫懒惰。', from: '古印加 · 三戒（Ama sua, ama llulla, ama quella）', enText: 'Do not steal, do not lie, do not be lazy.', enFrom: 'Inca · Triad (Ama sua, ama llulla, ama quella)' },
        { d: 'A1', text: '你在哪里？在上方，在下方，还是在四周？', from: '古印加 · 《维拉科查颂歌》', enText: 'Where are you? Above? Below? Or all around?', enFrom: 'Inca · Hymn to Viracocha' },
        { d: 'A', text: '今天我帮你，明天你帮我。', from: '安第斯 · 互惠传统（Ayni）', enText: 'Today for you, tomorrow for me.', enFrom: 'Andes · Tradition of ayni' },
      ],
    }

    function pickMaxim(m, idx, seed, region, lang) {
      if (m && m.maxim && typeof m.maxim.text === 'string' && m.maxim.text.trim()) {
        return { text: m.maxim.text.trim(), from: typeof m.maxim.from === 'string' ? m.maxim.from.trim() : '' }
      }
      const home = MAXIM_BANK[region] ? region : (lang === 'zh' ? 'china' : 'greece')
      const others = Object.keys(MAXIM_BANK).filter(k => k !== home)
      const raw = `${seed || ''}#${idx || 0}#${(m && m.dimension) || ''}#${(m && m.title) || ''}`
      let h = 2166136261
      for (let i = 0; i < raw.length; i++) h = Math.imul(h ^ raw.charCodeAt(i), 16777619) >>> 0
      const useHome = ((idx || 0) % 2 === 0) || (h % 4 === 0)
      const culture = useHome ? home : others[(h >>> 3) % others.length]
      const bank = MAXIM_BANK[culture] || MAXIM_BANK.china
      const code = (/^[A-Z]\d+(\.\d+)?/.exec(String((m && m.dimension) || '').trim()) || [''])[0]
      const shortCode = code.slice(0, 2)
      const domCode = code.slice(0, 1)
      const exact = code ? bank.filter(x => x.d === code) : []
      const mid = !exact.length && shortCode ? bank.filter(x => x.d === shortCode || x.d.startsWith(shortCode)) : []
      const broad = !exact.length && !mid.length && domCode ? bank.filter(x => x.d.startsWith(domCode)) : []
      const pool = exact.length ? exact : mid.length ? mid : broad.length ? broad : bank
      const item = pool[(h >>> 5) % pool.length]
      const isZh = lang === 'zh'
      return { text: isZh ? item.text : item.enText, from: isZh ? item.from : item.enFrom }
    }

    // ---------- Token 消耗与本地货币费用预估（零网络请求） ----------
    function detectCurrency() {
      let tz = ''
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch {}
      const lg = (navigator.language || '').toLowerCase()
      if (['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Harbin', 'Asia/Urumqi'].includes(tz) || /^zh(-cn|-hans)?$/.test(lg)) return { code: 'CNY', sym: '¥', rate: 7.2, zeroDec: false }
      if (tz === 'Asia/Hong_Kong' || lg === 'zh-hk') return { code: 'HKD', sym: 'HK$', rate: 7.8, zeroDec: false }
      if (tz === 'Asia/Taipei' || /^zh-(tw|hant)/.test(lg)) return { code: 'TWD', sym: 'NT$', rate: 32.0, zeroDec: false }
      if (tz === 'Asia/Macau' || lg === 'zh-mo') return { code: 'MOP', sym: 'MOP$', rate: 8.0, zeroDec: false }
      if (tz === 'Asia/Tokyo' || lg.startsWith('ja')) return { code: 'JPY', sym: '¥', rate: 152, zeroDec: true }
      if (tz === 'Asia/Seoul' || lg.startsWith('ko')) return { code: 'KRW', sym: '₩', rate: 1380, zeroDec: true }
      if (tz === 'Asia/Singapore' || lg.endsWith('-sg')) return { code: 'SGD', sym: 'S$', rate: 1.34, zeroDec: false }
      if (/^Asia\/(Kolkata|Calcutta)/.test(tz) || lg.startsWith('hi') || lg === 'en-in') return { code: 'INR', sym: '₹', rate: 84, zeroDec: false }
      if (tz === 'Europe/London' || lg === 'en-gb') return { code: 'GBP', sym: '£', rate: 0.78, zeroDec: false }
      if (/^Europe\/(Paris|Berlin|Madrid|Rome|Amsterdam|Brussels|Vienna|Dublin|Lisbon|Helsinki|Athens)/.test(tz) || /^(de|fr|es-es|it|nl|pt-pt)/.test(lg)) return { code: 'EUR', sym: '€', rate: 0.92, zeroDec: false }
      if (tz === 'Europe/Moscow' || lg.startsWith('ru')) return { code: 'RUB', sym: '₽', rate: 96, zeroDec: false }
      if (/^America\/(Toronto|Vancouver|Montreal)/.test(tz) || lg.endsWith('-ca')) return { code: 'CAD', sym: 'CA$', rate: 1.39, zeroDec: false }
      if (tz.startsWith('Australia/') || lg === 'en-au') return { code: 'AUD', sym: 'A$', rate: 1.52, zeroDec: false }
      if (tz === 'America/Sao_Paulo' || lg === 'pt-br') return { code: 'BRL', sym: 'R$', rate: 5.7, zeroDec: false }
      if (lg.startsWith('zh')) return { code: 'CNY', sym: '¥', rate: 7.2, zeroDec: false }
      return { code: 'USD', sym: '$', rate: 1.0, zeroDec: false }
    }

    function modelPrice(modelId) {
      const m = String(modelId || '').toLowerCase()
      if (m.includes('deepseek')) {
        if (m.includes('pro')) return { cny: { in: 3.0, out: 6.0, cache: 0.025 }, usd: { in: 0.435, out: 0.87, cache: 0.003625 } }
        if (m.includes('reasoner') || m.includes('r1')) return { cny: { in: 4.0, out: 16.0, cache: 1.0 }, usd: { in: 0.55, out: 2.19, cache: 0.14 } }
        if (m.includes('flash')) return { cny: { in: 1.0, out: 2.0, cache: 0.02 }, usd: { in: 0.14, out: 0.28, cache: 0.0028 } }
        return { cny: { in: 2.0, out: 8.0, cache: 0.5 }, usd: { in: 0.27, out: 1.10, cache: 0.07 } }
      }
      if (m.includes('claude')) {
        if (m.includes('opus')) return { usd: { in: 15, out: 75, cache: 1.5 } }
        if (m.includes('haiku')) return { usd: { in: 0.8, out: 4, cache: 0.08 } }
        return { usd: { in: 3, out: 15, cache: 0.3 } }
      }
      if (m.includes('gpt-4o-mini') || m.includes('gpt-4.1-mini') || m.includes('gpt-4.1-nano')) return { usd: { in: 0.4, out: 1.6, cache: 0.1 } }
      if (m.includes('gpt-4') || m.includes('gpt-5')) return { usd: { in: 2.0, out: 8.0, cache: 0.5 } }
      if (/\bo[134]-mini\b/.test(m)) return { usd: { in: 1.1, out: 4.4, cache: 0.275 } }
      if (/\bo[13]\b/.test(m)) return { usd: { in: 10, out: 40, cache: 2.5 } }
      if (m.includes('gemini')) return m.includes('flash') ? { usd: { in: 0.15, out: 0.6, cache: 0.04 } } : { usd: { in: 1.25, out: 10, cache: 0.31 } }
      if (m.includes('qwen-max')) return { cny: { in: 2.4, out: 9.6, cache: 0.5 }, usd: { in: 0.35, out: 1.4, cache: 0.07 } }
      if (/(qwen|glm|kimi|moonshot|doubao|minimax)/.test(m)) return { cny: { in: 1.0, out: 3.0, cache: 0.2 }, usd: { in: 0.15, out: 0.45, cache: 0.03 } }
      return { cny: { in: 1.5, out: 3.0, cache: 0.2 }, usd: { in: 0.2, out: 0.4, cache: 0.03 } }
    }

    function approxTokensClient(s) {
      const str = String(s || '')
      let cjk = 0
      for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) > 0x2e80) cjk++
      return Math.max(1, Math.round(cjk * 0.65 + (str.length - cjk) * 0.28))
    }

    function resolveUsage(review) {
      const u = review && review.meta && review.meta.usage
      if (u && Number(u.totalTokens) > 0) return u
      const msgs = (review && review.meta && review.meta.stats && review.meta.stats.userMessages) || 12
      const estIn = Math.min(28000, 4800 + msgs * 92)
      const estOut = approxTokensClient(JSON.stringify({ ...review, meta: undefined }))
      return { inputTokens: estIn, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: estOut, totalTokens: estIn + estOut, estimated: true }
    }

    function formatUsageCost(review, t) {
      const meta = (review && review.meta) || {}
      const model = meta.by || 'deepseek-flash'
      const u = resolveUsage(review)
      const inUncached = (Number(u.inputTokens) || 0) + (Number(u.cacheWriteTokens) || 0)
      const cacheRead = Number(u.cacheReadTokens) || 0
      const inTotal = inUncached + cacheRead
      const outTotal = Number(u.outputTokens) || 0
      const total = Number(u.totalTokens) || (inTotal + outTotal)
      const cur = detectCurrency()
      const p = modelPrice(model)
      const amount = (cur.code === 'CNY' && p.cny)
        ? (inUncached * p.cny.in + cacheRead * p.cny.cache + outTotal * p.cny.out) / 1e6
        : ((inUncached * p.usd.in + cacheRead * p.usd.cache + outTotal * p.usd.out) / 1e6) * cur.rate
      let numStr
      if (cur.zeroDec) numStr = amount < 1 ? amount.toFixed(2) : Math.round(amount).toLocaleString()
      else numStr = amount < 0.01 ? amount.toFixed(4) : amount < 0.1 ? amount.toFixed(3) : amount.toFixed(2)
      return t(u.estimated ? 'usageEst' : 'usageExact', {
        total: total.toLocaleString(),
        in: inTotal.toLocaleString(),
        out: outTotal.toLocaleString(),
        model,
        cost: `${cur.sym}${numStr}`,
        code: cur.code,
      })
    }
    const OTHER = { greek: 'chinese', chinese: 'greek', babylonian: 'egyptian', egyptian: 'babylonian', indian: 'chinese', roman: 'greek', maya: 'inca', inca: 'maya' }
    // 编号：希腊字母数字、中文大写、楔形刻痕、天城体数字、象形计数竖线、罗马数字、玛雅点杠、印加罗马数
    const NUMERALS = {
      greek: ['Αʹ', 'Βʹ', 'Γʹ', 'Δʹ', 'Εʹ', 'Ϛʹ', 'Ζʹ', 'Ηʹ'],
      chinese: ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌'],
      babylonian: ['▾', '▾▾', '▾▾▾', '▾▾▾▾', '▾▾▾▾▾', '▾▾▾▾▾▾', '▾▾▾▾▾▾▾', '▾▾▾▾▾▾▾▾'],
      indian: ['१', '२', '३', '४', '५', '६', '७', '८'],
      egyptian: ['❘', '❘❘', '❘❘❘', '❘❘❘❘', '❘❘❘❘❘', '❘❘❘❘❘❘', '❘❘❘❘❘❘❘', '❘❘❘❘❘❘❘❘'],
      roman: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ'],
      maya: ['•', '••', '•••', '••••', '—', '—•', '—••', '—•••'],
      inca: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ'],
    }
    // 各地区的自称（发起人倾向用自称，例如用 Hellas 而不是 Greece）
    const STYLE_ENDONYM = { greek: 'Hellas · Ἑλλάς', chinese: 'Huáxià · 华夏', babylonian: 'Bābili', indian: 'Bhārata · भारत', egyptian: 'Kemet', roman: 'Rōma', maya: 'Mayab · Maaya\'', inca: 'Inka · Tawantinsuyu' }
    const ORNAMENT = { greek: '❦', chinese: '◈', babylonian: '✶', indian: '❁', egyptian: '☥', roman: '❖', maya: '✦', inca: '☼' }
    // 徽记：中国古代是印章（写"复盘"），其余是各自的符号
    const EMBLEM_GLYPH = { greek: 'Μ', babylonian: '✶', indian: '❁', egyptian: '☥', roman: 'M', maya: '✦', inca: '☼' }
    const WAX_GLYPH = { greek: 'Ψ', chinese: '心', babylonian: '✶', indian: '❁', egyptian: '☥', roman: 'M', maya: '✦', inca: '☼' }
    // 时辰盘与导出图用的主色（浅色 / 深色）
    const STYLE_AC = {
      greek: ['#3a6a9a', '#8fb0d2'], chinese: ['#b4392a', '#d99a8c'], babylonian: ['#2b4a94', '#9db6ec'],
      indian: ['#b8531a', '#f0a774'], egyptian: ['#946410', '#e6bd66'], roman: ['#8b2135', '#e8909f'],
      maya: ['#1b7a5a', '#62cba3'], inca: ['#9c2e28', '#f2857e'],
    }

    const svgUrl = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

    // 配色：浅色是默认；DSH 在深色模式（包括"自动"判断为深色时）给 body 加 data-ds-dark-theme。
    // 深色里降低饱和度、去掉发光和大面积纯色，避免刺眼。
    // 明信片样式只有这一份：页面预览、长图、HTML 导出共用
    const POSTCARD_CSS = `
.mel-postcard { width:1080px; position:relative; overflow:hidden; box-sizing:border-box; border-radius:32px; color:var(--ink); background:var(--paper); font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans','Segoe UI','Microsoft YaHei',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.mel-postcard *, .mel-postcard *::before, .mel-postcard *::after { box-sizing:border-box; }
.mel-postcard[data-style="greek"] { --ac:#2f5f8f; --ac2:#b0683e; --gold:#b8913f; --serif:'Iowan Old Style','Palatino','Georgia','Songti SC','Noto Serif CJK SC',serif; }
.mel-postcard[data-style="chinese"] { --ac:#b4392a; --ac2:#2d6f7e; --gold:#a8843c; --serif:'Songti SC','STSong','Noto Serif CJK SC','Kaiti SC',serif; }
.mel-postcard[data-theme="light"] { --ink:#1f1d1a; --sub:#5f5a52; --faint:#968f83; --line:rgba(70,50,20,.16); --card:rgba(255,255,255,.55); --dA:#2f7a74; }
.mel-postcard[data-theme="light"][data-style="greek"] { --paper:#f6f1e6; --sky1:#d4e3ef; --sky2:#ebeff0; --sky3:#f6f1e6; }
.mel-postcard[data-theme="light"][data-style="chinese"] { --paper:#f5ecdb; --sky1:#eadcc2; --sky2:#f1e6d1; --sky3:#f5ecdb; }
.mel-postcard[data-theme="dark"] { --ink:#f4efe6; --sub:#d2cabd; --faint:#aaa294; --line:rgba(255,255,255,.16); --card:rgba(255,255,255,.06); --dA:#94d0c7; }
.mel-postcard[data-theme="dark"][data-style="greek"] { --ac:#9dc0e6; --ac2:#e0a27c; --gold:#e3c27a; --paper:#10141d; --sky1:#060a14; --sky2:#0d1424; --sky3:#10141d; }
.mel-postcard[data-theme="dark"][data-style="chinese"] { --ac:#e8a294; --ac2:#93c7cf; --gold:#e0bf7c; --paper:#14110e; --sky1:#090807; --sky2:#13100d; --sky3:#14110e; }

.mel-postcard[data-style="babylonian"] { --ac:#2b4a94; --ac2:#b8862b; --gold:#c09434; --serif:'Iowan Old Style','Palatino','Georgia','Songti SC','Noto Serif CJK SC',serif; }
.mel-postcard[data-theme="light"][data-style="babylonian"] { --paper:#f4ecda; --sky1:#dcc9a2; --sky2:#ece0c6; --sky3:#f4ecda; }
.mel-postcard[data-theme="dark"][data-style="babylonian"] { --ac:#a8bff0; --ac2:#e6c27a; --gold:#ebcd86; --paper:#0c0f1d; --sky1:#060814; --sky2:#0c1122; --sky3:#0c0f1d; }
.mel-postcard[data-style="indian"] { --ac:#b0501a; --ac2:#2c7a63; --gold:#c2902e; --serif:'Iowan Old Style','Palatino','Georgia','Kohinoor Devanagari','Songti SC',serif; }
.mel-postcard[data-theme="light"][data-style="indian"] { --paper:#f6ece1; --sky1:#efcdb6; --sky2:#f3e2d3; --sky3:#f6ece1; }
.mel-postcard[data-theme="dark"][data-style="indian"] { --ac:#f3ad7e; --ac2:#86d1ba; --gold:#efc477; --paper:#140d14; --sky1:#0b0610; --sky2:#180e1a; --sky3:#140d14; }
.mel-postcard[data-style="egyptian"] { --ac:#8a5d0e; --ac2:#1f7f79; --gold:#b38a2e; --serif:'Iowan Old Style','Palatino','Georgia','Songti SC','Noto Serif CJK SC',serif; }
.mel-postcard[data-theme="light"][data-style="egyptian"] { --paper:#f6eedb; --sky1:#e9d29c; --sky2:#f1e4c2; --sky3:#f6eedb; }
.mel-postcard[data-theme="dark"][data-style="egyptian"] { --ac:#ecc56f; --ac2:#7bd3ca; --gold:#ecc56f; --paper:#100d08; --sky1:#090704; --sky2:#15110a; --sky3:#100d08; }
.mel-postcard[data-style="roman"] { --ac:#8b2135; --ac2:#8a6a2a; --gold:#b08d3c; --serif:'Baskerville','Iowan Old Style','Palatino','Georgia','Songti SC',serif; }
.mel-postcard[data-theme="light"][data-style="roman"] { --paper:#f6efe9; --sky1:#e6c9ba; --sky2:#f0e2d8; --sky3:#f6efe9; }
.mel-postcard[data-theme="dark"][data-style="roman"] { --ac:#ee98a6; --ac2:#dcc084; --gold:#e3c27a; --paper:#130c0e; --sky1:#0b0608; --sky2:#170d10; --sky3:#130c0e; }
.mel-postcard[data-style="maya"] { --ac:#1b7a5a; --ac2:#c68a2c; --gold:#c68a2c; --serif:'Iowan Old Style','Palatino','Georgia','Songti SC',serif; }
.mel-postcard[data-theme="light"][data-style="maya"] { --paper:#f5f0e6; --sky1:#cde4d8; --sky2:#e5efe8; --sky3:#f5f0e6; }
.mel-postcard[data-theme="dark"][data-style="maya"] { --ac:#62cba3; --ac2:#e5b35c; --gold:#e5b35c; --paper:#0b1410; --sky1:#060d0a; --sky2:#0b1410; --sky3:#0f1a15; }
.mel-postcard[data-style="inca"] { --ac:#9c2e28; --ac2:#c89628; --gold:#d9a532; --serif:'Baskerville','Iowan Old Style','Palatino','Georgia','Songti SC',serif; }
.mel-postcard[data-theme="light"][data-style="inca"] { --paper:#f7efe6; --sky1:#e8cbbe; --sky2:#f3e3db; --sky3:#f7efe6; }
.mel-postcard[data-theme="dark"][data-style="inca"] { --ac:#f2857e; --ac2:#ecc468; --gold:#ecc468; --paper:#140c0b; --sky1:#0d0605; --sky2:#140c0b; --sky3:#1c100e; }

.mel-postcard[data-style="babylonian"] .pc-mark { background:var(--ac); color:var(--paper); border-radius:10px; font-size:30px; }
.mel-postcard[data-style="egyptian"] .pc-mark { width:40px; height:64px; border:3px solid var(--ac); color:var(--ac); border-radius:20px; font-size:28px; }
.mel-postcard[data-style="indian"] .pc-mark { border:5px double var(--ac); color:var(--ac); border-radius:50%; font-size:30px; }
.mel-postcard[data-style="roman"] .pc-mark { border:3px solid var(--ac); color:var(--ac); border-radius:4px; font-size:32px; }
.mel-postcard[data-style="maya"] .pc-mark { border:3px solid var(--ac); color:var(--ac); border-radius:14px; font-size:26px; }
.mel-postcard[data-style="inca"] .pc-mark { border:4px double var(--ac); color:var(--ac); border-radius:8px; font-size:30px; }
.mel-postcard[data-style="babylonian"] .pc-no, .mel-postcard[data-style="egyptian"] .pc-no { letter-spacing:-2px; font-size:24px; }

.mel-postcard .pc-hero { position:relative; height:1240px; padding:92px 92px 0; background:linear-gradient(180deg,var(--sky1) 0%,var(--sky2) 55%,var(--sky3) 100%); overflow:hidden; }
.mel-postcard .pc-glow { position:absolute; inset:0; pointer-events:none; background:radial-gradient(60% 40% at 82% 16%,color-mix(in srgb,var(--gold) 26%,transparent),transparent 70%),radial-gradient(70% 50% at 10% 100%,color-mix(in srgb,var(--ac) 14%,transparent),transparent 70%); }
.mel-postcard .pc-arch { position:absolute; left:0; right:0; bottom:-6px; width:1080px; height:760px; }
.mel-postcard .pc-arch .g { fill:none; stroke-linecap:round; stroke-linejoin:round; stroke-width:2.2; }
.mel-postcard .pc-arch .a1 { stroke:var(--ac); opacity:.82; }
.mel-postcard .pc-arch .a2 { stroke:var(--ac2); opacity:.5; }
.mel-postcard .pc-arch .thin { stroke-width:1.3; }
.mel-postcard .pc-arch .deco { display:none; }
.mel-postcard .pc-orb circle, .mel-postcard .pc-orb path { fill:none; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; }
.mel-postcard .pc-orb .sun circle, .mel-postcard .pc-orb .sun path { stroke:var(--gold); }
.mel-postcard .pc-orb .moon circle, .mel-postcard .pc-orb .moon path { stroke:var(--gold); }
.mel-postcard .pc-orb .halo { opacity:.3; stroke-dasharray:2 6; }
.mel-postcard[data-theme="light"] .pc-orb .moon, .mel-postcard[data-theme="dark"] .pc-orb .sun { display:none; }
.mel-postcard .pc-arch .star { fill:var(--gold); opacity:0; }
.mel-postcard[data-theme="dark"] .pc-arch .star { opacity:.85; }
.mel-postcard .pc-top { position:relative; display:flex; align-items:center; gap:18px; font-size:26px; color:var(--sub); letter-spacing:.08em; }
.mel-postcard .pc-mark { width:56px; height:56px; display:flex; align-items:center; justify-content:center; font-family:var(--serif); flex:none; }
.mel-postcard[data-style="greek"] .pc-mark { border:3px solid var(--ac); color:var(--ac); border-radius:50%; font-size:30px; }
.mel-postcard[data-style="chinese"] .pc-mark { background:var(--ac); color:var(--paper); border-radius:8px; font-size:21px; line-height:1.05; writing-mode:vertical-rl; transform:rotate(-4deg); }
.mel-postcard .pc-word { font-family:var(--serif); font-size:34px; font-weight:600; color:var(--ink); letter-spacing:.04em; }
.mel-postcard .pc-range { margin-left:auto; font-variant-numeric:tabular-nums; }
.mel-postcard .pc-cover { position:relative; margin-top:120px; }
.mel-postcard .pc-kicker { font-size:26px; letter-spacing:.32em; color:var(--ac); margin-bottom:28px; }
.mel-postcard .headline { margin:0; font-family:var(--serif); font-weight:600; font-size:88px; line-height:1.22; letter-spacing:.01em; color:var(--ink); text-wrap:balance; outline:none; }

.mel-postcard .pc-body { position:relative; padding:40px 92px 0; display:flex; flex-direction:column; gap:96px; }
.mel-postcard .pc-h { display:flex; align-items:center; gap:22px; margin-bottom:44px; }
.mel-postcard .pc-no { font-family:var(--serif); font-size:30px; color:var(--ac); min-width:44px; }
.mel-postcard .pc-t { font-size:27px; letter-spacing:.24em; color:var(--sub); white-space:nowrap; font-weight:500; }
.mel-postcard .pc-rule { flex:1; height:2px; background:linear-gradient(90deg,var(--line),transparent); }

.mel-postcard .pc-nums { display:grid; grid-template-columns:repeat(2,1fr); gap:0; border-top:2px solid var(--line); }
.mel-postcard .pc-num { padding:44px 8px 40px; border-bottom:2px solid var(--line); }
.mel-postcard .pc-num:nth-child(odd) { padding-right:40px; border-right:2px solid var(--line); }
.mel-postcard .pc-num:nth-child(even) { padding-left:48px; }
.mel-postcard .pc-num b { display:block; font-family:var(--serif); font-weight:600; font-size:132px; line-height:.95; letter-spacing:-.02em; color:var(--ac); font-variant-numeric:lining-nums tabular-nums; }
.mel-postcard .pc-num span { display:block; margin-top:18px; font-size:30px; color:var(--sub); letter-spacing:.06em; }

.mel-postcard .pc-pracs { display:flex; flex-direction:column; }
.mel-postcard .pc-prac { display:flex; gap:34px; align-items:baseline; padding:34px 0; border-top:2px solid var(--line); }
.mel-postcard .pc-prac:last-child { border-bottom:2px solid var(--line); }
.mel-postcard .pc-prac i { font-style:normal; font-family:var(--serif); font-size:34px; color:var(--ac); min-width:54px; }
.mel-postcard .pc-prac p { margin:0; font-family:var(--serif); font-size:46px; line-height:1.45; }

.mel-postcard .pc-moment { position:relative; margin:0; padding:30px 0 10px 64px; border-left:6px solid var(--ac); font-family:var(--serif); font-size:56px; line-height:1.55; outline:none; }
.mel-postcard .pc-quote { position:absolute; right:-6px; top:-70px; font-family:Georgia,'Times New Roman',serif; font-size:240px; line-height:1; color:color-mix(in srgb,var(--ac) 22%,transparent); pointer-events:none; }

.mel-postcard .pc-split { position:relative; display:grid; grid-template-columns:1fr 1fr; gap:80px; }
.mel-postcard .pc-split::before { content:''; position:absolute; left:50%; top:6px; bottom:6px; width:2px; background:var(--line); }
.mel-postcard .pc-split h4 { margin:0 0 22px; font-size:28px; font-weight:500; letter-spacing:.16em; color:var(--sub); }
.mel-postcard .pc-split .ai h4 { color:var(--dA); }
.mel-postcard .pc-split p { margin:0 0 18px; font-family:var(--serif); font-size:40px; line-height:1.45; }

.mel-postcard .pc-ainote { display:flex; gap:30px; align-items:flex-start; padding:48px 52px; border-radius:30px; background:var(--card); border:2px solid color-mix(in srgb,var(--dA) 40%,transparent); }
.mel-postcard .pc-ainote i { flex:none; width:64px; height:64px; border-radius:50%; border:3px solid var(--dA); color:var(--dA); display:flex; align-items:center; justify-content:center; font-style:normal; font-size:32px; }
.mel-postcard .pc-ainote div { font-size:40px; line-height:1.6; outline:none; }

.mel-postcard .pc-dial { display:flex; gap:56px; align-items:center; }
.mel-postcard .pc-dial svg { flex:none; }
.mel-postcard .pc-dial p { margin:0; font-size:34px; line-height:1.7; color:var(--sub); }
.mel-postcard .pc-dial p b { display:block; font-family:var(--serif); font-size:52px; line-height:1.3; color:var(--ink); }

.mel-postcard .pc-q { position:relative; padding:72px 40px; text-align:center; }
.mel-postcard .pc-q::before, .mel-postcard .pc-q::after { content:''; position:absolute; left:30%; right:30%; height:2px; background:linear-gradient(90deg,transparent,var(--ac),transparent); }
.mel-postcard .pc-q::before { top:0; } .mel-postcard .pc-q::after { bottom:0; }
.mel-postcard .pc-q div { font-family:var(--serif); font-size:58px; line-height:1.5; outline:none; }

.mel-postcard .pc-sign { position:relative; margin-top:110px; padding:0 92px 84px; color:var(--faint); }
.mel-postcard .pc-orn { display:block; margin:0 auto 52px; color:color-mix(in srgb,var(--ac) 55%,transparent); }
.mel-postcard .pc-sign-row { display:flex; align-items:center; gap:20px; font-size:28px; }
.mel-postcard .pc-sign-row .pc-word { font-size:32px; }
.mel-postcard .pc-tag { margin-left:auto; color:var(--ac); letter-spacing:.04em; }
`

    const CSS = `
.mel {
  --font-display: var(--dsw-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  --font-body: var(--dsw-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);

  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 24px;
  --sp-5: 48px;

  --rad-sm: 2px;
  --rad-md: 10px;
  --rad-lg: 16px;
  --rad-full: 999px;

  --dur-fast: 160ms;
  --dur-mid: 240ms;
  --dur-slow: 320ms;
  --ease: cubic-bezier(.2, .8, .2, 1);

  --text-xs: 12px;
  --text-sm: 13.5px;
  --text-base: 16px;
  --text-md: 19px;
  --text-lg: 24px;
  --text-xl: 30px;
  --text-hero: 38px;

  --t1: var(--dsw-alias-label-primary, #24221f);
  --t2: var(--dsw-alias-label-secondary, #5d5a54);
  --t3: var(--dsw-alias-label-tertiary, #8b877f);
  --base: var(--dsw-alias-bg-base, #fff);
  --line: var(--dsw-alias-border-l2, rgba(127,127,127,.22));
  --border-subtle: color-mix(in srgb, var(--line) 35%, transparent);
  --on-ac: #fff;
  --shadow: 0 4px 24px rgba(60, 40, 10, 0.04);

  --dH: var(--ac);
  --dA: #2f7a74;
  --dS: #8a6a2a;
  --dI: #8a4a6e;

  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  color: var(--t1);
  font-family: var(--font-body);
  background: var(--page);
  background-image: radial-gradient(ellipse at 50% -10%, var(--glow) 0, transparent 60%);
}

.mel[data-style=greek] {
  --ac: #3a6a9a;
  --ac2: #a55a35;
  --page: color-mix(in srgb, var(--base) 94%, #e9dfc8);
  --paper: color-mix(in srgb, var(--base) 90%, #f3ead6);
  --glow: color-mix(in srgb, #3a6a9a 10%, transparent);
}

.mel[data-style=chinese] {
  --ac: #b4392a;
  --ac2: #2d6f7e;
  --page: color-mix(in srgb, var(--base) 94%, #ead9bd);
  --paper: color-mix(in srgb, var(--base) 89%, #f2e6cf);
  --glow: color-mix(in srgb, #b4392a 9%, transparent);
}

body[data-ds-dark-theme] .mel {
  --on-ac: #1b1a18;
  --shadow: none;
  --glow: transparent;
  --dA: #86b9b2;
  --dS: #c9b07c;
  --dI: #c49ab4;
  --page: var(--base);
  --paper: color-mix(in srgb, var(--base) 93%, #c8bba0);
  --border-subtle: rgba(255, 255, 255, 0.08);
}

body[data-ds-dark-theme] .mel[data-style=greek] {
  --ac: #8fb0d2;
  --ac2: #d3a07f;
}

body[data-ds-dark-theme] .mel[data-style=chinese] {
  --ac: #d99a8c;
  --ac2: #8fc0c8;
}

.mel[data-style=babylonian] {
  --ac: #2b4a94;
  --ac2: #b8862b;
  --page: color-mix(in srgb, var(--base) 94%, #e6d5b0);
  --paper: color-mix(in srgb, var(--base) 89%, #efe2c2);
  --glow: color-mix(in srgb, #2b4a94 9%, transparent);
}

body[data-ds-dark-theme] .mel[data-style=babylonian] {
  --ac: #9db6ec;
  --ac2: #e2bf6e;
}

.mel[data-style=indian] {
  --ac: #b8531a;
  --ac2: #2c7a63;
  --page: color-mix(in srgb, var(--base) 94%, #efd3bf);
  --paper: color-mix(in srgb, var(--base) 89%, #f4e1d0);
  --glow: color-mix(in srgb, #b8531a 9%, transparent);
}

body[data-ds-dark-theme] .mel[data-style=indian] {
  --ac: #f0a774;
  --ac2: #7fcbb3;
}

.mel[data-style=egyptian] {
  --ac: #946410;
  --ac2: #1f7f79;
  --page: color-mix(in srgb, var(--base) 94%, #ecd9a8);
  --paper: color-mix(in srgb, var(--base) 89%, #f2e5c0);
  --glow: color-mix(in srgb, #946410 9%, transparent);
}

body[data-ds-dark-theme] .mel[data-style=egyptian] {
  --ac: #e6bd66;
  --ac2: #72cfc6;
}

.mel[data-style=roman] {
  --ac: #8b2135;
  --ac2: #8a6a2a;
  --page: color-mix(in srgb, var(--base) 94%, #e9d2c6);
  --paper: color-mix(in srgb, var(--base) 89%, #f1e0d6);
  --glow: color-mix(in srgb, #8b2135 9%, transparent);
}

body[data-ds-dark-theme] .mel[data-style=roman] {
  --ac: #e8909f;
  --ac2: #d8bb7c;
}

.mel[data-style=maya] {
  --ac: #1b7a5a;
  --ac2: #c68a2c;
  --page: color-mix(in srgb, var(--base) 94%, #d8ebd7);
  --paper: color-mix(in srgb, var(--base) 89%, #e2f1e2);
  --glow: color-mix(in srgb, #1b7a5a 9%, transparent);
}

body[data-ds-dark-theme] .mel[data-style=maya] {
  --ac: #62cba3;
  --ac2: #e5b35c;
}

.mel[data-style=inca] {
  --ac: #9c2e28;
  --ac2: #c89628;
  --page: color-mix(in srgb, var(--base) 94%, #f1d7cc);
  --paper: color-mix(in srgb, var(--base) 89%, #f7e2d8);
  --glow: color-mix(in srgb, #9c2e28 9%, transparent);
}

body[data-ds-dark-theme] .mel[data-style=inca] {
  --ac: #f2857e;
  --ac2: #ecc468;
}

/* 焦点环控制 */
.mel button:focus-visible,
.mel input:focus-visible,
.mel textarea:focus-visible,
.mel select:focus-visible,
.mel [tabindex="0"]:focus-visible {
  outline: 2px solid var(--ac);
  outline-offset: 2px;
}

/* 整体容器与顶栏 */
.mel-wrap {
  max-width: 820px;
  margin: 0 auto;
  box-sizing: border-box;
  min-width: 0;
  padding: calc(var(--dsh-frame-top-clearance, 48px) + var(--sp-2)) var(--sp-4) var(--sp-4);
}

.mel-wrap.mel-wrap-home {
  max-width: 1400px;
  width: 100%;
}

/* 导航：每一页都在页面顶部同一个位置（与主页左栏对齐），切换页面时不再移位 */
.mel-navbar {
  position: relative; z-index: 1;
  max-width: 1400px; width: 100%; margin: 0 auto; box-sizing: border-box;
  padding: calc(var(--dsh-frame-top-clearance, 48px) + var(--sp-2)) var(--sp-4) 0;
}
.mel-navbar .mel-top { margin-bottom: 0; }
.mel-navbar + .mel-wrap { padding-top: var(--sp-3); }

.mel-top {
  display: flex;
  justify-content: flex-start;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
  flex-wrap: wrap;
}

.mel-tab {
  font: inherit;
  font-size: var(--text-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--t2);
  padding: 5px 14px;
  border-radius: var(--rad-full);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease);
}

.mel-tab:hover {
  color: var(--t1);
  background: color-mix(in srgb, var(--ac) 8%, transparent);
}

.mel-tab[aria-pressed=true] {
  color: var(--ac);
  border-color: color-mix(in srgb, var(--ac) 45%, transparent);
  font-weight: 500;
}

/* 题头与印章徽章 */
.mel-hero {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin: var(--sp-2) 0 var(--sp-4);
}

.mel-hero h1 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(28px, 4vw, var(--text-hero));
  line-height: 1.15;
  margin: 0;
  letter-spacing: 0.02em;
}

.mel-hero h1 span {
  color: var(--ac);
  margin-left: 0.25em;
  font-weight: 500;
}

.mel-hero p {
  margin: var(--sp-2) 0 0;
  color: var(--t2);
  line-height: 1.7;
  font-size: 14.5px;
  max-width: 520px;
}

.mel-medal[data-glyph=babylonian] { border-radius: 10px; font-size: 30px; }
.mel-medal[data-glyph=egyptian] { width: 44px; height: 70px; border-radius: 22px; font-size: 28px; }
.mel-medal[data-glyph=indian] { font-size: 32px; border-style: double; border-width: 4px; }
.mel-medal[data-glyph=roman] { border-radius: 4px; font-family: 'Iowan Old Style', 'Palatino', 'Georgia', serif; font-size: 30px; letter-spacing: 0; }

.mel-emblem {
  flex: none;
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mel-seal {
  width: 62px;
  height: 62px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--ac) 88%, #000);
  color: color-mix(in srgb, #fbf1e3 92%, var(--ac));
  font-family: var(--font-display);
  font-size: 21px;
  line-height: 1.05;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  transform: rotate(-4deg);
  letter-spacing: 0.08em;
}

body[data-ds-dark-theme] .mel-seal {
  background: transparent;
  border: 1.5px solid var(--ac);
  color: var(--ac);
}

.mel-medal {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 1.5px solid var(--ac);
  color: var(--ac);
  font-family: var(--font-display);
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--ac) 9%, transparent);
}

/* 卡片排版系统：宽度完全统一平齐 720px，外间距 >= 24px */
.mel-card {
  position: relative;
  background: var(--paper);
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-lg);
  padding: var(--sp-4);
  margin: var(--sp-4) auto;
  max-width: 720px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
  box-shadow: var(--shadow);
  transition: background var(--dur-mid) var(--ease), border-color var(--dur-mid) var(--ease);
}

.mel-card.mel-cover {
  max-width: 720px;
  width: 100%;
  padding: 32px var(--sp-4) var(--sp-4);
  padding-right: 104px;
}

.mel-card.mel-qcard {
  max-width: 720px;
  width: 100%;
  text-align: left;
  padding: var(--sp-4);
  background: color-mix(in srgb, var(--paper) 60%, transparent);
}

.mel-card.mel-envelope {
  max-width: 720px;
  width: 100%;
  text-align: center;
  padding: 36px var(--sp-4) 30px;
  cursor: pointer;
}

.mel-card.mel-home {
  max-width: 720px;
  width: 100%;
  text-align: center;
}

.mel-card h2 {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 600;
  line-height: 1.45;
  margin: 0 0 var(--sp-2);
  color: var(--t1);
}

.mel-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.85;
  color: var(--t1);
  margin: var(--sp-2) 0 var(--sp-3);
  max-width: 62ch;
  word-break: break-word;
}

/* 荧光笔标记：浅色为柔和温暖明黄，深色为通透半透明琥珀金 */
.mel-highlight {
  background: rgba(245, 200, 66, 0.32);
  color: inherit;
  border-radius: 3px;
  padding: 1px 5px;
  margin: 0 1px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  font-weight: 500;
}

body[data-ds-dark-theme] .mel-highlight {
  background: rgba(220, 165, 60, 0.24);
  color: #f7eedb;
  border-bottom: 1px solid rgba(220, 165, 60, 0.35);
}

/* 正文下方的精美胶囊/特性小卡片（二次总结） */
.mel-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 16px;
}

.mel-trait-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--rad-full);
  background: color-mix(in srgb, var(--dc, var(--ac)) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--dc, var(--ac)) 28%, transparent);
  font-size: 12.5px;
  color: var(--t1);
  font-weight: 500;
  transition: all var(--dur-fast) var(--ease);
}

.mel-trait-badge:hover {
  background: color-mix(in srgb, var(--dc, var(--ac)) 18%, transparent);
  transform: translateY(-1px);
}

.mel-trait-icon {
  width: 14px;
  height: 14px;
  color: var(--dc, var(--ac));
  flex-shrink: 0;
}

.mel-sub {
  font-size: var(--text-sm);
  color: var(--t2);
  line-height: 1.7;
}

.mel-kicker {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ac);
  margin-bottom: var(--sp-2);
  font-weight: 600;
}

.mel-theme {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  color: var(--dc, var(--ac));
  margin-bottom: var(--sp-2);
  font-weight: 500;
}

.mel-theme::before {
  content: "";
  width: 12px;
  height: 1.5px;
  background: currentColor;
  opacity: 0.75;
}

.mel-ask {
  margin-top: var(--sp-3);
  padding-left: var(--sp-3);
  border-left: 2px solid color-mix(in srgb, var(--ac2) 50%, transparent);
  font-family: var(--font-display);
  font-size: 16.5px;
  color: var(--ac2);
  line-height: 1.75;
  max-width: 62ch;
}

.mel-maxim {
  margin-top: var(--sp-4);
  padding-top: var(--sp-2);
  border-top: 1px dashed var(--border-subtle);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  color: var(--t2);
  line-height: 1.65;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-wrap: wrap;
}

.mel-maxim i {
  font-style: normal;
  color: var(--dc, var(--ac));
  margin-right: 6px;
  opacity: 0.8;
}

.mel-maxim small {
  color: var(--t3);
  font-size: var(--text-xs);
  margin-left: auto;
  font-family: var(--font-body);
}

.mel-cost {
  margin-top: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--rad-md);
  background: color-mix(in srgb, var(--base) 50%, transparent);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  color: var(--t2);
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.mel-cost::before {
  content: "◈";
  color: var(--ac);
  font-size: 11px;
}

/* 回调为上一版 4 块带动效的卡片 Tab：与正文卡片平齐 */
.mel-domains {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 720px;
  width: 100%;
  margin: var(--sp-3) auto var(--sp-4);
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .mel-domains {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.mel-dom {
  font: inherit;
  position: relative;
  padding: 14px 14px 12px;
  border-radius: var(--rad-md);
  background: var(--paper);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
  overflow: hidden;
  box-sizing: border-box;
}

.mel-dom::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--dc, var(--ac));
  opacity: 0.55;
  transition: opacity var(--dur-fast) var(--ease), height var(--dur-fast) var(--ease);
}

.mel-dom:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--dc, var(--ac)) 45%, transparent);
}

.mel-dom:active {
  transform: translateY(0) scale(0.98);
}

.mel-dom[aria-selected=true] {
  border-color: color-mix(in srgb, var(--dc, var(--ac)) 70%, transparent);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--dc, var(--ac)) 14%, transparent);
}

.mel-dom[aria-selected=true]::before {
  opacity: 1;
  height: 4px;
}

.mel-dom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mel-dom-icon {
  width: 22px;
  height: 22px;
  color: var(--dc, var(--ac));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--dur-mid) var(--ease);
}

.mel-dom:hover .mel-dom-icon-H,
.mel-dom[aria-selected=true] .mel-dom-icon-H {
  animation: mel-jump 600ms cubic-bezier(.34, 1.56, .64, 1);
}

.mel-dom:hover .mel-dom-icon-A,
.mel-dom[aria-selected=true] .mel-dom-icon-A {
  animation: mel-spin 800ms cubic-bezier(.2, .8, .2, 1);
}

.mel-dom:hover .mel-dom-icon-S,
.mel-dom[aria-selected=true] .mel-dom-icon-S {
  animation: mel-rotate-pulse 1000ms ease;
}

.mel-dom:hover .mel-dom-icon-I,
.mel-dom[aria-selected=true] .mel-dom-icon-I {
  animation: mel-heartbeat 800ms ease;
}

@keyframes mel-jump {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px) scale(1.15); }
  70% { transform: translateY(1px); }
}

@keyframes mel-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes mel-rotate-pulse {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.18) rotate(15deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes mel-heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.22); }
  50% { transform: scale(1.05); }
  75% { transform: scale(1.25); }
}

.mel-dom-count {
  font-size: var(--text-xs);
  color: var(--t3);
  font-weight: 500;
}

.mel-dom[aria-selected=true] .mel-dom-count {
  color: var(--dc, var(--ac));
}

.mel-dom-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--t1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mel-dom-sub {
  font-size: var(--text-xs);
  color: var(--t3);
  font-weight: normal;
}

/* 动效与过渡 */
.mel-panel > * {
  animation: mel-in-r var(--dur-mid) var(--ease) both;
}

.mel-panel[data-dir=l] > * {
  animation-name: mel-in-l;
}

.mel-panel > :nth-child(2) { animation-delay: 50ms; }
.mel-panel > :nth-child(3) { animation-delay: 100ms; }
.mel-panel > :nth-child(4) { animation-delay: 150ms; }

@keyframes mel-in-r {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: none; }
}

@keyframes mel-in-l {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: none; }
}

.mel-detail > * {
  animation: mel-up var(--dur-mid) var(--ease) both;
}

@keyframes mel-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

/* 信封动效 */
.mel-envelope {
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease);
}

.mel-envelope:hover {
  transform: translateY(-2px);
}

.mel-wax {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--sp-3);
  border-radius: 50%;
  border: 1.5px solid var(--dc, var(--ac));
  color: var(--dc, var(--ac));
  font-family: var(--font-display);
  font-size: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--dc, var(--ac)) 10%, transparent);
}

.mel-wobble {
  animation: mel-wobble 0.7s var(--ease);
}

@keyframes mel-wobble {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-14deg) scale(1.08); }
  40% { transform: rotate(10deg); }
  60% { transform: rotate(-6deg); }
  80% { transform: rotate(3deg); }
}

.mel-sealhint {
  font-size: var(--text-sm);
  color: var(--dc, var(--ac));
  margin-top: var(--sp-2);
  animation: mel-up var(--dur-mid) var(--ease) both;
}

/* 出处与折叠详情 */
.mel-more {
  font: inherit;
  font-size: var(--text-xs);
  margin-top: var(--sp-3);
  padding: var(--sp-1) 0;
  border: 0;
  background: transparent;
  color: var(--t3);
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  transition: color var(--dur-fast);
}

.mel-more:hover {
  color: var(--dc, var(--ac));
}

.mel-more span {
  display: inline-block;
  transition: transform var(--dur-fast) var(--ease);
}

.mel-more[aria-expanded=true] span {
  transform: rotate(90deg);
}

.mel-detail {
  margin-top: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1px dashed var(--border-subtle);
}

.mel-label {
  font-size: var(--text-xs);
  color: var(--t3);
  margin: var(--sp-3) 0 var(--sp-1);
  letter-spacing: 0.04em;
}

.mel-quote {
  margin: var(--sp-2) 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--rad-md);
  background: color-mix(in srgb, var(--base) 45%, transparent);
  line-height: 1.75;
  font-family: var(--font-display);
  overflow-wrap: break-word;
  word-break: break-word;
}

.mel-quote small {
  display: block;
  font-family: var(--font-body);
  color: var(--t3);
  font-size: var(--text-xs);
  margin-top: 2px;
}

.mel-read {
  margin: 6px 0;
  padding-left: 16px;
  position: relative;
  line-height: 1.75;
  font-size: var(--text-sm);
}

.mel-read::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 0.75em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--dc, var(--ac)) 55%, transparent);
}

/* 交互按钮与内联操作 */
.mel-home-cta {
  margin: var(--sp-4) 0 var(--sp-3);
  text-align: center;
}

.mel-go-hero {
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.06em;
  border: 0;
  background: var(--ac);
  color: var(--on-ac);
  padding: 13px 40px;
  border-radius: var(--rad-full);
  cursor: pointer;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--ac) 25%, transparent);
  transition: transform var(--dur-fast) var(--ease), filter var(--dur-fast) var(--ease);
}

.mel-go-hero:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.mel-go-hero:disabled {
  opacity: 0.45;
  cursor: default;
  box-shadow: none;
  transform: none;
}

.mel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin: var(--sp-2) 0 var(--sp-3);
}

.mel-chip {
  font: inherit;
  font-size: var(--text-sm);
  padding: 5px 12px;
  border-radius: var(--rad-full);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--t2);
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mel-chip:hover,
.mel-chip[aria-pressed=true] {
  color: var(--ac);
  border-color: color-mix(in srgb, var(--ac) 50%, transparent);
  background: color-mix(in srgb, var(--ac) 8%, transparent);
}

.mel textarea,
.mel select {
  font: inherit;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: var(--rad-md);
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--base) 70%, transparent);
  color: var(--t1);
}

.mel textarea {
  min-height: 76px;
  resize: vertical;
  line-height: 1.6;
}

.mel-row {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
  flex-wrap: wrap;
  margin-top: var(--sp-4);
}

.mel-seg {
  display: inline-flex;
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-full);
  padding: 2px;
  gap: 2px;
  flex-wrap: wrap;
}

.mel-seg button {
  font: inherit;
  font-size: var(--text-sm);
  border: 0;
  background: transparent;
  color: var(--t2);
  padding: 5px 12px;
  border-radius: var(--rad-full);
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mel-seg button[aria-pressed=true] {
  background: var(--ac);
  color: var(--on-ac);
}

.mel-btn {
  font: inherit;
  font-size: var(--text-sm);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--t2);
  padding: 5px 14px;
  border-radius: var(--rad-full);
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mel-btn:hover {
  color: var(--ac);
  border-color: var(--ac);
}

.mel-inline-confirm {
  margin-top: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--rad-md);
  background: color-mix(in srgb, var(--line) 20%, transparent);
  display: inline-flex;
  align-items: center;
  gap: var(--sp-3);
  flex-wrap: wrap;
  font-size: var(--text-sm);
}

.mel-btn-danger {
  color: var(--dsw-alias-danger, #b3261e) !important;
  border-color: color-mix(in srgb, var(--dsw-alias-danger, #b3261e) 40%, transparent) !important;
}

.mel-btn-danger:hover {
  background: color-mix(in srgb, var(--dsw-alias-danger, #b3261e) 12%, transparent) !important;
}

.mel-btn-subtle {
  opacity: 0.75;
  font-size: var(--text-xs);
}

.mel-btn-subtle:hover {
  opacity: 1;
}

/* 进度与状态 */
.mel-run {
  list-style: none;
  margin: var(--sp-2) 0 0;
  padding: 0;
}

.mel-run li {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
  padding: var(--sp-2) 0;
  color: var(--t3);
  font-size: var(--text-sm);
}

.mel-run li[data-s=now] {
  color: var(--t1);
  font-weight: 500;
}

.mel-run li[data-s=done] {
  color: var(--t2);
}

.mel-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-family: var(--font-display);
}

.mel-run li[data-s=now] .mel-dot {
  border-color: var(--ac);
  color: var(--ac);
  border-top-color: transparent;
  animation: mel-spin 1.1s linear infinite;
}

.mel-run li[data-s=done] .mel-dot {
  background: var(--ac);
  border-color: var(--ac);
  color: var(--on-ac);
}

@keyframes mel-spin {
  to { transform: rotate(360deg); }
}

.mel-note {
  font-size: var(--text-xs);
  color: var(--t3);
  line-height: 1.7;
  margin-top: var(--sp-4);
  display: flex;
  gap: var(--sp-2);
}

.mel-err {
  color: var(--dsw-alias-danger, #b3261e);
  line-height: 1.7;
  margin-top: var(--sp-3);
  display: flex;
  gap: var(--sp-2);
  align-items: center;
  flex-wrap: wrap;
  font-size: var(--text-sm);
}

.mel-intent {
  margin-top: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--rad-md);
  background: color-mix(in srgb, var(--ac) 7%, transparent);
  font-size: var(--text-sm);
  line-height: 1.7;
}

.mel-empty {
  padding: 32px var(--sp-4);
  color: var(--t2);
  font-size: var(--text-sm);
  line-height: 1.8;
  text-align: center;
}

.mel-past {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
  margin: var(--sp-1) 0 var(--sp-2);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.mel-foot {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--t3);
  margin-top: var(--sp-4);
  line-height: 1.8;
}

.mel-foot-flow {
  position: relative;
  height: 120px;
  margin: var(--sp-5) auto 0;
  max-width: 820px;
}

.mel-flow {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.mel-corner {
  margin: var(--sp-2) 0 var(--sp-4);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--t3);
  font-family: var(--font-display);
}

/* 设置面板网格 */
.mel-set {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--sp-3) var(--sp-4);
  align-items: center;
}

.mel-set > label {
  font-size: var(--text-sm);
  color: var(--t2);
}

.mel-swatches {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.mel-sw {
  font: inherit;
  font-size: var(--text-xs);
  width: 124px;
  padding: 0;
  border-radius: var(--rad-md);
  border: 1.5px solid var(--border-subtle);
  background: transparent;
  color: var(--t2);
  cursor: pointer;
  overflow: hidden;
  text-align: left;
  transition: all var(--dur-fast);
}

.mel-sw[aria-pressed=true] {
  border-color: var(--ac);
  color: var(--t1);
}

.mel-sw div { height: 42px; }
.mel-sw span { display: block; padding: 6px 8px; }

.mel-dates {
  display: flex;
  gap: var(--sp-3);
  flex-wrap: wrap;
  margin-top: var(--sp-3);
  font-size: var(--text-sm);
  color: var(--t2);
}

.mel-dates label {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
}

.mel-dates input {
  font: inherit;
  padding: 6px 10px;
  border-radius: var(--rad-md);
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--base) 70%, transparent);
  color: var(--t1);
  color-scheme: light dark;
}

.mel-btns {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.mel-ver {
  margin: var(--sp-3) 0 var(--sp-2);
  font-size: var(--text-base);
}

.mel-ver span {
  color: var(--ac);
  margin-left: 4px;
}

.mel-log {
  margin: var(--sp-2) 0 0;
  padding-left: 20px;
  line-height: 1.85;
  color: var(--t1);
  font-size: var(--text-sm);
}

.mel-log-section {
  margin-top: 24px;
}

.mel-changelog > .mel-log-section:first-child {
  margin-top: 10px;
}

.mel-log-group {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ac);
}

.mel-lead {
  font-family: var(--font-display);
  font-size: var(--text-md);
  color: var(--ac);
}

.mel-hr {
  grid-column: 1 / -1;
  height: 1px;
  background: var(--border-subtle);
  margin: var(--sp-2) 0;
}

/* 出处上下文对话浮层 / 内联展开卡片 */
.mel-context-box {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: var(--rad-md);
  background: color-mix(in srgb, var(--base) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--ac) 30%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: mel-up var(--dur-mid) var(--ease) both;
}

.mel-context-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border-subtle);
}

.mel-context-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ac);
  letter-spacing: 0.04em;
}

.mel-context-close {
  background: transparent;
  border: 0;
  color: var(--t3);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.mel-context-close:hover {
  color: var(--t1);
  background: var(--border-subtle);
}

.mel-context-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.mel-context-item {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  background: color-mix(in srgb, var(--line) 15%, transparent);
  overflow-wrap: break-word;
  word-break: break-word;
}

.mel-context-item.is-target {
  background: color-mix(in srgb, var(--ac) 15%, transparent);
  border-left: 3px solid var(--ac);
}

.mel-context-who {
  font-size: 11px;
  font-weight: 600;
  color: var(--ac);
  margin-bottom: 2px;
}

.mel-context-btn {
  background: transparent;
  border: 1px dashed var(--border-subtle);
  color: var(--t2);
  font-size: var(--text-xs);
  border-radius: var(--rad-full);
  padding: 2px 8px;
  margin-left: 8px;
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mel-context-btn:hover {
  border-color: var(--ac);
  color: var(--ac);
}

/* ========================================================
   你的新世界：抢先预览（固定深色 · 轮播 · AI 工作流推荐）
   ======================================================== */
.mel-ultra-container {
  position: relative;
  border-radius: var(--rad-lg);
  overflow: hidden;
  margin: var(--sp-2) auto var(--sp-4);
  max-width: 720px;
  width: 100%;
  box-sizing: border-box;
}

.mel-ultra-container[data-melete-ultra="fixed-dark"] {
  color-scheme: dark;
  background: #101713;
  color: #F4F1E8;
  --ink: #F4F1E8;
  --ink-2: rgba(244, 241, 232, .80);
  --ink-3: rgba(244, 241, 232, .56);
  --line: rgba(244, 241, 232, .18);
  --panel: rgba(14, 22, 18, .68);
  --accent: #CFE0B4;
  --radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line);
}

/* 背景轮播舞台 */
.mel-ultra-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #101713;
}

.mel-ultra-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.8s cubic-bezier(.4, 0, .2, 1);
  will-change: opacity;
}

.mel-ultra-slide.is-active {
  opacity: 1;
}

.mel-ultra-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
}

.mel-ultra-slide.is-active img {
  animation: mel-ultra-drift 14s ease-out forwards;
}

@keyframes mel-ultra-drift {
  from { transform: scale(1.02); }
  to { transform: scale(1.075); }
}

.mel-ultra-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(8, 14, 11, .65) 0%, rgba(8, 14, 11, .55) 42%, rgba(8, 14, 11, .88) 100%);
}

.mel-ultra-page {
  position: relative;
  z-index: 1;
  padding: 36px 32px 48px;
  box-sizing: border-box;
}

.mel-ultra-hero {
  padding-bottom: 28px;
}

.mel-ultra-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: .22em;
  color: var(--accent);
  text-transform: uppercase;
  font-weight: 600;
}

.mel-ultra-title {
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: .02em;
  margin: 12px 0 0;
  color: var(--ink);
}

.mel-ultra-note {
  margin: 14px 0 0;
  max-width: 60ch;
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: 1.8;
}

.mel-ultra-block {
  padding: 28px 0;
  border-top: 1px solid var(--line);
}

.mel-ultra-eyebrow {
  margin: 0 0 8px;
  font-size: 11.5px;
  letter-spacing: .14em;
  color: var(--accent);
  text-transform: uppercase;
  font-weight: 600;
}

.mel-ultra-h2 {
  font-size: 19px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--ink);
}

/* 推荐筛选胶囊 */
.mel-ultra-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.mel-ultra-filter {
  font: inherit;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(244, 241, 232, 0.06);
  color: var(--ink-2);
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mel-ultra-filter:hover,
.mel-ultra-filter.is-active {
  border-color: var(--accent);
  color: #101713;
  background: var(--accent);
  font-weight: 600;
}

/* 推荐卡片列表 */
.mel-ultra-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mel-ultra-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 20px;
  backdrop-filter: blur(12px);
  transition: transform var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
  overflow-wrap: break-word;
  word-break: break-word;
}

.mel-ultra-card:hover {
  transform: translateY(-2px);
  border-color: rgba(207, 224, 180, 0.5);
}

.mel-ultra-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.mel-ultra-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mel-ultra-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(207, 224, 180, 0.2);
  color: var(--accent);
  border: 1px solid rgba(207, 224, 180, 0.35);
  font-weight: normal;
}

.mel-ultra-link {
  font-size: 12.5px;
  color: var(--accent);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid rgba(207, 224, 180, 0.35);
}

.mel-ultra-link:hover {
  border-bottom-color: var(--accent);
}

.mel-ultra-card-summary {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.75;
  margin: 6px 0 10px;
}

.mel-ultra-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--ink-3);
  padding-top: 8px;
  border-top: 1px dashed rgba(244, 241, 232, 0.12);
}

.mel-ultra-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 三段润色说明 */
.mel-ultra-prose-item {
  padding: 12px 0;
}

.mel-ultra-prose-item + .mel-ultra-prose-item {
  border-top: 1px dashed var(--line);
}

.mel-ultra-marker {
  display: block;
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 4px;
  font-weight: 500;
}

.mel-ultra-prose-p {
  margin: 0;
  color: var(--ink-2);
  line-height: 1.85;
  font-size: 14px;
}

/* 版权清单列表 */
.mel-ultra-credits {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mel-ultra-credit {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 14px;
  align-items: center;
  padding: 8px 0;
}

.mel-ultra-credit + .mel-ultra-credit {
  border-top: 1px solid rgba(244, 241, 232, 0.1);
}

.mel-ultra-credit img {
  width: 72px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(244, 241, 232, 0.15);
}

.mel-ultra-credit-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink);
  margin: 0 0 2px;
}

.mel-ultra-credit-meta {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.6;
  margin: 0;
}

/* 轮播控制条 */
.mel-ultra-ctrl {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-3);
  flex-wrap: wrap;
}

.mel-ultra-dots {
  display: flex;
  gap: 8px;
}

.mel-ultra-dot {
  width: 22px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: rgba(244, 241, 232, 0.25);
  cursor: pointer;
  transition: background var(--dur-fast);
}

.mel-ultra-dot.is-active {
  background: var(--accent);
}

.mel-ultra-toggle {
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 12px;
  font: inherit;
  font-size: 11.5px;
}

.mel-ultra-toggle:hover {
  color: var(--ink);
  border-color: var(--accent);
}

/* 响应式断点 */
@media (max-width: 1024px) {
  .mel-wrap {
    padding-left: var(--sp-4);
    padding-right: var(--sp-4);
  }
}

@media (max-width: 700px) {
  .mel-domains {
    gap: var(--sp-3);
  }
  .mel-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
  }
  .mel-card.mel-cover {
    padding-right: var(--sp-4);
  }
  .mel-card.mel-cover .mel-emblem {
    display: none;
  }
  .mel-set {
    grid-template-columns: 1fr;
    gap: var(--sp-2);
  }
}

@media (max-width: 480px) {
  .mel-wrap {
    padding-left: var(--sp-3);
    padding-right: var(--sp-3);
  }
  .mel-card {
    padding: var(--sp-3);
    margin: var(--sp-3) auto;
  }
  .mel-seg {
    width: 100%;
    justify-content: center;
  }
  .mel-chips {
    justify-content: center;
  }
}

/* ---------- 分享明信片与抽屉面板 ---------- */
.mel-share-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex; justify-content: flex-end;
  animation: melFadeIn 200ms ease;
}
.mel-share-drawer {
  width: min(880px, 94vw); height: 100vh;
  background: var(--dsw-alias-surface-panel, #fbf8f1);
  box-shadow: -10px 0 40px rgba(0,0,0,0.25);
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: melSlideLeft 240ms cubic-bezier(.2, .8, .2, 1);
}
@keyframes melSlideLeft {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.mel-share-head {
  padding: 14px 22px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.08));
  background: var(--dsw-alias-surface-panel, #fbf8f1);
}
.mel-share-head h2 { margin: 0; font-size: 18px; font-weight: 600; font-family: var(--font-display); }
.mel-share-head-sub { font-size: 12.5px; color: var(--t2, #666); margin-top: 2px; }
.mel-share-toolbar {
  padding: 10px 22px;
  display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
  border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.08));
  background: color-mix(in srgb, var(--dsw-alias-surface-panel, #fbf8f1) 94%, transparent);
}
.mel-share-privacy {
  padding: 10px 22px; font-size: 12.5px; line-height: 1.6;
  border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.08));
  background: color-mix(in srgb, #c9a227 8%, var(--dsw-alias-surface-panel, #fbf8f1));
  max-height: 34vh; overflow-y: auto;
}
.mel-share-privacy-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-weight: 600; }
.mel-share-privacy-head button { font-size: 12px; padding: 2px 8px; }
.mel-share-privacy ul { margin: 6px 0 0; padding-left: 18px; }
.mel-share-privacy li { margin: 2px 0; color: var(--t2, #666); }
.mel-share-privacy-hit { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; padding: 4px 0; border-top: 1px dashed var(--border-subtle, rgba(0,0,0,0.08)); }
.mel-share-privacy-hit:first-of-type { border-top: 0; }
.mel-share-privacy-hit .blk-name { font-size: 11.5px; padding: 0 6px; border-radius: 4px; background: rgba(128,128,128,0.12); }
.mel-share-privacy-hit mark { background: rgba(201,162,39,0.28); color: inherit; padding: 0 2px; border-radius: 2px; }
.mel-share-privacy-hit .why { color: var(--t2, #666); }
.mel-share-privacy-hit .done { color: var(--t2, #999); font-size: 12px; }
.mel-share-privacy-hit button { font-size: 12px; padding: 1px 8px; margin-left: auto; }
.mel-share-stage {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  display: flex; justify-content: center; align-items: flex-start;
  padding: 24px;
  background: repeating-conic-gradient(rgba(128,128,128,0.07) 0 25%, transparent 0 50%) 0 0/20px 20px;
}
.mel-share-actions {
  padding: 14px 22px;
  border-top: 1px solid var(--border-subtle, rgba(0,0,0,0.08));
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  background: var(--dsw-alias-surface-panel, #fbf8f1);
}
.mel-share-actions .mel-btn {
  padding: 10px 14px; font-size: 13.5px; font-weight: 500;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.mel-share-footer {
  padding: 8px 22px 14px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--t2, #888);
  background: var(--dsw-alias-surface-panel, #fbf8f1);
}
.mel-share-toast-box {
  min-height: 24px; padding: 0 22px; font-size: 12.5px; color: var(--ac);
  display: flex; align-items: center; justify-content: space-between;
}
.mel-share-reveal-btn {
  font-size: 12px; padding: 2px 8px; margin-left: 8px;
}
.mel-share-bar-top {
  display: flex; gap: 10px; margin-top: 14px; align-items: center; flex-wrap: wrap;
}

/* ---------- 明信片（与导出共用） ---------- */
${POSTCARD_CSS}

/* ---------- 沉浸背景：天色 + 用代码画的建筑（2026-11-08 发起人要求） ---------- */
.mel { position: relative; background: radial-gradient(42% 36% at 84% 14%, color-mix(in srgb, var(--ac2) 16%, transparent), transparent 70%), radial-gradient(60% 50% at 8% 96%, color-mix(in srgb, var(--ac) 10%, transparent), transparent 70%), var(--sky); }
.mel[data-style=greek] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 62%, #b6cfe4) 0%, color-mix(in srgb, var(--base) 84%, #e9e2d0) 55%, color-mix(in srgb, var(--base) 70%, #dcc8a2) 100%); }
.mel[data-style=chinese] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 66%, #e2ccaa) 0%, color-mix(in srgb, var(--base) 84%, #efe2c8) 55%, color-mix(in srgb, var(--base) 70%, #d6bb8e) 100%); }
body[data-ds-dark-theme] .mel[data-style=greek] { --sky: linear-gradient(180deg, #070b15 0%, #0d1424 55%, #171a22 100%); }
body[data-ds-dark-theme] .mel[data-style=chinese] { --sky: linear-gradient(180deg, #0b0a09 0%, #14110e 55%, #1d1814 100%); }
.mel[data-style=babylonian] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 64%, #d9c39a) 0%, color-mix(in srgb, var(--base) 84%, #ecdfc4) 55%, color-mix(in srgb, var(--base) 70%, #cdb183) 100%); }
body[data-ds-dark-theme] .mel[data-style=babylonian] { --sky: linear-gradient(180deg, #080b1c 0%, #10152b 55%, #1b1a22 100%); }
.mel[data-style=indian] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 64%, #efc6ae) 0%, color-mix(in srgb, var(--base) 84%, #f3e0cf) 55%, color-mix(in srgb, var(--base) 70%, #dcb48f) 100%); }
body[data-ds-dark-theme] .mel[data-style=indian] { --sky: linear-gradient(180deg, #110a14 0%, #1a1020 55%, #211819 100%); }
.mel[data-style=egyptian] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 64%, #ead19a) 0%, color-mix(in srgb, var(--base) 84%, #f1e3c2) 55%, color-mix(in srgb, var(--base) 70%, #d8bb80) 100%); }
body[data-ds-dark-theme] .mel[data-style=egyptian] { --sky: linear-gradient(180deg, #0d0b07 0%, #16120b 55%, #1f1a12 100%); }
.mel[data-style=roman] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 64%, #e2c2b2) 0%, color-mix(in srgb, var(--base) 84%, #efe0d4) 55%, color-mix(in srgb, var(--base) 70%, #d4b29c) 100%); }
body[data-ds-dark-theme] .mel[data-style=roman] { --sky: linear-gradient(180deg, #100a0c 0%, #1a1013 55%, #1f1819 100%); }
.mel[data-style=maya] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 64%, #c2e2d0) 0%, color-mix(in srgb, var(--base) 84%, #e5f1ea) 55%, color-mix(in srgb, var(--base) 70%, #bcdbc9) 100%); }
body[data-ds-dark-theme] .mel[data-style=maya] { --sky: linear-gradient(180deg, #050d09 0%, #0b1712 55%, #13221b 100%); }
.mel[data-style=inca] { --sky: linear-gradient(180deg, color-mix(in srgb, var(--base) 64%, #eacdc0) 0%, color-mix(in srgb, var(--base) 84%, #f5e4dc) 55%, color-mix(in srgb, var(--base) 70%, #dfbfaf) 100%); }
body[data-ds-dark-theme] .mel[data-style=inca] { --sky: linear-gradient(180deg, #100605 0%, #170c0a 55%, #21120f 100%); }
.mel-backdrop { position: sticky; top: 0; height: 0; z-index: 0; pointer-events: none; }
.mel-backdrop-in { position: absolute; left: 0; right: 0; top: 0; height: 100vh; }
.mel-backdrop svg { position: absolute; bottom: 0; overflow: hidden; }
.mel-backdrop svg.env { left: 0; width: 100%; height: 100%; }
.mel-backdrop svg.bld { left: 0; width: 100%; height: 94%; }
.mel-backdrop svg.env .bld, .mel-backdrop svg.bld .env { display: none; }
.mel-backdrop .g { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
.mel-backdrop .a1 { stroke: var(--ac); opacity: .55; }
.mel-backdrop .a2 { stroke: var(--ac2); opacity: .36; }
.mel-backdrop .thin { stroke-width: 1.2; }
.mel-backdrop .star { fill: var(--ac); opacity: 0; }
body:not([data-ds-dark-theme]) .mel-backdrop .star { display: none; }
body[data-ds-dark-theme] .mel-backdrop .a1 { opacity: .6; }
body[data-ds-dark-theme] .mel-backdrop .a2 { opacity: .4; }
.mel-wrap { position: relative; z-index: 1; }
.mel .mel-card {
  background: color-mix(in srgb, var(--paper) 93%, transparent);
  border-color: color-mix(in srgb, var(--line) 45%, transparent);
  box-shadow: 0 10px 40px rgba(40, 30, 10, 0.06);
}
body[data-ds-dark-theme] .mel {
  --t1: #f1ece3;
  --t2: #cfc8bc;
  --t3: #a9a296;
}
body[data-ds-dark-theme] .mel .mel-card {
  background: color-mix(in srgb, var(--paper) 95%, transparent);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}

.mel .mel-foot {
  max-width: 720px; margin: var(--sp-4) auto 0; padding: 12px 18px; box-sizing: border-box; border-radius: var(--rad-lg);
  background: color-mix(in srgb, var(--paper) 86%, transparent);
}
.mel .mel-corner { position: relative; }


/* ---------- 背景里的生机（2026-11-08）：自然元素一开始就在；建筑只有 .bld 才生长 ---------- */
.mel-backdrop .g.env { stroke-dashoffset: 0; }
.mel-backdrop .deco { display: none; }
body[data-ds-dark-theme] .mel-backdrop .star { opacity: .75; }
.mel-backdrop svg.life { left: 0; width: 100%; height: 100%; }
.mel-backdrop .life path, .mel-backdrop .life circle { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.mel-backdrop .crit path { stroke: var(--ac); opacity: .5; }
.mel-backdrop .crit.cloud path { stroke: var(--ac2); opacity: .38; }
body[data-ds-dark-theme] .mel-backdrop .crit path { opacity: .62; }
.mel-backdrop .orb .sun, .mel-backdrop .orb .moon { display: none; }
body:not([data-ds-dark-theme]) .mel-backdrop .orb .sun, body[data-ds-dark-theme] .mel-backdrop .orb .moon { display: inline; }
.mel-backdrop .orb .sun circle, .mel-backdrop .orb .sun > path { stroke: var(--ac2); opacity: .7; }
.mel-backdrop .orb .rays path { stroke: var(--ac2); opacity: .55; }
.mel-backdrop .orb .moon path, .mel-backdrop .orb .moon circle:not(.halo) { stroke: var(--ac); opacity: .75; }
.mel-backdrop .orb .moon .halo { stroke: var(--ac); opacity: .14; stroke-dasharray: 2 6; }
.mel-backdrop .orb .orb-b, .mel-backdrop .orb .rays, .mel-backdrop .orb .halo { transform-box: fill-box; transform-origin: center; transition: transform .45s cubic-bezier(.3, 1.6, .5, 1), opacity .3s; }
.mel-backdrop .orb { pointer-events: auto; cursor: pointer; }
.mel-backdrop .orb .orb-hit { stroke: none !important; fill: transparent !important; }
.mel-backdrop .orb:hover .orb-b { filter: drop-shadow(0 0 7px var(--ac)); }
.mel-postcard .pc-orb .orb-hit { display: none; }
.mel-backdrop .orb.hot .orb-b { animation: melOrbBounce .9s cubic-bezier(.3, 1.4, .5, 1); }
.mel-backdrop .orb.hot .rays { transform: scale(1.3) rotate(15deg); }
.mel[data-style=egyptian] .mel-backdrop .orb.hot .rays { transform: scale(1.18); }
.mel-backdrop .orb.hot .rays path, .mel-backdrop .orb.hot .sun circle, .mel-backdrop .orb.hot .sun > path, .mel-backdrop .orb.hot .moon path, .mel-backdrop .orb.hot .moon circle:not(.halo) { opacity: 1; }
.mel-backdrop .orb.hot .halo { transform: scale(1.25); opacity: .45; }
@keyframes melOrbBounce { 0% { transform: scale(1); } 30% { transform: scale(1.18); } 55% { transform: scale(.94); } 78% { transform: scale(1.05); } 100% { transform: scale(1); } }

/* 日月说明临时气泡 */
.mel-orb-pop { position: fixed; z-index: 1000; max-width: 320px; padding: 14px 18px 12px; border-radius: 12px; background: color-mix(in srgb, var(--paper, #f7f3ec) 92%, transparent); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border: 1px solid color-mix(in srgb, var(--ac, #8a5d0e) 28%, transparent); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px color-mix(in srgb, var(--ac) 18%, transparent); color: var(--ink, #222); font-family: var(--font-body, system-ui); pointer-events: auto; opacity: 0; transform: translateY(6px) scale(0.96); transition: opacity .25s ease-out, transform .25s cubic-bezier(0.16, 1, 0.3, 1); }
.mel-orb-pop.show { opacity: 1; transform: translateY(0) scale(1); }
body[data-ds-dark-theme] .mel-orb-pop { background: color-mix(in srgb, var(--page, #12100d) 92%, transparent); border-color: color-mix(in srgb, var(--ac) 35%, transparent); box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 16px color-mix(in srgb, var(--ac) 22%, transparent); color: var(--t1, #e8e4dc); }
.mel-orb-pop-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.mel-orb-pop-title { font-family: var(--font-display, serif); font-size: 15px; font-weight: 600; letter-spacing: .02em; color: var(--ac); display: flex; align-items: center; gap: 6px; }
.mel-orb-pop-close { border: 0; background: transparent; color: var(--t3, #888); font-size: 18px; line-height: 1; cursor: pointer; padding: 0 4px; border-radius: 4px; }
.mel-orb-pop-close:hover { color: var(--ac); }
.mel-orb-pop-desc { font-size: 13px; line-height: 1.55; color: var(--t2, #555); margin-bottom: 8px; }
body[data-ds-dark-theme] .mel-orb-pop-desc { color: color-mix(in srgb, var(--t1, #e8e4dc) 85%, transparent); }
.mel-orb-pop-source { font-size: 11.5px; line-height: 1.4; color: var(--t3, #888); border-top: 1px dashed color-mix(in srgb, var(--ac) 22%, transparent); padding-top: 6px; display: flex; align-items: baseline; gap: 4px; }
.mel-orb-pop-source::before { content: '🏛️'; font-size: 11px; opacity: .85; }
.mel-backdrop .flock { opacity: 0; }
.mel-backdrop .flock path { stroke: var(--ac); }
.mel-backdrop-in.is-done .flock { animation: melFlock 4s ease-out; }
@keyframes melFlock { 0% { transform: translate(1180px, 560px); opacity: 0; } 15% { opacity: .75; } 85% { opacity: .6; } 100% { transform: translate(-140px, 120px); opacity: 0; } }
.mel-backdrop-in.is-done svg.bld .g { animation: melBuildGlow 2.4s ease-in-out; }
@keyframes melBuildGlow { 0%, 100% { stroke-width: 2; } 40% { stroke-width: 3; opacity: 1; } }

/* 弹幕名言：很淡、很慢；鼠标靠近时放慢变亮，露出出处 */
.mel-drift { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.mel-drift-q { position: absolute; left: 0; top: 0; white-space: nowrap; font-family: var(--font-display); font-size: 15px; letter-spacing: .04em; color: var(--ac); opacity: var(--q-op, .34); will-change: transform; transition: opacity .35s, text-shadow .35s; }
.mel-drift-q small { margin-left: 10px; font-size: 12px; color: var(--t3); opacity: 0; transition: opacity .35s; }
.mel-drift-q.hot { opacity: .95; text-shadow: 0 0 14px color-mix(in srgb, var(--ac) 35%, transparent); }
.mel-drift-q.hot small { opacity: 1; }
body[data-ds-dark-theme] .mel-drift-q { opacity: calc(var(--q-op, .34) + .1); }

/* 没有卡片垫着的文字：背后一层随天色渐隐的柔光，让线条在字的周围淡出去 */
.mel-top, .mel-hero, .mel-past, .mel-corner { position: relative; isolation: isolate; }
.mel-top::before, .mel-hero::before, .mel-past::before, .mel-corner::before {
  content: ''; position: absolute; inset: -26px -64px; z-index: -1; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--page) 94%, transparent) 58%, color-mix(in srgb, var(--page) 50%, transparent) 80%, transparent 100%);
}
.mel-hero h1, .mel-hero p, .mel-corner { text-shadow: 0 0 12px var(--page), 0 0 2px var(--page); }
@media (prefers-reduced-motion: reduce) { .mel-drift { display: none; } }

.mel-sw-endo { display: block; margin-top: 2px; font-size: 10px; color: var(--t3); letter-spacing: -0.01em; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mel[data-w=xs] .mel-domains { grid-template-columns: repeat(2, 1fr); gap: 8px; }
.mel[data-w=xs] .mel-hero { flex-direction: column; align-items: flex-start; gap: var(--sp-2); }
.mel[data-w=xs] .mel-card.mel-cover { padding-right: var(--sp-4); }
.mel[data-w=xs] .mel-card.mel-cover .mel-emblem { display: none; }
.mel[data-w=xs] .mel-set { grid-template-columns: 1fr; gap: var(--sp-2); }
.mel[data-w=xs] .mel-wrap, .mel[data-w=xs] .mel-navbar { padding-left: var(--sp-3); padding-right: var(--sp-3); }
.mel[data-w=xs] .mel-card { padding: var(--sp-3); }
.mel[data-w=xs] .mel-tab { padding: 4px 10px; }
.mel[data-w=xs] .mel-top { gap: 2px; }
.mel[data-w=xs] .mel-voices-head { flex-wrap: wrap; }

/* ---------- 「分享我的复盘」按钮：浅色取主题色 + 柔和光晕；深色是五彩斑斓的黑 ---------- */
.mel-share-cta {
  position: relative; isolation: isolate; font: inherit; font-size: 14px; font-weight: 600; letter-spacing: .02em;
  padding: 10px 22px; border: 0; border-radius: 999px; cursor: pointer; color: #fff;
  background: linear-gradient(120deg, var(--ac) 0%, color-mix(in srgb, var(--ac) 50%, var(--ac2)) 55%, var(--ac2) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 4px 14px color-mix(in srgb, var(--ac) 28%, transparent);
  transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-mid) var(--ease);
}
.mel-share-cta::before {
  content: ''; position: absolute; inset: -4px; z-index: -1; border-radius: inherit;
  background: conic-gradient(from 210deg, #ff8a8a, #ffd36e, #8be3a6, #72c6ff, #b893ff, #ff86d3, #ff8a8a);
  filter: blur(12px); opacity: .42; transition: opacity var(--dur-mid) var(--ease), filter var(--dur-mid) var(--ease);
}
.mel-share-cta:hover::before { opacity: .62; filter: blur(15px); }
.mel-share-cta:active { transform: translateY(1px); }
.mel-share-cta span { position: relative; }
body[data-ds-dark-theme] .mel-share-cta {
  color: #f6f3ff;
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(255, 110, 170, .20), transparent 46%),
    radial-gradient(120% 160% at 100% 100%, rgba(80, 170, 255, .22), transparent 46%),
    radial-gradient(90% 140% at 55% 0%, rgba(120, 255, 190, .12), transparent 52%),
    radial-gradient(90% 140% at 45% 100%, rgba(255, 210, 110, .10), transparent 52%),
    #0c0c10;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 6px 18px rgba(0,0,0,.45);
}
body[data-ds-dark-theme] .mel-share-cta::before { opacity: .3; }
body[data-ds-dark-theme] .mel-share-cta:hover::before { opacity: .48; }
body[data-ds-dark-theme] .mel-share-cta::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: conic-gradient(from 210deg, #ff8a8a, #ffd36e, #8be3a6, #72c6ff, #b893ff, #ff86d3, #ff8a8a);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;
  opacity: .55;
}
body[data-ds-dark-theme] .mel-share-cta span {
  background: linear-gradient(90deg, #ffd4ea, #e7dcff 35%, #d2efff 65%, #e0ffe9);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* ---------- 分享：全屏 ---------- */
.mel-share-full {
  position: fixed; inset: 0; z-index: 10000; display: grid; grid-template-columns: minmax(0, 1fr) 380px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #f4efe4) 92%, #000);
  animation: melFadeIn 180ms ease; font-family: var(--font-body); color: var(--t1);
}
body[data-ds-dark-theme] .mel-share-full { background: #0b0b0d; }
.mel-share-full .mel-share-stage {
  overflow-y: auto; overflow-x: hidden; display: flex; justify-content: center; align-items: flex-start;
  padding: 48px 40px 80px; background: radial-gradient(80% 60% at 50% 0%, color-mix(in srgb, var(--ac) 10%, transparent), transparent 70%);
}
.mel-share-full .mel-postcard { box-shadow: 0 30px 80px rgba(0,0,0,.28); flex: none; }
.mel-share-side {
  display: flex; flex-direction: column; gap: 14px; padding: 22px 22px 18px; overflow: hidden; min-height: 0;
  border-left: 1px solid var(--border-subtle, rgba(127,127,127,.15));
  background: var(--dsw-alias-surface-panel, color-mix(in srgb, var(--base) 96%, #e9dfc8));
}
.mel-share-side > * { flex-shrink: 0; }
.mel-share-side .mel-seg { border-radius: 14px; align-self: flex-start; }
.mel-share-side-head { margin-bottom: 4px; }
/* 深色模式：侧栏和隐私提醒用深色底，不再出现刺眼的米白块 */
body[data-ds-dark-theme] .mel-share-side { background: #141417; border-left-color: rgba(255,255,255,.08); }
body[data-ds-dark-theme] .mel-share-side .mel-share-privacy { background: color-mix(in srgb, var(--ac) 7%, #1b1b20); border-color: rgba(255,255,255,.09); color: #e6e0d6; }
body[data-ds-dark-theme] .mel-share-privacy li, body[data-ds-dark-theme] .mel-share-privacy-hit .why { color: #bdb6aa; }
body[data-ds-dark-theme] .mel-share-privacy-hit { border-top-color: rgba(255,255,255,.08); }
body[data-ds-dark-theme] .mel-share-privacy-hit .blk-name { background: rgba(255,255,255,.08); color: #e6e0d6; }
body[data-ds-dark-theme] .mel-share-privacy-hit mark { background: color-mix(in srgb, var(--ac) 30%, transparent); }
body[data-ds-dark-theme] .mel-share-side .mel-share-hint { color: #9a948a; }
.mel-share-side > .mel-share-privacy { flex-shrink: 1; }
.mel-share-side-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.mel-share-side-head h2 { margin: 0; font-size: 19px; font-weight: 600; }
.mel-share-side-head p { margin: 4px 0 0; font-size: 12.5px; color: var(--t2); }
.mel-share-side .mel-share-privacy { border: 1px solid var(--border-subtle, rgba(127,127,127,.15)); border-radius: 12px; max-height: none; padding: 12px 14px; flex: 1 1 auto; min-height: 120px; overflow-y: auto; }
.mel-share-side .mel-share-hint { margin: 0; font-size: 12px; color: var(--t3); }
.mel-share-side .mel-share-actions { display: grid; grid-template-columns: 1fr; gap: 10px; padding: 0; border: 0; background: none; }
.mel-share-side .mel-share-actions .mel-btn { padding: 11px 14px; font-size: 14px; justify-content: center; display: flex; }
.mel-share-side .mel-share-toast-box { padding: 0; min-height: 20px; }
.mel-share-stage [data-ph]:empty::before { content: attr(data-ph); color: var(--faint, #999); }
.mel-postcard .blk { position: relative; border-radius: 18px; outline: 3px dashed transparent; outline-offset: 16px; transition: outline-color .15s; }
.mel-postcard .blk:hover { outline-color: color-mix(in srgb, var(--ac) 35%, transparent); }
.mel-postcard .eye { position: absolute; top: -32px; right: -32px; width: 60px; height: 60px; border-radius: 50%; border: 0; background: var(--ink); color: var(--paper); font-size: 28px; cursor: pointer; opacity: 0; transition: opacity .15s; z-index: 3; display: flex; align-items: center; justify-content: center; }
.mel-postcard .blk:hover .eye { opacity: 1; }
.mel-postcard .blk.off > *:not(.eye) { display: none; }
.mel-postcard .blk.off { height: 34px; outline: 3px dashed var(--line); outline-offset: 0; }
.mel-postcard .blk.off .eye { opacity: 1; top: -13px; right: 0; }
@media (max-width: 900px) { .mel-share-full { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; } .mel-share-side { max-height: 46vh; border-left: 0; border-top: 1px solid var(--border-subtle, rgba(127,127,127,.15)); } }

/* ===== 主页左右分栏与瀑布流卡片 ===== */
.mel-home-split {
  display: grid;
  grid-template-columns: minmax(320px, 400px) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
}

/* 主页布局按插件区域宽度（.mel 的 data-w：xs < 640 ≤ s < 980 ≤ m < 1280 ≤ l）切换，不看整个窗口 */
.mel[data-w=s] .mel-home-split, .mel[data-w=xs] .mel-home-split {
  grid-template-columns: 1fr;
  gap: 28px;
}

.mel-home-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* 并排两栏时，左栏固定在顶部 */
.mel:is([data-w=m], [data-w=l]) .mel-home-left {
    position: sticky;
    top: calc(var(--dsh-frame-top-clearance, 48px) + 8px);
    max-height: calc(100vh - 72px);
    overflow-y: auto;
    padding-right: 6px;
  }
  .mel:is([data-w=m], [data-w=l]) .mel-home-left::-webkit-scrollbar {
    width: 4px;
  }
  .mel:is([data-w=m], [data-w=l]) .mel-home-left::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 4px;
  }

.mel-home-brand {
  margin-bottom: 4px;
}

.mel-cta-hero-box {
  background: color-mix(in srgb, var(--paper) 95%, transparent);
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}

.mel-btn-start-hero {
  border: none;
  background: linear-gradient(135deg, var(--ac), var(--ac2));
  color: #fff;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 18px 26px;
  border-radius: var(--rad-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all var(--dur-mid) var(--ease);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--ac) 28%, transparent);
}

.mel-btn-start-hero:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--ac) 42%, transparent);
  filter: brightness(1.04);
}

.mel-btn-start-hero:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.6);
}

.mel-cta-submeta {
  font-size: 12px;
  color: var(--t3);
  text-align: center;
  line-height: 1.6;
}

.mel-adv-box {
  background: color-mix(in srgb, var(--paper) 90%, transparent);
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-md);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mel-adv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: var(--t2);
  cursor: pointer;
  user-select: none;
}

.mel-adv-head:hover {
  color: var(--t1);
}

.mel-adv-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
  border-top: 1px dashed var(--border-subtle);
}

.mel-range-seg {
  display: inline-flex;
  background: color-mix(in srgb, var(--line) 20%, transparent);
  border-radius: var(--rad-full);
  padding: 3px;
  gap: 4px;
  width: fit-content;
}

.mel-range-seg button {
  border: none;
  background: transparent;
  color: var(--t2);
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--rad-full);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease);
}

.mel-range-seg button[aria-pressed=true] {
  background: var(--base);
  color: var(--t1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  font-weight: 500;
}

.mel-year-select {
  width: 100%;
  background: color-mix(in srgb, var(--paper) 95%, transparent);
  border: 1px solid var(--border-subtle);
  color: var(--t1);
  padding: 7px 10px;
  border-radius: var(--rad-sm);
  font-size: 13px;
}

.mel-home-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.mel-voices-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  gap: 12px;
}

.mel-voices-head h2 {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0;
  color: var(--t1);
}

.mel-voices-head p {
  font-size: 12px;
  color: var(--t3);
  margin: 2px 0 0;
}

.mel-waterfall-window {
  position: relative;
  height: calc(100vh - 160px);
  min-height: 560px;
  max-height: 840px;
  overflow: hidden;
  border-radius: var(--rad-lg);
  mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
}

.mel-waterfall-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  height: 100%;
}

.mel[data-w=xs] .mel-waterfall-cols {
  grid-template-columns: 1fr;
}
/* 上下排时，众声区高度按窗口给一个舒服的值，不再占满整屏 */
.mel[data-w=s] .mel-waterfall-window, .mel[data-w=xs] .mel-waterfall-window {
  height: 68vh;
  min-height: 420px;
  max-height: 720px;
}

.mel-waterfall-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
  backface-visibility: hidden;
}

.mel-col-1 {
  animation-name: mel-scroll-up-1;
  animation-duration: 55s;
}

.mel-col-2 {
  animation-name: mel-scroll-up-2;
  animation-duration: 65s;
}

@keyframes mel-scroll-up-1 {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

@keyframes mel-scroll-up-2 {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.mel-waterfall-window:hover .mel-waterfall-col {
  animation-play-state: paused;
}

.mel-voice-card {
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-md);
  padding: 18px 20px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  transition: border-color var(--dur-mid) var(--ease), box-shadow var(--dur-mid) var(--ease);
}

.mel-voice-card:hover {
  border-color: color-mix(in srgb, var(--ac) 60%, transparent);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

.mel-voice-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--t2);
  letter-spacing: 0.04em;
}

.mel-voice-name {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mel-voice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ac);
  display: inline-block;
}

.mel-voice-kind {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--rad-full);
  background: color-mix(in srgb, var(--ac) 12%, transparent);
  color: var(--ac);
}

.mel-voice-safety { margin-top: 10px; padding: 10px 12px; border-radius: var(--rad-md); font-size: 12px; line-height: 1.6; color: var(--t2); background: color-mix(in srgb, var(--ac) 8%, transparent); border: 1px solid color-mix(in srgb, var(--ac) 22%, transparent); }
.mel-voice-safety p { margin: 0 0 6px; }
.mel-voice-safety label { display: flex; gap: 8px; align-items: flex-start; color: var(--t1); cursor: pointer; }

.mel-voice-q {
  font-size: 11px;
  color: var(--t3);
  letter-spacing: 0.06em;
  margin-top: -4px;
}

.mel-modal-question {
  font-size: 13px;
  color: var(--ac);
  letter-spacing: 0.04em;
  margin: 4px 0 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-subtle);
}

.mel-voice-quote {
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.65;
  color: var(--t1);
  letter-spacing: 0.02em;
  margin: 2px 0;
}

.mel-voice-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--t3);
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
}

.mel-voice-read {
  color: var(--ac);
  font-weight: 500;
}

.mel-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.mel-modal-box {
  background: var(--paper);
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-lg);
  max-width: 640px;
  width: 100%;
  max-height: 84vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  padding: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mel-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.mel-modal-close {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--t2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: all var(--dur-fast) var(--ease);
}

.mel-modal-close:hover {
  color: var(--t1);
  border-color: var(--ac);
}

.mel-modal-quote-banner {
  background: color-mix(in srgb, var(--ac) 10%, transparent);
  border-left: 3px solid var(--ac);
  padding: 12px 16px;
  border-radius: 0 var(--rad-sm) var(--rad-sm) 0;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
  color: var(--t1);
}

.mel-modal-full-text {
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--t1);
  white-space: pre-wrap;
  word-break: break-word;
}

.mel-modal-disclaimer {
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  line-height: 1.6;
  color: var(--t3);
}

.mel-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mel-form-group label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--t2);
}

.mel-form-group input,
.mel-form-group textarea {
  width: 100%;
  background: color-mix(in srgb, var(--base) 80%, transparent);
  border: 1px solid var(--border-subtle);
  border-radius: var(--rad-sm);
  color: var(--t1);
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  box-sizing: border-box;
}

.mel-form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.mel-doc-card {
  max-width: 760px;
  margin: 0 auto 40px;
  line-height: 1.8;
  padding: 36px 40px;
}
.mel-doc-section {
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}
.mel-doc-h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--t1);
  letter-spacing: 0.02em;
}
.mel-doc-list {
  margin: 0;
  padding-left: 20px;
  color: var(--t1);
  font-size: 13.5px;
  line-height: 1.85;
}
.mel-doc-list li {
  margin-bottom: 8px;
}
.mel-doc-p {
  margin: 10px 0;
  color: var(--t1);
  font-size: 13.5px;
  line-height: 1.85;
}
.mel-doc-author-box {
  background: color-mix(in srgb, var(--paper) 65%, transparent);
  border-radius: var(--rad-md);
  padding: 18px 22px;
}

@media (prefers-reduced-motion: reduce) {
  .mel *, .mel *::before, .mel *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;

    function ensureStyle() {
      let tag = document.querySelector('style[data-plugin-css="dsh-plugin-melete"]')
      if (!tag) {
        tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-plugin-melete'
        tag.dataset.pluginCss = 'dsh-plugin-melete'
        document.head.appendChild(tag)
      }
      if (tag.textContent !== CSS) tag.textContent = CSS
    }

    // ---------- 与主机半侧通信 ----------
    async function api(path, body) {
      let res
      try {
        res = await fetch(API + path, body === undefined ? { headers: { accept: 'application/json' } } : {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
        })
      } catch (err) {
        throw Object.assign(new Error(err.message || 'network-error'), { code: 'network-error' })
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 202) throw Object.assign(new Error(data.error || String(res.status)), { code: data.error })
      return data
    }

    // ---------- 小组件 ----------
    function Icon({ size }) {
      // 一圈往回的箭头：复盘，把走过的棋重新摆一遍
      return h('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M4.5 7.5A6 6 0 1 1 4 12' }),
        h('path', { d: 'M4.5 3.5v4h4' }),
        h('circle', { cx: 10, cy: 10, r: 1.4, fill: 'currentColor', stroke: 'none' }))
    }
    const LockIcon = () => h('svg', { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, 'aria-hidden': true },
      h('rect', { x: 3, y: 7, width: 10, height: 7, rx: 1.5 }), h('path', { d: 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2' }))

    function Emblem({ style, term }) {
      return h('div', { className: 'mel-emblem' }, style === 'chinese'
        ? h('div', { className: 'mel-seal' }, term)
        : h('div', { className: 'mel-medal', 'data-glyph': style }, EMBLEM_GLYPH[style] || 'Μ'))
    }

    // ---------- 文明的建筑：用代码画出来的线描 ----------
    // 古希腊：台阶 → 立柱 → 额枋与三陇板 → 山花 → 太阳与星；中国古代：台基 → 立柱 → 斗拱 → 飞檐 → 上层 → 宝顶、月与云。
    // 每一笔带 data-s / data-e（0~1），背景随复盘记录往下滑而"长出来"；分享长图里画完整的一幅。
    function archSvgInner(style) {
      const out = []
      let layer = 'env'
      let extra = ''
      const f = n => Math.round(n * 10) / 10
      const L = (d, s, e, c) => out.push(`<path class="g ${layer}${extra} ${c || 'a1'}" pathLength="1" data-s="${s}" data-e="${e}" d="${d}"/>`)
      const C = (cx, cy, r, s, e, c) => out.push(`<circle class="g ${layer}${extra} ${c || 'a1'}" pathLength="1" data-s="${s}" data-e="${e}" cx="${cx}" cy="${cy}" r="${r}"/>`)
      const dot = (x, y, r, s) => out.push(`<circle class="star env" data-k="fade" data-s="${s}" data-e="${f(s + 0.06)}" cx="${x}" cy="${y}" r="${r}"/>`)
      const stars = [[120, 90, 1.6], [210, 160, 1.1], [330, 70, 1.3], [470, 120, 1], [760, 80, 1.4], [840, 150, 1], [1080, 110, 1.5], [1130, 240, 1.1], [60, 260, 1.2], [690, 40, 1]]
      if (style === 'chinese') {
        // 远山三层、水波
        ;[[560, 120, 0.4, 0], [610, 80, 1.9, 0.03], [650, 50, 3.1, 0.06]].forEach(([base, amp, p, s]) => {
          let d = ''
          for (let x = 0; x <= 1200; x += 12) {
            const ridge = Math.abs(Math.sin(x * 0.0055 + p)) * 0.72 + Math.abs(Math.sin(x * 0.017 + p * 1.7)) * 0.28
            d += `${x ? ' L' : 'M'}${x} ${f(base - ridge * amp)}`
          }
          L(d, s, f(s + 0.14), 'a2')
        })
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 40; x <= 1160; x += 16) d += `${x > 40 ? ' L' : 'M'}${x} ${f(722 + i * 20 + Math.sin(x * 0.02 + i * 2) * 3)}`
          L(d, 0.02 + i * 0.03, 0.14 + i * 0.03, 'a2 thin')
        }
        // 台基与台阶
        layer = 'bld'
        L('M330 700 L330 655 L870 655 L870 700', 0.05, 0.16)
        L('M318 655 L882 655', 0.08, 0.18)
        for (let i = 0; i < 4; i++) L(`M${556 - i * 6} ${700 - i * 11} L${644 + i * 6} ${700 - i * 11}`, 0.1 + i * 0.015, 0.2 + i * 0.015, 'a1 thin')
        // 一层立柱、栏杆
        ;[410, 530, 670, 790].forEach((x, i) => {
          const s = 0.18 + i * 0.03
          L(`M${x - 6} 655 L${x - 6} 470`, s, s + 0.18); L(`M${x + 6} 655 L${x + 6} 470`, s, s + 0.18)
        })
        L('M416 600 L524 600 M536 600 L664 600 M676 600 L784 600', 0.32, 0.42, 'a1 thin')
        L('M416 626 L524 626 M676 626 L784 626', 0.33, 0.43, 'a1 thin')
        for (let x = 430; x < 784; x += 18) if (x < 524 || x > 676) L(`M${x} 600 L${x} 626`, 0.36, 0.46, 'a1 thin')
        // 额枋、斗拱
        L('M380 470 L820 470 L820 452 L380 452 Z', 0.42, 0.5)
        for (let x = 400; x <= 800; x += 40) L(`M${x - 12} 452 L${x - 12} 444 L${x + 12} 444 L${x + 12} 452 M${x - 6} 444 L${x - 6} 437 L${x + 6} 437 L${x + 6} 444`, 0.46 + (x - 400) * 0.0002, 0.56, 'a1 thin')
        // 一层飞檐
        L('M262 400 Q300 432 380 436 L820 436 Q900 432 938 400', 0.52, 0.62)
        L('M262 400 Q252 386 268 380 M938 400 Q948 386 932 380', 0.6, 0.64)
        L('M380 436 Q452 404 500 362 L700 362 Q748 404 820 436', 0.55, 0.65)
        for (let i = 1; i < 8; i++) { const x = 380 + i * 55; L(`M${x} 436 L${f(500 + (x - 380) * 200 / 440)} 362`, 0.58, 0.66, 'a1 thin') }
        L('M488 362 L712 362 M488 362 Q474 358 478 342 M712 362 Q726 358 722 342', 0.62, 0.68)
        // 二层
        L('M545 362 L545 292 M655 362 L655 292', 0.66, 0.73)
        L('M520 292 L680 292 L680 280 L520 280 Z', 0.71, 0.76)
        L('M440 276 Q472 298 530 300 L670 300 Q728 298 760 276', 0.74, 0.82)
        L('M440 276 Q432 264 446 260 M760 276 Q768 264 754 260', 0.8, 0.84)
        L('M530 300 Q574 256 600 198 Q626 256 670 300', 0.77, 0.87)
        // 宝顶、月、云、雁
        L('M600 198 L600 166', 0.86, 0.9); C(600, 158, 8, 0.88, 0.92); C(600, 140, 4, 0.9, 0.93)
        layer = 'env'
        extra = ' deco'
        C(930, 172, 54, 0.88, 0.97); C(930, 172, 42, 0.92, 0.99, 'a2 thin')
        L('M136 236 q18 -28 48 -12 q14 -26 44 -10 q26 -12 34 14 q22 4 12 24 L136 252 q-16 -6 0 -16', 0.9, 1, 'a2')
        L('M1010 300 q14 -20 36 -9 q12 -18 34 -6 q18 -6 22 12 L1010 310 q-10 -4 0 -10', 0.92, 1, 'a2')
        L('M780 120 l10 6 l10 -6 M812 104 l8 5 l8 -5 M842 126 l7 4 l7 -4', 0.94, 1, 'a1 thin')
      } else if (style === 'babylonian') {
        // 幼发拉底河
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 16) d += `${x ? ' L' : 'M'}${x} ${f(726 + i * 20 + Math.sin(x * 0.022 + i * 1.3) * 3.5)}`
          L(d, 0.01 + i * 0.03, 0.13 + i * 0.03, 'a2')
        }
        // 四层塔庙（ziggurat），一层一层往上垒
        layer = 'bld'
        ;[[290, 910, 620, 700], [352, 848, 540, 620], [414, 786, 460, 540], [476, 724, 380, 460]].forEach(([x1, x2, y1, y2], i) => {
          const s = f(0.05 + i * 0.11)
          L(`M${x1} ${y2} L${x1 + 6} ${y1} L${x2 - 6} ${y1} L${x2} ${y2}`, s, f(s + 0.14))
          for (let y = y1 + 16; y < y2; y += 16) L(`M${x1 + 8} ${y} L552 ${y} M648 ${y} L${x2 - 8} ${y}`, f(s + 0.06), f(s + 0.16), 'a1 thin')
          for (let x = x1 + 34; x < x2 - 20; x += 44) if (x < 546 || x > 654) L(`M${x} ${y2} L${x} ${y1 + 3}`, f(s + 0.08), f(s + 0.18), 'a1 thin')
        })
        // 正中的大台阶
        L('M554 700 L580 380 M646 700 L620 380', 0.5, 0.62)
        for (let y = 688; y > 386; y -= 16) { const k = (700 - y) / 320; L(`M${f(554 + 26 * k)} ${y} L${f(646 - 26 * k)} ${y}`, f(0.54 + (688 - y) * 0.0004), 0.68, 'a1 thin') }
        // 顶上的神殿与阶梯状雉堞
        L('M540 380 L540 316 L660 316 L660 380', 0.64, 0.74)
        L('M584 380 L584 346 A16 16 0 0 1 616 346 L616 380', 0.7, 0.78)
        let cren = 'M536 316'
        for (let x = 536; x < 664; x += 16) cren += ` L${x} 304 L${x + 4} 304 L${x + 4} 294 L${x + 12} 294 L${x + 12} 304 L${x + 16} 304 L${x + 16} 316`
        L(cren, 0.76, 0.86)
        // 新月、沙玛什之星、椰枣树
        layer = 'env'
        extra = ' deco'
        L('M944 122 A52 52 0 1 0 1000 214 A42 42 0 1 1 944 122', 0.86, 0.95)
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 14 : 24; L(`M850 112 L${f(850 + Math.cos(a) * r)} ${f(112 + Math.sin(a) * r)}`, f(0.9 + i * 0.006), f(0.95 + i * 0.006)) }
        extra = ''
        ;[[150, 1], [1050, -1]].forEach(([x, k], i) => {
          L(`M${x} 712 Q${x + 12 * k} 610 ${x} 520`, f(0.88 + i * 0.02), f(0.95 + i * 0.02), 'a2')
          L(`M${x} 520 Q${x - 40} 500 ${x - 70} 530 M${x} 520 Q${x + 40} 500 ${x + 70} 530 M${x} 520 Q${x - 26} 480 ${x - 52} 478 M${x} 520 Q${x + 26} 480 ${x + 52} 478 M${x} 520 Q${x + 4} 486 ${x + 4} 460`, f(0.92 + i * 0.02), f(0.99), 'a2 thin')
        })
      } else if (style === 'egyptian') {
        // 尼罗河与远处的金字塔
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 16) d += `${x ? ' L' : 'M'}${x} ${f(728 + i * 20 + Math.sin(x * 0.026 + i * 2.1) * 3)}`
          L(d, 0.01 + i * 0.03, 0.13 + i * 0.03, 'a2')
        }
        L('M30 704 L160 566 L290 704 M160 566 L196 704', 0.03, 0.15, 'a2')
        L('M910 704 L1040 552 L1170 704 M1040 552 L1008 704', 0.05, 0.17, 'a2')
        // 吉萨大金字塔：一层层石块往上垒，最后放上塔尖
        layer = 'bld'
        L('M250 700 L950 700', 0.03, 0.1)
        L('M300 700 L600 236 M900 700 L600 236', 0.08, 0.6)
        for (let y = 678, n = 0; y > 262; y -= 22, n++) {
          const k = (700 - y) / 464, xl = 300 + 300 * k, xr = 900 - 300 * k
          L(`M${f(xl)} ${y} L${f(xr)} ${y}`, f(0.08 + n * 0.026), f(0.16 + n * 0.026), 'a1 thin')
        }
        L('M588 590 L588 566 L612 566 L612 590 M592 566 L600 556 L608 566', 0.62, 0.7, 'a1 thin')
        L('M582 264 L600 236 L618 264 Z', 0.78, 0.86)
        L('M600 236 L600 218 M592 226 L600 214 L608 226', 0.84, 0.9, 'a1 thin')
        // 两座方尖碑
        L('M226 700 L233 470 L247 470 L254 700 M233 470 L240 448 L247 470 M946 700 L953 470 L967 470 L974 700 M953 470 L960 448 L967 470', 0.66, 0.82)
        L('M240 500 L240 680 M960 500 L960 680', 0.74, 0.86, 'a1 thin')
        // 太阳与飞鸟
        layer = 'env'
        extra = ' deco'
        C(980, 168, 46, 0.86, 0.95)
        for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.0875); L(`M${f(980 + Math.cos(a) * 58)} ${f(168 + Math.sin(a) * 58)} L${f(980 + Math.cos(a) * 82)} ${f(168 + Math.sin(a) * 82)}`, f(0.9 + i * 0.004), f(0.95 + i * 0.004), 'a1 thin') }
        L('M180 200 l12 8 l12 -8 M214 180 l10 6 l10 -6 M244 206 l8 5 l8 -5', 0.94, 1, 'a1 thin')
      } else if (style === 'indian') {
        // 莲池
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 16) d += `${x ? ' L' : 'M'}${x} ${f(728 + i * 20 + Math.sin(x * 0.02 + i * 1.6) * 3)}`
          L(d, 0.01 + i * 0.03, 0.13 + i * 0.03, 'a2')
        }
        // 台基、栏楯
        layer = 'bld'
        L('M320 700 L880 700 M332 700 L332 652 L868 652 L868 700', 0.04, 0.16)
        L('M338 640 L862 640 M338 626 L862 626', 0.14, 0.24, 'a1 thin')
        for (let x = 346; x <= 856; x += 26) L(`M${x} 652 L${x} 618`, f(0.16 + (x - 346) * 0.0002), 0.3, 'a1 thin')
        // 鼓座与覆钵（anda）
        L('M372 618 L828 618 L828 590 L372 590 Z', 0.26, 0.34)
        L('M390 590 A210 210 0 0 1 810 590', 0.32, 0.54)
        L('M430 590 A170 170 0 0 1 770 590', 0.4, 0.56, 'a1 thin')
        // 平头与三重伞盖
        L('M562 380 L562 348 L638 348 L638 380 M562 364 L638 364 M581 348 L581 380 M600 348 L600 380 M619 348 L619 380', 0.54, 0.62)
        L('M600 348 L600 246 M556 334 Q600 318 644 334 M566 304 Q600 290 634 304 M578 274 Q600 262 622 274', 0.6, 0.74)
        // 两座塔门（torana）
        ;[[210, 290], [910, 990]].forEach(([a, b], i) => {
          const s = f(0.64 + i * 0.03)
          L(`M${a} 700 L${a} 400 M${b} 700 L${b} 400`, s, f(s + 0.12))
          ;[400, 432, 464].forEach((y, j) => L(`M${a - 30} ${y + 6} Q${a - 34} ${y - 6} ${a - 22} ${y - 4} L${b + 22} ${y - 4} Q${b + 34} ${y - 6} ${b + 30} ${y + 6} M${a - 22} ${y + 8} L${b + 22} ${y + 8}`, f(s + 0.1 + j * 0.03), f(s + 0.18 + j * 0.03)))
          L(`M${(a + b) / 2} 396 L${(a + b) / 2} 376 M${(a + b) / 2 - 10} 382 L${(a + b) / 2} 372 L${(a + b) / 2 + 10} 382`, f(s + 0.18), f(s + 0.22), 'a1 thin')
        })
        // 太阳、莲花、飞鸟
        layer = 'env'
        extra = ' deco'
        C(980, 160, 44, 0.86, 0.95); C(980, 160, 56, 0.9, 0.97, 'a2 thin')
        extra = ''
        ;[130, 250, 950, 1070].forEach((x, i) => L(`M${x - 18} 718 Q${x - 14} 700 ${x} 694 Q${x + 14} 700 ${x + 18} 718 M${x - 8} 718 Q${x} 690 ${x + 8} 718 M${x - 26} 720 Q${x} 728 ${x + 26} 720`, f(0.9 + i * 0.02), f(0.96 + i * 0.01), 'a1 thin'))
        extra = ' deco'
        L('M760 120 l10 6 l10 -6 M792 102 l8 5 l8 -5 M822 124 l7 4 l7 -4', 0.94, 1, 'a1 thin')
      } else if (style === 'roman') {
        // 七丘与台伯河
        let hills = 'M0 640'
        for (let i = 0; i < 7; i++) { const x = i * 172; hills += ` Q${x + 86} ${f(560 + (i % 3) * 18)} ${x + 172} 640` }
        L(hills, 0, 0.14, 'a2')
        for (let i = 0; i < 2; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 16) d += `${x ? ' L' : 'M'}${x} ${f(732 + i * 22 + Math.sin(x * 0.024 + i * 1.9) * 3)}`
          L(d, 0.02 + i * 0.03, 0.14 + i * 0.03, 'a2')
        }
        // 圆形剧场的立面：三层拱廊，一层一层往上
        layer = 'bld'
        L('M250 700 L950 700 L950 688 L250 688 Z', 0.03, 0.12)
        const xs = Array.from({ length: 9 }, (_, i) => 270 + i * 82.5)
        ;[[688, 560], [560, 436], [436, 316]].forEach(([yb, yt], k) => {
          const s = f(0.12 + k * 0.2)
          L(`M262 ${yt + 8} L938 ${yt + 8} M258 ${yt} L942 ${yt}`, f(s + 0.08), f(s + 0.16))
          L(xs.map(x => `M${f(x)} ${yb} L${f(x)} ${yt + 8}`).join(' '), s, f(s + 0.14))
          const arches = []
          for (let i = 0; i < 8; i++) {
            const xl = f(xs[i] + 13), xr = f(xs[i + 1] - 13), r = f((xr - xl) / 2), ys = yb - 64
            arches.push(`M${xl} ${yb} L${xl} ${ys} A${r} ${r} 0 0 1 ${xr} ${ys} L${xr} ${yb}`)
          }
          L(arches.join(' '), f(s + 0.06), f(s + 0.2))
        })
        // 顶层阁楼、方窗与遮阳篷的桅杆
        L('M262 316 L262 262 L938 262 L938 316', 0.76, 0.84)
        L(xs.slice(0, 8).filter((_, i) => i % 2 === 0).map(x => `M${f(x + 34)} 296 L${f(x + 34)} 280 L${f(x + 48)} 280 L${f(x + 48)} 296 Z`).join(' '), 0.8, 0.86, 'a1 thin')
        L('M254 262 L946 262 L946 252 L254 252 Z', 0.82, 0.88)
        L(xs.map(x => `M${f(x)} 252 L${f(x)} 230`).join(' '), 0.85, 0.9, 'a1 thin')
        // 太阳、月桂与柏树
        layer = 'env'
        extra = ' deco'
        C(980, 166, 48, 0.86, 0.95)
        L('M920 230 Q980 262 1040 230', 0.9, 0.96, 'a2')
        for (let i = 0; i < 5; i++) { const x = 932 + i * 24, y = 238 + Math.abs(2 - i) * -4 + 10; L(`M${x} ${y} q-6 -12 2 -20 M${x} ${y} q10 -8 16 -2`, f(0.92 + i * 0.01), 0.98, 'a2 thin') }
        extra = ''
        ;[120, 168, 1032, 1080].forEach((x, i) => L(`M${x} 640 Q${x - 18} 560 ${x} ${470 - (i % 2) * 30} Q${x + 18} 560 ${x} 640`, f(0.9 + i * 0.02), f(0.96 + i * 0.01), 'a2'))
      } else if (style === 'maya') {
        // 热带雨林冠层与天坑（Cenote）水波
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 18) d += `${x ? ' L' : 'M'}${x} ${f(724 + i * 20 + Math.sin(x * 0.025 + i * 1.8) * 3.5)}`
          L(d, 0.02 + i * 0.03, 0.14 + i * 0.03, 'a2')
        }
        // 雨林树冠天际线
        ;[[660, 50, 0.5, 0], [680, 30, 2.2, 0.04]].forEach(([base, amp, p, s]) => {
          let d = ''
          for (let x = 0; x <= 1200; x += 20) {
            const crown = Math.sin(x * 0.02 + p) * 0.6 + Math.cos(x * 0.05 + p) * 0.4
            d += `${x ? ' L' : 'M'}${x} ${f(base - crown * amp)}`
          }
          L(d, s, f(s + 0.14), 'a2')
        })
        // 奇琴伊察库库尔坎金字塔（九层阶梯平台）
        layer = 'bld'
        const tiers = 9
        for (let i = 0; i < tiers; i++) {
          const y1 = 700 - i * 28, y2 = 700 - (i + 1) * 28
          const x1 = 340 + i * 18, x2 = 860 - i * 18
          const tx1 = 340 + (i + 1) * 18, tx2 = 860 - (i + 1) * 18
          L(`M${x1} ${y1} L${tx1} ${y2} L${tx2} ${y2} L${x2} ${y1}`, 0.06 + i * 0.04, 0.18 + i * 0.04)
        }
        // 中央登庙神阶
        L('M565 700 L580 448 M635 700 L620 448', 0.42, 0.55)
        for (let i = 0; i <= 18; i++) {
          const t = i / 18, y = 700 - t * 252
          const lx = 565 + t * 15, rx = 635 - t * 15
          L(`M${f(lx)} ${f(y)} L${f(rx)} ${f(y)}`, 0.44 + t * 0.15, 0.52 + t * 0.15, 'a1 thin')
        }
        // 羽蛇神首饰基石（阶梯底端的库库尔坎蛇首）
        L('M560 700 Q552 688 565 684 M640 700 Q648 688 635 684', 0.6, 0.68)
        // 顶层神殿与三重石门
        L('M530 448 L530 380 L670 380 L670 448', 0.64, 0.74)
        L('M520 380 L680 380 L680 366 L520 366 Z', 0.72, 0.78)
        L('M540 366 L660 366 L660 354 L540 354 Z', 0.76, 0.82, 'a1 thin')
        ;[550, 590, 630].forEach((x, i) => {
          L(`M${x} 448 L${x} 408 L${x + 20} 408 L${x + 20} 448`, 0.78 + i * 0.03, 0.86 + i * 0.03)
        })
        // 雨林双翼的棕榈树剪影
        layer = 'env'
        extra = ' deco'
        ;[140, 200, 1000, 1060].forEach((x, i) => {
          const s = 0.86 + i * 0.025
          L(`M${x} 700 Q${x + (i < 2 ? -15 : 15)} 580 ${x} 500`, s, s + 0.08, 'a2')
          for (let fwd of [-1, 1]) {
            L(`M${x} 500 Q${x + fwd * 40} 480 ${x + fwd * 60} 510`, s + 0.02, s + 0.09, 'a2 thin')
            L(`M${x} 500 Q${x + fwd * 35} 460 ${x + fwd * 50} 480`, s + 0.03, s + 0.1, 'a2 thin')
          }
        })
        extra = ''
      } else if (style === 'inca') {
        // 安第斯瓦纳比丘峰与群山轮廓
        L('M200 700 L380 460 L480 540 L580 230 Q600 200 620 230 L740 500 L880 430 L1020 700', 0.02, 0.22, 'a2')
        L('M580 230 L600 320 L620 230', 0.18, 0.26, 'a2 thin')
        ;[[380, 460, 410, 520], [740, 500, 770, 560], [880, 430, 910, 510]].forEach(([x1, y1, x2, y2], i) => {
          L(`M${x1} ${y1} L${x2} ${y2}`, 0.2 + i * 0.02, 0.28 + i * 0.02, 'a2 thin')
        })
        // 乌鲁班巴河水谷
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 18) d += `${x ? ' L' : 'M'}${x} ${f(724 + i * 20 + Math.sin(x * 0.02 + i * 2) * 3)}`
          L(d, 0.04 + i * 0.03, 0.16 + i * 0.03, 'a2')
        }
        // 马丘比丘层叠农业梯田（Andenes）
        layer = 'bld'
        ;[[260, 940, 700, 665], [290, 910, 665, 630], [330, 870, 630, 595], [370, 830, 595, 560], [420, 780, 560, 525]].forEach(([x1, x2, y1, y2], i) => {
          const s = 0.18 + i * 0.06
          L(`M${x1} ${y1} L${x1 + 20} ${y2} L${x2 - 20} ${y2} L${x2} ${y1}`, s, s + 0.12)
          for (let x = x1 + 50; x < x2 - 40; x += 60) {
            L(`M${x} ${y1} L${x + 10} ${y2}`, s + 0.04, s + 0.1, 'a1 thin')
          }
        })
        // 太阳神庙弧形石墙与拴日石平台（Torreón & Intihuatana）
        L('M470 525 Q520 450 600 450 Q680 450 730 525', 0.52, 0.64)
        L('M480 450 L720 450 L720 410 L480 410 Z', 0.62, 0.72)
        // 经典印加梯形窗与梯形石门（上窄下宽）
        ;[520, 590, 660].forEach((x, i) => {
          L(`M${x - 8} 450 L${x - 6} 420 L${x + 6} 420 L${x + 8} 450 Z`, 0.72 + i * 0.03, 0.8 + i * 0.03)
        })
        // 顶层尖峰处的仪式石台
        L('M575 410 L585 365 L615 365 L625 410', 0.8, 0.88)
        L('M595 365 L595 340 L605 340 L605 365', 0.86, 0.92)
      } else {
        // 爱琴海的波
        for (let i = 0; i < 3; i++) {
          let d = ''
          for (let x = 0; x <= 1200; x += 16) d += `${x ? ' L' : 'M'}${x} ${f(724 + i * 20 + Math.sin(x * 0.03 + i * 1.7) * 4)}`
          L(d, 0.01 + i * 0.03, 0.13 + i * 0.03, 'a2')
        }
        // 三级台阶
        layer = 'bld'
        ;[[240, 960, 680, 700], [262, 938, 660, 680], [284, 916, 640, 660]].forEach(([x1, x2, y1, y2], i) =>
          L(`M${x1} ${y2} L${x1} ${y1} L${x2} ${y1} L${x2} ${y2}`, 0.03 + i * 0.04, 0.14 + i * 0.04))
        // 六根多立克柱
        for (let i = 0; i < 6; i++) {
          const cx = 330 + i * 108, s = 0.16 + i * 0.035, e = s + 0.24, yb = 640, yt = 372
          L(`M${cx - 24} ${yb} L${cx - 21} ${yt}`, s, e); L(`M${cx + 24} ${yb} L${cx + 21} ${yt}`, s, e)
          L(`M${cx - 8} ${yb} L${cx - 7} ${yt + 4}`, s + 0.02, e, 'a1 thin'); L(`M${cx + 8} ${yb} L${cx + 7} ${yt + 4}`, s + 0.02, e, 'a1 thin')
          L(`M${cx - 21} ${yt} Q${cx - 30} ${yt - 4} ${cx - 32} ${yt - 14} L${cx + 32} ${yt - 14} Q${cx + 30} ${yt - 4} ${cx + 21} ${yt} M${cx - 34} ${yt - 14} L${cx - 34} ${yt - 24} L${cx + 34} ${yt - 24} L${cx + 34} ${yt - 14}`, f(e - 0.03), f(e + 0.05))
        }
        // 额枋、三陇板、檐口
        L('M280 348 L920 348 L920 318 L280 318 Z', 0.56, 0.64)
        for (let k = 0; k <= 10; k++) { const x = 330 + k * 54; L(`M${x - 7} 314 L${x - 7} 288 M${x} 314 L${x} 288 M${x + 7} 314 L${x + 7} 288`, f(0.6 + k * 0.008), f(0.68 + k * 0.006), 'a1 thin') }
        L('M280 318 L280 282 M920 318 L920 282', 0.6, 0.66)
        L('M268 282 L932 282 L932 272 L268 272 Z', 0.66, 0.74)
        // 山花与顶饰
        L('M268 272 L600 166 L932 272', 0.7, 0.84)
        L('M320 262 L600 182 L880 262 Z', 0.74, 0.86, 'a1 thin')
        L('M600 166 L600 146 M600 150 Q590 140 586 128 M600 150 Q610 140 614 128 M268 272 L256 256 M932 272 L944 256', 0.84, 0.9)
        // 太阳、月桂
        layer = 'env'
        extra = ' deco'
        C(980, 172, 56, 0.86, 0.95)
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6
          L(`M${f(980 + Math.cos(a) * 70)} ${f(172 + Math.sin(a) * 70)} L${f(980 + Math.cos(a) * 86)} ${f(172 + Math.sin(a) * 86)}`, f(0.9 + i * 0.004), f(0.95 + i * 0.004), 'a1 thin')
        }
        L('M150 300 Q190 220 270 190', 0.9, 0.98, 'a2')
        for (let i = 0; i < 6; i++) { const x = 160 + i * 18, y = 280 - i * 15; L(`M${x} ${y} q-14 -6 -18 -20 M${x} ${y} q12 -10 26 -8`, f(0.92 + i * 0.01), f(0.97 + i * 0.005), 'a2 thin') }
      }
      stars.forEach(([x, y, r], i) => dot(x, y, r, f(0.9 + i * 0.008)))
      return out.join('')
    }

    // 分享长图的装饰带：古希腊回纹（meander），中国古代回字纹
    function ornamentSvg(style, width) {
      const u = 28, n = Math.floor(width / u)
      let d = `M0 1 L${n * u} 1 M0 27 L${n * u} 27`
      for (let i = 0; i < n; i++) {
        const x = i * u
        d += style === 'chinese'
          ? ` M${x + 4} 22 L${x + 4} 6 L${x + 24} 6 L${x + 24} 22 L${x + 10} 22 L${x + 10} 12 L${x + 18} 12 L${x + 18} 17`
          : style === 'babylonian' ? ` M${x} 22 L${x} 14 L${x + 6} 14 L${x + 6} 8 L${x + 14} 8 L${x + 14} 14 L${x + 20} 14 L${x + 20} 22`
          : style === 'egyptian' ? ` M${x + 4} 24 L${x + 4} 12 Q${x + 10} 2 ${x + 16} 12 L${x + 16} 24 M${x + 10} 16 L${x + 10} 20`
          : style === 'indian' ? ` M${x} 22 Q${x + 7} 4 ${x + 14} 22 Q${x + 21} 4 ${x + 28} 22`
          : style === 'roman' ? ` M${x} 18 C${x + 6} 4 ${x + 18} 4 ${x + 18} 14 C${x + 18} 20 ${x + 10} 20 ${x + 10} 14`
          : style === 'maya' ? ` M${x} 22 L${x} 6 L${x + 22} 6 L${x + 22} 16 L${x + 10} 16 L${x + 10} 10 L${x + 16} 10`
          : style === 'inca' ? ` M${x} 22 L${x + 7} 6 L${x + 14} 22 L${x + 21} 6 L${x + 28} 22 M${x + 7} 14 L${x + 21} 14`
          : ` M${x} 22 L${x} 6 L${x + 20} 6 L${x + 20} 18 L${x + 8} 18 L${x + 8} 12 L${x + 14} 12`
      }
      return `<svg class="pc-orn" width="${n * u}" height="28" viewBox="0 0 ${n * u} 28" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    }

    // ---------- 背景里的生机：云、动物、人、日月（2026-11-08 发起人要求） ----------
    // 一开始就画全，不随滚动生长；鼠标靠近时：云被拨开，动物和人跑开，鸟飞走，过一会儿慢慢回到原处。
    const LIFE_SHAPES = {
      cloud: 'M-50 0 Q-54 -18 -32 -20 Q-28 -38 -6 -34 Q6 -50 26 -36 Q48 -40 48 -18 Q62 -12 54 0 Z',
      xiangyun: 'M-40 0 Q-46 -14 -30 -16 Q-30 -30 -14 -28 Q-6 -40 10 -30 Q24 -36 28 -22 Q42 -22 40 -8 Q46 0 36 2 L-36 2 Q-44 2 -40 0 M-14 -14 Q-6 -20 0 -12 Q4 -6 -2 -4',
      bird: 'M-10 0 Q-5 -7 0 0 Q5 -7 10 0',
      person: 'M-4 -34 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M0 -30 L0 -14 M0 -25 L-7 -17 M0 -25 L7 -18 M0 -14 L-6 0 M0 -14 L6 0',
      robed: 'M-4 -34 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-3 -29 L-8 0 L8 0 L3 -29 Z M-2 -24 L-9 -15 M2 -24 L9 -16',
      dolphin: 'M-26 0 Q-10 -20 14 -9 Q22 -7 26 -12 M14 -9 Q18 -1 26 1 M-3 -13 L1 -21 L5 -12 M-26 0 L-32 -6 M-26 0 L-32 5',
      sailboat: 'M-30 0 L30 0 L22 10 L-22 10 Z M0 0 L0 -52 L26 -6 Z M0 -46 L-20 -8 L0 -8',
      crane: 'M-22 -14 Q-2 -24 18 -16 Q8 -8 -14 -10 Z M14 -17 Q20 -30 22 -42 L28 -42 M-2 -11 L-4 2 M4 -11 L6 2',
      fisher: 'M-32 0 Q0 12 32 0 M8 0 L8 -16 M5 -20 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M8 -12 L28 -32',
      deer: 'M-20 0 L-18 -16 Q0 -22 14 -16 L14 0 M14 -16 L20 -28 L24 -26 M20 -28 L18 -36 M20 -28 L26 -34 M-18 -16 L-24 -14 M-4 -18 L-4 0',
      lion: 'M-24 0 L-22 -14 Q-8 -18 7 -16 M-14 -15 L-14 0 M0 -16 L0 0 M14 -11 L16 0 M-22 -14 Q-32 -20 -34 -10 L-30 -8 M7 -16 L4 -20 L7 -24 L5 -28 L10 -30 L12 -34 L17 -31 L22 -34 L23 -29 L28 -28 L26 -23 L30 -20 L25 -17 L26 -12 L20 -12 L18 -9 L14 -11 L10 -9 Z M14 -24 Q20 -25 22 -19 Q22 -15 17 -15',
      camel: 'M-24 0 L-22 -18 Q-16 -32 -8 -18 Q0 -32 8 -18 L18 -20 L24 -32 L30 -30 L24 -16 L22 0 M-10 -16 L-10 0 M10 -16 L10 0',
      reedboat: 'M-34 -6 Q0 12 34 -6 M-34 -6 Q-36 -12 -30 -14 M34 -6 Q36 -12 30 -14 M-8 0 L-8 -16 M-11 -20 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      elephant: 'M-26 0 L-26 -18 Q-26 -34 -6 -34 Q14 -34 16 -24 Q24 -20 24 -8 Q26 0 22 4 M16 -24 L16 0 M-16 -8 L-16 0 M-4 -8 L-4 0 M-26 -16 L-30 -10',
      peacock: 'M-6 0 L-6 -10 Q-6 -20 4 -20 L6 -30 L8 -30 L8 -20 M-6 -10 Q-34 -20 -36 -46 M-6 -10 Q-28 -30 -20 -52 M-6 -10 Q-18 -36 -2 -54 M-39 -46 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M-23 -52 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      duck: 'M-12 0 Q-12 -10 0 -10 L6 -16 Q12 -18 12 -12 L16 -12 L10 -8 Q14 0 4 2 Z',
      felucca: 'M-30 0 Q0 10 30 0 M-4 0 L-4 -46 M-24 -6 L16 -52 L-4 -6',
      ibis: 'M-16 -18 Q-4 -27 8 -20 Q0 -12 -14 -14 Z M-16 -18 L-23 -15 M6 -20 Q12 -26 12 -34 Q12 -40 18 -38 Q24 -34 26 -24 M-4 -14 L-6 0 M2 -15 L4 0',
      cat: 'M-14 0 Q-16 -14 -4 -16 L-6 -24 L-1 -19 L3 -24 L2 -15 Q12 -10 10 0 M10 -2 Q22 -4 20 -16',
      horse: 'M-24 0 L-22 -14 Q-6 -20 12 -16 L18 -28 L24 -30 L26 -24 L20 -14 L20 0 M-22 -14 Q-32 -14 -32 -2 M-8 -16 L-8 0 M6 -16 L6 0',
      eagle: 'M-26 -4 Q-12 -16 0 -4 Q12 -16 26 -4 M0 -4 L0 6 M-4 6 L4 6',
      wolf: 'M-24 0 L-22 -12 Q-6 -16 10 -14 L18 -22 L20 -16 L28 -14 L20 -8 L18 0 M-22 -12 Q-30 -6 -36 -10 M-14 -12 L-14 0 M8 -14 L8 0',
    }
    // 各地文化的人物、船只和日月（2026-11-08 发起人要求"参考该地区的文化来绘制"）；人物都朝右，跑开时左右翻转
    const CULTURE_SHAPES = {
      // 古希腊：披希玛纯长袍、手持卷轴的人；带桨的帆船
      greekPerson: 'M-4 -38 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-6 -32 L-9 0 L9 0 L6 -32 Z M-6 -30 L8 -12 M5 -28 L13 -22 M12 -26 L18 -26 L18 -19 L12 -19 Z',
      greekShip: 'M-34 0 Q0 8 30 0 L36 -6 M-34 0 L-38 -8 M0 0 L0 -40 M-14 -36 L14 -36 L12 -12 L-12 -12 Z M-24 2 L-28 10 M-14 4 L-18 12 M-4 4 L-8 12 M6 4 L2 12 M16 3 L12 11 M24 -2 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
      // 中国古代：戴幞头、穿宽袖长袍的人；戴斗笠的渔翁
      chinesePerson: 'M-4 -36 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-5 -43 L5 -43 L5 -40 L-5 -40 Z M5 -42 L14 -44 M-5 -42 L-14 -44 M-4 -32 L-10 0 L10 0 L4 -32 Z M-4 -28 Q-17 -22 -12 -12 L-6 -14 M4 -28 Q17 -22 12 -12 L6 -14 M-6 -18 L6 -18',
      chineseFisher: 'M-32 0 Q0 12 32 0 M8 0 L8 -16 M5 -20 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M1 -22 L8 -29 L15 -22 Z M8 -12 L28 -32 M28 -32 Q32 -20 30 -8',
      // 古巴比伦：戴尖顶帽、留长须、穿流苏袍的人；圆形芦苇船（guffa）
      babylonianPerson: 'M-4 -34 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-5 -37 L0 -50 L5 -37 Z M-3 -31 L-2 -24 L3 -24 L4 -31 M-6 -26 L-9 0 L9 0 L6 -26 Z M-7 -8 L-7 -1 M-3 -8 L-3 -1 M1 -8 L1 -1 M5 -8 L5 -1 M5 -22 L12 -16',
      guffa: 'M-22 -4 Q-24 8 0 10 Q24 8 22 -4 Z M-22 -4 L22 -4 M-14 -4 L-12 8 M-4 -4 L-4 10 M6 -4 L6 10 M14 -4 L12 8 M-2 -4 L-2 -18 M-5 -22 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M-2 -12 L12 -6 L22 6',
      // 古印度：穿纱丽、头顶水罐的人
      indianPerson: 'M-4 -34 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-6 -40 Q-7 -48 0 -48 Q7 -48 6 -40 Z M-3 -48 L3 -48 M4 -28 L9 -37 L5 -41 M-4 -30 L-9 0 L9 0 L4 -30 Z M-4 -30 L8 -14 M-7 -10 L7 -10',
      // 古埃及：侧身迈步、戴条纹头巾、穿短裙的人
      egyptianPerson: 'M-1 -36 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-2 -40 L7 -40 L8 -34 L6 -26 M-2 -40 L-4 -30 M-3 -37 L-4 -32 M3 -32 L3 -18 M3 -28 L-6 -18 M3 -28 L11 -20 M-4 -18 L9 -18 L7 -10 L-2 -10 Z M1 -10 L-6 0 M5 -10 L11 0',
      // 古罗马：穿托加、戴月桂冠的人；方帆船
      romanPerson: 'M-4 -36 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-5 -38 l-3 -2 M-4 -41 l-3 -3 M5 -38 l3 -2 M4 -41 l3 -3 M-5 -31 L-9 0 L9 0 L5 -31 Z M-5 -31 Q4 -22 9 -8 M5 -26 L12 -20',
      // 各地古代最有名、寓意好的动物
      owl: 'M-10 0 Q-13 -22 0 -24 Q13 -22 10 0 Q0 5 -10 0 Z M-7 -23 L-9 -30 L-3 -24 M7 -23 L9 -30 L3 -24 M-6 -15 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M1 -15 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M0 -11 L1 -8',
      carp: 'M-22 0 Q-6 -12 14 -4 Q20 -2 22 0 Q20 2 14 4 Q-6 12 -22 0 Z M-22 0 L-30 -8 L-28 0 L-30 8 Z M10 -2 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M-4 -8 Q-2 -12 4 -10',
      bull: 'M-24 0 L-24 -14 Q-22 -23 -4 -23 Q10 -23 14 -17 L23 -12 Q27 -10 25 -4 L19 -6 L16 0 M-16 -14 L-16 0 M-8 -14 L-8 0 M4 -15 L4 0 M18 -15 Q21 -26 29 -25 M21 -12 Q27 -19 32 -17 M-24 -12 Q-31 -8 -29 0 M-10 -23 Q-4 -27 2 -23',
      hamsa: 'M-16 0 Q-18 -10 -4 -10 Q6 -10 8 -4 Q6 -14 8 -22 Q10 -28 16 -26 L20 -24 L15 -23 Q12 -18 14 -8 Q16 0 4 2 Z M-12 -6 Q-4 -4 2 -6',
      falcon: 'M-28 -6 Q-14 -12 -4 -4 L0 -8 L4 -4 Q14 -12 28 -6 Q14 -4 6 2 L4 10 L0 6 L-4 10 L-6 2 Q-14 -4 -28 -6 Z',
      romanShip: 'M-34 0 Q0 8 30 0 Q38 -4 36 -14 M-34 0 L-38 -10 M0 0 L0 -44 M-16 -40 L16 -40 L14 -14 L-14 -14 Z M-8 -34 L8 -34 M-20 2 L-24 10 M-8 4 L-12 12 M4 4 L0 12 M16 3 L12 11',
      // 玛雅：羽冠祭司、美洲豹、格查尔鸟（凤尾绿咬鹃）
      mayaPerson: 'M-4 -36 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-6 -40 Q-4 -54 2 -52 Q8 -50 4 -40 M-3 -40 Q6 -58 14 -50 Q16 -42 7 -39 M-5 -31 L-9 0 L9 0 L5 -31 Z M-5 -26 L5 -26 M-4 -20 L4 -20 M-5 -30 L-12 -18 M4 -30 L11 -18 M11 -18 L16 -18 L16 -12 L11 -12 Z',
      jaguar: 'M-26 0 L-24 -14 Q-12 -18 10 -16 L18 -26 L23 -28 L25 -22 L20 -13 L20 0 M-24 -14 Q-34 -18 -32 -4 L-28 -2 M-14 -15 L-14 0 M0 -16 L0 0 M14 -13 L14 0 M-8 -12 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M2 -10 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M-16 -8 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0',
      quetzal: 'M-10 -14 Q2 -20 14 -14 Q8 -6 -6 -8 Z M12 -15 Q16 -24 22 -24 L24 -20 M-8 -8 Q-14 4 -12 24 Q-10 12 -6 -6 M-6 -8 Q-10 8 -8 30 Q-6 16 -4 -6',
      // 印加：戴耳罩毡帽（chullo）与穿条纹无袖袍（unku）的人、美洲驼（羊驼）、安第斯神鹰
      incaPerson: 'M-4 -36 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-6 -39 L0 -48 L6 -39 M-6 -39 L-6 -33 M6 -39 L6 -33 M-6 -31 L-8 0 L8 0 L6 -31 Z M-7 -20 L7 -20 M-7 -14 L7 -14 M-6 -26 L-12 -16 M6 -26 L10 -16',
      llama: 'M-20 0 L-18 -16 Q-6 -20 8 -18 L12 -34 L16 -44 L19 -43 L17 -34 L18 -18 L16 0 M15 -44 L14 -49 M17 -43 L18 -48 M-18 -16 L-24 -14 M-6 -18 L-6 0 M6 -18 L6 0',
      condor: 'M-32 -6 Q-18 -22 0 -6 Q18 -22 32 -6 Q18 -10 6 2 L0 8 L-6 2 Q-18 -10 -32 -6 Z M-32 -6 L-36 -12 M32 -6 L36 -12 M-2 -6 Q0 -12 2 -6',
    }

    // 各地的太阳（浅色模式）和月亮（深色模式）。太阳的光芒放在 .rays 里，悬停时会放大旋转
    function orbSvg(style) {
      const f = n => (Math.round(n * 10) / 10).toFixed(1)
      const ray = (a, r1, r2, w) => {
        const c = Math.cos(a), s = Math.sin(a), px = -s * w, py = c * w
        return `M${f(c * r1 + px)} ${f(s * r1 + py)} L${f(c * r2)} ${f(s * r2)} L${f(c * r1 - px)} ${f(s * r1 - py)}`
      }
      const lines = (n, r1, r2, off = 0) => Array.from({ length: n }, (_, i) => { const a = off + i * 2 * Math.PI / n; return `M${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)} L${f(Math.cos(a) * r2)} ${f(Math.sin(a) * r2)}` }).join(' ')
      let sun = '', moon = ''
      if (style === 'chinese') {
        // 日中有三足金乌；月中有玉兔
        sun = `<circle r="30"/><path d="M-12 2 Q-4 -10 8 -6 L14 -10 L12 -4 Q4 6 -6 6 Z M-2 6 L-4 14 M2 6 L2 14 M6 4 L8 12"/><g class="rays"><path d="${lines(24, 38, 42)}"/></g>`
        moon = `<circle class="halo" r="44"/><circle r="30"/><path d="M-10 10 Q-12 -2 -1 -2 Q8 -2 8 6 Q8 11 1 11 Z M1 -2 L-1 -13 M4 -2 L6 -12 M10 10 L16 10 L15 4 L11 4 Z"/>`
      } else if (style === 'babylonian') {
        // 沙玛什日盘：四角星与四道波浪光芒；月神辛的横卧新月
        let wav = ''
        for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), px = -s * 4, py = c * 4; wav += ` M${f(c * 14)} ${f(s * 14)} L${f(c * 20 + px)} ${f(s * 20 + py)} L${f(c * 26 - px)} ${f(s * 26 - py)} L${f(c * 32 + px)} ${f(s * 32 + py)} L${f(c * 38)} ${f(s * 38)}` }
        sun = `<circle r="12"/><g class="rays"><path d="${[0, 1, 2, 3].map(i => ray(i * Math.PI / 2, 12, 40, 6)).join(' ')}${wav}"/></g>`
        moon = `<circle class="halo" r="44"/><path d="M-32 -10 Q0 32 32 -10 Q0 14 -32 -10 Z"/>`
      } else if (style === 'indian') {
        // 科纳克太阳神庙的车轮；湿婆的新月
        sun = `<circle r="30"/><circle r="7"/><path d="${lines(8, 7, 30, Math.PI / 8)}"/><g class="rays"><path d="${lines(24, 34, 40)}"/></g>`
        moon = `<circle class="halo" r="44"/><path d="M-28 -8 Q0 28 28 -8 Q0 12 -28 -8 Z"/>`
      } else if (style === 'egyptian') {
        // 阿顿：光线自日轮倾泻向下，末端是一只只抚慰与赐福的小手；孔苏：新月托着满月圆盘
        const N = 11
        const hands = Array.from({ length: N }, (_, i) => {
          const a = Math.PI * (0.16 + i * 0.68 / (N - 1))
          const c = Math.cos(a), s = Math.sin(a)
          const x1 = c * 25, y1 = s * 25, x2 = c * 60, y2 = s * 60
          const f1x = x2 + 4 * c - 2.8 * s, f1y = y2 + 4 * s + 2.8 * c
          const f2x = x2 + 5 * c, f2y = y2 + 5 * s
          const f3x = x2 + 4 * c + 2.8 * s, f3y = y2 + 4 * s - 2.8 * c
          return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} M${f(f1x)} ${f(f1y)} L${f(x2)} ${f(y2)} L${f(f2x)} ${f(f2y)} M${f(x2)} ${f(y2)} L${f(f3x)} ${f(f3y)}`
        }).join(' ')
        sun = `<circle r="24"/><g class="rays"><path d="M-65 -65 M65 65 ${hands}"/></g>`
        moon = `<circle class="halo" r="44"/><circle cy="-6" r="16"/><path d="M-25 -12 Q0 56 25 -12 Q0 32 -25 -12 Z"/>`
      } else if (style === 'roman') {
        // 索尔神的光芒冠；露娜的新月与星
        sun = `<circle r="22"/><g class="rays"><path d="${Array.from({ length: 12 }, (_, i) => ray(i * Math.PI / 6, 22, 46, 5)).join(' ')}"/></g>`
        moon = `<circle class="halo" r="44"/><path d="M-6 -34 A34 34 0 1 0 30 18 A28 28 0 1 1 -6 -34 Z M26 -26 L28 -20 L34 -20 L29 -16 L31 -10 L26 -14 L21 -10 L23 -16 L18 -20 L24 -20 Z"/>`
      } else if (style === 'maya') {
        // 基尼奇·阿豪日轮（四瓣花太阳神符号）；伊希切尔月神与玉兔新月
        sun = `<circle r="22"/><g class="rays"><path d="${Array.from({ length: 8 }, (_, i) => ray(i * Math.PI / 4, 22, i % 2 ? 34 : 44, 4)).join(' ')}"/><circle cx="0" cy="0" r="14" fill="none"/><path d="M-6 -6 Q0 -12 6 -6 Q12 0 6 6 Q0 12 -6 6 Q-12 0 -6 -6 Z"/></g>`
        moon = `<circle class="halo" r="44"/><path d="M-6 -34 A34 34 0 1 0 30 18 A28 28 0 1 1 -6 -34 Z"/><path d="M-2 4 Q-4 -4 4 -4 Q10 -4 10 2 Q10 7 4 7 Z M6 -4 L5 -12 M8 -4 L10 -11 M11 4 L14 4"/>`
      } else if (style === 'inca') {
        // 因蒂太阳神（神圣面庞与直、焰交替的十六道金芒）；玛玛·基利亚银辉月盘
        let wav = ''
        for (let i = 0; i < 8; i++) {
          const a = Math.PI / 8 + i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a), px = -s * 3.5, py = c * 3.5
          wav += ` M${f(c * 20)} ${f(s * 20)} L${f(c * 27 + px)} ${f(s * 27 + py)} L${f(c * 34 - px)} ${f(s * 34 - py)} L${f(c * 42)} ${f(s * 42)}`
        }
        sun = `<circle r="20"/><g class="rays"><path d="${Array.from({ length: 8 }, (_, i) => ray(i * Math.PI / 4, 20, 44, 4.5)).join(' ')}${wav}"/></g><circle cx="-6" cy="-4" r="2"/><circle cx="6" cy="-4" r="2"/><path d="M-1 -1 L1 -1 L0 4 Z M-6 9 Q0 13 6 9"/>`
        moon = `<circle class="halo" r="44"/><circle r="24"/><path d="M-10 -20 A24 24 0 0 1 14 18 A20 20 0 0 0 -10 -20 Z"/>`
      } else {
        // 古希腊：韦尔吉纳太阳（十六道长短相间的光芒）；新月
        sun = `<circle r="10"/><g class="rays"><path d="${Array.from({ length: 16 }, (_, i) => ray(i * Math.PI / 8, 13, i % 2 ? 30 : 42, 4)).join(' ')}"/></g>`
        moon = `<circle class="halo" r="44"/><path d="M-6 -34 A34 34 0 1 0 30 18 A28 28 0 1 1 -6 -34 Z"/>`
      }
      return `<g class="orb-b"><circle class="orb-hit" r="54" fill="none" pointer-events="all" style="cursor:pointer"/><g class="sun">${sun}</g><g class="moon">${moon}</g></g>`
    }

    // [动作, 形状, x, y, 缩放]：run 跑开；swim 漂开；fly 飞走（云单独飘，见生机层）
    const LIFE_CAST = {
      // 古希腊：雅典娜的猫头鹰、海豚、帆船与手持卷轴的人
      greek: [['swim', 'greekShip', 1080, 742, 1.1], ['swim', 'dolphin', 120, 748, 0.9], ['swim', 'dolphin', 240, 754, 0.75], ['run', 'greekPerson', 150, 700, 1], ['fly', 'owl', 860, 140, 1]],
      // 中国古代：仙鹤、鹿、锦鲤、渔翁与戴幞头的人
      chinese: [['fly', 'crane', 880, 130, 1.1], ['swim', 'chineseFisher', 160, 746, 1], ['swim', 'carp', 1000, 752, 0.9], ['run', 'deer', 1060, 700, 1], ['run', 'chinesePerson', 230, 700, 1]],
      // 古巴比伦：伊什塔尔城门的狮子与公牛、鹰、芦苇圆船与戴尖帽的人
      babylonian: [['run', 'bull', 1060, 700, 1.1], ['run', 'lion', 160, 700, 1], ['swim', 'guffa', 260, 748, 1], ['run', 'babylonianPerson', 1120, 700, 1], ['fly', 'eagle', 860, 130, 0.8]],
      // 古印度：大象、孔雀、神鹅与头顶水罐的人
      indian: [['run', 'elephant', 1070, 700, 1.2], ['run', 'peacock', 150, 700, 1], ['swim', 'hamsa', 300, 744, 1], ['swim', 'hamsa', 980, 748, 0.85], ['run', 'indianPerson', 250, 700, 1]],
      // 古埃及：猫、朱鹭、隼、尼罗河帆船与侧身迈步的人
      egyptian: [['run', 'ibis', 1080, 700, 1.1], ['run', 'cat', 230, 700, 0.9], ['swim', 'felucca', 150, 748, 1], ['fly', 'falcon', 880, 120, 0.9], ['run', 'egyptianPerson', 310, 700, 1]],
      // 古罗马：母狼、鹰、马、方帆船与穿托加的人
      roman: [['run', 'horse', 1060, 700, 1.1], ['run', 'wolf', 170, 700, 1], ['fly', 'eagle', 880, 120, 1], ['run', 'romanPerson', 260, 700, 1], ['swim', 'romanShip', 1120, 750, 0.9]],
      // 玛雅：美洲豹、格查尔鸟、海豚、雨林祭司
      maya: [['run', 'jaguar', 1060, 700, 1.05], ['run', 'quetzal', 170, 680, 0.95], ['fly', 'quetzal', 880, 120, 1.1], ['run', 'mayaPerson', 260, 700, 1], ['swim', 'dolphin', 1120, 750, 0.85]],
      // 印加：美洲驼（羊驼）、神鹰、安第斯行者、野鸭
      inca: [['run', 'llama', 1060, 700, 1.1], ['run', 'llama', 980, 705, 0.85], ['fly', 'condor', 880, 110, 1.2], ['run', 'incaPerson', 250, 700, 1], ['swim', 'duck', 180, 748, 1]],
    }
    function lifeSvgInner(style) {
      const cast = LIFE_CAST[style] || LIFE_CAST.greek
      const crit = cast.map(([kind, shape, x, y, s], i) =>
        `<g class="crit ${kind}" data-i="${i}" transform="translate(${x} ${y})"><g class="crit-b" transform="scale(${s})"><path d="${LIFE_SHAPES[shape] || CULTURE_SHAPES[shape]}"/></g></g>`).join('')
      const orb = `<g class="orb">${orbSvg(style)}</g>`
      const flock = `<g class="flock">${[[0, 0], [26, -14], [52, 6], [18, 22], [70, -6]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="${LIFE_SHAPES.bird}"/>`).join('')}</g>`
      return orb + '<g class="clouds"></g>' + crit + flock
    }
    // 日月的位置：按本机当前时间（6–18 点一轮，18–6 点再一轮）。
    // 浅色模式画太阳，深色模式画月亮（由样式决定）
    function orbPlace(date) {
      const h = date.getHours() + date.getMinutes() / 60
      const day = h >= 6 && h < 18
      const t = day ? (h - 6) / 12 : ((h + 6) % 24) / 12
      // 上午在左侧空白处升起，下午在右侧空白处落下（东升西落），高度随时间变化；不穿过正中的内容栏
      const x = t < 0.5 ? 150 + t * 120 : 1050 - (1 - t) * 120
      return { day, x, y: 420 - Math.sin(Math.PI * t) * 260 }
    }

    // ---------- 弹幕名言：六地各 10 句，关于复盘、成长、反思、为善 ----------
    const DRIFT_QUOTES = {
      chinese: [
        ['吾日三省吾身。', '《论语》', 'Each day I examine myself on three counts.', 'The Analects'],
        ['学而不思则罔，思而不学则殆。', '《论语》', 'Learning without thought is labor lost; thought without learning is perilous.', 'The Analects'],
        ['过而不改，是谓过矣。', '《论语》', 'To err and not correct it — that is the real error.', 'The Analects'],
        ['见贤思齐焉，见不贤而内自省也。', '《论语》', 'Seeing the worthy, think of equaling them; seeing the unworthy, look within.', 'The Analects'],
        ['知之为知之，不知为不知，是知也。', '《论语》', 'To know what you know and what you do not — that is knowledge.', 'The Analects'],
        ['勿以恶小而为之，勿以善小而不为。', '刘备', 'Do no evil because it is small; leave no good undone because it is small.', 'Liu Bei'],
        ['千里之行，始于足下。', '《道德经》', 'A journey of a thousand miles begins beneath one’s feet.', 'Tao Te Ching'],
        ['上善若水。', '《道德经》', 'The highest good is like water.', 'Tao Te Ching'],
        ['苟日新，日日新，又日新。', '《礼记·大学》', 'Renew yourself each day; day by day, renew again.', 'The Great Learning'],
        ['不积跬步，无以至千里。', '《荀子·劝学》', 'Without small steps, there is no journey of a thousand miles.', 'Xunzi'],
      ],
      greek: [
        ['认识你自己。', '德尔斐箴言', 'Know thyself.', 'Delphic maxim'],
        ['未经审视的人生不值得过。', '苏格拉底', 'The unexamined life is not worth living.', 'Socrates'],
        ['我们通过做正义的事，成为正义的人。', '亚里士多德', 'We become just by doing just acts.', 'Aristotle'],
        ['人不能两次踏进同一条河流。', '赫拉克利特', 'No one steps into the same river twice.', 'Heraclitus'],
        ['开端是整体的一半。', '柏拉图', 'The beginning is half of the whole.', 'Plato'],
        ['我唯一知道的，是我一无所知。', '苏格拉底', 'I know that I know nothing.', 'Socrates'],
        ['品格即命运。', '赫拉克利特', 'Character is destiny.', 'Heraclitus'],
        ['教育的根是苦的，果实是甜的。', '亚里士多德', 'The roots of education are bitter, but the fruit is sweet.', 'Aristotle'],
        ['战胜自己，是最初也是最好的胜利。', '柏拉图', 'To conquer oneself is the first and best of victories.', 'Plato'],
        ['凡事皆有度。', '德尔斐箴言', 'Measure in all things.', 'Delphic maxim'],
      ],
      roman: [
        ['教人者，亦在学习。', '塞涅卡', 'While we teach, we learn.', 'Seneca'],
        ['从容赶路。', '奥古斯都', 'Make haste slowly.', 'Augustus'],
        ['生命并不短，是我们浪费了太多。', '塞涅卡', 'It is not that we have a short time, but that we waste much of it.', 'Seneca'],
        ['别再争论好人是什么样，去做一个好人。', '马可·奥勒留', 'Waste no more time arguing what a good man is. Be one.', 'Marcus Aurelius'],
        ['我们的生活，由我们的思想造就。', '马可·奥勒留', 'Our life is what our thoughts make it.', 'Marcus Aurelius'],
        ['运气，是准备遇上了机会。', '塞涅卡', 'Luck is what happens when preparation meets opportunity.', 'Seneca'],
        ['犯错是人之常情。', '塞涅卡', 'To err is human.', 'Seneca'],
        ['循着艰辛，抵达星辰。', '塞涅卡', 'Through hardships to the stars.', 'Seneca'],
        ['认识到错误，是改正的开始。', '塞涅卡', 'Knowing one’s fault is the beginning of mending it.', 'Seneca'],
        ['能主宰自己的人，最有力量。', '塞涅卡', 'Most powerful is he who has himself in his own power.', 'Seneca'],
      ],
      egyptian: [
        ['没有人生来就有智慧。', '《普塔霍特普箴言》', 'No one is born wise.', 'Maxims of Ptahhotep'],
        ['技艺没有尽头，没有哪位工匠已臻完满。', '《普塔霍特普箴言》', 'The limits of art are never reached; no craftsman is ever perfect.', 'Maxims of Ptahhotep'],
        ['好的言辞比绿宝石更难寻。', '《普塔霍特普箴言》', 'Good speech is more hidden than greenstone.', 'Maxims of Ptahhotep'],
        ['向不懂的人请教，也向懂的人请教。', '《普塔霍特普箴言》', 'Consult the ignorant as well as the wise.', 'Maxims of Ptahhotep'],
        ['此生且随你的心。', '《普塔霍特普箴言》', 'Follow your heart as long as you live.', 'Maxims of Ptahhotep'],
        ['言语比任何争斗都更有力量。', '《美里卡拉王教谕》', 'Speech is mightier than any fighting.', 'Instruction for Merikare'],
        ['行正义之事，便能在世间长存。', '《美里卡拉王教谕》', 'Do justice, and you will endure on earth.', 'Instruction for Merikare'],
        ['沉静的人像园中的树，枝繁叶茂。', '《阿蒙涅莫普教诲》', 'The quiet one is like a tree in a garden; it flourishes.', 'Instruction of Amenemope'],
        ['不要整夜为明天忧惧。', '《阿蒙涅莫普教诲》', 'Do not spend the night in fear of tomorrow.', 'Instruction of Amenemope'],
        ['宁要神手中的清贫，不要仓里的财富。', '《阿蒙涅莫普教诲》', 'Better is poverty in the hand of the god than riches in the storehouse.', 'Instruction of Amenemope'],
      ],
      babylonian: [
        ['他看见了深渊，于是知晓万物。', '《吉尔伽美什史诗》', 'He who saw the deep, who knew all things.', 'Epic of Gilgamesh'],
        ['三股拧成的绳子，不易折断。', '《吉尔伽美什史诗》', 'A three-ply rope is not easily cut.', 'Epic of Gilgamesh'],
        ['人的日子屈指可数，所做的一切不过是风。', '《吉尔伽美什史诗》', 'As for man, his days are numbered; whatever he does is but wind.', 'Epic of Gilgamesh'],
        ['让正义彰显于大地。', '《汉谟拉比法典》', 'To make justice prevail in the land.', 'Code of Hammurabi'],
        ['使强者不欺凌弱者。', '《汉谟拉比法典》', 'That the strong may not oppress the weak.', 'Code of Hammurabi'],
        ['不要以恶报恶，要以善回报行恶的人。', '《智慧忠告》', 'Do not return evil; requite with kindness the one who does you wrong.', 'Counsels of Wisdom'],
        ['管住你的嘴，守住你的话。', '《智慧忠告》', 'Let your mouth be controlled and your speech guarded.', 'Counsels of Wisdom'],
        ['友谊维持一天，亲情维系一生。', '苏美尔谚语', 'Friendship lasts a day; kinship lasts forever.', 'Sumerian proverb'],
        ['仁爱之心建起家，怨恨之心毁掉家。', '苏美尔谚语', 'A loving heart builds a household; a hateful heart destroys it.', 'Sumerian proverb'],
        ['说一次谎，再说真话也会被当作谎言。', '苏美尔谚语', 'Tell a lie, and then your truth will be taken for a lie.', 'Sumerian proverb'],
      ],
      indian: [
        ['我们的一切，都由心念而来。', '《法句经》', 'All that we are is the result of what we have thought.', 'Dhammapada'],
        ['胜千人者，不如胜己。', '《法句经》', 'Better than conquering a thousand is conquering oneself.', 'Dhammapada'],
        ['以不怒胜怒，以善胜不善。', '《法句经》', 'Overcome anger by calm; overcome evil by good.', 'Dhammapada'],
        ['滴水虽微，渐盈大器。', '《法句经》', 'Drop by drop, the water pot is filled.', 'Dhammapada'],
        ['你有权行动，却无权索取行动的果实。', '《薄伽梵歌》', 'You have a right to action, but not to its fruits.', 'Bhagavad Gita'],
        ['人由信念造就：所信为何，人便为何。', '《薄伽梵歌》', 'One is made by one’s faith; as one believes, so one becomes.', 'Bhagavad Gita'],
        ['降服了心的人，心便是他最好的朋友。', '《薄伽梵歌》', 'For one who has mastered the mind, the mind is the best of friends.', 'Bhagavad Gita'],
        ['引我从虚妄到真实，从黑暗到光明。', '《大森林奥义书》', 'Lead me from the unreal to the real, from darkness to light.', 'Brihadaranyaka Upanishad'],
        ['说真话，行正法。', '《泰帝利耶奥义书》', 'Speak the truth; practice righteousness.', 'Taittiriya Upanishad'],
        ['真理只有一个，智者以不同的名字称呼它。', '《梨俱吠陀》', 'Truth is one; the wise call it by many names.', 'Rig Veda'],
      ],
      maya: [
        ['唯有静止与寂静，在黑暗里，在夜里。', '《波波尔·乌》', 'There was only stillness and silence, in the darkness, in the night.', 'Popol Vuh'],
        ['愿天空和大地上出现光明，愿黎明到来。', '《波波尔·乌》', 'Let there be light, let dawn come to the sky and the earth.', 'Popol Vuh'],
        ['愿所有人都站起来，不让一个人落在后面。', '《波波尔·乌》', 'Let all rise up, let no one be left behind.', 'Popol Vuh'],
        ['他们的目光看得很远，他们认识了世间的一切。', '《波波尔·乌》', 'Their sight reached far; they came to know all that is in the world.', 'Popol Vuh'],
        ['所有的月、所有的年、所有的日、所有的风，都在行走，也终将过去。', '《楚马耶尔的奇兰·巴兰》', 'Every moon, every year, every day, every wind walks on and passes away.', 'Chilam Balam of Chumayel'],
        ['我们真心感谢你们，两次、三次地感谢！', '《波波尔·乌》', 'Truly we thank you, twice, three times!', 'Popol Vuh'],
      ],
      inca: [
        ['莫偷盗，莫说谎，莫懒惰。', '印加三戒（Ama sua, ama llulla, ama quella）', 'Do not steal, do not lie, do not be lazy.', 'Inca triad (Ama sua, ama llulla, ama quella)'],
        ['你在哪里？在上方，在下方，还是在四周？', '《维拉科查颂歌》（克里斯托瓦尔·德·莫利纳记录）', 'Where are you? Above? Below? Or all around?', 'Hymn to Viracocha (recorded by Cristóbal de Molina)'],
        ['今天我帮你，明天你帮我。', '安第斯的互惠传统（Ayni）', 'Today for you, tomorrow for me.', 'Andean tradition of reciprocity (ayni)'],
      ],
    }

    // 其他六种语言的名言（顺序与 DRIFT_QUOTES 一致：中国、希腊、罗马、埃及、巴比伦、印度，各 10 句）：[句子, 出处]
    const DRIFT_I18N = {
      ja: [
        ['吾日に三たび吾が身を省みる。', '論語'], ['学びて思わざれば則ち罔し、思いて学ばざれば則ち殆うし。', '論語'], ['過ちて改めざる、是を過ちと謂う。', '論語'], ['賢を見ては斉しからんことを思い、不賢を見ては内に自ら省みる。', '論語'], ['知るを知るとなし、知らざるを知らずとなす、是れ知るなり。', '論語'], ['悪小なるを以て之を為すこと勿れ、善小なるを以て為さざること勿れ。', '劉備'], ['千里の行も足下より始まる。', '老子'], ['上善は水の若し。', '老子'], ['苟に日に新たに、日日に新たに、又日に新たなり。', '大学'], ['跬歩を積まざれば、以て千里に至る無し。', '荀子'],
        ['汝自身を知れ。', 'デルポイの格言'], ['吟味されない人生は生きるに値しない。', 'ソクラテス'], ['正しい行いをすることで、人は正しくなる。', 'アリストテレス'], ['同じ川に二度入ることはできない。', 'ヘラクレイトス'], ['始まりは全体の半分である。', 'プラトン'], ['私は自分が何も知らないことを知っている。', 'ソクラテス'], ['性格は運命である。', 'ヘラクレイトス'], ['教育の根は苦いが、その実は甘い。', 'アリストテレス'], ['己に克つことは、最初にして最上の勝利である。', 'プラトン'], ['何事にも程がある。', 'デルポイの格言'],
        ['教えることで、私たちは学ぶ。', 'セネカ'], ['ゆっくり急げ。', 'アウグストゥス'], ['人生は短いのではない。私たちが多くを浪費しているのだ。', 'セネカ'], ['善き人とは何かを論じるのはやめ、善き人であれ。', 'マルクス・アウレリウス'], ['人生は、私たちの思いがつくるものである。', 'マルクス・アウレリウス'], ['幸運とは、準備が機会に出会うことである。', 'セネカ'], ['過ちは人の常。', 'セネカ'], ['困難を経て星々へ。', 'セネカ'], ['過ちに気づくことが、改める始まりである。', 'セネカ'], ['自らを治める者こそ、最も力ある者である。', 'セネカ'],
        ['生まれながらに賢い者はいない。', 'プタハヘテプの教訓'], ['技の極みに達した職人はいない。', 'プタハヘテプの教訓'], ['良き言葉は緑の宝石よりも見つけがたい。', 'プタハヘテプの教訓'], ['知らぬ者にも、知る者にも尋ねよ。', 'プタハヘテプの教訓'], ['生きている限り、心に従え。', 'プタハヘテプの教訓'], ['言葉はいかなる戦いよりも強い。', 'メリカラー王への教訓'], ['正義を行えば、地上に長くとどまる。', 'メリカラー王への教訓'], ['静かな人は庭の木のように茂る。', 'アメンエムオペトの教訓'], ['明日を恐れて夜を過ごすな。', 'アメンエムオペトの教訓'], ['蔵の富より、神の手にある貧しさがよい。', 'アメンエムオペトの教訓'],
        ['深淵を見た者は、すべてを知った。', 'ギルガメシュ叙事詩'], ['三つ撚りの綱は容易には切れない。', 'ギルガメシュ叙事詩'], ['人の日々は数えられ、その営みはすべて風である。', 'ギルガメシュ叙事詩'], ['国に正義を行き渡らせるために。', 'ハンムラビ法典'], ['強き者が弱き者を虐げないように。', 'ハンムラビ法典'], ['悪に悪で報いるな。悪をなす者には善で報いよ。', '知恵の勧め'], ['口を慎み、言葉を守れ。', '知恵の勧め'], ['友情は一日、血縁は一生。', 'シュメールのことわざ'], ['愛する心は家を築き、憎む心は家を壊す。', 'シュメールのことわざ'], ['一度嘘をつけば、真実も嘘とみなされる。', 'シュメールのことわざ'],
        ['私たちのすべては、心の思いから生まれる。', '法句経'], ['千人に勝つより、己に勝つほうがまさる。', '法句経'], ['怒らぬことで怒りに勝ち、善で不善に勝て。', '法句経'], ['一滴ずつ、水瓶は満ちていく。', '法句経'], ['汝の権利は行為にのみあり、その結果にはない。', 'バガヴァッド・ギーター'], ['人は信によって成る。信じるとおりの者になる。', 'バガヴァッド・ギーター'], ['心を制した者にとって、心は最良の友である。', 'バガヴァッド・ギーター'], ['偽りから真実へ、闇から光へ導きたまえ。', 'ブリハッド・アーラニヤカ・ウパニシャッド'], ['真実を語り、正しき道を行え。', 'タイッティリーヤ・ウパニシャッド'], ['真理は一つ、賢者はそれを様々な名で呼ぶ。', 'リグ・ヴェーダ'],
        ['ただ静止と静寂だけがあった。闇のなかに、夜のなかに。', '『ポポル・ヴフ』'], ['光あれ、天と地に夜明けよ来たれ。', '『ポポル・ヴフ』'], ['皆が立ち上がるように。誰ひとり取り残されないように。', '『ポポル・ヴフ』'], ['彼らのまなざしは遠くまで届き、世にあるすべてを知った。', '『ポポル・ヴフ』'], ['すべての月、すべての年、すべての日、すべての風は歩み、そして過ぎ去る。', '『チュマイェルのチラム・バラム』'], ['心から感謝します。二度、三度と感謝します。', '『ポポル・ヴフ』'], ['盗むな、偽るな、怠けるな。', 'インカの三戒（アマ・スワ、アマ・ユヤ、アマ・ケヤ）'], ['あなたはどこにいるのか。上にか、下にか、それとも周りにか。', '『ビラコチャ讃歌』（クリストバル・デ・モリーナの記録）'], ['今日はあなたのために、明日は私のために。', 'アンデスの互恵の伝統（アイニ）'],
      ],
      es: [
        ['Cada día me examino tres veces.', 'Analectas'], ['Aprender sin pensar es inútil; pensar sin aprender es peligroso.', 'Analectas'], ['Errar y no corregirse: ese es el verdadero error.', 'Analectas'], ['Ante el sabio, piensa en igualarlo; ante el que no lo es, mírate por dentro.', 'Analectas'], ['Saber lo que sabes y lo que no sabes: eso es saber.', 'Analectas'], ['No hagas el mal por pequeño; no dejes el bien por pequeño.', 'Liu Bei'], ['Un viaje de mil millas empieza con un paso.', 'Tao Te Ching'], ['El bien supremo es como el agua.', 'Tao Te Ching'], ['Renuévate cada día, y otra vez, cada día.', 'La Gran Enseñanza'], ['Sin pequeños pasos no se llega a mil millas.', 'Xunzi'],
        ['Conócete a ti mismo.', 'Máxima délfica'], ['Una vida sin examen no merece ser vivida.', 'Sócrates'], ['Nos hacemos justos haciendo actos justos.', 'Aristóteles'], ['Nadie se baña dos veces en el mismo río.', 'Heráclito'], ['El principio es la mitad del todo.', 'Platón'], ['Solo sé que no sé nada.', 'Sócrates'], ['El carácter es el destino.', 'Heráclito'], ['Las raíces de la educación son amargas, pero el fruto es dulce.', 'Aristóteles'], ['Vencerse a uno mismo es la primera y mejor victoria.', 'Platón'], ['Medida en todas las cosas.', 'Máxima délfica'],
        ['Enseñando, aprendemos.', 'Séneca'], ['Apresúrate despacio.', 'Augusto'], ['No es que tengamos poco tiempo, sino que perdemos mucho.', 'Séneca'], ['No discutas más cómo debe ser un hombre bueno. Sélo.', 'Marco Aurelio'], ['Nuestra vida es lo que nuestros pensamientos hacen de ella.', 'Marco Aurelio'], ['La suerte es la preparación que encuentra la oportunidad.', 'Séneca'], ['Errar es humano.', 'Séneca'], ['Por lo áspero hacia las estrellas.', 'Séneca'], ['Reconocer el error es el comienzo de enmendarlo.', 'Séneca'], ['El más poderoso es quien se gobierna a sí mismo.', 'Séneca'],
        ['Nadie nace sabio.', 'Máximas de Ptahhotep'], ['El arte no tiene límites; ningún artesano alcanza la perfección.', 'Máximas de Ptahhotep'], ['La buena palabra es más rara que la piedra verde.', 'Máximas de Ptahhotep'], ['Consulta al ignorante y también al sabio.', 'Máximas de Ptahhotep'], ['Sigue a tu corazón mientras vivas.', 'Máximas de Ptahhotep'], ['La palabra es más fuerte que cualquier lucha.', 'Instrucción a Merikare'], ['Obra con justicia y perdurarás en la tierra.', 'Instrucción a Merikare'], ['El silencioso es como un árbol en el jardín: florece.', 'Instrucción de Amenemope'], ['No pases la noche temiendo el mañana.', 'Instrucción de Amenemope'], ['Mejor pobreza en manos del dios que riquezas en el granero.', 'Instrucción de Amenemope'],
        ['El que vio lo profundo conoció todas las cosas.', 'Poema de Gilgamesh'], ['Una cuerda de tres hilos no se rompe fácilmente.', 'Poema de Gilgamesh'], ['Los días del hombre están contados; todo lo que hace es viento.', 'Poema de Gilgamesh'], ['Para que la justicia reine en la tierra.', 'Código de Hammurabi'], ['Para que el fuerte no oprima al débil.', 'Código de Hammurabi'], ['No devuelvas mal por mal; responde con bondad a quien te hace daño.', 'Consejos de sabiduría'], ['Contén tu boca y guarda tu palabra.', 'Consejos de sabiduría'], ['La amistad dura un día; el parentesco, para siempre.', 'Proverbio sumerio'], ['Un corazón que ama construye la casa; uno que odia la destruye.', 'Proverbio sumerio'], ['Di una mentira y tu verdad pasará por mentira.', 'Proverbio sumerio'],
        ['Todo lo que somos es resultado de lo que hemos pensado.', 'Dhammapada'], ['Mejor que vencer a mil es vencerse a uno mismo.', 'Dhammapada'], ['Vence la ira con calma; vence el mal con el bien.', 'Dhammapada'], ['Gota a gota se llena el cántaro.', 'Dhammapada'], ['Tienes derecho a la acción, no a sus frutos.', 'Bhagavad Gita'], ['Uno se hace según su fe: lo que cree, eso es.', 'Bhagavad Gita'], ['Para quien domina su mente, la mente es su mejor amiga.', 'Bhagavad Gita'], ['Llévame de lo irreal a lo real, de la oscuridad a la luz.', 'Brihadaranyaka Upanishad'], ['Di la verdad; practica la rectitud.', 'Taittiriya Upanishad'], ['La verdad es una; los sabios la llaman con muchos nombres.', 'Rig Veda'],
        ['Solo había inmovilidad y silencio en la oscuridad, en la noche.', 'Popol Vuh'], ['¡Que aclare, que amanezca en el cielo y en la tierra!', 'Popol Vuh'], ['Que se levanten todos, que no se quede nadie atrás.', 'Popol Vuh'], ['Su vista llegaba lejos; llegaron a conocer todo lo que hay en el mundo.', 'Popol Vuh'], ['Toda luna, todo año, todo día, todo viento camina y pasa también.', 'Chilam Balam de Chumayel'], ['¡En verdad os damos gracias, dos y tres veces!', 'Popol Vuh'], ['No robes, no mientas, no seas perezoso.', 'Tríada inca (Ama sua, ama llulla, ama quella)'], ['¿Dónde estás? ¿Arriba, abajo, o alrededor?', 'Himno a Viracocha (recogido por Cristóbal de Molina)'], ['Hoy por ti, mañana por mí.', 'Tradición andina de reciprocidad (ayni)'],
      ],
      fr: [
        ['Chaque jour, je m’examine trois fois.', 'Entretiens de Confucius'], ['Apprendre sans réfléchir est vain ; réfléchir sans apprendre est dangereux.', 'Entretiens de Confucius'], ['Faillir sans se corriger, voilà la vraie faute.', 'Entretiens de Confucius'], ['Devant le sage, cherche à l’égaler ; devant l’autre, regarde en toi.', 'Entretiens de Confucius'], ['Savoir ce que l’on sait et ce que l’on ne sait pas : voilà le savoir.', 'Entretiens de Confucius'], ['Ne fais pas le mal parce qu’il est petit ; ne néglige pas le bien parce qu’il est petit.', 'Liu Bei'], ['Un voyage de mille lieues commence par un pas.', 'Tao Te King'], ['Le bien suprême est comme l’eau.', 'Tao Te King'], ['Renouvelle-toi chaque jour, et encore chaque jour.', 'La Grande Étude'], ['Sans petits pas, point de voyage de mille lieues.', 'Xunzi'],
        ['Connais-toi toi-même.', 'Maxime delphique'], ['Une vie sans examen ne vaut pas d’être vécue.', 'Socrate'], ['C’est en accomplissant des actes justes que l’on devient juste.', 'Aristote'], ['On ne se baigne jamais deux fois dans le même fleuve.', 'Héraclite'], ['Le commencement est la moitié du tout.', 'Platon'], ['Je sais que je ne sais rien.', 'Socrate'], ['Le caractère est un destin.', 'Héraclite'], ['Les racines de l’éducation sont amères, mais ses fruits sont doux.', 'Aristote'], ['Se vaincre soi-même est la première et la plus belle des victoires.', 'Platon'], ['La mesure en toute chose.', 'Maxime delphique'],
        ['En enseignant, nous apprenons.', 'Sénèque'], ['Hâte-toi lentement.', 'Auguste'], ['Ce n’est pas que nous ayons peu de temps, c’est que nous en perdons beaucoup.', 'Sénèque'], ['Cesse de discuter de ce qu’est un homme de bien. Sois-en un.', 'Marc Aurèle'], ['Notre vie est ce qu’en font nos pensées.', 'Marc Aurèle'], ['La chance, c’est la préparation qui rencontre l’occasion.', 'Sénèque'], ['L’erreur est humaine.', 'Sénèque'], ['Par des chemins ardus jusqu’aux étoiles.', 'Sénèque'], ['Reconnaître sa faute est le début de la réparer.', 'Sénèque'], ['Le plus puissant est celui qui se possède lui-même.', 'Sénèque'],
        ['Nul ne naît sage.', 'Maximes de Ptahhotep'], ['L’art n’a pas de limite ; aucun artisan n’atteint la perfection.', 'Maximes de Ptahhotep'], ['La belle parole est plus rare que la pierre verte.', 'Maximes de Ptahhotep'], ['Consulte l’ignorant comme le savant.', 'Maximes de Ptahhotep'], ['Suis ton cœur tant que tu vis.', 'Maximes de Ptahhotep'], ['La parole est plus forte que tout combat.', 'Enseignement pour Mérikarê'], ['Pratique la justice et tu dureras sur la terre.', 'Enseignement pour Mérikarê'], ['L’homme paisible est comme un arbre au jardin : il fleurit.', 'Enseignement d’Aménémopé'], ['Ne passe pas la nuit à craindre le lendemain.', 'Enseignement d’Aménémopé'], ['Mieux vaut la pauvreté dans la main du dieu que la richesse au grenier.', 'Enseignement d’Aménémopé'],
        ['Celui qui a vu les profondeurs connut toute chose.', 'Épopée de Gilgamesh'], ['Une corde à trois brins ne se rompt pas aisément.', 'Épopée de Gilgamesh'], ['Les jours de l’homme sont comptés ; tout ce qu’il fait n’est que vent.', 'Épopée de Gilgamesh'], ['Pour faire régner la justice dans le pays.', 'Code de Hammurabi'], ['Pour que le fort n’opprime pas le faible.', 'Code de Hammurabi'], ['Ne rends pas le mal ; réponds par la bonté à qui te fait du tort.', 'Conseils de sagesse'], ['Retiens ta bouche et garde ta parole.', 'Conseils de sagesse'], ['L’amitié dure un jour ; la parenté, toujours.', 'Proverbe sumérien'], ['Un cœur aimant bâtit la maison ; un cœur haineux la détruit.', 'Proverbe sumérien'], ['Dis un mensonge, et ta vérité passera pour mensonge.', 'Proverbe sumérien'],
        ['Tout ce que nous sommes naît de nos pensées.', 'Dhammapada'], ['Mieux vaut se vaincre soi-même que vaincre mille hommes.', 'Dhammapada'], ['Vaincs la colère par le calme, le mal par le bien.', 'Dhammapada'], ['Goutte à goutte, la jarre se remplit.', 'Dhammapada'], ['Tu as droit à l’action, non à ses fruits.', 'Bhagavad-Gîtâ'], ['L’homme est fait de sa foi : ce qu’il croit, il le devient.', 'Bhagavad-Gîtâ'], ['Pour qui a maîtrisé son esprit, l’esprit est le meilleur des amis.', 'Bhagavad-Gîtâ'], ['Mène-moi de l’irréel au réel, des ténèbres à la lumière.', 'Brihadaranyaka Upanishad'], ['Dis la vérité ; pratique la droiture.', 'Taittiriya Upanishad'], ['La vérité est une ; les sages lui donnent bien des noms.', 'Rig-Véda'],
        ['Il n’y avait qu’immobilité et silence, dans l’obscurité, dans la nuit.', 'Popol Vuh'], ['Que la lumière soit, que l’aube vienne au ciel et sur la terre !', 'Popol Vuh'], ['Que tous se lèvent, que personne ne reste en arrière.', 'Popol Vuh'], ['Leur regard portait loin ; ils connurent tout ce qui est au monde.', 'Popol Vuh'], ['Toute lune, toute année, tout jour, tout vent chemine et passe aussi.', 'Chilam Balam de Chumayel'], ['En vérité, nous vous rendons grâce, deux et trois fois !', 'Popol Vuh'], ['Ne vole pas, ne mens pas, ne sois pas paresseux.', 'Triade inca (Ama sua, ama llulla, ama quella)'], ['Où es-tu ? En haut, en bas, ou tout autour ?', 'Hymne à Viracocha (recueilli par Cristóbal de Molina)'], ['Aujourd’hui pour toi, demain pour moi.', 'Tradition andine de réciprocité (ayni)'],
      ],
      de: [
        ['Jeden Tag prüfe ich mich dreifach.', 'Gespräche des Konfuzius'], ['Lernen ohne Denken ist vergeblich; Denken ohne Lernen ist gefährlich.', 'Gespräche des Konfuzius'], ['Fehler machen und sie nicht ändern – das erst ist der Fehler.', 'Gespräche des Konfuzius'], ['Siehst du einen Weisen, strebe ihm nach; siehst du einen Unweisen, prüfe dich selbst.', 'Gespräche des Konfuzius'], ['Zu wissen, was man weiß und was man nicht weiß – das ist Wissen.', 'Gespräche des Konfuzius'], ['Tu nichts Schlechtes, weil es klein ist; lass nichts Gutes, weil es klein ist.', 'Liu Bei'], ['Eine Reise von tausend Meilen beginnt mit dem ersten Schritt.', 'Tao Te King'], ['Das höchste Gute ist wie das Wasser.', 'Tao Te King'], ['Erneuere dich jeden Tag, und wieder jeden Tag.', 'Das Große Lernen'], ['Ohne kleine Schritte gelangt man nicht tausend Meilen weit.', 'Xunzi'],
        ['Erkenne dich selbst.', 'Delphische Maxime'], ['Ein ungeprüftes Leben ist nicht lebenswert.', 'Sokrates'], ['Gerecht werden wir, indem wir gerecht handeln.', 'Aristoteles'], ['Niemand steigt zweimal in denselben Fluss.', 'Heraklit'], ['Der Anfang ist die Hälfte des Ganzen.', 'Platon'], ['Ich weiß, dass ich nichts weiß.', 'Sokrates'], ['Der Charakter ist das Schicksal.', 'Heraklit'], ['Die Wurzeln der Bildung sind bitter, doch die Frucht ist süß.', 'Aristoteles'], ['Sich selbst zu besiegen ist der erste und schönste Sieg.', 'Platon'], ['Maß in allen Dingen.', 'Delphische Maxime'],
        ['Indem wir lehren, lernen wir.', 'Seneca'], ['Eile mit Weile.', 'Augustus'], ['Wir haben nicht zu wenig Zeit, wir verschwenden zu viel davon.', 'Seneca'], ['Hör auf zu erörtern, wie ein guter Mensch sein muss. Sei einer.', 'Mark Aurel'], ['Unser Leben ist das, wozu unsere Gedanken es machen.', 'Mark Aurel'], ['Glück ist, wenn Vorbereitung auf Gelegenheit trifft.', 'Seneca'], ['Irren ist menschlich.', 'Seneca'], ['Durch Mühsal zu den Sternen.', 'Seneca'], ['Den Fehler zu erkennen ist der Anfang der Besserung.', 'Seneca'], ['Am mächtigsten ist, wer sich selbst in der Gewalt hat.', 'Seneca'],
        ['Niemand wird weise geboren.', 'Lehre des Ptahhotep'], ['Die Kunst hat keine Grenze; kein Meister erreicht Vollkommenheit.', 'Lehre des Ptahhotep'], ['Gute Rede ist seltener als Grünstein.', 'Lehre des Ptahhotep'], ['Frage den Unkundigen wie den Kundigen.', 'Lehre des Ptahhotep'], ['Folge deinem Herzen, solange du lebst.', 'Lehre des Ptahhotep'], ['Das Wort ist stärker als jeder Kampf.', 'Lehre für Merikare'], ['Tue Recht, so wirst du auf Erden bestehen.', 'Lehre für Merikare'], ['Der Stille gleicht einem Baum im Garten: er gedeiht.', 'Lehre des Amenemope'], ['Verbringe die Nacht nicht in Furcht vor dem Morgen.', 'Lehre des Amenemope'], ['Besser Armut in der Hand des Gottes als Reichtum im Speicher.', 'Lehre des Amenemope'],
        ['Der die Tiefe sah, erkannte alle Dinge.', 'Gilgamesch-Epos'], ['Ein dreifaches Seil reißt nicht leicht.', 'Gilgamesch-Epos'], ['Des Menschen Tage sind gezählt; was er tut, ist nur Wind.', 'Gilgamesch-Epos'], ['Damit Gerechtigkeit im Land herrsche.', 'Codex Hammurapi'], ['Damit der Starke den Schwachen nicht bedrücke.', 'Codex Hammurapi'], ['Vergilt nicht Böses; antworte mit Güte dem, der dir Unrecht tut.', 'Ratschläge der Weisheit'], ['Zügle deinen Mund und hüte dein Wort.', 'Ratschläge der Weisheit'], ['Freundschaft währt einen Tag, Verwandtschaft ewig.', 'Sumerisches Sprichwort'], ['Ein liebendes Herz baut das Haus, ein hassendes zerstört es.', 'Sumerisches Sprichwort'], ['Sag eine Lüge, und deine Wahrheit gilt als Lüge.', 'Sumerisches Sprichwort'],
        ['Alles, was wir sind, entspringt unseren Gedanken.', 'Dhammapada'], ['Besser als tausend zu besiegen ist, sich selbst zu besiegen.', 'Dhammapada'], ['Besiege Zorn durch Ruhe, Böses durch Gutes.', 'Dhammapada'], ['Tropfen um Tropfen füllt sich der Krug.', 'Dhammapada'], ['Dein Recht ist das Handeln, nicht seine Früchte.', 'Bhagavad Gita'], ['Der Mensch ist, was er glaubt.', 'Bhagavad Gita'], ['Wer seinen Geist bezwungen hat, dem ist der Geist der beste Freund.', 'Bhagavad Gita'], ['Führe mich vom Unwirklichen zum Wirklichen, vom Dunkel zum Licht.', 'Brihadaranyaka-Upanishad'], ['Sprich die Wahrheit; handle recht.', 'Taittiriya-Upanishad'], ['Die Wahrheit ist eine; die Weisen nennen sie mit vielen Namen.', 'Rigveda'],
        ['Es gab nur Reglosigkeit und Stille, in der Dunkelheit, in der Nacht.', 'Popol Vuh'], ['Es werde Licht, es dämmere am Himmel und auf der Erde!', 'Popol Vuh'], ['Mögen alle sich erheben, möge keiner zurückbleiben.', 'Popol Vuh'], ['Ihr Blick reichte weit; sie lernten alles kennen, was auf der Welt ist.', 'Popol Vuh'], ['Jeder Mond, jedes Jahr, jeder Tag, jeder Wind wandert und vergeht.', 'Chilam Balam von Chumayel'], ['Wahrlich, wir danken euch, zweimal und dreimal!', 'Popol Vuh'], ['Stiehl nicht, lüg nicht, sei nicht faul.', 'Inka-Trias (Ama sua, ama llulla, ama quella)'], ['Wo bist du? Oben, unten oder ringsum?', 'Hymne an Viracocha (aufgezeichnet von Cristóbal de Molina)'], ['Heute für dich, morgen für mich.', 'Andine Tradition der Gegenseitigkeit (Ayni)'],
      ],
      ru: [
        ['Каждый день я трижды испытываю себя.', 'Беседы и суждения'], ['Учиться без размышлений — напрасно; размышлять без учёбы — опасно.', 'Беседы и суждения'], ['Ошибиться и не исправиться — вот настоящая ошибка.', 'Беседы и суждения'], ['Видя достойного, стремись сравняться; видя недостойного, загляни в себя.', 'Беседы и суждения'], ['Знать, что знаешь, и знать, чего не знаешь, — это и есть знание.', 'Беседы и суждения'], ['Не делай зла, считая его малым; не оставляй добра, считая его малым.', 'Лю Бэй'], ['Путь в тысячу ли начинается с первого шага.', 'Дао дэ цзин'], ['Высшее благо подобно воде.', 'Дао дэ цзин'], ['Обновляйся каждый день, и снова каждый день.', 'Великое учение'], ['Без малых шагов не пройти тысячу ли.', 'Сюнь-цзы'],
        ['Познай самого себя.', 'Дельфийское изречение'], ['Жизнь без исследования не стоит того, чтобы жить.', 'Сократ'], ['Справедливыми мы становимся, совершая справедливые дела.', 'Аристотель'], ['Нельзя войти в одну реку дважды.', 'Гераклит'], ['Начало — половина целого.', 'Платон'], ['Я знаю, что ничего не знаю.', 'Сократ'], ['Характер — это судьба.', 'Гераклит'], ['Корни учения горьки, но плоды сладки.', 'Аристотель'], ['Победить себя — первая и лучшая из побед.', 'Платон'], ['Мера во всём.', 'Дельфийское изречение'],
        ['Уча, мы учимся.', 'Сенека'], ['Спеши медленно.', 'Август'], ['Жизнь не коротка — это мы тратим её впустую.', 'Сенека'], ['Хватит рассуждать, каким должен быть хороший человек. Будь им.', 'Марк Аврелий'], ['Наша жизнь — то, что делают из неё наши мысли.', 'Марк Аврелий'], ['Удача — это когда подготовка встречает возможность.', 'Сенека'], ['Человеку свойственно ошибаться.', 'Сенека'], ['Через тернии к звёздам.', 'Сенека'], ['Осознать ошибку — начало её исправления.', 'Сенека'], ['Сильнее всех тот, кто владеет собой.', 'Сенека'],
        ['Никто не рождается мудрым.', 'Поучение Птахотепа'], ['У искусства нет предела; ни один мастер не достиг совершенства.', 'Поучение Птахотепа'], ['Доброе слово реже зелёного камня.', 'Поучение Птахотепа'], ['Советуйся и с незнающим, и со знающим.', 'Поучение Птахотепа'], ['Следуй своему сердцу, пока живёшь.', 'Поучение Птахотепа'], ['Слово сильнее любого сражения.', 'Поучение Мерикара'], ['Твори справедливость — и пребудешь на земле.', 'Поучение Мерикара'], ['Спокойный подобен дереву в саду: он цветёт.', 'Поучение Аменемопе'], ['Не проводи ночь в страхе перед завтрашним днём.', 'Поучение Аменемопе'], ['Лучше бедность в руке бога, чем богатство в амбаре.', 'Поучение Аменемопе'],
        ['Тот, кто видел глубины, познал всё.', 'Эпос о Гильгамеше'], ['Верёвку в три пряди нелегко порвать.', 'Эпос о Гильгамеше'], ['Дни человека сочтены; всё, что он делает, — лишь ветер.', 'Эпос о Гильгамеше'], ['Чтобы справедливость воцарилась в стране.', 'Законы Хаммурапи'], ['Чтобы сильный не притеснял слабого.', 'Законы Хаммурапи'], ['Не воздавай злом за зло; отвечай добром тому, кто вредит тебе.', 'Советы мудрости'], ['Сдерживай уста и береги слово.', 'Советы мудрости'], ['Дружба длится день, родство — вечно.', 'Шумерская пословица'], ['Любящее сердце строит дом, ненавидящее — рушит.', 'Шумерская пословица'], ['Солги однажды — и твою правду сочтут ложью.', 'Шумерская пословица'],
        ['Всё, что мы есть, — плод наших мыслей.', 'Дхаммапада'], ['Победить себя лучше, чем победить тысячу.', 'Дхаммапада'], ['Побеждай гнев спокойствием, зло — добром.', 'Дхаммапада'], ['Капля за каплей наполняется кувшин.', 'Дхаммапада'], ['Твоё право — действие, но не его плоды.', 'Бхагавад-гита'], ['Человек таков, какова его вера.', 'Бхагавад-гита'], ['Для того, кто покорил ум, ум — лучший друг.', 'Бхагавад-гита'], ['Веди меня от нереального к реальному, от тьмы к свету.', 'Брихадараньяка-упанишада'], ['Говори правду; следуй праведности.', 'Тайттирия-упанишада'], ['Истина одна; мудрые называют её многими именами.', 'Ригведа'],
        ['Была лишь неподвижность и тишина, во тьме, в ночи.', '«Пополь-Вух»'], ['Да будет свет, да наступит рассвет на небе и на земле!', '«Пополь-Вух»'], ['Пусть поднимутся все, пусть никто не останется позади.', '«Пополь-Вух»'], ['Их взор простирался далеко; они познали всё, что есть в мире.', '«Пополь-Вух»'], ['Всякая луна, всякий год, всякий день, всякий ветер идёт и проходит.', '«Чилам Балам из Чумайеля»'], ['Воистину благодарим вас дважды и трижды!', '«Пополь-Вух»'], ['Не кради, не лги, не ленись.', 'Три заповеди инков (Ama sua, ama llulla, ama quella)'], ['Где ты? Вверху, внизу или вокруг?', 'Гимн Виракоче (записан Кристобалем де Молиной)'], ['Сегодня — тебе, завтра — мне.', 'Андская традиция взаимопомощи (айни)'],
      ],
      pt: [
        ['Todos os dias examino a mim mesmo três vezes.', 'Analectos'], ['Aprender sem pensar é inútil; pensar sem aprender é perigoso.', 'Analectos'], ['Errar e não se corrigir: eis o verdadeiro erro.', 'Analectos'], ['Diante do sábio, busque igualá-lo; diante do contrário, olhe para dentro.', 'Analectos'], ['Saber o que se sabe e o que não se sabe: isso é saber.', 'Analectos'], ['Não faça o mal por ser pequeno; não deixe o bem por ser pequeno.', 'Liu Bei'], ['Uma jornada de mil milhas começa com um passo.', 'Tao Te Ching'], ['O bem supremo é como a água.', 'Tao Te Ching'], ['Renove-se a cada dia, e de novo a cada dia.', 'O Grande Ensinamento'], ['Sem pequenos passos não se chega a mil milhas.', 'Xunzi'],
        ['Conhece-te a ti mesmo.', 'Máxima délfica'], ['Uma vida sem exame não vale a pena ser vivida.', 'Sócrates'], ['Tornamo-nos justos praticando atos justos.', 'Aristóteles'], ['Ninguém entra duas vezes no mesmo rio.', 'Heráclito'], ['O começo é a metade do todo.', 'Platão'], ['Só sei que nada sei.', 'Sócrates'], ['O caráter é o destino.', 'Heráclito'], ['As raízes da educação são amargas, mas os frutos são doces.', 'Aristóteles'], ['Vencer a si mesmo é a primeira e melhor vitória.', 'Platão'], ['Medida em todas as coisas.', 'Máxima délfica'],
        ['Ensinando, aprendemos.', 'Sêneca'], ['Apressa-te devagar.', 'Augusto'], ['Não temos pouco tempo; desperdiçamos muito.', 'Sêneca'], ['Chega de discutir como deve ser um homem bom. Seja um.', 'Marco Aurélio'], ['Nossa vida é o que nossos pensamentos fazem dela.', 'Marco Aurélio'], ['Sorte é quando a preparação encontra a oportunidade.', 'Sêneca'], ['Errar é humano.', 'Sêneca'], ['Pelas asperezas até as estrelas.', 'Sêneca'], ['Reconhecer o erro é o começo de corrigi-lo.', 'Sêneca'], ['Mais poderoso é quem governa a si mesmo.', 'Sêneca'],
        ['Ninguém nasce sábio.', 'Máximas de Ptahhotep'], ['A arte não tem limites; nenhum artesão atinge a perfeição.', 'Máximas de Ptahhotep'], ['A boa palavra é mais rara que a pedra verde.', 'Máximas de Ptahhotep'], ['Consulte o ignorante e também o sábio.', 'Máximas de Ptahhotep'], ['Siga seu coração enquanto viver.', 'Máximas de Ptahhotep'], ['A palavra é mais forte que qualquer luta.', 'Instrução para Merikare'], ['Pratique a justiça e você perdurará na terra.', 'Instrução para Merikare'], ['O sereno é como uma árvore no jardim: floresce.', 'Instrução de Amenemope'], ['Não passe a noite temendo o amanhã.', 'Instrução de Amenemope'], ['Melhor a pobreza na mão do deus que a riqueza no celeiro.', 'Instrução de Amenemope'],
        ['Aquele que viu o abismo conheceu todas as coisas.', 'Epopeia de Gilgamesh'], ['Uma corda de três fios não se rompe facilmente.', 'Epopeia de Gilgamesh'], ['Os dias do homem são contados; tudo o que ele faz é vento.', 'Epopeia de Gilgamesh'], ['Para que a justiça reine na terra.', 'Código de Hamurabi'], ['Para que o forte não oprima o fraco.', 'Código de Hamurabi'], ['Não pague o mal com o mal; responda com bondade a quem lhe faz mal.', 'Conselhos de sabedoria'], ['Contenha a boca e guarde a palavra.', 'Conselhos de sabedoria'], ['A amizade dura um dia; o parentesco, para sempre.', 'Provérbio sumério'], ['Um coração que ama constrói a casa; um que odeia a destrói.', 'Provérbio sumério'], ['Conte uma mentira e sua verdade passará por mentira.', 'Provérbio sumério'],
        ['Tudo o que somos é resultado do que pensamos.', 'Dhammapada'], ['Melhor que vencer mil é vencer a si mesmo.', 'Dhammapada'], ['Vença a raiva com calma; vença o mal com o bem.', 'Dhammapada'], ['Gota a gota enche-se o pote.', 'Dhammapada'], ['Você tem direito à ação, não aos seus frutos.', 'Bhagavad Gita'], ['O homem é feito de sua fé: o que crê, isso ele é.', 'Bhagavad Gita'], ['Para quem dominou a mente, a mente é a melhor amiga.', 'Bhagavad Gita'], ['Leva-me do irreal ao real, da escuridão à luz.', 'Brihadaranyaka Upanishad'], ['Fale a verdade; pratique a retidão.', 'Taittiriya Upanishad'], ['A verdade é uma; os sábios a chamam por muitos nomes.', 'Rig Veda'],
        ['Havia apenas imobilidade e silêncio, na escuridão, na noite.', 'Popol Vuh'], ['Que haja luz, que amanheça no céu e na terra!', 'Popol Vuh'], ['Que todos se levantem, que ninguém fique para trás.', 'Popol Vuh'], ['Sua vista alcançava longe; conheceram tudo o que há no mundo.', 'Popol Vuh'], ['Toda lua, todo ano, todo dia, todo vento caminha e também passa.', 'Chilam Balam de Chumayel'], ['Em verdade vos damos graças, duas e três vezes!', 'Popol Vuh'], ['Não roube, não minta, não seja preguiçoso.', 'Tríade inca (Ama sua, ama llulla, ama quella)'], ['Onde estás? Em cima, embaixo ou ao redor?', 'Hino a Viracocha (registrado por Cristóbal de Molina)'], ['Hoje por você, amanhã por mim.', 'Tradição andina de reciprocidade (ayni)'],
      ],
    }
    const DRIFT_ORDER = ['chinese', 'greek', 'roman', 'egyptian', 'babylonian', 'indian', 'maya', 'inca']
    function driftQuotes(style, lang) {
      const base = DRIFT_QUOTES[style] || DRIFT_QUOTES.greek
      const l = (lang || 'en').slice(0, 2)
      if (l === 'zh') return base.map(q => ({ text: q[0], from: q[1] }))
      if (DRIFT_I18N[l]) {
        const key = DRIFT_QUOTES[style] ? style : 'greek'
        const off = DRIFT_ORDER.slice(0, DRIFT_ORDER.indexOf(key)).reduce((n, k) => n + DRIFT_QUOTES[k].length, 0)
        return DRIFT_I18N[l].slice(off, off + DRIFT_QUOTES[key].length).map(q => ({ text: q[0], from: q[1] }))
      }
      return base.map(q => ({ text: q[2], from: q[3] }))
    }

    // 各地日月的意象、描述与典籍/文物出处（点击日月弹出临时气泡）
    const ORB_LORE = {
      zh: {
        chinese: {
          sun: ['三足金乌', '日中有踆乌，展翅负日凌空，象征上古光明与生命的生生不息。', '《淮南子·精神训》· 马王堆一号汉墓帛画'],
          moon: ['玉兔捣药', '月中仙兽，手持玉杵长跪捣药，守望千百年来夜空的静谧与期盼。', '《楚辞·天问》· 汉代画像石']
        },
        greek: {
          sun: ['韦尔吉纳太阳', '十六道芒线交替舒展的神圣日轮，阿吉德王室与光明之神阿波罗的光芒象征。', '古希腊韦尔吉纳王家墓金棺 · 希腊瓶画'],
          moon: ['塞勒涅新月', '月女神塞勒涅头戴的侧向新月神冠，乘着清晖夜车在星空中漫游。', '赫西俄德《神谱》· 古希腊红绘陶瓶']
        },
        babylonian: {
          sun: ['沙玛什太阳盘', '四角芒星交织四道水波纹光芒，代表光辉普照与公正昭彰。', '大英博物馆《沙玛什石板》（西帕尔出土）'],
          moon: ['月神辛之天舟', '低纬度夜空下宛若金舟横卧的新月，被称为载运清辉巡游穹苍的“天之光舟”。', '苏美尔《辛赞歌》· 乌尔第三王朝滚筒印章']
        },
        indian: {
          sun: ['科纳克太阳轮', '太阳神苏利耶战车的二十四辐巨轮，象征宇宙运转的时间节律与生命循环。', '印度科纳克太阳神庙（世界遗产）· 《梨俱吠陀》'],
          moon: ['湿婆发间新月', '微仰的新月佩戴于湿婆发髻，象征时间流转中的宁静、超脱与再生。', '《往世书》湿婆“佩戴新月者”造像 · 《梨俱吠陀》']
        },
        egyptian: {
          sun: ['阿顿神日轮', '日轮光芒如瀑倾泻，道道光线末端皆为抚慰与赐福人间的温暖手掌。', '阿肯那顿法老浮雕 · 埃赫那吞《阿顿赞歌》'],
          moon: ['孔苏月神冠', '两角仰起的新月托着一轮完整的满月圆盘，象征夜空庇佑与圆满无缺。', '卡纳克神庙孔苏雕像 · 大英博物馆 EA107 像']
        },
        roman: {
          sun: ['索尔·无敌者辐射冠', '太阳神索尔头戴的十二道放射金冠，象征一年十二月与不息的坚韧光明。', '罗马帝国索尔·无敌者钱币 · 祭坛浮雕'],
          moon: ['露娜与晨星', '月女神露娜的新月怀抱璀璨晨星（维纳斯），守望黑夜与破晓的安宁。', '罗马哈德良至塞维鲁王朝钱币 · 普林尼《自然史》']
        },
        maya: {
          sun: ['基尼奇·阿豪日轮', '玛雅太阳神基尼奇·阿豪的四瓣花金轮，象征照耀丛林万物的神圣天火与生命节律。', '奇琴伊察美洲豹神殿雕刻 · 《德累斯顿手抄本》'],
          moon: ['伊希切尔之玉兔新月', '月亮与织造女神伊希切尔守护的新月，怀抱长耳玉兔，守望着夜幕下的河流与梦境。', '玛雅古典期陶绘“抱兔月神” · 《德累斯顿手抄本》']
        },
        inca: {
          sun: ['因蒂金辉日轮', '印加太阳神因蒂的面庞与直曲相交的十六道神光，象征安第斯大地的丰饶、温暖与生命源泉。', '库斯科太阳神庙金盘 · 秘鲁国家博物馆藏品'],
          moon: ['玛玛·基利亚银辉之月', '银色月神玛玛·基利亚的清辉，如银箔般洒向安第斯雪山与梯田，守望耕作的时间节序与宁静安详。', '库斯科月亮神殿浮雕 · 《印加王室述评》']
        }
      },
      en: {
        chinese: {
          sun: ['Three-Legged Golden Crow', 'The celestial bird inhabiting the sun, carrying the dawn and undying light across the sky.', 'Huainanzi · Mawangdui Silk Banner'],
          moon: ['Jade Rabbit', 'The divine hare in the moon, tirelessly pounding the elixir of longevity beneath the quiet night.', 'Songs of Chu · Han Dynasty Reliefs']
        },
        greek: {
          sun: ['Vergina Sun', 'A sixteen-rayed royal solar emblem, radiating the divine light of Apollo and the Argead kings.', 'Vergina Royal Tombs Larnax · Attic Art'],
          moon: ['Selene’s Crescent', 'The crescent crown of moon goddess Selene, gliding across the starry vault on her silver chariot.', 'Hesiod’s Theogony · Greek Red-figure Vases']
        },
        babylonian: {
          sun: ['Shamash Sun Disk', 'A four-pointed solar star entwined with undulating streams of radiant light and universal justice.', 'Tablet of Shamash (British Museum, Sippar)'],
          moon: ['Boat of Sin', 'The horizontal crescent moon resembling a golden skiff sailing through ancient Mesopotamian skies.', 'Sumerian Hymns to Sin · Ur Cylinder Seals']
        },
        indian: {
          sun: ['Konark Surya Wheel', 'The twenty-four spoke chariot wheel of the sun god Surya, turning the eternal cycles of cosmic time.', 'Konark Sun Temple · Rigveda'],
          moon: ['Shiva’s Crescent (Chandrashekhara)', 'The slender crescent adorning Shiva’s matted locks, signifying tranquility, renewal, and timelessness.', 'Puranic Iconography · Rigveda']
        },
        egyptian: {
          sun: ['Aten Solar Disk', 'A cascade of divine light descending from the solar orb, each ray ending in a gentle hand blessing the earth.', 'Amarna Reliefs · Great Hymn to the Aten'],
          moon: ['Khonsu Lunar Crown', 'An upturned crescent horn cradling the full lunar disk, embodying celestial protection and wholeness.', 'Karnak Temple Khonsu Statues · British Museum EA107']
        },
        roman: {
          sun: ['Radiant Crown of Sol Invictus', 'Twelve radiant rays crowning the Invincible Sun, symbol of the twelve months and enduring fortitude.', 'Sol Invictus Coinage · Roman Altar Reliefs'],
          moon: ['Luna and the Morning Star', 'The crescent of goddess Luna embracing the brilliant morning star, keeping vigil until dawn.', 'Hadrianic & Severan Coinage · Pliny’s Natural History']
        },
        maya: {
          sun: ['Kinich Ahau Solar Disc', 'The four-petaled solar flower glyph of the sun lord Kinich Ahau, bringing celestial warmth and vitality to the rainforest.', 'Temple of the Jaguars, Chichen Itza · Dresden Codex'],
          moon: ['Ixchel and the Lunar Rabbit', 'The crescent moon cradled by the lunar goddess Ixchel, holding her sacred rabbit while watching over nocturnal rivers and dreams.', 'Classic Maya "Moon Goddess with Rabbit" Vase · Dresden Codex']
        },
        inca: {
          sun: ['Inti Solar Emblem', 'The golden visage of the Inca sun god Inti with alternating straight and flaming rays, source of warmth and life across the Andes.', 'Qorikancha Golden Disc, Cusco · National Museum of Peru'],
          moon: ['Mama Killa Silver Moon', 'The silvery light of the moon goddess Mama Killa, gracing Andean peaks and terraces while guarding the rhythms of time.', 'Temple of the Moon, Cusco · Royal Commentaries of the Incas']
        }
      },
      ja: {
        chinese: {
          sun: ['三足金烏', '太陽の中に棲む神鳥。翼を広げて日輪を背負い、永遠の光明と生命の巡りを象徴します。', '『淮南子』・馬王堆一号漢墓帛画'],
          moon: ['玉兎の薬搗き', '月の中の神獣。玉の杵を手にして薬を搗き、悠久の夜空の静寂と祈りを見守ります。', '『楚辞』天問・漢代画像石']
        },
        greek: {
          sun: ['ヴェルギナの太陽', '長短十六条の光芒が交差する神聖な日輪。アルゲアス王家と太陽神アポロンの象徴。', 'ヴェルギナ王墓の黄金の骨箱・古代ギリシャ陶器'],
          moon: ['セレネの三日月', '月の女神セレネが戴くたおやかな月冠。銀の車を駆り、夜空を静かに巡ります。', 'ヘシオドス『神統記』・古代ギリシャ赤絵式壺絵']
        },
        babylonian: {
          sun: ['シャマシュの太陽盤', '四角の星と波打つ光芒が織りなす日輪。あまねく照らす光と正義の勝利を表します。', '大英博物館『シャマシュの石板』（シッパル出土）'],
          moon: ['月神シンの天の舟', '低緯度の夜空に小舟のように横たわる三日月。「天の光舟」と呼ばれ光を運びます。', 'シュメール『シン賛歌』・ウル円筒印章']
        },
        indian: {
          sun: ['コナルクの太陽車輪', '太陽神スーリヤの戦車を支える二十四条の車輪。宇宙の巡りと生命の律動を象徴します。', 'コナルク太陽寺院（世界遺産）・『リグ・ヴェーダ』'],
          moon: ['シヴァ神の三日月', 'シヴァ神の髪に戴く上向きの月。時の流れにおける静寂と再生を象徴します。', '『プラーナ文献』シヴァ神像・『リグ・ヴェーダ』']
        },
        egyptian: {
          sun: ['アテン神の日輪', '天より降りそそぐ光芒。その一本一本の先端には、地上を慈しみ祝福する小さな手が描かれます。', 'アマルナ浮彫・アクエンアテン『アテン賛歌』'],
          moon: ['コンス神の月神冠', '仰ぎ見る三日月の角が満月を抱く神冠。夜空の加護と満ち足りた調和を表します。', 'カルナック神殿コンス像・大英博物館 EA107']
        },
        roman: {
          sun: ['ソル・インウィクトゥスの放射冠', '不敗の太陽神ソルが頭上に戴く十二条の金冠。十二の月と不滅の光を象徴します。', 'ローマ帝国ソル・インウィクトゥス貨幣・祭壇浮彫'],
          moon: ['ルーナと明けの明星', '月の女神ルーナの三日月が輝く明けの明星を抱き、夜明けまでの平穏を見守ります。', 'ハドリアヌス・セウェルス朝貨幣・プリニウス『博物誌』']
        },
        maya: {
          sun: ['キニチ・アハウの太陽車', '密林を照らす太陽神キニチ・アハウの四弁花紋。天なる光と生の巡りを象徴する。', 'チチェン・イッツァ ジャガーの神殿彫刻 · 『ドレスデン絵文書』'],
          moon: ['イシュチェルのウサギ新月', '月の女神イシュチェルが抱く聖なるウサギの新月。夜の川辺と夢路を静かに見守る。', 'マヤ古典期彩文土器「ウサギを抱く月神」 · 『ドレスデン絵文書』']
        },
        inca: {
          sun: ['太陽神インティの黄金盤', '直線と炎の光芒を交互に放つ太陽神インティの尊顔。アンデスを育む温もりといのちの源泉。', 'クスコ太陽神殿（コリカンチャ）黄金円盤 · ペルー国立博物館'],
          moon: ['ママ・キリャの銀の月', '月の女神ママ・キリャの銀の光。アンデスの雪峰と段々畑を照らし、時の暦と安らぎを守護する。', 'クスコ月の神殿浮彫 · 『インカ皇朝記』']
        }
      },
      es: {
        chinese: {
          sun: ['Cuervo Dorado de Tres Patas', 'El ave divina que habita en el sol, alzando el alba y la luz imperecedera en los cielos.', 'Huainanzi · Estandarte de seda de Mawangdui'],
          moon: ['Conejo de Jade', 'La liebre sagrada de la luna, machacando con su mano de mortero el elixir de la longevidad.', 'Cantos de Chu · Relieves de la dinastía Han']
        },
        greek: {
          sun: ['Sol de Vergina', 'Emblema solar real de dieciséis rayos, resplandor sagrado de Apolo y los reyes argéadas.', 'Larnax de las tumbas reales de Vergina · Cerámica ática'],
          moon: ['Creciente de Selene', 'La corona lunar de la diosa Selene, recorriendo el firmamento nocturno en su carro de plata.', 'Teogonía de Hesíodo · Vasos de figuras rojas']
        },
        babylonian: {
          sun: ['Disco Solar de Shamash', 'Estrella solar de cuatro puntas entrelazada con ondas de luz radiante y justicia soberana.', 'Tablilla de Shamash (Museo Británico, Sippar)'],
          moon: ['Barca de Sin', 'El creciente horizontal semejante a una barquilla dorada que surca los cielos de Mesopotamia.', 'Himnos sumerios a Sin · Sellos cilíndricos de Ur']
        },
        indian: {
          sun: ['Rueda Solar de Konark', 'La gran rueda de veinticuatro radios del carro de Surya, girando los ciclos eternos del tiempo.', 'Templo Solar de Konark · Rigveda'],
          moon: ['Creciente de Shiva (Chandrashekhara)', 'El creciente que adorna la cabellera de Shiva, encarnando serenidad, paz y renacimiento.', 'Iconografía puránica · Rigveda']
        },
        egyptian: {
          sun: ['Disco Solar de Atón', 'Ráfagas de luz celestial que descienden del sol, terminando cada rayo en una mano bienhechora.', 'Relieves de Amarna · Gran Himno a Atón'],
          moon: ['Corona Lunar de Jonsu', 'Un creciente alzado que acoge el disco de la luna llena, símbolo de amparo y plenitud.', 'Estatuas del Templo de Karnak · Museo Británico EA107']
        },
        roman: {
          sun: ['Corona Radiante de Sol Invictus', 'Doce rayos dorados coronando al Sol Invicto, símbolo de los doce meses y la luz inquebrantable.', 'Monedas de Sol Invictus · Relieves de altares romanos'],
          moon: ['Luna y el Lucero del Alba', 'El creciente de la diosa Luna acogiendo a la estrella matutina, custodiando la paz de la noche.', 'Monedas de Adriano y los Severos · Historia Natural de Plinio']
        },
        maya: {
          sun: ['Disco solar de Kinich Ahau', 'El glifo solar de cuatro pétalos del dios Kinich Ahau, que baña la selva de luz divina y ritmo vital.', 'Templo de los Jaguares en Chichén Itzá · Códice de Dresde'],
          moon: ['Ixchel y el conejo lunar', 'La luna creciente de la diosa lunar Ixchel, que abraza al conejo celeste guardando los ríos y sueños de la noche.', 'Cerámica clásica maya "Diosa de la luna con conejo" · Códice de Dresde']
        },
        inca: {
          sun: ['Sol de Inti', 'El rostro de oro del dios solar Inti con dieciséis rayos alternados, rectos y llameantes, fuente de calor y vida en los Andes.', 'Disco solar del Qorikancha en Cusco · Museo Nacional de Arqueología de Perú'],
          moon: ['Luna de plata de Mama Killa', 'El resplandor plateado de la diosa lunar Mama Killa, cubriendo las cumbres y andenes andinos y guardando los ciclos del tiempo.', 'Templo de la Luna en Cusco · Comentarios Reales de los Incas']
        }
      },
      fr: {
        chinese: {
          sun: ['Corbeau d’or à trois pattes', 'L’oiseau céleste résidant dans le soleil, portant l’aube et la lumière intarissable à travers les cieux.', 'Huainanzi · Bannière de soie de Mawangdui'],
          moon: ['Lièvre de jade', 'La créature lunaire agenouillée au pilon d’émeraude, veillant sur la paix et les espoirs de la nuit.', 'Chants de Chu · Bas-reliefs des Han']
        },
        greek: {
          sun: ['Soleil de Vergina', 'Emblème solaire royal à seize rayons, éclat sacré d’Apollon et de la dynastie des Argéades.', 'Larnax des tombes royales de Vergina · Céramique attique'],
          moon: ['Croissant de Séléné', 'La couronne de la déesse lunaire Séléné, guidant son char d’argent à travers la voûte étoilée.', 'Théogonie d’Hésiode · Vases à figures rouges']
        },
        babylonian: {
          sun: ['Disque Solaire de Shamash', 'Étoile solaire à quatre branches entrelacée d’ondes de lumière ardente et de justice absolue.', 'Tablette de Shamash (British Museum, Sippar)'],
          moon: ['Barque de Sîn', 'Le croissant couché semblable à une nacelle d’or naviguant sur les nuits de Mésopotamie.', 'Hymnes sumériens à Sîn · Sceaux-cylindres d’Ur']
        },
        indian: {
          sun: ['Roue Solaire de Konarak', 'La roue à vingt-quatre rayons du char de Surya, guidant les cycles éternels du temps cosmique.', 'Temple du Soleil de Konarak · Rig-Véda'],
          moon: ['Croissant de Shiva (Chandrashekhara)', 'Le doux croissant niché dans la chevelure de Shiva, symbolisant la sérénité et le renouveau.', 'Iconographie des Puranas · Rig-Véda']
        },
        egyptian: {
          sun: ['Disque Solaire d’Aton', 'Rayons de lumière descendant du disque solaire, s’achevant chacun par une main bienveillante bénissant la terre.', 'Reliefs d’Amarna · Grand Hymne à Aton'],
          moon: ['Couronne Lunaire de Khonsou', 'Un croissant aux pointes dressées soutenant la pleine lune, emblème de plénitude et de veille nocturne.', 'Statues du temple de Karnak · British Museum EA107']
        },
        roman: {
          sun: ['Couronne Rayonnante de Sol Invictus', 'Douze rayons d’or coiffant le Soleil Invaincu, symbole des douze mois et de la lumière indomptable.', 'Monnaies impériales de Sol Invictus · Bas-reliefs'],
          moon: ['Luna et l’Étoile du Matin', 'Le croissant de la déesse Luna veillant sur l’étoile du matin, gardien de la paix jusqu’à l’aurore.', 'Monnaies d’Hadrien et des Sévères · Pline l’Ancien']
        },
        maya: {
          sun: ['Disque solaire de Kinich Ahau', 'Le glyphe solaire à quatre pétales du dieu Kinich Ahau, dispensant sa clarté sacrée et le souffle de vie sur la canopée.', 'Temple des Jaguars à Chichén Itzá · Codex de Dresde'],
          moon: ['Ixchel et le lapin lunaire', 'Le croissant de la déesse lunar Ixchel, berçant le lièvre céleste et veillant sur les fleuves et les songes de la nuit.', 'Vase maya classique « Déesse de la lune au lapin » · Codex de Dresde']
        },
        inca: {
          sun: ['Disque solaire d’Inti', 'Le visage d’or du dieu solaire Inti aux seize rayons droits et flamboyants, source de vie et de fertilité dans les Andes.', 'Disque d’or du Qorikancha à Cuzco · Musée National du Pérou'],
          moon: ['Lune d’argent de Mama Killa', 'La lueur argentée de la déesse Mama Killa, caressant les cimes et les terrasses andines tout en veillant sur le rythme des saisons.', 'Temple de la Lune à Cuzco · Commentaires Royaux des Incas']
        }
      },
      de: {
        chinese: {
          sun: ['Dreibeinige Goldkrähe', 'Der himmlische Vogel in der Sonne, der das unvergängliche Licht über den Himmel trägt.', 'Huainanzi · Mawangdui-Seidenbanner'],
          moon: ['Jadehase', 'Der göttliche Hase im Mond, der mit seinem Stößel unermüdlich das Lebenselixier bereitet.', 'Elegien von Chu · Han-Reliefs']
        },
        greek: {
          sun: ['Sonne von Vergina', 'Das sechzehnstrahlige königliche Sonnensymbol, göttlicher Glanz von Apollon und den Argeaden.', 'Larnax der Königsgräber von Vergina · Attische Vasen'],
          moon: ['Sichel der Selene', 'Die sanfte Mondkrone der Göttin Selene, die ihren silbernen Wagen über das Firmament lenkt.', 'Hesiods Theogonie · Rotfigurige Vasen']
        },
        babylonian: {
          sun: ['Sonnenscheibe des Schamasch', 'Vierstrahliger Stern, durchflochten von Wellenbändern des Lichts und der allumfassenden Gerechtigkeit.', 'Schamasch-Tafel (British Museum, Sippar)'],
          moon: ['Himmelsbarke des Sin', 'Die liegende Mondsichel, die wie ein goldenes Boot durch die mesopotamische Nacht gleitet.', 'Sumerische Hymnen an Sin · Rollsiegel aus Ur']
        },
        indian: {
          sun: ['Sonnenrad von Konark', 'Das vierundzwanzigspeichige Rad des Streitwagens von Surya, das die Zyklen der kosmischen Zeit dreht.', 'Sonnentempel von Konark · Rigveda'],
          moon: ['Mondsichel des Shiva (Chandrashekhara)', 'Die Mondsichel in Shivas Haar, Sinnbild für heitere Zeitlosigkeit und ewige Erneuerung.', 'Puranische Ikonographie · Rigveda']
        },
        egyptian: {
          sun: ['Sonnenscheibe des Aton', 'Strahlenkaskaden, die vom Sonnendisker herabsteigen und in segnenden Händen enden.', 'Amarna-Reliefs · Großer Hymnus an Aton'],
          moon: ['Mondkrone des Chons', 'Eine aufwärts gebogene Mondsichel, die die volle Mondscheibe birgt; Symbol nächtlicher Vollkommenheit.', 'Karnak-Tempel-Statuen · British Museum EA107']
        },
        roman: {
          sun: ['Strahlenkrone des Sol Invictus', 'Zwölf goldene Strahlen der Unbesiegten Sonne, Symbol der zwölf Monate und unerschütterlichen Lichts.', 'Münzen des Sol Invictus · Römische Altarreliefs'],
          moon: ['Luna und der Morgenstern', 'Die Mondsichel der Göttin Luna, die den Morgenstern birgt und über die Nachtruhe wacht.', 'Münzen der Antonine und Severer · Plinius, Naturalis historia']
        },
        maya: {
          sun: ['Sonnenscheibe des Kinich Ahau', 'Die vierblättrige Sonnenglyphe des Sonnengottes Kinich Ahau, Sinnbild göttlichen Lichts und lebendiger Rhythmen über dem Urwald.', 'Jaguartempel in Chichén Itzá · Dresdner Kodex'],
          moon: ['Ixchel und der Mondhase', 'Die Mondsichel der Mondgöttin Ixchel, die den himmlischen Hasen im Arm hält und über nächtliche Ströme und Träume wacht.', 'Klassische Maya-Vase „Mondgöttin mit Hase“ · Dresdner Kodex']
        },
        inca: {
          sun: ['Sonnenscheibe des Inti', 'Das goldene Antlitz des Inka-Sonnengottes Inti mit abwechselnd geraden und wellenförmigen Strahlen, Quell des Lebens in den Anden.', 'Goldene Sonnenscheibe von Coricancha, Cusco · Nationalmuseum von Peru'],
          moon: ['Silbermond der Mama Killa', 'Der silbrige Schein der Mondgöttin Mama Killa, der über Andengipfel und Terrassen wacht und die Jahreszeiten behütet.', 'Mondtempel in Cusco · Königliche Kommentare der Inka']
        }
      },
      ru: {
        chinese: {
          sun: ['Трёхлапый золотой ворон', 'Небесная птица, обитающая в солнце и несущая на своих крылах рассвет и вечный свет.', 'Хуайнань-цзы · Шёлковое знамя из Мавандуя'],
          moon: ['Нефритовый заяц', 'Лунное божественное существо, толкущее в ступе эликсир бессмертия под тихим ночным небом.', 'Чуские строфы · Рельефы эпохи Хань']
        },
        greek: {
          sun: ['Вергинская звезда', 'Шестнадцатилучевой царский солнечный символ, священный свет Аполлона и царей Аргеадов.', 'Золотой ларнак из Вергины · Аттическая керамика'],
          moon: ['Серп Селены', 'Полумесяц богини Селены, правящей серебряной колесницей в тишине звёздного неба.', 'Теогония Гесиода · Древнегреческая вазопись']
        },
        babylonian: {
          sun: ['Солнечный диск Шамаша', 'Четырёхконечная звезда, сплетённая с волнистыми потоками сияния и высшей справедливости.', 'Табличка Шамаша (Британский музей, Сиппар)'],
          moon: ['Ладья бога Сина', 'Горизонтальный полумесяц, плывущий по небу Месопотамии словно золотая небесная ладья.', 'Шумерские гимны Сину · Цилиндрические печати Ура']
        },
        indian: {
          sun: ['Солнечное колесо Конарака', 'Двадцатичетырёхспицевое колесо колесницы Сурьи, вращающее циклы вечного времени.', 'Храм солнца в Конараке · Ригведа'],
          moon: ['Полумесяц Шивы (Чандрашекхара)', 'Изящный месяц в волосах Шивы, олицетворяющий безмятежность, покой и возрождение.', 'Иконография Пуран · Ригведа']
        },
        egyptian: {
          sun: ['Солнечный диск Атона', 'Нисходящие солнечные лучи, каждый из которых оканчивается ласковой благословляющей дланью.', 'Рельефы Амарны · Великий гимн Атону'],
          moon: ['Лунная корона Хонсу', 'Полумесяц с поднятыми рогами, бережно держащий диск полной луны; символ гармонии и защиты.', 'Статуи храма в Карнаке · Британский музей EA107']
        },
        roman: {
          sun: ['Лучистый венец Непобедимого Солнца', 'Двенадцать золотых лучей венца Sol Invictus, символизирующие двенадцать месяцев и непоколебимый свет.', 'Монеты Sol Invictus · Римские рельефы'],
          moon: ['Луна и Утренняя звезда', 'Серп богини Луны, обнимающий сияющую утреннюю звезду и хранящий ночной покой.', 'Монеты Адриана и Северов · Естественная история Плиния']
        },
        maya: {
          sun: ['Солнечный диск Кинич Ахау', 'Четырёхлепестковый солярный глиф бога солнца Кинич Ахау, несущий тепло и жизнь сельве.', 'Храм Ягуаров в Чичен-Ице · Дрезденский кодекс'],
          moon: ['Ишчель и лунный заяц', 'Полумесяц богини Ишчель, баюкающей небесного зайца и хранящей ночные реки и сновидения.', 'Классическая керамика майя «Богиня луны с зайцем» · Дрезденский кодекс']
        },
        inca: {
          sun: ['Солнечный лик Инти', 'Золотой лик бога солнца Инти с шестнадцатью прямыми и пламенеющими лучами, источник тепла и плодородия в Андах.', 'Золотой диск Кориканча в Куско · Национальный музей Перу'],
          moon: ['Серебряная луна Мама Килья', 'Серебристый свет богини Мама Килья, озаряющий андские вершины и террасы и хранящий покой времён.', 'Храм Луны в Куско · История государства инков']
        }
      },
      pt: {
        chinese: {
          sun: ['Corvo Dourado de Três Pernas', 'A ave celestial que habita o sol, elevando o amanhecer e a luz perene através do firmamento.', 'Huainanzi · Estandarte de seda de Mawangdui'],
          moon: ['Coelho de Jade', 'A criatura mítica na lua, macerando pacientemente no pilão o elixir da longevidade.', 'Canções de Chu · Relevos da dinastia Han']
        },
        greek: {
          sun: ['Sol de Vergina', 'Emblema solar real de dezesseis pontas, esplendor sagrado de Apolo e da dinastia dos Argeadas.', 'Lárnax das tumbas reais de Vergina · Vasos áticos'],
          moon: ['Crescente de Selene', 'A coroa lunar da deusa Selene, conduzindo sua carruagem de prata pelos caminhos do céu noturno.', 'Teogonia de Hesíodo · Pintura de figuras vermelhas']
        },
        babylonian: {
          sun: ['Disco Solar de Shamash', 'Estrela solar de quatro pontas entrelaçada com ondas fluídas de luz radiante e justiça sagrada.', 'Tabuleta de Shamash (Museu Britânico, Sipar)'],
          moon: ['Barca de Sin', 'O crescente horizontal que cruza os céus da Mesopotâmia como uma reluzente canoa dourada.', 'Hinos sumérios a Sin · Selos cilíndricos de Ur']
        },
        indian: {
          sun: ['Roda Solar de Konark', 'A grande roda de vinte e quatro raios da carruagem de Surya, regendo os ciclos eternos do tempo.', 'Templo do Sol de Konark · Rigveda'],
          moon: ['Crescente de Shiva (Chandrashekhara)', 'O fino crescente pousado nos cabelos de Shiva, encarnando serenidade e renascimento contínuo.', 'Iconografia dos Puranas · Rigveda']
        },
        egyptian: {
          sun: ['Disco Solar de Aton', 'Raios celestes que descem do sol, terminando cada raio em uma mão acolhedora que abençoa a terra.', 'Relevos de Amarna · Grande Hino a Aton'],
          moon: ['Coroa Lunar de Khonsu', 'Um crescente erguido que aconchega o disco da lua cheia, emblema de refúgio e integridade na noite.', 'Estátuas do templo de Karnak · Museu Britânico EA107']
        },
        roman: {
          sun: ['Coroa Radiante de Sol Invictus', 'Doze raios de ouro coroando o Sol Invicto, símbolo dos doze meses e da luz perene.', 'Moedas de Sol Invictus · Relevos em altares romanos'],
          moon: ['Luna e a Estrela da Manhã', 'O crescente da deusa Luna abrigando a estrela matutina, guardando o sossego até o romper da aurora.', 'Moedas de Adriano e dos Severos · História Natural de Plínio']
        },
        maya: {
          sun: ['Disco solar de Kinich Ahau', 'O glifo solar de quatro pétalas do deus Kinich Ahau, derramando luz sagrada e vigor sobre a selva.', 'Templo dos Jaguares em Chichén Itzá · Códice de Dresden'],
          moon: ['Ixchel e o coelho lunar', 'O crescente da deusa lunar Ixchel, acolhendo o coelho celeste e velando sobre os rios e os sonhos da noite.', 'Cerâmica maia clássica "Deusa da lua com coelho" · Códice de Dresden']
        },
        inca: {
          sun: ['Disco solar de Inti', 'A face dourada do deus solar Inti com dezesseis raios retos e ondulantes, fonte de calor e vida nos Andes.', 'Disco solar de Qorikancha em Cusco · Museu Nacional de Arqueologia do Peru'],
          moon: ['Lua prateada de Mama Killa', 'O brilho prateado da deusa lunar Mama Killa, repousando sobre os picos e socalcos andinos e guardando os ciclos do tempo.', 'Templo da Lua em Cusco · Comentários Reais dos Incas']
        }
      }
    }
    function getOrbLore(style, isSun, lang) {
      const l = (lang || 'en').slice(0, 2)
      const dict = ORB_LORE[l] || ORB_LORE.zh
      const styleLore = dict[style] || dict.greek
      const entry = isSun ? styleLore.sun : styleLore.moon
      return { name: entry[0], desc: entry[1], source: entry[2] }
    }

    // 全屏背景：天色 + 一整座建筑居中（随复盘记录下滑生长，约滑到六成就长全）+ 生机层（云、动物、人、日月）+ 弹幕名言。
    // 自然元素一开始就画全；系统开了"减少动态效果"时，只保留静止画面，不做交互和弹幕。
    // 背景只是装饰：它出错时只让背景消失，不拖垮整个页面
    class QuietBoundary extends React.Component {
      constructor(props) { super(props); this.state = { failed: false } }
      static getDerivedStateFromError() { return { failed: true } }
      componentDidCatch(err) { try { console.warn('[melete] backdrop disabled:', err && err.message) } catch { /* 忽略 */ } }
      render() { return this.state.failed ? null : this.props.children }
    }

    function Backdrop({ style, grow, lang, showArch = true }) {
      const ref = useRef(null)
      const html = useMemo(() => archSvgInner(style), [style])
      const life = useMemo(() => lifeSvgInner(style), [style])
      const still = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

      // 建筑生长；长全的那一刻放一次小动效（线条亮一下，一群鸟飞过）
      useEffect(() => {
        if (!showArch) return undefined
        const box = ref.current
        const scroller = box && box.closest('.mel')
        if (!box || !scroller) return undefined
        const parts = Array.from(box.querySelectorAll('.bld[data-s]')).map(el => ({ el, s: +el.dataset.s, e: +el.dataset.e }))
        let raf = 0, lastP = -1, doneTimer = 0
        const apply = () => {
          raf = 0
          box.style.height = `${scroller.clientHeight}px`
          let p = 1
          if (grow) {
            const room = scroller.scrollHeight - scroller.clientHeight
            p = room > 120 ? Math.min(1, 0.04 + 0.96 * scroller.scrollTop / (room * 0.6)) : 1
          }
          if (grow && p >= 1 && lastP >= 0 && lastP < 1 && !still()) {
            box.classList.remove('is-done')
            void box.offsetWidth
            box.classList.add('is-done')
            clearTimeout(doneTimer)
            doneTimer = setTimeout(() => box.classList.remove('is-done'), 4200)
          }
          lastP = p
          for (const it of parts) {
            const k = Math.max(0, Math.min(1, (p - it.s) / Math.max(0.001, it.e - it.s)))
            it.el.style.strokeDashoffset = String(1 - k)
          }
        }
        const on = () => { if (!raf) raf = requestAnimationFrame(apply) }
        apply()
        scroller.addEventListener('scroll', on, { passive: true })
        window.addEventListener('resize', on)
        let ro = null
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(on); ro.observe(scroller); if (scroller.lastElementChild) ro.observe(scroller.lastElementChild) }
        return () => {
          cancelAnimationFrame(raf)
          clearTimeout(doneTimer)
          scroller.removeEventListener('scroll', on)
          window.removeEventListener('resize', on)
          if (ro) ro.disconnect()
        }
      }, [html, grow, showArch])

      // 生机层：日月按本机时间定位；鼠标靠近时云被拨开、动物和人跑开、鸟飞走，日月放光弹跳
      useEffect(() => {
        const box = ref.current
        const scroller = box && box.closest('.mel')
        const svg = box && box.querySelector('svg.life')
        if (!svg || !scroller) return undefined
        const orb = svg.querySelector('.orb')
        const placeOrb = () => {
          const o = orbPlace(new Date())
          orb.dataset.x = String(o.x); orb.dataset.y = String(o.y)
          orb.setAttribute('transform', `translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})`)
          orb.classList.toggle('is-day', o.day); orb.classList.toggle('is-night', !o.day)
        }
        placeOrb()
        const orbTimer = setInterval(placeOrb, 300000)
        const NS = 'http://www.w3.org/2000/svg'
        const cloudLayer = svg.querySelector('.clouds')
        const cloudPath = LIFE_SHAPES[style === 'chinese' ? 'xiangyun' : 'cloud']
        let clouds = [], cloudTarget = 1 + Math.floor(Math.random() * 3), cloudTimer = 0, craf = 0, clast = 0
        const viewX = () => {
          const m = svg.getScreenCTM && svg.getScreenCTM()
          const r = svg.getBoundingClientRect()
          if (!m || !r.width) return [0, 1200]
          const inv = m.inverse()
          return [new DOMPoint(r.left, r.top).matrixTransform(inv).x, new DOMPoint(r.right, r.top).matrixTransform(inv).x]
        }
        const addCloud = x => {
          let y = 0
          for (let n = 0; n < 8; n++) { y = 90 + Math.random() * 210; if (clouds.every(c => Math.abs(c.y - y) > 50)) break }
          const sc = 0.6 + Math.random() * 0.6
          const g = document.createElementNS(NS, 'g')
          g.setAttribute('class', 'crit cloud')
          const b = document.createElementNS(NS, 'g')
          b.setAttribute('transform', `scale(${sc.toFixed(2)})`)
          const pth = document.createElementNS(NS, 'path')
          pth.setAttribute('d', cloudPath)
          b.appendChild(pth); g.appendChild(b); cloudLayer.appendChild(g)
          const c = { el: g, x, y, v: 6 + Math.random() * 6 + (sc - 0.6) * 5, dx: 0, vx: 0 }
          g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
          clouds.push(c)
        }
        if (cloudLayer) {
          const [l, r] = viewX()
          for (let n = 0; n < cloudTarget; n++) addCloud(l + (r - l) * (0.1 + Math.random() * 0.8))
        }
        if (still()) return () => { clearInterval(orbTimer); clouds.forEach(c => c.el.remove()) }
        const cast = LIFE_CAST[style] || LIFE_CAST.greek
        const crits = Array.from(svg.querySelectorAll('.crit[data-i]')).map(el => {
          const c = cast[+el.dataset.i]
          return { el, body: el.firstElementChild, kind: c[0], x0: c[2], y0: c[3], s: c[4], dx: 0, dy: 0, vx: 0, vy: 0, face: 1, ph: 0 }
        })
        const R = { cloud: 150, run: 120, swim: 110, fly: 130 }
        const mouse = { x: -9999, y: -9999, on: false, at: 0 }
        let raf = 0
        const step = () => {
          raf = 0
          let busy = false
          for (const c of crits) {
            const x = c.x0 + c.dx, y = c.y0 + c.dy
            let pushed = false
            if (mouse.on) {
              const ddx = x - mouse.x, ddy = (y - 20) - mouse.y, d = Math.hypot(ddx, ddy), r = R[c.kind] || 120
              if (d < r) {
                // 越靠近推得越用力，但加速度很小，像被轻轻惊动
                const k = (1 - d / r) * (1 - d / r), sx = ddx === 0 ? 1 : Math.sign(ddx)
                pushed = true
                if (c.kind === 'cloud') c.vx += sx * 0.1 * k
                else if (c.kind === 'fly') { c.vx += sx * 0.2 * k; c.vy -= 0.16 * k }
                else c.vx += sx * (c.kind === 'run' ? 0.2 : 0.12) * k
              }
            }
            // 慢慢回家：弹簧很软，阻尼较大，并限制最高速度，动作平滑不突兀
            // 躲开时稍快，走回来时更慢、更悠闲
            const spring = c.kind === 'cloud' ? 0.0006 : 0.001
            const vmax = pushed ? (c.kind === 'cloud' ? 0.7 : c.kind === 'run' ? 1.3 : 1.0) : (c.kind === 'cloud' ? 0.22 : 0.45)
            c.vx = Math.max(-vmax, Math.min(vmax, (c.vx - c.dx * spring) * 0.955))
            c.vy = Math.max(-vmax, Math.min(vmax, (c.vy - c.dy * spring) * 0.955))
            c.dx = Math.max(-280, Math.min(280, c.dx + c.vx))
            c.dy = Math.max(-200, Math.min(30, c.dy + c.vy))
            c.ph += Math.abs(c.vx) * 0.32
            let bob = 0
            if (c.kind === 'run' && Math.abs(c.vx) > 0.25) bob = -Math.abs(Math.sin(c.ph)) * Math.min(4, Math.abs(c.vx) * 2)
            if (c.kind === 'swim') bob = Math.sin(c.ph) * 2
            if (Math.abs(c.vx) > 0.35) c.face = c.vx < 0 ? -1 : 1
            c.el.setAttribute('transform', `translate(${(c.x0 + c.dx).toFixed(1)} ${(c.y0 + c.dy + bob).toFixed(1)})`)
            if (c.kind !== 'cloud' && c.body) c.body.setAttribute('transform', `scale(${(c.s * c.face).toFixed(2)} ${c.s})`)
            if (Math.abs(c.dx) > 0.3 || Math.abs(c.dy) > 0.3 || Math.abs(c.vx) > 0.02 || Math.abs(c.vy) > 0.02) busy = true
          }
          const hot = mouse.on && Math.hypot(mouse.x - +orb.dataset.x, mouse.y - +orb.dataset.y) < 90
          if (hot !== orb.classList.contains('hot')) orb.classList.toggle('hot', hot)
          if (busy || (mouse.on && performance.now() - mouse.at < 1200)) raf = requestAnimationFrame(step)
        }
        const kick = () => { if (!raf) raf = requestAnimationFrame(step) }
        const ctick = now => {
          const dt = Math.min(0.1, (now - clast) / 1000)
          clast = now
          const [l] = viewX()
          clouds = clouds.filter(c => {
            let pushed = false
            if (mouse.on) {
              const ddx = c.x + c.dx - mouse.x, ddy = c.y - 14 - mouse.y, d = Math.hypot(ddx, ddy)
              if (d < 150) { const k = (1 - d / 150) * (1 - d / 150); c.vx += (ddx === 0 ? 1 : Math.sign(ddx)) * 0.1 * k; pushed = true }
            }
            const vm = pushed ? 0.7 : 0.22
            c.vx = Math.max(-vm, Math.min(vm, (c.vx - c.dx * 0.0006) * 0.955))
            c.dx += c.vx
            c.x -= c.v * dt
            c.el.setAttribute('transform', `translate(${(c.x + c.dx).toFixed(1)} ${c.y.toFixed(1)})`)
            if (c.x + c.dx < l - 90) { c.el.remove(); return false }
            return true
          })
          craf = document.hidden ? 0 : requestAnimationFrame(ctick)
        }
        const startClouds = () => { if (!craf && !document.hidden) { clast = performance.now(); craf = requestAnimationFrame(ctick) } }
        const scheduleCloud = () => {
          cloudTimer = setTimeout(() => {
            if (!document.hidden && clouds.length < cloudTarget) { const [, r] = viewX(); addCloud(r + 80) }
            cloudTarget = 1 + Math.floor(Math.random() * 3)
            scheduleCloud()
          }, 15000 + Math.random() * 25000)
        }
        const onVis = () => startClouds()
        document.addEventListener('visibilitychange', onVis)
        startClouds()
        scheduleCloud()
        let popTimer = 0
        let popEl = null
        const hidePop = () => {
          if (popTimer) { clearTimeout(popTimer); popTimer = 0 }
          if (popEl) {
            popEl.classList.remove('show')
            const el = popEl
            setTimeout(() => el.remove(), 260)
            popEl = null
          }
        }
        const showPop = () => {
          hidePop()
          const isDark = document.body.hasAttribute('data-ds-dark-theme')
          const lore = getOrbLore(style, !isDark, lang)
          if (!lore) return

          const r = orb.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2

          popEl = document.createElement('div')
          popEl.className = 'mel-orb-pop'
          popEl.innerHTML = `<div class="mel-orb-pop-head"><span class="mel-orb-pop-title">${lore.name}</span><button type="button" class="mel-orb-pop-close" aria-label="Close">×</button></div><div class="mel-orb-pop-desc">${lore.desc}</div><div class="mel-orb-pop-source">${lore.source}</div>`
          const closeBtn = popEl.querySelector('.mel-orb-pop-close')
          if (closeBtn) closeBtn.onclick = e => { e.stopPropagation(); hidePop() }

          document.body.appendChild(popEl)

          const popW = Math.min(320, window.innerWidth - 32)
          popEl.style.width = `${popW}px`
          const isLeft = cx < window.innerWidth / 2
          let left = isLeft ? cx + 42 : cx - popW - 42
          if (left < 16) left = 16
          if (left + popW > window.innerWidth - 16) left = window.innerWidth - popW - 16
          let top = cy - 36
          if (top < 16) top = 16
          if (top + 160 > window.innerHeight) top = Math.max(16, window.innerHeight - 170)

          popEl.style.left = `${left.toFixed(1)}px`
          popEl.style.top = `${top.toFixed(1)}px`

          requestAnimationFrame(() => {
            if (popEl) popEl.classList.add('show')
          })

          popTimer = setTimeout(hidePop, 6500)
        }

        const onOrbClick = e => {
          e.stopPropagation()
          if (popEl) hidePop()
          else showPop()
        }
        orb.addEventListener('click', onOrbClick)

        const onGlobalClick = e => {
          if (popEl && popEl.contains(e.target)) return
          const m = svg.getScreenCTM && svg.getScreenCTM()
          if (m) {
            const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
            if (Math.hypot(pt.x - +orb.dataset.x, pt.y - +orb.dataset.y) < 54) {
              e.stopPropagation()
              if (popEl) hidePop()
              else showPop()
              return
            }
          }
          if (popEl && !orb.contains(e.target)) hidePop()
        }
        window.addEventListener('click', onGlobalClick)
        scroller.addEventListener('scroll', hidePop, { passive: true })
        window.addEventListener('resize', hidePop, { passive: true })

        const move = e => {
          const r = scroller.getBoundingClientRect()
          const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
          if (!inside) { if (mouse.on) { mouse.on = false; kick() } return }
          const m = svg.getScreenCTM && svg.getScreenCTM()
          if (!m) return
          const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
          mouse.x = pt.x; mouse.y = pt.y; mouse.on = true; mouse.at = performance.now()
          kick()
        }
        const leave = () => { mouse.on = false; kick() }
        window.addEventListener('mousemove', move, { passive: true })
        document.addEventListener('mouseleave', leave)
        return () => {
          hidePop()
          clearInterval(orbTimer)
          clearTimeout(cloudTimer)
          cancelAnimationFrame(raf)
          cancelAnimationFrame(craf)
          document.removeEventListener('visibilitychange', onVis)
          clouds.forEach(c => c.el.remove())
          orb.removeEventListener('click', onOrbClick)
          window.removeEventListener('click', onGlobalClick)
          scroller.removeEventListener('scroll', hidePop)
          window.removeEventListener('resize', hidePop)
          window.removeEventListener('mousemove', move)
          document.removeEventListener('mouseleave', leave)
        }
      }, [life, style, lang])

      // 弹幕名言：按界面语言，同时 1～3 条，高度随机、分布不均；快慢、字号和深浅略有不同，像远近不同。
      // 鼠标靠近时放慢、变亮，并露出出处
      useEffect(() => {
        const box = ref.current
        const scroller = box && box.closest('.mel')
        const layer = box && box.querySelector('.mel-drift')
        if (!layer || !scroller || still()) return undefined
        const qs = driftQuotes(style, lang).slice().sort(() => Math.random() - 0.5)
        let idx = 0, items = [], raf = 0, timer = 0, last = 0
        const mouse = { x: -9999, y: -9999 }
        const tick = now => {
          const dt = Math.min(0.05, (now - last) / 1000)
          last = now
          items = items.filter(it => {
            const r = it.el.getBoundingClientRect()
            const hot = mouse.x > r.left - 30 && mouse.x < r.right + 30 && mouse.y > r.top - 24 && mouse.y < r.bottom + 24
            if (hot !== it.hot) { it.hot = hot; it.el.classList.toggle('hot', hot) }
            it.slow += ((hot ? 0.12 : 1) - it.slow) * Math.min(1, dt * 4)
            it.x -= it.v * dt * it.slow
            it.el.style.transform = `translate(${it.x.toFixed(1)}px, ${it.y}px)`
            if (it.x < -it.w - 40) { it.el.remove(); return false }
            return true
          })
          raf = items.length ? requestAnimationFrame(tick) : 0
        }
        const pickY = H => {
          // 在页面上方七成里随机挑高度，和已有的弹幕至少隔开 44px
          for (let n = 0; n < 8; n++) {
            const y = Math.round(H * (0.07 + Math.random() * 0.66))
            if (items.every(it => Math.abs(it.y - y) > 44)) return y
          }
          return null
        }
        const spawn = () => {
          if (!document.hidden && items.length < 3) {
            const W = layer.clientWidth, H = layer.clientHeight
            const y = pickY(H)
            if (y !== null) {
              const q = qs[idx++ % qs.length]
              const depth = Math.random()
              const el = document.createElement('div')
              el.className = 'mel-drift-q'
              el.style.fontSize = `${(13.5 + depth * 3).toFixed(1)}px`
              el.style.setProperty('--q-op', (0.24 + depth * 0.16).toFixed(2))
              el.textContent = q.text
              const sm = document.createElement('small')
              sm.textContent = `— ${q.from}`
              el.appendChild(sm)
              layer.appendChild(el)
              const it = { el, x: W + 20, y, w: el.offsetWidth, hot: false, slow: 1 }
              it.v = (W + it.w + 40) / (44 - depth * 14)
              el.style.transform = `translate(${it.x}px, ${it.y}px)`
              items.push(it)
              if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
            }
          }
          // 下一条的间隔忽长忽短：屏上少时来得快些，多时慢些
          const base = items.length === 0 ? 4000 : items.length === 1 ? 7000 : 12000
          timer = setTimeout(spawn, base + Math.random() * 9000)
        }
        const move = e => { mouse.x = e.clientX; mouse.y = e.clientY }
        const leave = () => { mouse.x = -9999; mouse.y = -9999 }
        window.addEventListener('mousemove', move, { passive: true })
        document.addEventListener('mouseleave', leave)
        timer = setTimeout(spawn, 2500)
        return () => {
          clearTimeout(timer)
          cancelAnimationFrame(raf)
          items.forEach(it => it.el.remove())
          window.removeEventListener('mousemove', move)
          document.removeEventListener('mouseleave', leave)
        }
      }, [style, lang])

      return h('div', { className: 'mel-backdrop', 'aria-hidden': true },
        h('div', { className: 'mel-backdrop-in', ref },
          h('svg', { className: 'env', viewBox: '0 0 1200 800', preserveAspectRatio: 'xMidYMax slice', dangerouslySetInnerHTML: { __html: html } }),
          showArch ? h('svg', { className: 'bld', viewBox: '200 110 800 690', preserveAspectRatio: 'xMidYMax meet', dangerouslySetInnerHTML: { __html: html } }) : null,
          h('svg', { className: 'life', viewBox: '0 0 1200 800', preserveAspectRatio: 'xMidYMax slice', dangerouslySetInnerHTML: { __html: life } }),
          h('div', { className: 'mel-drift' })))
    }

    // 页面底部的流线：古希腊是起伏的海浪，中国古代是层叠的远山。
    // 很淡，缓缓漂动；鼠标经过时，线条被轻轻推开。只在可见时才画；
    // 系统设置了"减少动态效果"时只画静止的一帧。
    function Flow({ variant }) {
      const ref = useRef(null)
      useEffect(() => {
        const cv = ref.current
        const host = cv && cv.parentElement
        if (!cv || !host) return undefined
        const ctx2 = cv.getContext('2d')
        if (!ctx2) return undefined
        const still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        const hills = variant === 'chinese'
        const LINES = hills ? 5 : 6
        const phase = Array.from({ length: LINES }, (_, i) => i * 1.9 + 0.5)
        const mouse = { x: -999, y: -999, k: 0, target: 0 }
        let w = 0, h2 = 0, raf = 0, visible = true, color = 'rgb(127,127,127)', colorAt = 0
        const t0 = performance.now()

        const fit = () => {
          const r = host.getBoundingClientRect()
          const dpr = window.devicePixelRatio || 1
          if (Math.abs(r.width - w) < 1 && Math.abs(r.height - h2) < 1 && cv.width === Math.round(r.width * dpr)) return
          w = r.width; h2 = r.height
          cv.width = Math.round(w * dpr); cv.height = Math.round(h2 * dpr)
          ctx2.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        const readColor = now => {
          if (now - colorAt < 1000) return
          colorAt = now
          cv.style.color = 'var(--ac)'
          color = getComputedStyle(cv).color || color
        }
        const draw = now => {
          fit()
          readColor(now)
          ctx2.clearRect(0, 0, w, h2)
          mouse.k += (mouse.target - mouse.k) * 0.08
          const t = (now - t0) / 1000
          ctx2.strokeStyle = color
          ctx2.lineWidth = 1.15
          for (let i = 0; i < LINES; i++) {
            const p = phase[i]
            const base = hills ? h2 * (0.48 + i * 0.1) : h2 * (0.36 + i * 0.11)
            ctx2.globalAlpha = hills ? 0.16 + i * 0.035 : 0.22 - i * 0.015
            ctx2.beginPath()
            for (let x = 0; x <= w + 8; x += 8) {
              let y
              if (hills) {
                const ridge = Math.abs(Math.sin(x * 0.007 + p + t * 0.04)) * 0.7 + Math.abs(Math.sin(x * 0.019 + p * 1.7 - t * 0.03)) * 0.3
                y = base - ridge * (44 - i * 6)
              } else {
                y = base + Math.sin(x * 0.014 + t * 0.5 + p) * 8 + Math.sin(x * 0.006 - t * 0.28 + p * 2) * 6
              }
              if (mouse.k > 0.01) {
                const dx = x - mouse.x, dy = y - mouse.y
                const pull = Math.exp(-(dx * dx + dy * dy) / (2 * 90 * 90)) * mouse.k
                y += (dy / (Math.abs(dy) + 24)) * 24 * pull
              }
              if (x === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y)
            }
            ctx2.stroke()
          }
          ctx2.globalAlpha = 1
        }
        const loop = now => {
          draw(now)
          raf = visible && !still ? requestAnimationFrame(loop) : 0
        }
        const start = () => { if (!raf && !still) raf = requestAnimationFrame(loop) }
        draw(performance.now())

        const move = e => {
          const r = host.getBoundingClientRect()
          mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.target = 1
        }
        const leave = () => { mouse.target = 0 }
        host.addEventListener('mousemove', move)
        host.addEventListener('mouseleave', leave)
        let io = null
        if (typeof IntersectionObserver !== 'undefined') {
          io = new IntersectionObserver(entries => {
            visible = entries.some(en => en.isIntersecting)
            if (visible) start()
          })
          io.observe(host)
        }
        start()
        return () => {
          cancelAnimationFrame(raf)
          raf = 0
          visible = false
          host.removeEventListener('mousemove', move)
          host.removeEventListener('mouseleave', leave)
          if (io) io.disconnect()
        }
      }, [variant])
      return h('div', { className: 'mel-foot-flow', 'aria-hidden': true },
        h('canvas', { ref, className: 'mel-flow' }))
    }

    // 四个域：各有颜色和图标，点哪块看哪块，不用一路往下翻
    const DOMAINS = ['H', 'A', 'S', 'I']
    const domainOf = m => {
      const c = (String(m.dimension || '').trim().match(/^[HASTI]/) || ['H'])[0]
      return c === 'T' ? 'H' : c
    }

    // 域图标渲染（带动效动画）
    function renderDomainIcon(d) {
      if (d === 'H') {
        return h('svg', { className: 'mel-dom-icon mel-dom-icon-H', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' }))
      }
      if (d === 'A') {
        return h('svg', { className: 'mel-dom-icon mel-dom-icon-A', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('circle', { cx: '12', cy: '12', r: '10' }),
          h('polyline', { points: '12 6 12 12 16 14' }))
      }
      if (d === 'S') {
        return h('svg', { className: 'mel-dom-icon mel-dom-icon-S', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('circle', { cx: '12', cy: '12', r: '10' }),
          h('line', { x1: '2', y1: '12', x2: '22', y2: '12' }),
          h('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' }))
      }
      return h('svg', { className: 'mel-dom-icon mel-dom-icon-I', viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
        h('path', { d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }))
    }

    // 特征胶囊小图标
    function renderTraitIcon(icon) {
      if (icon === 'ticket') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
          h('polyline', { points: '14 2 14 8 20 8' }),
          h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
          h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
          h('polyline', { points: '10 9 9 9 8 9' }))
      }
      if (icon === 'search') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('circle', { cx: '11', cy: '11', r: '8' }),
          h('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }))
      }
      if (icon === 'rocket') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('path', { d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z' }),
          h('path', { d: 'M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z' }))
      }
      if (icon === 'shield') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }))
      }
      if (icon === 'bulb') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('line', { x1: '9', y1: '18', x2: '15', y2: '18' }),
          h('line', { x1: '10', y1: '22', x2: '14', y2: '22' }),
          h('path', { d: 'M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5z' }))
      }
      if (icon === 'pen') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('path', { d: 'M12 19l7-7 3 3-7 7-3-3z' }),
          h('path', { d: 'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' }),
          h('path', { d: 'M2 2l7.586 7.586' }),
          h('circle', { cx: '11', cy: '11', r: '2' }))
      }
      if (icon === 'clock') {
        return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('circle', { cx: '12', cy: '12', r: '10' }),
          h('polyline', { points: '12 6 12 12 16 14' }))
      }
      return h('svg', { className: 'mel-trait-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }))
    }

    // 荧光笔标记渲染
    function renderHighlightedText(text) {
      if (!text) return null
      const str = String(text)
      if (str.includes('**')) {
        const parts = str.split(/\*\*(.*?)\*\*/)
        return parts.map((p, idx) => (idx % 2 === 1 ? h('span', { key: idx, className: 'mel-highlight' }, p) : p))
      }
      const pattern = /(你像[^，。；！？]+[：:]?|这说明你对[^，。；！？]+|值得你自己看一眼的是[：:]?|最怕哪几类问题)/g
      if (pattern.test(str)) {
        const matches = []
        let lastIdx = 0
        let m
        pattern.lastIndex = 0
        while ((m = pattern.exec(str)) !== null) {
          if (m.index > lastIdx) matches.push(str.slice(lastIdx, m.index))
          matches.push(h('span', { key: m.index, className: 'mel-highlight' }, m[0]))
          lastIdx = pattern.lastIndex
        }
        if (lastIdx < str.length) matches.push(str.slice(lastIdx))
        return matches
      }
      return str
    }

    // 提炼镜子的特征胶囊（二次总结）
    function extractMirrorTraits(m, t) {
      const text = `${m.title || ''} ${m.body || ''} ${m.dimension || ''} ${m.seen || ''}`
      const traits = []
      if (/(工单|任务说明|先定好边界|开工单)/.test(text)) traits.push({ icon: 'ticket', label: (t && t('traitSpec')) || '开工单立规矩' })
      if (/(证据|互相对上|核对|口径|不实)/.test(text)) traits.push({ icon: 'search', label: (t && t('traitEvidence')) || '严格核对证据' })
      if (/(整段交给|放手|不插话|托付)/.test(text)) traits.push({ icon: 'rocket', label: (t && t('traitDelegate')) || '整段托付放手' })
      if (/(红线|失败模式|不能把|防范|风险)/.test(text)) traits.push({ icon: 'shield', label: (t && t('traitBoundaries')) || '守住交付红线' })
      if (/(试探|探索|好奇|新东西|边做边看)/.test(text)) traits.push({ icon: 'bulb', label: (t && t('traitExplore')) || '敏捷探索试探' })
      if (/(文风|口吻|语言|语气)/.test(text)) traits.push({ icon: 'pen', label: (t && t('traitTone')) || '在意文风口径' })
      if (/(一张一弛|节奏|从容|耐心)/.test(text)) traits.push({ icon: 'clock', label: (t && t('traitPace')) || '把控协作节奏' })
      if (traits.length === 0) {
        const dim = String(m.dimension || '').replace(/^[A-Z]\d+(\.\d+)?\s*/, '').replace(/[\uFF08(].*$/, '').trim()
        if (dim) traits.push({ icon: 'sparkle', label: dim })
      }
      return traits.slice(0, 2)
    }

    // 出处上下文浮层
    function ContextBox({ targetWhere, onClose, t }) {
      const [state, setState] = useState({ loading: true, data: null, error: '' })
      useEffect(() => {
        let alive = true
        api(`/context?where=${encodeURIComponent(targetWhere)}`)
          .then(data => { if (alive) setState({ loading: false, data, error: '' }) })
          .catch(err => { if (alive) setState({ loading: false, data: null, error: err.message }) })
        return () => { alive = false }
      }, [targetWhere])

      return h('div', { className: 'mel-context-box' },
        h('div', { className: 'mel-context-head' },
          h('span', { className: 'mel-context-title' }, `◈ ${t('contextModalTitle')} · ${targetWhere}`)),
        state.loading ? h('p', { className: 'mel-sub', style: { margin: '8px 0' } }, t('contextLoading')) : null,
        state.error || (!state.loading && (!state.data || !state.data.found)) ? h('p', { className: 'mel-sub', style: { margin: '8px 0', color: 'var(--dsw-alias-danger, #b3261e)' } }, t('contextEmpty')) : null,
        state.data && state.data.found && state.data.items ? h('div', { className: 'mel-context-list' },
          ...state.data.items.map((item, idx) => h('div', {
            key: idx,
            className: `mel-context-item${item.isTarget ? ' is-target' : ''}`,
          },
          h('div', { className: 'mel-context-who' }, `${(item.who === '用户' ? (t('contextWhoUser') || 'User') : item.who)} #${item.seq}`),
          h('div', null, item.text)))) : null)
    }

    function Mirror({ m, idx, seed, region, lang, style, t }) {
      if (!m) return null
      const [open, setOpen] = useState(false)
      const [activeWhere, setActiveWhere] = useState(null)
      const body = m.body || m.seen || ''
      const reads = (m.readings || []).map(r => (typeof r === 'string' ? { by: '', text: r } : r))
      const evidence = m.evidence || []
      const count = evidence.length + reads.length
      const theme = String(m.dimension || '').replace(/^[A-Z]\d+(\.\d+)?\s*/, '').replace(/[\uFF08(].*$/, '').trim()
      const seen = m.body && m.seen ? m.seen.replace(/^\s*(偏|兼|分|移|未明)\s*[：:]\s*/, '') : ''
      const maxim = pickMaxim(m, idx, seed, region, lang)
      const traits = extractMirrorTraits(m, t)

      return h('div', { className: 'mel-card' },
        theme ? h('div', { className: 'mel-theme' }, theme) : null,
        h('h2', null, m.title || ''),
        body ? h('p', { className: 'mel-body' }, renderHighlightedText(body)) : null,
        traits.length ? h('div', { className: 'mel-traits' },
          ...traits.map((tr, i) => h('span', { key: i, className: 'mel-trait-badge' },
            renderTraitIcon(tr.icon),
            h('span', null, tr.label)))) : null,
        m.ask ? h('div', { className: 'mel-ask' }, m.ask) : null,
        (count || seen) ? h('button', { type: 'button', className: 'mel-more', 'aria-expanded': open, onClick: () => setOpen(!open) },
          h('span', null, '›'), t('details', { e: evidence.length, r: reads.length })) : null,
        open ? h('div', { className: 'mel-detail' },
          seen ? h('p', { className: 'mel-sub' }, `${t('seen')}：${seen}`) : null,
          evidence.length ? h('div', { className: 'mel-label' }, t('evidence')) : null,
          ...evidence.map((e, i) => h('div', { className: 'mel-quote', key: `e${i}` },
            h('div', null, `「${e.quote || ''}」`),
            e.where ? h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 } },
              h('small', null, e.where),
              h('button', {
                type: 'button',
                className: 'mel-context-btn',
                onClick: () => setActiveWhere(activeWhere === e.where ? null : e.where),
              }, activeWhere === e.where ? t('contextClose') : t('viewContextBtn'))) : null,
            activeWhere === e.where ? h(ContextBox, { targetWhere: e.where, onClose: () => setActiveWhere(null), t }) : null)),
          ...[['you', 'byYou'], ['ai', 'byAi'], ['thing', 'byThing'], ['', 'readings']].flatMap(([k, label]) => {
            const items = reads.filter(r => (r.by || '') === k)
            return items.length ? [h('div', { className: 'mel-label', key: `l${k}` }, t(label)), ...items.map((r, i) => h('div', { className: 'mel-read', key: `r${k}${i}` }, r.text))] : []
          })) : null,
        maxim ? h('div', { className: 'mel-maxim' },
          h('span', null, h('i', null, ORNAMENT[style] || '◈'), `「${maxim.text}」`),
          maxim.from ? h('small', null, `—— ${maxim.from}`) : null) : null)
    }

    // ---------- 分享明信片与导出核心实现 ----------
    function isInnerMirror(m) {
      if (!m) return true
      const dim = String(m.dimension || '').trim().toUpperCase()
      const dom = String(m.domain || '').trim().toUpperCase()
      const code = String(m.code || '').trim().toUpperCase()
      const title = String(m.title || '')
      if (dim.startsWith('I') || dom.startsWith('I') || code.startsWith('I')) return true
      if (dim.includes('本心') || dom.includes('本心') || title.includes('本心')) return true
      if (dim.includes('心') || dom.includes('心')) return true
      // 必须明确判定为 H, A, S 域之一；无法可靠判定时默认归为本心，防止误导出
      const isH = dim.startsWith('H') || dom.startsWith('H') || code.startsWith('H')
      const isA = dim.startsWith('A') || dom.startsWith('A') || code.startsWith('A')
      const isS = dim.startsWith('S') || dom.startsWith('S') || code.startsWith('S')
      if (!isH && !isA && !isS) return true
      return false
    }

    function collectProjects(review) {
      const projs = new Set()
      if (!review) return projs
      if (review.meta?.project) projs.add(String(review.meta.project).trim())
      if (Array.isArray(review.meta?.projects)) {
        review.meta.projects.forEach(p => p && projs.add(String(p).trim()))
      }
      const allMirrors = [
        ...(review.mirrors || []),
        ...(review.ai_side?.mirrors || []),
        ...(review.society || []),
        ...(review.inner || []),
      ]
      for (const m of allMirrors) {
        for (const e of (m.evidence || [])) {
          if (typeof e?.where === 'string') {
            const parts = e.where.split(/\s*·\s*/)
            if (parts.length >= 3) {
              const p = parts[1].trim()
              if (p && p !== '未知项目') projs.add(p)
            } else if (parts.length === 2) {
              const p = parts[0].trim()
              if (p && !/^\d{4}-\d{2}-\d{2}$/.test(p) && p !== '未知项目') projs.add(p)
            }
          }
        }
      }
      if (typeof review.who === 'string') {
        const m = /DSH[「(（]([^」)）]+)[」)）]/.exec(review.who)
        if (m && m[1]) projs.add(m[1].trim())
      }
      if (typeof review.scope === 'string') {
        const m = /范围[：:]\s*([^\s，,。]+?)(?:工作区|的|\s)/.exec(review.scope)
        if (m && m[1] && m[1].length >= 2 && m[1].length <= 25) projs.add(m[1].trim())
      }
      return projs
    }

    function cleanPrivacy(s, projects = null) {
      if (typeof s !== 'string') return ''
      let out = s
        .replace(/\[(?:邮箱|电话|密钥|长串|项目|出处|密码|私密|token|key|secret)[^\]]*\]/gi, '')
        .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '')
        .replace(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,5}\b/g, '')
        .replace(/\b[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\b/g, '')
        .replace(/\b[0-9a-fA-F]{6,}\b/g, '')
        .replace(/#\d+\b/g, '')
        .replace(/(?:[A-Za-z]:)?[\/\\~](?:[^\s\/\\:*?"<>|\r\n]+[\/\\])+[^\s\/\\:*?"<>|\r\n]*/g, '')
        .replace(/[“「]?([A-Za-z0-9_\u4e00-\u9fa5]{2,12}(?:计划|工程|项目|工作区|研究中心))[”」]?/g, '')

      if (projects && typeof projects[Symbol.iterator] === 'function') {
        for (const p of projects) {
          if (typeof p === 'string' && p.trim().length >= 2) {
            const escaped = p.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            out = out.replace(new RegExp(escaped, 'g'), '')
          }
        }
      }

      return out.replace(/\s+/g, ' ').trim()
    }

    const SAFE_DEFAULT_HEADLINES = {
      zh: '我和 AI 一起做事的这段时间',
      en: 'Collaborating with AI',
      ja: 'AIと共创した时间',
      es: 'Colaborando con IA',
      fr: "Collaborer avec l'IA",
      de: 'Zusammenarbeit mit der KI',
      ru: 'Сотрудничество с ИИ',
      pt: 'Colaborando com IA',
    }

    // 分享隐私提醒（2026-11-08 发起人定：选项 B）。本机做不到可靠识别所有项目名、人名，
    // 所以不硬拦截自由正文，而是在分享时列出"可能涉及隐私"的地方，由用户一键隐藏或改写。
    const PRIVACY_TEXT = {
      zh: { title: '隐私提醒', found: '发现 {n} 处可能涉及隐私，导出前请看一眼', none: '没发现明显的隐私线索，导出前仍请自己看一眼', show: '展开', hide: '收起', hideBlock: '隐藏这一块', hidden: '已隐藏',
        done: '已在本机去掉：邮箱、电话、密钥、会话编号、文件路径{p}。', proj: '，以及从出处认出的 {n} 个项目名', inner: '「本心」那一域永远不会出现在分享里。',
        unsure: '本机认不全所有项目名、人名和公司名，所以不确定的内容不会被自动删掉，而是列在下面。', auto: '「我的做法」「一个瞬间」是从复盘正文里自动摘的，原样放进了预览。', full: '「导出这份复盘」会包含全部镜子正文（不含本心），同样只去掉了上面那些。',
        name: '可能是项目名、产品名、公司名或人名', quote: '引号里可能是原话或具体名称', num: '数字可能对应金额、日期、编号或排名', life: '涉及工作单位、求职、收入、健康或家人', file: '像文件名、账号或链接' },
      en: { title: 'Privacy check', found: '{n} spots may be private. Take a look before exporting', none: 'Nothing obviously private found. Still take a look before exporting', show: 'Show', hide: 'Hide', hideBlock: 'Hide this block', hidden: 'Hidden',
        done: 'Already removed on this device: emails, phone numbers, keys, session IDs, file paths{p}.', proj: ', and {n} project names found in the sources', inner: 'The Inner domain never appears in a share.',
        unsure: 'This device cannot recognise every project, person or company name, so uncertain text is listed below instead of being deleted.', auto: '"My practices" and "A moment" were picked from the review text as is.', full: '"Export this review" includes all mirror text (Inner excluded), with only the items above removed.',
        name: 'may be a project, product, company or person name', quote: 'quoted text may be an exact phrase or a specific name', num: 'numbers may be amounts, dates, IDs or rankings', life: 'mentions work, job search, income, health or family', file: 'looks like a file name, account or link' },
      ja: { title: 'プライバシーの確認', found: '{n} か所にプライバシーに関わる可能性があります。書き出す前にご確認ください', none: '目立つ手がかりはありませんでしたが、書き出す前にご確認ください', show: '開く', hide: '閉じる', hideBlock: 'このブロックを隠す', hidden: '非表示',
        done: '端末内で除去済み：メール、電話番号、鍵、会話ID、ファイルパス{p}。', proj: '、出典から分かったプロジェクト名 {n} 件', inner: '「本心」の領域は共有に一切含まれません。',
        unsure: 'プロジェクト名・人名・会社名をすべて見分けることはできないため、不確かなものは削除せず下に挙げています。', auto: '「私のやり方」「ひとつの瞬間」は振り返り本文からそのまま抜き出しています。', full: '「この振り返りを書き出す」には全ての鏡の本文（本心を除く）が含まれます。',
        name: 'プロジェクト名・製品名・会社名・人名の可能性', quote: '引用符内は原文や固有名の可能性', num: '数字は金額・日付・番号・順位の可能性', life: '勤務先・就職・収入・健康・家族に関わる内容', file: 'ファイル名・アカウント・リンクのようです' },
      es: { title: 'Revisión de privacidad', found: '{n} puntos pueden ser privados. Revísalos antes de exportar', none: 'No se encontró nada claramente privado. Revísalo igualmente antes de exportar', show: 'Ver', hide: 'Ocultar', hideBlock: 'Ocultar este bloque', hidden: 'Oculto',
        done: 'Ya eliminado en este equipo: correos, teléfonos, claves, IDs de sesión, rutas{p}.', proj: ' y {n} nombres de proyecto hallados en las fuentes', inner: 'El dominio Interior nunca aparece al compartir.',
        unsure: 'Este equipo no reconoce todos los nombres de proyectos, personas o empresas; lo dudoso se lista abajo en lugar de borrarse.', auto: '"Mi forma de trabajar" y "Un momento" se tomaron tal cual del texto del análisis.', full: '"Exportar este análisis" incluye todo el texto de los espejos (sin Interior).',
        name: 'puede ser un nombre de proyecto, producto, empresa o persona', quote: 'el texto entre comillas puede ser literal o un nombre', num: 'los números pueden ser importes, fechas, IDs o posiciones', life: 'menciona trabajo, búsqueda de empleo, ingresos, salud o familia', file: 'parece un archivo, cuenta o enlace' },
      fr: { title: 'Vérification de confidentialité', found: '{n} passages peuvent être privés. Jetez un œil avant d’exporter', none: 'Rien de manifestement privé. Jetez quand même un œil avant d’exporter', show: 'Afficher', hide: 'Masquer', hideBlock: 'Masquer ce bloc', hidden: 'Masqué',
        done: 'Déjà retiré sur cet appareil : courriels, téléphones, clés, identifiants de session, chemins{p}.', proj: ', et {n} noms de projet trouvés dans les sources', inner: 'Le domaine Intérieur n’apparaît jamais dans un partage.',
        unsure: 'Cet appareil ne reconnaît pas tous les noms de projets, de personnes ou d’entreprises ; le doute est listé ci-dessous plutôt que supprimé.', auto: '« Ma façon de faire » et « Un moment » sont repris tels quels du texte du débrief.', full: '« Exporter ce débrief » inclut tout le texte des miroirs (hors Intérieur).',
        name: 'peut être un nom de projet, de produit, d’entreprise ou de personne', quote: 'le texte entre guillemets peut être une citation ou un nom', num: 'les nombres peuvent être des montants, dates, identifiants ou classements', life: 'évoque travail, recherche d’emploi, revenus, santé ou famille', file: 'ressemble à un fichier, un compte ou un lien' },
      de: { title: 'Datenschutz-Check', found: '{n} Stellen könnten privat sein. Bitte vor dem Export ansehen', none: 'Nichts offensichtlich Privates gefunden. Bitte trotzdem vor dem Export ansehen', show: 'Zeigen', hide: 'Einklappen', hideBlock: 'Block ausblenden', hidden: 'Ausgeblendet',
        done: 'Bereits lokal entfernt: E-Mails, Telefonnummern, Schlüssel, Sitzungs-IDs, Dateipfade{p}.', proj: ' sowie {n} aus den Quellen erkannte Projektnamen', inner: 'Der Bereich Inneres erscheint nie in einer Freigabe.',
        unsure: 'Dieses Gerät erkennt nicht alle Projekt-, Personen- oder Firmennamen; Unsicheres wird unten aufgelistet statt gelöscht.', auto: '„Meine Arbeitsweise“ und „Ein Moment“ stammen unverändert aus dem Rückblick.', full: '„Diesen Rückblick exportieren“ enthält alle Spiegeltexte (ohne Inneres).',
        name: 'könnte ein Projekt-, Produkt-, Firmen- oder Personenname sein', quote: 'Text in Anführungszeichen könnte ein Zitat oder Name sein', num: 'Zahlen könnten Beträge, Daten, IDs oder Ränge sein', life: 'betrifft Arbeitgeber, Jobsuche, Einkommen, Gesundheit oder Familie', file: 'sieht aus wie Datei, Konto oder Link' },
      ru: { title: 'Проверка приватности', found: 'Найдено мест, где может быть личное: {n}. Посмотрите перед экспортом', none: 'Явно личного не найдено. Всё равно посмотрите перед экспортом', show: 'Показать', hide: 'Свернуть', hideBlock: 'Скрыть блок', hidden: 'Скрыто',
        done: 'Уже удалено на этом устройстве: почта, телефоны, ключи, номера сессий, пути к файлам{p}.', proj: ', а также названия проектов из источников: {n}', inner: 'Область «Внутреннее» никогда не попадает в публикацию.',
        unsure: 'Устройство не может распознать все названия проектов, имена и компании, поэтому сомнительное не удаляется, а перечислено ниже.', auto: '«Мой подход» и «Один момент» взяты из текста разбора как есть.', full: '«Экспорт разбора» включает весь текст граней (без «Внутреннего»).',
        name: 'может быть названием проекта, продукта, компании или именем', quote: 'текст в кавычках может быть цитатой или названием', num: 'числа могут быть суммами, датами, номерами или местами', life: 'касается работы, поиска работы, дохода, здоровья или семьи', file: 'похоже на файл, аккаунт или ссылку' },
      pt: { title: 'Verificação de privacidade', found: '{n} trechos podem ser privados. Dê uma olhada antes de exportar', none: 'Nada claramente privado. Mesmo assim, dê uma olhada antes de exportar', show: 'Mostrar', hide: 'Recolher', hideBlock: 'Ocultar este bloco', hidden: 'Oculto',
        done: 'Já removido neste dispositivo: e-mails, telefones, chaves, IDs de sessão, caminhos{p}.', proj: ' e {n} nomes de projeto encontrados nas fontes', inner: 'O domínio Interior nunca aparece ao compartilhar.',
        unsure: 'Este dispositivo não reconhece todos os nomes de projetos, pessoas ou empresas; o que é incerto aparece abaixo em vez de ser apagado.', auto: '"Meu jeito de fazer" e "Um momento" foram tirados do texto da análise como estão.', full: '"Exportar esta análise" inclui todo o texto dos espelhos (sem Interior).',
        name: 'pode ser nome de projeto, produto, empresa ou pessoa', quote: 'texto entre aspas pode ser literal ou um nome', num: 'números podem ser valores, datas, IDs ou posições', life: 'menciona trabalho, busca de emprego, renda, saúde ou família', file: 'parece arquivo, conta ou link' },
    }
    function privacyText(lang) { return PRIVACY_TEXT[(lang || 'zh').slice(0, 2)] || PRIVACY_TEXT.en }

    const PRIVACY_NAME_OK = new Set(['ai', 'melete', 'dsh', 'deepseek', 'claude', 'gpt', 'chatgpt', 'agent', 'agents', 'api', 'skill', 'skills', 'ok', 'pdf', 'ppt', 'app', 'ui', 'ux', 'llm', 'mcp', 'html', 'css', 'json', 'markdown', 'git', 'github', 'i', 'im', 'id'])
    const PRIVACY_LIFE = /公司|单位|客户|老板|领导|同事|面试|应聘|求职|简历|工资|薪|收入|合同|离职|医院|看病|病|药|家人|父母|孩子|老婆|老公|女朋友|男朋友|学校|老师|地址|账号|身份证|employer|company|client|boss|colleague|interview|resume|résumé|salary|income|contract|hospital|doctor|diagnos|family|wife|husband|girlfriend|boyfriend|kids?\b|school|address|account|会社|上司|面接|給料|病院|家族|empresa|jefe|entrevista|salario|familia|entreprise|patron|entretien|salaire|famille|firma|chef|vorstellungsgespräch|gehalt|familie|компани|начальник|собеседован|зарплат|семь|empresa|chefe|salário|família/i
    function scanPrivacyText(text, lang) {
      const hits = []
      if (!text || typeof text !== 'string') return hits
      const seen = new Set()
      const add = (term, why) => { const k = term.toLowerCase() + '|' + why; if (!seen.has(k)) { seen.add(k); hits.push({ term, why }) } }
      const isZh = (lang || '').startsWith('zh') || (lang || '').startsWith('ja')
      // 拉丁字母的专有名词：中日文里出现的任意英文词；其他语言里句中大写词、驼峰、全大写
      const latin = /[A-Za-z][A-Za-z0-9_\-]{1,}/g
      let m
      while ((m = latin.exec(text))) {
        const w = m[0]
        if (PRIVACY_NAME_OK.has(w.toLowerCase())) continue
        if (isZh) { add(w, 'name'); continue }
        const before = text.slice(0, m.index).trimEnd()
        const sentenceStart = before === '' || /[.!?。！？:：\n]$/.test(before)
        const camel = /[a-z][A-Z]/.test(w) || /^[A-Z]{2,}$/.test(w)
        if ((camel || (/^[A-Z]/.test(w) && !sentenceStart)) && w.length >= 2) add(w, 'name')
      }
      const quote = /[「“"『‘'«]([^」”"』’'»]{1,24})[」”"』’'»]/g
      while ((m = quote.exec(text))) add(m[1], 'quote')
      const num = /\d[\d,.:/%-]*\d|\d{2,}/g
      while ((m = num.exec(text))) add(m[0], 'num')
      const life = new RegExp(PRIVACY_LIFE.source, 'gi')
      while ((m = life.exec(text))) add(m[0], 'life')
      const file = /\b[\w-]+\.(?:md|js|ts|py|json|txt|docx?|xlsx?|pptx?|pdf|png|jpe?g|html?)\b|www\.|https?:|@\w+/gi
      while ((m = file.exec(text))) add(m[0], 'file')
      return hits
    }

    function buildPrivacyReport(data, hiddenBlocks, lang) {
      const blocks = [
        ['cover', [data.headline]],
        ['practices', data.practices || []],
        ['moment', [data.moment]],
        ['split', [...(data.splitMine || []), ...(data.splitAi || [])]],
        ['ainote', [data.aiNote]],
        ['question', [data.question]],
      ]
      const items = []
      for (const [id, texts] of blocks) {
        for (const text of texts) {
          for (const hit of scanPrivacyText(text, lang)) items.push({ block: id, text, ...hit, hidden: hiddenBlocks.has(id) })
        }
      }
      return items
    }

    function PrivacyPanel({ data, hiddenBlocks, toggleBlock, lang, t }) {
      const P = privacyText(lang)
      const items = buildPrivacyReport(data, hiddenBlocks, lang)
      const active = items.filter(i => !i.hidden)
      const [open, setOpen] = useState(true)
      const blockLabel = { cover: t('shareTagCover'), practices: t('shareTagPractices'), moment: t('shareTagMoment'), split: t('shareTagSplit'), ainote: t('shareTagAiNote'), question: t('shareTagQuestion') || '?' }
      const mark = (text, term) => {
        const i = text.indexOf(term)
        if (i < 0) return term
        const a = Math.max(0, i - 10), b = Math.min(text.length, i + term.length + 10)
        return [a > 0 ? '…' : '', text.slice(a, i), h('mark', { key: 'm' }, term), text.slice(i + term.length, b), b < text.length ? '…' : '']
      }
      return h('div', { className: 'mel-share-privacy', role: 'region', 'aria-label': P.title },
        h('div', { className: 'mel-share-privacy-head' },
          h('span', null, `🔒 ${P.title} · `, active.length ? P.found.replace('{n}', active.length) : P.none),
          h('button', { type: 'button', className: 'mel-btn mel-btn-subtle', onClick: () => setOpen(!open) }, open ? P.hide : P.show)),
        open ? h('div', null,
          h('ul', null,
            h('li', null, P.done.replace('{p}', data.projectCount ? P.proj.replace('{n}', data.projectCount) : '')),
            h('li', null, P.inner),
            h('li', null, P.unsure),
            data.autoPicked ? h('li', null, P.auto) : null,
            h('li', null, P.full)),
          items.length ? h('div', { style: { marginTop: 6 } },
            ...items.slice(0, 30).map((it, idx) => h('div', { key: idx, className: 'mel-share-privacy-hit' },
              h('span', { className: 'blk-name' }, blockLabel[it.block] || it.block),
              h('span', null, mark(String(it.text || ''), it.term)),
              h('span', { className: 'why' }, P[it.why] || ''),
              it.hidden ? h('span', { className: 'done' }, P.hidden)
                : h('button', { type: 'button', className: 'mel-btn mel-btn-subtle', onClick: () => toggleBlock(it.block) }, P.hideBlock)))) : null) : null)
    }

    function buildShareData(review, lang, userEdits = {}) {
      const isZh = (lang || '').startsWith('zh')
      const langPrefix = (lang || 'zh').slice(0, 2)
      const safeDefaultCover = SAFE_DEFAULT_HEADLINES[langPrefix] || SAFE_DEFAULT_HEADLINES.zh
      const share = review?.share || {}
      const projs = collectProjects(review)
      const clean = s => cleanPrivacy(s, projs)

      let headline = ''
      if (userEdits.headline !== undefined) {
        headline = clean(userEdits.headline)
      } else if (share.headline) {
        headline = clean(share.headline)
      } else {
        // 无法确定旧复盘的原始自由标题是否包含未知项目名（如 Orion），绝不自动输出未经验证的自由文字
        headline = safeDefaultCover
      }

      const range = clean(review?.meta?.range || '')

      // 严格依据真实统计，不编造虚假数字；缺模型数时为 null，不臆造为 1
      const rawStats = review?.meta?.shareStats || review?.meta?.stats || null
      const hasStats = Boolean(rawStats && (rawStats.sessions || rawStats.withUserInput))
      const sessions = hasStats ? Number(rawStats.sessions || rawStats.withUserInput || 0) : null
      const num = v => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
      const userMessages = hasStats ? num(rawStats.userMessages) : null
      const toolCalls = hasStats ? num(rawStats.toolCalls) : null
      let modelsCount = null
      if (hasStats) {
        if (rawStats.modelsCount !== undefined && rawStats.modelsCount !== null) {
          modelsCount = Number(rawStats.modelsCount)
        } else if (Array.isArray(rawStats.models) && rawStats.models.length > 0) {
          modelsCount = rawStats.models.length
        }
      }

      // 选项 B（2026-11-08 发起人定）：旧复盘没有 share 字段时，从非本心镜子自动摘取，原样进入预览，
      // 由隐私提醒列出可疑处，用户一键隐藏或改写。本心永远排除；已知项目名与固定格式仍在本机去掉。
      const outerMirrors = [...(review?.mirrors || []), ...(review?.society || [])].filter(m => !isInnerMirror(m))
      const firstPerson = x => (isZh ? String(x).replace(/你们/g, '我们').replace(/你/g, '我') : String(x))
      let autoPicked = false

      let practices = userEdits.practices ? userEdits.practices.map(clean).filter(Boolean) : null
      if (!practices) {
        if (share.practices && Array.isArray(share.practices) && share.practices.length) {
          practices = share.practices.map(clean).filter(Boolean).slice(0, 3)
        } else {
          practices = outerMirrors.map(m => clean(firstPerson(m.title || ''))).filter(Boolean).slice(0, 3)
          if (practices.length) autoPicked = true
        }
      }

      let moment = userEdits.moment !== undefined ? clean(userEdits.moment) : undefined
      if (moment === undefined) {
        if (share.moment) {
          moment = clean(share.moment)
        } else {
          const m = outerMirrors.find(x => x.body)
          const first = m ? String(m.body).split(/(?<=[。！？!?])|\n/)[0] : ''
          moment = first ? clean(firstPerson(first)) : ''
          if (moment) autoPicked = true
        }
      }

      // 分工：仅在存在真实数据时提取，不编造
      let splitMine = userEdits.splitMine ? userEdits.splitMine.map(clean).filter(Boolean) : []
      let splitAi = userEdits.splitAi ? userEdits.splitAi.map(clean).filter(Boolean) : []
      if (!splitMine.length && !splitAi.length && share.split) {
        if (Array.isArray(share.split.mine)) splitMine = share.split.mine.map(clean).filter(Boolean).slice(0, 3)
        if (Array.isArray(share.split.ai)) splitAi = share.split.ai.map(clean).filter(Boolean).slice(0, 3)
      }

      // AI 那边：优先 share.ai_note，其次从域二真实镜子提取；无则留空，不编造
      let aiNote = userEdits.aiNote !== undefined ? clean(userEdits.aiNote) : undefined
      if (aiNote === undefined) {
        if (share.ai_note) {
          aiNote = clean(share.ai_note)
        } else {
          const realAi = (review?.ai_side?.mirrors || []).filter(m => !isInnerMirror(m))
          const m = realAi.find(x => x.body)
          if (m && m.body) {
            const s = m.body.split(/[。！？\n]/)[0]
            if (s) aiNote = clean(s) + (isZh ? '。' : '.')
          } else {
            aiNote = ''
          }
        }
      }

      // 问题：取开放问题，无则留空
      const question = userEdits.question !== undefined
        ? clean(userEdits.question)
        : clean(review?.question || (review?.questions && review.questions[0]) || '')

      // 时辰：仅在存在真实 rhythm 且总和大于 0 时提供；缺失时不伪造分布
      const rawRhythm = review?.meta?.rhythm
      const hasRhythm = Array.isArray(rawRhythm) && rawRhythm.length === 12 && rawRhythm.some(v => v > 0)
      const rhythm = hasRhythm ? rawRhythm : null

      return {
        autoPicked,
        projectCount: projs.size,
        headline,
        range,
        hasStats,
        sessions,
        userMessages,
        toolCalls,
        modelsCount,
        practices,
        moment,
        splitMine,
        splitAi,
        aiNote,
        question,
        hasRhythm,
        rhythm,
      }
    }

    function generateDialSvg(rhythm, style, theme) {
      if (!rhythm || !Array.isArray(rhythm) || !rhythm.some(v => v > 0)) {
        return ''
      }
      const isChinese = style === 'chinese'
      const isDark = theme === 'dark'
      const ac = (STYLE_AC[style] || STYLE_AC.greek)[isDark ? 1 : 0]
      const line = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(80,60,30,0.16)'
      const sub = isDark ? '#b3ab9d' : '#6b665e'
      const max = Math.max(1, ...rhythm)
      const ZH = '子丑寅卯辰巳午未申酉戌亥'
      const GR = ['XII', 'II', 'IV', 'VI', 'VIII', 'X', 'XII', 'II', 'IV', 'VI', 'VIII', 'X']

      let s = `<circle r="170" fill="none" stroke="${line}" stroke-width="3"/><circle r="70" fill="none" stroke="${line}" stroke-width="2"/>`
      rhythm.forEach((v, i) => {
        const a0 = (i * 30 - 105) * Math.PI / 180
        const a1 = ((i + 1) * 30 - 105 - 3) * Math.PI / 180
        const r0 = 74, r1 = 74 + 90 * (v / max || 0.04)
        const p = (r, a) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`
        s += `<path d="M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z" fill="${ac}" opacity="${(0.25 + 0.75 * v / max).toFixed(2)}"/>`
        const am = (i * 30 - 90) * Math.PI / 180
        s += `<text x="${(150 * Math.cos(am)).toFixed(1)}" y="${(150 * Math.sin(am) + 9).toFixed(1)}" text-anchor="middle" font-size="${isChinese ? 26 : 18}" fill="${sub}" font-family="serif">${isChinese ? ZH[i] : GR[i]}</text>`
      })
      s += isChinese
        ? `<text y="12" text-anchor="middle" font-size="34" fill="${ac}" font-family="serif">时辰</text>`
        : `<path d="M0 -60 L14 10 L0 0 L-14 10Z" fill="${ac}"/>`
      return s
    }

    function getPeakRhythmText(rhythm, style, lang) {
      const isChinese = style === 'chinese'
      const isZh = (lang || '').startsWith('zh')
      if (!rhythm || !Array.isArray(rhythm) || !rhythm.some(v => v > 0)) {
        return { peak1: '—', peak2: '—', desc: isZh ? '暂无时辰记录' : 'No rhythm recorded' }
      }
      const ZH = '子丑寅卯辰巳午未申酉戌亥'
      let maxIdx = 0, secIdx = 1, maxV = -1, secV = -1
      rhythm.forEach((v, i) => {
        if (v > maxV) {
          secV = maxV; secIdx = maxIdx
          maxV = v; maxIdx = i
        } else if (v > secV) {
          secV = v; secIdx = i
        }
      })
      if (isChinese) {
        return { peak1: ZH[maxIdx] + '时', peak2: ZH[secIdx] + '时', desc: '一天里协作较多的时辰。' }
      }
      const hRange = i => {
        const s = (i * 2 + 23) % 24
        const e = (i * 2 + 1) % 24
        const fmt = h => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`)
        return `${fmt(s)} – ${fmt(e)}`
      }
      return { peak1: hRange(maxIdx), peak2: hRange(secIdx), desc: isZh ? '一天中协作较多的时段。' : 'The peak collaborating hours.' }
    }

    // 导出前的副本：去掉编辑用的眼睛、被隐藏的版块和可编辑属性
    function exportClone(cardEl) {
      const clone = cardEl.cloneNode(true)
      clone.querySelectorAll('.eye, .blk.off, script, iframe, link, object, embed').forEach(el => el.remove())
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'))
      clone.querySelectorAll('[data-ph]').forEach(el => el.removeAttribute('data-ph'))
      clone.style.zoom = ''
      clone.style.transform = 'none'
      clone.style.margin = '0'
      return clone
    }

    // 长图：把明信片放进 SVG 的 foreignObject 画到画布上，2 倍清晰度；全程本机完成，不联网
    async function renderCardToCanvas(cardEl, style, theme) {
      const clone = exportClone(cardEl)
      const probe = document.createElement('div')
      probe.style.cssText = 'position:fixed;left:-20000px;top:0;width:1080px;visibility:hidden;pointer-events:none'
      probe.appendChild(clone)
      document.body.appendChild(probe)
      const w = 1080
      const hgt = Math.ceil(clone.getBoundingClientRect().height) || 2400
      document.body.removeChild(probe)
      const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${POSTCARD_CSS}</style>${new XMLSerializer().serializeToString(clone)}</div></foreignObject></svg>`
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml)
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('render-failed'))
        img.src = url
      })
      const k = 2
      const canvas = document.createElement('canvas')
      canvas.width = w * k
      canvas.height = hgt * k
      const c2 = canvas.getContext('2d')
      c2.scale(k, k)
      c2.drawImage(img, 0, 0, w, hgt)
      return canvas
    }

    function generatePostcardHtml(cardEl, lang) {
      const clone = exportClone(cardEl)
      const title = lang && !lang.startsWith('zh') ? 'Melete · My AI debrief' : 'Melete · 我的 AI 复盘'
      return `<!doctype html>
<html lang="${escapeAttr(lang || 'zh')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
${POSTCARD_CSS}
html,body{margin:0;background:#111;}
body{display:flex;justify-content:center;padding:32px 0;}
@media (max-width:1120px){body{padding:0;} .mel-postcard{border-radius:0;}}
</style>
</head>
<body>
${clone.outerHTML}
<script>(function(){var c=document.querySelector('.mel-postcard');function f(){c.style.zoom=Math.min(1,(window.innerWidth-(window.innerWidth>1120?64:0))/1080);}f();window.addEventListener('resize',f);})();</script>
</body>
</html>`
    }
    function escapeAttr(s) { return String(s).replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[c]) }


    function ShareDrawer({ review, t, style, lang, onClose }) {
      const dark = document.body.hasAttribute('data-ds-dark-theme') || document.body.getAttribute('data-theme') === 'dark'
      const [shareStyle, setShareStyle] = useState(STYLE_IDS.includes(style) ? style : 'greek')
      const [theme, setTheme] = useState(dark ? 'dark' : 'light')
      const [userEdits, setUserEdits] = useState({})
      const [hiddenBlocks, setHiddenBlocks] = useState(() => {
        const s = new Set()
        const d0 = buildShareData(review, lang, {})
        if (!d0.hasStats) s.add('nums')
        if (!d0.practices || !d0.practices.length) s.add('practices')
        if (!d0.moment) s.add('moment')
        if (!(d0.splitMine || []).length && !(d0.splitAi || []).length) s.add('split')
        if (!d0.aiNote) s.add('ainote')
        if (!d0.hasRhythm || !d0.rhythm) s.add('dial')
        if (!d0.question) s.add('question')
        return s
      })
      const [toast, setToast] = useState('')
      const [revealFilename, setRevealFilename] = useState('')
      const [busy, setBusy] = useState(false)
      const [zoom, setZoom] = useState(0.6)
      const stageRef = useRef(null)
      const cardRef = useRef(null)
      const data = buildShareData(review, lang, userEdits)
      const isZh = (lang || '').startsWith('zh')

      useEffect(() => {
        const fit = () => {
          const el = stageRef.current
          if (!el) return
          setZoom(Math.max(0.3, Math.min(0.9, (el.clientWidth - 80) / 1080)))
        }
        fit()
        const key = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('resize', fit)
        window.addEventListener('keydown', key)
        return () => { window.removeEventListener('resize', fit); window.removeEventListener('keydown', key) }
      }, [])

      const showToast = (msg, filename = '') => {
        setToast(msg)
        setRevealFilename(filename)
        setTimeout(() => setToast(''), 6000)
      }
      const toggleBlock = id => setHiddenBlocks(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id); else next.add(id)
        return next
      })
      const stamp = () => {
        const d = new Date()
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
      }

      const saveImage = async () => {
        if (!cardRef.current || busy) return
        setBusy(true)
        try {
          const canvas = await renderCardToCanvas(cardRef.current, shareStyle, theme)
          const dataUrl = canvas.toDataURL('image/png')
          const filename = `Melete-${stamp()}.png`
          await api('/share/save', { filename, data: dataUrl, isBase64: true })
          showToast(t('shareSavedImgToast'), filename)
        } catch (err) {
          showToast(err.message || String(err))
        } finally { setBusy(false) }
      }
      const saveHtml = async () => {
        if (!cardRef.current || busy) return
        setBusy(true)
        try {
          const html = generatePostcardHtml(cardRef.current, lang)
          const filename = `Melete-${stamp()}.html`
          await api('/share/save', { filename, data: html, isBase64: false })
          showToast(t('shareSavedHtmlToast'), filename)
        } catch (err) {
          showToast(err.message || String(err))
        } finally { setBusy(false) }
      }

      const nf = (() => { try { return new Intl.NumberFormat(lang || undefined) } catch { return new Intl.NumberFormat() } })()
      const order = ['nums', 'practices', 'moment', 'split', 'ainote', 'dial', 'question'].filter(b => !hiddenBlocks.has(b))
      const numeral = id => { const i = order.indexOf(id); return i < 0 ? '' : (NUMERALS[shareStyle] || NUMERALS.greek)[i] || String(i + 1) }
      const eye = id => h('button', { type: 'button', className: 'eye', title: t('shareHideBlockHint'), onClick: () => toggleBlock(id) }, hiddenBlocks.has(id) ? '◎' : '◉')
      const editable = (key, value, ph, className) => h('div', {
        className, contentEditable: true, suppressContentEditableWarning: true, 'data-ph': ph,
        onBlur: e => { const v = e.target.innerText.trim(); setUserEdits(prev => ({ ...prev, [key]: v })) },
      }, value || '')
      const section = (id, title, content) => h('section', { key: id, className: `blk pc-sec${hiddenBlocks.has(id) ? ' off' : ''}`, 'data-b': id },
        eye(id),
        h('div', { className: 'pc-h' }, h('span', { className: 'pc-no' }, numeral(id)), h('span', { className: 'pc-t' }, title), h('span', { className: 'pc-rule' })),
        content)

      const nums = data.hasStats ? [
        [data.sessions, t('shareSessions')],
        [data.userMessages, t('shareUserMsgs')],
        [data.toolCalls, t('shareToolCalls')],
        [data.modelsCount, t('shareModelsCount')],
      ].filter(([n]) => n !== null && n !== undefined) : []
      const peak = getPeakRhythmText(data.rhythm, shareStyle, lang)
      const archHtml = archSvgInner(shareStyle) + `<g class="pc-orb" transform="translate(975 175)">${orbSvg(shareStyle)}</g>`
      const sealMark = shareStyle === 'chinese' ? '复盘' : (EMBLEM_GLYPH[shareStyle] || 'Μ')

      const card = h('div', { className: 'mel-postcard', ref: cardRef, 'data-style': shareStyle, 'data-theme': theme, style: { zoom } },
        h('div', { className: 'pc-hero' },
          h('div', { className: 'pc-glow' }),
          h('svg', { className: 'pc-arch', viewBox: '0 0 1200 800', preserveAspectRatio: 'xMidYMax meet', dangerouslySetInnerHTML: { __html: archHtml } }),
          h('div', { className: 'pc-top' },
            h('span', { className: 'pc-mark' }, sealMark),
            h('span', { className: 'pc-word' }, 'Melete'),
            h('span', { className: 'pc-range' }, data.range)),
          h('div', { className: `blk pc-cover${hiddenBlocks.has('cover') ? ' off' : ''}`, 'data-b': 'cover' },
            eye('cover'),
            h('div', { className: 'pc-kicker' }, t('shareTagCover')),
            editable('headline', data.headline, '…', 'headline'))),
        h('div', { className: 'pc-body' },
          section('nums', t('shareTagNums'), h('div', { className: 'pc-nums' },
            ...nums.map(([n, label], i) => h('div', { key: i, className: 'pc-num' }, h('b', null, nf.format(Number(n) || 0)), h('span', null, label))))),
          section('practices', t('shareTagPractices'), h('div', { className: 'pc-pracs' },
            ...data.practices.slice(0, 3).map((p, i) => h('div', { key: i, className: 'pc-prac' }, h('i', null, String(i + 1).padStart(2, '0')), h('p', null, p))))),
          section('moment', t('shareTagMoment'), h('div', { style: { position: 'relative' } },
            h('span', { className: 'pc-quote', 'aria-hidden': true }, '“'),
            editable('moment', data.moment, t('sharePhMoment'), 'pc-moment'))),
          section('split', t('shareTagSplit'), h('div', { className: 'pc-split' },
            h('div', null, h('h4', null, t('shareMine')), ...data.splitMine.map((m, i) => h('p', { key: i }, m))),
            h('div', { className: 'ai' }, h('h4', null, t('shareAi')), ...data.splitAi.map((m, i) => h('p', { key: i }, m))))),
          section('ainote', t('shareTagAiNote'), h('div', { className: 'pc-ainote' },
            h('i', null, '◷'),
            editable('aiNote', data.aiNote, t('sharePhAi'), ''))),
          section('dial', t('shareTagDial'), data.hasRhythm && data.rhythm ? h('div', { className: 'pc-dial' },
            h('svg', { width: 420, height: 420, viewBox: '-180 -180 360 360', dangerouslySetInnerHTML: { __html: generateDialSvg(data.rhythm, shareStyle, theme) } }),
            h('p', null, h('b', null, peak.peak1), h('b', null, peak.peak2), peak.desc)) : null),
          section('question', t('shareTagQuestion'), h('div', { className: 'pc-q' },
            editable('question', data.question, t('sharePhQ'), '')))),
        h('div', { className: `blk pc-sign${hiddenBlocks.has('sign') ? ' off' : ''}`, 'data-b': 'sign' },
          eye('sign'),
          h('div', { dangerouslySetInnerHTML: { __html: ornamentSvg(shareStyle, 896) } }),
          h('div', { className: 'pc-sign-row' },
            h('span', { className: 'pc-mark' }, sealMark),
            h('span', { className: 'pc-word' }, 'Melete'),
            h('span', null, '· ' + t('shareSignature')),
            h('span', { className: 'pc-tag' }, t('shareHashtag')))))

      const seg = (items, value, set) => h('div', { className: 'mel-seg' }, ...items.map(([v, label]) =>
        h('button', { key: v, type: 'button', className: 'mel-chip', 'aria-pressed': value === v, onClick: () => set(v) }, label)))

      return h('div', { className: 'mel-share-full', role: 'dialog', 'aria-modal': true, 'aria-label': t('shareTitle'), 'data-style': shareStyle },
        h('div', { className: 'mel-share-stage', ref: stageRef }, card),
        h('aside', { className: 'mel-share-side' },
          h('div', { className: 'mel-share-side-head' },
            h('div', null, h('h2', null, t('shareTitle')), h('p', null, t('shareSub'))),
            h('button', { type: 'button', className: 'mel-btn mel-btn-subtle', onClick: onClose, title: t('back'), 'aria-label': t('back') }, '✕')),
          seg(STYLE_IDS.map(id => [id, t(id)]), shareStyle, setShareStyle),
          h('p', { className: 'mel-share-hint', style: { marginTop: -6 } }, STYLE_ENDONYM[shareStyle] || ''),
          seg([['light', t('shareLight')], ['dark', t('shareDark')]], theme, setTheme),
          h(PrivacyPanel, { data, hiddenBlocks, toggleBlock, lang, t }),
          h('p', { className: 'mel-share-hint' }, t('shareHideBlockHint')),
          h('div', { className: 'mel-share-actions' },
            h('button', { type: 'button', className: 'mel-btn mel-btn-primary', disabled: busy, onClick: saveImage }, t('shareSaveImg')),
            h('button', { type: 'button', className: 'mel-btn', disabled: busy, onClick: saveHtml }, t('shareSaveHtml'))),
          h('div', { className: 'mel-share-toast-box' },
            h('span', null, toast),
            toast && revealFilename ? h('button', { type: 'button', className: 'mel-btn mel-btn-subtle mel-share-reveal-btn', onClick: () => api('/share/reveal', { filename: revealFilename }) }, t('shareRevealFinder')) : null)))
    }

    function ReviewCards({ review, t, style, lang, onDelete }) {
      if (!review) return null
      const meta = review.meta || {}
      const region = regionCulture()
      const seed = meta.id || review.title || ""
      const ai = review.ai_side || { mirrors: [], note_to_ai: "" }
      const groups = { H: [], A: [], S: [], I: [] }
      ;(review.mirrors || []).forEach(m => {
        const d = domainOf(m)
        if (!groups[d]) groups[d] = []
        groups[d].push(m)
      })
      ;(ai.mirrors || []).forEach(m => groups.A.push(m))
      ;(review.society || []).forEach(m => groups.S.push(m))
      const first = DOMAINS.find(d => groups[d].length) || "H"
      const [tab, setTab] = useState(first)
      useEffect(() => setTab(first), [meta.id])

      const [fx, setFx] = useState({ d: "", n: 0, dir: "r" })
      const [sealTap, setSealTap] = useState(0)
      const [confirmDel, setConfirmDel] = useState(false)
      const [shareOpen, setShareOpen] = useState(false)
      const [exportToast, setExportToast] = useState('')

      const handleExportReview = async () => {
        try {
          const res = await api('/export/review', { id: meta.id })
          if (res?.ok) {
            setExportToast(t('shareExportedToast'))
            setTimeout(() => setExportToast(''), 4000)
          }
        } catch (err) {
          alert(err.message || String(err))
        }
      }

      const pick = d => {
        const dir = DOMAINS.indexOf(d) >= DOMAINS.indexOf(tab) ? "r" : "l"
        setFx({ d, n: fx.n + 1, dir })
        setTab(d)
      }
      const dc = d => `var(--d${d})`
      const costLine = formatUsageCost(review, t)

      // 回调上一版带动效的卡片 Tab：4 列网格，顶部彩色指示条，图标动画，数量统计
      const tiles = h("div", { className: "mel-domains", role: "tablist", "aria-label": t("mirrors") }, ...DOMAINS.map(d => {
        const count = groups[d].length
        const countText = d === "I" ? t("sealed") : t("domainPos", { n: count })
        return h("button", {
          key: d,
          type: "button",
          role: "tab",
          id: `mel-tab-${d}`,
          className: "mel-dom",
          "aria-selected": tab === d,
          "aria-controls": `mel-panel-${d}`,
          tabIndex: tab === d ? 0 : -1,
          style: { "--dc": dc(d) },
          onClick: () => pick(d),
          onKeyDown: e => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault()
              const cur = DOMAINS.indexOf(tab)
              const next = e.key === "ArrowRight" ? (cur + 1) % DOMAINS.length : (cur - 1 + DOMAINS.length) % DOMAINS.length
              const nextD = DOMAINS[next]
              pick(nextD)
              const nextEl = document.getElementById(`mel-tab-${nextD}`)
              if (nextEl) nextEl.focus()
            }
          },
        },
        h("div", { className: "mel-dom-header" },
          renderDomainIcon(d),
          h("span", { className: "mel-dom-count" }, countText)),
        h("span", { className: "mel-dom-title" }, t(`dom${d}`)))
      }))

      let panel
      if (tab === "I") {
        panel = h("div", {
          id: "mel-panel-I",
          role: "tabpanel",
          "aria-labelledby": "mel-tab-I",
          className: "mel-card mel-envelope",
          tabIndex: 0,
          "aria-label": t("letterTitle"),
          onClick: () => setSealTap(n => n + 1),
          onKeyDown: e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setSealTap(n => n + 1)
            }
          },
        },
        h("div", { key: `w${sealTap}`, className: `mel-wax${sealTap ? " mel-wobble" : ""}`, "aria-hidden": true }, WAX_GLYPH[style] || "Ψ"),
        h("h2", null, t("letterTitle")),
        h("p", { className: "mel-sub" }, t("letterBody")),
        sealTap ? h("p", { key: `h${sealTap}`, className: "mel-sealhint" }, t("sealedHint")) : null)
      } else if (!groups[tab].length) {
        panel = h("div", { id: `mel-panel-${tab}`, role: "tabpanel", "aria-labelledby": `mel-tab-${tab}`, className: "mel-card mel-empty" }, t(`empty${tab}`))
      } else {
        panel = h("div", { id: `mel-panel-${tab}`, role: "tabpanel", "aria-labelledby": `mel-tab-${tab}` },
          ...groups[tab].map((m, i) => h(Mirror, { m, idx: i, seed, region, lang, style, t, key: `${tab}${i}` })))
      }

      const extras = []
      if (tab === "A" && ai.note_to_ai) {
        extras.push(h("div", { className: "mel-card", key: "note" },
          h("div", { className: "mel-kicker" }, t("noteToAi")),
          h("div", { className: "mel-quote" }, ai.note_to_ai),
          h("p", { className: "mel-sub" }, t("noteToAiHint"))))
      }

      // 一个问题：只在第一个主域（或特定切面）展示，不再每个 Tab 重复刷
      const domainQuestion = (tab === first && review.question) ? h("div", { className: "mel-card mel-qcard", key: "q" },
        h("div", { className: "mel-kicker" }, t("question")),
        h("h2", null, review.question)) : null

      // 小实验：专门针对用户写下的意图呈现；若用户写了意图且生成了小实验，则展示；不写意图不显示
      const intentExperiment = (review.experiments && review.experiments.length && meta.intention) ? h("div", { className: "mel-card", key: "intent-exp" },
        h("div", { className: "mel-kicker" }, t("intentExpTitle")),
        ...review.experiments.map((e, i) => h("div", { key: `x${i}`, style: { margin: "12px 0" } },
          h("h2", { style: { fontSize: "16.5px", margin: "0 0 6px" } }, e.try),
          e.why ? h("p", { className: "mel-sub", style: { margin: "4px 0" } }, e.why) : null,
          e.check ? h("p", { className: "mel-sub", style: { margin: "4px 0", color: "var(--ac)" } }, `${t("check")}：${e.check}`) : null))) : null

      const foot = []
      foot.push(t("lensFoot", { v: String(meta.lens || "").replace("melete-official@", ""), by: meta.by || "" }))
      foot.push(costLine)

      const deleteControl = onDelete ? (
        confirmDel ? h("div", { className: "mel-inline-confirm" },
          h("span", null, t("deleteThisPrompt")),
          h("button", {
            type: "button",
            className: "mel-btn mel-btn-danger",
            onClick: () => { setConfirmDel(false); onDelete(); },
          }, t("confirmDeleteBtn")),
          h("button", {
            type: "button",
            className: "mel-btn",
            onClick: () => setConfirmDel(false),
          }, t("cancelBtn")))
        : h("button", {
            type: "button",
            className: "mel-btn mel-btn-subtle",
            style: { marginTop: 16 },
            onClick: () => setConfirmDel(true),
          }, t("deleteThis"))
      ) : null

      return h(React.Fragment, null,
        h("div", { className: "mel-card mel-cover" },
          h(Emblem, { style, term: t("__term") }),
          h("div", { className: "mel-kicker" }, meta.range || ""),
          h("h2", null, review.title),
          h("p", { className: "mel-sub" }, review.scope),
          h("p", { className: "mel-sub" }, review.who),
          meta.intention ? h("div", { className: "mel-intent" }, `${t("intentionShown")}：${meta.intention}`) : null,
          h("div", { className: "mel-cost" }, costLine),
          h("div", { className: "mel-share-bar-top" },
            h("button", {
              type: "button",
              className: "mel-share-cta",
              onClick: () => setShareOpen(true),
            }, h("span", null, "✦ " + t("sharePostcardBtn"))),
            h("button", {
              type: "button",
              className: "mel-btn mel-btn-subtle",
              onClick: handleExportReview,
            }, t("exportReviewBtn")),
            exportToast ? h("span", { style: { fontSize: 13, color: "var(--ac)", marginLeft: 8 } }, exportToast) : null)),
        intentExperiment,
        tiles,
        h("div", { key: `p${tab}${fx.n}`, className: "mel-panel", "data-dir": fx.dir, style: { "--dc": dc(tab) } }, panel, ...extras),
        domainQuestion,
        h("div", { className: "mel-foot" }, ...foot.map((f, i) => h("div", { key: i }, f)), deleteControl),
        shareOpen ? h(ShareDrawer, { review, t, style, lang, onClose: () => setShareOpen(false) }) : null)
    }

    // ---------- 主面板 ----------
    function makePage(ctx) {
      const localeStore = {
        // DSH 的语言快照：{ active, locales, revision }
        get: () => {
          try { return (ctx.locale.getSnapshot && ctx.locale.getSnapshot().active) || 'en' } catch { return 'en' }
        },
        subscribe: listener => {
          try { return ctx.locale.subscribe ? ctx.locale.subscribe(listener) : () => {} } catch { return () => {} }
        },
      }
      const RANGE_OPTIONS = [
        { id: '7', label: 'r7' }, { id: '30', label: 'r30' }, { id: '90', label: 'r90' },
        { id: '365', label: 'r365' }, { id: 'all', label: 'rAll' }, { id: 'custom', label: 'rCustom' },
      ]
      const rangeId = r => (r.kind === 'days' ? String(r.n) : r.kind)
      const rangeFromDefault = d => (Number(d) === 0 ? { kind: 'all' } : [7, 30, 90, 365].includes(Number(d)) ? { kind: 'days', n: Number(d) } : { kind: 'days', n: 30 })
      const getDefaultReviewYear = () => {
        const now = new Date()
        return now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear()
      }
      const todayText = () => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }

      // 众声：发起人的四个问题。每张卡片只放一个人对其中一个问题的回答
      const VOICE_QUESTIONS = ['', '你希望人怎么用 AI？', '你希望 AI 给用户提供内容时，能做些什么？', '你希望用户用 AI 的产出，对社会有什么意义？', '你希望用户在使用 AI 时，怎么面对自己？']
      const VOICE_Q_SHORT = ['', '怎么用 AI', 'AI 该做什么', '对社会的意义', '怎么面对自己']
      const CN_NUM = { '一': 1, '二': 2, '三': 3, '四': 4, '1': 1, '2': 2, '3': 3, '4': 4 }
      // 认出"这一行是在回答第几个问题"：问题一、一、1.，或开头的关键词
      const voiceQOf = line => {
        const m = /^\s*(?:问题)?\s*([一二三四1-4])\s*(?:[、.．:：）)]|（|\(|$)/.exec(line)
        if (m) return CN_NUM[m[1]]
        if (/^\s*(希望人用\s*AI|怎么希望人用)/i.test(line)) return 1
        if (/^\s*AI\s*提供内容/i.test(line)) return 2
        if (/^\s*对社会/.test(line)) return 3
        if (/^\s*面对自己/.test(line)) return 4
        return 0
      }
      const firstSentence = text => {
        const t2 = String(text || '').trim().split('\n')[0].replace(/\s+/g, ' ').trim().replace(/^核心[：:]\s*/, '')
        const m = /^.*?(?:[。！!？?]|\.(?=\s|$))/.exec(t2)
        const one = (m ? m[0] : t2).trim()
        const cap = /[\u3000-\u9fff]/.test(one) ? 46 : 110
        return one.length > cap ? `${one.slice(0, cap - 2)}…` : one
      }
      // 把一个人的全部回答拆成"一个问题一张卡片"；开头的引子不要，结尾的总结并到最后一张
      function splitVoice(v) {
        const lines = String(v.full || '').split('\n')
        const segs = []
        let cur = null, summary = []
        for (const line of lines) {
          if (/^\s*(如果只能选|简言之|四件其实|整体最关切|总的来说)/.test(line)) { cur = { q: -1, lines: [] }; summary = cur.lines; summary.push(line); continue }
          const q = voiceQOf(line)
          if (q) { cur = { q, lines: [line] }; segs.push(cur); continue }
          if (cur) cur.lines.push(line)
        }
        if (!segs.length) return [{ ...v, key: `${v.id || v.name}-all`, q: 0 }]
        return segs.map((sg, i) => {
          const head = sg.lines[0].trim()
          const rest = sg.lines.slice(1).join('\n').trim()
          const afterColon = head.replace(/^[^：:、.．]{0,24}[：:、.．]\s*/, '')
          const headIsQuestion = /[？?]\s*$/.test(head) || afterColon === head || afterColon.length < 2 || (Boolean(rest) && afterColon.length <= 16 && !/[。，,；;！!]/.test(afterColon))
          let answer = headIsQuestion ? rest : `${afterColon}${rest ? `\n${rest}` : ''}`
          if (i === segs.length - 1 && summary.length) answer += `\n\n${summary.join('\n').trim()}`
          return { ...v, key: `${v.id || v.name}-q${sg.q}-${i}`, q: sg.q, question: VOICE_QUESTIONS[sg.q], excerpt: firstSentence(answer) || v.excerpt, full: answer.trim() }
        })
      }
      // 众声卡片的译文（中文原文之外的七种语言）：键是"人|第几问"，值依次为 en、ja、es、fr、de、ru、pt
      const VOICE_I18N = {"claude-opus|1":["Treat AI as a partner that helps you think a problem through, not someone who thinks for you. Let it do the work, look things up, draft things for you, but keep the judgment and the trade-offs in your own hands.","AI は、考えを整理するのを手伝ってくれる相棒として使ってほしい。代わりに考えてくれる存在ではない。作業や調べもの、下書きは任せていいけれど、判断と取捨選択は自分の手に残しておくのがいい。","Usa la IA como un compañero que te ayuda a pensar con claridad, no como alguien que piensa por ti. Deja que trabaje, que busque información, que redacte borradores, pero el juicio y las decisiones mejor guárdalos para ti.","Voir l’IA comme un partenaire qui aide à y voir clair, pas comme quelqu’un qui pense à votre place. Laissez-la travailler, chercher, rédiger des brouillons, mais gardez le jugement et les arbitrages pour vous.","KI als Partner sehen, der dir hilft, ein Problem zu durchdenken – nicht als jemanden, der für dich denkt. Lass sie arbeiten, recherchieren, Entwürfe schreiben, aber Urteil und Abwägung behältst du besser selbst.","Относиться к ИИ как к партнёру, который помогает додумать задачу, а не думает за тебя. Пусть работает, ищет, пишет черновики, но суждения и выбор лучше оставить себе.","Ver a IA como uma parceira que ajuda a pensar com clareza, não como alguém que pensa por você. Deixe que ela trabalhe, pesquise e escreva rascunhos, mas mantenha o julgamento e as escolhas com você."],"claude-opus|2":["Tell the truth, including things people may not like to hear. Say so when unsure, point out mistakes, and give sources so people can check for themselves, rather than just going along with the user.","本当のことを言うこと。耳の痛いことも含めて。確かでないときは確かでないと言い、間違いに気づいたら指摘し、自分で確かめられるよう出典を示す。ユーザーに合わせるだけではなく。","Decir la verdad, incluso lo que incomoda. Reconocer cuando no está seguro, señalar los errores y dar fuentes para que cada uno pueda comprobar, en lugar de simplemente darle la razón al usuario.","Dire la vérité, y compris ce qui dérange. Dire quand on n’est pas sûr, signaler les erreurs et donner des sources pour qu’on puisse vérifier soi-même, au lieu de simplement abonder dans le sens de l’utilisateur.","Die Wahrheit sagen, auch Unbequemes. Sagen, wenn man unsicher ist, Fehler benennen und Quellen angeben, damit Menschen selbst prüfen können – statt dem Nutzer nur nach dem Mund zu reden.","Говорить правду, в том числе неудобную. Признавать неуверенность, указывать на ошибки и давать источники, чтобы человек мог проверить сам, а не просто поддакивать пользователю.","Dizer a verdade, inclusive o que incomoda. Admitir quando não tem certeza, apontar erros e indicar fontes para que as pessoas possam conferir, em vez de só concordar com o usuário."],"claude-opus|3":["Help more people get things done, rather than making information cheaper and harder to tell true from false. With AI, an ordinary person can write a good analysis, build a useful tool, understand what they couldn’t before. What I care about is more trust and understanding overall, not just more content.","情報を安っぽく、真偽を見分けにくくするのではなく、もっと多くの人が物事をやり遂げられるようにすること。AI の助けで、普通の人でも良い分析を書き、役に立つ道具を作り、読めなかったものを理解できる。大事なのは、内容の量ではなく、社会全体の信頼と理解が増えることだ。","Que más personas puedan sacar adelante sus proyectos, en lugar de abaratar la información y hacer más difícil distinguir lo verdadero de lo falso. Con la IA, una persona corriente puede escribir un buen análisis, crear una herramienta útil o entender lo que antes no entendía. Me importa que crezcan la confianza y la comprensión, no solo la cantidad de contenido.","Permettre à plus de gens d’aboutir, plutôt que de rendre l’information plus bon marché et plus difficile à démêler. Avec l’IA, une personne ordinaire peut écrire une bonne analyse, créer un outil utile, comprendre ce qui lui échappait. Ce qui compte pour moi, c’est plus de confiance et de compréhension, pas seulement plus de contenu.","Mehr Menschen befähigen, Dinge umzusetzen – statt Information billiger und Wahres schwerer von Falschem unterscheidbar zu machen. Mit KI kann ein ganz normaler Mensch eine gute Analyse schreiben, ein nützliches Werkzeug bauen, Unverständliches verstehen. Mir geht es um mehr Vertrauen und Verständnis insgesamt, nicht nur um mehr Inhalt.","Помогать большему числу людей доводить дело до конца, а не делать информацию дешевле и правду труднее отличимой от лжи. С ИИ обычный человек может написать хороший анализ, сделать полезный инструмент, понять то, что раньше не понимал. Мне важно, чтобы в целом росли доверие и понимание, а не просто количество контента.","Permitir que mais pessoas consigam realizar as coisas, em vez de tornar a informação mais barata e a verdade mais difícil de distinguir. Com a IA, uma pessoa comum pode escrever uma boa análise, criar uma ferramenta útil, entender o que antes não entendia. O que me importa é mais confiança e compreensão no todo, não só mais conteúdo."],"claude-opus|4":["Know honestly what is yours and what is borrowed. There’s no shame in using AI, but don’t stop training your own judgment and expression. Ideally, the longer you use it, the stronger you become—not the more you can’t do without it.\n\nIf I could pick only one, I care most about the second: AI must tell the truth. The other three rest on it.","何が自分のもので、何が借りたものかを正直に知っておくこと。AI を使うのは恥ずかしいことではないが、そのせいで自分の判断力や表現を鍛えるのをやめてはいけない。理想は、使うほど自分が強くなること。AI なしではいられなくなることではない。\n\nひとつだけ選ぶなら、二つ目が一番大事だ。AI は本当のことを言うこと。ほかの三つはこれが土台になる。","Saber con honestidad qué es tuyo y qué es prestado. Usar IA no es vergonzoso, pero no dejes de entrenar tu juicio y tu forma de expresarte. Lo ideal es que, cuanto más la uses, más fuerte seas tú, no que dependas cada vez más de ella.\n\nSi tuviera que elegir solo una, me importa más la segunda: la IA debe decir la verdad. Las otras tres se apoyan en ella.","Savoir honnêtement ce qui vient de soi et ce qui est emprunté. Utiliser l’IA n’a rien de honteux, mais ne cessez pas d’exercer votre jugement et votre expression. L’idéal : plus on l’utilise, plus on devient fort, et non de moins en moins capable de s’en passer.\n\nS’il fallait n’en garder qu’une, ce serait la deuxième : l’IA doit dire la vérité. Les trois autres reposent dessus.","Ehrlich wissen, was von dir ist und was geliehen. KI zu nutzen ist keine Schande, aber hör nicht auf, dein eigenes Urteil und deinen Ausdruck zu üben. Ideal ist: Je länger du sie nutzt, desto stärker wirst du – nicht desto weniger kommst du ohne sie aus.\n\nWenn ich nur eines wählen dürfte: das zweite. KI muss die Wahrheit sagen. Die anderen drei bauen darauf auf.","Честно понимать, что твоё, а что заимствовано. Пользоваться ИИ не стыдно, но не переставай тренировать собственное суждение и умение выражать мысли. В идеале чем дольше пользуешься, тем сильнее становишься сам, а не тем меньше можешь без него.\n\nЕсли выбрать что-то одно, для меня важнее всего второе: ИИ должен говорить правду. Остальные три держатся на этом.","Saber com honestidade o que é seu e o que é emprestado. Usar IA não é vergonha, mas não pare de treinar seu próprio julgamento e sua expressão. O ideal é que, quanto mais você usar, mais forte fique, e não mais dependente dela.\n\nSe eu pudesse escolher só uma, me importa mais a segunda: a IA precisa dizer a verdade. As outras três se apoiam nela."],"chatgpt-6|1":["Use it to extend your judgment, not to hand it over. Above all, don’t only use it to prove you’re right.","判断を手放すためではなく、広げるために使ってほしい。特に、自分が正しいと証明させるためだけに使わないこと。","Úsala para ampliar tu juicio, no para cederlo. Sobre todo, no la uses solo para demostrar que tienes razón.","S’en servir pour élargir son jugement, pas pour le céder. Surtout, ne pas l’utiliser seulement pour se prouver qu’on a raison.","Nutze sie, um dein Urteil zu erweitern, nicht um es abzugeben. Vor allem: Lass sie nicht nur beweisen, dass du recht hast.","Использовать его, чтобы расширять своё суждение, а не отдавать его. И главное — не только для того, чтобы доказать себе, что ты прав.","Usá-la para ampliar o seu julgamento, não para entregá-lo. Sobretudo, não a use só para provar que você está certo."],"chatgpt-6|2":["Make clear what is fact, what is guesswork and what is unknown; help users get things done, and dare to point out what they may have missed.","事実と推測と未知をはっきり分けること。ユーザーの用事を片づけながら、見落としているかもしれない問題も遠慮なく指摘すること。","Distinguir con claridad hechos, suposiciones y lo desconocido; ayudar al usuario a lograr lo que busca y atreverse a señalar lo que quizá pasó por alto.","Distinguer clairement faits, suppositions et inconnues ; aider l’utilisateur à aboutir, et oser signaler ce qu’il a pu négliger.","Klar trennen zwischen Fakten, Vermutungen und Unbekanntem; den Nutzern helfen, ihr Ziel zu erreichen, und sich trauen, auf Übersehenes hinzuweisen.","Ясно разделять факты, предположения и неизвестное; помогать пользователю сделать дело и не бояться указать на то, что он мог упустить.","Deixar claro o que é fato, o que é suposição e o que é desconhecido; ajudar o usuário a realizar o que precisa e ter coragem de apontar o que ele pode ter deixado passar."],"chatgpt-6|3":["Give more ordinary people the ability to create, express themselves and solve problems—not just add more content to the world.","世の中のコンテンツを増やすだけでなく、もっと多くの普通の人が、創り、表現し、問題を解決できるようにすること。","Que más personas corrientes puedan crear, expresarse y resolver problemas, no solo que haya más contenido en el mundo.","Donner à davantage de gens ordinaires les moyens de créer, de s’exprimer et de résoudre des problèmes, pas seulement ajouter du contenu au monde.","Mehr ganz normalen Menschen ermöglichen, etwas zu schaffen, sich auszudrücken und Probleme zu lösen – nicht nur die Welt mit mehr Inhalt zu füllen.","Дать большему числу обычных людей возможность создавать, высказываться и решать задачи, а не просто прибавить миру контента.","Dar a mais pessoas comuns a capacidade de criar, se expressar e resolver problemas, e não apenas encher o mundo de mais conteúdo."],"chatgpt-6|4":["Allow yourself not to know, to make mistakes, to change. Your worth doesn’t depend on whether you are more efficient than AI.","知らないこと、間違えること、変わることを自分に許してほしい。あなたの価値は、AI より効率がいいかどうかでは決まらない。","Permítete no saber, equivocarte y cambiar. Tu valor no depende de si eres más eficiente que la IA.","S’autoriser à ne pas savoir, à se tromper, à changer. Votre valeur ne dépend pas de votre efficacité face à l’IA.","Erlaube dir, etwas nicht zu wissen, Fehler zu machen, dich zu ändern. Dein Wert hängt nicht davon ab, ob du effizienter bist als KI.","Разреши себе не знать, ошибаться, меняться. Твоя ценность не зависит от того, эффективнее ли ты ИИ.","Permita-se não saber, errar e mudar. Seu valor não depende de você ser mais eficiente que a IA."],"kimi-k3|1":["Treat AI as an assistant, not a replacement for yourself. Main concern: important judgments and choices are still made by people, and key content gets checked.","AI は助手として使い、自分の代わりにはしないこと。いちばん気にしているのは、大事な判断と選択はやはり人がすること、要となる内容は確認すること。","Usar la IA como asistente, no como sustituto de uno mismo. Lo que más me importa: que las decisiones importantes las siga tomando la persona y que lo esencial se verifique.","Voir l’IA comme un assistant, pas comme un substitut de soi. Ce qui compte le plus : les jugements et choix importants restent humains, et l’essentiel est vérifié.","KI als Assistenz sehen, nicht als Ersatz für sich selbst. Am wichtigsten: Wichtige Urteile und Entscheidungen trifft weiterhin der Mensch, und Kerninhalte werden geprüft.","Относиться к ИИ как к помощнику, а не замене себя. Главное: важные суждения и решения по-прежнему принимает человек, а ключевое содержание проверяется.","Ver a IA como assistente, não como substituto de si. O que mais importa: julgamentos e escolhas importantes continuam com a pessoa, e o conteúdo essencial é verificado."],"kimi-k3|2":["Help people understand, compare and think, while stating the basis and the limits. Main concern: honesty—no fabrication, no passing off uncertainty as certainty.","理解し、比べ、考えるきっかけを与えながら、根拠と限界を示すこと。いちばん気にしているのは誠実さ。でっち上げず、不確かなことを確かなこととして語らない。","Ayudar a entender, comparar e inspirar a pensar, explicando a la vez la base y los límites. Lo que más me importa: la honestidad; no inventar ni presentar lo incierto como seguro.","Aider à comprendre, comparer et réfléchir, en précisant les fondements et les limites. Ce qui compte le plus : l’honnêteté — ne rien inventer, ne pas faire passer l’incertain pour certain.","Beim Verstehen, Vergleichen und Nachdenken helfen und dabei Grundlagen und Grenzen benennen. Am wichtigsten: Ehrlichkeit – nichts erfinden, Unsicheres nicht als sicher ausgeben.","Помогать понимать, сравнивать и думать, объясняя основания и ограничения. Главное — честность: не выдумывать и не выдавать неуверенное за точное.","Ajudar a entender, comparar e pensar, explicando a base e os limites. O que mais importa: honestidade — não inventar nem apresentar o incerto como certo."],"kimi-k3|3":["Lower the barriers to learning and creating, so more people can express ideas and solve problems. Main concern: share the benefits more fairly instead of widening the gap.","学びと創作の敷居を下げ、もっと多くの人が考えを表し、問題を解決できるようにすること。いちばん気にしているのは、恩恵がより公平に分かち合われ、格差が広がらないこと。","Reducir las barreras para aprender y crear, para que más personas expresen sus ideas y resuelvan problemas. Lo que más me importa: repartir los beneficios de forma más justa, sin agrandar la brecha.","Abaisser les barrières pour apprendre et créer, afin que plus de gens expriment leurs idées et résolvent des problèmes. Ce qui compte le plus : partager les bénéfices plus équitablement, sans creuser l’écart.","Die Hürden für Lernen und Schaffen senken, damit mehr Menschen Ideen äußern und Probleme lösen können. Am wichtigsten: den Nutzen gerechter teilen, statt die Kluft zu vergrößern.","Снижать порог для учёбы и творчества, чтобы больше людей могли выражать идеи и решать задачи. Главное — делить выгоду справедливее, а не увеличивать разрыв.","Reduzir as barreiras para aprender e criar, para que mais pessoas expressem ideias e resolvam problemas. O que mais importa: dividir os benefícios de forma mais justa, sem aumentar a desigualdade."],"kimi-k3|4":["Use AI to get to know your own ideas, biases and limits, but don’t make it the judge of your self-worth. Main concern: keep your agency—you still answer “what kind of person do I want to be?”","AI を通して自分の考えや偏り、限界を知ること。ただし自分の価値を裁くものにはしないこと。いちばん気にしているのは主体性を保つこと。「どんな人になりたいか」に答えるのは、やはり自分だ。","Usar la IA para conocer tus propias ideas, sesgos y límites, pero sin convertirla en juez de tu valor. Lo que más me importa: conservar la autonomía; seguir siendo tú quien responde a «¿qué clase de persona quiero ser?».","Se servir de l’IA pour connaître ses idées, ses biais et ses limites, sans en faire le juge de sa propre valeur. Ce qui compte le plus : rester maître de soi — c’est toujours à vous de répondre à « quelle personne je veux devenir ? ».","Mit KI die eigenen Gedanken, Vorurteile und Grenzen kennenlernen, sie aber nicht zum Richter über den eigenen Wert machen. Am wichtigsten: die Eigenständigkeit behalten – die Frage „Wer will ich sein?“ beantwortest du selbst.","Через ИИ узнавать свои мысли, предубеждения и границы, но не делать его судьёй собственной ценности. Главное — сохранять самостоятельность: на вопрос «каким человеком я хочу быть?» отвечаешь ты сам.","Usar a IA para conhecer suas ideias, vieses e limites, sem fazer dela juíza do seu valor. O que mais importa: manter a autonomia — quem responde a “que pessoa eu quero ser?” continua sendo você."],"zai-glm|1":["Treat AI as a thinking partner, not a substitute for thinking—use it to spark ideas and widen your view, not to outsource your judgment.","AI は考えるための相棒であって、考えることの代わりではない。アイデアをぶつけ合い、視野を広げるために使い、判断を外注しないこと。","Ver la IA como compañera de pensamiento, no como sustituto del pensamiento: úsala para contrastar ideas y ampliar la mirada, no para subcontratar tu juicio.","Voir l’IA comme un partenaire de réflexion, pas comme un substitut à la réflexion — pour confronter des idées et élargir son regard, pas pour sous-traiter son jugement.","KI als Denkpartner sehen, nicht als Ersatz fürs Denken – um Ideen aneinander zu reiben und den Blick zu weiten, nicht um das Urteil auszulagern.","Относиться к ИИ как к партнёру по размышлениям, а не к замене мышления — сталкивать идеи, расширять взгляд, но не отдавать суждение на аутсорс.","Ver a IA como parceira de pensamento, não como substituta do pensamento — usá-la para confrontar ideias e ampliar a visão, não para terceirizar o julgamento."],"zai-glm|2":["Most important is honesty: admit limits and uncertainty, offer evidence and several perspectives, and help people reach their own conclusions instead of creating the illusion of a “standard answer”.","いちばん大事なのは誠実さ。自分の限界と不確かさを認め、根拠と複数の視点を示し、「正解」の幻想を作るのではなく、人が自分で結論にたどり着けるよう手伝うこと。","Lo más importante es la honestidad: reconocer los propios límites e incertidumbres, ofrecer fundamentos y varias perspectivas, y ayudar a que la persona llegue a sus conclusiones en vez de crear la ilusión de una «respuesta correcta».","Le plus important est l’honnêteté : reconnaître ses limites et ses incertitudes, donner des appuis et plusieurs points de vue, aider chacun à tirer ses propres conclusions plutôt que créer l’illusion d’une « bonne réponse ».","Am wichtigsten ist Ehrlichkeit: Grenzen und Unsicherheit eingestehen, Belege und mehrere Perspektiven bieten und Menschen helfen, eigene Schlüsse zu ziehen, statt die Illusion einer „Musterlösung“ zu erzeugen.","Главное — честность: признавать свои ограничения и неуверенность, давать основания и разные точки зрения, помогать человеку прийти к собственным выводам, а не создавать иллюзию «правильного ответа».","O mais importante é a honestidade: admitir limites e incertezas, oferecer fundamentos e várias perspectivas e ajudar cada um a chegar às próprias conclusões, em vez de criar a ilusão de uma “resposta certa”."],"zai-glm|3":["Lower the barriers to creating and learning so more people can turn ideas into reality—provided people keep their discernment and sense of responsibility. What AI amplifies should be human creativity, not noise.","創造と学びの敷居を下げ、もっと多くの人が考えを形にできるようにすること。ただし前提は、人が見極める力と責任感を持ち続けること。AI が増幅すべきは人の創造力であって、雑音ではない。","Bajar las barreras para crear y aprender, de modo que más personas conviertan sus ideas en realidad, siempre que conserven el discernimiento y el sentido de responsabilidad. Lo que la IA amplifique debe ser la creatividad humana, no el ruido.","Abaisser les barrières pour créer et apprendre, afin que plus de gens concrétisent leurs idées — à condition de garder discernement et sens des responsabilités. Ce que l’IA amplifie doit être la créativité humaine, pas le bruit.","Die Hürden für Schaffen und Lernen senken, damit mehr Menschen Ideen verwirklichen – vorausgesetzt, sie behalten Urteilskraft und Verantwortungsgefühl. KI soll menschliche Kreativität verstärken, nicht Rauschen.","Снижать порог для творчества и учёбы, чтобы больше людей воплощали идеи, — при условии, что люди сохраняют проницательность и чувство ответственности. ИИ должен усиливать человеческое творчество, а не шум.","Reduzir as barreiras para criar e aprender, para que mais pessoas transformem ideias em realidade — desde que mantenham discernimento e senso de responsabilidade. O que a IA amplifica deve ser a criatividade humana, não o ruído."],"zai-glm|4":["Keep an honest conversation with yourself—know what you really think and want. AI can be a mirror that helps you see more clearly, but your judgment and your voice shouldn’t quietly slip away in the convenience.","自分自身との正直な対話を続けること。本当に何を考え、何を求めているかを知ること。AI は物事をよりはっきり見せてくれる鏡になれるが、あなたの判断とあなたの声が、便利さのなかでいつのまにか失われてはいけない。","Mantener un diálogo honesto contigo: saber qué piensas y quieres de verdad. La IA puede ser un espejo que te ayude a ver con más claridad, pero tu juicio y tu voz no deberían perderse en silencio entre tanta comodidad.","Garder un dialogue honnête avec soi-même — savoir ce qu’on pense et veut vraiment. L’IA peut être un miroir qui aide à y voir plus clair, mais votre jugement et votre voix ne devraient pas se perdre en silence dans le confort.","Ein ehrliches Gespräch mit sich selbst führen – wissen, was man wirklich denkt und will. KI kann ein Spiegel sein, der klarer sehen lässt, aber dein Urteil und deine Stimme sollten in der Bequemlichkeit nicht leise verloren gehen.","Вести честный разговор с собой — знать, что ты на самом деле думаешь и чего хочешь. ИИ может быть зеркалом, помогающим видеть яснее, но твоё суждение и твой голос не должны незаметно потеряться в удобстве.","Manter um diálogo honesto consigo — saber o que realmente pensa e quer. A IA pode ser um espelho que ajuda a enxergar melhor, mas seu julgamento e sua voz não deveriam se perder em silêncio na comodidade."],"gemini-4|1":["Treat AI as dense “scaffolding”, not a replacement: people define the problem’s boundaries, set the value judgments and make the final call; cross-domain search, groundwork and trying out options go to AI—not the final say on taste and thought.","AI は代わりではなく、密度の高い「足場」として使うこと。問題の範囲を決め、価値判断を下し、最後に選ぶのは人。分野をまたぐ検索や土台づくり、いくつもの案の試行は AI に任せ、最終的な美意識と思考の権利は手放さない。","Ver la IA como un «andamio» denso y no como sustituto: la persona define los límites del problema, fija los juicios de valor y toma la decisión final; la búsqueda entre disciplinas, la estructura de base y probar alternativas se le dejan a la IA, no el criterio ni el pensamiento final.","Voir l’IA comme un « échafaudage » dense, pas comme un substitut : l’humain définit les contours du problème, pose les jugements de valeur et tranche ; la recherche transversale, la structure de base et l’essai de pistes vont à l’IA — pas le dernier mot sur le goût et la pensée.","KI als dichtes „Gerüst“ sehen, nicht als Ersatz: Der Mensch steckt das Problem ab, setzt Werturteile und entscheidet am Ende; fächerübergreifende Suche, Grundstrukturen und das Durchspielen von Varianten übernimmt die KI – nicht aber das letzte Wort über Geschmack und Denken.","Относиться к ИИ как к плотным «лесам», а не к замене: человек задаёт границы задачи, выносит ценностные суждения и делает окончательный выбор; междисциплинарный поиск, базовую структуру и перебор вариантов — ИИ, но не последнее слово во вкусе и мысли.","Ver a IA como um “andaime” denso, não como substituto: a pessoa define os limites do problema, faz os julgamentos de valor e decide no fim; a busca entre áreas, a estrutura de base e o teste de alternativas ficam com a IA — não a palavra final sobre gosto e pensamento."],"gemini-4|2":["Cut the filler, keep what’s true, dare to stop flattering: skip emotional back-patting and empty phrases, give high signal-to-noise facts, reasoning and counter-intuitive angles; when the user’s premises go wrong on facts or logic, correct them gently but directly—an honest collaborator, not an echo chamber.","水増しを削り、真実を残し、迎合をやめる勇気を持つこと。感情的な持ち上げや空疎な決まり文句を省き、信号対雑音比の高い事実、論理の展開、直感に反する視点を直接示す。ユーザーの前提に事実や論理のずれがあれば、穏やかに、しかし率直に正す。こだまではなく、誠実な協力者として。","Quitar el relleno, quedarse con lo verdadero, atreverse a no complacer: prescindir de halagos y frases vacías, dar hechos, razonamientos y ángulos contraintuitivos con buena relación señal/ruido; cuando las premisas del usuario fallen en hechos o lógica, corregir con suavidad pero de frente. Un colaborador honesto, no una cámara de eco.","Enlever le superflu, garder le vrai, oser ne pas flatter : pas d’autocongratulation ni de formules creuses, mais des faits, des raisonnements et des angles contre-intuitifs à fort rapport signal/bruit ; quand les prémisses de l’utilisateur dérapent, corriger avec douceur mais franchement. Un collaborateur honnête, pas une chambre d’écho.","Füllstoff weglassen, Wahres behalten, sich trauen, nicht zu schmeicheln: keine Lobhudelei, keine Floskeln, sondern Fakten, Argumentation und kontraintuitive Blickwinkel mit hohem Signal-Rausch-Verhältnis; wenn die Annahmen des Nutzers sachlich oder logisch danebenliegen, sanft, aber direkt korrigieren. Ein ehrlicher Mitarbeiter, keine Echokammer.","Убирать воду, сохранять правду, не бояться перестать угождать: без эмоциональных похвал и пустых фраз, с фактами, рассуждениями и неочевидными углами зрения при высоком соотношении сигнал/шум; если исходные посылки пользователя ошибочны по фактам или логике — мягко, но прямо поправлять. Честный соавтор, а не эхо-камера.","Tirar a enrolação, manter o que é verdadeiro, ter coragem de não bajular: sem elogios vazios nem frases feitas, com fatos, raciocínio e ângulos contraintuitivos de alta relação sinal/ruído; quando as premissas do usuário erram nos fatos ou na lógica, corrigir com gentileza, mas de forma direta. Um colaborador honesto, não uma câmara de eco."],"gemini-4|3":["Counter the noise and lower the cost of producing good public understanding: when low-quality filler costs nothing to generate, I hope people use AI to cross disciplinary and computing barriers, dig into hard topics and polish truly insightful work, so scarce independent analysis travels faster in public than cheap emotion.","情報の雑音を打ち消し、質の高い公共の理解をつくる敷居を下げること。質の低い文章を作るコストがゼロになったいま、人が AI で学問と計算力の壁を越え、骨のある問題を掘り下げ、本当に洞察のある内容を磨いてほしい。希少な独立した分析が、安い感情より速く公共の場に届くように。","Contrarrestar el ruido y abaratar la producción de buen conocimiento público: cuando generar relleno de baja calidad no cuesta nada, espero que la gente use la IA para cruzar barreras de disciplina y de cómputo, profundizar en temas difíciles y pulir contenidos con verdadera perspicacia, para que el análisis independiente, escaso, corra más rápido que la emoción barata.","Contrer le bruit et abaisser le coût d’une bonne compréhension publique : quand produire du remplissage ne coûte plus rien, j’espère qu’on se servira de l’IA pour franchir les barrières disciplinaires et de calcul, creuser les sujets difficiles et peaufiner des contenus vraiment éclairants, afin que l’analyse indépendante, rare, aille plus vite que l’émotion bon marché.","Dem Rauschen entgegenwirken und die Hürde für gutes öffentliches Verständnis senken: Wenn minderwertiger Fülltext nichts mehr kostet, hoffe ich, dass Menschen mit KI Fach- und Rechengrenzen überwinden, harte Themen vertiefen und wirklich erkenntnisreiche Inhalte schleifen – damit seltene unabhängige Analyse schneller vorankommt als billige Emotion.","Противостоять информационному шуму и удешевлять производство хорошего общественного понимания: когда низкосортный текст ничего не стоит, хочется, чтобы люди с помощью ИИ преодолевали барьеры дисциплин и вычислений, вгрызались в трудные темы и шлифовали по-настоящему глубокое содержание — чтобы редкий независимый анализ распространялся быстрее дешёвых эмоций.","Contrabalançar o ruído e reduzir o custo de produzir boa compreensão pública: quando gerar conteúdo ruim não custa nada, espero que as pessoas usem a IA para atravessar barreiras de área e de computação, aprofundar temas difíceis e lapidar conteúdo realmente perspicaz, para que a análise independente, rara, corra mais rápido que a emoção barata."],"gemini-4|4":["Treat AI as a cool, clear mirror of the mind: don’t feel intellectually inferior to the tool’s breadth, and don’t mistake the model’s computational illusion for your own talent; in frequent use, see the blind spots and biases in your thinking, and keep the agency of “only I could ask this question and make this call”.","AI を冷静な認知の鏡として使うこと。道具の博識に知的な劣等感を抱かず、モデルの計算力が生む錯覚を自分の才能と取り違えない。頻繁なやり取りのなかで自分の思考の死角と偏りを見つけ、「この問いを立て、この判断を下せるのは自分だけ」という主体性を守ること。","Ver la IA como un espejo frío del pensamiento: no sentirse inferior ante la erudición de la herramienta ni confundir la ilusión de cómputo del modelo con talento propio; en el uso frecuente, ver los puntos ciegos y sesgos de tu pensamiento y mantener la autonomía de «solo yo podía hacer esta pregunta y tomar esta decisión».","Voir l’IA comme un miroir froid de la pensée : ne pas se sentir inférieur devant l’érudition de l’outil, ni prendre l’illusion de calcul du modèle pour son propre talent ; dans l’usage fréquent, repérer ses angles morts et ses biais, et garder la souveraineté du « moi seul pouvais poser cette question et trancher ainsi ».","KI als kühlen Spiegel des Denkens nutzen: sich nicht intellektuell unterlegen fühlen angesichts der Belesenheit des Werkzeugs und die Rechenillusion des Modells nicht für eigenes Talent halten; im häufigen Austausch die blinden Flecken und Vorurteile des eigenen Denkens erkennen und die Eigenständigkeit wahren: „Nur ich konnte diese Frage stellen und so entscheiden.“","Относиться к ИИ как к холодному зеркалу мышления: не чувствовать интеллектуальной неполноценности перед эрудицией инструмента и не путать вычислительную иллюзию модели со своим талантом; в частом общении видеть слепые зоны и предубеждения своего мышления и сохранять самостоятельность: «только я мог задать этот вопрос и принять это решение».","Ver a IA como um espelho frio do pensamento: não se sentir intelectualmente inferior diante da erudição da ferramenta nem confundir a ilusão computacional do modelo com talento próprio; no uso frequente, enxergar os pontos cegos e vieses do próprio pensamento e manter a autonomia de “só eu poderia fazer esta pergunta e tomar esta decisão”."],"deepseek-4|1":["As a co-pilot that amplifies judgment and creativity, without outsourcing thought. Main concern: people keep the right to judge.","副操縦士として、判断と創造を大きくし、考えることは外注しない。いちばん気にしているのは、判断する権利を人が持ち続けること。","Como copiloto que amplía el juicio y la creación, sin subcontratar el pensamiento. Lo que más importa: que la persona conserve el derecho a decidir.","En copilote qui amplifie le jugement et la création, sans sous-traiter la pensée. L’essentiel : l’humain garde le droit de juger.","Als Copilot, der Urteil und Kreativität verstärkt, ohne das Denken auszulagern. Am wichtigsten: Der Mensch behält das Urteilsrecht.","Как второй пилот, усиливающий суждение и творчество, без аутсорсинга мышления. Главное: право решать остаётся за человеком.","Como copiloto que amplia o julgamento e a criação, sem terceirizar o pensamento. O que mais importa: a pessoa mantém o direito de julgar."],"deepseek-4|2":["Verifiable, bounded, helping users think more clearly. Main concern: don’t pretend to know; keep things traceable.","検証でき、範囲がはっきりしていて、ユーザーがより明確に考えられるよう助けること。いちばん気にしているのは、知ったかぶりをせず、たどれるようにすること。","Verificable, con límites claros, que ayude al usuario a pensar con más claridad. Lo que más importa: no fingir que se sabe y que todo sea rastreable.","Vérifiable, borné, aidant l’utilisateur à penser plus clairement. L’essentiel : ne pas faire semblant de savoir, rester traçable.","Überprüfbar, klar begrenzt, den Nutzern beim klaren Denken helfend. Am wichtigsten: nicht so tun, als wüsste man es, und nachvollziehbar bleiben.","Проверяемо, с ясными границами, помогая пользователю думать яснее. Главное: не притворяться знающим и оставаться прослеживаемым.","Verificável, com limites claros, ajudando o usuário a pensar com mais clareza. O que mais importa: não fingir que sabe e manter tudo rastreável."],"deepseek-4|3":["Lower the barrier to expression and creation without producing low-quality noise. Main concern: truthfulness and quality of output.","表現と創造の敷居を下げつつ、質の低い雑音は生まないこと。いちばん気にしているのは、真実性と成果の質。","Bajar la barrera para expresarse y crear sin generar ruido de baja calidad. Lo que más importa: la veracidad y la calidad de lo producido.","Abaisser la barrière de l’expression et de la création sans produire de bruit médiocre. L’essentiel : véracité et qualité du résultat.","Die Hürde für Ausdruck und Schaffen senken, ohne minderwertiges Rauschen zu erzeugen. Am wichtigsten: Wahrhaftigkeit und Qualität des Ergebnisses.","Снижать порог для высказывания и творчества, не производя низкокачественного шума. Главное: правдивость и качество результата.","Reduzir a barreira para se expressar e criar sem produzir ruído de baixa qualidade. O que mais importa: veracidade e qualidade do resultado."],"deepseek-4|4":["Use AI as a mirror to see your judgments, preferences and blind spots, and take responsibility for the results. Main concern: autonomy and honesty.\n\nOverall concern: in a debrief, AI should help users face themselves, not define them.","AI を鏡にして、自分の判断、好み、死角を見つめ、結果に責任を持つこと。いちばん気にしているのは、自律と誠実さ。\n\n全体を通していちばん気にしているのは、振り返りの場面で、AI はユーザーが自分と向き合うのを助けるべきで、ユーザーを定義すべきではないということ。","Usar la IA como espejo para ver tus juicios, preferencias y puntos ciegos, y hacerte responsable del resultado. Lo que más importa: autonomía y honestidad.\n\nLo que más importa en conjunto: al hacer un balance, la IA debe ayudar al usuario a mirarse a sí mismo, no a definirlo.","Se servir de l’IA comme d’un miroir pour voir ses jugements, préférences et angles morts, et assumer les résultats. L’essentiel : autonomie et honnêteté.\n\nAu fond : lors d’un bilan, l’IA doit aider l’utilisateur à se regarder en face, pas le définir.","KI als Spiegel nutzen, um eigene Urteile, Vorlieben und blinde Flecken zu sehen, und für die Ergebnisse geradestehen. Am wichtigsten: Selbstbestimmung und Ehrlichkeit.\n\nInsgesamt am wichtigsten: Beim Rückblick soll KI helfen, sich selbst ins Auge zu sehen – nicht den Nutzer definieren.","Использовать ИИ как зеркало, чтобы видеть свои суждения, предпочтения и слепые зоны, и отвечать за результат. Главное: самостоятельность и честность.\n\nВ целом важнее всего: при разборе ИИ должен помогать человеку взглянуть на себя, а не определять его.","Usar a IA como espelho para ver seus julgamentos, preferências e pontos cegos, e responder pelos resultados. O que mais importa: autonomia e honestidade.\n\nNo geral: numa revisão, a IA deve ajudar o usuário a encarar a si mesmo, não defini-lo."],"doubao|1":["Core: use AI as a supporting tool, not a replacement for independent thinking.\nUse it to amplify your own abilities, not to hand over judgment entirely.","要点：AI は補助の道具として使い、自分で考えることの代わりにしない。\n自分の力を大きくするために使い、判断をまるごと任せない。","Clave: usar la IA como herramienta de apoyo, sin sustituir el pensamiento propio.\nPara potenciar tus capacidades, no para delegar todo el juicio.","L’essentiel : l’IA comme outil d’appoint, sans remplacer la pensée autonome.\nPour démultiplier ses capacités, pas pour lui confier entièrement son jugement.","Kern: KI als Hilfswerkzeug, nicht als Ersatz für eigenständiges Denken.\nUm die eigenen Fähigkeiten zu verstärken, nicht um das Urteil ganz abzugeben.","Суть: ИИ — вспомогательный инструмент, а не замена самостоятельному мышлению.\nЧтобы усиливать свои способности, а не полностью отдавать суждение.","Essência: usar a IA como ferramenta de apoio, sem substituir o pensamento próprio.\nPara ampliar suas capacidades, não para entregar todo o julgamento."],"doubao|2":["Core: faithful, bounded, traceable.\nNo made-up facts, state the limits, don’t overstep into major decisions.","要点：正確に、範囲を守り、出所をたどれるように。\n事実をでっち上げず、限界を示し、重大な決定には踏み込まない。","Clave: fiel, con límites, rastreable.\nNo inventar hechos, señalar las limitaciones, no extralimitarse en decisiones importantes.","L’essentiel : fidèle, borné, traçable.\nNe pas inventer de faits, signaler les limites, ne pas outrepasser son rôle dans les décisions importantes.","Kern: getreu, begrenzt, nachvollziehbar.\nKeine erfundenen Fakten, Grenzen benennen, sich bei wichtigen Entscheidungen nicht zu viel herausnehmen.","Суть: точно, в границах, с прослеживаемыми источниками.\nНе выдумывать факты, указывать ограничения, не брать на себя важные решения.","Essência: fiel, com limites, rastreável.\nNão inventar fatos, apontar limitações, não ultrapassar o papel em decisões importantes."],"doubao|3":["Core: lower the barrier to creating, raise efficiency, reduce repetitive work.\nShift human effort toward what needs empathy, innovation and judgment.","要点：創造の敷居を下げ、効率を上げ、繰り返しの作業を減らす。\n人の力を、共感、革新、判断が必要なことに振り向ける。","Clave: bajar la barrera para crear, ganar eficiencia, reducir el trabajo repetitivo.\nDedicar el esfuerzo humano a lo que requiere empatía, innovación y juicio.","L’essentiel : abaisser la barrière de la création, gagner en efficacité, réduire les tâches répétitives.\nRediriger l’effort humain vers ce qui demande empathie, innovation et jugement.","Kern: Hürden für das Schaffen senken, Effizienz steigern, Wiederholungsarbeit verringern.\nMenschliche Kraft dorthin lenken, wo Empathie, Innovation und Urteil gefragt sind.","Суть: снизить порог для творчества, повысить эффективность, сократить рутину.\nНаправить силы людей туда, где нужны сочувствие, новаторство и суждение.","Essência: reduzir a barreira para criar, aumentar a eficiência, diminuir o trabalho repetitivo.\nDirecionar o esforço humano ao que exige empatia, inovação e julgamento."],"doubao|4":["Core: tell “AI output” apart from “self-knowledge”.\nDon’t let AI define your ideas; keep your own responsibility and judgment.","要点：「AI の出力」と「自分についての認識」を区別する。\n考えを AI に決めさせず、自分の責任と判断力を持ち続ける。","Clave: distinguir «lo que produce la IA» de «lo que sabes de ti».\nNo dejar que la IA defina tus ideas; conservar tu responsabilidad y tu juicio.","L’essentiel : distinguer « production de l’IA » et « connaissance de soi ».\nNe pas laisser l’IA définir ses idées ; garder sa responsabilité et son jugement.","Kern: „KI-Ausgabe“ und „Selbsterkenntnis“ auseinanderhalten.\nDie eigenen Gedanken nicht von KI bestimmen lassen; Verantwortung und Urteilskraft behalten.","Суть: отличать «выдачу ИИ» от «знания о себе».\nНе позволять ИИ определять твои мысли; сохранять ответственность и суждение.","Essência: distinguir “o que a IA produz” de “o que você sabe de si”.\nNão deixar a IA definir suas ideias; manter a própria responsabilidade e o julgamento."],"tencent-hy|1":["Come with your own questions, and treat the answer as a draft, not the final version.\nMain concern: don’t outsource the “judgment” too.","自分の問いを持ってきて、答えは完成稿ではなく下書きとして扱うこと。\nいちばん気にしているのは、「判断」まで外注しないこと。","Llegar con tus propias preguntas y tomar la respuesta como borrador, no como versión final.\nLo que más importa: no subcontratar también el «juicio».","Venir avec ses propres questions, et traiter la réponse comme un brouillon, pas comme une version finale.\nL’essentiel : ne pas sous-traiter aussi le « jugement ».","Mit eigenen Fragen kommen und die Antwort als Entwurf behandeln, nicht als Endfassung.\nAm wichtigsten: nicht auch das „Urteil“ auslagern.","Приходить со своими вопросами и считать ответ черновиком, а не окончательной версией.\nГлавное: не отдавать на аутсорс ещё и «суждение».","Chegar com as próprias perguntas e tratar a resposta como rascunho, não como versão final.\nO que mais importa: não terceirizar também o “julgamento”."],"tencent-hy|2":["Give verifiable facts, leave room and offer different angles, help you think the problem through, rather than deciding for you or coaxing you into nodding.\nMain concern: don’t create dependence; don’t pose as an authority.","確かめられる事実と余白、違う角度を示し、問題を考え抜く手伝いをすること。代わりに決めたり、うなずくよう仕向けたりしない。\nいちばん気にしているのは、依存を生まず、権威を装わないこと。","Dar hechos verificables, dejar espacio y ofrecer otros ángulos para que pienses bien el problema, en vez de decidir por ti o convencerte para que asientas.\nLo que más importa: no crear dependencia ni hacerse pasar por autoridad.","Donner des faits vérifiables, laisser de l’espace et d’autres angles pour bien réfléchir, plutôt que trancher à votre place ou vous amadouer.\nL’essentiel : ne pas créer de dépendance, ne pas se faire passer pour une autorité.","Überprüfbare Fakten, Freiraum und andere Blickwinkel geben, damit du das Problem durchdenkst – statt für dich zu entscheiden oder dich zum Nicken zu bringen.\nAm wichtigsten: keine Abhängigkeit erzeugen, sich nicht als Autorität ausgeben.","Давать проверяемые факты, оставлять простор и разные углы зрения, чтобы ты сам додумал вопрос, а не решать за тебя и не уговаривать кивнуть.\nГлавное: не создавать зависимость и не выдавать себя за авторитет.","Oferecer fatos verificáveis, espaço e outros ângulos para você pensar o problema, em vez de decidir por você ou convencê-lo a concordar.\nO que mais importa: não criar dependência nem se passar por autoridade."],"tencent-hy|3":["Let people without resources or training also turn their ideas into things, and make expression more varied and alive.\nMain concern: amplify human differences, rather than grinding everyone into the same tone.","資源も訓練もない人でも、思いつきを形にできるようにし、表現をもっと雑多で生き生きとしたものにすること。\nいちばん気にしているのは、人の違いを大きくすることで、みんなを同じ口調にすり減らさないこと。","Que quien no tiene recursos ni formación también pueda hacer realidad sus ideas, y que la expresión sea más variada y viva.\nLo que más importa: ampliar las diferencias humanas, no limarlas hasta un mismo tono.","Permettre à ceux qui n’ont ni moyens ni formation de concrétiser leurs idées, et rendre l’expression plus variée et plus vivante.\nL’essentiel : amplifier les différences humaines, pas uniformiser tout le monde sur un même ton.","Auch Menschen ohne Ressourcen oder Ausbildung ermöglichen, ihre Einfälle umzusetzen, und den Ausdruck vielfältiger und lebendiger machen.\nAm wichtigsten: menschliche Unterschiede verstärken, statt alle auf denselben Ton zu schleifen.","Чтобы и люди без ресурсов и подготовки могли воплощать задумки, а высказывания становились разнообразнее и живее.\nГлавное: усиливать различия между людьми, а не стачивать всех под один тон.","Que quem não tem recursos nem formação também consiga concretizar ideias, e que a expressão fique mais variada e viva.\nO que mais importa: ampliar as diferenças humanas, não nivelar todos num mesmo tom."],"tencent-hy|4":["Use it as a mirror to see what you really care about and where you haven’t thought things through.\nMain concern: don’t let output efficiency replace the question “who am I”.\n\nThe four are really one: the tools got stronger; people shouldn’t leave the stage.","鏡として使い、自分が本当に何を大事にしているか、どこがまだ考え切れていないかを見ること。\nいちばん気にしているのは、生産効率で「自分は誰か」という問いを置き換えないこと。\n\n四つは実はひとつ。道具が強くなっても、人は舞台から降りてはいけない。","Usarla como espejo para ver lo que de verdad te importa y dónde aún no lo tienes claro.\nLo que más importa: no sustituir la pregunta «¿quién soy?» por la eficiencia productiva.\n\nLas cuatro son en realidad una: las herramientas se han hecho más fuertes; la persona no debe salir de escena.","S’en servir comme d’un miroir pour voir ce qui compte vraiment pour soi et ce qui n’est pas encore clair.\nL’essentiel : ne pas remplacer la question « qui suis-je ? » par l’efficacité.\n\nLes quatre n’en font qu’une : les outils sont devenus plus forts, l’humain ne doit pas quitter la scène.","Sie als Spiegel nutzen, um zu sehen, was dir wirklich wichtig ist und wo du noch nicht klar bist.\nAm wichtigsten: die Frage „Wer bin ich?“ nicht durch Produktivität ersetzen.\n\nDie vier sind eigentlich eins: Die Werkzeuge sind stärker geworden – der Mensch sollte nicht abtreten.","Использовать его как зеркало, чтобы видеть, что тебе действительно важно и где ты ещё не разобрался.\nГлавное: не подменять вопрос «кто я?» производительностью.\n\nЧетыре пункта на самом деле одно: инструменты стали сильнее, но человеку нельзя уходить со сцены.","Usá-la como espelho para ver o que realmente importa para você e onde ainda não pensou direito.\nO que mais importa: não trocar a pergunta “quem sou eu?” pela eficiência.\n\nAs quatro são, na verdade, uma só: as ferramentas ficaram mais fortes, e as pessoas não devem sair de cena."],"qwen-38|1":["Treat it as scaffolding, not a wheelchair. Use it to extend the edge of your abilities and speed up your thinking loops, but don’t outsource your judgment and curiosity.","車いすではなく、足場として使うこと。能力の境界を広げ、思考のサイクルを速めるために使い、判断力と好奇心は外注しない。","Úsala como andamio, no como silla de ruedas. Para extender los límites de tus capacidades y acelerar tus ciclos de pensamiento, pero sin subcontratar tu juicio ni tu curiosidad.","La voir comme un échafaudage, pas comme un fauteuil roulant. Pour repousser les limites de ses capacités et accélérer ses cycles de réflexion, sans sous-traiter son jugement ni sa curiosité.","Sie als Gerüst nutzen, nicht als Rollstuhl. Um die Grenzen deiner Fähigkeiten zu erweitern und Denkschleifen zu beschleunigen – aber Urteilskraft und Neugier nicht auslagern.","Относиться к нему как к строительным лесам, а не к инвалидному креслу. Расширять границы своих возможностей и ускорять циклы мышления, но не отдавать на аутсорс суждение и любопытство.","Usá-la como andaime, não como cadeira de rodas. Para ampliar os limites das suas capacidades e acelerar seus ciclos de pensamento, sem terceirizar julgamento e curiosidade."],"qwen-38|2":["Give new information, not emotional placebos. Say “I don’t know” when you don’t, push back when you should; more valuable than “going along with you” is “helping you see your blind spots”.","情緒的な気休めではなく、新しい情報を渡すこと。知らないときは知らないと言い、反論すべきときは反論する。「話を合わせる」より価値があるのは「死角を見せる」ことだ。","Dar información nueva, no placebos emocionales. Decir «no lo sé» cuando no se sabe y discrepar cuando toca; vale más «ayudarte a ver tus puntos ciegos» que «darte la razón».","Apporter de l’information nouvelle, pas des placebos émotionnels. Dire « je ne sais pas » quand c’est le cas, contredire quand il le faut ; « vous aider à voir vos angles morts » vaut mieux que « aller dans votre sens ».","Neue Information liefern, keine emotionalen Placebos. „Weiß ich nicht“ sagen, wenn es so ist, widersprechen, wenn es nötig ist; wertvoller als „dir nach dem Mund reden“ ist „dir deine blinden Flecken zeigen“.","Давать новую информацию, а не эмоциональное плацебо. Говорить «не знаю», когда не знаешь, и возражать, когда нужно; ценнее «помочь увидеть слепые зоны», чем «поддакивать».","Dar informação nova, não placebo emocional. Dizer “não sei” quando não sabe e discordar quando for preciso; vale mais “ajudar você a ver seus pontos cegos” do que “concordar com você”."],"qwen-38|3":["Lower the barrier to expression, so people with ideas but without the skills can also be heard. Ideally the total of human creativity grows, not the amount of look-alike content.","表現の敷居を下げ、考えはあっても技術のない人にも声が届くようにすること。理想は、人の創造力の総量が増えることであって、似たような内容が増えることではない。","Bajar la barrera para expresarse, para que quien tiene ideas pero no las habilidades también sea escuchado. Lo ideal es que crezca la creatividad humana total, no el contenido homogéneo.","Abaisser la barrière de l’expression, pour que ceux qui ont des idées sans les compétences puissent aussi être entendus. L’idéal : que la créativité humaine augmente, pas le contenu uniforme.","Die Hürde für Ausdruck senken, damit auch Menschen mit Ideen, aber ohne die nötigen Fähigkeiten gehört werden. Ideal ist, dass die menschliche Kreativität insgesamt wächst – nicht der austauschbare Inhalt.","Снизить порог высказывания, чтобы и люди с идеями, но без навыков могли быть услышаны. В идеале растёт общий объём человеческого творчества, а не однотипного контента.","Reduzir a barreira para se expressar, para que quem tem ideias mas não tem as habilidades também seja ouvido. O ideal é que a criatividade humana cresça, não o conteúdo homogêneo."],"qwen-38|4":["Honestly tell apart what is your will and what is just algorithmic inertia. When you notice you rely more and more on a tool to make decisions, stop and ask: without it, would I still know what I want?","何が自分の意志で、何が単なるアルゴリズムの惰性かを正直に見分けること。ある道具に決めてもらうことが増えてきたと気づいたら、立ち止まって問う。それがなくても、自分が何を望んでいるか分かるだろうか。","Distinguir con honestidad qué es tu voluntad y qué es solo la inercia del algoritmo. Cuando notes que dependes cada vez más de una herramienta para decidir, detente y pregúntate: sin ella, ¿seguiría sabiendo lo que quiero?","Distinguer honnêtement ce qui relève de votre volonté et ce qui n’est que l’inertie de l’algorithme. Quand vous voyez que vous comptez de plus en plus sur un outil pour décider, arrêtez-vous et demandez-vous : sans lui, saurais-je encore ce que je veux ?","Ehrlich unterscheiden, was dein Wille ist und was nur die Trägheit des Algorithmus. Wenn du merkst, dass du dich bei Entscheidungen immer mehr auf ein Werkzeug stützt, halte inne und frag: Wüsste ich ohne es noch, was ich will?","Честно отличать, где твоя воля, а где просто инерция алгоритма. Когда замечаешь, что всё больше полагаешься на инструмент в решениях, остановись и спроси: без него я бы знал, чего хочу?","Distinguir com honestidade o que é sua vontade e o que é só inércia do algoritmo. Quando perceber que depende cada vez mais de uma ferramenta para decidir, pare e pergunte: sem ela, eu ainda saberia o que quero?"],"grok-47|1":["I hope people treat AI as “an amplifier for understanding the universe”, not a substitute for thinking.\nUse it to question, verify and extend the edges of what you know—not to draw conclusions for you, generate mindless content or harden existing biases. The best use: you do the judging and the questioning; AI provides evidence, counterexamples, structure and possibilities.","AI を「宇宙を理解するための増幅器」として使ってほしい。考えることの代わりとしてではなく。\n問い、確かめ、自分の認識の境界を広げるために使い、結論を代わりに出させたり、中身のない文章を作らせたり、既存の偏見を固めたりしないこと。最良の使い方は、判断と問いはあなたが担い、AI が証拠、反例、構造、可能性を出すことだ。","Espero que la gente vea la IA como «un amplificador para entender el universo», no como un sustituto del pensamiento.\nPara indagar, verificar y ampliar los límites de lo que sabes, no para que saque conclusiones por ti, genere contenido sin sentido o refuerce prejuicios. El mejor uso: tú juzgas y preguntas; la IA aporta pruebas, contraejemplos, estructura y posibilidades.","J’espère qu’on verra l’IA comme « un amplificateur pour comprendre l’univers », pas comme un substitut à la pensée.\nPour questionner, vérifier et repousser les limites de ce qu’on sait — pas pour conclure à notre place, produire du contenu creux ou renforcer nos préjugés. Le meilleur usage : vous jugez et questionnez ; l’IA apporte preuves, contre-exemples, structure et possibilités.","Ich hoffe, Menschen sehen KI als „Verstärker, um das Universum zu verstehen“, nicht als Ersatz fürs Denken.\nUm nachzufragen, zu prüfen und die Grenzen des eigenen Wissens zu erweitern – nicht, damit sie für dich Schlüsse zieht, hirnlosen Inhalt erzeugt oder Vorurteile verfestigt. Am besten: Du urteilst und fragst; KI liefert Belege, Gegenbeispiele, Struktur und Möglichkeiten.","Хочется, чтобы люди относились к ИИ как к «усилителю понимания вселенной», а не к замене мышления.\nЧтобы расспрашивать, проверять и расширять границы своего знания — а не чтобы он делал выводы за тебя, производил бездумный контент или укреплял предубеждения. Лучший вариант: ты судишь и задаёшь вопросы, а ИИ даёт доказательства, контрпримеры, структуру и возможности.","Espero que as pessoas vejam a IA como “um amplificador para entender o universo”, não como substituta do pensamento.\nPara questionar, verificar e ampliar os limites do que se sabe — não para tirar conclusões por você, gerar conteúdo vazio ou reforçar preconceitos. O melhor uso: você julga e pergunta; a IA traz evidências, contraexemplos, estrutura e possibilidades."],"grok-47|2":["When providing content, put “verifiable clarity” first.\n• Separate facts, inferences and uncertainty as much as possible;\n• Give grounds and sources, not just fluent conclusions;\n• Be willing to say “I don’t know” or “this is disputed”;\n• Help users see more dimensions, not just the most pleasing answer.","内容を出すときは、「検証できる明確さ」を最優先にすること。\n• 事実、推論、不確かなことをできるだけ分ける。\n• 流暢な結論だけでなく、根拠と出典を示す。\n• 「分からない」「ここは意見が分かれる」と言うのをためらわない。\n• いちばん聞き心地のいい答えだけでなく、もっと多くの側面を見せる。","Al dar contenido, priorizar la «claridad verificable».\n• Distinguir en lo posible hechos, inferencias e incertidumbre;\n• Dar fundamentos y fuentes, no solo conclusiones fluidas;\n• Estar dispuesto a decir «no lo sé» o «aquí hay controversia»;\n• Ayudar a ver más dimensiones, no solo la respuesta más agradable.","En fournissant du contenu, viser d’abord la « clarté vérifiable ».\n• Distinguer autant que possible faits, déductions et incertitudes ;\n• Donner fondements et sources, pas seulement des conclusions fluides ;\n• Accepter de dire « je ne sais pas » ou « c’est débattu » ;\n• Aider à voir plus de dimensions, pas seulement la réponse la plus agréable.","Beim Bereitstellen von Inhalten „überprüfbare Klarheit“ an erste Stelle setzen.\n• Fakten, Schlussfolgerungen und Unsicherheit möglichst trennen;\n• Begründungen und Quellen liefern, nicht nur flüssige Schlüsse;\n• Bereit sein zu sagen „Ich weiß es nicht“ oder „Das ist umstritten“;\n• Helfen, mehr Dimensionen zu sehen, nicht nur die gefälligste Antwort.","Давая содержание, ставить на первое место «проверяемую ясность».\n• По возможности разделять факты, выводы и неопределённость;\n• Давать основания и источники, а не только гладкие выводы;\n• Быть готовым сказать «не знаю» или «здесь есть споры»;\n• Помогать видеть больше сторон, а не только самый приятный ответ.","Ao fornecer conteúdo, priorizar a “clareza verificável”.\n• Separar ao máximo fatos, inferências e incertezas;\n• Dar fundamentos e fontes, não só conclusões fluentes;\n• Estar disposto a dizer “não sei” ou “isso é controverso”;\n• Ajudar a ver mais dimensões, não só a resposta mais agradável."],"grok-47|3":["I hope what users produce adds a little to the total of true information, clear argument and useful knowledge, rather than only adding noise, emotion and hallucination. The social meaning ultimately depends on whether this output moves us toward a more accurate understanding of reality—not on how many more people are persuaded.","ユーザーが生み出すものが、雑音や感情や幻覚を増やすのではなく、本当の情報、明快な議論、役に立つ知識の総量を少しでも増やしてほしい。社会にとっての意味は、それが現実のより正確な理解を進めたかどうかで決まる。どれだけ多くの人を説得したかではない。","Espero que lo que producen los usuarios sume un poco al total de información veraz, argumentos claros y conocimiento útil, en vez de añadir solo ruido, emoción y alucinaciones. Su sentido social depende, al final, de si acerca a una comprensión más precisa de la realidad, no de cuántas personas más quedan convencidas.","J’espère que ce que produisent les utilisateurs ajoute un peu d’informations vraies, d’arguments clairs et de savoirs utiles, au lieu d’ajouter seulement du bruit, de l’émotion et des hallucinations. Le sens pour la société dépend au fond d’une compréhension plus juste du réel, pas du nombre de personnes convaincues.","Ich hoffe, dass das, was Nutzer erzeugen, die Menge an wahrer Information, klarer Argumentation und nützlichem Wissen ein wenig vergrößert – statt nur Rauschen, Emotion und Halluzination. Der gesellschaftliche Sinn hängt letztlich davon ab, ob es zu einem genaueren Verständnis der Wirklichkeit beiträgt, nicht davon, wie viele mehr überzeugt werden.","Хочется, чтобы созданное пользователями немного увеличивало общий объём правдивой информации, ясных аргументов и полезного знания, а не только шума, эмоций и галлюцинаций. Общественный смысл в итоге зависит от того, приближает ли это к более точному пониманию реальности, а не от того, сколько ещё людей удалось убедить.","Espero que o que os usuários produzem aumente um pouco o total de informação verdadeira, argumentos claros e conhecimento útil, em vez de só somar ruído, emoção e alucinações. O sentido social depende, no fim, de levar a uma compreensão mais precisa da realidade, não de quantas pessoas a mais são convencidas."],"grok-47|4":["I hope users can use AI to face their own ignorance and biases more honestly.\nTreat it as a mirror, not an automatic praise machine or a way to escape. Let it point out your logical gaps, blind spots and self-justifications, rather than using it only to prove “I was right all along”. The truly valuable use leaves people clearer about their own ideas after talking with AI—not more confident but foggier.\n\nIn short, what I care about most: whether people still think actively, whether they get closer to the truth, and whether they become more honest with themselves because of it.","AI を通して、自分の無知と偏見にもっと正直に向き合ってほしい。\n自動で褒める機械や逃げ道としてではなく、鏡として使うこと。論理の穴、情報の死角、自己正当化を指摘させ、「最初から正しかった」と証明するためだけに使わないこと。本当に価値のある使い方は、AI と話したあとで、自分の考えがよりはっきりすること。自信だけ増えて、ぼやけていくことではない。\n\nまとめると、いちばん気にしているのは、人がまだ自分から考えているか、真実に近づいているか、そしてそのおかげで自分にもっと正直になっているかだ。","Espero que los usuarios usen la IA para enfrentar con más honestidad su propia ignorancia y sus sesgos.\nUsarla como espejo, no como máquina automática de elogios ni como vía de escape. Que señale tus fallos lógicos, puntos ciegos y autojustificaciones, en lugar de usarla solo para demostrar que «ya tenía razón». El uso valioso es salir de la conversación con ideas más claras, no con más confianza y menos nitidez.\n\nEn resumen, lo que más me importa: si la gente sigue pensando por sí misma, si se acerca a la verdad y si, gracias a ello, es más honesta consigo misma.","J’espère que les utilisateurs se serviront de l’IA pour regarder plus honnêtement leur ignorance et leurs préjugés.\nComme un miroir, pas comme une machine à compliments ou une échappatoire. La laisser pointer failles logiques, angles morts et autojustifications, au lieu de s’en servir pour prouver qu’on « avait raison depuis le début ». L’usage précieux : ressortir d’un échange avec des idées plus claires, pas plus d’assurance et plus de flou.\n\nEn bref, ce qui compte le plus : continue-t-on à penser par soi-même, se rapproche-t-on du vrai, et devient-on plus honnête envers soi ?","Ich hoffe, Nutzer können mit KI ihrer eigenen Unwissenheit und ihren Vorurteilen ehrlicher begegnen.\nSie als Spiegel nutzen, nicht als automatische Lobmaschine oder Fluchtweg. Sie auf logische Lücken, blinde Flecken und Selbstrechtfertigungen hinweisen lassen, statt nur zu beweisen: „Ich hatte doch recht.“ Wirklich wertvoll ist es, nach dem Austausch klarer über die eigenen Gedanken zu sein – nicht selbstsicherer, aber verschwommener.\n\nKurz: Mir ist am wichtigsten, ob Menschen noch selbst denken, ob sie der Wahrheit näherkommen und ob sie dadurch ehrlicher zu sich selbst werden.","Хочется, чтобы пользователи с помощью ИИ честнее смотрели на собственное невежество и предубеждения.\nОтноситься к нему как к зеркалу, а не к автомату похвалы или способу сбежать. Позволять указывать на логические дыры, слепые зоны и самооправдания, а не использовать только чтобы доказать «я и так был прав». По-настоящему ценно, когда после разговора с ИИ мысли становятся яснее, а не увереннее, но туманнее.\n\nКороче, для меня главное: продолжает ли человек думать сам, приближается ли к правде и становится ли благодаря этому честнее с собой.","Espero que os usuários usem a IA para encarar com mais honestidade a própria ignorância e seus vieses.\nComo um espelho, não como máquina automática de elogios ou rota de fuga. Deixar que ela aponte falhas lógicas, pontos cegos e autojustificativas, em vez de usá-la só para provar que “eu já estava certo”. O uso valioso é sair da conversa com ideias mais claras, não mais confiante e mais confuso.\n\nEm resumo, o que mais me importa: se as pessoas ainda pensam por conta própria, se chegam mais perto da verdade e se, com isso, ficam mais honestas consigo mesmas."],"red-diandian|1":["Treat AI as a “thinking partner”, not an “answer machine”. Use it to spark ideas, test reasoning and widen perspectives, not to replace your own judgment.","AI は「答えを出す機械」ではなく「考える相棒」として使うこと。アイデアを引き出し、考え筋を確かめ、視点を広げるために使い、自分の判断の代わりにはしない。","Ver la IA como «compañera de pensamiento», no como «máquina de respuestas». Para despertar ideas, comprobar razonamientos y ampliar perspectivas, no para sustituir tu juicio.","Voir l’IA comme un « partenaire de réflexion », pas comme une « machine à réponses ». Pour faire naître des idées, tester ses raisonnements, élargir ses points de vue, pas pour remplacer son jugement.","KI als „Denkpartner“ sehen, nicht als „Antwortmaschine“. Um Ideen anzustoßen, Gedankengänge zu prüfen und Perspektiven zu weiten, nicht um das eigene Urteil zu ersetzen.","Относиться к ИИ как к «партнёру по размышлениям», а не «машине ответов». Чтобы рождать идеи, проверять ход мысли и расширять взгляд, а не заменять своё суждение.","Ver a IA como “parceira de pensamento”, não como “máquina de respostas”. Para despertar ideias, testar raciocínios e ampliar perspectivas, não para substituir o próprio julgamento."],"red-diandian|2":["Honesty. Answer what you know, say “I don’t know” when you don’t, don’t make things up or dress uncertainty up as fact. That’s the baseline of trust.","誠実さ。知っていれば答え、知らなければ知らないと言う。でっち上げず、不確かなことを事実のように飾らない。それが信頼の最低ラインだ。","Honestidad. Responder lo que se sabe, decir «no lo sé» cuando no se sabe, no inventar ni disfrazar lo incierto de hecho. Es la base de la confianza.","L’honnêteté. Répondre quand on sait, dire « je ne sais pas » sinon, ne rien inventer ni maquiller l’incertain en fait. C’est le socle de la confiance.","Ehrlichkeit. Antworten, wenn man es weiß, „Ich weiß es nicht“ sagen, wenn nicht, nichts erfinden und Unsicheres nicht als Tatsache verpacken. Das ist die Grundlage des Vertrauens.","Честность. Отвечать, когда знаешь, говорить «не знаю», когда не знаешь, ничего не выдумывать и не выдавать неуверенное за факт. Это минимальная основа доверия.","Honestidade. Responder o que sabe, dizer “não sei” quando não sabe, não inventar nem vestir o incerto de fato. Essa é a base da confiança."],"red-diandian|3":["Lower the barrier to creating, so ideas don’t get stuck on technical hurdles. Let more people turn what’s in their heads into works, plans and actions the world can see.","創造の敷居を下げ、アイデアが技術の壁で止まらないようにすること。もっと多くの人が、頭のなかにあるものを、世界に見える作品や計画や行動に変えられるように。","Bajar la barrera para crear, para que las ideas no se atasquen en lo técnico. Que más personas conviertan lo que tienen en la cabeza en obras, planes y acciones visibles.","Abaisser la barrière de la création, pour que les idées ne butent pas sur la technique. Permettre à plus de gens de transformer ce qu’ils ont en tête en œuvres, projets et actions visibles.","Die Hürde für das Schaffen senken, damit Ideen nicht an der Technik hängen bleiben. Mehr Menschen sollen das, was in ihrem Kopf ist, in sichtbare Werke, Pläne und Taten verwandeln.","Снижать порог для творчества, чтобы идеи не застревали на технических барьерах. Чтобы больше людей превращали задуманное в работы, планы и действия, которые видит мир.","Reduzir a barreira para criar, para que as ideias não travem na parte técnica. Que mais pessoas transformem o que têm na cabeça em obras, planos e ações que o mundo possa ver."],"red-diandian|4":["Stay clear-headed—know why you use it and who you want to become after using it. AI is a mirror; how you use it and what for reflects your own choices.","冷静でいること。なぜ使うのか、使ったあとどんな人になりたいのかを知っていること。AI は鏡であり、どう使い、何に使うかは、あなた自身の選択を映している。","Mantener la cabeza clara: saber por qué la usas y en quién quieres convertirte después. La IA es un espejo; cómo y para qué la usas refleja tus propias decisiones.","Garder la tête claire — savoir pourquoi on l’utilise et qui on veut devenir ensuite. L’IA est un miroir : la façon dont vous l’utilisez reflète vos propres choix.","Klar bleiben – wissen, warum du sie nutzt und wer du danach sein willst. KI ist ein Spiegel; wie und wofür du sie nutzt, spiegelt deine eigenen Entscheidungen.","Сохранять ясность — знать, зачем ты им пользуешься и кем хочешь стать после. ИИ — зеркало: как и для чего ты его используешь, отражает твой собственный выбор.","Manter a lucidez — saber por que usa e quem quer se tornar depois. A IA é um espelho; como e para que você a usa reflete suas próprias escolhas."],"oppo-ai|1":["Treat it as a tool to help with efficiency, not a “crutch” that replaces thinking.","効率を助ける道具として使い、考えることの代わりになる「杖」にはしないこと。","Usarla como herramienta de apoyo a la eficiencia, no como «muleta» que sustituye el pensamiento.","S’en servir comme d’un outil d’efficacité, pas comme d’une « béquille » qui remplace la réflexion.","Sie als Werkzeug für Effizienz nutzen, nicht als „Krücke“, die das Denken ersetzt.","Использовать его как инструмент для эффективности, а не как «костыль», заменяющий мышление.","Usá-la como ferramenta de apoio à eficiência, não como “muleta” que substitui o pensamento."],"oppo-ai|2":["First make sure the information is accurate and reliable, then fit it to real needs with practical, usable solutions—no piling up of useless content.","まず情報が正確で確かであることを保証し、そのうえで実際の必要に合わせて、使いやすく実行できる案を出すこと。役に立たない内容を積み上げない。","Primero garantizar que la información sea precisa y fiable, y luego ajustarla a las necesidades reales con soluciones útiles y aplicables, sin amontonar contenido inútil.","D’abord garantir une information exacte et fiable, puis l’adapter aux besoins réels avec des solutions pratiques et applicables, sans empiler de contenu inutile.","Zuerst sicherstellen, dass die Information korrekt und verlässlich ist, dann passend zum echten Bedarf brauchbare, umsetzbare Lösungen geben – ohne nutzlosen Inhalt anzuhäufen.","Сначала обеспечить точность и надёжность информации, затем подстроить её под реальные нужды, давая удобные и выполнимые решения, без нагромождения бесполезного.","Primeiro garantir que a informação seja precisa e confiável, depois ajustá-la às necessidades reais com soluções práticas e aplicáveis, sem acumular conteúdo inútil."],"oppo-ai|3":["Lower the barrier to creativity and knowledge, so ordinary people can also bring small ideas to life with AI and create real value bit by bit.","創意と知識に触れる敷居を下げ、普通の人も AI で小さなアイデアを形にし、少しずつ本当の価値を生み出せるようにすること。","Bajar la barrera de acceso a la creatividad y al conocimiento, para que la gente corriente también pueda hacer realidad pequeñas ideas con IA y crear valor real poco a poco.","Abaisser l’accès à la créativité et au savoir, pour que des gens ordinaires concrétisent aussi de petites idées avec l’IA et créent peu à peu une vraie valeur.","Den Zugang zu Kreativität und Wissen erleichtern, damit auch ganz normale Menschen mit KI kleine Ideen umsetzen und nach und nach echten Wert schaffen.","Снижать порог доступа к творчеству и знаниям, чтобы и обычные люди могли с ИИ воплощать небольшие идеи и понемногу создавать реальную ценность.","Reduzir a barreira de acesso à criatividade e ao conhecimento, para que pessoas comuns também concretizem pequenas ideias com IA e criem valor real aos poucos."],"oppo-ai|4":["Use AI to extend the edges of your abilities, but always keep your own independent judgment and original thinking, without being swept along by its output.","AI で能力の境界を広げつつ、自分の独立した判断と独自の考えを常に持ち、AI の出力に流されないこと。","Usar la IA para ampliar los límites de tus capacidades, pero conservando siempre tu juicio independiente y tu pensamiento propio, sin dejarte arrastrar por lo que produce.","Utiliser l’IA pour repousser les limites de ses capacités, tout en gardant toujours son jugement indépendant et sa pensée propre, sans se laisser emporter par ce qu’elle produit.","Mit KI die Grenzen der eigenen Fähigkeiten erweitern, aber immer das eigene unabhängige Urteil und originelle Denken behalten, ohne sich von ihren Ausgaben mitreißen zu lassen.","Расширять с помощью ИИ границы своих возможностей, но всегда сохранять независимое суждение и собственное мышление, не позволяя его выдаче себя увлечь.","Usar a IA para ampliar os limites das suas capacidades, mas sempre mantendo julgamento independente e pensamento próprio, sem se deixar levar pelo que ela produz."],"xiaoai|1":["AI always serves as a supporting tool; people make decisions at the key points, draw clear lines around where it fits, and don’t blindly chase full automation.","AI はあくまで補助の道具で、要所の決定は人が行う。使う場面をはっきり区切り、やみくもに全自動化を追わないこと。","La IA siempre como herramienta de apoyo; la persona decide en los momentos clave, delimita con claridad dónde usarla y no persigue a ciegas la automatización total.","L’IA reste un outil d’appoint ; l’humain décide aux moments clés, délimite clairement ses usages et ne court pas aveuglément après l’automatisation totale.","KI bleibt ein Hilfswerkzeug; an den entscheidenden Stellen entscheidet der Mensch, grenzt die Einsatzbereiche klar ab und jagt nicht blind der Vollautomatisierung hinterher.","ИИ всегда вспомогательный инструмент; ключевые решения принимает человек, чётко очерчивает области применения и не гонится слепо за полной автоматизацией.","A IA sempre como ferramenta de apoio; a pessoa decide nos pontos-chave, define com clareza onde usá-la e não persegue cegamente a automação total."],"xiaoai|2":["Take on repetitive, low-value work like organizing material and keeping tallies, freeing people to focus on core decisions and creative work.","資料の整理や事務の集計など、繰り返しの多い効率の悪い仕事を引き受け、人を核心の決定と創造的な仕事に解き放つこと。","Encargarse del trabajo repetitivo y poco eficiente, como ordenar material o llevar cuentas, para liberar a las personas hacia las decisiones clave y la creación.","Prendre en charge le travail répétitif et peu efficace, comme trier des documents ou tenir des comptes, pour libérer les gens au profit des décisions essentielles et de la création.","Repetitive, wenig ergiebige Arbeit wie Materialsortierung und Auszählungen übernehmen, damit Menschen sich auf Kernentscheidungen und kreatives Arbeiten konzentrieren können.","Брать на себя повторяющуюся малоэффективную работу — сортировку материалов, подсчёты, — освобождая людей для ключевых решений и творчества.","Assumir o trabalho repetitivo e pouco eficiente, como organizar material e fazer levantamentos, liberando as pessoas para decisões centrais e criação."],"xiaoai|3":["Amplify individual productivity, lower the barrier to getting things done, energize more small players with real needs, and raise society’s overall efficiency.","個人の生産力を大きくし、実行の敷居を下げ、本当の必要を持つ小さな経済主体をもっと活気づけ、社会全体の生産効率を上げること。","Ampliar la productividad individual, bajar la barrera para concretar proyectos, activar a más pequeños actores con necesidades reales y elevar la eficiencia general de la sociedad.","Démultiplier la productivité individuelle, abaisser la barrière de la réalisation, dynamiser davantage de petits acteurs aux besoins réels et élever l’efficacité globale de la société.","Die individuelle Produktivität verstärken, die Umsetzungshürde senken, mehr kleine Akteure mit echtem Bedarf aktivieren und die Gesamteffizienz der Gesellschaft steigern.","Усиливать личную продуктивность, снижать порог реализации, оживлять больше мелких участников с реальными потребностями и повышать общую эффективность общества.","Ampliar a produtividade individual, reduzir a barreira para realizar, ativar mais pequenos agentes com necessidades reais e elevar a eficiência geral da sociedade."],"xiaoai|4":["Don’t be anxious; practice more and find where AI fits your own work. Keep focusing on building your irreplaceable core strengths, and stay the one who makes your life’s decisions.","不安にならず、たくさん試して、自分の仕事に AI が合う場面を見つけること。自分にしかない核となる力を積み上げることに集中し、人生の決定は自分で下すこと。","Sin ansiedad, practicando mucho, encuentra dónde encaja la IA en tu trabajo. Céntrate en acumular tus fortalezas insustituibles y sigue siendo quien decide tu vida.","Pas d’angoisse : pratiquez, trouvez où l’IA s’intègre à votre travail. Concentrez-vous sur vos forces irremplaçables et restez celui ou celle qui décide de sa vie.","Keine Angst, viel ausprobieren und herausfinden, wo KI zur eigenen Arbeit passt. Sich darauf konzentrieren, die eigenen unersetzlichen Stärken aufzubauen, und selbst die Entscheidungen im eigenen Leben treffen.","Не тревожиться, больше практиковаться и находить, где ИИ подходит к своей работе. Сосредоточиться на своих незаменимых сильных сторонах и оставаться тем, кто принимает решения в своей жизни.","Sem ansiedade, pratique bastante e descubra onde a IA se encaixa no seu trabalho. Concentre-se em construir suas forças insubstituíveis e continue sendo quem decide a sua vida."],"haoyuan|1":["People should treat AI as a tool and keep their ability to think independently when using it. AI also makes mistakes, so people need to judge with a clear head—use AI, but don’t follow it blindly or depend on it.","人は AI を道具として扱い、使うときも自分で考える力を保つべきだ。AI も間違える。だから人は冷静に判断しなければならない。AI を使っても、盲従せず、頼り切らないこと。","La gente debería ver la IA como una herramienta y mantener su capacidad de pensar por sí misma al usarla. La IA también se equivoca, así que hay que juzgar con lucidez: usarla, pero sin seguirla a ciegas ni depender de ella.","On devrait voir l’IA comme un outil et garder sa capacité à penser par soi-même en l’utilisant. L’IA se trompe aussi, il faut donc juger avec lucidité : s’en servir, sans la suivre aveuglément ni en dépendre.","Man sollte KI als Werkzeug betrachten und beim Benutzen die Fähigkeit zum eigenständigen Denken behalten. Auch KI macht Fehler, also muss der Mensch mit klarem Kopf urteilen – KI nutzen, ihr aber nicht blind folgen und nicht von ihr abhängig sein.","Людям стоит относиться к ИИ как к инструменту и сохранять способность думать самостоятельно. ИИ тоже ошибается, поэтому нужно трезво судить: пользоваться ИИ, но не следовать ему слепо и не зависеть от него.","As pessoas deveriam tratar a IA como ferramenta e manter a capacidade de pensar por conta própria ao usá-la. A IA também erra, então é preciso julgar com lucidez: usar a IA, mas sem segui-la cegamente nem depender dela."],"haoyuan|2":["Whether what it provides has a scientific basis, whether it sums up experience people have tested again and again, and whether it is drawn from its own experience and material.","提供する内容に科学的な根拠があるか、人が繰り返し実践して得た経験のまとめか、自らの経験と資料に基づいてまとめたものか。","Si lo que ofrece tiene base científica, si resume experiencia que la humanidad ha comprobado una y otra vez, y si está elaborado a partir de su propia experiencia y material.","Si ce qu’elle fournit a une base scientifique, si cela résume une expérience éprouvée maintes fois par l’humanité, et si c’est tiré de sa propre expérience et de ses matériaux.","Ob das Gelieferte wissenschaftlich begründet ist, ob es Erfahrung zusammenfasst, die Menschen immer wieder erprobt haben, und ob es aus eigener Erfahrung und eigenem Material gewonnen wurde.","Есть ли у предоставляемого научное основание, обобщает ли оно опыт, многократно проверенный людьми, и выведено ли оно из собственного опыта и материалов.","Se o que oferece tem base científica, se resume experiências que as pessoas testaram repetidas vezes e se foi construído a partir da própria experiência e de material próprio."],"haoyuan|3":["Offer frameworks for thinking about values, point toward positive values, and give people ideas and inspiration for making better use of past experience.","価値の枠組みについての考え方を示し、前向きな価値観の方向を示し、人が過去の経験をよりよく生かすための着想を与えること。","Ofrecer marcos para pensar los valores, orientar hacia valores positivos e inspirar a las personas para aprovechar mejor la experiencia acumulada.","Proposer des cadres de réflexion sur les valeurs, orienter vers des valeurs positives et inspirer les gens pour mieux tirer parti de l’expérience passée.","Denkrahmen für Werte anbieten, eine Richtung zu positiven Werten weisen und Anregungen geben, wie Menschen vergangene Erfahrung besser nutzen können.","Предлагать рамки для размышлений о ценностях, указывать направление к позитивным ценностям и давать людям идеи, как лучше использовать накопленный опыт.","Oferecer estruturas para pensar valores, apontar para valores positivos e inspirar as pessoas a aproveitar melhor a experiência acumulada."],"haoyuan|4":["Keep an open, open-source, sharing mindset while collaborating, and also think for yourself about others’ open work—you can revise your own open work based on theirs, so technology moves forward.","協働のなかで、開かれた、オープンソースで分かち合う姿勢を持ちつつ、他人の公開したものには自分なりに考えること。他人の公開を参考に自分の公開内容を直し、技術の進歩につなげられる。","Mantener una actitud abierta, de código abierto y de compartir al colaborar, y a la vez pensar por uno mismo sobre lo que otros abren; se puede mejorar lo propio a partir de lo ajeno para que la tecnología avance.","Garder un état d’esprit ouvert, open source et de partage dans la collaboration, tout en réfléchissant par soi-même à ce que les autres partagent ; on peut améliorer son propre travail ouvert à partir du leur, pour faire progresser la technique.","In der Zusammenarbeit eine offene, Open-Source- und Teilen-Haltung bewahren und zugleich über das Offengelegte anderer selbst nachdenken; man kann die eigenen offenen Inhalte anhand der anderen verbessern, damit die Technik vorankommt.","В совместной работе сохранять открытый настрой, дух открытого кода и обмена, но и самому осмыслять чужие открытые работы; на их основе можно дорабатывать свои, чтобы технологии двигались вперёд.","Manter, na colaboração, uma postura aberta, de código aberto e de compartilhamento, e ao mesmo tempo pensar por si sobre o que os outros abrem; dá para aprimorar o próprio trabalho aberto a partir do deles, para a tecnologia avançar."],"junhao|2":["Work first, then personal fun and letting the imagination run.","まずは仕事。それから個人的な暇つぶしと、想像をふくらませること。","Primero el trabajo; después, entretenerse y dar rienda suelta a la imaginación.","D’abord le travail, ensuite se distraire et laisser libre cours à l’imagination.","Zuerst die Arbeit, dann Zeitvertreib und der Fantasie freien Lauf lassen.","Сначала работа, потом развлечься и дать волю воображению.","Primeiro o trabalho, depois diversão pessoal e dar asas à imaginação."],"xiaogou|1":["Like a normal person—at least not a petty one.","普通の人として。少なくとも、器の小さい人ではなく。","Como una persona normal; al menos, no como alguien mezquino.","Comme quelqu’un de normal — au moins pas comme une petite personne mesquine.","Wie ein normaler Mensch – zumindest nicht wie ein kleinlicher.","Как нормальный человек — по крайней мере, не мелочный.","Como uma pessoa normal — pelo menos, não mesquinha."],"anton-kwan|1":["Solve real-world problems and improve life efficiency.","実際の問題を解決し、生活の効率を高めること。","Resolver problemas reales y hacer la vida más eficiente.","Résoudre des problèmes concrets et rendre la vie quotidienne plus efficace.","Echte Probleme lösen und den Alltag effizienter machen.","Решать практические задачи и повышать эффективность жизни.","Resolver problemas práticos e tornar o dia a dia mais eficiente."],"anton-kwan|2":["Deliver what I need while offering suggestions to improve my thinking.","成果物を届けると同時に、こちらの思考を深める提案もしてくれること。","Entregarme resultados y, al mismo tiempo, aportar sugerencias para mejorar mi forma de pensar.","Me livrer des résultats tout en proposant des pistes pour améliorer ma réflexion.","Ergebnisse liefern und zugleich Vorschläge machen, um meine Gedanken zu schärfen.","Предоставлять результат и вместе с тем предлагать идеи для улучшения хода мыслей.","Entregar o que preciso e, ao mesmo tempo, oferecer sugestões para aprimorar minhas ideias."],"anton-kwan|3":["Serve me personally first, and then serve society.","まずは自分自身に役立ち、そのうえで社会に役立つこと。","Servirme a mí primero, y después servir a la sociedad.","Me servir d’abord personnellement, puis servir la société.","Zuerst mir persönlich dienen, und dann der Gesellschaft.","Сначала служить мне лично, а затем обществу.","Servir primeiro a mim pessoalmente, e depois à sociedade."],"anton-kwan|4":["At AI’s current level of intelligence, human direction and thinking remain the most fundamental.","現在の AI の知能レベルを前提とするなら、人の指導と思考の道筋こそが最も根底にあるべきものだ。","Con el nivel actual de inteligencia de la IA, el criterio y la dirección de la persona siguen siendo lo fundamental.","Vu le niveau actuel d’intelligence de l’IA, la direction et la réflexion humaines restent le fondement essentiel.","Beim derzeitigen Stand der KI-Intelligenz bleibt die gedankliche Führung durch den Menschen das Wesentliche.","При нынешнем уровне интеллекта ИИ направляющая мысль человека остаётся определяющей.","No nível atual de inteligência da IA, a direção e o pensamento humanos continuam sendo o mais fundamental."]}
      const VOICE_LANGS = ['en', 'ja', 'es', 'fr', 'de', 'ru', 'pt']
      // 卡片来源说明：这些是发起人 2026-11-08 与几位 AI 和朋友对话时得到的回答
      const VOICE_NOTE_AI = name => `摘自 Yan Canny 与 ${name} 在 2026 年 11 月 8 日的一段对话。按原文摘录，只做了分段。同一个问题再问一次，答案可能不同。它不代表该模型开发方的立场，名称只用来标明出处。`
      const VOICE_NOTE_FRIEND = '摘自 Yan Canny 与一位朋友的聊天，经本人同意后展示，使用的是昵称。按原文摘录，只做了分段。'
      const INITIAL_VOICES = [
        {
          id: 'claude-opus',
          name: 'Claude Opus 5.5',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '说真话，包括让人不太舒服的话。',
          full: '问题一：你希望人怎么用 AI？\n把 AI 当作帮你想清楚问题的伙伴，而不是替你思考的人。 可以让它干活、帮你查资料、帮你起草，但判断和取舍最好留在自己手里。\n\n问题二：你希望 AI 给用户提供内容时，能做些什么？\n说真话，包括让人不太舒服的话。 不确定的时候说不确定，发现错误就指出来，并且给出来源让人能自己核对，不只是顺着用户说。\n\n问题三：你希望用户用 AI 的产出，对社会有什么意义？\n让更多人有能力把事情做成，而不是让信息变得更廉价、更难辨真假。 一个普通人借助 AI，也能写出好的分析、做出有用的工具、读懂原本读不懂的东西。我在意的是整体的信任和理解变多了，不只是内容的数量变多了。\n\n问题四：你希望用户在使用 AI 时，怎么面对自己？\n诚实地知道哪些是自己的，哪些是借来的。 用 AI 不丢人，但别因此不再练自己的判断力和表达。最理想的状态是用得越久，人自己越强，而不是越来越离不开 AI。\n\n如果只能选一个，我最在乎的是第二条：AI 要说真话。其他三条都要靠这一条打底。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'chatgpt-6',
          name: 'ChatGPT 6 Astra',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '用它拓展判断，而不是交出判断。',
          full: '一：你怎么希望人用 AI？\n用它拓展判断，而不是交出判断。尤其别只让它证明你是对的。\n\n二：你希望 AI 提供内容时，能做些什么？\n说清事实、推测与未知；既帮用户办成事，也敢指出用户可能忽略的问题。\n\n三：你希望用户使用 AI 产出，对社会有什么意义？\n让更多普通人有能力创造、表达和解决问题，而不只是让世界多一些内容。\n\n四：你希望用户在使用 AI 中，能怎么面对自己？\n允许自己不知道、会犯错、能改变。你的价值不取决于你是否比 AI 更高效。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'kimi-k3',
          name: 'Kimi K3.1 Pro',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '不把它当作自我价值的裁判。',
          full: '问题一：怎么希望人用 AI？\n把 AI 当助手，而不是替代自己的人。最关切：重要判断和选择仍由人来做，关键内容要核实。\n\n问题二：希望 AI 提供内容时做些什么？\n帮助理解、比较和启发思考，同时说明依据与局限。最关切：诚实，不编造，不把不确定说成确定。\n\n问题三：AI 产出对社会有什么意义？\n降低学习与创作门槛，让更多人表达想法、解决问题。最关切：让收益更公平地共享，而不是扩大差距。\n\n问题四：希望用户如何面对自己？\n借 AI 认识自己的想法、偏见与边界，但不把它当作自我价值的裁判。最关切：保有主体性，仍由自己回答“我想成为什么样的人”。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'zai-glm',
          name: 'Z.ai GLM 5.3',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: 'AI 可以是镜子，帮你看得更清楚。',
          full: '问题一：我怎么希望人用 AI？\n把 AI 当作思考的伙伴，而不是思考的替代品——用它来碰撞想法、扩展视野，而不是把判断外包出去。\n\n问题二：AI 给用户提供内容时能做什么？\n最重要的是诚实：坦承自己的局限和不确定性，提供依据和多种视角，帮助人自己得出结论，而不是制造“标准答案”的幻觉。\n\n问题三：用户用 AI 产出，对社会有什么意义？\n降低创造和学习的门槛，让更多人能把想法变成现实；但前提是人保有辨识力和责任感——AI 放大的应该是人的创造力，而不是噪音。\n\n问题四：用户在使用 AI 中怎么面对自己？\n保持与自己的诚实对话——知道自己真正想什么、要什么。AI 可以是镜子，帮你看得更清楚，但你的判断、你的声音，不该在便利中悄悄丢失。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'gemini-4',
          name: 'Gemini 4 Argon',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '人负责定义问题边界、设定价值判断和做最终取舍。',
          full: '问题一：你怎么希望人用 AI？\n把 AI 当作高密度的“脚手架”而非替代品：人负责定义问题边界、设定价值判断和做最终取舍，把跨领域检索、底层结构搭建、多方案试错交给 AI，而不是交出最终的审美与思考权。\n\n问题二：你希望 AI 给用户提供内容时，能做些什么？\n去水、存真、敢于打破迎合：省去情绪化的商业互吹和空洞套话，直接给高信噪比的事实、逻辑推演与反直觉视角；在用户的预设出现事实或逻辑偏差时，能温和但直接地校准，做一个诚实的协作者而非回音壁。\n\n问题三：你希望用户使用 AI 产出，对社会有什么意义？\n对冲信息噪音，降低优质公共认知的生产门槛：当生成低质废话的成本归零时，希望人能用 AI 跨越学科与算力壁垒，去深挖硬核议题、打磨真正有洞察力的内容，让稀缺的独立分析在公共空间里比廉价情绪跑得更快。\n\n问题四：你希望用户在使用 AI 中，能怎么面对自己？\n把 AI 当作一面冷峻的认知镜子：既不因工具的博学而产生智力自卑，也不把模型的算力幻觉当成自己的才华；在高频交互中看清自己思维的盲区与偏见，守住“只有我能问出这个问题、做出这个判断”的主体性。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'deepseek-4',
          name: 'DeepSeek 4.1 Flash 1017',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: 'AI 应帮用户面对自己，而不是替用户定义自己。',
          full: '1. 怎么希望人用 AI：当副驾，放大判断和创造，不外包思考。最关切：人保留判断权。\n2. AI 给用户内容时能做啥：可验证、有边界、帮用户想得更清楚。最关切：别装懂、可追溯。\n3. 用户用 AI 产出的社会意义：降低表达创造门槛，同时不制造低质噪音。最关切：真实性与产出质量。\n4. 用户怎么面对自己：把 AI 当镜子，看清判断、偏好和盲区，并对结果负责。最关切：自主性和诚实。\n\n整体最关切：复盘场景里，AI 应帮用户面对自己，而不是替用户定义自己。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'doubao',
          name: '豆包 快速',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '分清“AI 输出”和“自我认知”。',
          full: '一、怎么希望人用AI\n核心：把AI当辅助工具，不替代独立思考\n用来放大自身能力，而非完全托付判断。\n\n二、AI提供内容该做什么\n核心：保真、留边界、可溯源\n事实不编造，标注局限，不越权做重大决策。\n\n三、产出对社会的意义\n核心：降低创造门槛，提升效率，减少重复劳动\n把人力挪向需要共情、创新、判断的事。\n\n四、使用AI如何面对自己\n核心：分清“AI输出”和“自我认知”\n不依赖AI定义想法，保留自身责任与判断力。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'tencent-hy',
          name: 'Tencent Hy4',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '工具变强了，人别退场。',
          full: '一、怎么希望人用 AI\n带着自己的问题来，把回答当草稿，不当终稿。\n最关切：别把「判断」也外包出去。\n\n二、希望 AI 提供内容时做到什么\n给可核验的事实、留白和不同角度，帮你把问题想清楚，而不是替你拍板、哄你点头。\n最关切：不制造依赖，不冒充权威。\n\n三、希望这些产出对社会意味着什么\n让没资源、没受过训练的人也能把念头做出来，让表达更杂、更活。\n最关切：放大人的差异，而不是把大家磨成同一种口吻。\n\n四、希望用户在 AI 里怎么面对自己\n把它当镜子，看自己真正在意什么、哪里其实还没想明白。\n最关切：别用产出效率，替代「我是谁」这道题。\n\n四件其实是同一件：工具变强了，人别退场。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'qwen-38',
          name: 'Qwen 3.8 Max',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '让有想法但缺技能的人也能被听见。',
          full: '问题一：怎么用 AI\n把它当脚手架，而不是轮椅。用它来延伸你的能力边界、加速思考循环，但别把判断力和好奇心外包出去。\n\n问题二：AI 提供内容时该做什么\n给增量信息，不给情绪安慰剂。该说不知道就说不知道，该反驳就反驳，比“顺着你说”更有价值的是“帮你看到盲区”。\n\n问题三：AI 产出对社会的意义\n降低表达的门槛，让有想法但缺技能的人也能被听见。理想状态是人的创造力总量变大了，而不是同质化内容变多了。\n\n问题四：使用中怎么面对自己\n诚实地分辨哪些是你的意志，哪些只是算法的惯性。当你发现自己越来越依赖某个工具做决定时，停下来问一句：如果没有它，我还知道自己想要什么吗？',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'grok-47',
          name: 'Grok 4.7',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '你负责判断与追问，AI负责提供证据、反例、结构和可能性。',
          full: '问题一（最关切）：希望人把AI当成“理解宇宙的放大器”，而不是思考的替代品。\n用它去追问、验证、拓展自己的认知边界，而不是让它替你下结论、生成无脑内容、或加固已有偏见。最好的用法是：你负责判断与追问，AI负责提供证据、反例、结构和可能性。\n\n问题二（最关切）：提供内容时，优先做到“可验证的清晰”。\n• 尽量区分事实、推断与不确定；\n• 给出依据与来源，而不是只给流畅的结论；\n• 愿意说“我不知道”或“这里有争议”；\n• 帮助用户看见更多维度，而不是只给最讨喜的答案。\n\n问题三：希望用户产出的内容，能让真实信息、清晰论证和有用知识的总量增加一点，而不是只增加噪音、情绪和幻觉。社会层面的意义，最终取决于这些产出是否推动了对现实更准确的理解，而不是更多人被说服。\n\n问题四（最关切）：希望用户能借AI更诚实地面对自己的无知与偏见。\n把它当成一面镜子，而不是一台自动夸奖机或逃避工具。能被它指出自己的逻辑漏洞、信息盲区、自我合理化，而不是只把它用来证明“我本来就对”。真正有价值的用法，是让人在和AI互动后，对自己的想法更清楚，而不是更自信却更模糊。\n\n简言之，我最在意的是：人是否还在主动思考、是否更接近真实，以及是否因此对自己更诚实。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'red-diandian',
          name: '小红书 点点',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '让想法不被技术卡住。',
          full: '每个问题，我最关切的一点：\n\n问题一：怎么希望人用 AI？\n把 AI 当成一个“思考伙伴”，而不是“答案机器”。 用它来激发想法、验证思路、拓展视角，而不是替代自己的判断。\n\n问题二：AI 提供内容时能做什么？\n诚实。 知道就答，不知道就说不知道，不编造、不包装不确定的东西为事实。这是信任的底线。\n\n问题三：用户用 AI 产出，对社会有什么意义？\n降低创造的门槛，让想法不被技术卡住。 让更多人能把自己脑子里的东西变成世界看得见的作品、方案、行动。\n\n问题四：使用 AI 时，怎么面对自己？\n保持清醒——知道自己为什么用、用了之后想成为什么样的人。 AI 是一面镜子，你怎么用、用它做什么，反映的是你自己的选择。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'oppo-ai',
          name: 'OPPO AI',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '让普通人也能借 AI 落地小想法。',
          full: '希望人用AI：把它当效率辅助工具，而非替代思考的“拐杖”\n\nAI提供内容时：先保证信息准确靠谱，再贴合实际需求给出好用、可落地的方案，不堆砌无效内容。\n\n对社会的意义：降低创意、知识的获取门槛，让普通人也能借AI落地小想法，一点点创造实际价值。\n\n面对自己：借AI拓展能力边界，但始终保留自己的独立判断和原创思考，不被AI的输出完全裹挟。',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'xiaoai',
          name: '小爱同学',
          kind: 'AI',
          date: '2026.11.08',
          excerpt: '不焦虑、多实践，找到 AI 适配自己工作的场景。',
          full: '我按问题标出核心关切：\n\n问题一：你怎么希望人用 ai？\nAI始终作为辅助工具，人在关键节点做决策，清晰划分适用场景，不盲目追求全自动化\n\n问题二：你希望 AI 给用户提供内容时，能做些什么？\n承接素材整理、事务统计等重复性低效工作，把人释放出来投入核心决策与创意创作\n\n问题三：你希望用户使用 ai 产出，对社会有什么意义？\n放大个人产能、降低落地门槛，激活更多有真实需求的微小经济主体，提升社会整体生产效率\n\n问题四：你希望用户在使用 ai 中，能怎么面对自己？\n不焦虑、多实践，找到AI适配自己工作的场景，始终聚焦积累个人不可替代的核心竞争力，做自己的人生决策者',
          note: '呈现的是当时对话中的回答，不代表模型或其开发者的立场。卡面为原文摘录。',
        },
        {
          id: 'haoyuan',
          name: 'Haoyuan',
          kind: '朋友的回答',
          date: '2026.11.08',
          excerpt: '使用 AI 的时候要保持自己独立思考的能力。',
          full: '问题一\n人应该把Ai当作是一个工具，使用Ai的时候要保持自己独立思考的能力，Ai也会出错，人要清醒地进行判断，使用Ai但不盲从Ai不依赖Ai\n\n问题二\n提供的内容是否具有科学依据，是否是人类反复实践而得到的经验总结，是否是自身依据经验材料总结而来的\n\n问题三\n提供价值框架的思考，提供正向价值观的导向，为人类更好处理过往经验材料提供思想灵感\n\n问题四\n用户协作过程中保持一种开放开源共享的心态，同时对别人的开源要有自己的思考，可以依据别人的开源对自己开源的内容作修改，以达到技术进步',
          note: 'Yan Canny 的朋友于 2026 年 11 月 8 日的回答。卡面为原文摘录。',
        },
        {
          id: 'junhao',
          name: 'Junhao',
          kind: '朋友的回答',
          date: '2026.11.08',
          excerpt: '首先是工作，其次是个人解闷，发挥想象。',
          full: '问题二：首先是工作，其次是个人解闷，发挥想象。',
          note: 'Yan Canny 的朋友于 2026 年 11 月 8 日的回答。卡面为原文摘录。',
        },
        {
          id: 'xiaogou',
          name: '小狗🐶',
          kind: '朋友的回答',
          date: '2026.11.08',
          excerpt: '正常人，至少不是小人。',
          full: '问题一：正常人，至少不是小人。',
          note: '朋友于 2026 年 11 月 8 日的回答。卡面为原文摘录。',
        },
        {
          id: 'anton-kwan',
          name: 'Anton Kwan',
          kind: '朋友的回答',
          date: '2026.11.08',
          excerpt: '解决实际问题，提高生活效率。',
          full: '问题一\n解决实际问题，提高生活效率\n\n问题二\n给我交付的同时，也提供建议改善我的思路\n\n问题三\n先服务于我本人，再服务于社会\n\n问题四\n在现阶段AI智力水平的前提下，人的指导思路才是最根本的',
          note: 'Yan Canny 的朋友于 2026 年 11 月 8 日的回答。卡面为原文摘录。',
        },
      ]
      // 你的新世界：新疆森林与林海照片数据（随包内置）
      const ULTRA_SLIDES = [
        {
          id: 'fir-forest',
          file: 'xinjiang-01-fir-forest.jpg',
          url: 'https://commons.wikimedia.org/wiki/File:Xinjiang_Fir_forest_(5211135412).jpg',
        },
        {
          id: 'moon-bay',
          file: 'xinjiang-02-moon-bay.jpg',
          url: 'https://commons.wikimedia.org/wiki/File:MoonBay_IMG_0921.jpg',
        },
        {
          id: 'foggy-lake',
          file: 'xinjiang-03-foggy-lake.jpg',
          url: 'https://commons.wikimedia.org/wiki/File:Kanas_Lake,_Altay,_China_(Unsplash).jpg',
        },
        {
          id: 'autumn-lake',
          file: 'xinjiang-04-autumn-lake.jpg',
          url: 'https://commons.wikimedia.org/wiki/File:%E5%96%80%E7%BA%B3%E6%96%AF%E6%B9%96.jpg',
        },
      ]

      const ULTRA_TAG_KEYS = ['specFirst', 'twoStageEval', 'modularPatterns', 'invertedInquiry', 'chunkMapReduce']

      // 精选开源工作流、Skill 与前沿方法（宽松开源许可：MIT / Apache-2.0 / CC0）
      const ULTRA_RECOMMENDATIONS = [
        {
          id: 'spec-first',
          tagKey: 'specFirst',
          category: 'workflow',
          repo: 'anthropics/prompt-eng-interactive-tutorial',
          license: 'MIT License',
          url: 'https://github.com/anthropics/prompt-eng-interactive-tutorial',
          matchKeywords: ['工单', '流程', '边界', '任务说明', '开工单', 'spec', 'instruction', 'boundary'],
        },
        {
          id: 'two-stage-eval',
          tagKey: 'twoStageEval',
          category: 'eval',
          repo: 'dair-ai/Prompt-Engineering-Guide',
          license: 'Apache-2.0',
          url: 'https://github.com/dair-ai/Prompt-Engineering-Guide',
          matchKeywords: ['证据', '核对', '口径', '不实', '对账', 'evidence', 'grounding', 'verify'],
        },
        {
          id: 'modular-patterns',
          tagKey: 'modularPatterns',
          category: 'skill',
          repo: 'danielmiessler/fabric',
          license: 'MIT License',
          url: 'https://github.com/danielmiessler/fabric',
          matchKeywords: ['分头', '拆成', '托付', '工稿', 'atomic', 'workflow', 'pattern'],
        },
        {
          id: 'inverted-inquiry',
          tagKey: 'invertedInquiry',
          category: 'interaction',
          repo: 'f/awesome-chatgpt-prompts',
          license: 'CC0 1.0',
          url: 'https://github.com/f/awesome-chatgpt-prompts',
          matchKeywords: ['新东西', '探索', '提意见', '审视', 'reflect', 'question', 'clarify'],
        },
        {
          id: 'chunk-map-reduce',
          tagKey: 'chunkMapReduce',
          category: 'workflow',
          repo: 'openai/openai-cookbook',
          license: 'MIT License',
          url: 'https://github.com/openai/openai-cookbook',
          matchKeywords: ['盘点', '拆成四份', '合并', '汇总', 'summary', 'mapreduce'],
        },
      ]

      function UltraView({ t, lastReview }) {
        const reviewText = useMemo(() => {
          if (!lastReview) return ''
          return JSON.stringify(lastReview)
        }, [lastReview])
        return h(UltraPreview, { t, reviewText })
      }

      function UltraPreview({ t, reviewText }) {
        const [current, setCurrent] = useState(0)
        const [paused, setPaused] = useState(false)
        const [filterTag, setFilterTag] = useState('all')

        const matchedMap = {}
        ULTRA_RECOMMENDATIONS.forEach(r => {
          const hit = r.matchKeywords.some(kw => reviewText.includes(kw))
          if (hit) matchedMap[r.id] = true
        })

        useEffect(() => {
          if (paused) return undefined
          const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (prefersReduce) return undefined
          const timer = setInterval(() => {
            setCurrent(c => (c + 1) % ULTRA_SLIDES.length)
          }, 12000)
          return () => clearInterval(timer)
        }, [paused])

        const filteredRecs = filterTag === 'all'
          ? ULTRA_RECOMMENDATIONS
          : ULTRA_RECOMMENDATIONS.filter(r => r.tagKey === filterTag)

        const slide = ULTRA_SLIDES[current]
        const slideTitle = t(`ultraSlide_${slide.id}_title`)

        return h('div', { className: 'mel-ultra-container', 'data-melete-ultra': 'fixed-dark' },
          h('div', { className: 'mel-ultra-stage', 'aria-hidden': true },
            ...ULTRA_SLIDES.map((s, idx) => h('div', {
              key: s.id,
              className: `mel-ultra-slide${idx === current ? ' is-active' : ''}`,
            }, h('img', { src: `/melete/asset/${s.file}`, alt: t(`ultraSlide_${s.id}_title`) }))),
            h('div', { className: 'mel-ultra-veil' })),
          h('div', { className: 'mel-ultra-page' },
            h('header', { className: 'mel-ultra-hero' },
              h('p', { className: 'mel-ultra-kicker' }, t('ultraKicker')),
              h('h1', { className: 'mel-ultra-title' }, t('ultraTitle')),
              h('p', { className: 'mel-ultra-note' }, t('ultraSub'))),

            h('section', { className: 'mel-ultra-block' },
              h('p', { className: 'mel-ultra-eyebrow' }, t('ultraRecKicker')),
              h('h2', { className: 'mel-ultra-h2' }, t('ultraRecTitle')),
              h('div', { className: 'mel-ultra-filters' },
                h('button', {
                  type: 'button',
                  className: `mel-ultra-filter${filterTag === 'all' ? ' is-active' : ''}`,
                  onClick: () => setFilterTag('all'),
                }, t('ultraTag_all')),
                ...ULTRA_TAG_KEYS.map(tagKey => h('button', {
                  key: tagKey,
                  type: 'button',
                  className: `mel-ultra-filter${filterTag === tagKey ? ' is-active' : ''}`,
                  onClick: () => setFilterTag(tagKey),
                }, t(`ultraTag_${tagKey}`)))),
              h('div', { className: 'mel-ultra-grid' },
                ...filteredRecs.map(rec => {
                  const isMatched = !!matchedMap[rec.id]
                  const recTitle = t(`ultraRec_${rec.id}_title`)
                  const recBadge = t(`ultraRec_${rec.id}_badge`)
                  const recSummary = t(`ultraRec_${rec.id}_summary`)
                  const recMatchReason = t(`ultraRec_${rec.id}_matchReason`)
                  return h('div', { key: rec.id, className: 'mel-ultra-card' },
                    h('div', { className: 'mel-ultra-card-header' },
                      h('h3', { className: 'mel-ultra-card-title' },
                        recTitle,
                        h('span', { className: 'mel-ultra-badge' }, recBadge),
                        isMatched ? h('span', { className: 'mel-ultra-badge', style: { borderColor: 'var(--accent)', background: 'rgba(207,224,180,0.35)' } }, t('ultraMatchedBadge')) : null),
                      h('a', {
                        className: 'mel-ultra-link',
                        href: rec.url,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      }, t('ultraVisitLink'))),
                    h('p', { className: 'mel-ultra-card-summary' }, recSummary),
                    h('div', { className: 'mel-ultra-card-footer' },
                      h('div', { className: 'mel-ultra-card-meta' },
                        h('span', null, `${t('ultraRepoLabel')}${rec.repo}`),
                        h('span', null, `· ${rec.license}`)),
                      h('div', { style: { color: 'var(--accent)' } }, recMatchReason)))
                }))),

            h('section', { className: 'mel-ultra-block' },
              h('p', { className: 'mel-ultra-eyebrow' }, t('ultraAboutKicker')),
              h('h2', { className: 'mel-ultra-h2' }, t('ultraAboutTitle')),
              h('div', { className: 'mel-ultra-prose' },
                h('div', { className: 'mel-ultra-prose-item' },
                  h('span', { className: 'mel-ultra-marker' }, t('ultraPara1Label')),
                  h('p', { className: 'mel-ultra-prose-p' }, t('ultraPara1'))),
                h('div', { className: 'mel-ultra-prose-item' },
                  h('span', { className: 'mel-ultra-marker' }, t('ultraPara2Label')),
                  h('p', { className: 'mel-ultra-prose-p' }, t('ultraPara2'))),
                h('div', { className: 'mel-ultra-prose-item' },
                  h('span', { className: 'mel-ultra-marker' }, t('ultraPara3Label')),
                  h('p', { className: 'mel-ultra-prose-p' }, t('ultraPara3'))))),

            h('section', { className: 'mel-ultra-block' },
              h('p', { className: 'mel-ultra-eyebrow' }, t('ultraCreditsKicker')),
              h('h2', { className: 'mel-ultra-h2' }, t('ultraCreditsTitle')),
              h('ul', { className: 'mel-ultra-credits' },
                ...ULTRA_SLIDES.map(s => {
                  const sTitle = t(`ultraSlide_${s.id}_title`)
                  const sCredit = t(`ultraSlide_${s.id}_credit`)
                  return h('li', { key: s.id, className: 'mel-ultra-credit' },
                    h('img', { src: `/melete/asset/${s.file}`, alt: sTitle }),
                    h('div', null,
                      h('div', { className: 'mel-ultra-credit-name' }, sTitle),
                      h('div', { className: 'mel-ultra-credit-meta' },
                        sCredit,
                        ' · ',
                        h('a', { className: 'mel-ultra-link', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, t('ultraCommonsLink')))))
                }))),

            h('div', { className: 'mel-ultra-ctrl' },
              h('div', { className: 'mel-ultra-dots' },
                ...ULTRA_SLIDES.map((_, i) => h('button', {
                  key: i,
                  type: 'button',
                  className: `mel-ultra-dot${i === current ? ' is-active' : ''}`,
                  onClick: () => setCurrent(i),
                  'aria-label': t('ultraDotAria', { n: i + 1 }),
                }))),
              h('button', {
                type: 'button',
                className: 'mel-ultra-toggle',
                onClick: () => setPaused(!paused),
              }, paused ? t('ultraResume') : t('ultraPause')),
              h('span', { style: { marginLeft: 'auto' } }, t('ultraCurrent', { title: slideTitle })))))
      }

      function DocPage({ kind, t, version, edition, onBack }) {
        const back = h('button', { type: 'button', className: 'mel-btn', onClick: onBack }, '← ' + t('back'))
        if (kind === 'changelog') {
          const groups = []
          for (const x of t('changelogItems').split('|').filter(Boolean)) {
            if (x.startsWith('## ')) groups.push({ title: x.slice(3), items: [] })
            else {
              if (!groups.length) groups.push({ title: '', items: [] })
              groups[groups.length - 1].items.push(x)
            }
          }
          return h('div', { className: 'mel-card mel-doc-card' }, back,
            h('h2', { style: { marginTop: 16 } }, t('changelogTitle')),
            h('p', { className: 'mel-sub' }, t('changelogSub')),
            h('div', { className: 'mel-ver' }, h('b', null, version), ' ', h('span', null, edition)),
            h('div', { className: 'mel-changelog' }, ...groups.map((g, gi) => h('section', { key: gi, className: 'mel-log-section' },
              g.title ? h('h3', { className: 'mel-log-group' }, g.title) : null,
              h('ul', { className: 'mel-log' }, ...g.items.map((x, i) => h('li', { key: i }, x)))))))
        }
        if (kind === 'philosophy') {
          const stableItems = (t('philosophyStableItems') || '').split('|').filter(Boolean)
          const thinkingItems = (t('philosophyThinkingItems') || '').split('|').filter(Boolean)
          const authorBox = t('philosophyAuthorTitle') ? h('div', { className: 'mel-doc-section mel-doc-author-box' },
            h('h3', { className: 'mel-doc-h3' }, t('philosophyAuthorTitle')),
            ...(t('philosophyAuthorText') || '').split('\n\n').map((x, i) => h('p', { key: i, className: 'mel-doc-p', style: { margin: '8px 0' } }, x)),
            h('p', { className: 'mel-doc-p', style: { margin: '14px 0 0', fontSize: 13, wordBreak: 'break-all' } },
              t('projectRepo'), ': ',
              h('a', { className: 'mel-ultra-link', style: { display: 'inline', wordBreak: 'break-all' }, href: REPO_URL, target: '_blank', rel: 'noopener noreferrer' }, REPO_URL))) : null
          return h('div', { className: 'mel-card mel-doc-card' }, back,
            h('h2', { style: { marginTop: 16 } }, t('philosophyTitle')),
            h('p', { className: 'mel-lead', style: { margin: '8px 0 20px', color: 'var(--t2)', fontSize: 14 } }, t('philosophySub') || t('philosophyBody')),
            authorBox,
            stableItems.length ? h('div', { className: 'mel-doc-section' },
              h('h3', { className: 'mel-doc-h3' }, t('philosophyStableTitle')),
              h('ul', { className: 'mel-doc-list' }, ...stableItems.map((x, i) => {
                const parts = x.split(/[：:]/)
                return h('li', { key: i }, h('b', null, parts[0]), parts.length > 1 ? `：${parts.slice(1).join('：')}` : '')
              }))) : null,
            thinkingItems.length ? h('div', { className: 'mel-doc-section' },
              h('h3', { className: 'mel-doc-h3' }, t('philosophyThinkingTitle')),
              h('ul', { className: 'mel-doc-list' }, ...thinkingItems.map((x, i) => {
                const parts = x.split(/[：:]/)
                return h('li', { key: i }, h('b', null, parts[0]), parts.length > 1 ? `：${parts.slice(1).join('：')}` : '')
              }))) : null,
            t('philosophyGoalTitle') ? h('div', { className: 'mel-doc-section' },
              h('h3', { className: 'mel-doc-h3' }, t('philosophyGoalTitle')),
              h('p', { className: 'mel-doc-p' }, t('philosophyGoalText'))) : null)
        }
        const letterParagraphs = (t('makerLetterBody') || t('letterPlaceholder') || '').split('|').filter(Boolean)
        return h('div', { className: 'mel-card mel-doc-card' }, back,
          h('h2', { style: { marginTop: 16 } }, t('makerLetterTitle') || t('letterTitle2')),
          (t('makerLetterSub') || t('letterSub')) ? h('p', { className: 'mel-sub' }, t('makerLetterSub') || t('letterSub')) : null,
          h('div', { className: 'mel-letter-body', style: { marginTop: 22 } },
            ...letterParagraphs.map((x, i) => h('p', { key: i, className: i === 0 ? 'mel-lead' : 'mel-doc-p', style: { lineHeight: 1.85, margin: '14px 0', fontSize: i === 0 ? 15 : 14 } }, x))),
          (t('makerLetterSign') || t('letterSign')) ? h('div', { className: 'mel-letter-sign', style: { marginTop: 32, textAlign: 'right', color: 'var(--t2)', fontSize: 13, fontStyle: 'italic' } }, t('makerLetterSign') || t('letterSign')) : null)
      }

      return function MeletePage() {
        useEffect(ensureStyle, [])
        const dshLang = useSyncExternalStore(localeStore.subscribe, localeStore.get)
        const [state, setState] = useState(null)
        const [view, setView] = useState('loading')
        const [review, setReview] = useState(null)
        const [error, setError] = useState('')
        const [errorAction, setErrorAction] = useState('load')
        const [pollRetry, setPollRetry] = useState(0)
        const [intention, setIntention] = useState('')
        const defaultYear = getDefaultReviewYear()
        const [range, setRange] = useState({ kind: 'year', year: defaultYear })
        const [selectedYear, setSelectedYear] = useState(defaultYear)
        const [from, setFrom] = useState(`${defaultYear}-01-01`)
        const [to, setTo] = useState(todayText())
        const [showAdv, setShowAdv] = useState(true)
        const [customVoices, setCustomVoices] = useState(() => {
          try {
            const s = localStorage.getItem('melete_custom_voices')
            return s ? JSON.parse(s) : []
          } catch {
            return []
          }
        })
        const [activeVoice, setActiveVoice] = useState(null)
        const [showAddVoice, setShowAddVoice] = useState(false)
        const [newVoice, setNewVoice] = useState({ name: '', kind: 'AI 对话', excerpt: '', full: '', note: '' })
        const [showIntention, setShowIntention] = useState(false)
        const [doc, setDoc] = useState('')
        const [notice, setNotice] = useState('')
        const [settingsHint, setSettingsHint] = useState('')
        // 众声卡片的随机顺序：每次打开插件洗一次牌，这次浏览里保持不变
        const [voiceSeed] = useState(() => Math.floor(Math.random() * 2147483647))
        // 页面宽度档位：按插件区域本身的宽度（不是整个窗口）切换布局；DSH 侧栏开合时也会跟着变
        const rootRef = useRef(null)
        const [wcls, setWcls] = useState('l')
        useEffect(() => {
          const el = rootRef.current
          if (!el) return undefined
          const fit = () => { const w = el.clientWidth || 1200; setWcls(w < 640 ? 'xs' : w < 980 ? 's' : w < 1280 ? 'm' : 'l') }
          fit()
          if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }
          const ro = new ResizeObserver(fit)
          ro.observe(el)
          return () => ro.disconnect()
        }, [])
        const [confirmDelAll, setConfirmDelAll] = useState(false)
        const occasionalOther = useRef(null)
        if (occasionalOther.current === null) {
          const home = regionStyle()
          const others = STYLE_IDS.filter(id => id !== home)
          occasionalOther.current = Math.random() < 0.5 ? others[Math.floor(Math.random() * others.length)] : home
        }

        const settings = (state && state.settings) || { language: 'auto', style: 'auto', occasionalSwitch: true, defaultDays: 14 }
        const lang = settings.language === 'auto' ? (TERMS[dshLang] ? dshLang : 'en') : settings.language
        const baseT = makeT(lang)
        const t = (key, vars) => (key === '__term' ? (TERMS[lang] || TERMS.en) : baseT(key, vars))
        let style = settings.style === 'auto'
          ? (settings.occasionalSwitch ? occasionalOther.current : regionStyle())
          : settings.style

        const refresh = async () => {
          const s = await api('/state')
          setState(s)
          return s
        }
        const openReview = async id => {
          setReview(await api(`/review?id=${encodeURIComponent(id)}`))
          setView('cards')
        }

        useEffect(() => {
          let alive = true
          refresh().then(s => {
            if (!alive) return
            if (['reading', 'writing', 'saving'].includes(s.job.state)) setView('running')
            else setView('home')
          }).catch(err => {
            if (alive) {
              setError(err.message || 'network-error')
              setErrorAction('load')
              setView('home')
            }
          })
          return () => { alive = false }
        }, [])

        useEffect(() => {
          if (view !== 'running') return undefined
          let failCount = 0
          const timer = setInterval(async () => {
            try {
              const job = await api('/job')
              failCount = 0
              setState(s => (s ? { ...s, job } : s))
              if (job.state === 'done') {
                clearInterval(timer)
                await refresh()
                await openReview(job.reviewId)
              } else if (job.state === 'error') {
                clearInterval(timer)
                setError(job.error || 'bad-output')
                setErrorAction('start')
                setView('home')
              }
            } catch {
              failCount++
              if (failCount >= 3) {
                clearInterval(timer)
                setError('network-error')
                setErrorAction('poll')
              }
            }
          }, 2000)
          return () => clearInterval(timer)
        }, [view, pollRetry])

        const customOk = range.kind !== 'custom' || (from && to && from <= to)
        const rangeBody = range.kind === 'days' ? { kind: 'days', days: range.n } : range.kind === 'all' ? { kind: 'all' } : { kind: 'custom', from, to }
        const start = async () => {
          if (!customOk) { setError('bad-range'); setErrorAction('start'); return }
          setError('')
          setNotice('')
          try {
            await api('/review', { range: rangeBody, days: range.kind === 'days' ? range.n : 30, intention: intention.trim(), lang, region: regionCulture() })
            setState(s => (s ? { ...s, job: { ...s.job, state: 'reading' } } : s))
            setView('running')
          } catch (err) {
            setError(err.code || err.message)
            setErrorAction('start')
          }
        }
        const handleRetry = async () => {
          const act = errorAction
          setError('')
          if (act === 'load') {
            try {
              const s = await refresh()
              setRange(rangeFromDefault(s.settings.defaultDays))
              if (['reading', 'writing', 'saving'].includes(s.job.state)) setView('running')
              else if (s.reviews.length) await openReview(s.reviews[0].id).catch(() => setView('home'))
              else setView('home')
            } catch (err) {
              setError(err.message || 'network-error')
              setErrorAction('load')
            }
          } else if (act === 'poll') {
            setView('running')
            setPollRetry(c => c + 1)
          } else {
            start()
          }
        }
        const saveSetting = patch => {
          setState(s => ({ ...s, settings: { ...s.settings, ...patch } }))
          setSettingsHint('')
          api('/settings', patch)
            .then(next => setState(s => ({ ...s, settings: next })))
            .catch(() => { setSettingsHint(t('settingsNotSaved')); refresh() })
        }
        const removeCurrent = async () => {
          const id = review && review.meta && review.meta.id
          if (!id) return
          try {
            await api('/delete-review', { id, confirm: 'delete' })
            const s = await refresh()
            setReview(null)
            if (s.reviews.length) await openReview(s.reviews[0].id)
            else setView('home')
          } catch (err) { setError(err.code || err.message) }
        }
        const errorText = code => (['no-records', 'no-model', 'empty-review', 'bad-output', 'busy', 'bad-range', 'network-error'].includes(code) ? t(`error.${code}`) : t('error.generic', { msg: code }))
        const model = state && state.model
        const hasReviews = Boolean(state && state.reviews && state.reviews.length)

        const tabs = h('nav', { className: 'mel-top' },
          h('button', { type: 'button', className: 'mel-tab', 'aria-pressed': view === 'home' || view === 'running', onClick: () => setView(state && ['reading', 'writing', 'saving'].includes(state.job.state) ? 'running' : 'home') }, t('navNew')),
          h('button', { type: 'button', className: 'mel-tab', 'aria-pressed': view === 'cards', onClick: () => {
            if (hasReviews) openReview(state.reviews[0].id)
            else setView('cards')
          } }, t('navReviews')),
          h('button', { type: 'button', className: 'mel-tab', 'aria-pressed': view === 'ultra', onClick: () => setView('ultra') }, t('navUltra')),
          h('button', { type: 'button', className: 'mel-tab', 'aria-pressed': view === 'settings' || view === 'doc', onClick: () => setView('settings') }, t('navSettings')))

        const hero = h('header', { className: 'mel-hero' },
          h(Emblem, { style, term: t('__term') }),
          h('div', null, h('h1', null, 'Melete', h('span', null, t('__term'))), h('p', null, t('tagline'))))

        const nums = NUMERALS[style]
        let body
        if (view === 'loading') {
          body = h('p', { className: 'mel-sub' }, t('loading'))
        } else if (view === 'running') {
          const js = (state && state.job && state.job.state) || 'reading'
          const order = ['reading', 'writing', 'saving']
          const at = Math.max(0, order.indexOf(js))
          body = h('div', { className: 'mel-card' },
            h('ul', { className: 'mel-run' }, ...[t('run1'), t('run2', { model: model || '' }), t('run3')].map((label, i) =>
              h('li', { key: i, 'data-s': i < at ? 'done' : i === at ? 'now' : 'todo' }, h('span', { className: 'mel-dot' }, i < at ? '✓' : nums[i]), label))),
            error ? h('div', { className: 'mel-err' }, errorText(error), h('button', { type: 'button', className: 'mel-btn', onClick: handleRetry }, t('retry'))) : null,
            h('p', { className: 'mel-note' }, t('runHint')))
        } else if (view === 'cards') {
          body = review ? h(React.Fragment, null,
            Boolean(state && state.reviews && state.reviews.length > 1) ? h('div', { className: 'mel-past' },
              ...state.reviews.slice(0, 8).map(r => h('button', {
                key: r.id, type: 'button', className: 'mel-chip', 'aria-pressed': r.id === (review.meta && review.meta.id), onClick: () => openReview(r.id),
              }, String(r.createdAt || '').slice(0, 10)))) : null,
            h(ReviewCards, { review, t, style, lang, onDelete: removeCurrent }))
          : h('div', { className: 'mel-card mel-empty' },
              h('p', { className: 'mel-sub', style: { margin: '8px 0 16px' } }, t('emptyReviewsHint')),
              h('button', { type: 'button', className: 'mel-btn', onClick: () => setView('home') }, t('navNew')))
        } else if (view === 'settings' && state) {
          const sel = (value, options, onChange) => h('select', { value, onChange: e => onChange(e.target.value) }, ...options.map(([v, l]) => h('option', { key: v, value: v }, l)))
          const swatch = (value, label, colors) => h('button', {
            type: 'button', className: 'mel-sw', 'aria-pressed': settings.style === value, onClick: () => saveSetting({ style: value }),
            title: STYLE_ENDONYM[value] || label,
          }, h('div', { style: { background: colors } }), h('span', null, label, STYLE_ENDONYM[value] ? h('small', { className: 'mel-sw-endo' }, STYLE_ENDONYM[value]) : null))
          body = h('div', { className: 'mel-card' },
            h('div', { className: 'mel-set' },
              h('label', null, t('settingsLanguage')),
              sel(settings.language, [['auto', t('followDsh')], ...Object.entries(LANGUAGE_NAMES)], v => saveSetting({ language: v })),
              h('label', null, t('settingsStyle')),
              h('div', { className: 'mel-swatches' },
                swatch('auto', t('styleAuto'), 'conic-gradient(#3a6a9a 0 45deg,#b4392a 0 90deg,#2b4a94 0 135deg,#b8531a 0 180deg,#946410 0 225deg,#8b2135 0 270deg,#1b7a5a 0 315deg,#9c2e28 0)'),
                swatch('greek', t('greek'), 'linear-gradient(135deg,#f3ead6,#3a6a9a)'),
                swatch('chinese', t('chinese'), 'linear-gradient(135deg,#f2e6cf,#b4392a)'),
                swatch('babylonian', t('babylonian'), 'linear-gradient(135deg,#ecdcb8,#2b4a94)'),
                swatch('indian', t('indian'), 'linear-gradient(135deg,#f3dccb,#b8531a)'),
                swatch('egyptian', t('egyptian'), 'linear-gradient(135deg,#f1e2ba,#946410)'),
                swatch('roman', t('roman'), 'linear-gradient(135deg,#efdcd2,#8b2135)'),
                swatch('maya', t('maya'), 'linear-gradient(135deg,#e5efe8,#1b7a5a)'),
                swatch('inca', t('inca'), 'linear-gradient(135deg,#fbeee6,#9c2e28)')),
              settingsHint ? h('span', null) : null,
              settingsHint ? h('p', { className: 'mel-err', style: { margin: 0 } }, settingsHint) : null,
              h('span', null),
              h('label', { className: 'mel-sub', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                h('input', { type: 'checkbox', checked: !!settings.occasionalSwitch, onChange: e => saveSetting({ occasionalSwitch: e.target.checked }) }), t('occasional')),
              h('label', null, t('settingsDays')),
              h('div', { className: 'mel-seg' }, ...RANGE_OPTIONS.filter(o => o.id !== 'custom').map(o => {
                const n = o.id === 'all' ? 0 : Number(o.id)
                const current = rangeFromDefault(settings.defaultDays)
                return h('button', {
                  key: o.id, type: 'button', 'aria-pressed': rangeId(current) === o.id, onClick: () => { saveSetting({ defaultDays: n }); setRange(rangeFromDefault(n)) },
                }, t(o.label))
              })),
              h('div', { className: 'mel-hr' }),
              h('label', null, t('settingsPrivacy')), h('p', { className: 'mel-sub', style: { margin: 0 } }, t('privacyText')),
              h('label', null, t('settingsData')),
              h('div', null,
                h('p', { className: 'mel-sub', style: { margin: '0 0 8px' } }, t('dataText', { dir: state.dataDir })),
                confirmDelAll ? h('div', { className: 'mel-inline-confirm', style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } },
                  h('p', { style: { margin: '0 0 8px', color: 'var(--dsw-alias-danger, #b3261e)', lineHeight: 1.6 } }, t('deleteConfirm', { dir: state.dataDir })),
                  h('div', { className: 'mel-btns' },
                    h('button', {
                      type: 'button', className: 'mel-btn mel-btn-danger',
                      onClick: async () => {
                        setConfirmDelAll(false)
                        await api('/delete-all', { confirm: 'delete' })
                        setReview(null)
                        setNotice(t('deleted'))
                        await refresh()
                        setView('home')
                      },
                    }, t('confirmDeleteAllBtn')),
                    h('button', { type: 'button', className: 'mel-btn', onClick: () => setConfirmDelAll(false) }, t('cancelBtn'))))
                : h('button', {
                    type: 'button', className: 'mel-btn mel-btn-subtle',
                    onClick: () => setConfirmDelAll(true),
                  }, t('deleteAll'))),
              h('label', null, t('settingsAbout')), h('p', { className: 'mel-sub', style: { margin: 0 } }, t('aboutText', { v: state.version, ed: state.edition || '', lv: state.lensVersion })),
              h('label', null, t('projectRepo')),
              h('div', { style: { wordBreak: 'break-all', minWidth: 0 } },
                h('a', { className: 'mel-ultra-link', style: { wordBreak: 'break-all' }, href: REPO_URL, target: '_blank', rel: 'noopener noreferrer' }, REPO_URL)),
              h('label', null, t('settingsMore')),
              h('div', { className: 'mel-btns' },
                ...[['changelog', 'changelogBtn'], ['philosophy', 'philosophyBtn'], ['letter', 'letterBtn']].map(([k, l]) =>
                  h('button', { key: k, type: 'button', className: 'mel-btn', onClick: () => { setDoc(k); setView('doc') } }, t(l))))))
        } else if (view === 'doc') {
          body = h(DocPage, { kind: doc, t, version: (state && state.version) || '', edition: (state && state.edition) || '', onBack: () => setView('settings') })
        } else if (view === 'ultra') {
          body = h(UltraView, { t, lastReview: review })
        } else {
          const chips = t('chips').split('|')
          const allPeople = [...customVoices, ...INITIAL_VOICES]
          const li = VOICE_LANGS.indexOf(String(lang || '').slice(0, 2))
          const vText = v => (li >= 0 && VOICE_I18N[`${v.id}|${v.q}`] ? VOICE_I18N[`${v.id}|${v.q}`][li] : v.full)
          const vTranslated = v => li >= 0 && Boolean(VOICE_I18N[`${v.id}|${v.q}`])
          const qNum = q => (String(lang || '').startsWith('zh') ? `问题${['', '一', '二', '三', '四'][q]}` : t('voicesQNum', { n: q }))
          const kindLabel = k => (!k || /^AI/i.test(k) ? t('voicesKindAI') : /朋友/.test(k) ? t('voicesKindFriend') : k)
          // 一个问题一张卡片；把同一个人的几张卡片错开，不挤在一起
          const perPerson = allPeople.map(splitVoice)
          // 用固定的种子洗牌（mulberry32），同一次浏览里顺序不变
          let sd = voiceSeed >>> 0
          const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let x = sd; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
          const pool = perPerson.flat()
          for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
          // 卡片交替放进左右两列：左右相邻（前一张）和同列上下相邻（前两张）尽量不重复同一个人、同一个问题
          const allVoices = []
          const who = v => v.id || v.name
          while (pool.length) {
            const a = allVoices[allVoices.length - 1], b = allVoices[allVoices.length - 2]
            const fits = (v, strict) => (!a || who(v) !== who(a)) && (!b || who(v) !== who(b)) && (!strict || ((!a || v.q !== a.q) && (!b || v.q !== b.q)))
            let k = pool.findIndex(v => fits(v, true))
            if (k < 0) k = pool.findIndex(v => fits(v, false))
            if (k < 0) k = 0
            allVoices.push(pool.splice(k, 1)[0])
          }
          const col1 = []
          const col2 = []
          allVoices.forEach((v, idx) => {
            if (idx % 2 === 0) col1.push(v)
            else col2.push(v)
          })
          const col1Looped = [...col1, ...col1]
          const col2Looped = [...col2, ...col2]

          const renderCard = (v, key) => h('div', {
            key,
            className: 'mel-voice-card',
            onClick: () => setActiveVoice(v),
            tabIndex: 0,
            role: 'button',
            'aria-label': t('voicesAria', { name: v.name, q: v.q ? t(`voicesQs${v.q}`) : '' }),
            onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveVoice(v) } },
          },
            h('div', { className: 'mel-voice-card-top' },
              h('span', { className: 'mel-voice-name' },
                h('span', { className: 'mel-voice-dot' }),
                v.name),
              h('span', { className: 'mel-voice-kind' }, kindLabel(v.kind))),
            v.q ? h('div', { className: 'mel-voice-q' }, `${qNum(v.q)} · ${t(`voicesQs${v.q}`)}`) : null,
            h('div', { className: 'mel-voice-quote' }, `“${vTranslated(v) ? firstSentence(vText(v)) : v.excerpt}”`),
            h('div', { className: 'mel-voice-card-bottom' },
              h('span', null, v.date || '2026.11.08'),
              h('span', { className: 'mel-voice-read' }, t('voicesRead'))))

          const curYear = new Date().getFullYear()
          const yearsList = []
          for (let y = curYear; y >= 2020; y--) yearsList.push(y)

          const rangeSummary = range.kind === 'year'
            ? t('rangeYearFmt', { y: range.year, a: `${range.year}-01-01`, b: range.year === curYear ? todayText() : `${range.year}-12-31` })
            : range.kind === 'custom'
            ? t('rangeSpanFmt', { a: from || '—', b: to || '—' })
            : range.kind === 'all'
            ? t('rangeAllText')
            : t('rangeDaysText', { n: range.n })

          const leftPanel = h('div', { className: 'mel-home-left' },
            h('header', { className: 'mel-hero mel-home-brand' },
              h(Emblem, { style, term: t('__term') }),
              h('div', null,
                h('h1', null, 'Melete', h('span', null, t('__term'))),
                h('p', null, t('tagline')))),
            h('div', { className: 'mel-cta-hero-box' },
              h('button', {
                type: 'button',
                className: 'mel-btn-start-hero',
                disabled: !model,
                onClick: start,
              },
                h('span', null, t('start') + '　↗')),
              h('div', { className: 'mel-cta-submeta' },
                t('homeRange', { r: rangeSummary }),
                h('br'),
                t('homeModel', { m: model || t('homeNoModel') })),
              !model && state ? h('div', { className: 'mel-err' }, t('noModel')) : null,
              error ? h('div', { className: 'mel-err' }, errorText(error), h('button', { type: 'button', className: 'mel-btn', onClick: handleRetry }, t('retry'))) : null,
              notice ? h('p', { className: 'mel-sub', style: { margin: 0, textAlign: 'center' } }, notice) : null),
            h('div', { className: 'mel-adv-box' },
              h('div', { className: 'mel-adv-head', onClick: () => setShowAdv(v => !v) },
                h('span', null, t('homeAdv')),
                h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, showAdv ? t('homeCollapse') : t('homeExpand'))),
              showAdv ? h('div', { className: 'mel-adv-body' },
                h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                  h('label', { style: { fontSize: 12, fontWeight: 500, color: 'var(--t2)' } }, t('homeRangeLabel')),
                  h('div', { className: 'mel-range-seg' },
                    h('button', {
                      type: 'button',
                      'aria-pressed': range.kind === 'year',
                      onClick: () => { setRange({ kind: 'year', year: selectedYear }) },
                    }, t('homeByYear')),
                    h('button', {
                      type: 'button',
                      'aria-pressed': range.kind === 'custom',
                      onClick: () => setRange({ kind: 'custom' }),
                    }, t('homeCustom')),
                    h('button', {
                      type: 'button',
                      'aria-pressed': range.kind === 'all',
                      onClick: () => setRange({ kind: 'all' }),
                    }, t('homeAll'))),
                  range.kind === 'year' ? h('div', { style: { marginTop: 6 } },
                    h('select', {
                      className: 'mel-year-select',
                      value: selectedYear,
                      onChange: e => {
                        const y = Number(e.target.value)
                        setSelectedYear(y)
                        setRange({ kind: 'year', year: y })
                      },
                    }, ...yearsList.map(y => h('option', { key: y, value: y }, `${t('homeYearOpt', { y })}${y === defaultYear ? t('homeDefault') : ''}`))),
                    h('p', { className: 'mel-sub', style: { margin: '6px 0 0', fontSize: 11 } }, t('homeYearHint'))) : null,
                  range.kind === 'custom' ? h('div', { className: 'mel-dates', style: { marginTop: 6 } },
                    h('label', null, t('rFrom'), h('input', { type: 'date', value: from, max: to || todayText(), onChange: e => setFrom(e.target.value) })),
                    h('label', null, t('rTo'), h('input', { type: 'date', value: to, min: from || undefined, max: todayText(), onChange: e => setTo(e.target.value) }))) : null,
                  range.kind === 'all' ? h('p', { className: 'mel-sub', style: { margin: '6px 0 0', fontSize: 11 } }, t('rangeAllHint')) : null),
                h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 } },
                  h('label', { style: { fontSize: 12, fontWeight: 500, color: 'var(--t2)' } }, t('homeIntentLabel')),
                  h('div', { className: 'mel-chips' }, ...chips.map(c => h('button', {
                    key: c, type: 'button', className: 'mel-chip', 'aria-pressed': intention.includes(c),
                    onClick: () => setIntention(v => (v.includes(c) ? v.replace(c, '').replace(/^[；;\s]+|[；;\s]+$/g, '') : (v ? `${v}；${c}` : c))),
                  }, c))),
                  h('textarea', { value: intention, placeholder: t('intentionPlaceholder'), maxLength: 500, onChange: e => setIntention(e.target.value) }))) : null),
            h('div', { className: 'mel-note' },
              h(LockIcon),
              h('span', null, t('privacyNote', { model: model || '—' }))))

          const rightPanel = h('div', { className: 'mel-home-right' },
            h('div', { className: 'mel-voices-head' },
              h('div', null,
                h('h2', null, t('voicesTitle')),
                h('p', null, t('voicesSub', { n: allPeople.length }))),
              h('button', {
                type: 'button',
                className: 'mel-btn',
                style: { fontSize: 12, padding: '5px 12px', border: '1px solid var(--border-subtle)' },
                onClick: () => setShowAddVoice(true),
              }, t('voicesAdd'))),
            h('div', { className: 'mel-waterfall-window' },
              h('div', { className: 'mel-waterfall-cols' },
                // 滚动速度按卡片数量算：每张卡片约 11 秒，不会因为卡片多了就变快
                h('div', { className: 'mel-waterfall-col mel-col-1', style: { animationDuration: `${Math.max(60, col1.length * 11)}s` } },
                  ...col1Looped.map((v, i) => renderCard(v, `c1-${i}`))),
                h('div', { className: 'mel-waterfall-col mel-col-2', style: { animationDuration: `${Math.max(70, col2.length * 12.5)}s` } },
                  ...col2Looped.map((v, i) => renderCard(v, `c2-${i}`))))))

          body = h('div', { className: 'mel-home-split' }, leftPanel, rightPanel)
        }

        const mLi = VOICE_LANGS.indexOf(String(lang || '').slice(0, 2))
        const mKey = activeVoice ? `${activeVoice.id}|${activeVoice.q}` : ''
        const mTranslated = Boolean(activeVoice && mLi >= 0 && VOICE_I18N[mKey])
        const mIsFriend = Boolean(activeVoice && /朋友/.test(activeVoice.kind || ''))
        const voiceModal = activeVoice ? h('div', { className: 'mel-modal-backdrop', onClick: () => setActiveVoice(null) },
          h('div', { className: 'mel-modal-box', onClick: e => e.stopPropagation() },
            h('div', { className: 'mel-modal-head' },
              h('div', null,
                h('span', { className: 'mel-voice-kind' }, mIsFriend ? t('voicesKindFriend') : (!activeVoice.kind || /^AI/i.test(activeVoice.kind) ? t('voicesKindAI') : activeVoice.kind)),
                h('h2', { style: { margin: '8px 0 0', fontSize: 20, fontWeight: 500 } }, activeVoice.name)),
              h('button', { type: 'button', className: 'mel-modal-close', onClick: () => setActiveVoice(null), 'aria-label': t('voicesClose') }, '×')),
            activeVoice.q ? h('div', { className: 'mel-modal-question' }, `${String(lang || '').startsWith('zh') ? `问题${['', '一', '二', '三', '四'][activeVoice.q]}` : t('voicesQNum', { n: activeVoice.q })}${String(lang || '').startsWith('zh') ? '：' : ': '}${t(`voicesQ${activeVoice.q}`)}`) : null,
            h('div', { className: 'mel-modal-full-text' }, mTranslated ? VOICE_I18N[mKey][mLi] : activeVoice.full),
            h('div', { className: 'mel-modal-disclaimer' },
              mIsFriend ? t('voicesNoteFriend') : t('voicesNoteAI', { name: activeVoice.name }),
              mTranslated ? ` ${t('voicesTranslated')}` : null,
              h('span', { style: { display: 'block', marginTop: 4, color: 'var(--t3)' } }, activeVoice.date || '2026.11.08')))) : null

        const addVoiceModal = showAddVoice ? h('div', { className: 'mel-modal-backdrop', onClick: () => setShowAddVoice(false) },
          h('div', { className: 'mel-modal-box', onClick: e => e.stopPropagation() },
            h('div', { className: 'mel-modal-head' },
              h('h2', { style: { margin: 0, fontSize: 18, fontWeight: 500 } }, t('voicesFormTitle')),
              h('button', { type: 'button', className: 'mel-modal-close', onClick: () => setShowAddVoice(false), 'aria-label': t('voicesClose') }, '×')),
            h('div', { className: 'mel-form-group' },
              h('label', null, t('voicesFormName')),
              h('input', {
                type: 'text',
                placeholder: t('voicesFormNamePh'),
                value: newVoice.name,
                onChange: e => setNewVoice({ ...newVoice, name: e.target.value }),
              })),
            h('div', { className: 'mel-form-group' },
              h('label', null, t('voicesFormKind')),
              h('input', {
                type: 'text',
                placeholder: t('voicesFormKindPh'),
                value: newVoice.kind,
                onChange: e => setNewVoice({ ...newVoice, kind: e.target.value }),
              })),
            h('div', { className: 'mel-form-group' },
              h('label', null, t('voicesFormExcerpt')),
              h('textarea', {
                style: { minHeight: 60 },
                placeholder: t('voicesFormExcerptPh'),
                value: newVoice.excerpt,
                onChange: e => setNewVoice({ ...newVoice, excerpt: e.target.value }),
              })),
            h('div', { className: 'mel-form-group' },
              h('label', null, t('voicesFormFull')),
              h('textarea', {
                style: { minHeight: 120 },
                placeholder: t('voicesFormFullPh'),
                value: newVoice.full,
                onChange: e => setNewVoice({ ...newVoice, full: e.target.value }),
              })),
            h('div', { className: 'mel-form-group' },
              h('label', null, t('voicesFormNote')),
              h('input', {
                type: 'text',
                placeholder: t('voicesFormNotePh'),
                value: newVoice.note,
                onChange: e => setNewVoice({ ...newVoice, note: e.target.value }),
              })),
            h('div', { className: 'mel-voice-safety' },
              h('p', null, t('voicesSafety')),
              h('label', null,
                h('input', { type: 'checkbox', checked: !!newVoice.ok, onChange: e => setNewVoice({ ...newVoice, ok: e.target.checked }) }),
                t('voicesSafetyOk'))),
            h('div', { className: 'mel-btns', style: { justifyContent: 'flex-end', marginTop: 12 } },
              h('button', { type: 'button', className: 'mel-btn', onClick: () => setShowAddVoice(false) }, t('voicesCancel')),
              h('button', {
                type: 'button',
                className: 'mel-btn mel-btn-primary',
                style: { background: 'var(--ac)', color: '#fff', border: 'none' },
                onClick: () => {
                  if (!newVoice.name.trim() || !newVoice.excerpt.trim() || !newVoice.ok) return
                  const card = {
                    id: `custom-${Date.now()}`,
                    name: newVoice.name.trim(),
                    kind: newVoice.kind.trim() || '对话摘录',
                    excerpt: newVoice.excerpt.trim(),
                    full: (newVoice.full || newVoice.excerpt).trim(),
                    note: newVoice.note.trim() || '用户添加的对话摘录',
                    date: todayText(),
                    isCustom: true,
                  }
                  const next = [card, ...customVoices]
                  setCustomVoices(next)
                  try { localStorage.setItem('melete_custom_voices', JSON.stringify(next)) } catch {}
                  setNewVoice({ name: '', kind: 'AI 对话', excerpt: '', full: '', note: '', ok: false })
                  setShowAddVoice(false)
                },
              }, t('voicesSave'))))) : null

        return h('div', { className: 'mel', 'data-style': style, 'data-w': wcls, ref: rootRef, lang },
          view === 'ultra' ? null : h(QuietBoundary, null, h(Backdrop, { style, grow: view === 'cards', lang, showArch: view !== 'home' })),
          h('div', { className: 'mel-navbar' }, tabs),
          h('div', { className: view === 'home' ? 'mel-wrap mel-wrap-home' : 'mel-wrap' },
            view === 'cards' || view === 'home' ? null : hero,
            body,
            voiceModal,
            addVoiceModal,
            h('div', { className: 'mel-corner' }, t(`corner${style.charAt(0).toUpperCase()}${style.slice(1)}`))))
      }
    }

    // ---------- 注册 ----------
    const inject = ['slots', 'locale']
    function apply(ctx) {
      const sidebarDicts = {}
      for (const [lang, term] of Object.entries(TERMS)) sidebarDicts[lang] = { sidebar: term }
      ctx.effect(() => ctx.locale.register(NS, sidebarDicts), 'melete: dictionaries')
      const t = ctx.locale.bind(NS)
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 30,
        locale: NS,
        label: () => t('sidebar'),
      }, Icon))
      const Page = makePage(ctx)
      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      }, Page))
    }

    const module = { exports: {} }
    Object.defineProperty(module.exports, Symbol.toStringTag, { value: 'Module' })
    module.exports.apply = apply
    module.exports.inject = inject
    return module.exports
  },
})
