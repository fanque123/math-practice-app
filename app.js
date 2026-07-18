(() => {
  // ==================== 配置 ====================
  const DIFFICULTIES = {
    multiply: [
      { key: 'm1', label: '9×9 乘法口诀', desc: '两个 1 位数相乘' },
      { key: 'm2', label: '1 位数 × 2 位数', desc: '例如 7 × 23' },
      { key: 'm3', label: '1 位数 × 3 位数', desc: '例如 4 × 156' },
      { key: 'm4', label: '2 位数 × 2 位数', desc: '例如 12 × 34' },
      { key: 'm5', label: '2 位数 × 3 位数', desc: '例如 23 × 145' },
    ],
    add: [
      { key: 'a1', label: '1 位数 + 2 位数', desc: '例如 5 + 23' },
      { key: 'a2', label: '1 位数 + 3 位数', desc: '例如 7 + 156' },
      { key: 'a3', label: '2 位数 + 2 位数', desc: '例如 34 + 56' },
      { key: 'a4', label: '2 位数 + 3 位数', desc: '例如 45 + 123' },
      { key: 'a5', label: '3 位数 + 3 位数', desc: '例如 234 + 567' },
    ],
    subtract: [
      { key: 's1', label: '2 位数 - 1 位数', desc: '例如 25 - 7' },
      { key: 's2', label: '2 位数 - 2 位数', desc: '例如 54 - 23' },
      { key: 's3', label: '3 位数 - 1 位数', desc: '例如 156 - 9' },
      { key: 's4', label: '3 位数 - 2 位数', desc: '例如 234 - 56' },
      { key: 's5', label: '3 位数 - 3 位数', desc: '例如 345 - 123' },
    ],
    divide: [
      { key: 'd1', label: '2 位数 ÷ 1 位数', desc: '例如 56 ÷ 7' },
      { key: 'd2', label: '3 位数 ÷ 1 位数', desc: '例如 156 ÷ 3' },
      { key: 'd3', label: '3 位数 ÷ 2 位数', desc: '例如 288 ÷ 12' },
      { key: 'd4', label: '4 位数 ÷ 2 位数', desc: '例如 1056 ÷ 12' },
    ],
  };

  // 角色配置：擎天柱 / 公主（纯 SVG 造型 + 台词 + 嗓音，设置页可直接切换）
  // 两个角色的部件 class 约定一致（robot-eye/arm/antenna/smoke 等），styles.css 的动画才能通用
  const CHARACTERS = {
    optimus: {
      // 擎天柱：蓝盔银面罩、红胸车窗、肩上排气管
      svg: `
<svg class="robot-svg" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="robot-shadow" cx="80" cy="193" rx="44" ry="6" fill="rgba(31, 41, 55, 0.15)"/>

  <!-- 腿部 -->
  <rect x="59" y="122" width="16" height="40" rx="4" fill="#1d4ed8"/>
  <rect x="85" y="122" width="16" height="40" rx="4" fill="#1d4ed8"/>
  <rect x="61" y="132" width="12" height="6" rx="2" fill="#93c5fd"/>
  <rect x="87" y="132" width="12" height="6" rx="2" fill="#93c5fd"/>
  <rect x="55" y="162" width="24" height="24" rx="4" fill="#94a3b8"/>
  <rect x="81" y="162" width="24" height="24" rx="4" fill="#94a3b8"/>

  <!-- 肩上排气管（擎天柱的标志），答对时喷烟 -->
  <rect x="34" y="42" width="8" height="26" rx="3" fill="#cbd5e1"/>
  <rect x="118" y="42" width="8" height="26" rx="3" fill="#cbd5e1"/>
  <rect x="34" y="42" width="8" height="6" rx="3" fill="#64748b"/>
  <rect x="118" y="42" width="8" height="6" rx="3" fill="#64748b"/>
  <circle class="robot-smoke robot-smoke-left" cx="38" cy="36" r="5" fill="#e2e8f0"/>
  <circle class="robot-smoke robot-smoke-right" cx="122" cy="36" r="5" fill="#e2e8f0"/>

  <!-- 手臂（红上臂 + 蓝前臂 + 银拳头） -->
  <g class="robot-arm-left">
    <rect x="30" y="76" width="16" height="22" rx="5" fill="#c62828"/>
    <rect x="30" y="96" width="16" height="24" rx="5" fill="#1d4ed8"/>
    <rect x="28" y="118" width="20" height="14" rx="6" fill="#94a3b8"/>
  </g>
  <g class="robot-arm-right">
    <rect x="114" y="76" width="16" height="22" rx="5" fill="#c62828"/>
    <rect x="114" y="96" width="16" height="24" rx="5" fill="#1d4ed8"/>
    <rect x="112" y="118" width="20" height="14" rx="6" fill="#94a3b8"/>
  </g>

  <!-- 躯干：红色驾驶室 + 两块前车窗 -->
  <rect x="48" y="60" width="64" height="64" rx="8" fill="#c62828"/>
  <rect x="55" y="66" width="22" height="26" rx="3" fill="#93c5fd"/>
  <rect x="83" y="66" width="22" height="26" rx="3" fill="#93c5fd"/>
  <line x1="60" y1="70" x2="70" y2="88" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  <line x1="88" y1="70" x2="98" y2="88" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round" opacity="0.7"/>

  <!-- 银色散热格栅（腹肌） -->
  <rect x="62" y="98" width="36" height="22" rx="3" fill="#94a3b8"/>
  <line x1="70" y1="100" x2="70" y2="118" stroke="#64748b" stroke-width="3"/>
  <line x1="80" y1="100" x2="80" y2="118" stroke="#64748b" stroke-width="3"/>
  <line x1="90" y1="100" x2="90" y2="118" stroke="#64748b" stroke-width="3"/>

  <!-- 肩甲 -->
  <rect x="28" y="60" width="20" height="18" rx="5" fill="#c62828"/>
  <rect x="112" y="60" width="20" height="18" rx="5" fill="#c62828"/>

  <!-- 脖子 -->
  <rect x="72" y="54" width="16" height="8" rx="2" fill="#94a3b8"/>

  <!-- 头部：蓝色头盔 + 两侧天线耳 + 银色面罩 -->
  <g class="robot-antenna">
    <rect x="56" y="26" width="6" height="14" rx="2" fill="#1e40af"/>
    <rect x="98" y="26" width="6" height="14" rx="2" fill="#1e40af"/>
  </g>
  <rect x="62" y="14" width="36" height="42" rx="8" fill="#1d4ed8"/>
  <path d="M80 8 L73 20 L87 20 Z" fill="#cbd5e1"/>
  <circle class="robot-antenna-light" cx="80" cy="26" r="3.5" fill="#38bdf8"/>

  <!-- 发光蓝眼 -->
  <g class="robot-eyes-normal">
    <rect class="robot-eye robot-eye-left" x="67" y="34" width="10" height="6" rx="3" fill="#7dd3fc"/>
    <rect class="robot-eye robot-eye-right" x="83" y="34" width="10" height="6" rx="3" fill="#7dd3fc"/>
  </g>
  <g class="robot-eyes-happy" stroke="#7dd3fc" stroke-width="3.5" fill="none" stroke-linecap="round">
    <path d="M66 39 Q72 31 78 39"/>
    <path d="M82 39 Q88 31 94 39"/>
  </g>
  <g class="robot-brows-sad" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round">
    <line x1="66" y1="28" x2="76" y2="32"/>
    <line x1="94" y1="28" x2="84" y2="32"/>
  </g>

  <!-- 面罩（正常=亮银格栅，低落=暗淡下垂） -->
  <g class="robot-mouth-normal">
    <rect x="68" y="44" width="24" height="10" rx="3" fill="#cbd5e1"/>
    <line x1="74" y1="46" x2="74" y2="52" stroke="#64748b" stroke-width="2.5"/>
    <line x1="80" y1="46" x2="80" y2="52" stroke="#64748b" stroke-width="2.5"/>
    <line x1="86" y1="46" x2="86" y2="52" stroke="#64748b" stroke-width="2.5"/>
  </g>
  <g class="robot-mouth-sad">
    <rect x="68" y="46" width="24" height="8" rx="3" fill="#94a3b8"/>
    <line x1="74" y1="48" x2="74" y2="52" stroke="#475569" stroke-width="2.5"/>
    <line x1="80" y1="48" x2="80" y2="52" stroke="#475569" stroke-width="2.5"/>
    <line x1="86" y1="48" x2="86" y2="52" stroke="#475569" stroke-width="2.5"/>
  </g>
</svg>`,
      praise: '嘟嘟，好棒！',
      encourage: '嘟嘟，加油！',
      greeting: '你好，我是擎天柱！<br>选好题目，和我一起战斗吧！',
      voice: { male: true, rate: 0.78, pitch: 0.45 }, // 低沉领袖腔
    },
    princess: {
      // 公主：金色波浪长发、宝石皇冠、蓝色礼服裙、星星魔杖
      svg: `
<svg class="robot-svg" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="robot-shadow" cx="80" cy="193" rx="44" ry="6" fill="rgba(31, 41, 55, 0.15)"/>

  <!-- 身后金色长发，发梢带波浪卷 -->
  <path d="M46 44 Q42 128 52 142 Q58 149 62 139 L98 139 Q102 149 108 142 Q118 128 114 44 Q100 18 80 18 Q60 18 46 44 Z" fill="#f0b429"/>
  <circle cx="52" cy="142" r="7" fill="#f0b429"/>
  <circle cx="64" cy="146" r="7" fill="#f0b429"/>
  <circle cx="96" cy="146" r="7" fill="#f0b429"/>
  <circle cx="108" cy="142" r="7" fill="#f0b429"/>

  <!-- 蓝色大摆裙：深蓝底裙 + 浅蓝前襟 + 裙摆花边 -->
  <path d="M60 96 L100 96 L126 188 L34 188 Z" fill="#2563eb"/>
  <path d="M68 96 L92 96 L104 188 L56 188 Z" fill="#93c5fd"/>
  <circle cx="40" cy="186" r="4" fill="#bfdbfe"/>
  <circle cx="56" cy="186" r="4" fill="#bfdbfe"/>
  <circle cx="72" cy="186" r="4" fill="#bfdbfe"/>
  <circle cx="88" cy="186" r="4" fill="#bfdbfe"/>
  <circle cx="104" cy="186" r="4" fill="#bfdbfe"/>
  <circle cx="120" cy="186" r="4" fill="#bfdbfe"/>

  <!-- 腰间蝴蝶结 -->
  <path d="M80 94 L64 86 L66 102 Z" fill="#f472b6"/>
  <path d="M80 94 L96 86 L94 102 Z" fill="#f472b6"/>
  <circle cx="80" cy="94" r="5" fill="#ec4899"/>

  <!-- 上身：心形领小礼服 -->
  <path d="M64 66 Q72 76 80 72 Q88 76 96 66 L99 96 L61 96 Z" fill="#3b82f6"/>

  <!-- 手臂（泡泡袖 + 小手），右手握星星魔杖 -->
  <g class="robot-arm-left">
    <circle cx="57" cy="70" r="9" fill="#60a5fa"/>
    <rect x="49" y="76" width="10" height="30" rx="5" fill="#ffd9b3"/>
    <circle cx="53" cy="108" r="5.5" fill="#ffd9b3"/>
  </g>
  <g class="robot-arm-right">
    <circle cx="103" cy="70" r="9" fill="#60a5fa"/>
    <rect x="101" y="76" width="10" height="30" rx="5" fill="#ffd9b3"/>
    <circle cx="107" cy="108" r="5.5" fill="#ffd9b3"/>
    <line x1="107" y1="108" x2="126" y2="80" stroke="#d97706" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="127" cy="76" r="9" fill="#fde047" opacity="0.35"/>
    <path d="M127 66 L129.8 72.9 L137 73.6 L131.6 78.5 L133.1 85.6 L127 81.7 L120.9 85.6 L122.4 78.5 L117 73.6 L124.2 72.9 Z" fill="#fde047" stroke="#f59e0b" stroke-width="1.2"/>
  </g>

  <!-- 魔杖尖的星光（欢呼时迸发，对应排气管喷烟的动画钩子） -->
  <circle class="robot-smoke robot-smoke-left" cx="120" cy="64" r="4" fill="#fbbf24"/>
  <circle class="robot-smoke robot-smoke-right" cx="133" cy="60" r="3" fill="#f472b6"/>

  <!-- 脖子与脸 -->
  <rect x="74" y="58" width="12" height="12" rx="3" fill="#ffd9b3"/>
  <circle cx="80" cy="45" r="21" fill="#ffe6c7"/>

  <!-- 两侧垂发修饰脸型 -->
  <ellipse cx="57" cy="52" rx="4.5" ry="13" fill="#f6c445"/>
  <ellipse cx="103" cy="52" rx="4.5" ry="13" fill="#f6c445"/>

  <!-- 刘海 -->
  <path d="M59 43 Q55 21 80 20 Q105 21 101 43 Q97 30 87 29 Q85 36 80 36 Q75 36 73 29 Q63 30 59 43 Z" fill="#f6c445"/>

  <!-- 宝石皇冠（对应天线钩子：低落时会歪、宝石会暗） -->
  <g class="robot-antenna">
    <path d="M66 23 L70 13 L76 20 L80 9 L84 20 L90 13 L94 23 Q80 17 66 23 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
    <circle class="robot-antenna-light" cx="80" cy="15" r="2.8" fill="#ec4899"/>
    <circle cx="72" cy="19" r="1.6" fill="#7dd3fc"/>
    <circle cx="88" cy="19" r="1.6" fill="#7dd3fc"/>
  </g>

  <!-- 日常淡眉（低落时隐藏，换成委屈眉） -->
  <g class="robot-brows-normal" stroke="#b45309" stroke-width="1.6" fill="none" stroke-linecap="round">
    <path d="M66 37 Q71 35 76 37"/>
    <path d="M84 37 Q89 35 94 37"/>
  </g>

  <!-- 大眼睛（带高光和睫毛） -->
  <g class="robot-eyes-normal">
    <g class="robot-eye robot-eye-left">
      <ellipse cx="71" cy="47" rx="4.2" ry="5.5" fill="#1f2937"/>
      <circle cx="72.6" cy="45" r="1.6" fill="#ffffff"/>
    </g>
    <g class="robot-eye robot-eye-right">
      <ellipse cx="89" cy="47" rx="4.2" ry="5.5" fill="#1f2937"/>
      <circle cx="90.6" cy="45" r="1.6" fill="#ffffff"/>
    </g>
    <path d="M66 44 L63 42" stroke="#1f2937" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M67 41.5 L64.5 39.5" stroke="#1f2937" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M94 44 L97 42" stroke="#1f2937" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M93 41.5 L95.5 39.5" stroke="#1f2937" stroke-width="1.4" stroke-linecap="round"/>
  </g>
  <g class="robot-eyes-happy" stroke="#1f2937" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M65 49 Q71 42 77 49"/>
    <path d="M83 49 Q89 42 95 49"/>
  </g>
  <g class="robot-brows-sad" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round">
    <line x1="65" y1="41" x2="75" y2="37"/>
    <line x1="95" y1="41" x2="85" y2="37"/>
  </g>

  <!-- 腮红、小鼻子、嘴唇 -->
  <ellipse cx="62" cy="56" rx="5" ry="3.5" fill="#fda4af" opacity="0.7"/>
  <ellipse cx="98" cy="56" rx="5" ry="3.5" fill="#fda4af" opacity="0.7"/>
  <path d="M80 51 L79.5 53.5" stroke="#e8a87c" stroke-width="1.4" stroke-linecap="round"/>
  <path class="robot-mouth-normal" d="M72 57 Q80 65 88 57" stroke="#e11d63" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path class="robot-mouth-sad" d="M74 62 Q80 57 86 62" stroke="#e11d63" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`,
      praise: '真棒！',
      encourage: '加油！',
      greeting: '你好，我是小公主！<br>选好题目，我们开始吧！',
      voice: { male: false, rate: 0.95, pitch: 1.3 }, // 甜美公主腔
    },
  };

  // 出题引导气泡文案（两个角色共用）
  const ROBOT_LINES = {
    question: ['动动小脑筋~', '这道题难不倒你！', '认真想，你可以的！', '加油，我看好你！'],
  };

  // ==================== 状态 ====================
  let state = {
    mode: 'optimus', // 陪伴角色：optimus 擎天柱 / princess 公主（init 时会被 settings.mode 覆盖）
    operation: 'multiply',
    difficulty: 'm1',
    count: 10,
    questions: [],
    currentIndex: 0,
    score: 0,
    wrong: [],
    isAnswering: false,
  };

  // 用户设置（localStorage 持久化）：默认模式、默认题数、各模式答对/答错台词
  const settings = loadSettings();

  let recognition = null;
  let isListening = false;
  let micStream = null;
  let interimTimer = null;   // 临时结果稳定计时器
  let lastInterimNum = null; // 最近一次临时识别出的数字

  // ==================== DOM 元素 ====================
  const screens = {
    setup: document.getElementById('setup-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
  };

  const opTabs = document.querySelectorAll('.op-tab[data-op]');
  const difficultyList = document.getElementById('difficulty-list');
  const countInput = document.getElementById('question-count');
  const countBtns = document.querySelectorAll('.count-btn');
  const startBtn = document.getElementById('start-btn');

  const questionDisplay = document.getElementById('question-display');
  const answerFeedback = document.getElementById('answer-feedback');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const listenBtn = document.getElementById('listen-btn');
  const micText = document.getElementById('mic-text');
  const manualForm = document.getElementById('manual-form');
  const manualAnswer = document.getElementById('manual-answer');
  const quitBtn = document.getElementById('quit-btn');

  const scoreText = document.getElementById('score-text');
  const scoreMessage = document.getElementById('score-message');
  const wrongList = document.getElementById('wrong-list');
  const wrongItems = document.getElementById('wrong-items');
  const restartBtn = document.getElementById('restart-btn');
  const homeBtn = document.getElementById('home-btn');

  const quizRobot = document.getElementById('quiz-robot');
  const quizBubble = document.getElementById('quiz-bubble');
  const resultRobot = document.getElementById('result-robot');
  const resultBubble = document.getElementById('result-bubble');
  const confettiBox = document.getElementById('confetti');
  const setupBubble = document.querySelector('.setup-bubble');
  const settingsBtn = document.getElementById('settings-btn');
  const installBtn = document.getElementById('install-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsModeTabs = document.querySelectorAll('.settings-mode-tab');
  const settingsPraiseInput = document.getElementById('settings-praise');
  const settingsEncourageInput = document.getElementById('settings-encourage');
  const settingsCountInput = document.getElementById('settings-count');
  const settingsSaveBtn = document.getElementById('settings-save');
  const settingsCancelBtn = document.getElementById('settings-cancel');

  // ==================== 初始化 ====================
  function init() {
    state.mode = settings.mode; // 应用保存的默认模式
    countInput.value = settings.defaultCount; // 应用保存的默认题数
    buildFlowers();
    setMode(state.mode); // 注入角色 SVG、问候语、主题
    startRobotIdleActions();
    renderDifficulties();
    bindEvents();
    initSpeech();
    registerServiceWorker();
    setupInstallPrompt();
    checkSpeechSupport();
  }

  // ==================== 发声能力自检 ====================
  // 微信内置浏览器、部分国产 ROM 自带浏览器无法正常调用语音朗读，
  // 与其静默无声，不如直接在气泡里告诉用户怎么解决
  function checkSpeechSupport() {
    if (nativeVoice) return; // APK 内由系统 TTS/识别器接管，不依赖浏览器能力
    if (/micromessenger/i.test(navigator.userAgent)) {
      setupBubble.innerHTML = '微信里打开没有声音🔇<br>请点右上角「···」→「在浏览器打开」，用 Chrome 或 Edge 打开本页';
      return;
    }
    if (!('speechSynthesis' in window)) {
      setupBubble.innerHTML = '当前浏览器不支持语音朗读🔇<br>建议用 Chrome 或 Edge 打开本页';
      return;
    }
    // 语音列表异步加载，2.5 秒后仍为空基本就是发不了声的环境
    setTimeout(() => {
      refreshVoices();
      if (cachedVoices.length === 0) {
        setupBubble.innerHTML = '当前浏览器可能无法发声🔇<br>建议用 Chrome 或 Edge 打开，并把媒体音量调大';
      }
    }, 2500);
  }

  // ==================== PWA 安装 ====================
  // 安卓/桌面 Chrome 捕获 beforeinstallprompt 后可弹原生安装框；
  // iPhone/iPad 无此事件,点击按钮时给「添加到主屏幕」的操作指引
  let deferredInstallPrompt = null;

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function setupInstallPrompt() {
    if (!installBtn || isInStandaloneMode()) return; // 已安装成 App 就不再显示
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.classList.remove('hidden');
    });
    if (isIOS()) installBtn.classList.remove('hidden');
    window.addEventListener('appinstalled', () => {
      installBtn.classList.add('hidden');
      deferredInstallPrompt = null;
    });
    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') installBtn.classList.add('hidden');
        deferredInstallPrompt = null;
      } else if (isIOS()) {
        alert('用 Safari 打开本页 → 点底部的「分享」按钮 → 选「添加到主屏幕」，就能像 App 一样使用啦！');
      } else {
        alert('请用浏览器菜单里的「安装应用」或「添加到主屏幕」完成安装。');
      }
    });
  }

  // 切换陪伴角色（擎天柱 / 公主）：换造型、问候语和整套主题
  function setMode(mode) {
    state.mode = mode;
    const ch = CHARACTERS[mode];
    document.body.classList.toggle('mode-princess', mode === 'princess');
    document.querySelectorAll('.robot-slot').forEach((slot) => {
      slot.innerHTML = ch.svg;
    });
    if (setupBubble) setupBubble.innerHTML = ch.greeting;
  }

  // 公主模式的花园：在背景随机撒一片会轻轻摇摆的花
  function buildFlowers() {
    const field = document.getElementById('flower-field');
    if (!field) return;
    const kinds = ['🌸', '🌺', '🌷', '🌼', '💐', '🌻', '🌹'];
    for (let i = 0; i < 26; i++) {
      const f = document.createElement('span');
      f.textContent = kinds[i % kinds.length];
      f.style.left = Math.random() * 96 + '%';
      f.style.top = Math.random() * 92 + '%';
      f.style.fontSize = (18 + Math.random() * 26).toFixed(0) + 'px';
      f.style.opacity = (0.45 + Math.random() * 0.45).toFixed(2);
      f.style.animationDuration = (3 + Math.random() * 3).toFixed(2) + 's';
      f.style.animationDelay = (-Math.random() * 4).toFixed(2) + 's';
      field.appendChild(f);
    }
  }

  // ==================== 设置 ====================
  const SETTINGS_KEY = 'math-practice-settings';

  // 读取设置；无存档或字段缺失时回退到默认值（默认模式=擎天柱、默认题数=30、台词=角色自带）
  function loadSettings() {
    const defaults = {
      mode: 'optimus',
      defaultCount: 30,
      lines: {
        optimus: { praise: CHARACTERS.optimus.praise, encourage: CHARACTERS.optimus.encourage },
        princess: { praise: CHARACTERS.princess.praise, encourage: CHARACTERS.princess.encourage },
      },
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      return {
        mode: saved.mode === 'princess' ? 'princess' : 'optimus',
        defaultCount: Math.max(1, Math.min(50, parseInt(saved.defaultCount, 10) || 30)),
        lines: {
          optimus: { ...defaults.lines.optimus, ...(saved.lines && saved.lines.optimus) },
          princess: { ...defaults.lines.princess, ...(saved.lines && saved.lines.princess) },
        },
      };
    } catch (e) {
      return defaults;
    }
  }

  function persistSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      // 隐私模式等写不进 localStorage 时，设置只在本次会话生效
    }
  }

  // 设置面板的台词草稿：先改草稿，保存才落盘
  let settingsDraft = null;
  let settingsDraftMode = 'optimus';

  function openSettings() {
    settingsDraft = {
      optimus: { ...settings.lines.optimus },
      princess: { ...settings.lines.princess },
    };
    settingsDraftMode = state.mode;
    settingsCountInput.value = settings.defaultCount;
    syncSettingsModeTabs();
    fillSettingsLineInputs();
    settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
    settingsDraft = null;
  }

  function syncSettingsModeTabs() {
    settingsModeTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === settingsDraftMode);
    });
  }

  function fillSettingsLineInputs() {
    settingsPraiseInput.value = settingsDraft[settingsDraftMode].praise;
    settingsEncourageInput.value = settingsDraft[settingsDraftMode].encourage;
  }

  // 切换面板里的模式前，先把当前输入收回草稿
  function stashSettingsLineInputs() {
    settingsDraft[settingsDraftMode].praise = settingsPraiseInput.value.trim();
    settingsDraft[settingsDraftMode].encourage = settingsEncourageInput.value.trim();
  }

  function saveSettingsFromModal() {
    stashSettingsLineInputs();
    // 留空的台词回退为角色默认
    ['optimus', 'princess'].forEach((m) => {
      if (!settingsDraft[m].praise) settingsDraft[m].praise = CHARACTERS[m].praise;
      if (!settingsDraft[m].encourage) settingsDraft[m].encourage = CHARACTERS[m].encourage;
    });
    settings.lines = settingsDraft;

    let v = parseInt(settingsCountInput.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 50) v = 50;
    settings.defaultCount = v;
    settings.mode = settingsDraftMode;

    persistSettings();
    countInput.value = v; // 立即应用新默认题数
    setMode(settings.mode); // 立即应用新模式
    closeSettings();
  }

  // ==================== 机器人 ====================
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setRobotState(wrap, stateClass) {
    if (!wrap) return;
    wrap.classList.remove('robot-happy', 'robot-sad', 'robot-thinking');
    if (stateClass) wrap.classList.add(stateClass);
  }

  function launchConfetti() {
    if (!confettiBox) return;
    clearConfetti();
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('i');
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
      piece.style.animationDuration = (2 + Math.random() * 1.5).toFixed(2) + 's';
      confettiBox.appendChild(piece);
    }
  }

  function clearConfetti() {
    if (confettiBox) confettiBox.innerHTML = '';
  }

  // 设置页的机器人每隔几秒随机做个小动作（单眼眨、挥手），显得更活泼
  function startRobotIdleActions() {
    const setupRobot = document.querySelector('#setup-screen .robot-wrap');
    if (!setupRobot) return;
    const actions = ['robot-wink', 'robot-wave-once'];
    setInterval(() => {
      if (!screens.setup.classList.contains('active')) return;
      const action = pick(actions);
      setupRobot.classList.add(action);
      setTimeout(() => setupRobot.classList.remove(action), 1300);
    }, 4200);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        // 离线缓存注册失败不影响主功能
      });
    }
  }

  // ==================== 语音 ====================
  // 安卓 APK 原生桥：WebView 不支持 Web Speech API，MainActivity 会注入
  // window.AndroidNative，朗读走系统 TTS、识别走 SpeechRecognizer；
  // 浏览器里没有这个对象，一切走下面的网页逻辑
  const nativeVoice = (typeof window.AndroidNative !== 'undefined') ? window.AndroidNative : null;

  // 原生 TTS 说完一句话后的回调入口（MainActivity 在 onDone 时调 window.__nativeTtsDone()）
  let nativeTtsDoneCb = null;
  window.__nativeTtsDone = function () {
    const cb = nativeTtsDoneCb;
    nativeTtsDoneCb = null;
    if (cb) cb();
  };

  // 造一个和 Web Speech Recognition 接口一致的原生识别适配器，
  // 让 initSpeech() 后面的处理器赋值两种后端完全共用
  function createNativeRecognition() {
    const rec = {
      lang: 'zh-CN',
      interimResults: true,
      maxAlternatives: 3,
      onstart: null, onend: null, onresult: null, onerror: null,
      start() { nativeVoice.startListening(); },
      stop() { nativeVoice.stopListening(); },
    };
    window.__nativeRecogStart = () => { if (rec.onstart) rec.onstart(); };
    window.__nativeRecogEnd = () => { if (rec.onend) rec.onend(); };
    window.__nativeRecogError = (code) => {
      // SpeechRecognizer 错误码：7=没听清 6=说话超时 9=无麦克风权限
      const map = { 7: 'no-speech', 6: 'no-speech', 9: 'not-allowed' };
      if (rec.onerror) rec.onerror({ error: map[code] || 'native-' + code });
      if (rec.onend) rec.onend();
    };
    window.__nativeRecogResult = (text, isFinal) => {
      if (!rec.onresult) return;
      const result = [{ transcript: text }];
      result.isFinal = isFinal;
      result.length = 1;
      rec.onresult({ resultIndex: 0, results: [result] });
    };
    return rec;
  }


  // 语音列表缓存：部分浏览器首次 getVoices() 返回空（语音异步加载），
  // 不预热的话第一题会用呆板的默认声音读，后面才变自然语音
  let cachedVoices = [];

  function refreshVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) cachedVoices = voices;
  }

  function getBestChineseVoice(preferMale) {
    if (!('speechSynthesis' in window)) return null;
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const zhVoices = voices.filter((v) => v.lang.startsWith('zh'));
    if (zhVoices.length === 0) return null;

    // 优先选择 Edge/Chrome 的在线自然语音；preferMale 时男声靠前（擎天柱用）
    const male = [
      'Microsoft Yunyang Online (Natural)',
      'Microsoft Yunjian Online (Natural)',
      'Microsoft Yunze Online (Natural)',
      'Microsoft Yunfeng Online (Natural)',
      'Kangkang',
    ];
    const female = [
      'Microsoft Xiaoxiao Online (Natural)',
      'Microsoft Xiaoyi Online (Natural)',
      'Microsoft Xiaoshuang Online (Natural)',
    ];
    const fallback = ['Google 普通话（中国大陆）', 'Ting-Ting', 'Mei-Jia'];
    const preferred = preferMale
      ? [...male, ...female, ...fallback]
      : [...female, ...male, ...fallback];

    for (const name of preferred) {
      const found = zhVoices.find((v) => v.name.includes(name));
      if (found) return found;
    }

    // 其次选择带 Natural/Neural 关键词的
    const natural = zhVoices.find((v) =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('neural') ||
      v.name.includes('小') ||
      v.name.includes('云')
    );
    if (natural) return natural;

    return zhVoices[0];
  }

  function clearInterimTimer() {
    if (interimTimer) {
      clearTimeout(interimTimer);
      interimTimer = null;
    }
  }

  function initSpeech() {
    // 语音合成（APK 里由系统 TTS 接管，跳过浏览器语音预热）
    if (nativeVoice) {
      recognition = createNativeRecognition();
    } else {
      if (!('speechSynthesis' in window)) {
        console.warn('浏览器不支持语音朗读');
      } else {
        // 页面加载就预热语音列表，并监听加载完成事件，避免第一题用到默认声音
        refreshVoices();
        window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
      }

      // 语音识别
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.interimResults = true; // 边说边出结果，不等静音超时
        recognition.maxAlternatives = 3;
      }
    }

    if (!recognition) {
      answerFeedback.textContent = '当前浏览器不支持语音识别，请手动输入答案。';
      return;
    }

    recognition.onstart = () => {
      isListening = true;
      listenBtn.classList.add('listening');
      micText.textContent = '听你说...';
      setFeedback('listening', '请说出答案...');
      setRobotState(quizRobot, 'robot-thinking');
      quizBubble.textContent = '我在认真听你说…';
      lastInterimNum = null;
      clearInterimTimer();
    };

    recognition.onend = () => {
      isListening = false;
      listenBtn.classList.remove('listening');
      micText.textContent = '点击重说';
      // 如果还没答完就结束了，提示可重试
      if (!state.isAnswering && state.currentIndex < state.count) {
        setFeedback('', '没听清？点击按钮再试一次');
        setRobotState(quizRobot);
        quizBubble.textContent = '没听清？点按钮再告诉我一次';
      }
    };

    recognition.onresult = (event) => {
      let finalNum = null;
      let interimNum = null;
      let sawFinal = false;

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) sawFinal = true;
        for (let j = 0; j < res.length; j++) {
          const num = parseNumber(res[j].transcript);
          if (num === null) continue;
          if (res.isFinal) { finalNum = num; break; }
          if (interimNum === null) interimNum = num;
        }
        if (finalNum !== null) break;
      }

      // 拿到最终结果：立即判定
      if (finalNum !== null) {
        clearInterimTimer();
        try { recognition.stop(); } catch (e) {}
        handleAnswer(finalNum);
        return;
      }

      // 临时结果：实时显示；数字稳定 0.7 秒就提前判定，不用等静音超时
      if (interimNum !== null && !state.isAnswering) {
        setFeedback('listening', `听到了：${interimNum}`);
        if (interimNum !== lastInterimNum) {
          lastInterimNum = interimNum;
          clearInterimTimer();
          interimTimer = setTimeout(() => {
            if (state.isAnswering || !isListening) return;
            try { recognition.stop(); } catch (e) {}
            handleAnswer(interimNum);
          }, 700);
        }
        return;
      }

      // 最终结果里也没听出数字
      if (sawFinal) {
        setFeedback('wrong', '没听清数字，请再试一次');
        setRobotState(quizRobot);
        quizBubble.textContent = '没听清数字，再说一次吧';
        state.isAnswering = false;
      }
    };

    recognition.onerror = (event) => {
      isListening = false;
      listenBtn.classList.remove('listening');
      micText.textContent = '点击重说';
      setRobotState(quizRobot);
      clearInterimTimer();
      if (event.error === 'no-speech') {
        setFeedback('wrong', '没听清，请再试一次');
      } else if (event.error === 'not-allowed') {
        setFeedback('wrong', '请允许使用麦克风，然后点击重试');
      } else {
        setFeedback('wrong', '语音识别出错，请手动输入');
      }
    };
  }

  function startListening() {
    if (!recognition || state.isAnswering) return;
    try {
      if (isListening) recognition.stop();
      recognition.start();
    } catch (err) {
      // 可能已经在监听
    }
  }

  function speak(text, onEnd, opts) {
    // 说话前先停止识别，避免录到机器声
    if (recognition && isListening) {
      try { recognition.stop(); } catch (e) {}
    }

    const rate = (opts && opts.rate) || 0.88;
    const pitch = (opts && opts.pitch) || 1.05;

    // 部分手机浏览器（小米/微信内置等）onend、onerror 都可能不触发，
    // 按文本长度估算一个兜底时间，到点强制继续流程，防止卡住
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      clearTimeout(watchdog);
      if (onEnd) onEnd();
    };
    const watchdog = setTimeout(finish, Math.min(3000 + text.length * 350, 12000));

    // APK 内：走系统 TTS（MainActivity 说完会调 __nativeTtsDone → finish）
    if (nativeVoice) {
      nativeTtsDoneCb = finish;
      nativeVoice.speak(text, rate, pitch);
      return;
    }

    if (!('speechSynthesis' in window)) {
      finish();
      return;
    }

    refreshVoices(); // 每次说话前再试一次，语音加载好后立即换用自然语音

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = rate;
    utter.pitch = pitch;

    const bestVoice = getBestChineseVoice(opts && opts.male);
    if (bestVoice) {
      utter.voice = bestVoice;
      utter.lang = bestVoice.lang;
    }

    utter.onend = finish;
    utter.onerror = finish;

    window.speechSynthesis.speak(utter);
  }

  // 角色的夸奖/鼓励用各自嗓音说出（见 CHARACTERS[*].voice，由 speak() 的 opts 传入）

  async function ensureMicStream() {
    if (nativeVoice) return; // APK 里麦克风由原生识别器申请管理，无需网页占用
    if (micStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setFeedback('wrong', '请允许使用麦克风，然后重新开始');
    }
  }

  function stopMicStream() {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
    }
  }

  function readQuestion(onEnd) {
    const q = state.questions[state.currentIndex];
    const opText = { multiply: '乘以', add: '加', subtract: '减', divide: '除以' }[state.operation];
    const text = `${q.a}${opText}${q.b}等于多少？`;
    speak(text, onEnd);
  }

  // ==================== 题目生成 ====================
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateQuestion() {
    const op = state.operation;
    const diff = state.difficulty;
    let a, b, answer;

    // 规则约束：乘法不出现 1；加法必须进位（个位相加 ≥ 10）；减法必须退位
    // （被减数个位 < 减数个位）。不满足就重出，最多试 100 次。
    for (let attempt = 0; attempt < 100; attempt++) {
      if (op === 'multiply') {
        switch (diff) {
          case 'm1': a = randInt(2, 9); b = randInt(2, 9); break;
          case 'm2': a = randInt(2, 9); b = randInt(10, 99); break;
          case 'm3': a = randInt(2, 9); b = randInt(100, 999); break;
          case 'm4': a = randInt(10, 99); b = randInt(10, 99); break;
          case 'm5': a = randInt(10, 99); b = randInt(100, 999); break;
        }
        answer = a * b;
      } else if (op === 'add') {
        switch (diff) {
          case 'a1': a = randInt(1, 9); b = randInt(10, 99); break;
          case 'a2': a = randInt(1, 9); b = randInt(100, 999); break;
          case 'a3': a = randInt(10, 99); b = randInt(10, 99); break;
          case 'a4': a = randInt(10, 99); b = randInt(100, 999); break;
          case 'a5': a = randInt(100, 999); b = randInt(100, 999); break;
        }
        answer = a + b;
      } else if (op === 'subtract') {
        switch (diff) {
          case 's1': a = randInt(10, 99); b = randInt(1, 9); break;
          case 's2': a = randInt(10, 99); b = randInt(10, 99); break;
          case 's3': a = randInt(100, 999); b = randInt(1, 9); break;
          case 's4': a = randInt(100, 999); b = randInt(10, 99); break;
          case 's5': a = randInt(100, 999); b = randInt(100, 999); break;
        }
        // 保证结果非负
        if (a < b) [a, b] = [b, a];
        answer = a - b;
      } else {
        // 除法保证整除：先定除数 b 和商 q，被除数 a = b × q
        let q;
        switch (diff) {
          case 'd1': b = randInt(2, 9); q = randInt(Math.ceil(10 / b), Math.floor(99 / b)); break;
          case 'd2': b = randInt(2, 9); q = randInt(Math.ceil(100 / b), Math.floor(999 / b)); break;
          case 'd3': b = randInt(12, 99); q = randInt(Math.ceil(100 / b), 9); break; // 商是一位数
          case 'd4': b = randInt(11, 99); q = randInt(Math.max(11, Math.ceil(1000 / b)), 99); break; // 商是两位数
        }
        a = b * q;
        answer = q;
      }

      if (op === 'add' && (a % 10) + (b % 10) < 10) continue; // 加法必须有进位
      if (op === 'subtract' && (a % 10) >= (b % 10)) continue; // 减法必须有退位
      break;
    }

    return { a, b, answer };
  }

  function generateQuestions() {
    const questions = [];
    // 乘法和加法交换两个数视为同一题（如 3×4 与 4×3），减法和除法顺序不同是不同题
    const commutative = state.operation !== 'subtract' && state.operation !== 'divide';
    const makeKey = (a, b) => (commutative ? `${Math.min(a, b)}_${Math.max(a, b)}` : `${a}_${b}`);

    const seen = new Set();      // 已出题（含交换去重）
    const seenExact = new Set(); // 已出题（仅完全一致）
    for (let i = 0; i < state.count; i++) {
      let q = null;
      for (let attempt = 0; attempt < 100; attempt++) {
        const cand = generateQuestion();
        if (!seen.has(makeKey(cand.a, cand.b))) {
          q = cand;
          break;
        }
      }
      if (!q) {
        // 题池不足（如口诀表题量超过 45 题）：降级为只排除完全相同的题目
        for (let attempt = 0; attempt < 100; attempt++) {
          const cand = generateQuestion();
          if (!seenExact.has(`${cand.a}_${cand.b}`)) {
            q = cand;
            break;
          }
        }
      }
      if (!q) q = generateQuestion(); // 极端兜底，保证出满题目数量
      seen.add(makeKey(q.a, q.b));
      seenExact.add(`${q.a}_${q.b}`);
      questions.push(q);
    }
    return questions;
  }

  // ==================== UI 交互 ====================
  function renderDifficulties() {
    difficultyList.innerHTML = '';
    const list = DIFFICULTIES[state.operation];
    list.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'difficulty-item' + (item.key === state.difficulty ? ' selected' : '');
      div.innerHTML = `
        <input type="radio" name="difficulty" id="${item.key}" value="${item.key}" ${item.key === state.difficulty ? 'checked' : ''}>
        <label for="${item.key}">
          <div>${item.label}</div>
          <small style="color: var(--muted);">${item.desc}</small>
        </label>
      `;
      div.addEventListener('click', () => {
        state.difficulty = item.key;
        renderDifficulties();
      });
      difficultyList.appendChild(div);
    });
  }

  function switchScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function setFeedback(type, text) {
    answerFeedback.className = 'answer-feedback ' + type;
    answerFeedback.textContent = text;
  }

  function updateProgress() {
    const pct = ((state.currentIndex) / state.count) * 100;
    progressFill.style.width = pct + '%';
    progressText.textContent = `${Math.min(state.currentIndex + 1, state.count)} / ${state.count}`;
  }

  function showQuestion() {
    const q = state.questions[state.currentIndex];
    const opSymbol = { multiply: '×', add: '+', subtract: '-' }[state.operation];
    questionDisplay.textContent = `${q.a} ${opSymbol} ${q.b}`;
    manualAnswer.value = '';
    setFeedback('', '准备好了，请回答');
    setRobotState(quizRobot);
    quizBubble.textContent = pick(ROBOT_LINES.question);
    updateProgress();
    readQuestion(() => {
      // 读完题目后自动开始识别
      setTimeout(startListening, 200);
    });
  }

  async function startQuiz() {
    const count = parseInt(countInput.value, 10);
    if (isNaN(count) || count < 1) {
      alert('题目数量至少为 1');
      return;
    }
    if (count > 50) {
      alert('每次最多 50 题');
      return;
    }
    state.count = count;
    state.questions = generateQuestions();
    state.currentIndex = 0;
    state.score = 0;
    state.wrong = [];
    state.isAnswering = false;

    // 获取麦克风权限并保持活跃，避免每题都弹窗
    await ensureMicStream();

    switchScreen('quiz');
    showQuestion();
  }

  // ==================== 答案处理 ====================
  function parseNumber(text) {
    if (typeof text !== 'string') return null;

    // 1. 直接匹配阿拉伯数字
    const digitMatch = text.match(/-?\d+/);
    if (digitMatch) return parseInt(digitMatch[0], 10);

    // 2. 解析中文数字（支持 个、十、百、千）
    const digitMap = {
      '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
      '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    };
    const unitMap = { '十': 10, '百': 100, '千': 1000 };

    let total = 0;
    let section = 0;
    let number = 0;
    let hasNumber = false;

    for (const ch of text) {
      if (digitMap[ch] !== undefined) {
        number = digitMap[ch];
        hasNumber = true;
      } else if (unitMap[ch] !== undefined) {
        if (number === 0) number = 1; // 处理 “十五” 这类情况
        section += number * unitMap[ch];
        number = 0;
        hasNumber = true;
      }
    }

    if (!hasNumber) return null;
    return total + section + number;
  }

  function handleAnswer(value) {
    if (state.isAnswering) return;
    state.isAnswering = true;

    const userAnswer = parseInt(value, 10);
    const q = state.questions[state.currentIndex];
    const isCorrect = userAnswer === q.answer;
    const ch = CHARACTERS[state.mode];
    const lines = settings.lines[state.mode]; // 台词可在「设置」里按模式自定义

    if (isCorrect) {
      state.score++;
      setFeedback('correct', `答对了！${q.a} ${getOpSymbol()} ${q.b} = ${q.answer}`);
      setRobotState(quizRobot, 'robot-happy');
      quizBubble.textContent = lines.praise;
      speak(lines.praise, () => nextQuestion(), ch.voice);
    } else {
      state.wrong.push({ ...q, userAnswer });
      setFeedback('wrong', `答错了，正确答案是 ${q.answer}`);
      setRobotState(quizRobot, 'robot-sad');
      quizBubble.textContent = lines.encourage;
      speak(lines.encourage, () => nextQuestion(), ch.voice);
    }
  }

  function getOpSymbol() {
    return { multiply: '×', add: '+', subtract: '-', divide: '÷' }[state.operation];
  }

  function nextQuestion() {
    state.currentIndex++;
    if (state.currentIndex >= state.count) {
      setTimeout(showResult, 600);
    } else {
      state.isAnswering = false;
      showQuestion();
    }
  }

  // ==================== 结果页 ====================
  function showResult() {
    switchScreen('result');

    // 得分换算为百分比
    const pct = state.count === 0 ? 0 : Math.round((state.score / state.count) * 100);
    scoreText.textContent = pct + '%';
    document.getElementById('score-circle').style.setProperty('--score-deg', (pct / 100) * 360 + 'deg');

    // 按得分率说不同的话（两个角色共用）
    let line;
    if (pct === 100) line = '哇噻！你棒呆啦！';
    else if (pct > 98) line = '很棒哦！';
    else if (pct > 95) line = '有点棒，加油！';
    else line = '哦哦，要使劲加油哦！';
    scoreMessage.textContent = line;
    resultBubble.textContent = line;

    // 角色根据成绩做出反应，满分放彩带
    clearConfetti();
    setRobotState(resultRobot, pct > 95 ? 'robot-happy' : 'robot-sad');
    if (pct === 100) launchConfetti();

    wrongItems.innerHTML = '';
    if (state.wrong.length === 0) {
      wrongList.classList.add('hidden');
    } else {
      wrongList.classList.remove('hidden');
      state.wrong.forEach((w) => {
        const li = document.createElement('li');
        li.textContent = `${w.a} ${getOpSymbol()} ${w.b} = ${w.answer}（你答了 ${w.userAnswer}）`;
        wrongItems.appendChild(li);
      });
    }

    speak(`练习完成，得分率${pct}%。${line}`);
  }

  // ==================== 事件绑定 ====================
  function bindEvents() {
    // 设置弹窗
    settingsBtn.addEventListener('click', openSettings);
    settingsCancelBtn.addEventListener('click', closeSettings);
    settingsSaveBtn.addEventListener('click', saveSettingsFromModal);
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings(); // 点遮罩关闭
    });
    settingsModeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        stashSettingsLineInputs(); // 先收好当前模式的台词草稿
        settingsDraftMode = tab.dataset.mode;
        syncSettingsModeTabs();
        fillSettingsLineInputs();
      });
    });

    opTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        opTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.operation = tab.dataset.op;
        state.difficulty = DIFFICULTIES[state.operation][0].key;
        renderDifficulties();
      });
    });

    countBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.dataset.delta, 10);
        let v = parseInt(countInput.value, 10) || 0;
        v = Math.max(1, Math.min(50, v + delta));
        countInput.value = v;
      });
    });

    countInput.addEventListener('change', () => {
      let v = parseInt(countInput.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 50) v = 50;
      countInput.value = v;
    });

    startBtn.addEventListener('click', startQuiz);

    // 回车开始练习：仅在设置页且设置弹窗关闭时生效；
    // 焦点在按钮上时让原生点击处理，避免重复触发
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (!screens.setup.classList.contains('active')) return;
      if (!settingsModal.classList.contains('hidden')) return;
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      startQuiz();
    });

    // 语音按钮：点击重说（正常情况下读完题目会自动开始识别）
    listenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!recognition) {
        setFeedback('wrong', '当前浏览器不支持语音识别，请手动输入');
        return;
      }
      startListening();
    });

    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = manualAnswer.value.trim();
      if (val === '') return;
      handleAnswer(val);
    });

    quitBtn.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      clearInterimTimer();
      if (recognition && isListening) {
        try { recognition.stop(); } catch (e) {}
      }
      setRobotState(quizRobot);
      stopMicStream();
      switchScreen('setup');
    });

    restartBtn.addEventListener('click', startQuiz);
    homeBtn.addEventListener('click', () => {
      clearConfetti();
      setRobotState(resultRobot);
      stopMicStream();
      switchScreen('setup');
    });
  }

  init();
})();
