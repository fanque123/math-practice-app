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

import com.k2fsa.sherpa.onnx.EndpointConfig;
import com.k2fsa.sherpa.onnx.EndpointRule;
import com.k2fsa.sherpa.onnx.FeatureConfig;
import com.k2fsa.sherpa.onnx.OnlineModelConfig;
import com.k2fsa.sherpa.onnx.OnlineRecognizer;
import com.k2fsa.sherpa.onnx.OnlineRecognizerConfig;
import com.k2fsa.sherpa.onnx.OnlineStream;
import com.k2fsa.sherpa.onnx.OnlineTransducerModelConfig;

import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 极简 WebView 壳：全屏加载打包在 assets 里的口算练习网页。
 * WebView 不支持 Web Speech API，语音能力由原生桥 window.AndroidNative 提供：
 * 朗读走系统 TTS（小米=讯飞/小爱引擎），识别走 sherpa-onnx 离线引擎
 * （模型在 assets/sherpa-model，全程本地识别，不依赖系统 SpeechRecognizer 和网络，
 * 解决小米等国产 ROM 上系统识别服务不稳定的问题）。
 */
public class MainActivity extends Activity {
    private WebView webView;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    // 离线识别器：onCreate 时后台线程加载模型，避免卡住首屏
    private volatile OnlineRecognizer asr = null;
    private volatile boolean asrInitFailed = false;
    // 当前录音识别会话（每次 startListening 一个会话，线程安全地停止旧会话）
    private volatile RecogSession recogSession = null;
    private boolean wantStartListening = false;
    private final Handler main = new Handler(Looper.getMainLooper());
    private static final int REQ_MIC = 1;
    private static final int SAMPLE_RATE = 16000;

    // 数字热词：答案只会是数字，给数字/单位字加权，让解码明显偏向数字，
    // 抑制把"三"听成"山"、"十"听成"是"这类同音误判。
    // 格式：每行一个词（cjkchar 模型单字即 token，多字词需空格分字），":2" 为加权分值。
    // 注意：热词只在 modified_beam_search 解码下生效（greedy_search 不支持）。
    private static final String HOTWORDS =
            "零 :2\n一 :2\n二 :2\n两 :2\n三 :2\n四 :2\n五 :2\n六 :2\n七 :2\n八 :2\n九 :2\n"
            + "十 :2\n百 :2\n千 :2\n万 :2";

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

        // 后台预加载离线识别模型（约 48MB，首次加载 2~3 秒），避免第一题开始时等待
        new Thread(this::initAsr).start();
    }

    /** 初始化 sherpa-onnx 离线识别器（子线程调用）；模型路径相对 assets */
    private void initAsr() {
        try {
            // 模型：streaming zipformer small-bilingual-zh-en int8（约 48MB，
            // 比原 zh-14M 模型大一档，中文识别明显更准；modelType 同为 zipformer）
            OnlineTransducerModelConfig transducer = new OnlineTransducerModelConfig();
            transducer.setEncoder("sherpa-model/encoder-epoch-99-avg-1.int8.onnx");
            transducer.setDecoder("sherpa-model/decoder-epoch-99-avg-1.int8.onnx");
            transducer.setJoiner("sherpa-model/joiner-epoch-99-avg-1.int8.onnx");

            OnlineModelConfig modelConfig = new OnlineModelConfig();
            modelConfig.setTransducer(transducer);
            modelConfig.setTokens("sherpa-model/tokens.txt");
            modelConfig.setModelType("zipformer"); // 流式 zipformer v1（pruned transducer stateless）
            modelConfig.setNumThreads(2);
            modelConfig.setProvider("cpu");
            modelConfig.setDebug(false);

            FeatureConfig featConfig = new FeatureConfig();
            featConfig.setSampleRate(SAMPLE_RATE);
            featConfig.setFeatureDim(80);

            // 端点规则：说完停顿 1.2 秒判为一句结束并出最终结果；整句最长 20 秒
            EndpointConfig endpointConfig = new EndpointConfig();
            endpointConfig.setRule1(new EndpointRule(false, 2.4f, 0f));
            endpointConfig.setRule2(new EndpointRule(true, 1.2f, 0f));
            endpointConfig.setRule3(new EndpointRule(true, 0f, 20f));

            OnlineRecognizerConfig config = new OnlineRecognizerConfig();
            config.setFeatConfig(featConfig);
            config.setModelConfig(modelConfig);
            config.setEndpointConfig(endpointConfig);
            config.setEnableEndpoint(true);
            // modified_beam_search：热词只在该解码方式下生效，且本身比 greedy_search 略准
            config.setDecodingMethod("modified_beam_search");

            asr = new OnlineRecognizer(getAssets(), config);
        } catch (Exception e) {
            asrInitFailed = true;
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
        if (asr == null) {
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
     * 一次录音识别会话：AudioRecord 采音 → sherpa-onnx 流式解码。
     * 模拟 Web Speech 的事件语义回掉网页：
     * 开始=__nativeRecogStart；中间结果=__nativeRecogResult(json,false)；
     * 端点（停顿1.2秒）或网页主动 stop=__nativeRecogResult(json,true) + __nativeRecogEnd。
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
            OnlineStream stream = asr.createStream(HOTWORDS); // 每次会话都挂数字热词
            boolean finalDelivered = false;
            try {
                record.startRecording();
                js("__nativeRecogStart");
                short[] buf = new short[SAMPLE_RATE / 10]; // 每次读 0.1 秒
                float[] samples = new float[buf.length];
                String lastText = "";
                long sessionStart = System.currentTimeMillis();
                while (running.get()) {
                    int n = record.read(buf, 0, buf.length);
                    if (n <= 0) continue;
                    for (int i = 0; i < n; i++) samples[i] = buf[i] / 32768.0f;
                    stream.acceptWaveform(samples, SAMPLE_RATE);
                    while (asr.isReady(stream)) asr.decode(stream);
                    String text = asr.getResult(stream).getText().trim();
                    if (!text.equals(lastText)) {
                        lastText = text;
                        if (!text.isEmpty()) {
                            ArrayList<String> list = new ArrayList<>();
                            list.add(text);
                            js("__nativeRecogResult(" + jsStr(toJsonArray(list)) + ", false)");
                        }
                    }
                    if (asr.isEndpoint(stream)) {
                        asr.reset(stream);
                        if (!text.isEmpty()) {
                            // 一句结束且有内容：交付最终结果并结束本次会话
                            finalDelivered = true;
                            deliverFinal(text);
                            return;
                        }
                        // 纯静音端点：超过 10 秒没人说话则上报 no-speech，让网页提示重试
                        if (System.currentTimeMillis() - sessionStart > 10000) {
                            finalDelivered = true;
                            js("__nativeRecogError(6)");
                            js("__nativeRecogEnd");
                            return;
                        }
                    }
                }
                // 网页主动 stop（拿到最终结果后或点重说前）：把手头文本作为最终结果交付
                if (deliverOnStop && !finalDelivered) {
                    while (asr.isReady(stream)) asr.decode(stream);
                    String text = asr.getResult(stream).getText().trim();
                    finalDelivered = true;
                    if (!text.isEmpty()) {
                        deliverFinal(text);
                    } else {
                        js("__nativeRecogEnd");
                    }
                }
            } catch (Exception e) {
                if (!finalDelivered) {
                    js("__nativeRecogError(-2)");
                    js("__nativeRecogEnd");
                }
            } finally {
                try { record.stop(); } catch (Exception ignored) {}
                record.release();
                stream.release();
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
