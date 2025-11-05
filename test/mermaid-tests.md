# Mermaid ダイアグラムテスト - 色設定パターン網羅版（v11.12.1対応）

このファイルは、Local Markdown ViewerのMermaid対応と色変換機能をテストするためのものです。

## 目次

1. [フローチャート](#フローチャート)
   - デフォルトスタイル（色指定なし）
   - 色設定あり（5色、10色、虹色）
2. [シーケンス図](#シーケンス図)
   - デフォルトスタイル（色指定なし）
   - rect色分けあり
3. [クラス図](#クラス図)
   - デフォルトスタイル（色指定なし）
   - style方式、classDef方式
4. [状態遷移図](#状態遷移図色設定あり)
5. [ガントチャート（done/active/crit）](#ガントチャート)
6. [ER図](#er図)
7. [円グラフ](#円グラフ)
8. [Gitグラフ](#gitグラフ)
9. [色変換テスト用パターン](#色変換テスト用パターン)

---

## フローチャート

### デフォルトスタイル（色指定なし）

```mermaid
graph TD
    A[開始] --> B{条件判定}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E
```

**注**: このフローチャートは色指定なしで、Mermaidのデフォルトテーマカラーが適用されます。

### 基本的なフローチャート（色設定あり）

```mermaid
graph TD
    A[開始] --> B{条件判定}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E

    style A fill:#90EE90,stroke:#333,stroke-width:2
    style B fill:#FFD700,stroke:#333,stroke-width:2
    style C fill:#87CEEB,stroke:#333,stroke-width:2
    style D fill:#FFB6C1,stroke:#333,stroke-width:2
    style E fill:#DDA0DD,stroke:#333,stroke-width:2
```

### 複雑なフローチャート（10色パターン）

```mermaid
flowchart TB
    Start([開始]) --> Input[ユーザー入力]
    Input --> Validate{検証}
    Validate -->|有効| Process[データ処理]
    Validate -->|無効| Error1[エラー表示]
    Error1 --> Input

    Process --> Save{保存}
    Save -->|成功| Success[完了メッセージ]
    Save -->|失敗| Retry{再試行?}
    Retry -->|Yes| Process
    Retry -->|No| Error2[保存失敗]

    Success --> End([終了])
    Error2 --> End

    style Start fill:#98FB98,stroke:#2F4F2F,stroke-width:3
    style Input fill:#ADD8E6,stroke:#00008B,stroke-width:2
    style Validate fill:#FFE4B5,stroke:#8B4513,stroke-width:2
    style Process fill:#E0B0FF,stroke:#4B0082,stroke-width:2
    style Save fill:#FFA07A,stroke:#8B0000,stroke-width:2
    style Success fill:#90EE90,stroke:#006400,stroke-width:3
    style Error1 fill:#FF6B6B,stroke:#8B0000,stroke-width:2
    style Error2 fill:#FF4500,stroke:#8B0000,stroke-width:2
    style Retry fill:#F0E68C,stroke:#8B8B00,stroke-width:2
    style End fill:#DDA0DD,stroke:#8B008B,stroke-width:3
```

### カラフルなワークフロー（虹色パターン + テキスト色）

```mermaid
graph LR
    A[赤系] --> B[オレンジ系]
    B --> C[黄色系]
    C --> D[緑系]
    D --> E[青系]
    E --> F[紫系]
    F --> G[ピンク系]

    style A fill:#FF6B6B,stroke:#8B0000,stroke-width:2,color:#fff
    style B fill:#FFA500,stroke:#8B4500,stroke-width:2,color:#fff
    style C fill:#FFD700,stroke:#8B7500,stroke-width:2
    style D fill:#90EE90,stroke:#006400,stroke-width:2
    style E fill:#4169E1,stroke:#00008B,stroke-width:2,color:#fff
    style F fill:#9370DB,stroke:#4B0082,stroke-width:2,color:#fff
    style G fill:#FFB6C1,stroke:#8B3A62,stroke-width:2
```

---

## シーケンス図

### デフォルトスタイル（色指定なし）

```mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    participant C as Server

    A->>B: メッセージ送信
    B->>C: サーバーに転送
    C-->>B: 応答
    B-->>A: 受信確認

    Note over A,B: 通信完了

    alt 成功
        C->>B: データ送信
        B->>A: データ配信
    else 失敗
        C->>B: エラー通知
        B->>A: エラー表示
    end

    loop 定期チェック
        A->>C: ステータス確認
        C-->>A: OK
    end
```

**注**: このシーケンス図は色指定なしで、Mermaidのデフォルトカラーが適用されます。

### カラフルなシーケンス図（rect色分け）

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant C as クライアント
    participant API as API Gateway
    participant Auth as 認証サービス
    participant DB as データベース

    rect rgb(230, 255, 230)
    Note over U,C: ログインフロー（緑系）
    U->>C: ログイン情報入力
    C->>API: 認証リクエスト
    end

    rect rgb(255, 245, 230)
    Note over API,Auth: 認証処理（オレンジ系）
    API->>Auth: 認証要求
    Auth->>DB: ユーザー検索
    DB-->>Auth: ユーザーデータ
    end

    rect rgb(230, 230, 255)
    Note over Auth,C: 結果返却（青系）
    Auth-->>API: トークン生成
    API-->>C: 認証成功
    C-->>U: ダッシュボード表示
    end
```

### 条件分岐のあるシーケンス図（複数rect）

```mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    participant C as Charlie

    A->>B: こんにちは！

    rect rgb(255, 200, 200)
    Note right of B: エラーケース（赤系）
    alt エラー発生
        B->>C: ヘルプ要請
        C-->>B: サポート提供
    else 正常処理
        B-->>A: こんにちは！
    end
    end

    rect rgb(200, 255, 200)
    Note over A,C: 成功ケース（緑系）
    loop 3回繰り返し
        A->>B: データ送信
        B->>C: データ転送
        C-->>A: 確認
    end
    end

    rect rgb(200, 200, 255)
    Note over A,B: 終了処理（青系）
    A->>B: さようなら
    B-->>A: またね！
    end
```

---

## クラス図

### デフォルトスタイル（色指定なし）

```mermaid
classDiagram
    class Animal{
        +String name
        +int age
        +makeSound()
    }
    class Dog{
        +String breed
        +bark()
        +fetch()
    }
    class Cat{
        +int lives
        +meow()
        +scratch()
    }
    class Bird{
        +boolean canFly
        +chirp()
        +fly()
    }

    Animal <|-- Dog
    Animal <|-- Cat
    Animal <|-- Bird

    Dog --> Owner : belongs to
    Cat --> Owner : belongs to

    class Owner{
        +String name
        +feedAnimal()
    }
```

**注**: このクラス図は色指定なしで、Mermaidのデフォルトカラーが適用されます。

### クラス図 - style方式（色設定あり）

```mermaid
classDiagram
    class Vehicle{
        +String brand
        +int year
        +start()
        +stop()
    }
    class Car{
        +int doors
        +String fuelType
        +drive()
        +park()
    }
    class ElectricCar{
        +int batteryCapacity
        +charge()
        +getBatteryLevel()
    }
    class Truck{
        +int loadCapacity
        +loadCargo()
        +unloadCargo()
    }
    class Motorcycle{
        +String type
        +wheelie()
    }

    Vehicle <|-- Car
    Vehicle <|-- Motorcycle
    Car <|-- ElectricCar
    Car <|-- Truck

    style Vehicle fill:#FFE4E1,stroke:#8B0000,stroke-width:4px
    style Car fill:#E0FFE0,stroke:#006400,stroke-width:4px
    style ElectricCar fill:#E0E0FF,stroke:#00008B,stroke-width:4px
    style Truck fill:#FFE4B5,stroke:#8B4513,stroke-width:4px
    style Motorcycle fill:#FFE0F0,stroke:#8B008B,stroke-width:4px
```

### クラス図 - classDef方式（スタイル再利用）

```mermaid
classDiagram
    class Repository{
        <<interface>>
        +find()
        +save()
        +delete()
    }
    class UserRepository{
        +findByEmail()
        +findById()
    }
    class PostRepository{
        +findByAuthor()
        +findByTag()
    }
    class Service{
        -repository
        +execute()
    }

    Repository <|-- UserRepository
    Repository <|-- PostRepository
    Service --> Repository

    classDef interfaceStyle fill:#FFF5E1,stroke:#8B4513,stroke-width:4px
    classDef repoStyle fill:#E0F0FF,stroke:#4682B4,stroke-width:4px
    classDef serviceStyle fill:#FFE0F0,stroke:#8B3A8B,stroke-width:4px

    class Repository:::interfaceStyle
    class UserRepository:::repoStyle
    class PostRepository:::repoStyle
    class Service:::serviceStyle
```

---

## 状態遷移図（色設定あり）

### 状態遷移図（デフォルトテーマカラー）

```mermaid
stateDiagram-v2
    [*] --> 待機中

    待機中 --> 処理中: 開始
    処理中 --> 一時停止: 中断
    処理中 --> 完了: 成功
    処理中 --> エラー: 失敗

    一時停止 --> 処理中: 再開
    一時停止 --> キャンセル: 中止

    エラー --> 処理中: リトライ
    エラー --> キャンセル: 諦める

    完了 --> [*]
    キャンセル --> [*]
```

**注**: 状態遷移図（stateDiagram-v2）では、Mermaid v11.12.1でstyleディレクティブがサポートされていないため、テーマのデフォルトカラーを使用します。ダークモード時は自動的にダークテーマの色が適用されます。

### 複雑な状態遷移（ネスト付き）

```mermaid
stateDiagram-v2
    [*] --> アイドル

    アイドル --> アクティブ: イベント発火

    state アクティブ {
        [*] --> 準備中
        準備中 --> 実行中: 準備完了
        実行中 --> 検証中: 実行完了
        検証中 --> [*]: 検証OK
    }

    アクティブ --> エラー処理: エラー

    state エラー処理 {
        [*] --> エラー検出
        エラー検出 --> エラー解析
        エラー解析 --> リカバリ試行
        リカバリ試行 --> [*]: 回復成功
    }

    エラー処理 --> アイドル: リセット
    アクティブ --> 完了: 正常終了
    完了 --> [*]
```

---

## ガントチャート

### プロジェクトスケジュール（done/active/crit網羅）

```mermaid
gantt
    title Webアプリケーション開発スケジュール
    dateFormat  YYYY-MM-DD

    section 企画・設計
    要件定義           :done,    req1, 2024-01-01, 2024-01-15
    基本設計           :done,    design1, 2024-01-16, 2024-02-05
    詳細設計           :done,    detail1, 2024-02-06, 2024-02-20

    section 開発
    フロントエンド開発 :active,  front, 2024-02-21, 30d
    バックエンド開発   :active,  back, 2024-02-21, 35d
    API実装            :         api, 2024-03-01, 25d

    section テスト
    単体テスト         :         unit, 2024-03-21, 10d
    結合テスト         :         integration, 2024-03-26, 10d
    総合テスト         :         system, 2024-04-01, 7d

    section リリース
    本番環境構築       :crit,    setup, 2024-04-05, 3d
    リリース           :crit,    release, 2024-04-08, 1d
    監視設定           :crit,    monitor, 2024-04-09, 2d
```

### 複雑なガントチャート（全パターン）

```mermaid
gantt
    title タスク状態の全パターンテスト
    dateFormat YYYY-MM-DD

    section 完了済み（done）
    完了タスク1        :done,    d1, 2024-01-01, 10d
    完了タスク2        :done,    d2, 2024-01-11, 5d
    完了タスク3        :done,    d3, 2024-01-16, 7d

    section アクティブ（active）
    実行中タスク1      :active,  a1, 2024-01-20, 15d
    実行中タスク2      :active,  a2, 2024-01-25, 10d

    section 重要（crit）
    緊急タスク1        :crit,    c1, 2024-02-01, 5d
    緊急タスク2        :crit,    c2, 2024-02-06, 3d
    緊急タスク3        :crit,    c3, 2024-02-09, 2d

    section 通常タスク
    通常タスク1        :         t1, 2024-02-11, 10d
    通常タスク2        :         t2, 2024-02-15, 8d
    通常タスク3        :         t3, 2024-02-20, 12d

    section マイルストーン
    マイルストーン1    :milestone, m1, 2024-02-10, 0d
    マイルストーン2    :milestone, m2, 2024-02-25, 0d
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

### チーム構成

```mermaid
pie title チームメンバーの役割分担
    "フロントエンド" : 30
    "バックエンド" : 35
    "DevOps" : 15
    "QA" : 12
    "デザイン" : 8
```

---

## Gitグラフ

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
    commit id: "グラフ機能追加"
    checkout develop
    merge feature/dashboard
    checkout main
    merge develop tag: "v1.0.0"
    checkout develop
    commit id: "次バージョン開発開始"
```

---

## 色変換テスト用パターン

### 明るい色のテスト（パステルカラー）

```mermaid
graph LR
    A[白に近い色] --> B[ライトグレー]
    B --> C[パステルピンク]
    C --> D[パステルブルー]
    D --> E[パステルグリーン]

    style A fill:#FFFFFF,stroke:#000,stroke-width:2
    style B fill:#F5F5F5,stroke:#666,stroke-width:2
    style C fill:#FFE4E1,stroke:#8B4789,stroke-width:2
    style D fill:#E0F0FF,stroke:#4682B4,stroke-width:2
    style E fill:#E0FFE0,stroke:#228B22,stroke-width:2
```

### 暗い色のテスト（ダークカラー + 白文字）

```mermaid
graph LR
    A[ダークグレー] --> B[ネイビー]
    B --> C[ダークグリーン]
    C --> D[ダークレッド]
    D --> E[黒に近い色]

    style A fill:#2F4F4F,stroke:#000,stroke-width:2,color:#fff
    style B fill:#191970,stroke:#000080,stroke-width:2,color:#fff
    style C fill:#006400,stroke:#228B22,stroke-width:2,color:#fff
    style D fill:#8B0000,stroke:#FF0000,stroke-width:2,color:#fff
    style E fill:#1C1C1C,stroke:#fff,stroke-width:2,color:#fff
```

### 中間色のテスト（ミドルトーン）

```mermaid
graph TB
    A[グレー系] --> B[ベージュ系]
    B --> C[オリーブ系]
    C --> D[ティール系]
    D --> E[ラベンダー系]

    style A fill:#808080,stroke:#000,stroke-width:2,color:#fff
    style B fill:#D2B48C,stroke:#8B7355,stroke-width:2
    style C fill:#808000,stroke:#556B2F,stroke-width:2,color:#fff
    style D fill:#008080,stroke:#2F4F4F,stroke-width:2,color:#fff
    style E fill:#9370DB,stroke:#4B0082,stroke-width:2,color:#fff
```

---

## テスト結果チェックリスト

### ライトモードでの確認

- [ ] フローチャート（デフォルトスタイル）がMermaidの標準色で表示される
- [ ] フローチャート（色設定あり）の色が正しく表示される（3種類）
- [ ] シーケンス図（デフォルトスタイル）が標準色で表示される
- [ ] シーケンス図の色付きボックス（rect）が表示される（2種類）
- [ ] クラス図（デフォルトスタイル）が標準色で表示される
- [ ] クラス図の各クラスに色が付いている（style方式、classDef方式）
- [ ] 状態遷移図がテーマカラーで表示される（2種類とも）
- [ ] ガントチャートのdone/active/critタスクが識別できる（2種類とも）
- [ ] 円グラフの色が表示される（2種類とも）
- [ ] Gitグラフが正しく描画される
- [ ] ER図が正しく描画される
- [ ] 色変換テストの3つのフローチャートが表示される
- [ ] すべてのダイアグラムにエラーが出ない

### ダークモードでの確認

**注意**: すべてのMermaidダイアグラムは常にライトテーマ（白背景）で表示されます。

- [ ] すべてのダイアグラムが白背景で表示される
- [ ] フローチャート（デフォルトスタイル）が見やすい
- [ ] フローチャート（色設定あり）の色が正しく表示される
- [ ] シーケンス図（デフォルトスタイル）が見やすい
- [ ] シーケンス図の色付きボックス（rect）が表示される
- [ ] クラス図（デフォルトスタイル）が見やすい
- [ ] クラス図の色が適切に表示される（style方式、classDef方式）
- [ ] 状態遷移図が見やすい
- [ ] ガントチャートのdone/active/critタスクが識別できる
- [ ] すべてのテキストが読みやすい
- [ ] Gitグラフ、ER図、円グラフが見やすい
- [ ] ダイアグラム周辺のMarkdownコンテンツはダークモードになっている

### 機能確認

- [ ] ダークモード切り替え時にページがリロードされる
- [ ] すべてのダイアグラムが正しく描画される（エラーなし）
- [ ] 目次から各セクションへジャンプできる
- [ ] 印刷機能が正常に動作する

---

すべてのパターンが正しく動作することを確認してください！
