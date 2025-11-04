# ローカル画像表示テスト

このファイルは、ローカルファイルの画像が正しく表示されるかをテストします。

---

## テスト1: 相対パス（親フォルダのiconsフォルダ）

### 16x16の画像

![16x16アイコン](../icons/icon16.png)

### 32x32の画像

![32x32アイコン](../icons/icon32.png)

### 48x48の画像

![48x48アイコン](../icons/icon48.png)

### 128x128の画像

![128x128アイコン](../icons/icon128.png)

---

## テスト2: すべての画像を並べて表示

| サイズ | 画像 | 説明 |
|--------|------|------|
| 16x16 | ![](../icons/icon16.png) | 最小サイズ |
| 32x32 | ![](../icons/icon32.png) | ツールバー用 |
| 48x48 | ![](../icons/icon48.png) | 拡張機能管理ページ用 |
| 128x128 | ![](../icons/icon128.png) | Chrome Web Store用 |

---

## テスト3: 画像とテキストの組み合わせ

アイコン ![](../icons/icon16.png) を文中に含めることもできます。

複数のアイコン: ![](../icons/icon16.png) ![](../icons/icon16.png) ![](../icons/icon16.png)

---

## テスト4: リストと画像

### 番号なしリスト

- ![](../icons/icon16.png) 16pxアイコン
- ![](../icons/icon32.png) 32pxアイコン
- ![](../icons/icon48.png) 48pxアイコン

### 番号付きリスト

1. ![](../icons/icon16.png) 最初のアイコン
2. ![](../icons/icon32.png) 2番目のアイコン
3. ![](../icons/icon48.png) 3番目のアイコン

---

## テスト5: リンク付き画像

クリック可能な画像（内部リンク）:

[![クリックして上に戻る](../icons/icon48.png)](#ローカル画像表示テスト)

---

## テスト6: alt属性のテスト

画像が見つからない場合のalt属性表示:

![存在しない画像ファイル](../icons/not-found.png)

---

## 期待される結果

### 正常に表示される画像

- ✅ `../icons/icon16.png` → 16x16のMDアイコンが表示
- ✅ `../icons/icon32.png` → 32x32のMDアイコンが表示
- ✅ `../icons/icon48.png` → 48x48のMDアイコンが表示
- ✅ `../icons/icon128.png` → 128x128のMDアイコンが表示

### 画像の属性

F12でElementsタブを確認：

```html
<img src="../icons/icon16.png" alt="16x16アイコン">
```

- ✅ `src`属性が相対パスのまま
- ✅ ブラウザが自動的に絶対パスに変換（`file:///C:/...`）
- ✅ 画像が読み込まれる

### 画像の読み込み

- ✅ 外部URL（`https://...`）の画像は表示される
- ✅ ローカルパス（`./`, `../`, `file://`）の画像は表示される

---

## デバッグ確認

### F12 Consoleで確認

```javascript
// すべてのimg要素を確認
document.querySelectorAll('.markdown-body img').forEach((img, i) => {
  console.log(`${i}: src="${img.src}" alt="${img.alt}"`);
});
```

### Networkタブで確認

1. F12を開く
2. Networkタブを選択
3. ページをリロード（Ctrl+R）
4. PNG画像のリクエストを確認
   - ✅ `icon16.png`, `icon32.png`などが成功（200 OK）
   - ❌ 外部URLは失敗またはブロック

---

## トラブルシューティング

### 画像が表示されない場合

1. **ファイルパスを確認**
   - Markdownファイルと画像ファイルの相対位置
   - 大文字・小文字の区別（Windowsは区別しないが、他OSは区別）

2. **ファイルの存在を確認**
   ```bash
   ls -la tmp/local-markdown-viewer/icons/
   ```

3. **F12 Networkタブでエラーを確認**
   - 404エラー → ファイルが見つからない
   - CSP違反 → セキュリティポリシーでブロック

### 相対パスの書き方

```markdown
✅ ../icons/icon.png     （親フォルダのiconsフォルダ）← testフォルダから見た場合
✅ ./icons/icon.png      （同じフォルダのiconsサブフォルダ）
✅ icons/icon.png        （./と同じ）
❌ /icons/icon.png       （ルートから、通常は動作しない）
```

---

## セキュリティ確認

このテストにより、以下の画像表示動作も確認できます：

- ✅ ローカル画像（`file://`, `./`, `../`）は表示される
- ✅ 外部画像（`https://`）は表示される
- ✅ data:URLの画像は表示される

これにより、ローカル画像と外部画像の両方が正常に表示できることが確認できます。
