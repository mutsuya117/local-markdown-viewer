// Setup Page Script - 拡張機能の管理ページを開く

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', function() {
  // 拡張機能の管理ページを開くボタン
  const openExtensionsBtn = document.getElementById('openExtensionsBtn');

  if (openExtensionsBtn) {
    openExtensionsBtn.addEventListener('click', function() {
      chrome.tabs.create({ url: 'chrome://extensions/' });
    });
  }
});
