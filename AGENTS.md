# Local Markdown Viewer

このドキュメントは、AIコーディングエージェント（Claude Code、Cursor、Zedなど）がこのプロジェクトを理解し、サポートするためのプロジェクト情報です。

## プロジェクト概要

- **プロジェクト名**: Local Markdown Viewer
- **種類**: Chrome拡張機能
- **対象ユーザー**: グローバルユーザー（日本語、英語、中国語簡体字に対応）
- **目的**: ローカルのMarkdownファイル（.md, .markdown）をGitHubスタイルで美しくプレビュー表示する

## 技術スタック

### コア技術
- **言語**: バニラJavaScript（ES6+）
- **プラットフォーム**: Google Chrome拡張機能
- **Manifest Version**: 3（Manifest V3）

### 依存ライブラリ
- **marked.js** v12.0.0 - Markdownパーサー
- **highlight.js** v11.9.0 - シンタックスハイライト（140+言語対応）
- **DOMPurify** v3.0.8 - HTMLサニタイゼーション（XSS対策）
- **Mermaid** v11.12.1 - ダイアグラム描画ライブラリ
- **KaTeX** v0.16.10 - 数式レンダリングライブラリ
- **js-beautify** v1.15.1 - HTMLコード整形ライブラリ（エクスポート用）

### ビルドツール
- **ビルドプロセス**: なし
- このプロジェクトはビルドステップを必要としません
- すべてのファイルは直接使用されます

## プロジェクト構造

```
C:\work\chrome_extention\local-markdown-viewer\
├── manifest.json          # Chrome拡張機能のマニフェストファイル（Manifest V3）
├── content.js            # メインのコンテンツスクリプト
├── background.js         # Background Service Worker（画像Base64変換用）
├── README.md             # プロジェクトドキュメント（日本語）
├── AGENTS.md             # AIエージェント向けプロジェクト情報
├── CLAUDE.md             # Claude Code設定（@AGENTS.mdをインポート）
├── _locales/             # 多言語対応（i18n）ディレクトリ
│   ├── en/              # 英語（デフォルト）
│   │   └── messages.json
│   ├── ja/              # 日本語
│   │   └── messages.json
│   └── zh_CN/           # 中国語簡体字
│       └── messages.json
├── icons/                # 拡張機能のアイコン（16, 32, 48, 128px）
├── libs/                 # サードパーティライブラリ
│   ├── marked.min.js
│   ├── highlight.min.js
│   ├── purify.min.js
│   ├── mermaid.min.js
│   ├── katex.min.js
│   ├── katex.min.css
│   ├── auto-render.min.js
│   ├── beautify-html.min.js
│   └── highlight-github.min.css
├── styles/               # カスタムCSSスタイル
│   └── github.css        # GitHubスタイルのCSS
├── test/                 # テストディレクトリ
└── chrome_store_description/  # Chrome Web Store説明文
```

## 開発ガイドライン

### コーディングスタイル

1. **JavaScript**
   - バニラJavaScriptを使用（フレームワーク不使用）
   - ES6+の機能を積極的に使用（const/let, アロー関数, テンプレートリテラルなど）
   - セミコロンを使用
   - インデント: スペース2つ

2. **コメント**
   - すべてのコメントは日本語で記述
   - 複雑なロジックには必ず説明コメントを追加
   - JSDocスタイルは不要（シンプルなプロジェクトのため）

3. **命名規則**
   - 変数・関数: キャメルケース（例: `generateTableOfContents`）
   - 定数: UPPER_SNAKE_CASE（例: `MAX_HEADING_LEVEL`）
   - プライベート関数: アンダースコアプレフィックス（例: `_parseMarkdown`）

### Chrome拡張機能の制約

1. **Manifest V3の要件**
   - Content Security Policy (CSP)に準拠
   - `eval()`や動的コード実行は使用不可
   - インラインスクリプトは使用不可

2. **ファイルアクセス**
   - `file://` プロトコルでのアクセスをサポート
   - ユーザーは「ファイルのURLへのアクセスを許可する」を有効化する必要がある

3. **コンテンツスクリプトの制限**
   - ページのDOMにのみアクセス可能
   - Chrome APIへのアクセスは限定的

## 開発・テスト手順

### ローカルでの拡張機能の読み込み

1. `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのルートディレクトリを選択
5. 「ファイルのURLへのアクセスを許可する」をONにする

### テスト方法

1. ローカルの.mdファイルをChromeで開く
2. DevToolsを開いてコンソールでエラーを確認
3. ページを再読み込み（Ctrl+R）して変更を確認

### デバッグ

- コンテンツスクリプトのデバッグ: ページ上でDevToolsを開く
- Background Service Workerのデバッグ: `chrome://extensions/` の「Service Worker」リンクをクリック
- `console.log()` を使用してデバッグ情報を出力
- 画像エクスポートのデバッグ: Background Service Workerのコンソールで画像変換のログを確認

## 機能概要

### 主要機能

1. **Markdown レンダリング**
   - GitHub Flavored Markdown (GFM) 対応
   - テーブル、タスクリスト、打ち消し線、自動リンク

2. **シンタックスハイライト**
   - 140+のプログラミング言語に対応
   - GitHubスタイルのカラースキーム

3. **Mermaidダイアグラム**
   - フローチャート、シーケンス図、クラス図、状態遷移図
   - ガントチャート、円グラフ、ER図など
   - 常にデフォルト（ライト）テーマで描画（ダークモード時も白背景で表示）

4. **数式レンダリング（KaTeX）**
   - インライン数式（$...$、\(...\)）
   - ディスプレイ数式（$$...$$、\[...\]）
   - **注意**: LaTeX形式（`\(...\)`と`\[...\]`）に対応（GitHub以上の機能）
   - **GitHub互換ヒューリスティック**: $記号の誤検知を防止（実際のGitHubの動作に基づく）
     - **開始の`$`**: 直後が空白/タブでない
     - **終了の`$`**: 直前が空白/タブでない、直後が英数字でない
     - **内容の検証**: 英数字（0-9, a-z, A-Z）が含まれている
       - `$...$`（ドットのみ） → 数式として認識されない
       - `$abc$`（英字あり） → 数式として認識される
       - `$$...$$`（ドットのみ） → 数式として認識されない
       - `$$E=mc^2$$`（英数字あり） → 数式として認識される
       - `\[...\]`（ドットのみ） → 数式として認識されない
     - これにより`$10 and $20`などの価格表示が数式として誤認識されない
     - コードブロック（` ```...``` `）とインラインコード（`` `...` ``）内の$記号は保護される
     - **見出し（h1-h6）内のすべての数式記法は無効化**（GitHub互換）
       - `$...$`, `$$...$$`, `\[...\]`, `\(...\)` すべて保護される
       - 二重保護: Markdownパース前の見出し行保護 + KaTeX auto-renderのignoredTags
   - ライト/ダークモード対応
   - ON/OFF切り替えボタン（右上に配置）
   - デフォルトON、localStorageに設定を保存
   - エクスポート時: CSSを埋め込み、フォントはCDNから読み込み（基本レイアウトはオフライン表示可）

5. **自動目次（TOC）生成**
   - h1-h6の見出しから自動生成
   - レスポンシブ対応の左サイドバー
   - クリックでスムーズスクロール
   - サイドバー幅のリサイズ機能

6. **ダークモード**
   - ワンクリックでライト/ダークモードを切り替え
   - GitHub風のダークテーマ
   - localStorageに設定を保存

7. **印刷機能**
   - 右上に印刷ボタン（🖨️）を配置
   - ワンクリックで印刷ダイアログを開く
   - 印刷時は目次とボタンを自動的に非表示
   - メインコンテンツをフル幅で印刷
   - 現在のモード（ライト/ダーク）をそのまま維持
   - ページ区切りの最適化（見出しやコードブロックの途中で改ページしない）

8. **HTMLエクスポート機能（最適化版）**
   - 右上にエクスポートボタン（⬇️）を配置
   - スタンドアロンHTMLファイルとしてダウンロード
   - **セキュリティ重視**: 既にレンダリング済みのコンテンツを使用（Markdownを再パースしない）
   - **オフライン対応（ハイブリッド方式）**:
     - 画像: ローカル・リモート共にBase64埋め込み（完全オフライン）
     - Mermaid SVG: エクスポート時のSVGを保存（完全オフライン、オンライン時は再描画）
     - KaTeX CSS: CSSを埋め込み、フォントのみCDN参照（ほぼオフライン）
       - libs/katex.min.cssを読み込み、フォントパスをCDN URLに置換
       - `url(fonts/` → `url(https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/fonts/`
   - **並列処理による高速化**:
     - すべての画像を並列ダウンロード・変換（Promise.allSettled使用）
     - 重複画像の除外（Set使用）
     - 一部失敗しても全体は継続
     - ローカル画像: 最大30MB/ファイル、リモート画像: 最大20MB/ファイル
     - Background Service Workerで取得（CORS回避）
   - **視認性向上**: js-beautifyでHTMLを整形（インデント2スペース）
   - サポート形式: PNG, JPEG, GIF, WebP, SVG, BMP
   - エクスポートされたHTMLは目次、ダークモード切り替え、印刷機能を含む
   - Content Security Policy (CSP)による保護
   - **推奨環境**: インターネット接続（KaTeXフォント、Mermaid再描画で最高品質）

9. **UIボタン**
   - すべてのボタンを40px × 40pxの円形に統一
   - エクスポートボタン（⬇️）: 一番左
   - 印刷ボタン（🖨️）: 左から2番目
   - TeXボタン（2行表示）: 右から2番目
   - ダークモード切り替えボタン（☀️/🌙）: 右端
   - ダークモードボタンは現在の状態を表示（☀️=ライト、🌙=ダーク）
   - ホバー時にスケール拡大アニメーション

10. **セキュリティ**
    - DOMPurifyによるHTMLサニタイゼーション（XSS対策）
    - Content Security Policy (CSP)による多層防御
    - data:スキーム検証（`data:image/*`のみ許可）
    - Mermaid strictモードでスクリプト実行を防止（`securityLevel: 'strict'`）
    - KaTeX厳格モード（`trust: false`, `strict: 'warn'`）
    - KaTeX DoS攻撃対策（`maxSize: 500`, `maxExpand: 1000`）
    - 画像変換のサイズ・MIMEタイプ検証（ローカル: 上限30MB、リモート: 上限20MB、画像形式のみ）
    - エクスポートHTML二重サニタイズ（既にレンダリング済みコンテンツを使用）
    - Background Service Workerで画像変換を行い、Content Scriptの制限を回避

## セキュリティ考慮事項

### 基本方針
- ユーザーが提供するMarkdownコンテンツは信頼できないものとして扱う
- HTMLレンダリング前に必ずDOMPurifyでサニタイズ
- 外部リソースの読み込みに注意
- `target="_blank"` を使用する際は `rel="noopener noreferrer"` を追加

### 多層防御アプローチ

#### レイヤー1: DOMPurifyサニタイズ
- 許可されたタグ・属性のホワイトリスト方式
- XSS攻撃に使用される危険なタグ・属性を自動削除
- `afterSanitizeAttributes` フックで追加検証

#### レイヤー2: Content Security Policy (CSP)
- 通常表示: `script-src 'none'` - すべてのスクリプト実行を禁止
- エクスポートHTML: `script-src 'unsafe-inline'` - インラインのみ許可
- `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`

#### レイヤー3: data:スキーム検証
- `data:image/*` のみ許可
- `data:text/html` などの危険なスキームをブロック
- 画像（`<img src>`）とリンク（`<a href>`）の両方で検証

#### レイヤー4: KaTeXセキュリティ設定
- `trust: false` - `\url`, `\href`等の危険なコマンドを無効化
- `strict: 'warn'` - 非推奨のLaTeXコマンドに警告
- `maxSize: 500` - 数式サイズ制限（DoS攻撃対策）
- `maxExpand: 1000` - マクロ展開回数制限（DoS攻撃対策）

#### レイヤー5: Mermaidセキュリティ設定
- `securityLevel: 'strict'` - スクリプト実行を防止

#### レイヤー6: 画像変換の制限
- ローカル画像: 最大30MB/ファイル
- リモート画像: 最大20MB/ファイル
- MIMEタイプ検証（PNG, JPEG, GIF, WebP, SVG, BMP のみ許可）
- Content-Lengthと実際のBlobサイズの両方をチェック

### KaTeX数式のセキュリティ処理（通常表示）
1. **ディスプレイ数式のみ保護**: Marked.jsパース前に`$$...$$`と`\[...\]`をプレースホルダーに置換
2. **DOMPurifyサニタイズ**: 通常のMarkdownをサニタイズ
3. **安全な復元**: プレースホルダーをテキストノードのnodeValueとして設定（HTMLとして解釈されない）
4. **KaTeX auto-render**: インライン数式（`$...$`, `\(...\)`）を含むすべての数式を安全にレンダリング

### エクスポートHTMLのセキュリティ処理
1. **既にレンダリング済みのコンテンツを使用**: Markdownを再パースしないことでXSS攻撃を根本から防御
2. **再サニタイズ**: エクスポート前に危険なdata:スキームを再度検証
3. **CSP適用**: エクスポートされたHTML自体にもCSPヘッダーを含める

この多層防御により、数式やMarkdown内にスクリプトタグやXSSペイロードが含まれていても、実行されることはありません。

## ライセンス

- このプロジェクト: MIT License
- 使用ライブラリのライセンスは `THIRD_PARTY_LICENSES.md` を参照

## よくある作業

### ライブラリの更新

```bash
# libs/ディレクトリ内のファイルを手動で置き換える
# npm/yarnは使用していないため、公式サイトからダウンロード
```

### アイコンの変更

```bash
# icons/ディレクトリ内のPNGファイルを置き換える
# サイズ: 16x16, 32x32, 48x48, 128x128
```

### マニフェストの更新

```bash
# manifest.jsonを編集後、chrome://extensions/ で拡張機能を再読み込み
```

## 注意事項

- この拡張機能は日本語ユーザー向けであり、UI・ドキュメントは日本語のみ
- package.jsonは存在しない（npmプロジェクトではない）
- ビルドやトランスパイルのプロセスはない
- 全てのファイルはそのまま使用される
