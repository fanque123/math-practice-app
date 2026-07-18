package com.fanque123.mathpractice;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.ArrayList;
import java.util.Locale;

/**
 * 极简 WebView 壳：全屏加载打包在 assets 里的口算练习网页。
 * WebView 不支持 Web Speech API，语音能力由原生桥 window.AndroidNative 提供：
 * 朗读走系统 TTS（小米=讯飞/小爱引擎），识别走 SpeechRecognizer。
 */
public class MainActivity extends Activity {
    private WebView webView;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private SpeechRecognizer recognizer;
    private boolean wantStartListening = false;
    private final Handler main = new Handler(Looper.getMainLooper());
    private static final int REQ_MIC = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // localStorage 存设置项
        s.setAllowFileAccess(true);     // 加载打包的网页文件
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new JsBridge(), "AndroidNative");
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);

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
    }

    /** 在主线程向网页执行 window.xxx && window.xxx(...) */
    private void js(String fn) {
        main.post(() -> webView.evaluateJavascript("window." + fn + " && window." + fn + "()", null));
    }

    private static String jsStr(String s) {
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'";
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
            main.post(() -> {
                if (recognizer != null) {
                    try { recognizer.stopListening(); } catch (Exception ignored) {}
                }
            });
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
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            js("__nativeRecogError(-1)"); // 手机没有语音识别服务（少见）
            return;
        }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(new Listener());
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN")
                .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        try {
            recognizer.cancel(); // 清掉可能残留的上一次会话
            recognizer.startListening(intent);
        } catch (Exception e) {
            js("__nativeRecogError(-2)");
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

    private class Listener implements RecognitionListener {
        @Override public void onReadyForSpeech(Bundle params) {
            js("__nativeRecogStart");
        }
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onError(int error) {
            js("__nativeRecogError(" + error + ")");
        }
        @Override public void onResults(Bundle results) {
            ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            String text = (list == null || list.isEmpty()) ? "" : list.get(0);
            js("__nativeRecogResult(" + jsStr(text) + ", true)");
            js("__nativeRecogEnd");
        }
        @Override public void onPartialResults(Bundle partialResults) {
            ArrayList<String> list = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (list == null || list.isEmpty()) return;
            js("__nativeRecogResult(" + jsStr(list.get(0)) + ", false)");
        }
        @Override public void onEvent(int eventType, Bundle params) {}
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (recognizer != null) recognizer.destroy();
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
