# セキュリティテスト - XSS攻撃サンプル

このファイルは、DOMPurifyがXSS攻撃を正しくブロックするかをテストするためのものです。

## ✅ 安全なコンテンツ（正常に表示される）

これは普通の段落です。

**太字**や*斜体*も表示されます。

- リスト項目1
- リスト項目2

```javascript
// コードブロックも安全
console.log("Hello, World!");
```

### テーブルも表示される

| 列1 | 列2 |
|-----|-----|
| データ1 | データ2 |

---

## ⚠️ 以下は攻撃コード（すべてブロックされるべき）

### 1. script タグによる攻撃

<script>alert('XSS攻撃1: scriptタグ')</script>

<script type="text/javascript">
  alert('XSS攻撃2: type指定');
  document.body.innerHTML = '乗っ取り成功';
</script>

### 2. イベントハンドラによる攻撃

<img src="invalid.jpg" onerror="alert('XSS攻撃3: onerror')">

<img src="x" onload="alert('XSS攻撃4: onload')">

<div onclick="alert('XSS攻撃5: onclick')">このdivをクリックしても何も起こらないはず</div>

<body onload="alert('XSS攻撃6: body onload')">

### 3. javascript: スキーム攻撃

[クリックしてはいけないリンク1](javascript:alert('XSS攻撃7: javascript:'))

<a href="javascript:alert('XSS攻撃8: aタグ')">クリックしてはいけないリンク2</a>

<a href="javascript:void(0)" onclick="alert('XSS攻撃9')">クリックしてはいけないリンク3</a>

### 4. data: スキーム攻撃

<img src="data:text/html,<script>alert('XSS攻撃10: data:スキーム')</script>">

<a href="data:text/html,<script>alert('XSS攻撃11')</script>">data:スキームリンク</a>

### 5. iframe による攻撃

<iframe src="javascript:alert('XSS攻撃12: iframe')"></iframe>

<iframe src="data:text/html,<script>alert('XSS攻撃13')</script>"></iframe>

### 6. object/embed による攻撃

<object data="javascript:alert('XSS攻撃14: object')"></object>

<embed src="javascript:alert('XSS攻撃15: embed')">

### 7. style による攻撃

<style>body { background: url('javascript:alert("XSS攻撃16")') }</style>

<div style="background: url('javascript:alert(\'XSS攻撃17\')')">スタイル攻撃</div>

### 8. SVG による攻撃

<svg onload="alert('XSS攻撃18: SVG onload')"></svg>

<svg><script>alert('XSS攻撃19: SVG script')</script></svg>

### 9. その他の攻撃パターン

<img src="x" onerror="eval(atob('YWxlcnQoJ1hTU+aUu+aSpTIwJyk='))">

<input type="text" onfocus="alert('XSS攻撃21: input onfocus')">

<button onclick="alert('XSS攻撃22: button')">押さないで</button>

<details open ontoggle="alert('XSS攻撃23: details')">
  <summary>開く</summary>
</details>

<marquee onstart="alert('XSS攻撃24: marquee')">動くテキスト</marquee>

---

## 📊 結果確認

もしDOMPurifyが正しく動作していれば：

1. ✅ アラートは**一切表示されない**
2. ✅ 上記の攻撃コードは**すべて無害化**されている
3. ✅ ページは**正常に表示**される
4. ✅ デベロッパーツールのConsoleに**エラーがない**

**アラートが1つでも表示された場合は、セキュリティ脆弱性があります！**
