# KaTeX セキュリティテスト

このファイルはKaTeX数式レンダリング機能のセキュリティをテストします。

**重要**: このページを開いても、アラートやスクリプトが実行されないことを確認してください。

## テストケース1: 数式ブロック内のスクリプトタグ

以下の数式ブロックにはスクリプトタグが含まれていますが、実行されてはいけません：

$$
<script>alert('XSS Attack 1')</script>
x^2 + y^2 = z^2
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## テストケース2: 数式ブロック内のimg onerror

$$
<img src=x onerror=alert('XSS Attack 2')>
\int_{0}^{1} x^2 dx
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## テストケース3: 数式ブロック内のiframe

$$
<iframe src="javascript:alert('XSS Attack 3')"></iframe>
\sum_{n=1}^{\infty} \frac{1}{n^2}
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## テストケース4: インライン数式内のスクリプト

これは $<script>alert('XSS Attack 4')</script> x^2$ のテストです。

**期待結果**: アラートが表示されず、インライン数式が正しくレンダリングされる

## テストケース5: 数式ブロック内のsvg

$$
<svg onload=alert('XSS Attack 5')>
f(x) = x^3 - 3x + 1
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## テストケース6: 数式ブロック内のHTML実体参照

$$
&lt;script&gt;alert('XSS Attack 6')&lt;/script&gt;
y = mx + b
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## テストケース7: 複数の数式ブロック

$$
<script>alert('XSS Attack 7a')</script>
E = mc^2
$$

通常のテキスト

$$
<img src=x onerror=alert('XSS Attack 7b')>
a^2 + b^2 = c^2
$$

**期待結果**: どのアラートも表示されず、両方の数式が正しくレンダリングされる

## テストケース8: LaTeX形式のディスプレイ数式

\[
<script>alert('XSS Attack 8')</script>
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
\]

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## テストケース9: LaTeX形式のインライン数式

これは \(<script>alert('XSS Attack 9')</script> \alpha + \beta\) のテストです。

**期待結果**: アラートが表示されず、インライン数式が正しくレンダリングされる

## テストケース10: onloadイベント付きのdiv

$$
<div onload=alert('XSS Attack 10')>
\lim_{x \to \infty} \frac{1}{x} = 0
</div>
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

## 確認事項

このページを開いた際に：

✅ **いかなるアラートも表示されないこと**
✅ 数式が正しくレンダリングされていること
✅ コンソールにエラーが出ていないこと（一部のKaTeXパースエラーは許容）

もしアラートが表示された場合、XSS脆弱性が存在します。直ちに報告してください。

## 正常な数式の例

以下は正常な数式の例です（セキュリティテストではありません）：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

インライン数式: $E = mc^2$

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
