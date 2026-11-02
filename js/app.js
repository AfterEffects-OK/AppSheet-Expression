// AppSheet Expression Builder - Main Application Controller

document.addEventListener('DOMContentLoaded', () => {
    // Data & State
    let schema = JSON.parse(localStorage.getItem('appsheet_schema')) || [
        { id: 't1', name: '注文履歴', isOpen: true, columns: [
            { name: 'ID注文', type: 'Text' }, { name: 'ID顧客', type: 'Ref' }, { name: '金額', type: 'Price' },
            { name: '注文日', type: 'Date' }, { name: 'ステータス', type: 'Text' }, { name: '作成日時', type: 'DateTime' }
        ]},
        { id: 't2', name: '顧客マスタ', isOpen: true, columns: [
            { name: 'ID顧客', type: 'Text' }, { name: '顧客名', type: 'Text' }, { name: 'メールアドレス', type: 'Email' }
        ]}
    ];

    // DOM Elements
    const tablesContainer = document.getElementById('tables-container');
    const tableCount = document.getElementById('table-count');
    const newTableNameInput = document.getElementById('new-table-name');
    const quickColumnsInput = document.getElementById('quick-columns-input');
    const btnAddTable = document.getElementById('btn-add-table');
    const functionCategory = document.getElementById('function-category');
    const configParamsContainer = document.getElementById('config-params-container');
    const resultExpression = document.getElementById('result-expression');
    const resultExplanation = document.getElementById('result-explanation');
    const resultTip = document.getElementById('result-tip');
    const helpLink = document.getElementById('help-link');
    const btnCopyResult = document.getElementById('btn-copy-result');
    const importModal = document.getElementById('import-modal');
    const btnOpenImport = document.getElementById('btn-open-import');
    const btnCancelImport = document.getElementById('btn-cancel-import');
    const btnSubmitImport = document.getElementById('btn-submit-import');
    const modalPasteText = document.getElementById('modal-paste-text');
    const btnLoadSample = document.getElementById('btn-load-sample');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    function showToast(msg) {
        toastMsg.textContent = msg;
        toast.classList.remove('translate-y-16', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-16', 'opacity-0');
        }, 2500);
    }

    function saveSchema() {
        localStorage.setItem('appsheet_schema', JSON.stringify(schema));
    }

    function autoDetectType(colName) {
        if (colName.includes('日時') || colName.includes('タイムスタンプ')) return 'DateTime';
        if (colName.includes('日')) return 'Date';
        if (colName.includes('金額') || colName.includes('単価') || colName.includes('価格')) return 'Price';
        if (colName.includes('数') || colName.includes('数量')) return 'Number';
        if (colName.includes('メール')) return 'Email';
        if (colName.startsWith('ID')) return 'Text';
        return 'Text';
    }

    function renderSchema() {
        if (!tablesContainer) return;
        tablesContainer.innerHTML = '';
        if (tableCount) tableCount.textContent = `テーブル数: ${schema.length}`;

        schema.forEach((tbl, tIdx) => {
            const div = document.createElement('div');
            div.className = 'bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2';
            
            let colsHtml = tbl.columns.map((col, cIdx) => `
                <span class="inline-flex items-center bg-slate-900 border border-slate-800 rounded px-2 py-0.5 space-x-1">
                    <span class="text-slate-200 font-medium">${col.name}</span>
                    <span class="text-[10px] text-slate-500">${col.type}</span>
                    <button onclick="window.removeColumn(${tIdx}, ${cIdx})" class="text-slate-500 hover:text-rose-400 ml-1"><i class="fa-solid fa-xmark"></i></button>
                </span>
            `).join('');

            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-200">${tbl.name} (${tbl.columns.length} Cols)</span>
                    <div class="space-x-1">
                        <button onclick="window.addColumnPrompt(${tIdx})" class="text-blue-400 hover:underline">＋列追加</button>
                        <button onclick="window.removeTable(${tIdx})" class="text-slate-500 hover:text-rose-400 ml-2"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1.5 pt-1">
                    ${colsHtml}
                </div>
            `;
            tablesContainer.appendChild(div);
        });
        updateDropdowns();
        generateExpression();
    }

    window.removeTable = function(tIdx) {
        schema.splice(tIdx, 1);
        saveSchema();
        renderSchema();
    };

    window.removeColumn = function(tIdx, cIdx) {
        schema[tIdx].columns.splice(cIdx, 1);
        saveSchema();
        renderSchema();
    };

    window.addColumnPrompt = function(tIdx) {
        const colName = prompt('追加する列名を入力してください:');
        if (!colName) return;
        schema[tIdx].columns.push({ name: colName.trim(), type: autoDetectType(colName) });
        saveSchema();
        renderSchema();
    };

    if (btnAddTable) {
        btnAddTable.addEventListener('click', () => {
            const name = newTableNameInput.value.trim();
            if (!name) {
                alert('テーブル名を入力してください。');
                return;
            }
            const rawCols = quickColumnsInput.value.trim();
            let columns = [{ name: 'ID' + name, type: 'Text' }];
            if (rawCols) {
                columns = rawCols.split(/[\t,]+/).map(c => c.trim()).filter(Boolean).map(c => ({ name: c, type: autoDetectType(c) }));
            }
            schema.push({ id: 't_' + Date.now(), name, isOpen: true, columns });
            newTableNameInput.value = '';
            quickColumnsInput.value = '';
            saveSchema();
            renderSchema();
            showToast('テーブルを追加しました');
        });
    }

    // Function Templates definitions
    const functionsList = [
        { id: 'LOOKUP', label: 'LOOKUP（他テーブルから1項目取得）', syntax: 'LOOKUP(lookup-value, table-name, lookup-column, return-column)', exp: '指定テーブルを検索し、一致するレコードの指定列の値を返します。' },
        { id: 'SELECT', label: 'SELECT（条件に一致するリスト抽出）', syntax: 'SELECT(table-name[column-name], condition)', exp: '条件を満たす行の特定カラムの値をリスト形式で抽出します。' },
        { id: 'SUM', label: 'SUM（合計）', syntax: 'SUM(SELECT(...))', exp: '抽出された数値リストの合計値を算出します。' },
        { id: 'COUNT', label: 'COUNT（件数）', syntax: 'COUNT(SELECT(...))', exp: '抽出されたリストの要素数（件数）をカウントします。' },
        { id: 'CONCATENATE', label: 'CONCATENATE（文字列の結合）', syntax: 'CONCATENATE(text1, text2, ...)', exp: '複数の文字列や列の値を結合します。' }
    ];

    function updateDropdowns() {
        if (!functionCategory) return;
        functionCategory.innerHTML = functionsList.map(f => `<option value="${f.id}">${f.label}</option>`).join('');
        renderConfigParams();
    }

    function renderConfigParams() {
        if (!configParamsContainer) return;
        const selectedId = functionCategory.value;
        configParamsContainer.innerHTML = `
            <div class="text-xs text-slate-400">
                設定パラメータ: <span class="text-emerald-400 font-mono">${selectedId}</span> 関数用の設定項目です。
            </div>
        `;
        generateExpression();
    }

    function generateExpression() {
        if (!functionCategory || !resultExpression) return;
        const fnId = functionCategory.value;
        let expr = '';
        let explanation = '';

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

        resultExpression.textContent = expr;
        if (resultExplanation) resultExplanation.textContent = explanation;
        if (resultTip) resultTip.textContent = 'AppSheet公式構文に準拠しています';
        if (helpLink) helpLink.href = 'https://support.google.com/appsheet/answer/10107471?hl=ja';
    }

    if (functionCategory) {
        functionCategory.addEventListener('change', renderConfigParams);
    }

    // Copy Clipboard
    if (btnCopyResult) {
        btnCopyResult.addEventListener('click', () => {
            navigator.clipboard.writeText(resultExpression.textContent);
            showToast('式をクリップボードにコピーしました！');
        });
    }

    // Modal Controls
    if (btnOpenImport) btnOpenImport.addEventListener('click', () => importModal.classList.remove('hidden'));
    if (btnCancelImport) btnCancelImport.addEventListener('click', () => importModal.classList.add('hidden'));

    // Spreadsheet Draft Import Logic
    if (btnSubmitImport) {
        btnSubmitImport.addEventListener('click', () => {
            const text = modalPasteText.value.trim();
            if (!text) {
                alert('インポートするテキストを入力してください。');
                return;
            }
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

            if (importedCount === 0) {
                alert('有効なスキーマ行が見つかりませんでした。');
                return;
            }

            saveSchema();
            renderSchema();
            importModal.classList.add('hidden');
            modalPasteText.value = '';
            showToast(`${importedCount}件のテーブルを一括インポートしました！`);
        });
    }

    // Sample loader
    if (btnLoadSample) {
        btnLoadSample.addEventListener('click', () => {
            schema = [
                { id: 's1', name: '売上履歴', isOpen: true, columns: [
                    { name: 'ID売上', type: 'Text' }, { name: 'ID商品', type: 'Ref' }, { name: '数量', type: 'Number' }, { name: '合計金額', type: 'Price' }, { name: '販売日時', type: 'DateTime' }
                ]},
                { id: 's2', name: '商品マスタ', isOpen: true, columns: [
                    { name: 'ID商品', type: 'Text' }, { name: '商品名', type: 'Text' }, { name: '単価', type: 'Price' }
                ]}
            ];
            saveSchema();
            renderSchema();
            showToast('サンプルデータを読み込みました');
        });
    }

    // Initial render
    renderSchema();
});
