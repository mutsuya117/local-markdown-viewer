# KaTeX $記号 誤検知テスト

このファイルは、KaTeX数式レンダリングにおける$記号の誤検知を防ぐためのテストケースを含みます。

## 1. 通常文章中の$記号（誤検知されるべきでないケース）

### 価格表示
- This product costs $100.
- I paid $50 for this book.
- The total is $1,234.56.
- 価格は$99です。

### スペースなし$記号（outerSpaceテスト）
- $100は高い
- I have $50
- The price is $30
- $variableという変数名

### 連続する$記号
- I have $10 and you have $20.
- $100 + $200 = $300

## 2. コードブロック内の$記号（誤検知されるべきでないケース）

### JavaScriptのテンプレートリテラル
```javascript
const message = `Hello, ${name}!`;
const price = `Total: $${amount}`;
const calculation = `Result: ${x + y}`;
```

### Bashスクリプト
```bash
echo "Price: $100"
PRICE=$100
export PATH=$PATH:/usr/local/bin
```

### jQuery
```javascript
$('#element').click(function() {
  $(this).addClass('active');
});
```

## 3. インラインコード内の$記号（誤検知されるべきでないケース）

- JavaScript変数： `${variable}`
- Bash変数： `$HOME`
- jQuery： `$('#id')`
- 価格： `$100`

## 4. 正しい数式表記（正しくレンダリングされるべきケース）

### インライン数式（$...$）
- スペースなし: $x=1$
- スペースなし: $y=2x+3$
- スペースなし: $\alpha + \beta = \gamma$

### スペースあり数式（outerSpaceテスト）
- スペースあり: $ x = 1 $
- スペースあり: $ y = 2x + 3 $
- スペースあり: $ \alpha + \beta = \gamma $

### ディスプレイ数式（$$...$$）
$$
E = mc^2
$$

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### LaTeX形式の数式
インライン: \(x^2 + y^2 = z^2\)

ディスプレイ:
\[
\sum_{i=1}^n i = \frac{n(n+1)}{2}
\]

## 5. エスケープされた$記号（そのまま表示されるべきケース）

- エスケープ: \$100
- エスケープ2つ: \$50 + \$30 = \$80

## 6. 複雑なケース

### 文章と数式の混在
The price is $100, but the equation $x = 100$ is different.

価格は$50で、数式は$y = 50$です。

### コードと数式の混在
JavaScriptコード `${variable}` と数式 $x + y = z$ は異なります。

## 7. HTMLタグを使った回避（GitHubスタイル）

- HTMLタグ: <span>$</span>100
- HTMLタグ2: <span>$</span>50 + <span>$</span>30

## 期待される結果

### ✅ 正しくレンダリングされるべき
- セクション4の全ての数式
- LaTeX形式の数式（\(...\)と\[...\]）

### ❌ 数式としてレンダリングされるべきでない
- セクション1の価格表示
- セクション2のコードブロック内
- セクション3のインラインコード内
- セクション5のエスケープされた$記号
- セクション7のHTMLタグで囲まれた$記号

### 🔍 outerSpaceロジック検証
- スペースなし（セクション1）→ 数式として認識されない
- スペースあり（セクション4）→ 数式として認識される

## 追加テストケース

### エッジケース
- 単独の$記号: $
- 2つの$が離れている: $ と $
- 3つの$記号: $ $ $
- 空の数式: $$

### 日本語との組み合わせ
- これは$100です。
- $x=1$という式があります。
- 価格$100と数式$y=2$の違い
