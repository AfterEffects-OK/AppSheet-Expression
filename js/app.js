// Main Application Controller
import { schema, saveSchema, autoDetectType, importSchemaFromText, setSchema } from './schema.js';
import { functionsList, generateExpression } from './generator.js';

document.addEventListener('DOMContentLoaded', () => {
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
                    <button data-tidx="${tIdx}" data-cidx="${cIdx}" class="btn-del-col text-slate-500 hover:text-rose-400 ml-1"><i class="fa-solid fa-xmark"></i></button>
                </span>
            `).join('');

            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-200">${tbl.name} (${tbl.columns.length} Cols)</span>
                    <div class="space-x-1">
                        <button data-tidx="${tIdx}" class="btn-add-col text-blue-400 hover:underline">＋列追加</button>
                        <button data-tidx="${tIdx}" class="btn-del-table text-slate-500 hover:text-rose-400 ml-2"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1.5 pt-1">
                    ${colsHtml}
                </div>
            `;
            tablesContainer.appendChild(div);
        });

        // イベントバインドの再アタッチ
        document.querySelectorAll('.btn-del-col').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const t = e.currentTarget.dataset.tidx;
                const c = e.currentTarget.dataset.cidx;
                schema[t].columns.splice(c, 1);
                saveSchema();
                renderSchema();
            });
        });

        document.querySelectorAll('.btn-del-table').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const t = e.currentTarget.dataset.tidx;
                schema.splice(t, 1);
                saveSchema();
                renderSchema();
            });
        });

        document.querySelectorAll('.btn-add-col').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const t = e.currentTarget.dataset.tidx;
                const colName = prompt('追加する列名を入力してください:');
                if (!colName) return;
                schema[t].columns.push({ name: colName.trim(), type: autoDetectType(colName) });
                saveSchema();
                renderSchema();
            });
        });

        updateDropdowns();
        updateExpressionOutput();
    }

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

    function updateDropdowns() {
        if (!functionCategory) return;
        const currentVal = functionCategory.value;
        functionCategory.innerHTML = functionsList.map(f => `<option value="${f.id}">${f.label}</option>`).join('');
        if (currentVal) functionCategory.value = currentVal;
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
        updateExpressionOutput();
    }

    function updateExpressionOutput() {
        if (!functionCategory || !resultExpression) return;
        const fnId = functionCategory.value || 'LOOKUP';
        const result = generateExpression(fnId, schema);

        resultExpression.textContent = result.expr;
        if (resultExplanation) resultExplanation.textContent = result.explanation;
        if (resultTip) resultTip.textContent = 'AppSheet公式構文に準拠しています';
        if (helpLink) helpLink.href = result.helpUrl;
    }

    if (functionCategory) {
        functionCategory.addEventListener('change', () => {
            renderConfigParams();
        });
    }

    if (btnCopyResult) {
        btnCopyResult.addEventListener('click', () => {
            navigator.clipboard.writeText(resultExpression.textContent);
            showToast('式をクリップボードにコピーしました！');
        });
    }

    if (btnOpenImport) btnOpenImport.addEventListener('click', () => importModal.classList.remove('hidden'));
    if (btnCancelImport) btnCancelImport.addEventListener('click', () => importModal.classList.add('hidden'));

    if (btnSubmitImport) {
        btnSubmitImport.addEventListener('click', () => {
            const text = modalPasteText.value.trim();
            if (!text) {
                alert('インポートするテキストを入力してください。');
                return;
            }
            const count = importSchemaFromText(text);
            if (count === 0) {
                alert('有効なスキーマ行が見つかりませんでした。');
                return;
            }
            renderSchema();
            importModal.classList.add('hidden');
            modalPasteText.value = '';
            showToast(`${count}件のテーブルを一括インポートしました！`);
        });
    }

    if (btnLoadSample) {
        btnLoadSample.addEventListener('click', () => {
            const sample = [
                { id: 's1', name: '売上履歴', isOpen: true, columns: [
                    { name: 'ID売上', type: 'Text' }, { name: 'ID商品', type: 'Ref' }, { name: '数量', type: 'Number' }, { name: '合計金額', type: 'Price' }, { name: '販売日時', type: 'DateTime' }
                ]},
                { id: 's2', name: '商品マスタ', isOpen: true, columns: [
                    { name: 'ID商品', type: 'Text' }, { name: '商品名', type: 'Text' }, { name: '単価', type: 'Price' }
                ]}
            ];
            setSchema(sample);
            renderSchema();
            showToast('サンプルデータを読み込みました');
        });
    }

    // Initial render
    renderSchema();
});
