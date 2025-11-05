// Setup Page Script - 拡張機能の管理ページを開く

// i18nメッセージを取得して設定する関数
function setI18nText(elementId, messageName) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = chrome.i18n.getMessage(messageName);
  }
}

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', function() {
  // ページタイトルを設定
  document.title = chrome.i18n.getMessage('setupTitle');

  // 言語に応じてlang属性を設定
  const locale = chrome.i18n.getUILanguage();
  document.documentElement.lang = locale;

  // 各要素にi18nテキストを設定
  setI18nText('thankYouText', 'setupThankYou');
  setI18nText('importantTitle', 'setupImportant');
  setI18nText('importantDesc', 'setupImportantDesc');
  setI18nText('step1Title', 'setupStep1Title');
  setI18nText('step1Desc', 'setupStep1Desc');
  setI18nText('step1Note', 'setupStep1Note');
  setI18nText('openExtensionsBtn', 'setupStep1Button');
  setI18nText('step2Title', 'setupStep2Title');
  setI18nText('step2Desc', 'setupStep2Desc');
  setI18nText('step3Title', 'setupStep3Title');
  setI18nText('step3Desc', 'setupStep3Desc');
  setI18nText('step4Title', 'setupStep4Title');
  setI18nText('step4Desc', 'setupStep4Desc');
  setI18nText('whatIsThisTitle', 'setupWhatIsThis');
  setI18nText('whatIsThisDesc', 'setupWhatIsThisDesc');
  setI18nText('whyNeededTitle', 'setupWhyNeeded');
  setI18nText('whyNeededDesc', 'setupWhyNeededDesc');
  setI18nText('safetyTitle', 'setupSafetyTitle');
  setI18nText('safety1', 'setupSafety1');
  setI18nText('safety2', 'setupSafety2');
  setI18nText('safety3', 'setupSafety3');
  setI18nText('safety4', 'setupSafety4');
  setI18nText('safety5', 'setupSafety5');
  setI18nText('safety6', 'setupSafety6');
  setI18nText('completeTitle', 'setupCompleteTitle');
  setI18nText('completeDesc', 'setupCompleteDesc');
  setI18nText('usageTitle', 'setupUsageTitle');
  setI18nText('usageDesc', 'setupUsageDesc');

  // 拡張機能の管理ページを開くボタン
  const openExtensionsBtn = document.getElementById('openExtensionsBtn');

  if (openExtensionsBtn) {
    openExtensionsBtn.addEventListener('click', function() {
      chrome.tabs.create({ url: 'chrome://extensions/' });
    });
  }
});
