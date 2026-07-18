# AGENTS.md — 口算机器人（AI 维护指南）

> 本文件面向后续修改本项目的 AI。用户侧的启动说明在 `README.md`，不要重复搬运。
> 修改任何代码前请先通读本文件，修改后请同步更新本文件。

## 项目是什么

给小学生用的口算练习网页应用：乘法 / 加法 / 减法（各 5 个难度）+ 除法（4 个难度，**保证整除**：先定除数和商再反推被除数）；出题规则：**乘法不出现 1、加法必须进位（个位相加 ≥ 10）、减法必须退位（被减数个位 < 减数个位）**，不满足重出；可设题数（1~50）；随机出题且**局内不重复**（乘法/加法交换两数算同题）；浏览器语音读题 → 孩子语音回答（即时识别，数字稳定 0.7 秒即判）→ 自动打分 → 结束出**得分率（百分比）**和错题回顾，并按四档百分比说鼓励语（100=「哇噻！你棒呆啦！」/ >98=「很棒哦！」/ >95=「有点棒，加油！」/ 其余=「哦哦，要使劲加油哦！」）。两种陪伴角色：**擎天柱**（低沉男声说「嘟嘟，好棒！」/「嘟嘟，加油！」，答对高跳+排气管喷烟）和**公主**（甜美声调说「真棒！」/「加油！」，答对转圈+魔杖星光，粉色主题+花园背景）。角色是纯 SVG，三个界面陪伴（待机眨眼/摇摆/随机小动作、聆听思考、满分彩带）。「⚙ 设置」按钮在设置页角色下方，弹窗内容（**localStorage 持久化**）：默认模式（擎天柱）、按模式自定义答对/答错台词（留空回退角色默认）、每次默认题数（30）。设置页为**左角色右控件两栏布局**（无标题栏，右侧卡片从「题型」开始，控件已紧凑化：难度项 padding 6px、页签 8px、屏幕内边距 14px，一屏放下不滚动；左列整体上移 16px 让角色图片视觉垂直居中；**支持回车开始练习**，焦点在按钮上时走原生点击不重复触发）；练习页同为左角色右题目两栏。窄屏（≤760px）全部收为单栏：角色区改为机器人+气泡横排、按钮换行居中，控件紧凑化并适配 iPhone 安全区。手机、电脑浏览器都能用，且是完整 PWA：PNG 图标 + standalone 清单 + 离线缓存，设置页有「📲 安装App」按钮（安卓弹原生安装框、iOS 给添加到主屏幕指引），部署到任意 HTTPS 静态托管后即可分享给朋友安装（步骤见 `安装分享指南.md`）。

## 硬约束（不要违反）

- **零依赖**：纯静态前端 + 浏览器原生 Web Speech API，不引入任何 npm 包、CDN 库、框架。
- **无构建步骤**：`app.js` 就是浏览器直接加载的原生 JS（IIFE，非模块），不要用 import/export、TS、打包器。
- **必须经 `http://localhost:8000` 访问**：`file://` 协议下浏览器会每题都弹麦克风权限；localhost 是安全上下文，权限只弹一次。任何改动不能破坏这一前提（server.js 由 `node server.js` 启动，只用 Node 内置模块）。
- **UI 文案全中文**，面向儿童；注释也用中文，风格与现有代码一致。

## 文件结构

```
index.html          三个界面（setup/quiz/result）的 DOM；设置页无标题栏、左角色右控件两栏布局（右侧卡片从题型开始，角色下方 .side-btn-row 内有设置按钮 #settings-btn 和安装按钮 #install-btn）；含题型按钮（.op-tab[data-op]）、机器人插槽 .robot-slot 和气泡、公主模式花园容器 #flower-field、设置弹窗 #settings-modal（内含模式切换 .settings-mode-tab，**必须在 `<script>` 之前**，app.js 立即执行按 id 取元素）；head 里有 PWA/iOS meta（theme-color、apple-touch-icon 等）；script 只引 app.js
styles.css          全部样式（CSS 变量定义主题色；含角色动画、电路纹理背景、电池进度条、公主模式粉色主题与花园、两栏布局、设置弹窗）；手机端媒体查询在文件末尾（≤760px 单栏：角色区横排、气泡三角改朝左、控件紧凑、safe-area 适配；≤480px 再收小机器人与按钮）
app.js              全部逻辑（1166 行，单 IIFE，下方详解）
manifest.json       PWA 清单（名称「口算机器人」，display standalone、orientation portrait），图标是 PNG 文件（192/512，purpose any + maskable）
icon-192.png / icon-512.png / apple-touch-icon.png   PWA 与 iOS 主屏幕图标（擎天柱头盔，PIL 生成，要换风格重新画图导出同名文件即可）
service-worker.js   离线缓存（**网络优先**：先 fetch 最新代码并写缓存，断网才回退缓存——避免旧缓存导致"改了不生效"），缓存名 math-practice-v15（改任何前端文件都要升这个版本号）
server.js           Node 静态服务器，PORT/HOST 环境变量可改（默认 8000 / 0.0.0.0，监听所有网卡并在启动时打印局域网 IP，方便手机同 WiFi 试玩）
start-server.bat    Windows 一键启动：先开浏览器 http://localhost:8000 再 node server.js
server.log          服务器运行日志（运行时产物，勿提交逻辑依赖它）
README.md           用户启动说明
安装分享指南.md      手机安装与分享给朋友的步骤（部署 HTTPS 静态托管 → 添加到主屏幕）
```

## app.js 结构（自上而下）

- `DIFFICULTIES`：题型/难度配置表（key/label/desc），除法 4 档（d1~d4）其余各 5 档。**加减乘除难度档位只改这里 + `generateQuestion()` 的取值区间**，两处必须同步。
- `CHARACTERS`：双角色配置表（optimus / princess）。每项含 `svg`（纯 SVG 模板字符串，`setMode()` 注入到所有 `.robot-slot`）、`praise`/`encourage`（答对/答错台词的**默认值**，运行时被 `settings.lines` 覆盖）、`greeting`（设置页问候语，含 `<br>`）、`voice`（`speak()` 的 opts：male/rate/pitch）。结果页的四档成绩鼓励语是共用文案，写在 `showResult()` 里。两个角色的部件 class 约定一致（`robot-eye-left/right`、`robot-antenna`（擎天柱=头盔耳翼、公主=皇冠）、`robot-arm-left/right`、`robot-smoke-left/right`（擎天柱=排气管烟雾、公主=魔杖星光）、`robot-shadow`、`robot-brows-normal`（公主日常淡眉，sad 时隐藏）等），styles.css 靠这些 class 做动画和表情切换；改造型两边同步。
- `ROBOT_LINES`：气泡文案库（只剩 question 出题引导，两角色共用；答对/答错台词已挪进 `CHARACTERS`），`pick()` 随机取。
- `state`：全局状态（mode（当前角色）、operation、difficulty、count、questions、currentIndex、score、wrong、isAnswering）。
- 角色模块：`setMode(mode)` 切角色（换 body.mode-princess 类、重注所有 `.robot-slot` 的 SVG、换设置页问候语）；`buildFlowers()` 往 `#flower-field` 撒 26 朵摇摆的花（仅公主模式显示，纯 emoji 无依赖）。
- 设置模块（localStorage 持久化，key `math-practice-settings`）：`settings = { mode, defaultCount, lines: { optimus: {praise, encourage}, princess: {...} } }`。`loadSettings()` 读档并与默认值合并（坏 JSON/脏数据自动回退）；`persistSettings()` 写档（try/catch 兜底）；弹窗流程 `openSettings()`（台词先进 `settingsDraft` 草稿）→ 面板内切模式 `stashSettingsLineInputs()` 收草稿 → `saveSettingsFromModal()`（留空回退角色默认、题数钳 1~50、写档、立即 `setMode()` + 更新题数输入框）/`closeSettings()`。`handleAnswer()` 的台词取 `settings.lines[state.mode]`，`CHARACTERS[*].praise/encourage` 只是默认值。
- 机器人模块：`setRobotState(wrap, class)` 切换 `robot-happy/sad/thinking`；`launchConfetti()/clearConfetti()` 满分彩带；`startRobotIdleActions()` 让设置页角色每 4.2 秒随机做小动作（`robot-wink` 单眼眨 / `robot-wave-once` 挥手，仅设置页激活时触发）。
- 语音模块：
  - `getBestChineseVoice(preferMale)`：按名单挑 Edge/Chrome 在线自然语音，`preferMale=true` 时男声（Yunyang/Yunjian 等）靠前，否则女声（Xiaoxiao 等）靠前；再回退 Natural/Neural 关键词、第一个中文语音。语音列表走 `cachedVoices` 缓存（`refreshVoices()` 在 `initSpeech()` 预热、`voiceschanged` 和每次 `speak()` 时刷新——**首次 `getVoices()` 可能为空，不预热会导致第一题用默认呆板声音**）。要换发音风格就改这两个名单 + `speak()` 里的默认 `rate 0.88 / pitch 1.05`。
  - `speak(text, onEnd, opts)`：`opts` 可传 `{ male, rate, pitch }` 覆盖默认（角色嗓音存在 `CHARACTERS[*].voice`，答对/答错时传入）；开头先停掉进行中的识别（避免录到机器声），`speechSynthesis.cancel()` 后 speak，`utter.onend` 触发回调。**已知风险：某些浏览器 onend 不触发会导致后续流程卡住，改动时留意。**浏览器 TTS 无法真正还原角色原声，嗓音只是参数近似，效果需实测。
  - `initSpeech()`：创建 `SpeechRecognition`，`lang zh-CN`、`maxAlternatives 3`、**`interimResults true`**（边说边出结果）。onresult 里：最终结果立即 `recognition.stop()` + `handleAnswer()`；**临时结果实时显示"听到了：N"，且数字稳定 700ms（`interimTimer` 防抖）就提前判定**——这是识别响应速度的关键，别改回只等最终结果。`clearInterimTimer()` 在 onstart/onerror/quit 时清理。
  - `ensureMicStream()` / `stopMicStream()`：练习开始时 getUserMedia 拿流并**全程保持不关**（这是避免反复弹权限的关键之一），quit/返回首页时才 stop。
- 出题：`generateQuestion()` 按 operation+difficulty 定 a、b 区间；减法保证 `a >= b`（结果非负）；**除法保证整除**：先定除数 b 和商 q 再算被除数 `a = b × q`（d3 商为 1 位数、d4 商为 2 位数，区间用 `Math.ceil/Math.floor` 卡被除数位数）；**规则约束**（同一函数内的 100 次重试循环）：乘法两数都 ≥ 2（不出现 1）、加法必须进位（`(a%10)+(b%10) >= 10`）、减法必须退位（`a%10 < b%10`），不满足就 continue 重出。`generateQuestions()` **带去重**：乘法/加法以 `(min,max)` 为 key（交换算同题），减法/除法按原顺序；每题重试 100 次仍撞重则降级为只排除完全相同（题池不足时兜底），保证出满数量。
- 流程主线：`startQuiz()`（读题数→生成题→`await ensureMicStream()`→切 quiz 屏→`showQuestion()`）→ `showQuestion()`（显示题目→机器人气泡给引导语→`readQuestion` 朗读→朗读结束的回调里 `setTimeout(startListening, 200)` 自动开麦）→ 识别成功 `handleAnswer()`（判分→角色 happy/sad 表情+气泡→角色嗓音语音反馈→`nextQuestion()`）→ 最后一题后 `showResult()`（**得分率百分比**圆环 + 错题列表 + 按四档百分比（100 / >98 / >95 / 其余）说鼓励语 + 角色按成绩反应，满分放彩带）。
- `parseNumber(text)`：先匹配阿拉伯数字，再自写中文数字解析（零一二两三四五六七八九 + 十百千，支持"十五""一百零五"；不含"万"）。识别准确率要提升就改这里和 `maxAlternatives`。
- PWA 安装模块：`setupInstallPrompt()`（init 末尾调用）——捕获 `beforeinstallprompt` 存 `deferredInstallPrompt` 并显示「📲 安装App」按钮，点击弹原生安装框；iOS 无此事件则常显按钮、点击 alert「添加到主屏幕」指引；已处于 standalone（已安装）时按钮不显示，`appinstalled` 后隐藏。
- 麦克风按钮（`listen-btn`）只是"点击重说"的兜底，正常流程不需要用户点。

## 修改时的常见任务定位

| 需求 | 改哪里 |
|---|---|
| 加/改难度 | `DIFFICULTIES` + `generateQuestion()` 的区间（两处同步） |
| 换发音/语速语调 | `getBestChineseVoice()` 名单、`speak()` 的 rate/pitch、角色嗓音 `CHARACTERS[*].voice` |
| 加/换陪伴角色 | `CHARACTERS`（app.js）+ `setMode()` + 设置弹窗里的 `.settings-mode-tab` 按钮 |
| 提高识别率 | `maxAlternatives`、`parseNumber()` |
| 调识别响应速度 | `initSpeech()` onresult 里的 700ms 防抖值（调大防误触，调小更灵敏） |
| 改角色造型 | `CHARACTERS[*].svg`（app.js）+ styles.css 机器人段的动画 class，两边同步 |
| 改角色表情/动作 | styles.css 的 `robot-happy/sad/thinking/wink/wave-once` 规则与 `prime-*` keyframes（含喷烟/星光）、公主专用 `princess-spin` |
| 改公主主题/花园 | styles.css 的 `body.mode-princess` 系列规则 + app.js `buildFlowers()` |
| 改形象大小 | styles.css 的 `robot-lg/md/sm .robot-slot` 宽度 + 媒体查询 |
| 改气泡文案 | `CHARACTERS[*]` 的 praise/encourage/greeting（前两者只是默认值，运行时被 `settings.lines` 覆盖）、`ROBOT_LINES.question`、成绩四档鼓励语在 `showResult()` |
| 改设置项/默认值 | `loadSettings()` 的 defaults、index.html 的 `#settings-modal`、`saveSettingsFromModal()` |
| 改小动作频率 | `startRobotIdleActions()` 的 4200ms 间隔与 actions 列表 |
| 改题数上限 | `startQuiz()` 的 50、`bindEvents()` 里 countBtns/countInput 的钳制、index.html 的 max |
| 改端口 | `server.js` 的 PORT（或环境变量）、`start-server.bat` 里的 URL |
| 加缓存文件 | `service-worker.js` 的 ASSETS，并升 `CACHE_NAME` 版本号 |
| 改 PWA 安装 | `setupInstallPrompt()`（app.js）、`manifest.json`、index.html 的 PWA meta、`#install-btn`；图标换图重导三个 PNG |
| 改手机端布局 | styles.css 末尾的 `max-width: 760px / 480px` 媒体查询（角色区横排、控件紧凑） |

## 线上部署（GitHub Pages）

- 仓库：https://github.com/fanque123/math-practice-app （公开，main 分支）；Pages 从 `main` 根目录发布，线上地址 **https://fanque123.github.io/math-practice-app/**。
- 本地已是 git 仓库（remote `origin` 指向上面的仓库，`.gitignore` 只排除 `server.log`）。**不要 `git commit/push` 或做任何 git 变更操作，除非用户明确要求。**
- **推送凭据的坑**：本机凭据管理器里存的是另一个企业托管账号（Kitty-Fan_sgsdev，不能建公开仓库），直接 push 会被它顶掉报 `invalid credentials`。fanque123 的授权走 GitHub 设备流（client_id `178c6fc778ccc68e1d6a`，scope `repo`）拿临时令牌，推送时用 `git -c credential.helper= push "https://x-access-token:<TOKEN>@github.com/fanque123/math-practice-app.git" main:main`（令牌内联在 URL 里，不落 remote 配置、不存凭据管理器）。令牌失效就重新走一遍设备流。
- **线上更新流程**：改代码 → 升 `service-worker.js` 的 `CACHE_NAME` → commit + push。Pages 构建约 1 分钟；用户端 SW 是网络优先，打开两次内自动拿到新版。

## 修改后验证（本会话工作目录在 C:/Windows/System32，项目实际路径要用绝对路径）

1. `node --check "C:/Users/KITTY_FAN/Desktop/math-practice-app/app.js"`（语法检查）。
2. 若 8000 端口已有 server 在跑（`netstat -ano | findstr :8000` 查），它实时读盘，无需重启；curl 验证输出为新代码：`curl -s http://localhost:8000/app.js | findstr <新标识>`。
3. 未启动则 `node server.js`（或 start-server.bat），浏览器开 `http://localhost:8000`。
4. **语音链路（权限弹窗次数、TTS 结束自动开麦、识别准确率、机器人动画实际观感）无法在命令行实测，必须声明"需用户实测"，不能自称已验证。**

## 已知限制与注意事项

- **DOM 顺序约束**：app.js 在 body 末尾以普通 `<script>` 立即执行，它 `getElementById` 的所有元素必须出现在 `<script>` 标签**之前**；把元素加到 script 之后会让绑定整块报错中断（按钮全部没反应）。改动后用 node 脚本对比 id 清单可快速自查。
- 浏览器安全模型决定**第一次麦克风授权无法绕过**（用户需在地址栏锁形图标里设为"允许"），这不是 bug，别试图绕过。
- ~~`voiceschanged`：部分浏览器首次 `getVoices()` 为空~~（已修复：`initSpeech()` 预热语音列表 + 监听 `voiceschanged` + 每次 `speak()` 前 `refreshVoices()`，避免第一题声音呆板）。
- service-worker 是**网络优先**：localhost 下总是拿到最新代码；若浏览器仍显示旧版，硬刷新（Ctrl+F5）一次让新 SW 接管即可。
- **即时识别的防抖取舍**：临时结果稳定 700ms 即判定。若孩子说多位数习惯中间长停顿（如"一百……二十三"），停顿超 700ms 会把前半截当答案——遇到此类反馈就调大该值。
- **出题去重的兜底**：题池不足时（目前只有 m1 乘法口诀 2~9 共 36 题，要 >36 题才会触发）允许交换重复的题出现，但绝不出现完全相同的题。
- 不要 `git commit/push` 或做任何 git 变更操作，除非用户明确要求。
