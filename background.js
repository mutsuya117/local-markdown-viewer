// Background Service Worker - インストール時の処理

// 拡張機能のインストール時またはアップデート時に実行
chrome.runtime.onInstalled.addListener((details) => {
  // インストール理由を確認
  if (details.reason === 'install') {
    // 初回インストール時のみセットアップページを開く
    chrome.tabs.create({
      url: chrome.runtime.getURL('setup.html')
    });
  } else if (details.reason === 'update') {
    // アップデート時は何もしない（必要に応じて変更通知ページを開くことも可能）
    console.log('Local Markdown Viewer がアップデートされました');
  }
});
