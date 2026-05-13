# 現在の機能・技術資料

## 1. アプリ概要

このリポジトリは、Next.js フロントエンドと Rails API バックエンドで構成された Web アプリです。

現在の主な機能は以下です。

- カレンダー機能
- コーヒー豆管理機能
- コーヒー豆画像の OCR 解析機能
- テイスティングノート機能
- ストップウォッチ機能
- 学習時間保存機能
- `/prediction` での学習時間可視化・集計機能

永続化は Rails API 経由で PostgreSQL に保存します。Next.js から DB へ直接アクセスしません。

## 2. 技術スタック

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Three.js

### Backend

- Ruby on Rails API
- PostgreSQL
- Active Record
- Minitest

### OCR

- Tesseract OCR
- `Open3.capture3`
- `Timeout.timeout`

## 3. ディレクトリ構成

```txt
Calendar/
  frontend/
    src/app/
      calendar/
      coffee/
      timer/
      prediction/
      components/
  backend/
    app/controllers/api/
    app/models/
    app/services/
    db/migrate/
```

## 4. フロントエンド機能

### 4.1 カレンダー

場所:

```txt
frontend/src/app/calendar
```

主な機能:

- 月表示
- 週表示
- 予定の表示
- 予定の作成
- 予定の編集
- 予定の削除
- 予定検索
- サイドバーでの予定確認

Rails API の `/api/events` を利用します。

### 4.2 コーヒー一覧

場所:

```txt
frontend/src/app/coffee/page.tsx
```

主な機能:

- 登録済みコーヒー豆の一覧表示
- 詳細ページへの遷移
- 新規登録ページへの遷移

### 4.3 コーヒー新規登録

場所:

```txt
frontend/src/app/coffee/new/page.tsx
```

主な機能:

- 画像アップロード
- Rails API の `POST /api/coffee_beans/analyze` へ送信
- OCR 解析後、draft の CoffeeBean を作成
- 作成後に編集画面へ遷移

### 4.4 コーヒー詳細

場所:

```txt
frontend/src/app/coffee/[id]/page.tsx
```

主な機能:

- コーヒー豆の詳細表示
- OCR で保存された `raw_text` の確認
- テイスティングノート表示
- テイスティングノート追加
- コーヒー豆削除

### 4.5 コーヒー編集

場所:

```txt
frontend/src/app/coffee/[id]/edit/page.tsx
```

主な機能:

- OCR 結果の確認
- 各項目の手動編集
- `status` を `draft` から `confirmed` に更新可能

### 4.6 ストップウォッチ

場所:

```txt
frontend/src/app/timer/page.tsx
frontend/src/app/components/StopwatchProvider.tsx
```

主な機能:

- Start / Stop
- Lap
- Reset
- 保存ボタン
- カテゴリ入力
- ページ移動後も動き続けるストップウォッチ
- `localStorage` による状態復元
- 保存後にタイマーを 0 秒へリセット

保存対象:

- 保存ボタンを押した時点の 1 セッション
- 優先保存項目は総時間
- カテゴリも保存

保存 API:

```txt
POST /api/study_sessions
```

### 4.7 Three.js 表示

場所:

```txt
frontend/src/app/timer/components/three/ThreeBox.tsx
```

主な機能:

- `/timer` の背景演出
- Three.js によるアニメーション描画

### 4.8 予測・可視化ページ

場所:

```txt
frontend/src/app/prediction/page.tsx
frontend/src/app/prediction/WeeklyTimerChart.tsx
```

主な機能:

- 保存済みストップウォッチ記録の取得
- 今週の棒グラフ表示
- 日曜から土曜の順でグラフ表示
- グラフ表示/非表示トグル
- グラフ非表示時も以下の値は表示
  - 今日の学習時間
  - 今週の最多時間
- 週別平均
- 月別平均
- 累計時間
- 今日の予測学習時間

今日の予測学習時間は、過去の同じ曜日の平均を優先して計算します。同じ曜日の過去データがない場合は、記録日の平均を使用します。

## 5. バックエンド API

### 5.1 Events API

Controller:

```txt
backend/app/controllers/api/events_controller.rb
```

Routes:

```txt
GET    /api/events
GET    /api/events/:id
POST   /api/events
PATCH  /api/events/:id
DELETE /api/events/:id
```

主な仕様:

- `year` と `month` パラメータがある場合、その月に重なる予定だけを返します。
- `title`, `start_at`, `end_at` は必須です。
- `end_at` は `start_at` 以降である必要があります。

### 5.2 Coffee Beans API

Controller:

```txt
backend/app/controllers/api/coffee_beans_controller.rb
```

Routes:

```txt
GET    /api/coffee_beans
POST   /api/coffee_beans/analyze
GET    /api/coffee_beans/:id
PATCH  /api/coffee_beans/:id
DELETE /api/coffee_beans/:id
```

主な仕様:

- `POST /api/coffee_beans/analyze` は画像を受け取ります。
- 画像は `backend/public/uploads/coffee_beans` に保存します。
- 保存した画像パスを `CoffeeBeans::AnalyzeImage` に渡します。
- OCR 結果と簡易 parser 結果から CoffeeBean を draft で作成します。
- 返却 JSON は `coffee_bean.as_json_for_api` です。

### 5.3 Tasting Notes API

Controller:

```txt
backend/app/controllers/api/tasting_notes_controller.rb
```

Routes:

```txt
POST   /api/coffee_beans/:coffee_bean_id/tasting_notes
PATCH  /api/tasting_notes/:id
DELETE /api/tasting_notes/:id
```

主な仕様:

- テイスティングノートは CoffeeBean に紐づきます。
- 評価系の値は 1 から 5 の整数です。
- メモ、抽出方法、湯温、豆量、湯量、抽出時間などを保存できます。

### 5.4 Study Sessions API

Controller:

```txt
backend/app/controllers/api/study_sessions_controller.rb
```

Routes:

```txt
GET  /api/study_sessions
POST /api/study_sessions
```

主な仕様:

- ストップウォッチの保存データを扱います。
- `category` は必須です。
- `duration_seconds` は 1 秒以上の整数です。
- `recorded_at` が未指定の場合は現在時刻を自動設定します。
- 一覧は `recorded_at` の降順です。

## 6. データモデル

### 6.1 Event

主な項目:

- `title`
- `description`
- `start_at`
- `end_at`
- `all_day`
- `color`

### 6.2 CoffeeBean

主な項目:

- `image_url`
- `brand`
- `code`
- `roast_level`
- `name`
- `country`
- `name_ja`
- `description_ja`
- `flavor_notes`
- `region`
- `process`
- `variety`
- `elevation`
- `farmer`
- `farm`
- `is_limited`
- `raw_text`
- `status`

仕様:

- `status` は `draft` または `confirmed`
- `flavor_notes` は配列
- 読み取れない項目は `nil`
- `flavor_notes` は未抽出時 `[]`
- CoffeeBean は複数の TastingNote を持ちます。

### 6.3 TastingNote

主な項目:

- `coffee_bean_id`
- `rating`
- `acidity`
- `bitterness`
- `sweetness`
- `aroma`
- `body`
- `memo`
- `brew_method`
- `grind_size`
- `water_temp`
- `coffee_grams`
- `water_grams`
- `brew_time`

### 6.4 StudySession

主な項目:

- `category`
- `duration_seconds`
- `recorded_at`
- `memo`

## 7. OCR 処理

### 7.1 全体フロー

```txt
POST /api/coffee_beans/analyze
  -> 画像を保存
  -> CoffeeBeans::AnalyzeImage.call(image_path:)
  -> CoffeeBeans::Ocr::TesseractClient.call(image_path:)
  -> raw_text を取得
  -> CoffeeBeans::PostCoffeeTextParser.call(raw_text:)
  -> 抽出できた項目だけ CoffeeBean に保存
  -> draft として返却
```

### 7.2 TesseractClient

場所:

```txt
backend/app/services/coffee_beans/ocr/tesseract_client.rb
```

仕様:

- `ENV["TESSERACT_PATH"]` があればそのコマンドを使用
- なければ `tesseract` を使用
- `ENV["TESSERACT_LANG"]` があればその言語を使用
- なければ `eng`
- `ENV["TESSERACT_TIMEOUT"]` があればその秒数を使用
- なければ 10 秒
- shell 文字列を組み立てず、`Open3.capture3` に引数分離で渡します。
- Windows の空白を含むパスに対応しやすい構成です。

独自例外:

- `CoffeeBeans::Ocr::TesseractClient::Error`
- `CoffeeBeans::Ocr::TesseractClient::CommandNotFound`
- `CoffeeBeans::Ocr::TesseractClient::ExecutionFailed`
- `CoffeeBeans::Ocr::TesseractClient::TimeoutError`

### 7.3 AnalyzeImage

場所:

```txt
backend/app/services/coffee_beans/analyze_image.rb
```

仕様:

- Tesseract OCR を呼び出します。
- OCR 成功時は `raw_text` に OCR 結果を保存します。
- OCR 結果が空文字の場合は `raw_text: nil` にします。
- OCR 失敗時も CoffeeBean 作成は継続します。
- OCR 失敗時は `Rails.logger.warn` に error class と message だけを出します。
- 画像本体や OCR 全文はログに出しません。
- 固定 mock 値で未抽出項目を埋めません。
- 抽出できない項目は `nil` または `[]` です。

### 7.4 PostCoffeeTextParser

場所:

```txt
backend/app/services/coffee_beans/post_coffee_text_parser.rb
```

現在抽出する項目:

- `brand`
- `country`
- `farm`
- `code`

抽出仕様:

- `PostCoffee`, `Post Coffee`, `postcoffee` 相当があれば `brand: "PostCoffee"`
- `INDONESIA`, `NDONES`, `INDONES`, `INDONESI` があれば `country: "INDONESIA"`
- `Frinsa` があれば `farm: "Frinsa Estate"`
- `IND-0416` のような形式を code として抽出
- OCR 誤読 `10-0816` は `IND-0416` に補正

まだ実装していないこと:

- flavor notes の高度抽出
- process の高度抽出
- 日本語 OCR
- 画像補正
- Vision AI 連携

## 8. 環境変数

### Frontend

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

Next.js から Rails API を呼ぶために使います。

### Backend OCR

```txt
TESSERACT_PATH=C:/Program Files/Tesseract-OCR/tesseract.exe
TESSERACT_LANG=eng
TESSERACT_TIMEOUT=10
```

現在は `TESSERACT_LANG=eng` を前提にしています。`jpn` は未対応です。

## 9. セキュリティ・安全面

現在の最低限の対応:

- Tesseract 呼び出しは shell 文字列ではなく引数分離
- OCR エラー時に画像本体や OCR 全文をログに出さない
- CoffeeBean の未抽出項目を推測で埋めない
- Rails の strong parameters を使用
- CoffeeBean 削除時に紐づく TastingNote も削除

今後検討すべきこと:

- アップロード画像の拡張子・MIME type 検証
- 画像サイズ制限
- 認証・ユーザー別データ分離
- CORS 設定の確認
- public uploads の保存期間管理

## 10. 手動確認方法

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

確認ページ:

```txt
http://localhost:3000/calendar
http://localhost:3000/coffee
http://localhost:3000/coffee/new
http://localhost:3000/timer
http://localhost:3000/prediction
```

### Backend

```bash
cd backend
ruby bin/rails db:migrate
ruby bin/rails server
```

Rails API:

```txt
http://localhost:3000/api/events
http://localhost:3000/api/coffee_beans
http://localhost:3000/api/study_sessions
```

### OCR 確認

```bash
tesseract --version
tesseract --list-langs
```

Rails runner:

```bash
ruby bin/rails runner "puts CoffeeBeans::Ocr::TesseractClient.call(image_path: 'sample.jpg')"
```

### Timer 保存確認

1. `/timer` を開く
2. Start を押す
3. Stop を押す
4. Save を押す
5. `/prediction` を開く
6. 今週グラフ、今日の学習時間、累計時間などが更新されることを確認

### Coffee OCR 確認

1. `/coffee/new` を開く
2. コーヒー豆パッケージ画像をアップロード
3. analyze を実行
4. CoffeeBean が draft で作成されることを確認
5. 詳細・編集画面で `raw_text` と抽出項目を確認

## 11. テスト・検証コマンド

### Frontend

```bash
cd frontend
pnpm exec tsc --noEmit
pnpm lint
pnpm run build
```

### Backend

```bash
cd backend
ruby bin/rails test
```

個別例:

```bash
ruby bin/rails test test/controllers/api/study_sessions_controller_test.rb
ruby bin/rails test test/controllers/api/coffee_beans_controller_test.rb
```

## 12. 現在の制限事項

- OCR は Tesseract の `eng` 前提です。
- `jpn` OCR は未対応です。
- PostCoffeeTextParser は簡易抽出のみです。
- 予測機能は統計的な簡易平均であり、機械学習モデルではありません。
- StudySession は削除・編集 API がまだありません。
- `/prediction` は保存済みデータの表示と簡易集計が中心です。
- 認証・ユーザー別分離は未実装または現時点では扱っていません。

## 13. 今後の拡張候補

### Timer / Prediction

- StudySession の編集・削除
- カテゴリ管理 API
- カテゴリ別グラフ
- 日別・週別・月別の詳細画面
- 予測ロジックの改善
- 目標学習時間の設定

### Coffee

- PostCoffeeTextParser の抽出項目追加
- flavor notes 抽出
- process / region / variety / elevation 抽出
- 画像前処理
- OCR 精度改善
- 日本語 OCR 対応
- Vision AI 連携

### Calendar

- 繰り返し予定
- リマインダー
- タスク連携
- 学習セッションとの連携
