// AppSheet Expression Builder - Schema & Storage Management

export let schema = JSON.parse(localStorage.getItem('appsheet_schema')) || [
    { id: 't1', name: '注文履歴', isOpen: true, columns: [
        { name: 'ID注文', type: 'Text' }, { name: 'ID顧客', type: 'Ref' }, { name: '金額', type: 'Price' },
        { name: '注文日', type: 'Date' }, { name: 'ステータス', type: 'Text' }, { name: '作成日時', type: 'DateTime' }
    ]},
    { id: 't2', name: '顧客マスタ', isOpen: true, columns: [
        { name: 'ID顧客', type: 'Text' }, { name: '顧客名', type: 'Text' }, { name: 'メールアドレス', type: 'Email' }
    ]}
];

export function saveSchema() {
    localStorage.setItem('appsheet_schema', JSON.stringify(schema));
}

export function autoDetectType(colName) {
    if (colName.includes('日時') || colName.includes('タイムスタンプ')) return 'DateTime';
    if (colName.includes('日')) return 'Date';
    if (colName.includes('金額') || colName.includes('単価') || colName.includes('価格')) return 'Price';
    if (colName.includes('数') || colName.includes('数量')) return 'Number';
    if (colName.includes('メール')) return 'Email';
    if (colName.startsWith('ID')) return 'Text';
    return 'Text';
}

// スプレッドシートの草案（タブ区切り/カンマ区切り）を解析してテーブルを一括追加
export function importSchemaFromText(text) {
    const lines = text.split(/[\r\n]+/);
    let importedCount = 0;

    lines.forEach((line, idx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        const rawCols = trimmedLine
            .split(/[\t,]+/)
            .map(c => c.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);

        if (rawCols.length === 0) return;

        let firstVal = rawCols[0];
        let tblName = firstVal.replace(/^ID/, '').trim();
        if (!tblName) {
            tblName = 'テーブル_' + (schema.length + 1);
        }

        const columns = rawCols.map(c => ({ name: c, type: autoDetectType(c) }));
        schema.push({
            id: 'tbl_' + Date.now() + '_' + idx,
            name: tblName,
            isOpen: true,
            columns: columns
        });
        importedCount++;
    });

    if (importedCount > 0) {
        saveSchema();
    }
    return importedCount;
}
