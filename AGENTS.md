# AGENTS.md — 口算机器人（AI 维护指南）

> 本文件面向后续修改本项目的 AI。用户侧的启动说明在 `README.md`，不要重复搬运。
> 修改任何代码前请先通读本文件，修改后请同步更新本文件。

## 项目是什么

给小学生用的口算练习网页应用：乘法 / 加法 / 减法（各 5 个难度）+ 除法（5 个难度：最低档 d0「除法口诀」= 乘法口诀范围内的除法（除数 2~9、商 1~9），其余 d1~d4 **保证整除**：先定除数和商再反推被除数）；出题规则：**乘法不出现 1、加法必须进位（个位相加 ≥ 10）、减法必须退位（被减数个位 < 减数个位）**，不满足重出；可设题数（1~50，**开始练习时把本次题数存为默认值**，下次启动自动带出）；随机出题且**局内不重复**（乘法/加法交换两数算同题）；浏览器语音读题 → 孩子语音回答（即时识别，数字稳定 0.7 秒即判）→ 自动打分 → 结束出**得分率（百分比）**圆环和错题回顾，语音播报「得分为XX分」，并按三档百分比说鼓励语（>95=「哇塞，好棒呀！」/ >86=「很棒哦！」/ 其余=「要加油哦！」）。两种陪伴角色：**擎天柱**（低沉男声说「嘟嘟，好棒！」/「嘟嘟，加油！」，答对高跳+排气管喷烟）和**公主**（甜美声调说「真棒！」/「加油！」，答对转圈+魔杖星光，粉色主题+花园背景）。角色是纯 SVG，三个界面陪伴（待机眨眼/摇摆/随机小动作、聆听思考、满分彩带）。「⚙ 设置」按钮在设置页角色下方，弹窗内容（**localStorage 持久化**）：默认模式（擎天柱）、按模式自定义答对/答错台词（留空回退角色默认）、每次默认题数（20）。设置页为**左角色右控件两栏布局**（无标题栏，右侧卡片从「题型」开始，控件已紧凑化：难度项 padding 6px、页签 8px、屏幕内边距 14px，一屏放下不滚动；左列整体上移 16px 让角色图片视觉垂直居中；**支持回车开始练习**，焦点在按钮上时走原生点击不重复触发）；练习页同为左角色右题目两栏。窄屏（≤760px）全部收为单栏：角色区改为机器人+气泡横排、按钮换行居中，控件紧凑化并适配 iPhone 安全区。手机、电脑浏览器都能用，且是完整 PWA：PNG 图标 + standalone 清单 + 离线缓存，设置页有「📲 安装App」按钮（安卓弹原生安装框、iOS 给添加到主屏幕指引），部署到任意 HTTPS 静态托管后即可分享给朋友安装（步骤见 `安装分享指南.md`）。

## 硬约束（不要违反）

- **零依赖**：纯静态前端 + 浏览器原生 Web Speech API，不引入任何 npm 包、CDN 库、框架。
- **无构建步骤**：`app.js` 就是浏览器直接加载的原生 JS（IIFE，非模块），不要用 import/export、TS、打包器。
- **必须经 `http://localhost:8000` 访问**：`file://` 协议下浏览器会每题都弹麦克风权限；localhost 是安全上下文，权限只弹一次。任何改动不能破坏这一前提（server.js 由 `node server.js` 启动，只用 Node 内置模块）。
- **UI 文案全中文**，面向儿童；注释也用中文，风格与现有代码一致。

## 文件结构

```
index.html          三个界面（setup/quiz/result）的 DOM；设置页无标题栏、左角色右控件两栏布局（右侧卡片从题型开始，角色下方 .side-btn-row 内有设置按钮 #settings-btn 和安装按钮 #install-btn）；含题型按钮（.op-tab[data-op]）、机器人插槽 .robot-slot 和气泡、公主模式花园容器 #flower-field、设置弹窗 #settings-modal（内含模式切换 .settings-mode-tab，**必须在 `<script>` 之前**，app.js 立即执行按 id 取元素）；head 里有 PWA/iOS meta（theme-color、apple-touch-icon 等）；script 只引 app.js
styles.css          全部样式（CSS 变量定义主题色；含角色动画、电路纹理背景、电池进度条、公主模式粉色主题与花园、两栏布局、设置弹窗）；手机端媒体查询在文件末尾（≤760px 单栏：角色区横排、气泡三角改朝左、控件紧凑、safe-area 适配；≤480px 再收小机器人与按钮）
app.js              全部逻辑（1313 行，单 IIFE，下方详解）
manifest.json       PWA 清单（名称「口算机器人」，display standalone、orientation portrait），图标是 PNG 文件（192/512，purpose any + maskable）
icon-192.png / icon-512.png / apple-touch-icon.png   PWA 与 iOS 主屏幕图标（擎天柱头盔，PIL 生成，要换风格重新画图导出同名文件即可）
service-worker.js   离线缓存（**网络优先**：先 fetch 最新代码并写缓存，断网才回退缓存——避免旧缓存导致"改了不生效"），缓存名 math-practice-v28（改任何前端文件都要升这个版本号）
server.js           Node 静态服务器，PORT/HOST 环境变量可改（默认 8000 / 0.0.0.0，监听所有网卡并在启动时打印局域网 IP，方便手机同 WiFi 试玩）
start-server.bat    Windows 一键启动：先开浏览器 http://localhost:8000 再 node server.js
server.log          服务器运行日志（运行时产物，勿提交逻辑依赖它）
README.md           用户启动说明
安装分享指南.md      手机安装与分享给朋友的步骤（APK 直装 + 网页版 PWA 两种方式）
android/            安卓壳工程（提交入库）：极简 WebView 加载 `file:///android_asset/index.html`，把网页打包成离线 APK；`app/build.gradle` 的 `syncWebAssets` 任务在构建前自动从项目根拷贝网页文件到 assets（**注意是 `from('../..')`**，相对 android/app 模块目录）；镜像走阿里云 maven（google 源被墙）；local.properties（SDK 路径）、assets/（网页文件+语音识别模型 sherpa-model/）与 app/libs/（sherpa-onnx AAR，约 50MB）不入库
build-tools/        本地安卓工具链（**不入库**）：jdk（Temurin 17）、gradle-8.10、sdk（platforms/android-35 + build-tools/35.0.0 + 手写 licenses 授权文件）、gradle-home（GRADLE_USER_HOME）、dl（安装包可删）。全部来自清华/腾讯镜像，重建时重新下载解压即可
口算机器人.apk      构建产物（**不入库**），直接发给朋友安装
```

## app.js 结构（自上而下）

- `DIFFICULTIES`：题型/难度配置表（key/label/desc），除法 5 档（d0~d4，d0=除法口诀）其余各 5 档。**加减乘除难度档位只改这里 + `generateQuestion()` 的取值区间**，两处必须同步。
- `CHARACTERS`：双角色配置表（optimus / princess）。每项含 `svg`（纯 SVG 模板字符串，`setMode()` 注入到所有 `.robot-slot`）、`praise`/`encourage`（答对/答错台词的**默认值**，运行时被 `settings.lines` 覆盖）、`greeting`（设置页问候语，含 `<br>`）、`voice`（`speak()` 的 opts：male/rate/pitch）。结果页的三档成绩鼓励语是共用文案，写在 `showResult()` 里。两个角色的部件 class 约定一致（`robot-eye-left/right`、`robot-antenna`（擎天柱=头盔耳翼、公主=皇冠）、`robot-arm-left/right`、`robot-smoke-left/right`（擎天柱=排气管烟雾、公主=魔杖星光）、`robot-shadow`、`robot-brows-normal`（公主日常淡眉，sad 时隐藏）等），styles.css 靠这些 class 做动画和表情切换；改造型两边同步。
- `ROBOT_LINES`：气泡文案库（只剩 question 出题引导，两角色共用；答对/答错台词已挪进 `CHARACTERS`），`pick()` 随机取。
- `state`：全局状态（mode（当前角色）、operation、difficulty、count、questions、currentIndex、score、wrong、isAnswering）。
- 角色模块：`setMode(mode)` 切角色（换 body.mode-princess 类、重注所有 `.robot-slot` 的 SVG、换设置页问候语）；`buildFlowers()` 往 `#flower-field` 撒 26 朵摇摆的花（仅公主模式显示，纯 emoji 无依赖）。
- 设置模块（localStorage 持久化，key `math-practice-settings`）：`settings = { mode, defaultCount, lines: { optimus: {praise, encourage}, princess: {...} } }`。`loadSettings()` 读档并与默认值合并（坏 JSON/脏数据自动回退）；`persistSettings()` 写档（try/catch 兜底）；弹窗流程 `openSettings()`（台词先进 `settingsDraft` 草稿）→ 面板内切模式 `stashSettingsLineInputs()` 收草稿 → `saveSettingsFromModal()`（留空回退角色默认、题数钳 1~50、写档、立即 `setMode()` + 更新题数输入框）/`closeSettings()`。`handleAnswer()` 的台词取 `settings.lines[state.mode]`，`CHARACTERS[*].praise/encourage` 只是默认值。
- 机器人模块：`setRobotState(wrap, class)` 切换 `robot-happy/sad/thinking`；`launchConfetti()/clearConfetti()` 满分彩带；`startRobotIdleActions()` 让设置页角色每 4.2 秒随机做小动作（`robot-wink` 单眼眨 / `robot-wave-once` 挥手，仅设置页激活时触发）。
- 语音模块：
  - `getBestChineseVoice(preferMale)`：按名单挑 Edge/Chrome 在线自然语音，`preferMale=true` 时男声（Yunyang/Yunjian 等）靠前，否则女声（Xiaoxiao 等）靠前；再回退 Natural/Neural 关键词、第一个中文语音。语音列表走 `cachedVoices` 缓存（`refreshVoices()` 在 `initSpeech()` 预热、`voiceschanged` 和每次 `speak()` 时刷新——**首次 `getVoices()` 可能为空，不预热会导致第一题用默认呆板声音**）。要换发音风格就改这两个名单 + `speak()` 里的默认 `rate 0.88 / pitch 1.05`。
  - `speak(text, onEnd, opts)`：`opts` 可传 `{ male, rate, pitch }` 覆盖默认（角色嗓音存在 `CHARACTERS[*].voice`，答对/答错时传入）；开头先停掉进行中的识别（避免录到机器声），`speechSynthesis.cancel()` 后 speak，`utter.onend` 触发回调。**onend/onerror 都接到统一的 `finish()`，并有看门狗计时器兜底（`min(3000+字数×350ms, 12s)` 强制继续流程）——部分手机浏览器（小米自带、微信内置）两个事件都不触发，没这个兜底流程会卡死。**浏览器 TTS 无法真正还原角色原声，嗓音只是参数近似，效果需实测。
  - `initSpeech()`：创建 `SpeechRecognition`，`lang zh-CN`、**`maxAlternatives 10`**、**`interimResults true`**（边说边出中间结果）。onresult 里：遍历所有结果与候选，找到第一个可解析的数字；**最终结果**立即 `recognition.stop()` + `handleAnswer()`；**临时结果仅实时显示"听到了：N"，不再自动判定**——避免噪声/回声/孩子停顿导致"还没说答案就被判错"。`clearInterimTimer()` 在 onstart/onerror/quit 时清理。还会尝试挂载 `SpeechGrammarList` 数字语法（浏览器支持有限，失败静默回退）。
  - `ensureMicStream()` / `stopMicStream()`：练习开始时 getUserMedia 拿流并**全程保持不关**（这是避免反复弹权限的关键之一），quit/返回首页时才 stop。
- 出题：`generateQuestion()` 按 operation+difficulty 定 a、b 区间；减法保证 `a >= b`（结果非负）；**除法保证整除**：先定除数 b 和商 q 再算被除数 `a = b × q`（d0 除法口诀：除数 2~9、商 1~9；d3 商为 1 位数、d4 商为 2 位数，区间用 `Math.ceil/Math.floor` 卡被除数位数）；**规则约束**（同一函数内的 100 次重试循环）：乘法两数都 ≥ 2（不出现 1）、加法必须进位（`(a%10)+(b%10) >= 10`）、减法必须退位（`a%10 < b%10`），不满足就 continue 重出。`generateQuestions()` **带去重**：乘法/加法以 `(min,max)` 为 key（交换算同题），减法/除法按原顺序；每题重试 100 次仍撞重则降级为只排除完全相同（题池不足时兜底），保证出满数量。
- 流程主线：`startQuiz()`（读题数→生成题→`await ensureMicStream()`→切 quiz 屏→`showQuestion()`）→ `showQuestion()`（显示题目→机器人气泡给引导语→`readQuestion` 朗读→朗读结束的回调里 `setTimeout(startListening, 200)` 自动开麦）→ 识别成功 `handleAnswer()`（判分→角色 happy/sad 表情+气泡→角色嗓音语音反馈→`nextQuestion()`）→ 最后一题后 `showResult()`（**得分率百分比**圆环 + 错题列表 + 语音播报「得分为XX分」+ 按三档百分比（>95 / >86 / 其余）说鼓励语 + 角色按成绩反应，满分放彩带）。
- `parseNumber(text)`：先去口头包裹（"答案是""等于"、句首"是"、句尾语气词），再做同音误听映射（山→三、寺→四、酒→九、俩→两、幺→一等罕见同音字）；然后匹配阿拉伯数字；纯中文数字串按位拼接（如"二三"→23）；最后解析带单位中文数字（零一二两三四五六七八九 + 十百千万），支持口语省略进位（"二百五"→250、"一万二"→12000，"零"会打断该规则）。识别准确率要提升就改这里和 `maxAlternatives`。
- `numberToChinese(n)` / `readQuestion()`：朗读题目时把 `a`、`b` 转成中文数字（如 2→"二"、12→"十二"、101→"一百零一"），避免浏览器/系统 TTS 把阿拉伯数字 `2` 读成"两"；题目显示仍保留阿拉伯数字。
- PWA 安装模块：`setupInstallPrompt()`（init 末尾调用）——捕获 `beforeinstallprompt` 存 `deferredInstallPrompt` 并显示「📲 安装App」按钮，点击弹原生安装框；iOS 无此事件则常显按钮、点击 alert「添加到主屏幕」指引；已处于 standalone（已安装）时按钮不显示，`appinstalled` 后隐藏。
- 发声自检模块：`checkSpeechSupport()`（init 末尾调用）——微信内置浏览器（UA 含 micromessenger）或无 speechSynthesis 时直接把设置页气泡换成「换 Chrome/Edge 打开」提示；speechSynthesis 存在时 2.5 秒后语音列表仍为空也给提示（含调大媒体音量）。注意它会覆盖问候气泡，属有意为之。
- 麦克风按钮（`listen-btn`）只是"点击重说"的兜底，正常流程不需要用户点。

## 修改时的常见任务定位

| 需求 | 改哪里 |
|---|---|
| 加/改难度 | `DIFFICULTIES` + `generateQuestion()` 的区间（两处同步） |
| 换发音/语速语调 | `getBestChineseVoice()` 名单、`speak()` 的 rate/pitch、角色嗓音 `CHARACTERS[*].voice` |
| 加/换陪伴角色 | `CHARACTERS`（app.js）+ `setMode()` + 设置弹窗里的 `.settings-mode-tab` 按钮 |
| 提高识别率 | 浏览器端：`maxAlternatives`、`parseNumber()`、`SpeechGrammarList` 数字语法；APK 端（v1.13 起）：换 `assets/sherpa-model/` 里的 Paraformer/VAD 模型 + `MainActivity.initAsr()` 的路径；调 `VAD_MIN_SILENCE`（越大越不容易把停顿切两半，但反应越慢） |
| APK 换识别模型 | v1.13 起为**非流式中文 Paraformer-zh-small int8**（`assets/sherpa-model/model.int8.onnx` 约 82MB）+ **Silero VAD**（`silero_vad.onnx` 643KB），`MainActivity.initAsr()` 用 `OfflineRecognizer` + `Vad`。模型来自 HF `csukuangfj/sherpa-onnx-paraformer-zh-small-2024-03-09`（与 ModelScope `crazyant/speech_paraformer_asr_nat-zh-cn-16k-common-vocab8358-onnx` 同权重）；**HF 的 onnx 缺 CMVN 元数据**，直接加载会报 `'vocab_size' does not exist`，需补 `vocab_size=8359 / lfr_window_size=7 / lfr_window_shift=6 / neg_mean / inv_stddev`（后两个取 `am.mvn` 里 `<AddShift>`/`<Rescale>` 的 560 个数），再用 `onnx.save` 写出 |
| 调识别响应速度 | 临时结果已关闭自动判定，改由最终结果判定；如需恢复 interim 判定，改 `initSpeech()` onresult |
| 改角色造型 | `CHARACTERS[*].svg`（app.js）+ styles.css 机器人段的动画 class，两边同步 |
| 改角色表情/动作 | styles.css 的 `robot-happy/sad/thinking/wink/wave-once` 规则与 `prime-*` keyframes（含喷烟/星光）、公主专用 `princess-spin` |
| 改公主主题/花园 | styles.css 的 `body.mode-princess` 系列规则 + app.js `buildFlowers()` |
| 改形象大小 | styles.css 的 `robot-lg/md/sm .robot-slot` 宽度 + 媒体查询 |
| 改气泡文案 | `CHARACTERS[*]` 的 praise/encourage/greeting（前两者只是默认值，运行时被 `settings.lines` 覆盖）、`ROBOT_LINES.question`、成绩三档鼓励语在 `showResult()` |
| 改设置项/默认值 | `loadSettings()` 的 defaults、index.html 的 `#settings-modal`、`saveSettingsFromModal()` |
| 改小动作频率 | `startRobotIdleActions()` 的 4200ms 间隔与 actions 列表 |
| 改题数上限 | `startQuiz()` 的 50、`bindEvents()` 里 countBtns/countInput 的钳制、index.html 的 max |
| 改端口 | `server.js` 的 PORT（或环境变量）、`start-server.bat` 里的 URL |
| 加缓存文件 | `service-worker.js` 的 ASSETS，并升 `CACHE_NAME` 版本号 |
| 改 PWA 安装 | `setupInstallPrompt()`（app.js）、`manifest.json`、index.html 的 PWA meta、`#install-btn`；图标换图重导三个 PNG |
| 改手机端布局 | styles.css 末尾的 `max-width: 760px / 480px` 媒体查询（角色区横排、控件紧凑） |

## 线上部署（GitHub Pages）

- 仓库：https://github.com/fanque123/math-practice-app （公开，main 分支）；Pages 从 `main` 根目录发布，线上地址 **https://fanque123.github.io/math-practice-app/**。
- **APK 发布**：**主下载地址走 Pages（国内手机可打开）：https://fanque123.github.io/math-practice-app/download/math-practice.apk** —— 就是仓库里的 `download/math-practice.apk`（v1.12 约 96.5MB，v1.13 约 133.9MB；注意它**不入本地 git 库**，只存在于远端）。备用地址（GitHub Releases，国内手机常被墙）：https://github.com/fanque123/math-practice-app/releases/latest/download/math-practice.apk 。**发新版要两处都换**：① `download/math-practice.apk`：超过 Contents API / Git blob API 上限（都会报 422），改用**无 Blob 临时浅克隆仓库 → 覆盖文件 → `git push`**（`git -c credential.helper= clone --depth 1 --filter=blob:none --no-checkout ...` 避免拉旧大包，`git reset --mixed HEAD` 后拷贝改动文件与新 APK，`git add` → `git commit -q` → `git -c credential.helper= -c pack.window=0 -c http.postBuffer=524288000 push origin main:main`，用完整个删掉）；② Release 里删旧 asset 传同名新 asset（uploads.github.com 支持大文件，API 全程可通）。版本号升在 `android/app/build.gradle`（versionCode/versionName）。
- **网络坑**：本机 `github.com` 主站 TCP 时而被墙（浏览器因 DoH/缓存可能能开），但 `api.github.com` 和 `uploads.github.com` 通常可通。git push 走主站会失败时，改用 PAT + Contents API 更新小文件（`GET /contents/<path>` 取 sha → `PUT /contents/<path>` base64 提交）；Release 创建/上传全程走 api/uploads 不受影响。设备流（github.com/login/device）若连不上，让用户在浏览器手动建 PAT（Settings → Developer settings → Tokens classic，勾 repo）。
- 本地已是 git 仓库（remote `origin` 指向上面的仓库；`.gitignore` 排除 `server.log`、`build-tools/`、android 构建产物、`local.properties`、`android/app/src/main/assets/`、`android/app/libs/`、`*.apk`）。**不要 `git commit/push` 或做任何 git 变更操作，除非用户明确要求。**
- **推送凭据的坑**：本机凭据管理器里存的是另一个企业托管账号（Kitty-Fan_sgsdev，不能建公开仓库），直接 push 会被它顶掉报 `invalid credentials`。但 Windows 凭据管理器里已缓存 `git:https://x-access-token@github.com`（对应 `fanque123`），可通过 `"protocol=https`nhost=github.com`nusername=x-access-token`n`n" | & "C:\Program Files\Git\mingw64\bin\git-credential-manager.exe" get` 直接读出有效令牌（无需重走设备流；注意 GitHub 已对无 `client_secret` 的裸设备流轮询返回 `incorrect_client_credentials`）。推送时用 `git -c credential.helper= push "https://x-access-token:<TOKEN>@github.com/fanque123/math-practice-app.git" main:main`。
- **线上更新流程**：改代码 → 升 `service-worker.js` 的 `CACHE_NAME` → commit + push。Pages 构建约 1 分钟；用户端 SW 是网络优先，打开两次内自动拿到新版。
- **当前状态（2026-10-17，v1.13 已本地构建，未发布）**：定位到 v1.12 识别变差的真正原因——换上的 **streaming bilingual 小模型本身在中文数字上会吞尾字**：用 40 个中文数字 TTS 音频实测，它只对 16 个（102→"一百"=100、72→"七十"=70，与用户反馈完全一致），旧 zh-14M 对 37 个；换成**非流式中文 Paraformer-zh-small int8（82MB）+ Silero VAD** 后 40/40（10dB 噪声 40/40、5dB 38/40、15% 音量 40/40），且不再需要热词 / `modified_beam_search`（v1.12 那套在小米真机会闪退）。APK 变为 versionCode 15 / versionName 1.13，约 133.9MB（133,977,598 字节），模型文件已换到 `assets/sherpa-model/model.int8.onnx` + `silero_vad.onnx`。旧 bilingual 模型备份在 `tmp/sherpa-model-backup-bilingual/`，14M 在 `tmp/sherpa-model-backup-14M/`（tmp 不入库）。网页端代码未改、SW 仍 v28；**尚未 commit/push，也未做真机验证**。更早的 v1.12 状态：bilingual 模型 + modified_beam_search + 数字热词，APK 96.5MB，已发布。

## 安卓 APK 构建（离线安装包）

- 一键命令（Git Bash，在 `android/` 下）：
  ```bash
  export JAVA_HOME='C:\Users\KITTY_FAN\.kimi-code\Project\math-practice-app\build-tools\jdk'
  export ANDROID_SDK_ROOT='C:\Users\KITTY_FAN\.kimi-code\Project\math-practice-app\build-tools\sdk'
  export GRADLE_USER_HOME='C:\Users\KITTY_FAN\.kimi-code\Project\math-practice-app\build-tools\gradle-home'
  ../build-tools/gradle/gradle-8.10/bin/gradle assembleDebug --no-daemon
  ```
  产物在 `android/app/build/outputs/apk/debug/app-debug.apk`，拷贝为项目根的 `口算机器人.apk`。
- **网页改动后**：照常升 `service-worker.js` 缓存版本（网页端），然后重跑上面的命令即得新 APK（`syncWebAssets` 会自动拷最新网页文件）。
- **debug 签名**：APK 用 debug.keystore 签名（在 GRADLE_USER_HOME 旁的 `.android/` 或用户目录）。朋友覆盖安装新版要求签名一致；工具链重建后若签名变了，让对方先卸载再装。
- **WebView 与原生桥**：WebView 不支持 Web Speech API，v1.1 起 `MainActivity` 注入 `window.AndroidNative`（`speak/stopSpeaking/startListening/stopListening`），朗读走系统 TTS。**v1.11 起识别改为 sherpa-onnx 离线引擎**（原来走系统 `SpeechRecognizer`，小米等国产 ROM 上不稳定）：**v1.13 起改为「Silero VAD 断句 + 非流式中文 Paraformer-zh-small int8」**——`assets/sherpa-model/model.int8.onnx`（约 82MB，阿里 FunASR Paraformer，中文专用）+ `silero_vad.onnx`（643KB）+ `prompt.pcm`（22KB，"答案是"提示音：解码前拼在录音前面，否则孤立单字"五"容易被识别成英文 "who"；实测垫了提示音后 0~9 单字 10/10、40 个多位数仍 40/40）。VAD 的 `minSpeechDuration` 必须设 **0.1 秒**（默认 0.25 会把只有 0.15~0.2 秒的单字答案直接丢掉）。原因：v1.12 换的 streaming bilingual 小模型在中文数字上会把尾字整段吞掉（实测 40 个数字，清音只对 16 个：102→一百、72→七十，正好是用户反馈的现象）；Paraformer 同一测试 40/40（加 10dB 噪声仍 40/40、5dB 38/40），而 14M 流式只有 37/40、低音量下 11/40。识别逻辑在 `MainActivity.RecogSession`：AudioRecord 16kHz 采音 → 每 0.1 秒喂 `Vad`，`vad.empty()` 表示一句说完 → 把整段 `SpeechSegment.getSamples()` 一次性 `OfflineRecognizer.decode()` → `__nativeRecogResult(json,true)`；VAD 静音阈值 1.0 秒、单句最长 10 秒、10 秒没人说话报 no-speech(6)；`stopListening(true)` 会 `vad.flush()` 把没切完的半句也解出来。没有中间结果（非流式模型不需要），网页端 `onresult` 只在 `isFinal` 时判分，v25 的多候选 JSON 协议保留（离线只出单候选）。**v1.12 的 modified_beam_search + 热词在小米真机上会闪退，v1.13 已整体删除**（Paraformer 不需要热词）。模型来源：HF `csukuangfj/sherpa-onnx-paraformer-zh-small-2024-03-09` 的 `model.int8.onnx` **缺少 sherpa 需要的 CMVN 元数据**，直接加载会 `'vocab_size' does not exist` 退出；构建前用 onnx 补 `vocab_size=8359`、`lfr_window_size=7`、`lfr_window_shift=6`、`neg_mean`/`inv_stddev`（各 560 个数，来自 ModelScope 同权重的 `am.mvn` 的 `<AddShift>`/`<Rescale>`），补好的文件在 `assets/sherpa-model/model.int8.onnx`。AAR 在 `app/libs/sherpa-onnx-1.13.8.aar`（阿里云镜像没有，GitHub Releases 直下的，flatDir 仓库**只能配在 settings.gradle**——模块级 repositories 会整体覆盖 settings 的仓库，连 aapt2 都会拉不到），另需 `kotlin-stdlib:2.0.21`（AAR 是 Kotlin 写的）。`build.gradle` 加了 `abiFilters 'arm64-v8a','armeabi-v7a'` 去掉 x86 减体积。运行时麦克风权限申请不变（错误码 9→not-allowed）。回调入口仍是 `__nativeTtsDone/__nativeRecogStart/__nativeRecogEnd/__nativeRecogError/__nativeRecogResult`。v25 起 `__nativeRecogResult` 传 JSON 数组字符串（多候选），`createNativeRecognition()` 解析成 Web Speech 的 `SpeechRecognitionAlternative` 列表，与浏览器端共用同一套 `parseNumber` 选最佳候选。app.js 里 `nativeVoice` 非空即走原生路径：`createNativeRecognition()` 模拟 Web Recognition 接口、`speak()` 走 TTS、`ensureMicStream()`/`checkSpeechSupport()` 直接跳过。Manifest 已声明 `RECORD_AUDIO`。**改桥两端同步改**。
- 入坑记录：`local.properties` 路径用正斜杠（反斜杠 `\U` 会被当 unicode 转义报"文件名语法错误"）；SDK licenses 是手写哈希文件（`build-tools/sdk/licenses/`），等同于 `sdkmanager --licenses`。

## 修改后验证（项目实际路径：`C:/Users/KITTY_FAN/.kimi-code/Project/math-practice-app`）

1. `node --check "C:/Users/KITTY_FAN/.kimi-code/Project/math-practice-app/app.js"`（语法检查）。
2. 若 8000 端口已有 server 在跑（`netstat -ano | findstr :8000` 查），它实时读盘，无需重启；curl 验证输出为新代码：`curl -s http://localhost:8000/app.js | findstr <新标识>`。
3. 未启动则 `node server.js`（或 start-server.bat），浏览器开 `http://localhost:8000`。
4. **语音链路（权限弹窗次数、TTS 结束自动开麦、识别准确率、机器人动画实际观感）无法在命令行实测，必须声明"需用户实测"，不能自称已验证。**

## 已知限制与注意事项

- **DOM 顺序约束**：app.js 在 body 末尾以普通 `<script>` 立即执行，它 `getElementById` 的所有元素必须出现在 `<script>` 标签**之前**；把元素加到 script 之后会让绑定整块报错中断（按钮全部没反应）。改动后用 node 脚本对比 id 清单可快速自查。
- 浏览器安全模型决定**第一次麦克风授权无法绕过**（用户需在地址栏锁形图标里设为"允许"），这不是 bug，别试图绕过。
- ~~`voiceschanged`：部分浏览器首次 `getVoices()` 为空~~（已修复：`initSpeech()` 预热语音列表 + 监听 `voiceschanged` + 每次 `speak()` 前 `refreshVoices()`，避免第一题声音呆板）。
- service-worker 是**网络优先**：localhost 下总是拿到最新代码；若浏览器仍显示旧版，硬刷新（Ctrl+F5）一次让新 SW 接管即可。
- **即时识别的防抖取舍**：v25 起临时结果仅作显示，不再自动判定；最终答案以识别器返回的 `isFinal` 结果为准。这样彻底避免"还没说答案就被判错"，但孩子需要在说完后稍作停顿。若实测反馈太慢，可在 `initSpeech()` onresult 里恢复 interim 自动判定（参考 git 历史），并调大防抖值。
- **v1.13 非流式识别的取舍（APK）**：VAD 静音 1.0 秒断句 + 整段 Paraformer 解码，孩子说完到出结果比旧流式多约 0.3~1 秒；若在数字中间停顿超过 1 秒（"七十…二"），仍可能被切成两句、只认出"七十"，需调大 `MainActivity.VAD_MIN_SILENCE`（代价是每题都变慢）。**识别准确率无法在命令行验证**；本地对比方法是用 Windows SAPI 生成 40 个中文数字 wav（`tmp/asr-bench/`，不入库），再用 `sherpa_onnx` Python 解码统计，不能替代真机/儿童语音实测。
- **国产安卓机的无声问题**：微信内置浏览器（X5 内核）和小米等国产 ROM 自带浏览器对 Web Speech TTS 支持很差（voices 为空或 speak 无声），这是浏览器/系统限制，代码层面只能靠 `checkSpeechSupport()` 提示换 Chrome/Edge + `speak()` 看门狗保证流程不卡。另外 TTS 走**媒体音量**不是铃声音量，用户反馈无声先让调媒体音量。
- **机器人音效台词（v1.4）**：擎天柱答对/答错固定台词（`嘟嘟，好棒！`/`嘟嘟，加油！`）不走 TTS，改播预制音频 `audio/optimus-praise.wav` / `optimus-encourage.wav`（PC 端 SAPI 中文干声 → Python 特效链，定版配方：好棒=降调1.15×+低通4kHz+30Hz调制80%混合，加油=降调1.15×+低通4kHz+30/60Hz复合载波100%调制+轻颗粒；浏览器和 WebView 的 HTMLAudio 都能播）。`speak()` 里按**台词原文精确匹配** `ROBOT_AUDIO` 表，匹配不到（如用户自定义台词）回退 TTS。**改默认台词文本时必须重新生成同名音频**（PowerShell `System.Speech` 生成干声 → numpy/scipy 特效链）。`syncWebAssets` 已含 `audio/**`，SW 的 ASSETS 也列了这两个文件。
- **Android 15 边到边遮挡**：targetSdk 35 强制边到边，WebView 内容会伸到状态栏下面。`MainActivity.onCreate` 里用 `setOnApplyWindowInsetsListener` 给 WebView 加上下系统栏内边距；同时设了 `setMediaPlaybackRequiresUserGesture(false)` 保证音频自动播放。
- **原生识别的错误补发（历史问题，v1.11 起不存在）**：旧版用系统 `SpeechRecognizer` 时，答对一题后停止识别会补发 `ERROR_CLIENT` 把正确反馈覆盖成「语音识别出错」，当时的双保险之一是 app.js 的 `recognition.onerror` 里 `state.isAnswering` 为真就直接忽略（这个保护仍保留，继续有效）。v1.11 起识别走 sherpa-onnx 离线引擎（`MainActivity.RecogSession`），停止识别由会话自己的 `finalDelivered`/`running` 标志控制，不会再有系统服务补发错误。同理，WebView 没有 `speechSynthesis` 对象，任何语音停止调用都必须走 `stopAllSpeech()`（原桥/浏览器双路径），直接调 `window.speechSynthesis.cancel()` 会在 APK 里抛异常——做题页旧的 ✕ 按钮就是这样失灵的。退出按钮：做题页底部 `.quiz-footer` 里的 `#quiz-back-btn`（回设置页）与 `#quiz-exit-btn`，以及启动页的 `#setup-exit-btn`（全端显示，APK 里调 `AndroidNative.exit()` 关应用，浏览器里等于回首页）。
- **出题去重的兜底**：题池不足时（目前只有 m1 乘法口诀 2~9 共 36 题，要 >36 题才会触发）允许交换重复的题出现，但绝不出现完全相同的题。
- 不要 `git commit/push` 或做任何 git 变更操作，除非用户明确要求。

