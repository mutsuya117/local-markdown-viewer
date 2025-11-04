// Markdown Previewer - Content Script
(async function() {
  'use strict';

  // .mdファイルかどうかをチェック
  const path = window.location.pathname;
  if (!path.match(/\.(md|markdown)$/i)) {
    return;
  }

  // 生のMarkdownテキストを取得
  const markdownText = document.body.textContent;

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
    }

    // input要素はtype="checkbox"のみ許可（タスクリスト用）
    if (node.tagName === 'INPUT') {
      const type = node.getAttribute('type');
      if (type !== 'checkbox') {
        node.parentNode.removeChild(node);
      }
    }
  });

  const htmlContent = DOMPurify.sanitize(rawHtml, {
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

  // TOC付きHTMLを生成
  const result = generateTOC(htmlContent);

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
      background-color: #f6f8fa;
      padding: 0;
    }
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
      background-color: #f6f8fa;
      border-right: 1px solid #d0d7de;
      padding: 20px;
      box-sizing: border-box;
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
    }
    .toc-list a:hover {
      text-decoration: underline;
      background-color: rgba(9, 105, 218, 0.1);
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
  </style>
</head>
<body>
  <div class="sidebar">
    ${result.toc}
  </div>
  <div class="main-content">
    <article class="markdown-body">
      ${result.content}
    </article>
  </div>
</body>
</html>
  `;

})();
