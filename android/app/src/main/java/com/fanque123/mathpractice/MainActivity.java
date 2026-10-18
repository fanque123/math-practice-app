package com.fanque123.mathpractice;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.k2fsa.sherpa.onnx.FeatureConfig;
import com.k2fsa.sherpa.onnx.HomophoneReplacerConfig;
import com.k2fsa.sherpa.onnx.OfflineCanaryModelConfig;
import com.k2fsa.sherpa.onnx.OfflineCohereTranscribeModelConfig;
import com.k2fsa.sherpa.onnx.OfflineDolphinModelConfig;
import com.k2fsa.sherpa.onnx.OfflineFireRedAsrCtcModelConfig;
import com.k2fsa.sherpa.onnx.OfflineFireRedAsrModelConfig;
import com.k2fsa.sherpa.onnx.OfflineFunAsrNanoModelConfig;
import com.k2fsa.sherpa.onnx.OfflineMedAsrCtcModelConfig;
import com.k2fsa.sherpa.onnx.OfflineModelConfig;
import com.k2fsa.sherpa.onnx.OfflineMoonshineModelConfig;
import com.k2fsa.sherpa.onnx.OfflineNemoEncDecCtcModelConfig;
import com.k2fsa.sherpa.onnx.OfflineOmnilingualAsrCtcModelConfig;
import com.k2fsa.sherpa.onnx.OfflineParaformerModelConfig;
import com.k2fsa.sherpa.onnx.OfflineQwen3AsrModelConfig;
import com.k2fsa.sherpa.onnx.OfflineRecognizer;
import com.k2fsa.sherpa.onnx.OfflineRecognizerConfig;
import com.k2fsa.sherpa.onnx.OfflineSenseVoiceModelConfig;
import com.k2fsa.sherpa.onnx.OfflineStream;
import com.k2fsa.sherpa.onnx.OfflineTransducerModelConfig;
import com.k2fsa.sherpa.onnx.OfflineWenetCtcModelConfig;
import com.k2fsa.sherpa.onnx.OfflineWhisperModelConfig;
import com.k2fsa.sherpa.onnx.OfflineZipformerCtcModelConfig;
import com.k2fsa.sherpa.onnx.SileroVadModelConfig;
import com.k2fsa.sherpa.onnx.SpeechSegment;
import com.k2fsa.sherpa.onnx.Vad;
import com.k2fsa.sherpa.onnx.VadModelConfig;

import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 极简 WebView 壳：全屏加载打包在 assets 里的口算练习网页。
 * WebView 不支持 Web Speech API，语音能力由原生桥 window.AndroidNative 提供：
 * 朗读走系统 TTS（小米=讯飞/小爱引擎），识别走 sherpa-onnx 离线引擎。
 *
 * v1.13 起识别换成「非流式中文 Paraformer + Silero VAD」：
 * 先用 VAD 判断一句话什么时候说完，再把整段音频一次性送进 Paraformer。
 * 非流式模型能看到整句上下文，数字尾音不会被吞掉；旧的流式 zipformer
 * 会把“七十二”听成“七十”、“一百零二”听成“一百”（实测 40 题错 24 题）。
 */
public class MainActivity extends Activity {
    private WebView webView;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    // 离线识别器：onCreate 时后台线程加载模型，避免卡住首屏
    private volatile OfflineRecognizer asr = null;
    private volatile boolean asrInitFailed = false;
    // VAD 配置（Silero，643KB）：判断孩子什么时候说完一句
    private volatile VadModelConfig vadConfig = null;
    // 解码前拼在录音前面的「答案是」提示音（16kHz PCM）。
    // 非流式 Paraformer 对孤立单字（尤其"五"）容易输出英文 "who"，
    // 前面垫一句中文能把语言拉回中文；实测 0~9 单字从 9/10 变 10/10，
    // 40 个多位数仍 40/40。parseNumber() 会自动去掉"答案是"前缀。
    private volatile float[] promptSamples = null;
    // 当前录音识别会话（每次 startListening 一个会话，线程安全地停止旧会话）
    private volatile RecogSession recogSession = null;
    // sherpa-onnx 的 C++ 识别器不是线程安全的，串行调用
    private final Object asrLock = new Object();
    private boolean wantStartListening = false;
    private final Handler main = new Handler(Looper.getMainLooper());
    private static final int REQ_MIC = 1;
    private static final int SAMPLE_RATE = 16000;
    /** 说完后静音多久算一句结束；太短会把“七十二”的“二”切掉，太长则反应慢 */
    private static final float VAD_MIN_SILENCE = 1.0f;
    /** 一句最长录音，防止孩子一直说话不出结果 */
    private static final float VAD_MAX_SPEECH = 10.0f;
    /** 一直没人说话多久后提示「没听清」 */
    private static final long NO_SPEECH_TIMEOUT_MS = 10000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // localStorage 存设置项
        s.setAllowFileAccess(true);     // 加载打包的网页文件
        s.setMediaPlaybackRequiresUserGesture(false); // 机器人音效台词自动播放
        // Android 15 强制边到边布局：给状态栏/导航栏留内边距，避免按钮被系统图标和手势条遮住
        webView.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new JsBridge(), "AndroidNative");
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
        webView.requestApplyInsets(); // 挂载后手动派发一次（部分机型不主动派发）

        // 系统 TTS：初始化是异步的，就绪前 speak 会短暂等待重试
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(Locale.CHINESE);
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                    r = tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
                }
                ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
            }
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { js("__nativeTtsDone"); }
            @Override public void onError(String id) { js("__nativeTtsDone"); } // 出错也放行，防卡死
        });

        // 后台预加载离线识别模型（约 82MB，首次加载 2~4 秒），避免第一题开始时等待
        new Thread(this::initAsr).start();
    }

    /** 初始化 sherpa-onnx 离线识别器（子线程调用）；模型路径相对 assets */
    private void initAsr() {
        try {
            // 模型：Paraformer-zh-small int8（阿里 FunASR Paraformer，中文专用非流式，
            // 约 82MB）。官方导出的 onnx 缺 sherpa 需要的 CMVN 元数据，构建前已补齐：
            // vocab_size / lfr_window_size=7 / lfr_window_shift=6 / neg_mean / inv_stddev
            OfflineParaformerModelConfig paraformer = new OfflineParaformerModelConfig();
            paraformer.setModel("sherpa-model/model.int8.onnx");

            OfflineModelConfig modelConfig = new OfflineModelConfig(
                    new OfflineTransducerModelConfig(),
                    paraformer,
                    new OfflineWhisperModelConfig(),
                    new OfflineFireRedAsrModelConfig(),
                    new OfflineMoonshineModelConfig(),
                    new OfflineNemoEncDecCtcModelConfig(),
                    new OfflineSenseVoiceModelConfig(),
                    new OfflineDolphinModelConfig(),
                    new OfflineZipformerCtcModelConfig(),
                    new OfflineWenetCtcModelConfig(),
                    new OfflineOmnilingualAsrCtcModelConfig(),
                    new OfflineMedAsrCtcModelConfig(),
                    new OfflineFunAsrNanoModelConfig(),
                    new OfflineQwen3AsrModelConfig(),
                    new OfflineFireRedAsrCtcModelConfig(),
                    new OfflineCanaryModelConfig(),
                    new OfflineCohereTranscribeModelConfig(),
                    "",                                 // teleSpeech
                    2,                                  // numThreads
                    false,                              // debug
                    "cpu",                              // provider
                    "paraformer",                       // modelType
                    "sherpa-model/tokens.txt",          // tokens
                    "",                                 // modelingUnit
                    "");                                // bpeVocab

            OfflineRecognizerConfig config = new OfflineRecognizerConfig(
                    new FeatureConfig(SAMPLE_RATE, 80, 0f),
                    modelConfig,
                    new HomophoneReplacerConfig(),
                    "greedy_search",
                    4,
                    "",
                    1.5f,
                    "",
                    "",
                    0f);

            asr = new OfflineRecognizer(getAssets(), config);

            SileroVadModelConfig silero = new SileroVadModelConfig();
            silero.setModel("sherpa-model/silero_vad.onnx");
            silero.setThreshold(0.5f);
            silero.setMinSilenceDuration(VAD_MIN_SILENCE);
            // 单个数字（"二""五"）往往只有 0.15~0.2 秒，设 0.25 会被 VAD 丢掉，
            // 导致一位数答案永远识别不到；0.1 秒可稳定捕获
            silero.setMinSpeechDuration(0.1f);
            silero.setWindowSize(512);
            silero.setMaxSpeechDuration(VAD_MAX_SPEECH);

            VadModelConfig vc = new VadModelConfig();
            vc.setSileroVadModelConfig(silero);
            vc.setSampleRate(SAMPLE_RATE);
            vc.setNumThreads(1);
            vc.setProvider("cpu");
            vc.setDebug(false);
            vadConfig = vc;

            promptSamples = loadPcm("sherpa-model/prompt.pcm");
        } catch (Throwable t) {
            asrInitFailed = true;
        }
    }

    /** 读取 16kHz 单声道 int16 裸 PCM，转成 [-1,1] 的 float 数组 */
    private float[] loadPcm(String path) {
        try (java.io.InputStream is = getAssets().open(path)) {
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            byte[] tmp = new byte[8192];
            int n;
            while ((n = is.read(tmp)) > 0) bos.write(tmp, 0, n);
            byte[] bytes = bos.toByteArray();
            short[] shorts = new short[bytes.length / 2];
            java.nio.ByteBuffer.wrap(bytes)
                    .order(java.nio.ByteOrder.LITTLE_ENDIAN)
                    .asShortBuffer()
                    .get(shorts);
            float[] out = new float[shorts.length];
            for (int i = 0; i < shorts.length; i++) out[i] = shorts[i] / 32768.0f;
            return out;
        } catch (Throwable t) {
            return null;
        }
    }

    /** 在主线程向网页执行 window.xxx && window.xxx(...) */
    private void js(String fn) {
        main.post(() -> webView.evaluateJavascript("window." + fn + " && window." + fn + "()", null));
    }

    private static String jsStr(String s) {
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    /** 把候选文本列表序列化成 JSON 数组字符串 */
    private static String toJsonArray(ArrayList<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(jsonEscape(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    private static String jsonEscape(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    /** 注入给网页调用的原生桥（window.AndroidNative） */
    class JsBridge {
        @JavascriptInterface
        public void speak(String text, float rate, float pitch) {
            main.post(() -> speakInternal(text, rate, pitch, false));
        }

        @JavascriptInterface
        public void stopSpeaking() {
            main.post(() -> { if (tts != null) tts.stop(); });
        }

        @JavascriptInterface
        public void startListening() {
            main.post(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
                    wantStartListening = true;
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                    return;
                }
                doStartListening();
            });
        }

        @JavascriptInterface
        public void stopListening() {
            main.post(() -> stopRecogSession(true));
        }

        @JavascriptInterface
        public void exit() {
            main.post(() -> finish()); // 网页的「退出/退回」按钮：关闭整个应用
        }
    }

    private void speakInternal(String text, float rate, float pitch, boolean retried) {
        if (!ttsReady) {
            // TTS 引擎还在初始化，等 600ms 重试一次；再不行就放行，避免卡流程
            if (!retried) {
                main.postDelayed(() -> speakInternal(text, rate, pitch, true), 600);
            } else {
                js("__nativeTtsDone");
            }
            return;
        }
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1f);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "math-utter");
    }

    private void doStartListening() {
        if (asrInitFailed) {
            js("__nativeRecogError(-1)"); // 离线模型加载失败（不应发生，除非 APK 缺文件）
            return;
        }
        if (asr == null || vadConfig == null) {
            // 模型还在后台加载，稍等重试（加载失败时 asrInitFailed 会终止重试）
            main.postDelayed(this::doStartListening, 300);
            return;
        }
        stopRecogSession(false); // 停掉可能残留的旧会话，避免重复占用麦克风
        RecogSession session = new RecogSession();
        recogSession = session;
        new Thread(session::run, "asr-record").start();
    }

    /** 停止当前识别会话；deliverOnStop=true 时把手头已识别到的文本作为最终结果交付 */
    private void stopRecogSession(boolean deliverOnStop) {
        RecogSession s = recogSession;
        recogSession = null;
        if (s != null) s.stop(deliverOnStop);
    }

    /**
     * 一次录音识别会话：AudioRecord 采音 → Silero VAD 判断句子结束 →
     * 整段音频一次性送 Paraformer 解码。
     * 模拟 Web Speech 的事件语义回调网页：
     * 开始=__nativeRecogStart；最终结果=__nativeRecogResult(json,true) + __nativeRecogEnd。
     * 非流式模型不需要中间结果，网页端只在拿到最终结果时判分。
     */
    private class RecogSession {
        private final AtomicBoolean running = new AtomicBoolean(true);
        private volatile boolean deliverOnStop = false;

        void stop(boolean deliver) {
            deliverOnStop = deliver;
            running.set(false);
        }

        void run() {
            int minBuf = AudioRecord.getMinBufferSize(SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
            AudioRecord record = new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION,
                    SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT, Math.max(minBuf, SAMPLE_RATE));
            Vad vad = null;
            boolean finalDelivered = false;
            try {
                vad = new Vad(getAssets(), vadConfig);
                record.startRecording();
                js("__nativeRecogStart");
                short[] buf = new short[SAMPLE_RATE / 10]; // 每次读 0.1 秒
                long sessionStart = System.currentTimeMillis();
                long lastSpeechAt = sessionStart;
                boolean speechSeen = false;

                while (running.get()) {
                    int n = record.read(buf, 0, buf.length);
                    if (n <= 0) continue;
                    float[] samples = new float[n];
                    for (int i = 0; i < n; i++) samples[i] = buf[i] / 32768.0f;

                    vad.acceptWaveform(samples);
                    if (vad.isSpeechDetected()) {
                        speechSeen = true;
                        lastSpeechAt = System.currentTimeMillis();
                    }

                    // VAD 已经切出完整一句：解码并交卷
                    while (!vad.empty()) {
                        SpeechSegment segment = vad.front();
                        float[] segSamples = segment.getSamples();
                        vad.pop();
                        speechSeen = true;
                        lastSpeechAt = System.currentTimeMillis();
                        if (segSamples == null || segSamples.length < SAMPLE_RATE / 10) continue;
                        String text = decode(segSamples);
                        if (!text.isEmpty()) {
                            finalDelivered = true;
                            deliverFinal(text);
                            return;
                        }
                    }

                    long now = System.currentTimeMillis();
                    if (!speechSeen && now - sessionStart > NO_SPEECH_TIMEOUT_MS) {
                        finalDelivered = true;
                        js("__nativeRecogError(6)"); // 一直没说话，网页提示「没听清」
                        js("__nativeRecogEnd");
                        return;
                    }
                    if (speechSeen && now - lastSpeechAt > 15000) {
                        // 有声音但 VAD 始终没切出句子（极端噪声），兜底结束
                        finalDelivered = true;
                        js("__nativeRecogEnd");
                        return;
                    }
                }

                // 网页主动 stop（点重说/退出）：把 VAD 里没切完的半句也解出来
                if (deliverOnStop && !finalDelivered) {
                    vad.flush();
                    while (!vad.empty()) {
                        SpeechSegment segment = vad.front();
                        float[] segSamples = segment.getSamples();
                        vad.pop();
                        if (segSamples == null || segSamples.length < SAMPLE_RATE / 10) continue;
                        String text = decode(segSamples);
                        if (!text.isEmpty()) {
                            finalDelivered = true;
                            deliverFinal(text);
                            return;
                        }
                    }
                    finalDelivered = true;
                    js("__nativeRecogEnd");
                }
            } catch (Throwable t) {
                if (!finalDelivered) {
                    js("__nativeRecogError(-2)");
                    js("__nativeRecogEnd");
                }
            } finally {
                try { record.stop(); } catch (Exception ignored) {}
                record.release();
                if (vad != null) vad.release();
            }
        }

        /** 整段音频一次性解码（非流式 Paraformer），返回识别文本 */
        private String decode(float[] samples) {
            OfflineStream stream = null;
            try {
                float[] input = samples;
                float[] prompt = promptSamples;
                if (prompt != null && prompt.length > 0) {
                    input = new float[prompt.length + samples.length];
                    System.arraycopy(prompt, 0, input, 0, prompt.length);
                    System.arraycopy(samples, 0, input, prompt.length, samples.length);
                }
                synchronized (asrLock) {
                    stream = asr.createStream();
                    stream.acceptWaveform(input, SAMPLE_RATE);
                    asr.decode(stream);
                    return asr.getResult(stream).getText().trim();
                }
            } catch (Throwable t) {
                return "";
            } finally {
                if (stream != null) stream.release();
            }
        }

        private void deliverFinal(String text) {
            ArrayList<String> list = new ArrayList<>();
            list.add(text);
            js("__nativeRecogResult(" + jsStr(toJsonArray(list)) + ", true)");
            js("__nativeRecogEnd");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_MIC) {
            if (wantStartListening && grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                doStartListening();
            } else {
                js("__nativeRecogError(9)"); // 用户拒绝 → 网页提示「请允许使用麦克风」
            }
            wantStartListening = false;
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        stopRecogSession(false);
        if (asr != null) asr.release();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
