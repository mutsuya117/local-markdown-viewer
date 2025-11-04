# ファイル名XSS攻撃テスト

## 注意事項

Windowsではファイル名に `<`, `>`, `:`, `"` などの特殊文字を使用できないため、このテストファイルは通常のファイル名で保存されています。

## テスト対象の脆弱性

ファイル名に以下のような攻撃コードが含まれている場合：

```
test</title><script>alert('filename-xss')</script><title>.md
```

**修正前**のコードでは、このファイル名がエスケープされずにHTMLの`<title>`タグに直接挿入されていました。

### 脆弱なコード（修正前）

```javascript
<title>${path.split('/').pop()} - Markdown Preview</title>
```

これにより、以下のようなHTMLが生成されていました：

```html
<title>test</title><script>alert('filename-xss')</script><title>.md - Markdown Preview</title>
```

結果：titleタグが途中で閉じられ、scriptタグが実行される！

## 修正内容

### 安全なコード（修正後）

```javascript
<title>${escapeHtml(path.split('/').pop())} - Markdown Preview</title>
```

escapeHtml関数により、特殊文字がHTMLエンティティに変換されます：

```javascript
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

### 変換例

| 元の文字列 | エスケープ後 |
|-----------|-------------|
| `<script>` | `&lt;script&gt;` |
| `</title>` | `&lt;/title&gt;` |
| `"attack"` | `&quot;attack&quot;` |

## テスト方法

1. このファイルをChromeで開く
2. F12でデベロッパーツールを開く
3. Elementsタブで`<title>`タグを確認
4. ファイル名が正しくエスケープされていることを確認

## 期待される結果

✅ ブラウザのタブタイトルに正常なファイル名が表示される
✅ HTMLソースでファイル名が正しくエスケープされている
✅ アラートは表示されない
