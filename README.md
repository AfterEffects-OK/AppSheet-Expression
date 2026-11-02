# AppSheet Expression Builder

テーブル構造（スキーマ）をもとに、AppSheet の各種関数・数式構文をワンクリックで自動生成・解説するプロフェッショナルな開発者向け Web ツールです。

[![AppSheet Expression Builder](https://img.shields.io/badge/AppSheet-Expression%20Builder-blue?style=flat-square&logo=google-sheets)](https://aftereffects-ok.github.io/AppSheet-Expression/Generator.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 概要 (Overview)

AppSheet アプリ開発における複雑な関数や数式（`LOOKUP`, `SELECT`, `FILTER`, `SUM`, `LINKTO...` など）の記述を強力にサポートします。
定義したスキーマ（テーブル構造）をもとに、よく使われる定番の関数から高度なネスト・合成関数まで、正確な AppSheet 式を自動生成し、詳細な解説と開発のワンポイントアドバイスを提供します。

---

## 主な機能 (Key Features)

### 1. スキーマ（テーブル構造）マネージャー
- **ワンタッププリセット追加**：「顧客マスタ」「売上履歴」「商品マスタ」などの定番テーブルをワンクリックで追加できます。
- **一括インポート / サンプル読み込み**：CSV/TSVファイルのドラッグ＆ドロップや、スプレッドシート行の直接貼り付けによる一括スキーマ登録に対応しています。
- **ローカルストレージ自動同期**：編集中のスキーマ情報はブラウザの `localStorage` に自動保存されます。

### 2. 全標準関数・高度な合成関数の網羅
- **参照・リレーション**: `LOOKUP`, `De-Reference ([Ref列].[項目])`, `REF_ROWS`, `DOMAINOF`
- **リスト・抽出**: `SELECT`, `FILTER`, `ORDERBY`, `SORT`, `TOP`, `ANY`, `LIST`, `SPLIT`, `INTERSECT`, `UNIQUE`, `EXTRACT`
- **集計・計算**: `SUM`, `COUNT`, `AVERAGE`, `MAX`, `MIN`, `MAXROW`, `MINROW`, `STDEVP`, `MOD`, `POWER`, `ROUND`
- **画面遷移・リンク**: `LINKTOVIEW`, `LINKTOROW`, `LINKTOFORM`, `LINKTOFILTEREDVIEW`, `LINKTOAPP`, `HYPERLINK`
- **ユーザー・環境・位置情報**: `HERE`, `LATLONG`, `LAT`, `LONG`, `USEREMAIL`, `USERNAME`, `CONTEXT`
- **高度な合成関数**: 条件付き集計、重複登録防止バリデーション、リスト要素抽出など

### 3. スムーズな操作性
- どの関数パターンや条件式入力欄を選択している時でも、テーブルのカラム名（`[列名]`）をワンクリックで簡単に組み込めます。
- リアルタイムで構文の動作解説と開発のヒントが表示されます。

---

## 使い方 (How to Use)

1. [AppSheet Expression Builder (GitHub Pages)](https://aftereffects-ok.github.io/AppSheet-Expression/Generator.html) にアクセスします。
2. **「1. スキーマ（テーブル構造）」** からテーブルを追加するか、「サンプル読み込み」または「一括インポート」でテーブル定義を読み込みます。
3. **「2. 生成したい処理の設定」** で目的の関数カテゴリ（生成パターン）を選択し、必要に応じてパラメータや対象カラムを指定します。
4. **「3. 生成された AppSheet 式」** にリアルタイムで出力された式を「クリップボードにコピー」して、AppSheetエディタに貼り付けて使用します。

---

## 技術スタック (Tech Stack)

- HTML5 / JavaScript (Vanilla JS)
- Tailwind CSS
- Lucide Icons
- Google Fonts (Inter / Fira Code)

---

## ライセンス (License)

This project is open-source under the [MIT License](LICENSE).
