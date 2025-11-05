// Background Service Worker - インストール時の処理と画像変換

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

// Content Scriptからのメッセージを受信（画像Base64変換用）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CONVERT_IMAGE_TO_BASE64') {
    // 非同期処理のため、Promiseを使用
    convertImageToBase64(request.imageUrl)
      .then(base64 => {
        sendResponse({ success: true, base64: base64 });
      })
      .catch(error => {
        console.error('画像変換エラー:', request.imageUrl, error);
        sendResponse({ success: false, error: error.message });
      });

    // 非同期レスポンスを返すためにtrueを返す
    return true;
  }
});

// 画像をBase64に変換する関数
async function convertImageToBase64(imageUrl) {
  try {
    // セキュリティ: 画像サイズの上限（30MB）
    const MAX_IMAGE_SIZE = 30 * 1024 * 1024;

    // fetchで画像を取得
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Content-Lengthでサイズをチェック
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      throw new Error(`画像サイズが大きすぎます（上限: ${MAX_IMAGE_SIZE / 1024 / 1024}MB）`);
    }

    // Blobとして取得
    const blob = await response.blob();

    // セキュリティ: 実際のBlobサイズをチェック
    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error(`画像サイズが大きすぎます（上限: ${MAX_IMAGE_SIZE / 1024 / 1024}MB）`);
    }

    // セキュリティ: 画像のMIMEタイプを検証
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
    if (!validImageTypes.includes(blob.type)) {
      throw new Error(`サポートされていない画像形式です: ${blob.type}`);
    }

    // FileReaderでBase64に変換
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw error;
  }
}
