# AppSheet Expression Builder v3.0

> テーブル構造から AppSheet の全関数構文を自動生成・解説するプロフェッショナルな開発者向けツール

[![AppSheet Expression Builder](https://img.shields.io/badge/AppSheet-Expression%20Builder-blue?style=flat-square&logo=google-sheets)](https://aftereffects-ok.github.io/AppSheet-Formula/Generator.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

##  概要 (Overview)
**AppSheet Expression Builder** は、AppSheet アプリ開発における複雑な関数や数式の記述を強力にサポートする Web アプリケーションです。
定義したスキーマ（テーブル構造）をもとに、よく使われる定番の関数から高度なネスト・合成関数まで、ワンクリックで正確な AppSheet 式を自動生成し、詳細な解説と開発のワンポイントアドバイスを提供します。

---

##  主な機能 (Key Features)

### 1. スキーマ（テーブル構造）マネージャー
- **ワンタッププリセット追加**: 「顧客マスタ」「売上履歴」「商品マスタ」などの定番テーブルをワンクリックで追加。
- **管理用標準カラムの自動統一**: すべてのテーブル定義（およびサンプル）に、以下の6つの管理用標準カラム（作成・編集履歴、フラグ、メモなど）を完備。
  - `作成日時` (DateTime)
  - `編集日時` (DateTime)
  - `作成者Email` (Email)
  - `編集者Email` (Email)
  - `フラグ` (Yes/No)
  - `メモ` (LongText)
- **一括インポート / サンプル読み込み**: CSV/TSVファイルのドラッグ＆ドロップ、またはスプレッドシート行の直接貼り付けによる一括スキーマ登録に対応。
- **ローカルストレージ自動同期**: 編集中のスキーマ情報はブラウザの `localStorage` に自動保存されます。

### 2. 多彩な関数・合成関数の自動生成
以下のカテゴリに分かれた豊富な AppSheet 式の生成パターンを網羅：
- **参照・リレーション**: `LOOKUP`, `De-Reference ([Ref列].[項目])`, `REF_ROWS`
- **リスト・抽出**: `SELECT`, `FILTER`, `LIST`, `SPLIT`, `INTERSECT`, `UNIQUE`
- **集計・計算**: `SUM / COUNT / AVERAGE / MAX / MIN + SELECT`, `STDEVP`
- **条件・制御**: `IFS`, `SWITCH`, `IF`, `AND / OR`, `NOT`
- **論理・チェック**: 存在・重複チェック (`ISBLANK + FILTER`), `ISBLANK`, `IN`, `CONTAINS`
- **文字列・日付・数学・ユーザー情報・コンテキスト関数**
- **高度な合成関数 (Advanced Composition)**:
  - 条件付き集計のしきい値判定 (`IF + SUM + SELECT`)
  - 重複登録防止バリデーション (`ISBLANK + FILTER`)
  - リスト要素の抽出 (`INDEX + SPLIT`)
  - 権限・存在判定 (`IN + SELECT`)

### 3. スムーズなカラム挿入UI
- どの関数パターンや条件式入力欄を選択している時でも、専用のプルダウンからテーブルのカラム名（`[列名]`）を**ワンクリックでカーソル位置へスムーズに挿入**可能。

---

##  使い方 (How to Use)

1. [AppSheet Expression Builder (GitHub Pages)](https://aftereffects-ok.github.io/AppSheet-Formula/Generator.html) にアクセスします。
2. **「1. スキーマ（テーブル構造）」** からテーブルを追加するか、「サンプル読み込み」または「一括インポート」でテーブル定義を読み込みます。
3. **「2. 生成したい処理の設定」** で目的の関数カテゴリ（生成パターン）を選択し、必要に応じてパラメータや対象カラムを指定します。
4. **「3. 生成された AppSheet 式」** にリアルタイムで出力された式を「クリップボードにコピー」して、AppSheetエディタに貼り付けて使用します。

---

##  技術スタック (Tech Stack)
- **HTML5 / JavaScript (Vanilla JS)**
- **Tailwind CSS** (スタイリング)
- **Lucide Icons** (アイコン)
- **Google Fonts (Inter / Fira Code)** (フォント)

---

##  ライセンス (License)
This project is open-source under the [MIT License](LICENSE).
