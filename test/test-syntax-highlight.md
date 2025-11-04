# シンタックスハイライトテスト

このファイルは、シンタックスハイライトが正しく動作するかをテストします。

---

## JavaScript

```javascript
function hello(name) {
  console.log(`Hello, ${name}!`);
  return name.toUpperCase();
}

const result = hello("World");
```

---

## Python

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

---

## C++

```cpp
#include <iostream>
#include <string>

class HelloWorld {
public:
    void sayHello(const std::string& name) {
        std::cout << "Hello, " << name << "!" << std::endl;
    }
};

int main() {
    HelloWorld hw;
    hw.sayHello("World");
    return 0;
}
```

---

## HTML

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>テストページ</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p class="message">これはテストです。</p>
</body>
</html>
```

---

## CSS

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background-color: #0969da;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
}

.button:hover {
  background-color: #0550ae;
}
```

---

## JSON

```json
{
  "name": "Local Markdown Viewer",
  "version": "1.0.0",
  "description": "Markdown viewer for local files",
  "dependencies": {
    "marked": "^12.0.0",
    "highlight.js": "^11.9.0",
    "dompurify": "^3.0.8"
  }
}
```

---

## 言語指定なし（自動検出）

```
function test() {
  return "言語指定なし";
}
```

---

## 期待される結果

各コードブロックで以下が確認できるはずです：

1. ✅ **キーワードが色付けされている**
   - `function`, `class`, `if`, `return` などが青色
   - 文字列が赤/緑色
   - コメントがグレー色

2. ✅ **背景色が薄いグレー**（#f6f8fa）

3. ✅ **フォントが等幅フォント**（monospace）

4. ✅ **行が読みやすい**（適切な行間）

## トラブルシューティング

### シンタックスハイライトが表示されない場合

1. **F12でデベロッパーツールを開く**
2. **Consoleタブでエラーを確認**
3. **Elementsタブでコードブロックを確認**
   - `<code class="language-javascript hljs">`のようにclass属性があるか
   - `<span class="hljs-keyword">`などのspan要素があるか

### 正常に動作している場合の例

```html
<pre><code class="language-javascript hljs">
  <span class="hljs-keyword">function</span>
  <span class="hljs-title function_">hello</span>
  (<span class="hljs-params">name</span>) {
    ...
  }
</code></pre>
```

もしこのような`<span>`要素がない場合は、highlight.jsが動作していません。
