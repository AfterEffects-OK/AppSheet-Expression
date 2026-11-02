// Expression Generation Logic
import { FUNCTION_HELP_URLS } from './functions.js';

export const functionsList = [
    { id: 'LOOKUP', label: 'LOOKUP（他テーブルから1項目取得）', syntax: 'LOOKUP(lookup-value, table-name, lookup-column, return-column)', exp: '指定テーブルを検索し、一致するレコードの指定列の値を返します。' },
    { id: 'SELECT', label: 'SELECT（条件に一致するリスト抽出）', syntax: 'SELECT(table-name[column-name], condition)', exp: '条件を満たす行の特定カラムの値をリスト形式で抽出します。' },
    { id: 'SUM', label: 'SUM（合計）', syntax: 'SUM(SELECT(...))', exp: '抽出された数値リストの合計値を算出します。' },
    { id: 'COUNT', label: 'COUNT（件数）', syntax: 'COUNT(SELECT(...))', exp: '抽出されたリストの要素数（件数）をカウントします。' },
    { id: 'CONCATENATE', label: 'CONCATENATE（文字列の結合）', syntax: 'CONCATENATE(text1, text2, ...)', exp: '複数の文字列や列の値を結合します。' }
];

export function generateExpression(fnId, schema) {
    let expr = '';
    let explanation = '';
    let helpUrl = FUNCTION_HELP_URLS[fnId] || 'https://github.com/repos4/answer/10107471?hl=ja';

    if (fnId === 'LOOKUP') {
        const tbl = schema[0] ? schema[0].name : 'Table';
        const col = schema[0] && schema[0].columns[0] ? schema[0].columns[0].name : 'ID';
        expr = `LOOKUP([_THISROW].[${col}], "${tbl}", "${col}", "${col}")`;
        explanation = `「${tbl}」テーブルを検索し、${col}が現在行のリストと一致するレコードの値を取得します。`;
    } else if (fnId === 'SELECT') {
        const tbl = schema[0] ? schema[0].name : 'Table';
        const col = schema[0] && schema[0].columns[0] ? schema[0].columns[0].name : 'ID';
        expr = `SELECT(${tbl}[${col}], [ステータス] = "有効")`;
        explanation = `「${tbl}」テーブルから条件に一致する「${col}」のリストを抽出します。`;
    } else if (fnId === 'SUM') {
        expr = `SUM(SELECT(注文履歴[金額], [ステータス] = "完了"))`;
        explanation = `完了した注文の金額を合計します。`;
    } else if (fnId === 'COUNT') {
        expr = `COUNT(SELECT(注文履歴[ID注文], [顧客ID] = [_THISROW].[ID顧客]))`;
        explanation = `顧客ごとの注文件数をカウントします。`;
    } else {
        expr = `CONCATENATE([名前], " 様")`;
        explanation = `文字列を結合して表示用テキストを生成します。`;
    }

    return { expr, explanation, helpUrl };
}
