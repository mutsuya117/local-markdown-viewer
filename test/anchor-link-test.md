# アンカーリンクテスト

このファイルは、別のファイルをアンカー付きリンク（`ファイル.md#id`）で開いたときに、ページの書き換え後にそのアンカーの位置へ移動することを確認するテストです。

移動先は [anchor-link-target.md](anchor-link-target.md) にあります。移動先の上部には Mermaid ダイアグラムと KaTeX の数式があり、描画後に位置がずれる場合も確認できます。

---

## ✅ テストケース

### 1. 明示的なアンカー（`<a id="...">`）

- [anchor-link-target.md の明示的なアンカーへ](anchor-link-target.md#explicit-anchor)

**期待される結果**: 「明示的なアンカー」の段落が画面の上端に表示される

### 2. 見出しのID

- [anchor-link-target.md の見出し「Target heading」へ](anchor-link-target.md#target-heading)

**期待される結果**: 見出し「Target heading」が画面の上端に表示される

### 3. 日本語の見出し（パーセントエンコードされたアンカー）

- [anchor-link-target.md の見出し「日本語の見出し」へ](anchor-link-target.md#日本語の見出し)

**期待される結果**: 見出し「日本語の見出し」が画面の上端に表示される

### 4. 存在しないアンカー

- [anchor-link-target.md の存在しないアンカーへ](anchor-link-target.md#no-such-anchor)

**期待される結果**: ページの先頭が表示され、F12コンソールにエラーが出ない

### 5. 同じファイル内のアンカー（従来の動作）

- [このファイルの末尾へ](#same-file-target)

**期待される結果**: 下の「同じファイル内の移動先」が画面の上端に表示される

### 6. 手動スクロールの優先

1. テストケース1のリンクをクリックする
2. ページが表示されたら、すぐにマウスホイールでスクロールする

**期待される結果**: KaTeX・Mermaidの描画後に、アンカーの位置へ引き戻されない

---

<a id="same-file-target"></a>

## 同じファイル内の移動先

テストケース5のリンクで、ここに移動します。
