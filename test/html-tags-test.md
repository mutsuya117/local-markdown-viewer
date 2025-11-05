# HTMLタグテスト

このファイルは、GitHub互換のHTMLタグが正しく表示されることを確認するテストです。

---

## ✅ 安全なHTMLタグ（GitHubで使用可能）

### 1. 見出し・段落・区切り（h1-h6, p, br, hr）

<h1>HTMLで書いたH1見出し</h1>

<h2>HTMLで書いたH2見出し</h2>

<h3>HTMLで書いたH3見出し</h3>

<p>これは&lt;p&gt;タグで書いた段落です。</p>

<p>複数の段落を<br>改行タグで<br>区切ることもできます。</p>

<hr>

上記は`<hr>`タグで挿入した水平線です。

---

### 2. リンクと画像（a, img）

**リンク（a）**:

<a href="https://github.com">GitHubへのリンク</a>

<a href="#見出し">ページ内リンク</a>

<a href="https://example.com" title="外部サイト" target="_blank" rel="noopener noreferrer">外部リンク（新しいタブで開く）</a>

**画像（img）**:

<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ff6b6b'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='16'%3ETEST%3C/text%3E%3C/svg%3E" alt="テスト画像">

<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='50'%3E%3Crect width='200' height='50' fill='%234ecdc4'/%3E%3Ctext x='100' y='30' text-anchor='middle' fill='white' font-size='14'%3E画像タグのテスト%3C/text%3E%3C/svg%3E" alt="SVG画像" width="200" height="50">

<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Ccircle cx='25' cy='25' r='20' fill='%23ffe66d'/%3E%3C/svg%3E" alt="円" align="left">左寄せの画像とテキストが並ぶ場合のテスト。<br clear="all">

---

### 3. テキスト装飾（strong, em, b, i, u, s, del, ins）

**太字**:
- <strong>strong タグ</strong>
- <b>b タグ</b>

**斜体**:
- <em>em タグ</em>
- <i>i タグ</i>

**取り消し線**:
- <s>s タグ</s>
- <del>del タグ（削除）</del>

**挿入**:
- <ins>ins タグ（挿入）</ins>

**組み合わせ**:
- <strong><em>太字と斜体</em></strong>
- <del><strong>取り消し線と太字</strong></del>
- 価格: <del>5,000円</del> <ins><strong>3,000円</strong></ins>

---

### 4. リスト（ul, ol, li）

**順序なしリスト**:

<ul>
  <li>項目1</li>
  <li>項目2
    <ul>
      <li>ネストした項目2-1</li>
      <li>ネストした項目2-2</li>
    </ul>
  </li>
  <li>項目3</li>
</ul>

**順序付きリスト**:

<ol>
  <li>最初のステップ</li>
  <li>2番目のステップ</li>
  <li>3番目のステップ</li>
</ol>

---

### 5. テーブル（table, thead, tbody, tfoot, tr, th, td）

<table>
<thead>
  <tr>
    <th>列1</th>
    <th>列2</th>
    <th>列3</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>データ1-1</td>
    <td>データ1-2</td>
    <td>データ1-3</td>
  </tr>
  <tr>
    <td>データ2-1</td>
    <td>データ2-2</td>
    <td>データ2-3</td>
  </tr>
</tbody>
<tfoot>
  <tr>
    <td colspan="2"><strong>合計</strong></td>
    <td><strong>100</strong></td>
  </tr>
</tfoot>
</table>

**属性のテスト**:

<table border="1">
  <tr>
    <th align="left">左寄せ</th>
    <th align="center">中央</th>
    <th align="right">右寄せ</th>
  </tr>
  <tr>
    <td align="left">左</td>
    <td align="center">中央</td>
    <td align="right">右</td>
  </tr>
</table>

---

### 6. 引用とコード（blockquote, pre, code）

<blockquote>
これは&lt;blockquote&gt;タグで書いた引用です。

<p>段落タグも含められます。</p>
</blockquote>

<blockquote>
  <blockquote>
    ネストした引用
  </blockquote>
</blockquote>

**インラインコード**: <code>const x = 10;</code>

**コードブロック**:

<pre><code>function hello() {
  console.log("Hello, World!");
}
</code></pre>

---

### 7. 折りたたみ（details / summary）

<details>
<summary>クリックして開く</summary>

これは折りたたみコンテンツです。

- リスト項目1
- リスト項目2

```javascript
console.log("コードブロックも含められます");
```

</details>

<details open>
<summary>デフォルトで開いている</summary>

`open` 属性を付けると、最初から開いた状態で表示されます。

</details>

---

### 8. div と span（div, span）

**div（ブロック要素）**:

<div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
これはdivタグで囲まれたブロックです。背景色と余白を設定しています。
</div>

<div align="center">
中央寄せのdiv
</div>

**span（インライン要素）**:

これは<span style="color: red;">赤い文字</span>と<span style="background-color: yellow;">黄色い背景</span>のテストです。

---

### 9. キーボード入力（kbd）

キーボードショートカット:

- <kbd>Ctrl</kbd> + <kbd>C</kbd> でコピー
- <kbd>Ctrl</kbd> + <kbd>V</kbd> で貼り付け
- <kbd>Ctrl</kbd> + <kbd>Z</kbd> で元に戻す
- <kbd>⌘</kbd> + <kbd>S</kbd> で保存（Mac）

---

### 10. ハイライト（mark）

<mark>重要な部分をハイライト</mark>できます。

文章の中で<mark>特定の単語や文</mark>を強調したい場合に使用します。

---

### 11. 上付き・下付き文字（sup / sub）

**化学式**:
- 水: H<sub>2</sub>O
- 二酸化炭素: CO<sub>2</sub>
- 硫酸: H<sub>2</sub>SO<sub>4</sub>

**数式**:
- E=mc<sup>2</sup>（アインシュタインの式）
- x<sup>2</sup> + y<sup>2</sup> = z<sup>2</sup>
- 2<sup>10</sup> = 1024

**注釈**:
- これは注釈です<sup>1</sup>
- 別の注釈<sup>2</sup>

---

### 12. タスクリスト（input type="checkbox"）

GitHubスタイルのタスクリスト（HTMLタグ版）:

<ul>
  <li><input type="checkbox" disabled> 未完了タスク</li>
  <li><input type="checkbox" checked disabled> 完了タスク</li>
  <li><input type="checkbox" disabled> 別の未完了タスク</li>
</ul>

**注意**: `disabled`属性により、チェックボックスはクリックできません（読み取り専用）。

---

### 13. その他のインライン要素（abbr, cite, q, time）

**abbreviation（略語）** - GitHubでサポート:
<abbr title="HyperText Markup Language">HTML</abbr>と<abbr title="Cascading Style Sheets">CSS</abbr>

**引用元（cite）**:
<cite>ソースコードの引用元</cite>

**引用符（q）**:
彼は<q>明日は晴れるだろう</q>と言った。

**時刻（time）**:
<time datetime="2025-11-05">2025年11月5日</time>

---

### 14. 定義リスト（dl, dt, dd）

<dl>
  <dt>HTML</dt>
  <dd>HyperText Markup Language - Webページの構造を記述する言語</dd>

  <dt>CSS</dt>
  <dd>Cascading Style Sheets - Webページのスタイルを記述する言語</dd>

  <dt>JavaScript</dt>
  <dd>Webページに動的な機能を追加するプログラミング言語</dd>
</dl>

---

### 15. 非推奨だが動作するタグ（center, font, u）

**注意**: これらのタグは非推奨ですが、GitHubでは一部動作します。

<center>中央寄せ（centerタグ）</center>

<u>下線（uタグ）</u>

---

### 16. 挿入・削除（ins / del / s）

**挿入（ins）**:
- <ins>新しく追加されたテキスト</ins>

**削除（del）**:
- <del>削除されたテキスト</del>

**取り消し線（s）**:
- <s>間違った情報</s>

**組み合わせ**:
- 価格: <del>10,000円</del> <ins>8,000円</ins>（セール中）

---

## ⚠️ 危険なHTMLタグ（エスケープして文字列表示）

以下のタグは実行されず、文字列として表示されるべきです：

### scriptタグ

<script>alert('この文字列が表示されるべき')</script>

<script type="text/javascript">console.log('実行されない');</script>

---

### iframeタグ

<iframe src="https://example.com"></iframe>

---

### formタグ

<form action="/submit">
  <input type="text" name="username">
  <button type="submit">送信</button>
</form>

---

### styleタグ

<style>
body { background-color: red; }
</style>

---

### 危険なstyle属性（削除される）

<div style="background: url('javascript:alert(1)')">JavaScript URL in style</div>

<div style="width: expression(alert('XSS'))">IE expression()</div>

<div style="behavior: url(xss.htc)">IE behavior</div>

<div style="@import url('evil.css')">@import</div>

**期待される結果**:
- ✅ 危険なstyle属性は削除される
- ✅ アラートは表示されない
- ✅ divは表示されるが、危険なスタイルは適用されない

---

### イベントハンドラ（削除される）

以下の要素はイベントハンドラが削除されるため、クリック・フォーカスしても何も起こりません：

<div onclick="alert('クリックイベント')">このdivをクリックしても何も起こらない</div>

<img src="invalid.jpg" onerror="alert('onerror')">

<details ontoggle="alert('ontoggle')">
<summary>イベントハンドラ付きdetails</summary>
toggleイベントは発火しない
</details>

---

## 確認事項

### ✅ 基本タグ
- [ ] 見出し（h1-h6）がHTMLタグで正しく表示される
- [ ] 段落（p）とテキストが表示される
- [ ] 水平線（hr）が表示される
- [ ] 改行（br）が機能する

### ✅ リンクと画像
- [ ] リンク（a）が正しく機能する
- [ ] 画像（img）が表示される
- [ ] 画像の属性（width, height, align, alt）が機能する

### ✅ テキスト装飾
- [ ] 太字（strong, b）が表示される
- [ ] 斜体（em, i）が表示される
- [ ] 取り消し線（s, del）が表示される
- [ ] 挿入（ins）が表示される
- [ ] 下線（u）が表示される

### ✅ リストとテーブル
- [ ] ul/ol/li が正しく表示される
- [ ] table/thead/tbody/tfoot/tr/th/td が正しく表示される
- [ ] テーブルの属性（align, colspan, border）が機能する

### ✅ 引用とコード
- [ ] blockquote が正しく表示される
- [ ] code（インライン）が表示される
- [ ] pre/code（コードブロック）が表示される

### ✅ 特殊なタグ
- [ ] details/summary が正しく動作する（折りたたみ）
- [ ] kbd がキーボードスタイルで表示される
- [ ] mark がハイライト表示される
- [ ] sub/sup が正しく上付き・下付きで表示される
- [ ] abbr のツールチップ（title属性）が表示される
- [ ] cite が正しく表示される
- [ ] q（引用符）が正しく表示される
- [ ] time が正しく表示される
- [ ] dl/dt/dd（定義リスト）が正しく表示される
- [ ] center が中央寄せで表示される

### ✅ divとspan
- [ ] div（ブロック要素）が表示される
- [ ] span（インライン要素）が表示される
- [ ] 安全なstyle属性（color, background-color等）が適用される

### ✅ タスクリスト
- [ ] input type="checkbox" が表示される
- [ ] checked属性が機能する

### ✅ 危険なタグ（エスケープ表示）
- [ ] script タグが**文字列として表示**される（実行されない）
- [ ] iframe タグが**文字列として表示**される
- [ ] form タグが**文字列として表示**される
- [ ] button タグが**文字列として表示**される
- [ ] style タグが**文字列として表示**される
- [ ] select/textarea タグが**文字列として表示**される
- [ ] アラートは**一切表示されない**

### ✅ イベントハンドラ（削除）
- [ ] onclick などのイベントハンドラが削除される
- [ ] クリック・フォーカスしても何も起こらない
- [ ] details は機能するが ontoggle は無効化される

### ✅ 危険なstyle属性（削除）
- [ ] javascript: を含むstyleが削除される
- [ ] expression() を含むstyleが削除される
- [ ] behavior: を含むstyleが削除される
- [ ] @import を含むstyleが削除される
- [ ] divは表示されるが、危険なスタイルは適用されない
