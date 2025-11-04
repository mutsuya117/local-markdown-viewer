# 見出しXSS攻撃テスト

このファイルは、目次（TOC）生成時の見出しテキストのエスケープが正しく動作するかをテストします。

---

# <script>alert('heading-xss-1')</script>

上の見出しには`<script>`タグが含まれています。DOMPurifyによって本文からは削除されますが、TOC生成時に`textContent`で取得したテキストを再度HTMLに埋め込む際にエスケープ漏れが発生する可能性がありました。

---

## <img src="x" onerror="alert('heading-xss-2')">

この見出しには`<img>`タグと`onerror`属性が含まれています。

---

### <a href="javascript:alert('heading-xss-3')">危険なリンク</a>

この見出しには`javascript:`スキームのリンクが含まれています。

---

#### "onclick="alert('heading-xss-4')"

この見出しにはダブルクォートとイベントハンドラが含まれています。

---

##### '</a><script>alert('heading-xss-5')</script><a href='

この見出しには、HTML構造を壊そうとする攻撃コードが含まれています。

---

###### <style>body{display:none}</style>

この見出しには`<style>`タグが含まれています。

---

## テスト対象の脆弱性

### 修正前のコード

```javascript
// 脆弱なコード
const text = heading.textContent;
const id = heading.id;
tocHtml += `<li><a href="#${id}">${text}</a></li>`;
```

**問題点**：
1. DOMPurifyでサニタイズされたHTML → DOM要素
2. `textContent`でテキストを取得（この時点でHTMLタグは除去済み）
3. **しかし**、テキストを再度HTML文字列に埋め込む際にエスケープしていない

### 攻撃シナリオ

見出しが以下の場合：
```markdown
# <script>alert('XSS')</script>
```

1. DOMPurifyで処理 → `<h1></h1>` (scriptタグ削除)
2. `textContent`取得 → `""` (空文字)
3. TOCに埋め込み → 問題なし

**ただし**、以下のケースで問題が発生する可能性：

```markdown
# test</a><script>alert('XSS')</script><a>
```

1. DOMPurifyで処理 → `<h1>test<a></a></h1>` (scriptタグ削除、aタグは許可)
2. `textContent`取得 → `"test</a><script>alert('XSS')</script><a>"`
3. TOC埋め込み（エスケープなし） → **XSS脆弱性！**

```html
<li><a href="#heading-0">test</a><script>alert('XSS')</script><a></a></li>
```

## 修正内容

### 安全なコード（修正後）

```javascript
// XSS対策: テキストとIDをエスケープ
const text = heading.textContent;
const id = heading.id;
tocHtml += `<li><a href="#${escapeHtml(id)}">${escapeHtml(text)}</a></li>`;
```

**escapeHtml関数**:
```javascript
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
```

## テスト方法

1. このファイルをChromeで開く
2. ページ上部の「目次」を確認
3. F12でデベロッパーツールを開く
4. Elementsタブで目次のHTML構造を確認
5. アラートが表示されないことを確認

## 期待される結果

✅ 目次内の見出しテキストがすべてエスケープされている
✅ アラートは**一切表示されない**
✅ 目次のリンクをクリックしても、該当する見出しに正しくジャンプする
✅ ページのHTML構造が壊れていない

## 確認ポイント

デベロッパーツールのElementsタブで、目次部分のHTMLを確認してください：

```html
<!-- 正しくエスケープされている例 -->
<nav class="toc">
  <h2 class="toc-title">目次</h2>
  <ul class="toc-list">
    <li><a href="#heading-0">&lt;script&gt;alert('heading-xss-1')&lt;/script&gt;</a></li>
    <li><a href="#heading-1">&lt;img src="x" onerror="alert('heading-xss-2')"&gt;</a></li>
    <!-- ... -->
  </ul>
</nav>
```

もし `<script>` や `onerror` がそのまま表示されている場合は、エスケープ漏れがあります！
