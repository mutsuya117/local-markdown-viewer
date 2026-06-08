// Markdown Previewer - Content Script
(async function() {
  'use strict';

  // コードブロックの等幅フォント設定（フォントは同梱せず、OS標準のCJK等幅フォントを優先）
  //
  // 罫線（─│┌┐└┘├┤┬┴┼ ╔═╗ など）を使ったテーブルがコードブロック内でずれる問題への対応。
  // 原因はラテン文字用等幅フォントとCJKフォールバックフォントの字幅比が1:2にならないこと。
  // CJK等幅フォントは1書体内で「半角ラテン/半角罫線=1 : 全角CJK=2」の正確な比率を持つため、
  // これをスタック先頭に置くとコードブロック全体が単一書体で描画され、日本語・中国語・英語が
  // 混在しても罫線テーブルが揃う。OS標準搭載フォントを使うので同梱・ダウンロードは不要で、
  // オフラインでもエクスポートHTMLでもそのまま機能する。
  //
  // UI言語に応じて字形の地域標準形を優先（簡体字環境は中国語フォント、それ以外は日本語フォントを先頭）。
  function getMonoFontStack() {
    let lang = '';
    try {
      lang = (chrome.i18n.getUILanguage() || '').toLowerCase();
    } catch (e) {
      lang = (navigator.language || '').toLowerCase();
    }
    // OS標準のCJK等幅フォント:
    //   Windows: BIZ UDGothic / MS Gothic / NSimSun、 macOS: Osaka-Mono、 Linux: Noto Sans Mono CJK
    const cjkFonts = lang.startsWith('zh')
      ? '"NSimSun", "Noto Sans Mono CJK SC", "MS Gothic", "Osaka-Mono"'
      : '"BIZ UDGothic", "MS Gothic", "Osaka-Mono", "Noto Sans Mono CJK JP"';
    // CJK等幅フォントが無い環境向けのフォールバック（英数字のみの罫線表は揃う）
    return cjkFonts + ', ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
  }

  // .md / .markdown / .mkdn ファイルかどうかをチェック
  const path = window.location.pathname;
  if (!path.match(/\.(md|markdown|mkdn)$/i)) {
    return;
  }

  // パス内のパーセントエンコードをデコード
  // （日本語などを含むファイル名がエクスポート・印刷・タイトルで文字化けしないように）
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(path);
  } catch (e) {
    // 不正なエンコードでデコードに失敗した場合は元のパスをそのまま使用
    decodedPath = path;
  }

  // 生のMarkdownテキストを取得
  let markdownText = document.body.textContent;

  // Mermaidの元のコードを保存するMap（エクスポート用）
  const mermaidCodeMap = new Map();

  // localStorageから保存されたKaTeX設定を取得（デフォルト: ON）
  // セキュリティ: ホワイトリスト検証
  const rawKatexEnabled = localStorage.getItem('markdown-katex-enabled');
  const isKatexEnabled = rawKatexEnabled !== 'false'; // デフォルトON（明示的にfalseの場合のみOFF）

  // コードブロック、インラインコード、見出し行を一時的に保護
  // （数式ブロック保護処理でこれらの中の$$が誤って処理されないように）
  // 見出し行保護により、見出し内の$$...$$や\[...\]が数式として認識されない（GitHub互換）
  const protectedCodeBlocks = [];
  const disabledMathBlocks = []; // 英数字を含まない数式記法を保存
  markdownText = markdownText.replace(/```[\s\S]*?```|`[^`\n]+`|^#{1,6}\s+.+$/gm, function(match) {
    const placeholder = `PROTECTED_CODE_${protectedCodeBlocks.length}_PLACEHOLDER`;
    protectedCodeBlocks.push(match);
    return placeholder;
  });

  // 数式ブロックを一時的に保護（Marked.jsが誤って処理しないように）
  // KaTeXが有効な場合のみ実行
  // 注意: インライン数式$...$は保護しない（HTMLレンダリング後に処理）
  // すべての数式記法に英数字チェックを適用（統一性）
  const mathBlocks = [];
  if (isKatexEnabled) {
    // ディスプレイ数式 $$...$$ を保護（$...$との混同を防ぐため先に処理）
    // 内容に英数字が含まれている場合のみ保護
    markdownText = markdownText.replace(/\$\$[\s\S]*?\$\$/g, function(match) {
      // 内容を抽出（$$ を除く）
      const content = match.substring(2, match.length - 2);
      // 英数字が含まれているかチェック
      const hasAlphanumeric = /[a-zA-Z0-9]/.test(content);
      if (!hasAlphanumeric) {
        // 英数字なし → プレースホルダーに置換（後で元に戻す）
        const placeholder = `DISABLED_MATH_${disabledMathBlocks.length}_PLACEHOLDER`;
        disabledMathBlocks.push(match);
        return placeholder;
      }
      const placeholder = `MATH_BLOCK_${mathBlocks.length}_PLACEHOLDER`;
      mathBlocks.push(match);
      return placeholder;
    });

    // ディスプレイ数式 \[...\] を保護
    // 内容に英数字が含まれている場合のみ保護
    markdownText = markdownText.replace(/\\\[[\s\S]*?\\\]/g, function(match) {
      // 内容を抽出（\[ と \] を除く）
      const content = match.substring(2, match.length - 2);
      // 英数字が含まれているかチェック
      const hasAlphanumeric = /[a-zA-Z0-9]/.test(content);
      if (!hasAlphanumeric) {
        // 英数字なし → プレースホルダーに置換（後で元に戻す）
        const placeholder = `DISABLED_MATH_${disabledMathBlocks.length}_PLACEHOLDER`;
        disabledMathBlocks.push(match);
        return placeholder;
      }
      const placeholder = `MATH_BLOCK_${mathBlocks.length}_PLACEHOLDER`;
      mathBlocks.push(match);
      return placeholder;
    });

    // インライン数式 \(...\) を保護
    // 内容に英数字が含まれている場合のみ保護
    markdownText = markdownText.replace(/\\\([\s\S]*?\\\)/g, function(match) {
      // 内容を抽出（\( と \) を除く）
      const content = match.substring(2, match.length - 2);
      // 英数字が含まれているかチェック
      const hasAlphanumeric = /[a-zA-Z0-9]/.test(content);
      if (!hasAlphanumeric) {
        // 英数字なし → プレースホルダーに置換（後で元に戻す）
        const placeholder = `DISABLED_MATH_${disabledMathBlocks.length}_PLACEHOLDER`;
        disabledMathBlocks.push(match);
        return placeholder;
      }
      const placeholder = `MATH_BLOCK_${mathBlocks.length}_PLACEHOLDER`;
      mathBlocks.push(match);
      return placeholder;
    });
  }

  // コードブロックとインラインコードを復元（Marked.jsに処理させる）
  markdownText = markdownText.replace(/PROTECTED_CODE_(\d+)_PLACEHOLDER/g, function(match, index) {
    return protectedCodeBlocks[parseInt(index, 10)];
  });

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

    // textがundefinedまたはnullの場合は空文字列を返す
    if (!text) {
      return '';
    }

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
  renderer.heading = function(text, level, raw) {
    // marked.jsのバージョンによって引数の形式が異なる
    // v13以降: 第1引数がオブジェクトの場合がある
    let headingText, headingLevel, headingRaw;

    if (typeof text === 'object' && text !== null) {
      // オブジェクト形式（marked v13+）
      // インライントークン（リンクなど）をパースしてHTMLに変換
      headingText = this.parser.parseInline(text.tokens);
      headingLevel = text.depth;
      headingRaw = text.raw || text.text;
    } else {
      // 従来の形式（text は既にHTMLレンダリング済み）
      headingText = text;
      headingLevel = level;
      headingRaw = raw || text;
    }

    let slug = generateSlug(headingRaw);

    // 重複ID対策：同じIDが既に使われている場合は連番を付ける
    if (usedIds.has(slug)) {
      const count = usedIds.get(slug) + 1;
      usedIds.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      usedIds.set(slug, 0);
    }

    return `<h${headingLevel} id="${slug}">${headingText}</h${headingLevel}>\n`;
  };

  // Mermaidコードブロックのカウンター
  let mermaidCounter = 0;

  // コードブロックのレンダラーをカスタマイズ（Mermaid対応）
  const originalCode = renderer.code.bind(renderer);
  renderer.code = function(code, language) {
    // marked.jsのバージョンによって引数の形式が異なる
    let codeText, codeLang, isObjectForm;

    if (typeof code === 'object' && code !== null) {
      // オブジェクト形式（marked v13+）
      codeText = code.text;
      codeLang = code.lang || '';
      isObjectForm = true;
    } else {
      // 従来の形式
      codeText = code;
      codeLang = language || '';
      isObjectForm = false;
    }

    // Mermaidダイアグラムの場合は特別な処理
    if (codeLang === 'mermaid') {
      // mermaidクラスを持つdivとして出力（後でMermaidライブラリが描画）
      const escapedCode = escapeHtml(codeText);

      // ユニークなIDを生成してMapに元のコードを保存
      const mermaidId = `mermaid-source-${mermaidCounter}`;
      mermaidCodeMap.set(mermaidId, codeText);
      mermaidCounter++;

      return `<div class="mermaid" data-mermaid-id="${mermaidId}">${escapedCode}</div>\n`;
    }
    // それ以外は通常のコードブロック
    // オブジェクト形式の場合はそのまま渡す、従来形式の場合は個別の引数で渡す
    if (isObjectForm) {
      return originalCode.call(this, code, language);
    } else {
      return originalCode.call(this, codeText, codeLang);
    }
  };

  // marked v12ではhooksを使う
  marked.use({
    renderer: renderer,
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    sanitize: false // 生のHTMLを通す（DOMPurifyでサニタイズ）
  });

  // highlight.jsを適用するhooks
  marked.use({
    hooks: {
      postprocess(html) {
        // DOMParserを使用してHTMLを安全にパース（CSP警告を回避）
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // コードブロックを検索してハイライトを適用
        doc.body.querySelectorAll('pre code').forEach((block) => {
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

        return doc.body.innerHTML;
      }
    }
  });

  // Markdownをパース
  let rawHtml = marked.parse(markdownText);

  // DOMPurifyでサニタイズする前に、危険なタグをエスケープ（GitHub互換）
  // 以下のタグは削除ではなくエスケープして文字列表示
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'style', 'link',
                         'form', 'button', 'select', 'textarea', 'option'];

  dangerousTags.forEach(tag => {
    // 開始タグと終了タグの両方をエスケープ
    const openTagRegex = new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'gi');
    const closeTagRegex = new RegExp(`</${tag}>`, 'gi');

    rawHtml = rawHtml.replace(openTagRegex, function(match) {
      return escapeHtml(match);
    });
    rawHtml = rawHtml.replace(closeTagRegex, function(match) {
      return escapeHtml(match);
    });
  });

  // DOMPurifyでサニタイズ（XSS対策）

  // 削除される属性（イベントハンドラ）を記録するフック
  const removedAttributes = new Map();
  DOMPurify.addHook('uponSanitizeAttribute', function(node, data) {
    // イベントハンドラ属性（on*）が削除される場合
    if (data.attrName && data.attrName.match(/^on/i)) {
      // ノードのIDを生成（後で参照するため）
      if (!node.dataset.purifyId) {
        node.dataset.purifyId = 'node-' + Math.random().toString(36).substr(2, 9);
      }
      const nodeId = node.dataset.purifyId;

      if (!removedAttributes.has(nodeId)) {
        removedAttributes.set(nodeId, []);
      }
      removedAttributes.get(nodeId).push(`${data.attrName}="${data.attrValue}"`);
    }
  });

  // 外部リソースの処理フック
  DOMPurify.addHook('afterSanitizeAttributes', function(node) {
    // 削除されたイベントハンドラをコメントとして追加（デバッグ用）
    if (node.dataset && node.dataset.purifyId) {
      const nodeId = node.dataset.purifyId;
      if (removedAttributes.has(nodeId)) {
        // dataset.purifyIdを削除（不要な属性を残さない）
        delete node.dataset.purifyId;
      }
    }

    // style属性のセキュリティ検証
    if (node.hasAttribute && node.hasAttribute('style')) {
      const style = node.getAttribute('style');
      // セキュリティ: 危険なスタイルをブロック
      // javascript:, expression(), url(javascript:) などを含むstyleを削除
      if (style && (
        style.match(/javascript:/i) ||
        style.match(/expression\(/i) ||
        style.match(/behavior:/i) ||
        style.match(/binding:/i) ||
        style.match(/@import/i)
      )) {
        node.removeAttribute('style');
      }
    }

    // リンクの外部URLに警告を追加
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && href.match(/^https?:\/\//i)) {
        // href値をエスケープしてtitle属性に設定（セキュリティ対策）
        node.setAttribute('title', chrome.i18n.getMessage('externalLink') + escapeHtml(href));
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

    // details要素のイベントハンドラを削除（ontoggle等）
    if (node.tagName === 'DETAILS' || node.tagName === 'SUMMARY') {
      // イベントハンドラ属性を全て削除
      Array.from(node.attributes).forEach(attr => {
        if (attr.name.match(/^on/i)) {
          node.removeAttribute(attr.name);
        }
      });
    }
  });

  let htmlContent = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
                   'blockquote', 'code', 'pre', 'strong', 'em', 'b', 'i', 'img',
                   'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span',
                   'br', 'hr', 'del', 's', 'ins', 'input',
                   'details', 'summary', 'kbd', 'mark', 'sub', 'sup',
                   'abbr', 'cite', 'q', 'time', 'dl', 'dt', 'dd', 'u', 'center'], // GitHub互換タグ
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'align', 'width', 'height',
                   'title', 'type', 'checked', 'disabled', 'target', 'rel',
                   'open', 'datetime', 'style', 'clear',
                   'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing',
                   'dir', 'lang', 'name', 'value', 'cite', 'abbr'], // GitHub互換属性
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // 安全なプロトコルを明示的に許可（data:スキームを含む）
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });

  // フックをクリーンアップ
  DOMPurify.removeAllHooks();

  // 保護した数式ブロックを元に戻す（KaTeX有効時のみ）
  // セキュリティ: テキストノードとして復元することでXSSを防ぐ
  if (isKatexEnabled && (mathBlocks.length > 0 || disabledMathBlocks.length > 0)) {
    // DOMParserを使用してHTMLを安全にパース（画像読み込み警告を回避）
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // すべてのテキストノードを走査してプレースホルダーを探す（最適化版）
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // プレースホルダーを含むノードのみ処理（高速化）
          return node.nodeValue && (node.nodeValue.includes('MATH_BLOCK_') || node.nodeValue.includes('DISABLED_MATH_'))
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
      let text = textNode.nodeValue;
      // 有効な数式ブロックを復元
      text = text.replace(/MATH_BLOCK_(\d+)_PLACEHOLDER/g, function(match, index) {
        // テキストノードのnodeValueとして設定することで、HTMLとして解釈されない
        return mathBlocks[parseInt(index, 10)];
      });
      // 無効な数式ブロック（英数字なし）を復元
      text = text.replace(/DISABLED_MATH_(\d+)_PLACEHOLDER/g, function(match, index) {
        // 元の形式に戻すが、KaTeXが認識しないようにゼロ幅スペース（U+200B）を挿入
        const original = disabledMathBlocks[parseInt(index, 10)];
        // \[...\] → \​[...\​] (バックスラッシュと括弧の間にゼロ幅スペース)
        // \(...\) → \​(...\​)
        // $$...$$ → $​$...$​$
        // 各数式記法に応じてゼロ幅スペースを挿入
        if (original.startsWith('\\[')) {
          // \[...\] → \​[...\​]
          return original.replace(/^\\\[/, '\\\u200B[').replace(/\\\]$/, '\\\u200B]');
        } else if (original.startsWith('\\(')) {
          // \(...\) → \​(...\​)
          return original.replace(/^\\\(/, '\\\u200B(').replace(/\\\)$/, '\\\u200B)');
        } else if (original.startsWith('$$')) {
          // $$...$$ → $​$...$​$
          return original.replace(/^\$\$/, '$\u200B$').replace(/\$\$$/, '$\u200B$');
        }
        return original;
      });
      textNode.nodeValue = text;
    });

    htmlContent = doc.body.innerHTML;
  }

  // TOC（目次）を生成
  function generateTOC(html) {
    // 注意: ここで渡されるhtmlは既にDOMPurifyでサニタイズ済み
    // DOMParserを使用してHTMLを安全にパース（画像読み込み警告を回避）
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6');

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
    let tocHtml = '<nav class="toc"><h2 class="toc-title">' + chrome.i18n.getMessage('toc') + '</h2><ul class="toc-list">';

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
      content: doc.body.innerHTML
    };
  }

  // 画像をBase64に変換する関数（Background Scriptを使用・並列処理）
  async function convertImagesToBase64() {
    const images = document.querySelectorAll('.markdown-body img');
    const uniqueSources = new Set();
    const imageArray = [];

    // 重複を除外してユニークなsrcのみ処理
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !uniqueSources.has(src)) {
        uniqueSources.add(src);
        imageArray.push({ src, absoluteUrl: img.src });
      }
    });

    // 各画像の変換処理を並列実行
    const promises = imageArray.map(async ({ src, absoluteUrl }) => {
      try {
        // data:スキームの場合はそのまま使用
        if (src.startsWith('data:')) {
          return { src, base64: src };
        }

        // http/httpsまたはfile://画像をBackground Service Workerで取得（CORS回避）
        // リモート画像のサイズ制限: 20MB
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'CONVERT_IMAGE_TO_BASE64',
              imageUrl: src.startsWith('http://') || src.startsWith('https://') ? src : absoluteUrl
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
          // リモート画像の場合はサイズチェック（20MB制限）
          if (src.startsWith('http://') || src.startsWith('https://')) {
            const base64Size = response.base64.length * 0.75; // デコード後のサイズ推定
            const MAX_REMOTE_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

            if (base64Size > MAX_REMOTE_IMAGE_SIZE) {
              console.warn(`リモート画像が大きすぎます（推定${(base64Size / 1024 / 1024).toFixed(2)}MB > 20MB）: ${src} - URLのまま保持します`);
              return { src, base64: src };
            }
          }
          return { src, base64: response.base64 };
        } else {
          console.warn(`画像の変換に失敗しました: ${src}`, response.error);
          return { src, base64: src };
        }
      } catch (error) {
        console.warn(`画像処理中にエラーが発生しました: ${src}`, error);
        return { src, base64: src };
      }
    });

    // すべての画像を並列処理（Promise.allSettledで一部失敗しても継続）
    const results = await Promise.allSettled(promises);

    // 結果をMapに格納
    const imageMap = new Map();
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        imageMap.set(result.value.src, result.value.base64);
      }
    });

    return imageMap;
  }

  // HTMLを整形する関数（視認性向上のため）
  function formatHTML(html) {
    // js-beautifyを使用してHTMLを整形
    // html_beautifyはlibs/beautify-html.min.jsから提供される
    if (typeof html_beautify !== 'undefined') {
      return html_beautify(html, {
        indent_size: 2,              // インデントサイズ: 2スペース
        indent_char: ' ',            // インデント文字: スペース
        max_preserve_newlines: 1,    // 連続改行の最大数: 1
        preserve_newlines: true,     // 改行を保持
        indent_inner_html: true,     // <head>と<body>の内側もインデント
        wrap_line_length: 0,         // 行の折り返しなし
        end_with_newline: false,     // 末尾に改行を追加しない
        unformatted: ['code', 'pre', 'textarea'], // 整形しないタグ
        content_unformatted: ['pre', 'textarea'], // 内容を整形しないタグ
        extra_liners: []             // 追加の改行を入れないタグ
      });
    }

    // フォールバック（js-beautifyが利用できない場合）
    return html;
  }

  // スタンドアロンHTMLを生成する関数（エクスポート用）
  async function generateExportHTML(currentKatexEnabled, imageMap) {
    // KaTeX CSSを読み込んでフォントパスをCDN URLに修正（オフライン対応・フォントはCDN）
    let katexCSS = '';
    if (currentKatexEnabled) {
      try {
        const katexCssUrl = chrome.runtime.getURL('libs/katex.min.css');
        const response = await fetch(katexCssUrl);
        let css = await response.text();

        // CSS内のフォントパスを絶対URL（CDN）に置換
        // 例: url(fonts/KaTeX_Main-Regular.woff2) → url(https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/fonts/KaTeX_Main-Regular.woff2)
        css = css.replace(/url\(fonts\//g, 'url(https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/fonts/');

        katexCSS = css;
      } catch (error) {
        console.warn('KaTeX CSSの読み込みに失敗しました:', error);
      }
    }

    // Mermaidダイアグラムの中にガントチャートが含まれているかチェック
    // レンダリング済みのSVGの属性で厳密に判定（aria-roledescription="gantt"）
    const mermaidSvgs = document.querySelectorAll('.markdown-body .mermaid svg');
    const hasGanttChart = Array.from(mermaidSvgs).some(svg => {
      return svg.getAttribute('aria-roledescription') === 'gantt';
    });

    // Mermaid.jsを読み込んでエクスポートHTMLに埋め込み（ガントチャートがある場合のみ）
    let mermaidJS = '';
    if (hasGanttChart) {
      try {
        const mermaidJsUrl = chrome.runtime.getURL('libs/mermaid.min.js');
        const response = await fetch(mermaidJsUrl);
        mermaidJS = await response.text();
      } catch (error) {
        console.warn('Mermaid.jsの読み込みに失敗しました:', error);
      }
    }
    // セキュリティ: 既にレンダリング済みのHTMLコンテンツを使用
    // Markdownを再パースすると、数式内のXSS攻撃を防ぐのが困難になるため
    let renderedContent = document.querySelector('.markdown-body').innerHTML;
    let tocContent = document.querySelector('.toc .toc-list').innerHTML;

    // セキュリティ: エクスポート前に再度サニタイズ（二重防御）
    // DOMPurifyで危険なdata:スキームなどを再度チェック
    // DOMParserを使用してHTMLを安全にパース（画像読み込み警告を回避）
    const parser = new DOMParser();
    const doc = parser.parseFromString(renderedContent, 'text/html');

    // 実際にKaTeX要素が存在するかチェック
    const katexElements = doc.body.querySelectorAll('.katex');
    const hasKatexElements = katexElements.length > 0 && katexCSS !== '';

    // 実際にMermaid要素が存在するかチェック
    const mermaidElements = doc.body.querySelectorAll('.mermaid');
    const hasMermaidElements = mermaidElements.length > 0;

    // 危険なdata:スキームを持つ画像を削除
    doc.body.querySelectorAll('img[src^="data:"]').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.match(/^data:image\//i)) {
        img.removeAttribute('src');
      }
    });

    // 危険なdata:スキームを持つリンクを削除
    doc.body.querySelectorAll('a[href^="data:"]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.match(/^data:image\//i)) {
        a.removeAttribute('href');
      }
    });

    // MermaidのSVGをそのまま保存し、元のコードもdata-mermaid-code属性に保存
    // CDN読み込み成功時: 再描画、失敗時: 保存済みSVGを使用（オフライン対応）
    const mermaidDivs = doc.body.querySelectorAll('.mermaid');
    const mermaidCodes = Array.from(mermaidCodeMap.values());

    mermaidDivs.forEach((mermaidDiv, index) => {
      if (index < mermaidCodes.length) {
        const code = mermaidCodes[index];

        // 元のMermaidコードをdata-mermaid-code属性に保存（オンライン時の再描画用）
        mermaidDiv.setAttribute('data-mermaid-code', code);

        // SVGはそのまま残す（オフライン時のフォールバック用）
        // innerHTML = '' や textContent = code は実行しない

        // 不要な属性は削除
        mermaidDiv.removeAttribute('data-mermaid-id');
      }
    });

    renderedContent = doc.body.innerHTML;

    // HTMLを整形して視認性を向上（エクスポートファイルのデバッグ用）
    renderedContent = formatHTML(renderedContent);
    tocContent = formatHTML(tocContent);

    // ファイル名を取得（拡張子なし）
    const fileName = decodedPath.split('/').pop().replace(/\.(md|markdown|mkdn)$/i, '');

    // エクスポート用HTMLテンプレート
    // CDNからライブラリを読み込み、完全なスタンドアロンHTMLとして動作
    const exportHTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; img-src data: https: http:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net; script-src 'unsafe-inline' https://cdn.jsdelivr.net; object-src 'none'; base-uri 'none'; form-action 'none';">
  <title>${escapeHtml(fileName)} - Markdown Preview</title>

  <!-- KaTeX CSS (埋め込み・フォントはCDNから読み込み) - 数式が存在する場合のみ -->
  ${hasKatexElements ? '<style>' + katexCSS + '</style>' : ''}

  <!-- Mermaid JS (埋め込み・完全オフライン対応) - ガントチャートが存在する場合のみ -->
  ${hasGanttChart && mermaidJS ? '<script>' + mermaidJS + '</script>' : ''}

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
      /* 罫線テーブルがずれないようOS標準のCJK等幅フォントを優先（同梱なし） */
      font-family: ${getMonoFontStack()};
      /* 罫線が合字で連結されないように合字を無効化 */
      font-variant-ligatures: none;
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
  <button class="print-button" title="${chrome.i18n.getMessage('print')}">🖨️</button>
  <button class="theme-toggle" title="${chrome.i18n.getMessage('toggleTheme')}">☀️</button>
  <div class="sidebar">
    <nav class="toc"><h2 class="toc-title">${chrome.i18n.getMessage('toc')}</h2><ul class="toc-list" id="toc-placeholder"></ul></nav>
  </div>
  <div class="resize-handle"></div>
  <div class="main-content">
    <article class="markdown-body" id="content-placeholder"></article>
  </div>

  <!-- エクスポートHTML用スクリプト -->
  <script>
    (function() {
      'use strict';

      // セキュリティ: 既にレンダリング済みのHTMLコンテンツを使用
      // Markdownを再パースせずに、安全に処理されたコンテンツを使用
      // テンプレートリテラルで埋め込むため、特殊文字をエスケープ
      const renderedContent = \`${renderedContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
      const tocHtml = \`${tocContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

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

      ${hasGanttChart ? `// Mermaidダイアグラムの初期化と描画（ガントチャートのみ）
      // オンライン時: 埋め込まれたMermaid.jsで再描画
      // オフライン時: 保存済みSVGを使用
      if (typeof mermaid !== 'undefined') {
        // Mermaidの設定（デフォルトテーマを使用）
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif'
        });

        // 元のMermaidコードを保存（data-mermaid-code属性から取得）
        const mermaidOriginalCodes = [];
        const mermaidElements = document.querySelectorAll('.mermaid');
        mermaidElements.forEach(function(element) {
          const code = element.getAttribute('data-mermaid-code');
          if (code) {
            mermaidOriginalCodes.push(code);
          }
        });

        // Mermaidダイアグラムを描画する関数
        function renderMermaid() {
          const elements = document.querySelectorAll('.mermaid');
          if (elements.length > 0) {
            // 既存のSVGをクリアして元のコードに戻す
            elements.forEach(function(element, index) {
              if (index < mermaidOriginalCodes.length) {
                element.innerHTML = '';
                element.textContent = mermaidOriginalCodes[index];
                element.removeAttribute('data-processed');
              }
            });

            // 再描画を実行
            mermaid.run({
              querySelector: '.mermaid'
            }).catch(function(err) {
              console.error('Mermaid rendering error:', err);
            });
          }
        }

        // 初回描画
        if (mermaidElements.length > 0) {
          mermaidElements.forEach(function(element, index) {
            element.setAttribute('id', 'mermaid-diagram-' + index);
          });
          renderMermaid();
        }

        // ウィンドウリサイズ時に再描画（debounce処理付き）
        let resizeTimer;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            renderMermaid();
          }, 300); // 300ms後に再描画
        });
      } else {
        // Mermaid.jsが読み込めない場合（オフライン時）
        // 保存済みのSVGをそのまま使用（何もしない）
        console.info('Mermaid.js not available. Using pre-rendered SVG diagrams.');
      }` : ''}
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
  <title>${escapeHtml(decodedPath.split('/').pop())} - Markdown Preview</title>
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
      /* 罫線テーブルがずれないようOS標準のCJK等幅フォントを優先（同梱なし） */
      font-family: ${getMonoFontStack()};
      /* 罫線が合字で連結されないように合字を無効化 */
      font-variant-ligatures: none;
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
    .export-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .export-button:disabled:hover {
      transform: none;
    }
    /* スピナーアニメーション（処理中） */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .export-button.loading {
      animation: spin 1s linear infinite;
    }
    /* 完了時のカラーアニメーション */
    @keyframes successPulse {
      0%, 100% { background-color: #f6f8fa; }
      50% { background-color: #28a745; }
    }
    @keyframes successPulseDark {
      0%, 100% { background-color: #21262d; }
      50% { background-color: #238636; }
    }
    .export-button.success {
      animation: successPulse 0.6s ease-in-out;
      color: #28a745;
    }
    body[data-theme="dark"] .export-button.success {
      animation: successPulseDark 0.6s ease-in-out;
      color: #3fb950;
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
  <button class="export-button" title="${chrome.i18n.getMessage('exportHtml')}">
    ⬇️
  </button>
  <button class="print-button" title="${chrome.i18n.getMessage('print')}">
    🖨️
  </button>
  <button class="katex-toggle ${isKatexEnabled ? 'enabled' : ''}" title="${chrome.i18n.getMessage('toggleKatex')}">
    <span>TeX</span>
    <span>${isKatexEnabled ? 'ON' : 'OFF'}</span>
  </button>
  <button class="theme-toggle" title="${chrome.i18n.getMessage('toggleTheme')}">
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
      // ローディング状態を開始
      const originalText = exportButton.textContent;
      exportButton.textContent = '⏳';
      exportButton.classList.add('loading');
      exportButton.disabled = true;

      try {
        // ローカル画像をBase64に変換
        const imageMap = await convertImagesToBase64();

        // エクスポート用HTMLを生成
        const exportHTML = await generateExportHTML(isKatexEnabled, imageMap);

        // ファイル名を生成
        const fileName = decodedPath.split('/').pop().replace(/\.(md|markdown|mkdn)$/i, '') + '.html';

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

        // 完了を示すアニメーション
        exportButton.textContent = '✓';
        exportButton.classList.remove('loading'); // 回転を止める
        exportButton.classList.add('success'); // カラーアニメーション開始
        setTimeout(() => {
          exportButton.textContent = originalText;
          exportButton.classList.remove('success');
          exportButton.disabled = false;
        }, 1000);
      } catch (error) {
        alert(chrome.i18n.getMessage('exportFailed') + error.message);

        // エラー時も元に戻す
        exportButton.textContent = originalText;
        exportButton.classList.remove('loading');
        exportButton.disabled = false;
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
          // GitHub互換のヒューリスティックを適用：
          // 有効な$...$のみを\(...\)に変換してから、KaTeX auto-renderを実行
          // ルール（GitHubの実際の動作に基づく）:
          // 開始$: 直後が空白/タブでない
          // 終了$: 直前が空白/タブでない、直後が英数字でない
          // 内容: 英数字が含まれている
          const applyGitHubHeuristics = (element) => {
            const walker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
              {
                acceptNode: (node) => {
                  // $を含まないテキストノードはスキップ
                  if (!node.nodeValue || !node.nodeValue.includes('$')) {
                    return NodeFilter.FILTER_SKIP;
                  }

                  // 親要素が見出しタグ（h1-h6）の場合はスキップ
                  let parent = node.parentElement;
                  while (parent) {
                    if (/^H[1-6]$/.test(parent.tagName)) {
                      return NodeFilter.FILTER_SKIP;
                    }
                    parent = parent.parentElement;
                  }

                  return NodeFilter.FILTER_ACCEPT;
                }
              }
            );

            const nodesToProcess = [];
            let node;
            while (node = walker.nextNode()) {
              nodesToProcess.push(node);
            }

            nodesToProcess.forEach(textNode => {
              let text = textNode.nodeValue;

              // markdown-it-katex の公式ヒューリスティックを実装:
              // - 開始$: 直前が空白/タブでない、直後が空白/タブでない
              // - 終了$: 直前が空白/タブでない、直後が数字でない

              // $...$を検出して、有効なペアのみを\(...\)に変換
              const dollarPositions = [];
              for (let i = 0; i < text.length; i++) {
                if (text[i] === '$') {
                  const prevChar = i > 0 ? text.charCodeAt(i - 1) : null;
                  const nextChar = i < text.length - 1 ? text.charCodeAt(i + 1) : null;

                  // can_open: 直後が空白/タブでない（GitHub互換: 直前チェックなし）
                  const canOpen = (nextChar !== null && nextChar !== 0x20 && nextChar !== 0x09);

                  // can_close: 直前が空白/タブでなく、直後が英数字でない（GitHub拡張）
                  const isAlphanumeric = (charCode) => {
                    return (charCode >= 0x30 && charCode <= 0x39) || // 0-9
                           (charCode >= 0x41 && charCode <= 0x5A) || // A-Z
                           (charCode >= 0x61 && charCode <= 0x7A);   // a-z
                  };
                  const canClose = (prevChar !== null && prevChar !== 0x20 && prevChar !== 0x09) &&
                                   (nextChar === null || !isAlphanumeric(nextChar));

                  dollarPositions.push({ index: i, canOpen, canClose });
                }
              }

              // 有効なペアを見つけて変換（markdown-it-katexと同じロジック）
              // 隣接する$同士のみをペアにする（間に別の$がある場合はペア不成立）
              const pairs = [];
              let i = 0;
              while (i < dollarPositions.length - 1) {
                const openPos = dollarPositions[i];
                const nextPos = dollarPositions[i + 1];

                // 開始$がcan_openで、次の$がcan_closeの場合のみペア成立
                if (openPos.canOpen && nextPos.canClose) {
                  pairs.push({ start: openPos.index, end: nextPos.index });
                  i += 2; // ペアをスキップして次へ
                } else {
                  i++; // この$はペアにならないので次へ
                }
              }

              // 後ろから置換（インデックスがずれないように）
              for (let i = pairs.length - 1; i >= 0; i--) {
                const { start, end } = pairs[i];
                const content = text.substring(start + 1, end);

                // 内容に英数字が含まれているかチェック（GitHub互換）
                // 英数字が含まれていない場合は数式として認識しない
                const hasAlphanumeric = /[a-zA-Z0-9]/.test(content);
                if (!hasAlphanumeric) {
                  continue; // このペアはスキップ
                }

                const replacement = `\\(${content}\\)`;
                text = text.substring(0, start) + replacement + text.substring(end + 1);
              }

              textNode.nodeValue = text;
            });
          };

          // ヒューリスティックを適用（$...$を\(...\)に変換）
          applyGitHubHeuristics(mathElements);

          // KaTeX auto-renderを実行
          renderMathInElement(mathElements, {
            delimiters: [
              { left: '$$', right: '$$', display: true },   // ディスプレイ数式
              // { left: '$', right: '$', display: false }, // 無効化（ヒューリスティックで\(...\)に変換済み）
              { left: '\\[', right: '\\]', display: true }, // ディスプレイ数式（LaTeX形式）
              { left: '\\(', right: '\\)', display: false } // インライン数式（LaTeX形式）
            ],
            throwOnError: false, // エラーが発生してもレンダリングを継続
            errorColor: '#cc0000', // エラー時の色
            strict: 'warn', // セキュリティ: 非推奨コマンドに警告を出す
            trust: false, // セキュリティ: 信頼されていないコマンド（\url, \href等）を許可しない
            maxSize: 500, // セキュリティ: 数式の最大サイズを制限（DoS攻撃対策）
            maxExpand: 1000, // セキュリティ: マクロ展開の最大回数を制限（DoS攻撃対策）
            ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], // コードブロック、インラインコード、見出しで$記号の誤検知を防ぐ
            ignoredClasses: ['no-math'] // 特定のクラスで数式処理を無効化可能に
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

    // 元のMermaidコードを保存（リサイズ時の再描画用）
    const mermaidOriginalCodes = [];
    const mermaidElements = document.querySelectorAll('.mermaid');
    mermaidElements.forEach((element) => {
      mermaidOriginalCodes.push(element.textContent);
    });

    // Mermaidダイアグラムを描画する関数
    function renderMermaidDiagrams() {
      const elements = document.querySelectorAll('.mermaid');
      if (elements.length > 0) {
        // 既存のSVGをクリアして元のコードに戻す
        elements.forEach((element, index) => {
          if (index < mermaidOriginalCodes.length) {
            element.innerHTML = '';
            element.textContent = mermaidOriginalCodes[index];
            element.removeAttribute('data-processed');
          }
        });

        // 描画を実行
        mermaid.run({
          querySelector: '.mermaid'
        }).catch(err => {
          // Mermaid描画エラーは無視（ページ表示は継続）
        });
      }
    }

    // 初回描画
    if (mermaidElements.length > 0) {
      mermaidElements.forEach((element, index) => {
        const id = `mermaid-diagram-${index}`;
        element.setAttribute('id', id);
      });
      renderMermaidDiagrams();
    }

    // ウィンドウリサイズ時に再描画（debounce処理付き）
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderMermaidDiagrams();
      }, 300); // 300ms後に再描画
    });
  }

})();
