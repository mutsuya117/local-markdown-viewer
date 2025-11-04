# GitHub Slug生成テスト

このファイルは、GitHubがどのようにスラッグを生成するかをテストします。

---

## テストケース一覧

このファイルをGitHub上で表示し、各見出しの実際のIDを確認してください。

### 日本語の記号テスト

#### ダイアログ・ウィンドウ関連クラス
中黒（・）が含まれる場合

#### スライダー・インタラクティブUI
大文字と中黒の組み合わせ

### スラッシュテスト

#### ScrollView / CCScrollView
スラッシュとスペース

#### AccordionList / AccordionItem
スラッシュを含む英語

### カッコテスト

#### CCBFile (CocosBuilder)
半角カッコ

#### ダイアログ（追加）
全角カッコ

### コロンテスト

#### 注意: 重要事項
半角コロン

#### 備考：参照情報
全角コロン

### その他の記号テスト

#### VBoxLayout / HBoxLayout
複数のスラッシュ

#### MenuParamBar3P
数字を含む

#### CCBCustomNode / CCBCustomNodeRGBA
長い名前とスラッシュ

---

## 確認方法

1. このファイルをGitHubにpushする
2. GitHubでファイルを開く
3. 任意の見出しを右クリック → 「検証」
4. `<h3>`や`<h4>`タグの`id`属性を確認
5. または、見出しのリンクをクリックしてURLのフラグメント（`#...`）を確認

## 期待される結果

以下の変換ルールが正しいか確認：

| 見出し | 予想されるID |
|--------|-------------|
| `ダイアログ・ウィンドウ関連クラス` | `ダイアログウィンドウ関連クラス` または `ダイアログ・ウィンドウ関連クラス` |
| `ScrollView / CCScrollView` | `scrollview--ccscrollview` または `scrollview-ccscrollview` |
| `CCBFile (CocosBuilder)` | `ccbfile-cocosbuilder` |

---

## 実際の結果（記入用）

確認後、以下に実際のIDを記入してください：

- `ダイアログ・ウィンドウ関連クラス` → ID: `___________`
- `スライダー・インタラクティブUI` → ID: `___________`
- `ScrollView / CCScrollView` → ID: `___________`
- `CCBFile (CocosBuilder)` → ID: `___________`
- `ダイアログ（追加）` → ID: `___________`
