# Mermaid ダイアグラムテスト

このファイルは、Local Markdown ViewerのMermaid対応をテストするためのものです。

## 目次

1. [フローチャート](#フローチャート)
2. [シーケンス図](#シーケンス図)
3. [クラス図](#クラス図)
4. [状態遷移図](#状態遷移図)
5. [ER図](#er図)
6. [ガントチャート](#ガントチャート)
7. [円グラフ](#円グラフ)
8. [通常のコードブロック](#通常のコードブロック)

---

## フローチャート

### 基本的なフローチャート

```mermaid
graph TD
    A[開始] --> B{条件判定}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E
```

### より複雑なフローチャート

```mermaid
flowchart LR
    A[ユーザー] --> B[ログイン画面]
    B --> C{認証}
    C -->|成功| D[ダッシュボード]
    C -->|失敗| E[エラーメッセージ]
    E --> B
    D --> F[データ表示]
    D --> G[設定]
    D --> H[ログアウト]
    H --> B
```

---

## シーケンス図

### ユーザー認証のシーケンス図

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant C as クライアント
    participant S as サーバー
    participant DB as データベース

    U->>C: ログイン情報入力
    C->>S: 認証リクエスト
    S->>DB: ユーザー情報検索
    DB-->>S: ユーザーデータ
    S->>S: パスワード検証
    alt 認証成功
        S-->>C: トークン発行
        C-->>U: ダッシュボード表示
    else 認証失敗
        S-->>C: エラーレスポンス
        C-->>U: エラーメッセージ表示
    end
```

### API呼び出しのシーケンス

```mermaid
sequenceDiagram
    autonumber
    Alice->>John: こんにちは John、元気ですか？
    loop ヘルスチェック
        John->>John: 自分の健康状態を確認
    end
    Note right of John: 理性的な思考
    John-->>Alice: 元気だよ！
    John->>Bob: お前はどうだ？
    Bob-->>John: 絶好調！
```

---

## クラス図

### オブジェクト指向設計

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +eat()
    }

    class Dog {
        +String breed
        +bark()
        +fetch()
    }

    class Cat {
        +String color
        +meow()
        +scratch()
    }

    Animal <|-- Dog
    Animal <|-- Cat

    class Owner {
        +String name
        +adopt(Animal)
    }

    Owner "1" --> "*" Animal : owns
```

---

## 状態遷移図

### 注文プロセスの状態遷移

```mermaid
stateDiagram-v2
    [*] --> 新規注文
    新規注文 --> 支払い待ち: 注文確定
    支払い待ち --> 処理中: 支払い完了
    支払い待ち --> キャンセル: タイムアウト
    処理中 --> 発送済み: 発送
    発送済み --> 配達完了: 配達
    配達完了 --> [*]
    キャンセル --> [*]

    処理中 --> キャンセル: ユーザーキャンセル
```

---

## ER図

### データベース設計

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int user_id PK
        string name
        string email
        datetime created_at
    }

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int order_id PK
        int user_id FK
        datetime order_date
        string status
        decimal total_amount
    }

    ORDER_ITEM }o--|| PRODUCT : references
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }

    PRODUCT {
        int product_id PK
        string name
        string description
        decimal price
        int stock
    }
```

---

## ガントチャート

### プロジェクトスケジュール

```mermaid
gantt
    title Webアプリケーション開発スケジュール
    dateFormat  YYYY-MM-DD

    section 企画・設計
    要件定義           :done,    req, 2024-01-01, 2024-01-15
    基本設計           :done,    design, 2024-01-16, 2024-02-05
    詳細設計           :active,  detail, 2024-02-06, 2024-02-20

    section 開発
    フロントエンド開発 :         front, 2024-02-21, 30d
    バックエンド開発   :         back, 2024-02-21, 35d
    API実装            :         api, 2024-03-01, 25d

    section テスト
    単体テスト         :         unit, 2024-03-21, 10d
    結合テスト         :         integration, 2024-03-26, 10d
    総合テスト         :         system, 2024-04-01, 7d

    section リリース
    本番環境構築       :         setup, 2024-04-05, 3d
    リリース           :milestone, release, 2024-04-08, 1d
```

---

## 円グラフ

### プログラミング言語の使用率

```mermaid
pie title プロジェクトで使用している言語
    "JavaScript" : 42.5
    "Python" : 25.3
    "Java" : 15.7
    "Go" : 10.2
    "その他" : 6.3
```

---

## Git グラフ

### ブランチ戦略

```mermaid
gitGraph
    commit id: "初期コミット"
    commit id: "基本機能実装"
    branch develop
    checkout develop
    commit id: "開発環境構築"
    branch feature/login
    checkout feature/login
    commit id: "ログイン画面作成"
    commit id: "認証機能実装"
    checkout develop
    merge feature/login
    branch feature/dashboard
    checkout feature/dashboard
    commit id: "ダッシュボード作成"
    checkout develop
    merge feature/dashboard
    checkout main
    merge develop tag: "v1.0.0"
    checkout develop
    commit id: "次バージョン開発開始"
```

---

## 通常のコードブロック

Mermaid以外の通常のコードブロックも正しく表示されることを確認：

### JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

### Python

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

print(quick_sort([3, 6, 8, 10, 1, 2, 1]))
```

---

## テスト結果チェックリスト

以下の項目を確認してください：

- [ ] すべてのMermaidダイアグラムが正しく描画される
- [ ] ダイアグラムが中央揃えで表示される
- [ ] ライトモードで背景が白色
- [ ] ダークモードで背景がダークグレー
- [ ] ダークモード切り替え時にページがリロードされる
- [ ] ダークモードでダイアグラムのテーマが変わる
- [ ] 通常のコードブロック（JavaScript、Python）も正しく表示される
- [ ] 通常のコードブロックのシンタックスハイライトが機能する
- [ ] 目次から各セクションへジャンプできる
- [ ] ページがスムーズにスクロールする

---

## 追加テスト: 複数のダイアグラムの混在

### フローチャート + テキスト + シーケンス図

まずはフローチャート：

```mermaid
graph LR
    A[入力] --> B[処理]
    B --> C[出力]
```

中間にテキストや**太字**、*イタリック*、`コード`などを含めます。

次にシーケンス図：

```mermaid
sequenceDiagram
    A->>B: メッセージ1
    B->>C: メッセージ2
    C-->>A: レスポンス
```

最後に通常のコードブロック：

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Mermaid!")
}
```

すべてが正しく表示されることを確認してください！
