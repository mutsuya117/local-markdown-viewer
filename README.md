# Local Markdown Viewer - Chrome拡張機能

ローカルのMarkdownファイル（.md, .markdown）をGitHubスタイルで美しくプレビュー表示するChrome拡張機能です。

**注意**: この拡張機能は日本語のみサポートしています。

## 機能

- ✅ **GitHub Flavored Markdown (GFM)** 完全対応
  - テーブル
  - タスクリスト
  - 打ち消し線
  - 自動リンク
- ✅ **シンタックスハイライト** - 140+のプログラミング言語に対応
- ✅ **Mermaidダイアグラム対応** - フローチャート、シーケンス図、ガントチャート、円グラフなど
- ✅ **自動目次（TOC）生成** - 見出し（h1-h6）から自動生成
- ✅ **ダークモード対応** - ワンクリックでライト/ダークモードを切り替え
- ✅ **GitHubスタイル** - GitHubと同じデザインで表示
- ✅ **ローカルファイル対応** - file:// プロトコルでアクセスする.mdファイルに対応

## インストール方法

Chrome Web Storeからインストールします。

インストール後、必ず以下の設定を行ってください：

1. `chrome://extensions/` を開く
2. 「Local Markdown Viewer」拡張機能の「詳細」をクリック
3. **「ファイルのURLへのアクセスを許可する」をONにする**

この設定を有効にしないと、ローカルファイルを表示できません。

## 使用方法

1. ローカルの.mdまたは.markdownファイルをChromeで開く
   - ファイルをChromeのウィンドウにドラッグ&ドロップ
   - または右クリック → 「プログラムから開く」→「Google Chrome」
2. 自動的にGitHubスタイルでプレビュー表示されます

## 機能詳細

### 左サイドバー目次
- 見出しから自動生成される目次が左側に固定表示
- スクロールしても常に表示
- クリックで該当箇所にジャンプ
- レスポンシブ対応（小さい画面では非表示）

## サポートされるMarkdown構文

### 基本構文
- 見出し（h1-h6）
- 段落
- 強調（太字、斜体）
- リスト（番号付き、箇条書き）
- リンク
- 画像
- 引用
- コードブロック
- 水平線

### GitHub Flavored Markdown (GFM)

#### テーブル
```markdown
| ヘッダー1 | ヘッダー2 |
|----------|----------|
| セル1    | セル2    |
```

#### タスクリスト
```markdown
- [x] 完了したタスク
- [ ] 未完了のタスク
```

#### シンタックスハイライト

コードブロックに言語を指定すると、自動的にシンタックスハイライトが適用されます：

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

#### Mermaidダイアグラム

コードブロックの言語として`mermaid`を指定すると、ダイアグラムが自動的に描画されます：

\`\`\`mermaid
graph TD
    A[開始] --> B{条件分岐}
    B -->|Yes| C[処理1]
    B -->|No| D[処理2]
    C --> E[終了]
    D --> E
\`\`\`

対応するダイアグラムの種類：
- フローチャート（graph, flowchart）
- シーケンス図（sequenceDiagram）
- クラス図（classDiagram）
- 状態遷移図（stateDiagram）
- ガントチャート（gantt）
- 円グラフ（pie）
- ER図（erDiagram）
- ユーザージャーニー（journey）
- その他多数

詳細は[Mermaid公式ドキュメント](https://mermaid.js.org/)をご覧ください。

## トラブルシューティング

### Markdownファイルが正しく表示されない

1. 拡張機能が有効になっているか確認（`chrome://extensions/`）
2. **「ファイルのURLへのアクセスを許可する」がONになっているか確認**（最も重要）
3. ファイル拡張子が`.md`または`.markdown`であることを確認
4. ページをリロード（Ctrl+R または F5）

## 使用ライブラリ

この拡張機能は以下のオープンソースライブラリを使用しています：

- [marked.js](https://marked.js.org/) v12.0.0 - MIT License
- [highlight.js](https://highlightjs.org/) v11.9.0 - BSD 3-Clause License
- [DOMPurify](https://github.com/cure53/DOMPurify) v3.0.8 - Apache License 2.0 / MPL 2.0
- [Mermaid](https://mermaid.js.org/) v11.4.1 - MIT License

詳細なライセンス情報は [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) をご覧ください。

## ライセンス

このプロジェクトはMITライセンスのもとで公開されています。
