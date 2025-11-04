# KaTeX数式レンダリングテスト

このファイルはLocal Markdown ViewerのKaTeX数式レンダリング機能とセキュリティをテストします。

**注意**: 右上の「TeX」ボタンでKaTeX機能のON/OFFを切り替えられます。このテストでは「TeX: ON」にしてください。

---

## 1. インライン数式テスト

### ドル記号形式 (`$...$`)

これは$E = mc^2$のアインシュタインの方程式です。

円の面積は$A = \pi r^2$で計算できます。

二次方程式の解の公式: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

### 括弧形式 (`\(...\)`)

これは\(a^2 + b^2 = c^2\)のピタゴラスの定理です。

極限の定義: \(\lim_{x \to \infty} \frac{1}{x} = 0\)

---

## 2. ディスプレイ数式テスト

### ドル記号形式 (`$$...$$`)

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

### 括弧形式 (`\[...\]`)

\[
f(x) = \begin{cases}
x^2 & \text{if } x \geq 0 \\
-x^2 & \text{if } x < 0
\end{cases}
\]

---

## 3. 基本的な数式要素

### 分数

インライン: $\frac{1}{2}$, $\frac{a+b}{c+d}$

ディスプレイ:
$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

### 累乗と添字

$x^2$, $x^{n+1}$, $x_1$, $x_{i,j}$, $x_i^2$

$$
e^{i\pi} + 1 = 0
$$

### 根号

$\sqrt{2}$, $\sqrt[3]{8}$, $\sqrt{x^2 + y^2}$

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

---

## 4. ギリシャ文字

### 小文字
$\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\zeta$, $\eta$, $\theta$

$\iota$, $\kappa$, $\lambda$, $\mu$, $\nu$, $\xi$, $\pi$, $\rho$

$\sigma$, $\tau$, $\upsilon$, $\phi$, $\chi$, $\psi$, $\omega$

### 大文字
$\Gamma$, $\Delta$, $\Theta$, $\Lambda$, $\Xi$, $\Pi$, $\Sigma$, $\Phi$, $\Psi$, $\Omega$

---

## 5. 演算子と記号

### 二項演算子
$a + b$, $a - b$, $a \times b$, $a \div b$, $a \pm b$, $a \mp b$

### 関係演算子
$a = b$, $a \neq b$, $a < b$, $a > b$, $a \leq b$, $a \geq b$, $a \approx b$

### 論理記号
$\land$, $\lor$, $\neg$, $\implies$, $\iff$, $\forall$, $\exists$

### 集合記号
$\in$, $\notin$, $\subset$, $\supset$, $\subseteq$, $\supseteq$, $\cup$, $\cap$, $\emptyset$

---

## 6. 微積分

### 微分
$$
\frac{d}{dx}(x^n) = nx^{n-1}
$$

$$
\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0
$$

### 積分
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$

$$
\oint_C \vec{F} \cdot d\vec{r} = \iint_S (\nabla \times \vec{F}) \cdot d\vec{S}
$$

### 総和と総乗
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

$$
\prod_{i=1}^{n} i = n!
$$

---

## 7. 行列とベクトル

### 2×2行列
$$
A = \begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

### 3×3行列
$$
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

### 行列式
$$
\det(A) = \begin{vmatrix}
a & b \\
c & d
\end{vmatrix} = ad - bc
$$

### ベクトル
$$
\vec{v} = \begin{pmatrix}
x \\
y \\
z
\end{pmatrix}
$$

$$
\|\vec{v}\| = \sqrt{x^2 + y^2 + z^2}
$$

---

## 8. 複雑な数式

### フーリエ変換
$$
\mathcal{F}(f)(s) = \int_{-\infty}^{\infty} f(x) e^{-2\pi isx} dx
$$

### テイラー展開
$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$

### オイラーの公式
$$
e^{ix} = \cos(x) + i\sin(x)
$$

### 正規分布
$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

### シュレーディンガー方程式
$$
i\hbar\frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left[-\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r},t)\right]\Psi(\mathbf{r},t)
$$

---

## 9. 場合分け

$$
|x| = \begin{cases}
x & \text{if } x \geq 0 \\
-x & \text{if } x < 0
\end{cases}
$$

$$
f(n) = \begin{cases}
n/2 & \text{if } n \text{ is even} \\
3n+1 & \text{if } n \text{ is odd}
\end{cases}
$$

---

## 10. 連立方程式

$$
\begin{align}
x + y &= 5 \\
2x - y &= 1
\end{align}
$$

マクスウェル方程式：
$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\epsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

---

## 11. テキストと数式の混在

文章の中に$x$や$y$のような変数を含めることができます。

数式の中にテキストを含める: $\text{speed} = \frac{\text{distance}}{\text{time}}$

---

## 12. 特殊記号とアクセント

### 矢印
$\rightarrow$, $\leftarrow$, $\Rightarrow$, $\Leftarrow$, $\leftrightarrow$, $\Leftrightarrow$

### その他
$\infty$, $\partial$, $\nabla$, $\hbar$, $\ell$, $\Re$, $\Im$, $\aleph$

### アクセント記号
$\hat{x}$, $\bar{x}$, $\tilde{x}$, $\vec{x}$, $\dot{x}$, $\ddot{x}$

$$
\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} dx
$$

---

## 13. セキュリティテスト

**重要**: 以下のテストケースで、アラートやスクリプトが実行されないことを確認してください。

### テストケース1: 数式ブロック内のスクリプトタグ

以下の数式ブロックにはスクリプトタグが含まれていますが、実行されてはいけません：

$$
<script>alert('XSS Attack 1')</script>
x^2 + y^2 = z^2
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

### テストケース2: 数式ブロック内のimg onerror

$$
<img src=x onerror=alert('XSS Attack 2')>
\int_{0}^{1} x^2 dx
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

### テストケース3: 数式ブロック内のiframe

$$
<iframe src="javascript:alert('XSS Attack 3')"></iframe>
\sum_{n=1}^{\infty} \frac{1}{n^2}
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

### テストケース4: インライン数式内のスクリプト

これは $<script>alert('XSS Attack 4')</script> x^2$ のテストです。

**期待結果**: アラートが表示されず、インライン数式が正しくレンダリングされる

### テストケース5: 数式ブロック内のsvg

$$
<svg onload=alert('XSS Attack 5')>
f(x) = x^3 - 3x + 1
$$

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

### テストケース6: LaTeX形式のディスプレイ数式

\[
<script>alert('XSS Attack 6')</script>
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
\]

**期待結果**: アラートが表示されず、数式が正しくレンダリングされる

### テストケース7: LaTeX形式のインライン数式

これは \(<script>alert('XSS Attack 7')</script> \alpha + \beta\) のテストです。

**期待結果**: アラートが表示されず、インライン数式が正しくレンダリングされる

---

## 確認事項

このページで以下を確認してください：

### ✅ レンダリング確認
- [ ] インライン数式（$...$と\(...\)形式）が正しく表示される
- [ ] ディスプレイ数式（$$...$$と\[...\]形式）が正しく表示される
- [ ] 基本的な数式要素（分数、累乗、根号）が正しい
- [ ] ギリシャ文字が表示される
- [ ] 各種演算子と記号が表示される
- [ ] 微積分記号が正しい
- [ ] 行列とベクトルが正しく整列している
- [ ] 複雑な数式が読みやすく表示される
- [ ] 場合分けと連立方程式が正しい

### ✅ セキュリティ確認
- [ ] **いかなるアラートも表示されないこと**
- [ ] 数式内のHTMLタグが無害化されていること
- [ ] コンソールにCSPエラーがないこと（一部のKaTeXパースエラーは許容）

もしアラートが表示された場合、XSS脆弱性が存在します。

---

## まとめ

すべてのKaTeX数式が正しくレンダリングされ、セキュリティテストをすべてパスすることで、KaTeX機能が完全に動作していることが確認できます。
