// Markdown Previewer - Content Script
(async function() {
  'use strict';

  // .mdファイルかどうかをチェック
  const path = window.location.pathname;
  if (!path.match(/\.(md|markdown)$/i)) {
    return;
  }

  // 生のMarkdownテキストを取得
  let markdownText = document.body.textContent;

  // localStorageから保存されたKaTeX設定を取得（デフォルト: ON）
  // セキュリティ: ホワイトリスト検証
  const rawKatexEnabled = localStorage.getItem('markdown-katex-enabled');
  const isKatexEnabled = rawKatexEnabled !== 'false'; // デフォルトON（明示的にfalseの場合のみOFF）

  // 数式ブロックを一時的に保護（Marked.jsが誤って処理しないように）
  // KaTeXが有効な場合のみ実行
  // 注意: インライン数式（$...$と\(...\)）は保護しない
  // KaTeXの auto-render.js がHTMLをパース後に直接処理する
  const mathBlocks = [];
  if (isKatexEnabled) {
    // ディスプレイ数式 $$...$$ のみ保護（$...$との混同を防ぐため先に処理）
    markdownText = markdownText.replace(/\$\$[\s\S]*?\$\$/g, function(match) {
      const placeholder = `MATH_BLOCK_${mathBlocks.length}_PLACEHOLDER`;
      mathBlocks.push(match);
      return placeholder;
    });

    // ディスプレイ数式 \[...\] を保護
    markdownText = markdownText.replace(/\\\[[\s\S]*?\\\]/g, function(match) {
      const placeholder = `MATH_BLOCK_${mathBlocks.length}_PLACEHOLDER`;
      mathBlocks.push(match);
      return placeholder;
    });
  }

  // HTMLエスケープ関数（XSS対策）
  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
      return unsafe;
    }
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 見出しテキストからスラッグ（ID）を生成する関数（github-slugger互換）
  function generateSlug(text) {
    // github-sluggerのアルゴリズムを参考に実装
    // 参考: https://github.com/Flet/github-slugger

    return text
      .toLowerCase()
      .trim()
      // 制御文字を削除
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
      // 特殊記号を削除（句読点、括弧、スラッシュ、コロンなど）
      // ただし、ハイフンとアンダースコアは保持
      .replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~・（）「」『』【】]/g, '')
      // 複数の空白文字を1つのハイフンに
      .replace(/\s+/g, '-')
      // 連続するハイフンを1つに
      .replace(/-+/g, '-')
      // 先頭と末尾のハイフンを削除
      .replace(/^-+|-+$/g, '');
  }

  // marked.jsの設定（GFM対応）
  const renderer = new marked.Renderer();

  // 使用済みIDを追跡（重複ID対策）
  const usedIds = new Map();

  // 見出しのレンダラーをカスタマイズ
  const originalHeading = renderer.heading.bind(renderer);
  renderer.heading = function(text, level, raw) {
    let slug = generateSlug(raw);

    // 重複ID対策：同じIDが既に使われている場合は連番を付ける
    if (usedIds.has(slug)) {
      const count = usedIds.get(slug) + 1;
      usedIds.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      usedIds.set(slug, 0);
    }

    return `<h${level} id="${slug}">${text}</h${level}>\n`;
  };

  // コードブロックのレンダラーをカスタマイズ（Mermaid対応）
  const originalCode = renderer.code.bind(renderer);
  renderer.code = function(code, language) {
    // Mermaidダイアグラムの場合は特別な処理
    if (language === 'mermaid') {
      // mermaidクラスを持つdivとして出力（後でMermaidライブラリが描画）
      const escapedCode = escapeHtml(code);
      return `<div class="mermaid">${escapedCode}</div>\n`;
    }
    // それ以外は通常のコードブロック
    return originalCode(code, language);
  };

  // marked v12ではhooksを使う
  marked.use({
    renderer: renderer,
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false
  });

  // highlight.jsを適用するhooks
  marked.use({
    hooks: {
      postprocess(html) {
        // コードブロックを検索してハイライトを適用
        const div = document.createElement('div');
        div.innerHTML = html;

        div.querySelectorAll('pre code').forEach((block) => {
          // 言語クラスを取得
          const langMatch = block.className.match(/language-(\w+)/);
          if (langMatch) {
            const lang = langMatch[1];
            if (hljs.getLanguage(lang)) {
              try {
                const result = hljs.highlight(block.textContent, { language: lang });
                block.innerHTML = result.value;
                block.classList.add('hljs');
              } catch (err) {
                // エラー時はそのまま
              }
            }
          } else {
            // 言語指定なしの場合は自動検出
            try {
              const result = hljs.highlightAuto(block.textContent);
              block.innerHTML = result.value;
              block.classList.add('hljs');
            } catch (err) {
              // エラー時はそのまま
            }
          }
        });

        return div.innerHTML;
      }
    }
  });

  // Markdownをパース
  const rawHtml = marked.parse(markdownText);

  // DOMPurifyでサニタイズ（XSS対策）

  // 外部リソースの処理フック
  DOMPurify.addHook('afterSanitizeAttributes', function(node) {
    // リンクの外部URLに警告を追加
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && href.match(/^https?:\/\//i)) {
        // href値をエスケープしてtitle属性に設定（セキュリティ対策）
        node.setAttribute('title', '外部リンク: ' + escapeHtml(href));
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
      // セキュリティ: 危険なdata:スキームをブロック
      if (href && href.match(/^data:/i)) {
        // data:image/* のみ許可（それ以外は削除）
        if (!href.match(/^data:image\//i)) {
          node.removeAttribute('href');
        }
      }
    }

    // 画像のdata:スキーム検証
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src');
      // セキュリティ: data:スキームは data:image/* のみ許可
      if (src && src.match(/^data:/i)) {
        if (!src.match(/^data:image\//i)) {
          node.removeAttribute('src');
        }
      }
    }

    // input要素はtype="checkbox"のみ許可（タスクリスト用）
    if (node.tagName === 'INPUT') {
      const type = node.getAttribute('type');
      if (type !== 'checkbox') {
        node.parentNode.removeChild(node);
      }
    }
  });

  let htmlContent = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
                   'blockquote', 'code', 'pre', 'strong', 'em', 'b', 'i', 'img',
                   'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span',
                   'br', 'hr', 'del', 'input'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'align', 'width', 'height',
                   'title', 'type', 'checked', 'disabled', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // 安全なプロトコルを明示的に許可（data:スキームを含む）
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });

  // フックをクリーンアップ
  DOMPurify.removeAllHooks();

  // 保護した数式ブロックを元に戻す（KaTeX有効時のみ）
  // セキュリティ: テキストノードとして復元することでXSSを防ぐ
  if (isKatexEnabled && mathBlocks.length > 0) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // すべてのテキストノードを走査してプレースホルダーを探す（最適化版）
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // プレースホルダーを含むノードのみ処理（高速化）
          return node.nodeValue && node.nodeValue.includes('MATH_BLOCK_')
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const nodesToReplace = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToReplace.push(node);
    }

    // プレースホルダーを数式に置き換え（テキストノードとして安全に設定）
    nodesToReplace.forEach(textNode => {
      const text = textNode.nodeValue;
      const replaced = text.replace(/MATH_BLOCK_(\d+)_PLACEHOLDER/g, function(match, index) {
        // テキストノードのnodeValueとして設定することで、HTMLとして解釈されない
        return mathBlocks[parseInt(index, 10)];
      });
      textNode.nodeValue = replaced;
    });

    htmlContent = tempDiv.innerHTML;
  }

  // TOC（目次）を生成
  function generateTOC(html) {
    // 注意: ここで渡されるhtmlは既にDOMPurifyでサニタイズ済み
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');

    if (headings.length === 0) {
      return {
        toc: '',
        content: html
      };
    }

    // 見出しにIDを設定
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }
    });

    // TOCを生成（シンプルなフラットリスト方式）
    let tocHtml = '<nav class="toc"><h2 class="toc-title">目次</h2><ul class="toc-list">';

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent;
      const id = heading.id;
      const indent = (level - 1) * 20; // レベルに応じたインデント

      // XSS対策: テキストをエスケープ
      // 注意: IDは既にDOMPurifyでサニタイズ済みのため、エスケープ不要
      // （エスケープするとリンクが壊れる）
      tocHtml += `<li style="margin-left: ${indent}px;"><a href="#${id}">${escapeHtml(text)}</a></li>`;
    });

    tocHtml += '</ul></nav>';

    // TOCとコンテンツを別々に返す
    return {
      toc: tocHtml,
      content: tempDiv.innerHTML
    };
  }

  // 画像をBase64に変換する関数（Background Scriptを使用）
  async function convertImagesToBase64() {
    const imageMap = new Map();
    const images = document.querySelectorAll('.markdown-body img');

    for (const img of images) {
      const src = img.getAttribute('src');
      if (!src) continue;

      // 既に処理済みの場合はスキップ
      if (imageMap.has(src)) continue;

      try {
        // data:スキームの場合はそのまま使用
        if (src.startsWith('data:')) {
          imageMap.set(src, src);
          continue;
        }

        // http/httpsの外部URLはそのまま使用（CORSの問題があるため）
        if (src.startsWith('http://') || src.startsWith('https://')) {
          imageMap.set(src, src);
          continue;
        }

        // ローカル画像（file://または相対パス）をBase64に変換
        // img.srcで絶対URLを取得（ブラウザが自動的にfile://に解決）
        const absoluteUrl = img.src;

        // Background Scriptに画像変換を依頼
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'CONVERT_IMAGE_TO_BASE64',
                imageUrl: absoluteUrl
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              }
            );
          });

          if (response.success) {
            imageMap.set(src, response.base64);
          } else {
            console.warn(`画像のBase64変換に失敗しました: ${src}`, response.error);
            imageMap.set(src, src);
          }
        } catch (e) {
          console.warn(`Background Scriptとの通信に失敗しました: ${src}`, e);
          imageMap.set(src, src);
        }
      } catch (error) {
        console.warn(`画像処理中にエラーが発生しました: ${src}`, error);
        imageMap.set(src, src);
      }
    }

    return imageMap;
  }

  // スタンドアロンHTMLを生成する関数（エクスポート用）
  function generateExportHTML(currentKatexEnabled, imageMap) {
    // セキュリティ: 既にレンダリング済みのHTMLコンテンツを使用
    // Markdownを再パースすると、数式内のXSS攻撃を防ぐのが困難になるため
    let renderedContent = document.querySelector('.markdown-body').innerHTML;
    let tocContent = document.querySelector('.toc .toc-list').innerHTML;

    // セキュリティ: エクスポート前に再度サニタイズ（二重防御）
    // DOMPurifyで危険なdata:スキームなどを再度チェック
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedContent;

    // 危険なdata:スキームを持つ画像を削除
    tempDiv.querySelectorAll('img[src^="data:"]').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.match(/^data:image\//i)) {
        img.removeAttribute('src');
      }
    });

    // 危険なdata:スキームを持つリンクを削除
    tempDiv.querySelectorAll('a[href^="data:"]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.match(/^data:image\//i)) {
        a.removeAttribute('href');
      }
    });

    renderedContent = tempDiv.innerHTML;

    // ファイル名を取得（拡張子なし）
    const fileName = path.split('/').pop().replace(/\.(md|markdown)$/i, '');

    // エクスポート用HTMLテンプレート
    // CDNからライブラリを読み込み、完全なスタンドアロンHTMLとして動作
    const exportHTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; img-src data: https: http:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src data: https://cdn.jsdelivr.net; script-src 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none';">
  <title>${escapeHtml(fileName)} - Markdown Preview</title>

  <!-- KaTeX CSS -->
  ${currentKatexEnabled ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css">' : ''}

  <style>
    /* GitHub Markdown Style */
    .markdown-body {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      color: #24292f;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 16px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .markdown-body a {
      background-color: transparent;
      color: #0969da;
      text-decoration: none;
    }
    .markdown-body a:hover {
      text-decoration: underline;
    }
    .markdown-body strong {
      font-weight: 600;
    }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3,
    .markdown-body h4,
    .markdown-body h5,
    .markdown-body h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    .markdown-body h1 {
      font-size: 2em;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.3em;
      margin-top: 0;
    }
    .markdown-body h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.3em;
    }
    .markdown-body h3 {
      font-size: 1.25em;
    }
    .markdown-body h4 {
      font-size: 1em;
    }
    .markdown-body h5 {
      font-size: 0.875em;
    }
    .markdown-body h6 {
      font-size: 0.85em;
      color: #57606a;
    }
    .markdown-body p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .markdown-body p + p {
      margin-top: 16px;
    }
    .markdown-body blockquote {
      margin: 0;
      padding: 0 1em;
      color: #57606a;
      border-left: 0.25em solid #d0d7de;
    }
    .markdown-body ul,
    .markdown-body ol {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 2em;
    }
    .markdown-body ul ul,
    .markdown-body ul ol,
    .markdown-body ol ol,
    .markdown-body ol ul {
      margin-top: 0;
      margin-bottom: 0;
    }
    .markdown-body li {
      margin-bottom: 0.25em;
    }
    .markdown-body li > p {
      margin-top: 16px;
    }
    .markdown-body li + li {
      margin-top: 0.25em;
    }
    .markdown-body code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(175, 184, 193, 0.2);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      vertical-align: baseline;
    }
    .markdown-body del {
      text-decoration: line-through;
    }
    .markdown-body pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 6px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .markdown-body pre code {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
      font-size: 100%;
    }
    .markdown-body table {
      border-spacing: 0;
      border-collapse: collapse;
      display: block;
      width: max-content;
      max-width: 100%;
      overflow: auto;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .markdown-body table th {
      font-weight: 600;
      padding: 6px 13px;
      border: 1px solid #d0d7de;
      background-color: #f6f8fa;
    }
    .markdown-body table td {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
    }
    .markdown-body table tr {
      background-color: #ffffff;
      border-top: 1px solid #d0d7de;
    }
    .markdown-body table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
    .markdown-body img {
      max-width: 100%;
      box-sizing: content-box;
      background-color: #ffffff;
    }
    .markdown-body hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #d0d7de;
      border: 0;
    }
    .markdown-body input[type="checkbox"] {
      margin: 0 0.5em 0.25em -1.6em;
      vertical-align: middle;
      width: 16px;
      height: 16px;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      border: 1px solid #d0d7de;
      border-radius: 3px;
      background-color: #ffffff;
      position: relative;
    }
    .markdown-body input[type="checkbox"]:checked {
      background-color: #0969da;
      border-color: #0969da;
    }
    .markdown-body input[type="checkbox"]:checked::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .markdown-body input[type="checkbox"]:hover {
      border-color: #0969da;
    }
    .markdown-body ul.task-list {
      list-style-type: none;
      padding-left: 1.5em;
    }
    .markdown-body .task-list-item {
      list-style-type: none;
    }
    .markdown-body .task-list-item input {
      margin: 0 0.5em 0.25em -1.6em;
      vertical-align: middle;
    }
    .markdown-body .hljs {
      background-color: #f6f8fa !important;
      padding: 0;
    }
    .hljs,
    .hljs *,
    .hljs span,
    .hljs > *,
    pre code.hljs,
    pre code.hljs *,
    code.hljs,
    code.hljs *,
    .hljs [class*="hljs-"] {
      background-color: transparent !important;
      background-image: none !important;
    }
    .mermaid {
      display: block;
      margin: 16px auto;
      padding: 48px;
      background-color: #ffffff;
      border-radius: 6px;
      overflow: visible;
      text-align: center;
    }
    .mermaid svg {
      max-width: 100%;
      height: auto;
      display: inline-block;
    }
    /* KaTeX数式のスタイル（CDNのkatex.min.cssから提供される） */
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      display: flex;
    }
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      width: 280px;
      height: 100vh;
      overflow-y: auto;
      overflow-x: auto;
      background-color: #f6f8fa;
      border-right: 1px solid #d0d7de;
      padding: 20px;
      box-sizing: border-box;
    }
    .resize-handle {
      position: fixed;
      left: 280px;
      top: 0;
      width: 4px;
      height: 100vh;
      background-color: transparent;
      cursor: col-resize;
      z-index: 1000;
      transition: background-color 0.2s;
    }
    .resize-handle:hover {
      background-color: #0969da;
    }
    .resize-handle.dragging {
      background-color: #0969da;
    }
    .main-content {
      margin-left: 280px;
      flex: 1;
      padding: 45px;
      max-width: calc(100% - 280px);
      box-sizing: border-box;
    }
    .toc {
      background-color: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      margin: 0;
    }
    .toc-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #24292f;
    }
    .toc-list {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    .toc-list ul {
      list-style: none;
      padding-left: 20px;
      margin: 4px 0;
    }
    .toc-list li {
      margin: 4px 0;
    }
    .toc-list a {
      color: #0969da;
      text-decoration: none;
      line-height: 1.5;
      font-size: 14px;
      display: block;
      padding: 4px 8px;
      border-radius: 3px;
      white-space: nowrap;
    }
    .toc-list a:hover {
      text-decoration: underline;
      background-color: rgba(9, 105, 218, 0.1);
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 70px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background-color: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1001;
    }
    .print-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background-color: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1001;
    }
    .theme-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    /* ダークモード用スタイル */
    body[data-theme="dark"] {
      background-color: #0d1117;
    }
    body[data-theme="dark"] .markdown-body {
      color: #c9d1d9;
      background-color: #0d1117;
    }
    body[data-theme="dark"] .markdown-body a {
      color: #58a6ff;
    }
    body[data-theme="dark"] .markdown-body h1,
    body[data-theme="dark"] .markdown-body h2 {
      border-bottom-color: #21262d;
    }
    body[data-theme="dark"] .markdown-body h6 {
      color: #8b949e;
    }
    body[data-theme="dark"] .markdown-body blockquote {
      color: #8b949e;
      border-left-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body code {
      background-color: rgba(110, 118, 129, 0.4);
    }
    body[data-theme="dark"] .markdown-body pre {
      background-color: #1c2128;
    }
    body[data-theme="dark"] .markdown-body table th {
      background-color: #1c2128;
      border-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body table td {
      border-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body table tr {
      background-color: #0d1117;
      border-top-color: #21262d;
    }
    body[data-theme="dark"] .markdown-body table tr:nth-child(2n) {
      background-color: #1c2128;
    }
    body[data-theme="dark"] .markdown-body hr {
      background-color: #21262d;
    }
    body[data-theme="dark"] .markdown-body input[type="checkbox"] {
      background-color: #0d1117;
      border-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body input[type="checkbox"]:checked {
      background-color: #1f6feb;
      border-color: #1f6feb;
    }
    body[data-theme="dark"] .markdown-body input[type="checkbox"]:hover {
      border-color: #58a6ff;
    }
    body[data-theme="dark"] .sidebar {
      background-color: #161b22;
      border-right-color: #21262d;
    }
    body[data-theme="dark"] .toc-title {
      color: #c9d1d9;
    }
    body[data-theme="dark"] .toc-list a {
      color: #58a6ff;
    }
    body[data-theme="dark"] .toc-list a:hover {
      background-color: rgba(88, 166, 255, 0.1);
    }
    body[data-theme="dark"] .print-button {
      background-color: #21262d;
      color: #c9d1d9;
    }
    body[data-theme="dark"] .theme-toggle {
      background-color: #21262d;
      color: #c9d1d9;
    }
    body[data-theme="dark"] .resize-handle:hover,
    body[data-theme="dark"] .resize-handle.dragging {
      background-color: #58a6ff;
    }
    body[data-theme="dark"] .hljs {
      color: #c9d1d9;
      background-color: #1c2128 !important;
    }
    body[data-theme="dark"] .hljs,
    body[data-theme="dark"] .hljs *,
    body[data-theme="dark"] .hljs span,
    body[data-theme="dark"] .hljs > *,
    body[data-theme="dark"] pre code.hljs,
    body[data-theme="dark"] pre code.hljs *,
    body[data-theme="dark"] code.hljs,
    body[data-theme="dark"] code.hljs *,
    body[data-theme="dark"] .hljs [class*="hljs-"] {
      background-color: transparent !important;
      background-image: none !important;
    }
    body[data-theme="dark"] .hljs-comment,
    body[data-theme="dark"] .hljs-quote {
      color: #8b949e;
      font-style: italic;
    }
    body[data-theme="dark"] .hljs-keyword,
    body[data-theme="dark"] .hljs-selector-tag,
    body[data-theme="dark"] .hljs-subst {
      color: #ff7b72;
    }
    body[data-theme="dark"] .hljs-number,
    body[data-theme="dark"] .hljs-literal,
    body[data-theme="dark"] .hljs-variable,
    body[data-theme="dark"] .hljs-template-variable,
    body[data-theme="dark"] .hljs-tag .hljs-attr {
      color: #79c0ff;
    }
    body[data-theme="dark"] .hljs-string,
    body[data-theme="dark"] .hljs-doctag {
      color: #a5d6ff;
    }
    body[data-theme="dark"] .hljs-title,
    body[data-theme="dark"] .hljs-section,
    body[data-theme="dark"] .hljs-selector-id {
      color: #d2a8ff;
      font-weight: bold;
    }
    body[data-theme="dark"] .hljs-subst {
      font-weight: normal;
    }
    body[data-theme="dark"] .hljs-type,
    body[data-theme="dark"] .hljs-class .hljs-title {
      color: #ffa657;
    }
    body[data-theme="dark"] .hljs-tag,
    body[data-theme="dark"] .hljs-name,
    body[data-theme="dark"] .hljs-attribute {
      color: #7ee787;
      font-weight: normal;
    }
    body[data-theme="dark"] .hljs-regexp,
    body[data-theme="dark"] .hljs-link {
      color: #a5d6ff;
    }
    body[data-theme="dark"] .hljs-symbol,
    body[data-theme="dark"] .hljs-bullet {
      color: #ffa657;
    }
    body[data-theme="dark"] .hljs-built_in,
    body[data-theme="dark"] .hljs-builtin-name {
      color: #ffa657;
    }
    body[data-theme="dark"] .hljs-meta {
      color: #79c0ff;
    }
    body[data-theme="dark"] .hljs-deletion {
      background-color: #490202 !important;
      color: #ffdcd7;
    }
    body[data-theme="dark"] .hljs-addition {
      background-color: #0f5323 !important;
      color: #aff5b4;
    }
    body[data-theme="dark"] .hljs-emphasis {
      font-style: italic;
    }
    body[data-theme="dark"] .hljs-strong {
      font-weight: bold;
    }
    body[data-theme="dark"] .hljs-formula {
      color: #79c0ff;
    }
    body[data-theme="dark"] .mermaid {
      background-color: #ffffff;
    }
    body[data-theme="dark"] .katex {
      color: #c9d1d9;
    }
    body[data-theme="dark"] .katex .mord,
    body[data-theme="dark"] .katex .mbin,
    body[data-theme="dark"] .katex .mrel,
    body[data-theme="dark"] .katex .mopen,
    body[data-theme="dark"] .katex .mclose,
    body[data-theme="dark"] .katex .mpunct {
      color: #c9d1d9;
    }
    body[data-theme="dark"] .katex .katex-html {
      color: #c9d1d9;
    }
    @media (max-width: 1024px) {
      .sidebar {
        display: none;
      }
      .main-content {
        margin-left: 0;
        max-width: 100%;
        padding: 20px;
      }
    }
    @media print {
      .print-button,
      .theme-toggle {
        display: none !important;
      }
      .sidebar,
      .resize-handle {
        display: none !important;
      }
      .main-content {
        margin-left: 0 !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4,
      .markdown-body h5,
      .markdown-body h6 {
        page-break-after: avoid;
      }
      .markdown-body pre,
      .markdown-body table,
      .markdown-body blockquote {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body data-theme="light">
  <button class="print-button" title="印刷">🖨️</button>
  <button class="theme-toggle" title="ダークモード切り替え">🌙</button>
  <div class="sidebar">
    <nav class="toc"><h2 class="toc-title">目次</h2><ul class="toc-list" id="toc-placeholder"></ul></nav>
  </div>
  <div class="resize-handle"></div>
  <div class="main-content">
    <article class="markdown-body" id="content-placeholder"></article>
  </div>

  <!-- エクスポートHTML用：既にレンダリング済みのコンテンツを使用するため、ライブラリの読み込みは不要 -->
  <script>
    (function() {
      'use strict';

      // セキュリティ: 既にレンダリング済みのHTMLコンテンツを使用
      // Markdownを再パースせずに、安全に処理されたコンテンツを使用
      const renderedContent = ${JSON.stringify(renderedContent)};
      const tocHtml = ${JSON.stringify(tocContent)};

      // DOMに既にレンダリング済みのコンテンツを挿入
      document.getElementById('content-placeholder').innerHTML = renderedContent;
      document.getElementById('toc-placeholder').innerHTML = tocHtml;

      // 画像のsrcを置き換え（Base64埋め込み用）
      const imageMapData = ${JSON.stringify(Array.from(imageMap || new Map()))};
      const imageMapObject = new Map(imageMapData);
      if (imageMapObject.size > 0) {
        document.querySelectorAll('.markdown-body img').forEach(img => {
          const originalSrc = img.getAttribute('src');
          if (originalSrc && imageMapObject.has(originalSrc)) {
            img.setAttribute('src', imageMapObject.get(originalSrc));
          }
        });
      }

      // サイドバースクロール制御
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.addEventListener('wheel', function(e) {
          const scrollTop = sidebar.scrollTop;
          const scrollHeight = sidebar.scrollHeight;
          const clientHeight = sidebar.clientHeight;
          const deltaY = e.deltaY;
          const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
          const canScrollUp = scrollTop > 1;
          if (deltaY > 0) {
            if (canScrollDown) {
              e.stopPropagation();
            } else {
              e.preventDefault();
              e.stopPropagation();
            }
          } else if (deltaY < 0) {
            if (canScrollUp) {
              e.stopPropagation();
            } else {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }, { passive: false });
      }

      // リサイズ機能
      const resizeHandle = document.querySelector('.resize-handle');
      const mainContent = document.querySelector('.main-content');
      if (resizeHandle && sidebar && mainContent) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        const MIN_WIDTH = 150;
        const MAX_WIDTH = 600;

        resizeHandle.addEventListener('mousedown', function(e) {
          isResizing = true;
          startX = e.clientX;
          startWidth = sidebar.offsetWidth;
          resizeHandle.classList.add('dragging');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
          if (!isResizing) return;
          const deltaX = e.clientX - startX;
          let newWidth = startWidth + deltaX;
          newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
          sidebar.style.width = newWidth + 'px';
          resizeHandle.style.left = newWidth + 'px';
          mainContent.style.marginLeft = newWidth + 'px';
          mainContent.style.maxWidth = \`calc(100% - \${newWidth}px)\`;
          e.preventDefault();
        });

        document.addEventListener('mouseup', function() {
          if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
          }
        });
      }

      // 印刷ボタン
      const printButton = document.querySelector('.print-button');
      if (printButton) {
        printButton.addEventListener('click', function() {
          window.print();
        });
      }

      // ダークモード切り替え
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', function() {
          const currentTheme = document.body.getAttribute('data-theme');
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          document.body.setAttribute('data-theme', newTheme);
          themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
        });
      }
    })();
  </script>
</body>
</html>`;

    return exportHTML;
  }

  // TOC付きHTMLを生成
  const result = generateTOC(htmlContent);

  // localStorageから保存されたサイドバー幅を取得（デフォルト: 280px）
  // セキュリティ: 数値検証と範囲チェック（150-600px）
  const savedSidebarWidth = localStorage.getItem('markdown-sidebar-width') || '280';
  let sidebarWidth = parseInt(savedSidebarWidth, 10);
  if (isNaN(sidebarWidth) || sidebarWidth < 150 || sidebarWidth > 600) {
    sidebarWidth = 280; // 不正な値の場合はデフォルトに戻す
  }

  // localStorageから保存されたダークモード設定を取得（デフォルト: light）
  // セキュリティ: ホワイトリスト検証
  const rawTheme = localStorage.getItem('markdown-theme');
  const savedTheme = (rawTheme === 'dark' || rawTheme === 'light') ? rawTheme : 'light';
  const isDarkMode = savedTheme === 'dark';

  // ページを書き換え
  document.documentElement.innerHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; img-src 'self' data: file: https: http:; style-src 'self' 'unsafe-inline'; script-src 'none';">
  <title>${escapeHtml(path.split('/').pop())} - Markdown Preview</title>
  <link rel="stylesheet" href="${chrome.runtime.getURL('libs/katex.min.css')}">
  <style>
    /* GitHub Markdown Style */
    .markdown-body {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      color: #24292f;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 16px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .markdown-body a {
      background-color: transparent;
      color: #0969da;
      text-decoration: none;
    }
    .markdown-body a:hover {
      text-decoration: underline;
    }
    .markdown-body strong {
      font-weight: 600;
    }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3,
    .markdown-body h4,
    .markdown-body h5,
    .markdown-body h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    .markdown-body h1 {
      font-size: 2em;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.3em;
      margin-top: 0;
    }
    .markdown-body h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.3em;
    }
    .markdown-body h3 {
      font-size: 1.25em;
    }
    .markdown-body h4 {
      font-size: 1em;
    }
    .markdown-body h5 {
      font-size: 0.875em;
    }
    .markdown-body h6 {
      font-size: 0.85em;
      color: #57606a;
    }
    .markdown-body p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .markdown-body p + p {
      margin-top: 16px;
    }
    .markdown-body blockquote {
      margin: 0;
      padding: 0 1em;
      color: #57606a;
      border-left: 0.25em solid #d0d7de;
    }
    .markdown-body ul,
    .markdown-body ol {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 2em;
    }
    .markdown-body ul ul,
    .markdown-body ul ol,
    .markdown-body ol ol,
    .markdown-body ol ul {
      margin-top: 0;
      margin-bottom: 0;
    }
    .markdown-body li {
      margin-bottom: 0.25em;
    }
    .markdown-body li > p {
      margin-top: 16px;
    }
    .markdown-body li + li {
      margin-top: 0.25em;
    }
    .markdown-body code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(175, 184, 193, 0.2);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      vertical-align: baseline;
    }
    .markdown-body del {
      text-decoration: line-through;
    }
    .markdown-body pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 6px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .markdown-body pre code {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
      font-size: 100%;
    }
    .markdown-body table {
      border-spacing: 0;
      border-collapse: collapse;
      display: block;
      width: max-content;
      max-width: 100%;
      overflow: auto;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .markdown-body table th {
      font-weight: 600;
      padding: 6px 13px;
      border: 1px solid #d0d7de;
      background-color: #f6f8fa;
    }
    .markdown-body table td {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
    }
    .markdown-body table tr {
      background-color: #ffffff;
      border-top: 1px solid #d0d7de;
    }
    .markdown-body table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
    .markdown-body img {
      max-width: 100%;
      box-sizing: content-box;
      background-color: #ffffff;
    }
    .markdown-body hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #d0d7de;
      border: 0;
    }
    .markdown-body input[type="checkbox"] {
      margin: 0 0.5em 0.25em -1.6em;
      vertical-align: middle;
      width: 16px;
      height: 16px;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      border: 1px solid #d0d7de;
      border-radius: 3px;
      background-color: #ffffff;
      position: relative;
    }
    .markdown-body input[type="checkbox"]:checked {
      background-color: #0969da;
      border-color: #0969da;
    }
    .markdown-body input[type="checkbox"]:checked::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .markdown-body input[type="checkbox"]:hover {
      border-color: #0969da;
    }
    .markdown-body ul.task-list {
      list-style-type: none;
      padding-left: 1.5em;
    }
    .markdown-body .task-list-item {
      list-style-type: none;
    }
    .markdown-body .task-list-item input {
      margin: 0 0.5em 0.25em -1.6em;
      vertical-align: middle;
    }
    .markdown-body .hljs {
      background-color: #f6f8fa !important;
      padding: 0;
    }
    /* ライトモードでもhighlight.jsの全要素の背景色を強制的に透明に */
    .hljs,
    .hljs *,
    .hljs span,
    .hljs > *,
    pre code.hljs,
    pre code.hljs *,
    code.hljs,
    code.hljs *,
    .hljs [class*="hljs-"] {
      background-color: transparent !important;
      background-image: none !important;
    }
    /* Mermaidダイアグラムのスタイル */
    .mermaid {
      display: block;
      margin: 16px auto;
      padding: 48px;
      background-color: #ffffff;
      border-radius: 6px;
      overflow: visible;
      text-align: center;
    }
    .mermaid svg {
      max-width: 100%;
      height: auto;
      display: inline-block;
    }
    /* KaTeX数式のスタイル（katex.min.cssから提供される） */
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      display: flex;
    }
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      width: ${sidebarWidth}px;
      height: 100vh;
      overflow-y: auto;
      overflow-x: auto;
      background-color: #f6f8fa;
      border-right: 1px solid #d0d7de;
      padding: 20px;
      box-sizing: border-box;
    }
    .resize-handle {
      position: fixed;
      left: ${sidebarWidth}px;
      top: 0;
      width: 4px;
      height: 100vh;
      background-color: transparent;
      cursor: col-resize;
      z-index: 1000;
      transition: background-color 0.2s;
    }
    .resize-handle:hover {
      background-color: #0969da;
    }
    .resize-handle.dragging {
      background-color: #0969da;
    }
    .main-content {
      margin-left: ${sidebarWidth}px;
      flex: 1;
      padding: 45px;
      max-width: calc(100% - ${sidebarWidth}px);
      box-sizing: border-box;
    }
    .toc {
      background-color: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      margin: 0;
    }
    .toc-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #24292f;
    }
    .toc-list {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    .toc-list ul {
      list-style: none;
      padding-left: 20px;
      margin: 4px 0;
    }
    .toc-list li {
      margin: 4px 0;
    }
    .toc-list a {
      color: #0969da;
      text-decoration: none;
      line-height: 1.5;
      font-size: 14px;
      display: block;
      padding: 4px 8px;
      border-radius: 3px;
      white-space: nowrap;
    }
    .toc-list a:hover {
      text-decoration: underline;
      background-color: rgba(9, 105, 218, 0.1);
    }
    /* エクスポートボタン */
    .export-button {
      position: fixed;
      top: 20px;
      right: 170px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background-color: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1001;
    }
    .export-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    /* 印刷ボタン */
    .print-button {
      position: fixed;
      top: 20px;
      right: 120px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background-color: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1001;
    }
    .print-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    /* ダークモード切り替えボタン */
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background-color: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1001;
    }
    .theme-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    /* KaTeX切り替えボタン */
    .katex-toggle {
      position: fixed;
      top: 20px;
      right: 70px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background-color: #f6f8fa;
      color: #57606a;
      cursor: pointer;
      font-size: 9px;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1001;
      line-height: 1.1;
      padding: 0;
    }
    .katex-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .katex-toggle.enabled {
      background-color: rgba(9, 105, 218, 0.08);
      color: #57606a;
    }
    /* ダークモード用スタイル */
    body[data-theme="dark"] {
      background-color: #0d1117;
    }
    body[data-theme="dark"] .markdown-body {
      color: #c9d1d9;
      background-color: #0d1117;
    }
    body[data-theme="dark"] .markdown-body a {
      color: #58a6ff;
    }
    body[data-theme="dark"] .markdown-body h1,
    body[data-theme="dark"] .markdown-body h2 {
      border-bottom-color: #21262d;
    }
    body[data-theme="dark"] .markdown-body h6 {
      color: #8b949e;
    }
    body[data-theme="dark"] .markdown-body blockquote {
      color: #8b949e;
      border-left-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body code {
      background-color: rgba(110, 118, 129, 0.4);
    }
    body[data-theme="dark"] .markdown-body pre {
      background-color: #1c2128;
    }
    body[data-theme="dark"] .markdown-body table th {
      background-color: #1c2128;
      border-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body table td {
      border-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body table tr {
      background-color: #0d1117;
      border-top-color: #21262d;
    }
    body[data-theme="dark"] .markdown-body table tr:nth-child(2n) {
      background-color: #1c2128;
    }
    body[data-theme="dark"] .markdown-body hr {
      background-color: #21262d;
    }
    body[data-theme="dark"] .markdown-body input[type="checkbox"] {
      background-color: #0d1117;
      border-color: #3b434b;
    }
    body[data-theme="dark"] .markdown-body input[type="checkbox"]:checked {
      background-color: #1f6feb;
      border-color: #1f6feb;
    }
    body[data-theme="dark"] .markdown-body input[type="checkbox"]:hover {
      border-color: #58a6ff;
    }
    body[data-theme="dark"] .sidebar {
      background-color: #161b22;
      border-right-color: #21262d;
    }
    body[data-theme="dark"] .toc-title {
      color: #c9d1d9;
    }
    body[data-theme="dark"] .toc-list a {
      color: #58a6ff;
    }
    body[data-theme="dark"] .toc-list a:hover {
      background-color: rgba(88, 166, 255, 0.1);
    }
    body[data-theme="dark"] .export-button {
      background-color: #21262d;
      color: #c9d1d9;
    }
    body[data-theme="dark"] .print-button {
      background-color: #21262d;
      color: #c9d1d9;
    }
    body[data-theme="dark"] .theme-toggle {
      background-color: #21262d;
      color: #c9d1d9;
    }
    body[data-theme="dark"] .katex-toggle {
      background-color: #21262d;
      color: #8b949e;
    }
    body[data-theme="dark"] .katex-toggle.enabled {
      background-color: rgba(88, 166, 255, 0.1);
      color: #8b949e;
    }
    body[data-theme="dark"] .resize-handle:hover,
    body[data-theme="dark"] .resize-handle.dragging {
      background-color: #58a6ff;
    }
    /* ダークモード用のシンタックスハイライト（GitHub Dark風） */
    body[data-theme="dark"] .hljs {
      color: #c9d1d9;
      background-color: #1c2128 !important;
    }
    /* highlight.jsの全要素の背景色を強制的に透明に */
    body[data-theme="dark"] .hljs,
    body[data-theme="dark"] .hljs *,
    body[data-theme="dark"] .hljs span,
    body[data-theme="dark"] .hljs > *,
    body[data-theme="dark"] pre code.hljs,
    body[data-theme="dark"] pre code.hljs *,
    body[data-theme="dark"] code.hljs,
    body[data-theme="dark"] code.hljs *,
    body[data-theme="dark"] .hljs [class*="hljs-"] {
      background-color: transparent !important;
      background-image: none !important;
    }
    body[data-theme="dark"] .hljs-comment,
    body[data-theme="dark"] .hljs-quote {
      color: #8b949e;
      font-style: italic;
    }
    body[data-theme="dark"] .hljs-keyword,
    body[data-theme="dark"] .hljs-selector-tag,
    body[data-theme="dark"] .hljs-subst {
      color: #ff7b72;
    }
    body[data-theme="dark"] .hljs-number,
    body[data-theme="dark"] .hljs-literal,
    body[data-theme="dark"] .hljs-variable,
    body[data-theme="dark"] .hljs-template-variable,
    body[data-theme="dark"] .hljs-tag .hljs-attr {
      color: #79c0ff;
    }
    body[data-theme="dark"] .hljs-string,
    body[data-theme="dark"] .hljs-doctag {
      color: #a5d6ff;
    }
    body[data-theme="dark"] .hljs-title,
    body[data-theme="dark"] .hljs-section,
    body[data-theme="dark"] .hljs-selector-id {
      color: #d2a8ff;
      font-weight: bold;
    }
    body[data-theme="dark"] .hljs-subst {
      font-weight: normal;
    }
    body[data-theme="dark"] .hljs-type,
    body[data-theme="dark"] .hljs-class .hljs-title {
      color: #ffa657;
    }
    body[data-theme="dark"] .hljs-tag,
    body[data-theme="dark"] .hljs-name,
    body[data-theme="dark"] .hljs-attribute {
      color: #7ee787;
      font-weight: normal;
    }
    body[data-theme="dark"] .hljs-regexp,
    body[data-theme="dark"] .hljs-link {
      color: #a5d6ff;
    }
    body[data-theme="dark"] .hljs-symbol,
    body[data-theme="dark"] .hljs-bullet {
      color: #ffa657;
    }
    body[data-theme="dark"] .hljs-built_in,
    body[data-theme="dark"] .hljs-builtin-name {
      color: #ffa657;
    }
    body[data-theme="dark"] .hljs-meta {
      color: #79c0ff;
    }
    body[data-theme="dark"] .hljs-deletion {
      background-color: #490202 !important;
      color: #ffdcd7;
    }
    body[data-theme="dark"] .hljs-addition {
      background-color: #0f5323 !important;
      color: #aff5b4;
    }
    body[data-theme="dark"] .hljs-emphasis {
      font-style: italic;
    }
    body[data-theme="dark"] .hljs-strong {
      font-weight: bold;
    }
    body[data-theme="dark"] .hljs-formula {
      color: #79c0ff;
    }
    /* ダークモード用のMermaidダイアグラムスタイル */
    body[data-theme="dark"] .mermaid {
      background-color: #ffffff;
    }
    /* ダークモード用のKaTeX数式スタイル */
    body[data-theme="dark"] .katex {
      color: #c9d1d9;
    }
    body[data-theme="dark"] .katex .mord,
    body[data-theme="dark"] .katex .mbin,
    body[data-theme="dark"] .katex .mrel,
    body[data-theme="dark"] .katex .mopen,
    body[data-theme="dark"] .katex .mclose,
    body[data-theme="dark"] .katex .mpunct {
      color: #c9d1d9;
    }
    body[data-theme="dark"] .katex .katex-html {
      color: #c9d1d9;
    }
    /* レスポンシブ対応：小さい画面では目次を非表示 */
    @media (max-width: 1024px) {
      .sidebar {
        display: none;
      }
      .main-content {
        margin-left: 0;
        max-width: 100%;
        padding: 20px;
      }
    }
    /* 印刷用スタイル */
    @media print {
      /* ボタンを非表示 */
      .export-button,
      .print-button,
      .theme-toggle,
      .katex-toggle {
        display: none !important;
      }
      /* サイドバーとリサイズハンドルを非表示 */
      .sidebar,
      .resize-handle {
        display: none !important;
      }
      /* メインコンテンツをフル幅で表示 */
      .main-content {
        margin-left: 0 !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
      /* ページ区切りを見出しの前で行わない */
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4,
      .markdown-body h5,
      .markdown-body h6 {
        page-break-after: avoid;
      }
      /* コードブロックやテーブルの途中でページ区切りしない */
      .markdown-body pre,
      .markdown-body table,
      .markdown-body blockquote {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body data-theme="${savedTheme}">
  <button class="export-button" title="HTMLにエクスポート">
    ⬇️
  </button>
  <button class="print-button" title="印刷">
    🖨️
  </button>
  <button class="katex-toggle ${isKatexEnabled ? 'enabled' : ''}" title="KaTeX数式レンダリング切り替え">
    <span>TeX</span>
    <span>${isKatexEnabled ? 'ON' : 'OFF'}</span>
  </button>
  <button class="theme-toggle" title="ダークモード切り替え">
    ${isDarkMode ? '🌙' : '☀️'}
  </button>
  <div class="sidebar">
    ${result.toc}
  </div>
  <div class="resize-handle"></div>
  <div class="main-content">
    <article class="markdown-body">
      ${result.content}
    </article>
  </div>
</body>
</html>
  `;

  // サイドバーのスクロールイベント制御
  // 左ペイン（目次）でのスクロールが右ペイン（メインコンテンツ）に伝播しないようにする
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.addEventListener('wheel', function(e) {
      // 現在のスクロール位置を取得
      const scrollTop = sidebar.scrollTop;
      const scrollHeight = sidebar.scrollHeight;
      const clientHeight = sidebar.clientHeight;
      const deltaY = e.deltaY;

      // スクロール可能かどうかを判定
      const canScrollDown = scrollTop + clientHeight < scrollHeight - 1; // 1pxの余裕を持たせる
      const canScrollUp = scrollTop > 1; // 1pxの余裕を持たせる

      // 下方向スクロール時
      if (deltaY > 0) {
        if (canScrollDown) {
          // スクロール可能な場合は、イベント伝播だけを停止
          e.stopPropagation();
        } else {
          // スクロールできない場合は、イベント自体を停止
          e.preventDefault();
          e.stopPropagation();
        }
      }
      // 上方向スクロール時
      else if (deltaY < 0) {
        if (canScrollUp) {
          // スクロール可能な場合は、イベント伝播だけを停止
          e.stopPropagation();
        } else {
          // スクロールできない場合は、イベント自体を停止
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, { passive: false }); // passive: falseでpreventDefault()を有効化
  }

  // リサイズハンドラーのドラッグ機能
  const resizeHandle = document.querySelector('.resize-handle');
  const mainContent = document.querySelector('.main-content');

  if (resizeHandle && sidebar && mainContent) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // 最小幅と最大幅を設定
    const MIN_WIDTH = 150; // 150px
    const MAX_WIDTH = 600; // 600px

    resizeHandle.addEventListener('mousedown', function(e) {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;

      // ドラッグ中のスタイルを適用
      resizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // テキスト選択を無効化

      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;

      // 新しい幅を計算
      const deltaX = e.clientX - startX;
      let newWidth = startWidth + deltaX;

      // 最小幅と最大幅を制限
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));

      // 幅を更新
      sidebar.style.width = newWidth + 'px';
      resizeHandle.style.left = newWidth + 'px';
      mainContent.style.marginLeft = newWidth + 'px';
      mainContent.style.maxWidth = `calc(100% - ${newWidth}px)`;

      e.preventDefault();
    });

    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;

        // ドラッグ中のスタイルを削除
        resizeHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // 現在の幅をlocalStorageに保存
        const currentWidth = sidebar.offsetWidth;
        localStorage.setItem('markdown-sidebar-width', currentWidth.toString());
      }
    });
  }

  // エクスポートボタン機能
  const exportButton = document.querySelector('.export-button');
  if (exportButton) {
    exportButton.addEventListener('click', async function() {
      try {
        // ローカル画像をBase64に変換
        const imageMap = await convertImagesToBase64();

        // エクスポート用HTMLを生成
        const exportHTML = generateExportHTML(isKatexEnabled, imageMap);

        // ファイル名を生成
        const fileName = path.split('/').pop().replace(/\.(md|markdown)$/i, '') + '.html';

        // Blobを作成
        const blob = new Blob([exportHTML], { type: 'text/html;charset=utf-8' });

        // ダウンロードリンクを作成
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';

        // DOMに追加してクリック
        document.body.appendChild(a);
        a.click();

        // クリーンアップ
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        alert('エクスポートに失敗しました: ' + error.message);
      }
    });
  }

  // 印刷ボタン機能
  const printButton = document.querySelector('.print-button');
  if (printButton) {
    printButton.addEventListener('click', function() {
      window.print();
    });
  }

  // KaTeX切り替え機能
  const katexToggle = document.querySelector('.katex-toggle');
  if (katexToggle) {
    katexToggle.addEventListener('click', function() {
      const currentEnabled = isKatexEnabled;
      const newEnabled = !currentEnabled;

      // localStorageに保存（ONの場合は'true'、OFFの場合は'false'）
      localStorage.setItem('markdown-katex-enabled', newEnabled ? 'true' : 'false');

      // ページをリロードして設定を反映
      location.reload();
    });
  }

  // ダークモード切り替え機能
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // テーマを切り替え
      document.body.setAttribute('data-theme', newTheme);

      // ボタンのアイコンを更新
      themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';

      // localStorageに保存
      localStorage.setItem('markdown-theme', newTheme);
    });
  }

  // 重い処理を非同期化してページ表示を高速化
  // requestIdleCallbackを使用（利用可能な場合）、なければsetTimeoutで代替
  const scheduleWork = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

  // KaTeXで数式をレンダリング（KaTeX有効時のみ）- 非同期処理
  if (isKatexEnabled && typeof renderMathInElement !== 'undefined') {
    scheduleWork(() => {
      const mathElements = document.querySelector('.markdown-body');
      if (mathElements) {
        try {
          renderMathInElement(mathElements, {
            delimiters: [
              { left: '$$', right: '$$', display: true },   // ディスプレイ数式
              { left: '$', right: '$', display: false },    // インライン数式
              { left: '\\[', right: '\\]', display: true }, // ディスプレイ数式（LaTeX形式）
              { left: '\\(', right: '\\)', display: false } // インライン数式（LaTeX形式）
            ],
            throwOnError: false, // エラーが発生してもレンダリングを継続
            errorColor: '#cc0000', // エラー時の色
            strict: 'warn', // セキュリティ: 非推奨コマンドに警告を出す
            trust: false, // セキュリティ: 信頼されていないコマンド（\url, \href等）を許可しない
            maxSize: 500, // セキュリティ: 数式の最大サイズを制限（DoS攻撃対策）
            maxExpand: 1000 // セキュリティ: マクロ展開の最大回数を制限（DoS攻撃対策）
          });

        } catch (err) {
          // KaTeXレンダリングエラーは無視（ページ表示は継続）
          console.error('KaTeXレンダリングエラー:', err);
        }
      }
    });
  }

  // Mermaidダイアグラムの初期化と描画（同期処理）
  if (typeof mermaid !== 'undefined') {
    // Mermaidの設定
    // 常にデフォルトテーマ（ライトモード）を使用
    const mermaidConfig = {
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif'
    };

    mermaid.initialize(mermaidConfig);

    // Mermaidダイアグラムを描画
    const mermaidElements = document.querySelectorAll('.mermaid');
    if (mermaidElements.length > 0) {
      mermaidElements.forEach((element, index) => {
        const id = `mermaid-diagram-${index}`;
        element.setAttribute('id', id);
      });

      // 描画を実行
      mermaid.run({
        querySelector: '.mermaid'
      }).catch(err => {
        // Mermaid描画エラーは無視（ページ表示は継続）
      });
    }
  }

})();
