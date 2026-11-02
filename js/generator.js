// AppSheet Expression Builder - Expression Generation Logic
import { FUNCTION_HELP_URLS } from './functions.js';

export const functionsList = [
    { id: 'LOOKUP', label: 'LOOKUP（他テーブルから1項目取得）', syntax: 'LOOKUP(lookup-value, table-name, lookup-column, return-column)', exp: '指定テーブルを検索し、一致するレコードの指定列の値を返します。' },
    { id: 'DEREF', label: 'De-Reference ([Ref列].[項目名] 形式の直接参照)', syntax: '[Ref列].[項目名]', exp: 'Ref型リレーションを通じて関連テーブルの項目を直接参照します。' },
    { id: 'REF_ROWS', label: 'REF_ROWS（関連レコード一覧の自動取得）', syntax: 'REF_ROWS(table-name, ref-column-name)', exp: '他テーブルから自レコードを参照している子レコードの行キーリストを取得します。' },
    { id: 'SELECT', label: 'SELECT（条件に一致するリスト抽出）', syntax: 'SELECT(table-name[column-name], condition)', exp: '条件を満たす行の特定カラムの値をリスト形式で抽出します。' },
    { id: 'FILTER', label: 'FILTER（条件に一致する行キーのリスト抽出）', syntax: 'FILTER(table-name, condition)', exp: '条件を満たすレコードの行キー（ID）のリストを返します。' },
    { id: 'SORT', label: 'SORT（リストを並び替え）', syntax: 'SORT(list)', exp: 'リストの要素を昇順に並び替えます。' },
    { id: 'ORDERBY', label: 'ORDERBY（リストを指定列で並び替え）', syntax: 'ORDERBY(table-name[column], sort-column, [ascending])', exp: '指定した列の順序に従ってレコードを並び替えたリストを生成します。' },
    { id: 'LIST', label: 'LIST（任意の値からリストを作成）', syntax: 'LIST(value1, value2, ...)', exp: '複数の値をまとめて1つのリストを作成します。' },
    { id: 'SPLIT', label: 'SPLIT（文字列を区切り文字で分割してリスト化）', syntax: 'SPLIT(text, delimiter)', exp: '特定の区切り文字で文字列を分割し、リストを返します。' },
    { id: 'INTERSECT', label: 'INTERSECT（2つのリストの積集合/共通要素）', syntax: 'INTERSECT(list1, list2)', exp: '2つのリストに共通して含まれる要素のリストを返します。' },
    { id: 'UNIQUE', label: 'UNIQUE（リストから重複を除去）', syntax: 'UNIQUE(list)', exp: 'リストから重複する要素を取り除いた一意のリストを返します。' },
    { id: 'SUM', label: 'SUM（合計）', syntax: 'SUM(list)', exp: '数値リストの合計値を算出します。' },
    { id: 'COUNT', label: 'COUNT（件数）', syntax: 'COUNT(list)', exp: 'リストに含まれる要素の総数をカウントします。' },
    { id: 'AVERAGE', label: 'AVERAGE（平均）', syntax: 'AVERAGE(list)', exp: '数値リストの平均値を算出します。' },
    { id: 'MAX', label: 'MAX（最大値）', syntax: 'MAX(list)', exp: '数値リストの中から最大値を取得します。' },
    { id: 'MIN', label: 'MIN（最小値）', syntax: 'MIN(list)', exp: '数値リストの中から最小値を取得します。' },
    { id: 'MAXROW', label: 'MAXROW（最大値となる行キーの取得）', syntax: 'MAXROW(table-name, numeric-column, [condition])', exp: '条件に一致する中で、指定数値列が最大となる行のキーを取得します。' },
    { id: 'MINROW', label: 'MINROW（最小値となる行キーの取得）', syntax: 'MINROW(table-name, numeric-column, [condition])', exp: '条件に一致する中で、指定数値列が最小となる行のキーを取得します。' },
    { id: 'IFS', label: 'IFS（多岐条件分岐）', syntax: 'IFS(cond1, val1, cond2, val2, ...)', exp: '上から順に条件を評価し、最初に真になった条件の結果を返します。' },
    { id: 'SWITCH', label: 'SWITCH（値の一致による多岐分岐）', syntax: 'SWITCH(expression, val1, res1, val2, res2, ..., [default])', exp: '式の評価値に一致するケースの値を返します。' },
    { id: 'IF', label: 'IF（単純な真偽分岐）', syntax: 'IF(condition, true-value, false-value)', exp: '条件の真偽に応じて異なる値を返します。' },
    { id: 'AND_OR', label: 'AND / OR（複数条件の論理結合）', syntax: 'AND(cond1, cond2) / OR(cond1, cond2)', exp: '複数の条件を論理積（AND）または論理和（OR）で結びます。' },
    { id: 'NOT', label: 'NOT（条件の反転）', syntax: 'NOT(condition)', exp: '条件の真偽を反転させます。' },
    { id: 'ISBLANK', label: 'ISBLANK / ISNOTBLANK（空・非空チェック）', syntax: 'ISBLANK(value)', exp: '値が空（ブランク）かどうかを判定します。' },
    { id: 'IN', label: 'IN（値がリストに含まれるか判定）', syntax: 'IN(value, list)', exp: '指定した値がリスト内に含まれているか検証します。' },
    { id: 'CONTAINS', label: 'CONTAINS（部分一致・文字列判定）', syntax: 'CONTAINS(text, substring)', exp: '文字列の中に特定のキーワードが含まれているか判定します。' },
    { id: 'CONCATENATE', label: 'CONCATENATE（文字列の結合）', syntax: 'CONCATENATE(text1, text2, ...)', exp: '複数の文字列や列の値を結合します。' },
    { id: 'TEXT', label: 'TEXT（数値・日付のフォーマット変換）', syntax: 'TEXT(value, format)', exp: '数値や日付を指定した書式の文字列に変換します。' },
    { id: 'SUBSTITUTE', label: 'SUBSTITUTE（文字列の置換）', syntax: 'SUBSTITUTE(text, old-text, new-text)', exp: '文字列の一部を指定した別の文字列に置き換えます。' },
    { id: 'INDEX', label: 'INDEX（リストから指定位置の要素を取得）', syntax: 'INDEX(list, index)', exp: 'リストの指定されたインデックス位置の要素を取り出します。' },
    { id: 'LOWER_UPPER', label: 'LOWER / UPPER（大文字・小文字変換）', syntax: 'LOWER(text) / UPPER(text)', exp: 'アルファベットの大文字・小文字を相互に変換します。' },
    { id: 'TODAY_NOW', label: 'TODAY / NOW / TIMENOW（現在日時・時刻）', syntax: 'TODAY() / NOW() / TIMENOW()', exp: '現在の日付、日時、または時刻を取得します。' },
    { id: 'DATE_TIME', label: 'DATE / TIME / DATETIME（日時オブジェクト作成）', syntax: 'DATE(year, month, day)', exp: '指定した数値やテキストから日付・時間オブジェクトを構築します。' },
    { id: 'USER_INFO', label: 'USEREMAIL / USERNAME / USERROLE（ログイン情報）', syntax: 'USEREMAIL()', exp: '現在ログインしているユーザーの情報を取得します。' },
    { id: 'CONTEXT', label: 'CONTEXT（画面・アプリ情報）', syntax: 'CONTEXT("View")', exp: '現在のビュー名やアプリ名などの実行コンテキストを取得します。' },
    { id: 'ROUND', label: 'ROUND / CEILING / FLOOR（端数処理）', syntax: 'ROUND(number)', exp: '四捨五入、切り上げ、切り捨てを行います。' },
    { id: 'ABS', label: 'ABS（絶対値の計算）', syntax: 'ABS(number)', exp: '数値の絶対値を計算します。' },
    { id: 'LINKTOVIEW', label: 'LINKTOVIEW（指定ビューへ遷移）', syntax: 'LINKTOVIEW("ViewName")', exp: '指定したビューへのリンク/アクションを生成します。' },
    { id: 'LINKTOROW', label: 'LINKTOROW（特定レコードのビューへ遷移）', syntax: 'LINKTOROW(row, "ViewName")', exp: '特定レコードの詳細ビュー等へのリンクを生成します。' }
];

export function generateExpression(fnId, schema, options = {}) {
    let expr = '';
    let explanation = '';
    let fnKey = fnId;
    if (fnId.includes('_')) fnKey = fnId.split('_')[0];
    if (fnId === 'DEREF') fnKey = 'LOOKUP';
    if (fnId === 'AND_OR') fnKey = 'AND';
    if (fnId === 'LOWER_UPPER') fnKey = 'LOWER';
    if (fnId === 'TODAY_NOW') fnKey = 'TODAY';
    if (fnId === 'DATE_TIME') fnKey = 'DATE';
    if (fnId === 'USER_INFO') fnKey = 'USEREMAIL';
    if (fnId === 'ROUND') fnKey = 'ROUND';

    let helpUrl = FUNCTION_HELP_URLS[fnKey] || 'https://support.google.com/appsheet/answer/10107471?hl=ja';

    const useThisRow = options.useThisRow !== false;
    const prefix = useThisRow ? '[_THISROW].' : '';

    const firstTbl = schema[0] || { name: 'テーブル名', columns: [{ name: 'ID列', type: 'Text' }] };
    const tblName = options.tableName || firstTbl.name;
    const colName = options.columnName || (firstTbl.columns[0] ? firstTbl.columns[0].name : 'ID');

    switch (fnId) {
        case 'LOOKUP':
            expr = `LOOKUP(${prefix}[${colName}], "${tblName}", "${colName}", "${colName}")`;
            explanation = `「${tblName}」テーブルを検索し、${colName}が現在行の値と一致するレコードの該当列を取得します。`;
            break;
        case 'DEREF':
            expr = `[${colName}].[${colName}]`;
            explanation = `Ref型カラムを経由して、関連先テーブルの「${colName}」の値を直接参照します（高速）。`;
            break;
        case 'REF_ROWS':
            expr = `REF_ROWS("${tblName}", "${colName}")`;
            explanation = `「${tblName}」テーブルにおいて、${colName}列が自レコードを指している子レコードのリストを取得します。`;
            break;
        case 'SELECT':
            expr = `SELECT(${tblName}[${colName}], [ステータス] = "有効")`;
            explanation = `「${tblName}」テーブルから条件に一致する「${colName}」のリストを抽出します。`;
            break;
        case 'FILTER':
            expr = `FILTER("${tblName}", [ステータス] = "有効")`;
            explanation = `「${tblName}」テーブルから条件を満たす行キー（ID）のリストを抽出します。`;
            break;
        case 'SORT':
            expr = `SORT(${tblName}[${colName}])`;
            explanation = `指定されたリストの要素を昇順に並び替えます。`;
            break;
        case 'ORDERBY':
            expr = `ORDERBY(${tblName}, ${colName}, TRUE)`;
            explanation = `「${tblName}」を指定の列で並び替えたレコード行リストを取得します。`;
            break;
        case 'LIST':
            expr = `LIST("値1", "値2", "値3")`;
            explanation = `任意の独立した値から新しいリストを作成します。`;
            break;
        case 'SPLIT':
            expr = `SPLIT([${colName}], ",")`;
            explanation = `カンマ区切りの文字列を分割してリスト形式に変換します。`;
            break;
        case 'INTERSECT':
            expr = `INTERSECT(List1, List2)`;
            explanation = `2つのリストに共通して含まれる要素だけを抽出します。`;
            break;
        case 'UNIQUE':
            expr = `UNIQUE(${tblName}[${colName}])`;
            explanation = `リストから重複している要素を除外して一意にします。`;
            break;
        case 'SUM':
            expr = `SUM(SELECT(${tblName}[金額], [ステータス] = "完了"))`;
            explanation = `条件に一致する数値の合計値を計算します。`;
            break;
        case 'COUNT':
            expr = `COUNT(SELECT(${tblName}[${colName}], [ステータス] = "有効"))`;
            explanation = `条件に一致する要素の件数をカウントします。`;
            break;
        case 'AVERAGE':
            expr = `AVERAGE(${tblName}[金額])`;
            explanation = `数値リストの平均値を計算します。`;
            break;
        case 'MAX':
            expr = `MAX(${tblName}[金額])`;
            explanation = `数値リストの中の最大値を返します。`;
            break;
        case 'MIN':
            expr = `MIN(${tblName}[金額])`;
            explanation = `数値リストの中の最小値を返します。`;
            break;
        case 'MAXROW':
            expr = `MAXROW("${tblName}", "金額", [ステータス] = "完了")`;
            explanation = `条件に一致する中で「金額」が最大となる行のキーを取得します。`;
            break;
        case 'MINROW':
            expr = `MINROW("${tblName}", "金額", [ステータス] = "進行中")`;
            explanation = `条件に一致する中で「金額」が最小となる行のキーを取得します。`;
            break;
        case 'IFS':
            expr = `IFS([スコア] >= 80, "優秀", [スコア] >= 50, "合格", TRUE, "要再受験")`;
            explanation = `複数の条件を上から順に判定し、最初に一致した結果を返します。`;
            break;
        case 'SWITCH':
            expr = `SWITCH([ステータス], "受付", "未着手", "進行中", "作業中", "完了")`;
            explanation = `対象の値に一致するケースの文字列や数値を返します。`;
            break;
        case 'IF':
            expr = `IF(ISBLANK([${colName}]), "未入力", "入力済")`;
            explanation = `条件が真の場合と偽の場合で異なる値を返します。`;
            break;
        case 'AND_OR':
            expr = `AND(ISNOTBLANK([メール]), [同意フラグ] = TRUE)`;
            explanation = `複数の条件をすべて満たす（AND）、またはいずれかを満たす（OR）を評価します。`;
            break;
        case 'NOT':
            expr = `NOT([無効フラグ])`;
            explanation = `条件の真偽（True/False）を反転させます。`;
            break;
        case 'ISBLANK':
            expr = `ISBLANK([${colName}])`;
            explanation = `指定された列や値が空欄であるかどうかを判定します。`;
            break;
        case 'IN':
            expr = `IN([${colName}], LIST("A", "B", "C"))`;
            explanation = `指定した値が対象のリスト内に存在するかどうかを検証します。`;
            break;
        case 'CONTAINS':
            expr = `CONTAINS([メモ], "重要")`;
            explanation = `テキストの中に指定したキーワードが含まれているか部分一致で判定します。`;
            break;
        case 'CONCATENATE':
            expr = `CONCATENATE([姓], " ", [名], " 様")`;
            explanation = `複数の文字列や列の値を連結して1つの文字列にします。`;
            break;
        case 'TEXT':
            expr = `TEXT([作成日時], "YYYY/MM/DD")`;
            explanation = `日付や数値を指定したフォーマット形式の文字列に変換します。`;
            break;
        case 'SUBSTITUTE':
            expr = `SUBSTITUTE([電話番号], "-", "")`;
            explanation = `文字列内の特定の文字を指定した別の文字に置き換えます。`;
            break;
        case 'INDEX':
            expr = `INDEX(SPLIT([CSVデータ], ","), 1)`;
            explanation = `リストの指定したインデックス（何番目か）の要素を取り出します。`;
            break;
        case 'LOWER_UPPER':
            expr = `UPPER([メールアドレス])`;
            explanation = `アルファベットの大文字または小文字に変換します。`;
            break;
        case 'TODAY_NOW':
            expr = `TOD() + 7`;
            explanation = `現在の日付、日時、または時刻を取得し、日数計算等に利用します。`;
            break;
        case 'DATE_TIME':
            expr = `DATE(2026, 11, 2)`.replace('TOD()', 'TODAY()');
            explanation = `年月日の数値から正しい日付オブジェクトを構築します。`;
            break;
        case 'USER_INFO':
            expr = `USEREMAIL()`;
            explanation = `現在アプリを利用しているログインユーザーのメールアドレス等を取得します。`;
            break;
        case 'CONTEXT':
            expr = `CONTEXT("View")`;
            explanation = `現在の画面ビュー名やプラットフォーム名などのコンテキスト情報を取得します。`;
            break;
        case 'ROUND':
            expr = `ROUND([単価] * [数量], 2)`;
            explanation = `数値の四捨五入や端数処理を行います。`;
            break;
        case 'ABS':
            expr = `ABS([実績値] - [計画値])`;
            explanation = `マイナスの値をプラスに変換して絶対値を計算します。`;
            break;
        case 'LINKTOVIEW':
            expr = `LINKTOVIEW("Dashboard_Detail")`;
            explanation = `指定した任意のビュー画面へ直接遷移するアクションリンクを生成します。`;
            break;
        case 'LINKTOROW':
            expr = `LINKTOROW([_THISROW], "Detail_View")`;
            explanation = `選択した特定のレコードの詳細画面へスムーズに遷移させます。`;
            break;
        default:
            expr = `CONCATENATE([${colName}])`;
            explanation = `標準的な式構文テンプレートです。`;
    }

    return { expr, explanation, helpUrl };
}
