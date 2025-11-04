# Content Security Policy (CSP) テスト

このファイルは、CSPが正しく動作しているかをテストします。

---

## CSP設定内容

```
default-src 'self';
img-src 'self' data: file:;
style-src 'self' 'unsafe-inline';
script-src 'none';
```

### 各ディレクティブの意味

- **default-src 'self'**: すべてのリソースは拡張機能内からのみ
- **img-src 'self' data: file:**: 画像は拡張機能内 + data:スキーム + file:プロトコル
- **style-src 'self' 'unsafe-inline'**: CSSは拡張機能内 + インラインスタイル
- **script-src 'none'**: すべてのJavaScript実行を禁止

---

## テスト1: 外部スクリプト読み込み（ブロックされるべき）

DOMPurifyで削除されますが、CSPも二重防御として機能します。

### 攻撃コード

```html
<script src="https://evil.com/malware.js"></script>
```

実際の攻撃: <script src="https://evil.com/malware.js"></script>

**期待される結果**:
- ✅ DOMPurifyで`<script>`タグが削除される
- ✅ 仮に通過しても、CSPの`script-src 'none'`でブロック
- ✅ F12のConsoleに「CSP violation」エラーは**表示されない**（DOMPurifyで事前削除されるため）

---

## テスト2: インラインスクリプト（ブロックされるべき）

### 攻撃コード

```html
<img src="x" onerror="alert('inline-script-attack')">
```

実際の攻撃: <img src="x" onerror="alert('inline-script-attack')">

**期待される結果**:
- ✅ DOMPurifyで`onerror`属性が削除される
- ✅ 画像は表示されるが、スクリプトは実行されない
- ✅ アラートが表示されない

---

## テスト3: 外部画像読み込み（ブロックされるべき）

### 外部URLの画像

```markdown
![External Image](https://httpbin.org/image/png)
```

実際のテスト:

![External Image](https://httpbin.org/image/png)

**期待される結果**:
- ❌ 画像が**表示されない**（CSPの`img-src`が外部URLを禁止）
- ✅ F12のConsoleに以下のようなエラーが表示される:
  ```
  Refused to load the image 'https://httpbin.org/image/png' because it violates the following Content Security Policy directive: "img-src 'self' data: file:"
  ```

---

## テスト4: data:スキームの画像（表示されるべき）

### data:URLの画像（小さな赤い四角）

```markdown
![Data URL Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==)
```

実際のテスト:

![Data URL Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==)

**期待される結果**:
- ✅ 小さな赤い四角が**表示される**
- ✅ CSPの`img-src data:`により許可される
- ✅ エラーが表示されない

---

## テスト5: インラインスタイル（許可されるべき）

### インラインスタイルのテスト

<div style="background-color: #f0f8ff; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; text-align: center;">
  <strong style="color: #2196F3; font-size: 20px;">このボックスは青い枠とスタイルが適用されているはずです</strong>
</div>

**期待される結果**:
- ✅ スタイルが**正しく適用**される
- ✅ CSPの`style-src 'unsafe-inline'`により許可
- ✅ 背景色、枠線、パディングなどが表示される

---

## テスト6: 外部リンク（機能するべき）

### 外部サイトへのリンク

[Googleへのリンク](https://www.google.com)

**期待される結果**:
- ✅ リンクは**クリック可能**
- ✅ クリックすると新しいタブでGoogleが開く
- ⚠️ ただし、これはプライバシーリスクになる可能性がある

---

## テスト7: javascript:スキーム（ブロックされるべき）

### javascript:スキームのリンク

```markdown
[危険なリンク](javascript:alert('javascript-scheme-attack'))
```

実際のテスト:

[危険なリンク](javascript:alert('javascript-scheme-attack'))

**期待される結果**:
- ✅ DOMPurifyで`javascript:`スキームが削除される
- ✅ リンクは表示されるが、`href`属性がない
- ✅ クリックしても何も起こらない

---

## テスト結果の確認方法

### 1. F12でデベロッパーツールを開く

### 2. Consoleタブを確認

以下のようなCSP違反エラーが表示されるか確認：

```
Refused to load the image 'https://httpbin.org/image/png'
because it violates the following Content Security Policy directive:
"img-src 'self' data: file:"
```

### 3. Elementsタブを確認

`<head>`セクションに以下のmetaタグがあることを確認：

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' data: file:; style-src 'self' 'unsafe-inline'; script-src 'none';">
```

---

## 期待される総合結果

| テスト項目 | 期待される結果 | 重要度 |
|-----------|---------------|--------|
| 外部スクリプト | ❌ ブロック（DOMPurify） | 🔴 高 |
| インラインスクリプト | ❌ ブロック（DOMPurify） | 🔴 高 |
| 外部画像 | ❌ ブロック（CSP） | 🟡 中 |
| data:画像 | ✅ 表示 | 🟢 低 |
| インラインスタイル | ✅ 適用 | 🟢 低 |
| 外部リンク | ✅ 機能（要注意） | 🟡 中 |
| javascript:リンク | ❌ ブロック（DOMPurify） | 🔴 高 |

---

## セキュリティレイヤー

このMarkdownプレビューアーには**3層のセキュリティ対策**があります：

1. **DOMPurify（第1層）**: 危険なHTML/JavaScriptを削除
2. **HTMLエスケープ（第2層）**: ファイル名とTOCのエスケープ
3. **CSP（第3層）**: 万が一の漏れをブラウザレベルでブロック

これにより、**深層防御（Defense in Depth）** が実現されています。
