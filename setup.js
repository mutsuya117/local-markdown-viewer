// Setup Page Script - 拡張機能の管理ページを開く

// i18nメッセージを取得して設定する関数
function setI18nText(elementId, messageName) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = chrome.i18n.getMessage(messageName);
  }
}

// 更新履歴データ（新しいバージョンを先頭に追加する）
// version, date は固定値、items は _locales のi18nメッセージキー
const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-06-08',
    items: ['changelog_1_1_0_a', 'changelog_1_1_0_b', 'changelog_1_1_0_c']
  },
  {
    version: '1.0.7',
    date: '2025-11-11',
    items: ['changelog_1_0_7_a']
  },
  {
    version: '1.0.0',
    date: '2025-11-10',
    items: ['changelog_1_0_0_a']
  }
];

// 更新履歴を描画する関数
function renderChangelog() {
  const container = document.getElementById('changelogList');
  if (!container) return;

  // 各バージョンのエントリを生成（version/dateは固定値、itemsはi18nメッセージ）
  const html = CHANGELOG.map(function(entry) {
    const items = entry.items
      .map(function(key) {
        return '<li>' + chrome.i18n.getMessage(key) + '</li>';
      })
      .join('');
    return (
      '<div class="changelog-entry">' +
      '<div class="changelog-version">' +
      '<span class="changelog-badge">v' + entry.version + '</span>' +
      '<span class="changelog-date">' + entry.date + '</span>' +
      '</div>' +
      '<ul>' + items + '</ul>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = html;
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

  // 更新履歴セクション
  setI18nText('changelogTitle', 'changelogTitle');
  renderChangelog();

  // 拡張機能の管理ページを開くボタン
  const openExtensionsBtn = document.getElementById('openExtensionsBtn');

  if (openExtensionsBtn) {
    openExtensionsBtn.addEventListener('click', function() {
      chrome.tabs.create({ url: 'chrome://extensions/' });
    });
  }
});
