// Initial Sample Data Schema
const SAMPLE_SCHEMA = [
    {
        id: 'tbl_orders', 
        name: '注文履歴', 
        isOpen: true,
        columns: [
            { name: 'ID注文', type: 'Text' }, 
            { name: 'ID顧客', type: 'Ref' }, 
            { name: '金額', type: 'Price' }, 
            { name: '注文日', type: 'Date' }, 
            { name: 'ステータス', type: 'Text' },
            { name: '作成日時', type: 'DateTime' }, 
            { name: '編集日時', type: 'DateTime' }, 
            { name: '作成者Email', type: 'Email' }, 
            { name: '編集者Email', type: 'Email' }, 
            { name: 'フラグ', type: 'Yes/No' }, 
            { name: 'メモ', type: 'LongText' }
        ] 
    }, 
    {
        id: 'tbl_customers', 
        name: '顧客マスタ', 
        isOpen: true,
        columns: [
            { name: 'ID顧客', type: 'Text' }, 
            { name: '顧客名', type: 'Text' }, 
            { name: 'メールアドレス', type: 'Email' }, 
            { name: '会員ランク', type: 'Text' },
            { name: '作成日時', type: 'DateTime' }, 
            { name: '編集日時', type: 'DateTime' }, 
            { name: '作成者Email', type: 'Email' }, 
            { name: '編集者Email', type: 'Email' }, 
            { name: 'フラグ', type: 'Yes/No' }, 
            { name: 'メモ', type: 'LongText' }
        ] 
    }, 
    {
        id: 'tbl_products', 
        name: '商品マスタ', 
        isOpen: true,
        columns: [
            { name: 'ID商品', type: 'Text' }, 
            { name: '商品名', type: 'Text' }, 
            { name: '単価', type: 'Price' }, 
            { name: '在庫数', type: 'Number' },
            { name: '作成日時', type: 'DateTime' }, 
            { name: '編集日時', type: 'DateTime' }, 
            { name: '作成者Email', type: 'Email' }, 
            { name: '編集者Email', type: 'Email' }, 
            { name: 'フラグ', type: 'Yes/No' }, 
            { name: 'メモ', type: 'LongText' }
        ] 
    }
];

const PRESETS_DATA = {
    customer: {
        name: '顧客マスタ', 
        columns: [
            'ID顧客', '顧客名', 'メールアドレス', '電話番号', '会員ランク', '登録日',
            '作成日時', '編集日時', '作成者Email', '編集者Email', 'フラグ', 'メモ'
        ]
    }, 
    sales: {
        name: '売上履歴', 
        columns: [
            'ID売上', 'ID顧客', '担当者', '合計金額', '売上日時', '支払ステータス',
            '作成日時', '編集日時', '作成者Email', '編集者Email', 'フラグ', 'メモ'
        ]
    }, 
    product: {
        name: '商品マスタ', 
        columns: [
            'ID商品', '商品名', 'カテゴリ', '販売単価', '原価', '在庫数',
            '作成日時', '編集日時', '作成者Email', '編集者Email', 'フラグ', 'メモ'
        ]
    }
};

const COLUMN_TYPES = ['Text', 'Number', 'Price', 'Date', 'DateTime', 'Ref', 'Email', 'Enum', 'Yes/No'];

// State & History Management
let schema = [];
let historyStack = [];
let redoStack = [];
const MAX_HISTORY = 30;
const STORAGE_KEY = 'appsheet_builder_schema_v2';

// DOM Elements
let schemaContainer, selectCategory, toggleThisRow, dynamicInputs;
let codeOutput, textExplanation, textAdvice, statTableCount;
let importModal, btnOpenModal, btnCloseModal, btnCancelModal, btnSubmitImport;
let modalPasteText, dropZone, fileInput;

// Init
window.addEventListener('DOMContentLoaded', () => {
  schemaContainer = document.getElementById('schema-container');
  selectCategory = document.getElementById('select-category');
  toggleThisRow = document.getElementById('toggle-thisrow');
  dynamicInputs = document.getElementById('dynamic-inputs');
  codeOutput = document.getElementById('code-output');
  textExplanation = document.getElementById('text-explanation');
  textAdvice = document.getElementById('text-advice');
  statTableCount = document.getElementById('stat-table-count');

  importModal = document.getElementById('import-modal');
  btnOpenModal = document.getElementById('btn-open-import-modal');
  btnCloseModal = document.getElementById('btn-close-modal');
  btnCancelModal = document.getElementById('btn-cancel-modal');
  btnSubmitImport = document.getElementById('btn-submit-import');
  modalPasteText = document.getElementById('modal-paste-text');
  dropZone = document.getElementById('drop-zone');
  fileInput = document.getElementById('file-input');

  loadSchema();
  renderSchema();
  renderDynamicForm();
  initEvents();
  initModalEvents();
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

function loadSchema() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      schema = JSON.parse(saved);
      schema.forEach(tbl => {
        if (tbl.isOpen === undefined) tbl.isOpen = true;
      });
    } catch (e) {
      schema = JSON.parse(JSON.stringify(SAMPLE_SCHEMA));
    }
  } else {
    schema = JSON.parse(JSON.stringify(SAMPLE_SCHEMA));
  }

  historyStack = [];
  redoStack = [];
  updateUndoRedoUI();
}

function saveSchemaWithoutHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  if (statTableCount) statTableCount.textContent = schema.length;
  renderDynamicForm();
}

function saveSchema() {
  const currentJson = JSON.stringify(schema);
  if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== currentJson) {
    historyStack.push(currentJson);
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    }
  }
  redoStack = [];
  saveSchemaWithoutHistory();
  updateUndoRedoUI();
}

function performUndo() {
  if (historyStack.length === 0) return;
  redoStack.push(JSON.stringify(schema));
  const prev = historyStack.pop();
  schema = JSON.parse(prev);
  saveSchemaWithoutHistory();
  renderSchema();
  updateUndoRedoUI();
  showToast('操作を元に戻しました (Undo)');
}

function performRedo() {
  if (redoStack.length === 0) return;
  historyStack.push(JSON.stringify(schema));
  const next = redoStack.pop();
  schema = JSON.parse(next);
  saveSchemaWithoutHistory();
  renderSchema();
  updateUndoRedoUI();
  showToast('操作をやり直しました (Redo)');
}

function updateUndoRedoUI() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = historyStack.length === 0;
  if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

function initEvents() {
  const quickAddForm = document.getElementById('form-quick-add');
  if (quickAddForm) {
    quickAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tblNameInput = document.getElementById('quick-tbl-name');
      const colListInput = document.getElementById('quick-col-list');

      const tblName = tblNameInput.value.trim() || ('新規テーブル_' + (schema.length + 1));
      const rawCols = colListInput.value
        .split(/[\n\r\t,]+/)
        .map(c => c.trim())
        .filter(Boolean);

      const columns = rawCols.length > 0 
        ? rawCols.map(c => ({ name: c, type: autoDetectType(c) }))
        : [{ name: 'ID', type: 'Text' }];

      saveSchema();

      schema.push({
        id: 'tbl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        name: tblName,
        isOpen: true,
        columns: columns
      });

      tblNameInput.value = '';
      colListInput.value = '';

      saveSchemaWithoutHistory();
      renderSchema();
      showToast(`テーブル「${tblName}」を作成しました`);
    });
  }

  const btnLoadSample = document.getElementById('btn-load-sample');
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => {
      saveSchema();
      schema = JSON.parse(JSON.stringify(SAMPLE_SCHEMA));
      saveSchemaWithoutHistory();
      renderSchema();
      showToast('サンプルデータを取り込みました');
    });
  }

  const btnClearAll = document.getElementById('btn-clear-all');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (confirm('登録されたテーブル定義をすべて消去しますか？')) {
        saveSchema();
        schema = [];
        saveSchemaWithoutHistory();
        renderSchema();
        showToast('すべてのテーブルをクリアしました');
      }
    });
  }

  if (selectCategory) selectCategory.addEventListener('change', renderDynamicForm);
  if (toggleThisRow) toggleThisRow.addEventListener('change', updateGeneratedExpression);
  
  const btnCopy = document.getElementById('btn-copy');
  if (btnCopy) btnCopy.addEventListener('click', copyToClipboard);

  const btnUndoEl = document.getElementById('btn-undo');
  const btnRedoEl = document.getElementById('btn-redo');
  if (btnUndoEl) btnUndoEl.addEventListener('click', performUndo);
  if (btnRedoEl) btnRedoEl.addEventListener('click', performRedo);

  const inputFuncSearch = document.getElementById('input-func-search');
  if (inputFuncSearch) {
    inputFuncSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const options = selectCategory.querySelectorAll('option');
      options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        const val = opt.value.toLowerCase();
        if (!query || text.includes(query) || val.includes(query)) {
          opt.style.display = '';
        } else {
          opt.style.display = 'none';
        }
      });
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        performRedo();
      } else {
        performUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      performRedo();
    }
  });
}

function initModalEvents() {
  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
      importModal.classList.remove('opacity-0', 'pointer-events-none');
    });
  }

  const closeModal = () => {
    importModal.classList.add('opacity-0', 'pointer-events-none');
    if (modalPasteText) modalPasteText.value = '';
  };

  if (btnCloseModal) closeModal();
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  if (btnSubmitImport) {
      btnSubmitImport.addEventListener('click', () => {
          const text = modalPasteText.value.trim();
          if (!text) {
              alert('インポートするテキストを入力してください。');
              return;
          }
          const lines = text.split(/[\r\n]+/);
          let importedCount = 0;
          saveSchema();
  
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
              if (!tblName || tblName === '') {
                  tblName = 'テーブル_' + (schema.length + 1);
              }
  
              const columns = rawCols.map(c => ({
                  name: c,
                  type: autoDetectType(c)
              }));
  
              schema.push({
                  id: 'tbl_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5),
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
  
          saveSchemaWithoutHistory();
          renderSchema();
          closeModal();
          showToast(`${importedCount}件のテーブルを一括インポートしました！`);
      });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-500');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
  }
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (modalPasteText) modalPasteText.value = e.target.result;
  };
  reader.readAsText(file);
}

function autoDetectType(name) {
  if (name.startsWith('ID') || name.includes('コード')) return 'Text';
  if (name.includes('日') && !name.includes('日時') || name.includes('Date')) return 'Date';
  if (name.includes('日時') || name.includes('時間') || name.includes('作成日時') || name.includes('編集日時')) return 'DateTime';
  if (name.includes('金額') || name.includes('単価') || name.includes('価格')) return 'Price';
  if (name.includes('数') || name.includes('数量') || name.includes('ポイント') || name.includes('在庫数')) return 'Number';
  if (name.includes('メール') || name.includes('Email')) return 'Email';
  if (name.includes('フラグ')) return 'Yes/No';
  if (name.includes('メモ')) return 'LongText';
  return 'Text';
}

function renderSchema() {
  if (!schemaContainer) return;
  schemaContainer.innerHTML = '';

  if (schema.length === 0) {
    schemaContainer.innerHTML = `
      <div class="text-center py-10 text-slate-500 text-xs">
        <p>登録されているテーブルはありません。</p>
        <p class="mt-1">上のフォームまたはサンプル読み込みをご利用ください。</p>
      </div>
    `;
    if (statTableCount) statTableCount.textContent = '0';
    renderDynamicForm();
    updateUndoRedoUI();
    return;
  }

  if (statTableCount) statTableCount.textContent = schema.length;

  schema.forEach((tbl) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition';

    const colsHTML = tbl.columns.map((col, cIdx) => `
      <div class="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg text-xs group/col">
        <div class="flex items-center gap-2">
          <span class="text-slate-200 font-medium">${escapeHtml(col.name)}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700/60">${col.type}</span>
        </div>
        <button type="button" onclick="removeColumn('${tbl.id}', ${cIdx})" class="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer" title="カラムを削除">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `).join('');

    const isOpen = tbl.isOpen !== false;

    card.innerHTML = `
      <div class="flex items-center justify-between pb-2 ${isOpen && tbl.columns.length > 0 ? 'border-b border-slate-800/80' : ''}">
        <div class="flex items-center gap-2 cursor-pointer select-none flex-1" onclick="toggleTableCollapse('${tbl.id}')">
          <i data-lucide="${isOpen ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4 text-blue-400 transition-transform"></i>
          <i data-lucide="database" class="w-3.5 h-3.5 text-blue-400"></i>
          <span class="font-semibold text-xs text-white">${escapeHtml(tbl.name)}</span>
          <span class="text-[10px] text-slate-500 font-mono">(${tbl.columns.length} Cols)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick="addColumnPrompt('${tbl.id}')" class="text-[11px] text-blue-400 hover:text-blue-300 px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition cursor-pointer">＋列追加</button>
          <button type="button" onclick="removeTable('${tbl.id}')" class="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer" title="テーブル削除">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
      <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1 ${isOpen ? '' : 'hidden'}">
        ${colsHTML}
      </div>
    `;
    schemaContainer.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
  renderDynamicForm();
  updateUndoRedoUI();
}

window.toggleTableCollapse = (id) => {
  const tbl = schema.find(t => t.id === id);
  if (tbl) {
    tbl.isOpen = tbl.isOpen === false ? true : false;
    saveSchemaWithoutHistory();
    renderSchema();
  }
};

window.removeTable = (id) => {
  saveSchema();
  schema = schema.filter(t => t.id !== id);
  saveSchemaWithoutHistory();
  renderSchema();
  showToast('テーブルを削除しました');
};

window.removeColumn = (tblId, cIdx) => {
  const tbl = schema.find(t => t.id === tblId);
  if (tbl && tbl.columns.length > 1) {
    saveSchema();
    tbl.columns.splice(cIdx, 1);
    saveSchemaWithoutHistory();
    renderSchema();
  } else {
    alert('最低1つのカラムが必要です。');
  }
};

window.addColumnPrompt = (tblId) => {
  const colName = prompt('追加するカラム名を入力してください:');
  if (colName && colName.trim()) {
    const tbl = schema.find(t => t.id === tblId);
    if (tbl) {
      saveSchema();
      tbl.columns.push({ name: colName.trim(), type: autoDetectType(colName.trim()) });
      saveSchemaWithoutHistory();
      renderSchema();
    }
  }
};

window.addPresetTable = (key) => {
  const p = PRESETS_DATA[key];
  if (!p) return;
  saveSchema();
  schema.push({
    id: 'tbl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    name: p.name,
    isOpen: true,
    columns: p.columns.map(c => ({ name: c, type: autoDetectType(c) }))
  });
  saveSchemaWithoutHistory();
  renderSchema();
  showToast(`プリセット「${p.name}」を追加しました`);
};

function getAllColumnsFlatOptions() {
  let html = '';
  schema.forEach(tbl => {
    tbl.columns.forEach(col => {
      html += `<option value="${escapeHtml(col.name)}">${escapeHtml(tbl.name)} : ${escapeHtml(col.name)}</option>`;
    });
  });
  return html;
}

window.insertColumnToInput = (inputElId, colBracketName) => {
  const inputEl = document.getElementById(inputElId);
  if (!inputEl) return;
  const start = inputEl.selectionStart;
  const end = inputEl.selectionEnd;
  const val = inputEl.value;
  inputEl.value = val.substring(0, start) + colBracketName + val.substring(end);
  inputEl.focus();
  inputEl.selectionStart = inputEl.selectionEnd = start + colBracketName.length;
  updateGeneratedExpression();
};

window.insertColumnToFilter = (colBracketName) => {
  const inputEl = document.getElementById('filter-cond-expr');
  if (!inputEl) return;
  const start = inputEl.selectionStart;
  const end = inputEl.selectionEnd;
  const val = inputEl.value;
  inputEl.value = val.substring(0, start) + colBracketName + val.substring(end);
  inputEl.focus();
  inputEl.selectionStart = inputEl.selectionEnd = start + colBracketName.length;
  updateGeneratedExpression();
};

window.onLookupTableChange = () => {
  const tIdx = document.getElementById('lookup-target-table').value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;

  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('lookup-result-col').innerHTML = colsHTML;
  document.getElementById('lookup-match-col').innerHTML = colsHTML;

  updateGeneratedExpression();
};

window.onSelectTableChange = () => {
  const tIdx = document.getElementById('select-target-table').value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;

  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('select-target-col').innerHTML = colsHTML;
  document.getElementById('select-cond-col').innerHTML = colsHTML;

  updateGeneratedExpression();
};

window.onDerefRefColChange = () => {
  const derefRefColEl = document.getElementById('deref-ref-col');
  const targetColSelect = document.getElementById('deref-target-col');
  if (!derefRefColEl || !targetColSelect) return;

  const selectedVal = derefRefColEl.value;
  const colName = selectedVal.split(' : ')[1] || '';

  let targetTableName = '顧客マスタ';
  if (colName.includes('顧客') || colName.includes('Customer')) {
    targetTableName = '顧客マスタ';
  } else if (colName.includes('商品') || colName.includes('Product')) {
    targetTableName = '商品マスタ';
  } else {
    const matchedTable = schema.find(t => colName.toLowerCase().includes(t.name.toLowerCase()));
    if (matchedTable) {
      targetTableName = matchedTable.name;
    }
  }

  const targetTable = schema.find(t => t.name === targetTableName) || schema[0];
  if (targetTable && targetTable.columns) {
    targetColSelect.innerHTML = targetTable.columns
      .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`)
      .join('');
  } else {
    targetColSelect.innerHTML = '<option value="">(カラムなし)</option>';
  }

  updateGeneratedExpression();
};

window.onFilterTableChange = () => {
  const tIdx = document.getElementById('filter-target-table')?.value;
  const targetTable = schema[tIdx];
  const sel = document.getElementById('filter-col-selector');
  if (!sel) return;
  
  if (!targetTable || !targetTable.columns) {
    sel.innerHTML = '';
    updateGeneratedExpression();
    return;
  }
  
  sel.innerHTML = targetTable.columns.map(c => `<option value="[${escapeHtml(c.name)}]">[${escapeHtml(c.name)}] (${c.type})</option>`).join('');
  updateGeneratedExpression();
};

window.onAggTableChange = () => {
  const tIdx = document.getElementById('agg-target-table').value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;

  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('agg-target-col').innerHTML = colsHTML;
  document.getElementById('agg-cond-col').innerHTML = colsHTML;

  updateGeneratedExpression();
};

window.onExistTableChange = () => {
  const tIdx = document.getElementById('exist-target-table').value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;

  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('exist-target-col').innerHTML = colsHTML;

  updateGeneratedExpression();
};

window.onCompSumTableChange = () => {
  const tIdx = document.getElementById('comp-sum-table')?.value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;
  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('comp-sum-col').innerHTML = colsHTML;
  document.getElementById('comp-sum-cond').innerHTML = colsHTML;
  updateGeneratedExpression();
};

window.onCompDupTableChange = () => {
  const tIdx = document.getElementById('comp-dup-table')?.value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;
  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('comp-dup-col').innerHTML = colsHTML;
  updateGeneratedExpression();
};

window.onCompInTableChange = () => {
  const tIdx = document.getElementById('comp-in-table')?.value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;
  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('comp-in-col').innerHTML = colsHTML;
  updateGeneratedExpression();
};

let lastFocusedInputId = '';
document.addEventListener('focusin', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && e.target.id) {
    lastFocusedInputId = e.target.id;
  }
});

window.insertColumnToActiveInput = (colBracketName) => {
  const targetId = lastFocusedInputId || document.querySelector('#dynamic-inputs input, #dynamic-inputs textarea')?.id;
  if (!targetId) return;
  insertColumnToInput(targetId, colBracketName);
};

function renderDynamicForm() {
  if (!selectCategory) return;
  const category = selectCategory.value;
  dynamicInputs.innerHTML = '';

  if (schema.length === 0) {
    dynamicInputs.innerHTML = `<p class="text-xs text-amber-400">※ テーブル構造を1つ以上登録してください。</p>`;
    updateGeneratedExpression();
    return;
  }

  const tableOptions = schema.map((t, idx) => `<option value="${idx}">${escapeHtml(t.name)}</option>`).join('');

  if (category === 'LOOKUP') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">取得したい参照先テーブル</label>
          <select id="lookup-target-table" onchange="onLookupTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">取得したい結果カラム</label>
          <select id="lookup-result-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">参照先テーブルの照合カラム</label>
          <select id="lookup-match-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">現在の検索キー項目</label>
          <select id="lookup-key-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${getAllColumnsFlatOptions()}</select>
        </div>
      </div>
    `;
    onLookupTableChange();
  } 
  else if (category === 'DEREF') {
    let refColOptions = '';
    schema.forEach(tbl => {
      tbl.columns.forEach(col => {
        refColOptions += `<option value="${escapeHtml(tbl.name)} : ${escapeHtml(col.name)}">${escapeHtml(tbl.name)} : ${escapeHtml(col.name)} (${col.type})</option>`;
      });
    });

    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">Ref型の参照カラム（自テーブル）</label>
          <select id="deref-ref-col" onchange="onDerefRefColChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${refColOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">参照先テーブルで取得したい項目名</label>
          <select id="deref-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"></select>
        </div>
      </div>
    `;
    onDerefRefColChange();
  }
  else if (category === 'REF_ROWS') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">関連子テーブル</label>
          <select id="refrows-target-table" onchange="onRefRowsTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">子テーブル側のRef型親キーカラム</label>
          <select id="refrows-ref-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"></select>
        </div>
      </div>
    `;
    onRefRowsTableChange();
  }
  else if (category === 'SELECT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象テーブル</label>
          <select id="select-target-table" onchange="onSelectTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">抽出したい対象カラム</label>
          <select id="select-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">条件カラム</label>
          <select id="select-cond-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">比較値 / 現在行のカラム</label>
          <select id="select-thisrow-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${getAllColumnsFlatOptions()}</select>
        </div>
      </div>
      <div class="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
        <span class="text-[11px] text-slate-400 font-medium">列をクイック挿入:</span>
        <select id="common-col-selector" class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none">${getAllColumnsFlatOptions()}</select>
        <button type="button" onclick="insertColumnToActiveInput(document.getElementById('common-col-selector').value)" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl transition shrink-0 cursor-pointer">挿入</button>
      </div>
    `;
    onSelectTableChange();
  }
  else if (category === 'FILTER') {
    dynamicInputs.innerHTML = `
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">対象テーブル</label>
            <select id="filter-target-table" onchange="onFilterTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${tableOptions}</select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">テーブルの列を挿入</label>
            <div class="flex gap-1.5">
              <select id="filter-col-selector" class="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
              <button type="button" onclick="insertColumnToFilter(document.getElementById('filter-col-selector').value)" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shrink-0 cursor-pointer">挿入</button>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">絞り込み条件式</label>
          <input type="text" id="filter-cond-expr" value='[ステータス] = "進行中"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    onFilterTableChange();
  }
  else if (category === 'LIST') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">リストに含める要素 (カンマ区切り)</label>
        <input type="text" id="list-elements" value='"Apple", "Banana", "Orange"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'SPLIT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象カラム / 文字列</label>
          <select id="split-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">区切り文字 (Delimiter)</label>
          <input type="text" id="split-delimiter" value="," oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'INTERSECT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">リスト 1</label>
          <input type="text" id="intersect-list1" value='LIST("A", "B", "C")' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">リスト 2</label>
          <input type="text" id="intersect-list2" value='LIST("B", "C", "D")' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'UNIQUE') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">重複除去したい対象リスト (SELECT/LIST式)</label>
        <input type="text" id="unique-target-list" value='SELECT(注文履歴[ID顧客], TRUE)' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'AGGREGATE' || category === 'SUM' || category === 'COUNT' || category === 'AVERAGE' || category === 'MAX' || category === 'MIN') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象テーブル</label>
          <select id="agg-target-table" onchange="onAggTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">集計数値カラム</label>
          <select id="agg-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">絞り込み条件カラム</label>
          <select id="agg-cond-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
        <div class="sm:col-span-3">
          <label class="block text-slate-400 mb-1.5 font-medium">一致させる自行のカラム</label>
          <select id="agg-thisrow-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
      </div>
    `;
    onAggTableChange();
  }
  else if (category === 'MAXROW' || category === 'MINROW') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象テーブル</label>
          <select id="maxrow-target-table" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">比較・評価する数値/日付カラム</label>
          <select id="maxrow-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'STDEVP') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">標準偏差を求める数値リスト (SELECT式など)</label>
        <input type="text" id="stdevp-target-list" value='SELECT(テスト結果[点数], TRUE)' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'IFS') {
    dynamicInputs.innerHTML = `
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">評価対象のカラム</label>
            <select id="ifs-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
          </div>
        </div>
        <div class="border-t border-slate-800/80 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">条件 1</label>
            <input type="text" id="ifs-cond-1" value='= "完了"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">結果 1</label>
            <input type="text" id="ifs-res-1" value='"完了済"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">条件 2</label>
            <input type="text" id="ifs-cond-2" value='= "処理中"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">結果 2</label>
            <input type="text" id="ifs-res-2" value='"対応中"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">デフォルト結果 (TRUE)</label>
          <input type="text" id="ifs-res-default" value='"未設定"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'SWITCH') {
    dynamicInputs.innerHTML = `
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">判定対象の式/カラム</label>
          <select id="switch-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">値 1</label>
            <input type="text" id="switch-val-1" value='"A"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">結果 1</label>
            <input type="text" id="switch-res-1" value='"優"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">値 2</label>
            <input type="text" id="switch-val-2" value='"B"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">結果 2</label>
            <input type="text" id="switch-res-2" value='"良"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">デフォルト値 (不一致時)</label>
          <input type="text" id="switch-default" value='"可"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'IF') {
    dynamicInputs.innerHTML = `
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">条件式</label>
          <input type="text" id="if-cond" value="[金額] > 10000" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">真(True)の場合の値</label>
            <input type="text" id="if-true-val" value='"高額"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">偽(False)の場合の値</label>
            <input type="text" id="if-false-val" value='"通常"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'AND_OR') {
    dynamicInputs.innerHTML = `
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">結合タイプ</label>
          <select id="andor-type" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="AND">AND（すべての条件を満たす）</option>
            <option value="OR">OR（いずれかの条件を満たす）</option>
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">条件 1</label>
            <input type="text" id="andor-cond1" value='[ステータス] = "完了"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1.5 font-medium">条件 2</label>
            <input type="text" id="andor-cond2" value='[金額] >= 5000' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
          </div>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'NOT') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">反転させたい条件式</label>
        <input type="text" id="not-cond" value='[ステータス] = "非表示"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'EXISTS') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象テーブル</label>
          <select id="exist-target-table" onchange="onExistTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">検証カラム</label>
          <select id="exist-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">比較する自カラム</label>
          <select id="exist-thisrow-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">判定タイプ</label>
          <select id="exist-mode" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="NOT_EXISTS">存在しないことを確認 (Valid_If用)</option>
            <option value="EXISTS">存在することを確認 (Yes/No用)</option>
          </select>
        </div>
      </div>
    `;
    onExistTableChange();
  }
  else if (category === 'ISBLANK') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象カラム</label>
          <select id="isblank-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">判定モード</label>
          <select id="isblank-mode" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="ISBLANK">ISBLANK（空の場合TRUE）</option>
            <option value="ISNOTBLANK">ISNOTBLANK（入力済の場合TRUE）</option>
          </select>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'IN') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">検索する値/カラム</label>
          <select id="in-val-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">検索対象のリスト</label>
          <input type="text" id="in-target-list" value='LIST("管理者", "マネージャー")' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'CONTAINS') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象文字列/カラム</label>
          <select id="contains-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">検索キーワード</label>
          <input type="text" id="contains-keyword" value="AppSheet" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'CONCATENATE') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">結合する要素 (カンマ区切り)</label>
        <input type="text" id="concat-args" value='[姓], " ", [名]' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'TEXT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象数値/日付カラム</label>
          <select id="text-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">フォーマット文字列</label>
          <input type="text" id="text-format" value="yyyy/MM/dd" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LEFT_RIGHT_MID') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">関数</label>
          <select id="lrm-func" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="LEFT">LEFT</option>
            <option value="RIGHT">RIGHT</option>
            <option value="MID">MID</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象カラム</label>
          <select id="lrm-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">パラメータ</label>
          <input type="text" id="lrm-params" value="3" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'SUBSTITUTE') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象カラム</label>
          <select id="sub-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">検索文字列</label>
          <input type="text" id="sub-old" value="-" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">置換後</label>
          <input type="text" id="sub-new" value="" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'INDEX') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象リスト</label>
          <input type="text" id="index-list" value='SPLIT([タグ], ",")' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">取得位置 (1始まり)</label>
          <input type="number" id="index-pos" value="1" min="1" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LOWER_UPPER') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">関数</label>
          <select id="lu-func" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="LOWER">LOWER</option>
            <option value="UPPER">UPPER</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象カラム</label>
          <select id="lu-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'TODAY_NOW') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">取得する関数</label>
        <select id="todaynow-func" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
          <option value="TODAY">TODAY()</option>
          <option value="NOW">NOW()</option>
          <option value="TIMENOW">TIMENOW()</option>
        </select>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'DATE_CONSTRUCT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">年</label>
          <input type="text" id="date-y" value="2026" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">月</label>
          <input type="text" id="date-m" value="11" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">日</label>
          <input type="text" id="date-d" value="1" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'WORKDAY') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">基準日</label>
          <input type="text" id="workday-start" value="TODAY()" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">加算営業日数</label>
          <input type="number" id="workday-days" value="5" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'EOMONTH') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">基準日</label>
          <input type="text" id="eomonth-start" value="TODAY()" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">加減月数</label>
          <input type="number" id="eomonth-months" value="0" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'USER_INFO') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">取得するユーザー情報</label>
        <select id="user-info-func" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
          <option value="USEREMAIL">USEREMAIL()</option>
          <option value="USERNAME">USERNAME()</option>
          <option value="USERROLE">USERROLE()</option>
        </select>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'CONTEXT') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">取得するコンテキスト情報</label>
        <select id="context-option" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
          <option value='"View"'>CONTEXT("View")</option>
          <option value='"ViewType"'>CONTEXT("ViewType")</option>
          <option value='"AppName"'>CONTEXT("AppName")</option>
          <option value='"Host"'>CONTEXT("Host")</option>
        </select>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'HERE') {
    dynamicInputs.innerHTML = `
      <div class="text-xs text-slate-400">
        <p>引数は必要ありません。デバイスの現在位置（GPS座標）を自動取得します。</p>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LATLONG') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">緯度 (Latitude)</label>
          <input type="text" id="latlong-lat" value="34.6617" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">経度 (Longitude)</label>
          <input type="text" id="latlong-lng" value="133.9350" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LAT' || category === 'LONG') {
    let latLongOptions = '<option value="HERE()">[現在地] HERE()</option>';
    schema.forEach(tbl => {
      tbl.columns.forEach(col => {
        latLongOptions += `<option value="[${escapeHtml(col.name)}]">${escapeHtml(tbl.name)} : ${escapeHtml(col.name)} (${col.type})</option>`;
      });
    });

    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">対象のLatLongカラム / 式</label>
        <select id="latlong-target-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${latLongOptions}</select>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'ROUND') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">端数処理関数</label>
          <select id="round-func" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="ROUND">ROUND</option>
            <option value="CEILING">CEILING</option>
            <option value="FLOOR">FLOOR</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象数値/式</label>
          <input type="text" id="round-num" value="[単価] * 1.1" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'ABS') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">対象数値/カラム</label>
        <input type="text" id="abs-num" value="[差額]" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'RANDBETWEEN') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">最小値</label>
          <input type="number" id="rand-min" value="1000" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">最大値</label>
          <input type="number" id="rand-max" value="9999" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  } 
  else if (category === 'MOD') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">被除数 (割られる数)</label>
          <input type="text" id="mod-num" value="[数量]" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">除数 (割る数)</label>
          <input type="text" id="mod-divisor" value="5" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'POWER') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">底 (基の数値)</label>
          <input type="text" id="power-base" value="2" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">指数 (べき乗数)</label>
          <input type="text" id="power-exp" value="3" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'OCRTEXT') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">対象の画像/ドキュメントカラム</label>
        <select id="ocr-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'SORT') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">並び替える対象のリスト (SELECT等)</label>
        <input type="text" id="sort-list" value='SELECT(商品マスタ[商品名], TRUE)' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'ORDERBY') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div class="sm:col-span-3">
          <label class="block text-slate-400 mb-1.5 font-medium">並び替える対象リスト (SELECT等)</label>
          <input type="text" id="orderby-list" value='SELECT(商品マスタ[ID商品], TRUE)' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">基準にする並び替えカラム</label>
          <select id="orderby-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">方向 (昇順/降順)</label>
          <select id="orderby-dir" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">
            <option value="TRUE">昇順 (True = 昇順)</option>
            <option value="FALSE">降順 (False = 降順)</option>
          </select>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LINKTOVIEW') {
    dynamicInputs.innerHTML = `
      <div class="space-y-2 text-xs">
        <label class="block text-slate-400 font-medium">遷移先のビュー名</label>
        <input type="text" id="link-viewname" value="注文履歴_Detail" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LINKTOROW') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">レコードの行キー (ID/Ref列)</label>
          <select id="link-row-key" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">表示するビュー名</label>
          <input type="text" id="link-row-view" value="商品マスタ_Detail" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LINKTOFORM') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象のフォームビュー名</label>
          <input type="text" id="link-form-name" value="売上履歴_Form" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">初期値をセットするカラム</label>
          <select id="link-form-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'LINKTOFILTEREDVIEW') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">ベースのビュー名</label>
          <input type="text" id="link-filt-view" value="商品マスタ_Gallery" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">絞り込み条件式 (Filter Condition)</label>
          <input type="text" id="link-filt-cond" value='[ステータス] = "有効"' oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  }
  else if (category === 'COMPOSITE_IF_SUM') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">集計対象テーブル (子/関連)</label>
          <select id="comp-sum-table" onchange="onCompSumTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">合計する金額/数値カラム</label>
          <select id="comp-sum-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">条件一致カラム (外部キー)</label>
          <select id="comp-sum-cond" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">判定のしきい値</label>
          <input type="number" id="comp-sum-threshold" value="100000" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    onCompSumTableChange();
  } 
  else if (category === 'COMPOSITE_ISBLANK_FILTER') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">チェック対象テーブル</label>
          <select id="comp-dup-table" onchange="onCompDupTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">重複チェックするカラム</label>
          <select id="comp-dup-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
      </div>
    `;
    onCompDupTableChange();
  } 
  else if (category === 'COMPOSITE_INDEX_SPLIT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象の文字列カラム</label>
          <select id="comp-split-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${getAllColumnsFlatOptions()}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">取得するインデックス位置</label>
          <input type="number" id="comp-split-pos" value="1" min="1" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
      </div>
    `;
    updateGeneratedExpression();
  } 
  else if (category === 'COMPOSITE_IN_SELECT') {
    dynamicInputs.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">判定する値</label>
          <input type="text" id="comp-in-val" value="USEREMAIL()" oninput="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none">
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">対象リストテーブル</label>
          <select id="comp-in-table" onchange="onCompInTableChange()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none">${tableOptions}</select>
        </div>
        <div>
          <label class="block text-slate-400 mb-1.5 font-medium">抽出するカラム</label>
          <select id="comp-in-col" onchange="updateGeneratedExpression()" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"></select>
        </div>
      </div>
    `;
    onCompInTableChange();
  }
}

window.onRefRowsTableChange = () => {
  const tIdx = document.getElementById('refrows-target-table').value;
  const targetTable = schema[tIdx];
  if (!targetTable) return;

  const colsHTML = targetTable.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
  document.getElementById('refrows-ref-col').innerHTML = colsHTML;

  updateGeneratedExpression();
};

function updateGeneratedExpression() {
  if (schema.length === 0) {
    codeOutput.textContent = '-- テーブルが登録されていません --';
    textExplanation.textContent = 'テーブル構造を追加すると式が自動生成されます。';
    textAdvice.textContent = '-';
    return;
  }

  if (!selectCategory) return;
  const category = selectCategory.value;
  const useThisRow = toggleThisRow ? toggleThisRow.checked : true;
  const thisRowPrefix = useThisRow ? '[_THISROW].' : '';

  let expression = '';
  let syntaxText = '';
  let descText = '';
  let advice = '';

  if (category === 'LOOKUP') {
    const tIdx = document.getElementById('lookup-target-table')?.value;
    const targetTable = schema[tIdx];
    const resCol = document.getElementById('lookup-result-col')?.value || 'Column';
    const matchCol = document.getElementById('lookup-match-col')?.value || 'ID';
    const keyCol = document.getElementById('lookup-key-col')?.value || 'KeyID';

    if (targetTable) {
      expression = 'LOOKUP(' + thisRowPrefix + '[' + keyCol + '], "' + targetTable.name + '", "' + matchCol + '", "' + resCol + '")';
      syntaxText = '構文: LOOKUP(lookup-value, table-name, lookup-column, return-column)';
      descText = '「' + targetTable.name + '」テーブルを検索し、' + matchCol + ' が現在行の [' + keyCol + '] と一致するレコードの [' + resCol + '] の値を取り出します。';
      advice = 'LOOKUP関数は非常によく使われますが、大きなテーブルでは処理が重くなる場合があります。Ref型の列を設定している場合は [Ref列名].[' + resCol + ']（De-reference構造）を使用する方がより高速です。';
    }
  } 
  else if (category === 'DEREF') {
    const refColFull = document.getElementById('deref-ref-col')?.value || '注文履歴 : ID注文';
    const refCol = refColFull.split(' : ')[1] || 'ID注文';
    const targetCol = document.getElementById('deref-target-col')?.value || '顧客名';
    
    expression = '[' + refCol + '].[' + targetCol + ']';
    syntaxText = '構文: [Ref列].[取得したい項目名]';
    descText = 'Ref型カラム [' + refCol + '] が参照している先のリレーションテーブルから、指定した [' + targetCol + '] の値を直接取得（デリファレンス）します。';
    advice = 'LOOKUPよりも処理性能が格段に高く、AppSheetでの最も推奨される参照テクニックです。';
  }
  else if (category === 'REF_ROWS') {
    const tIdx = document.getElementById('refrows-target-table')?.value;
    const targetTable = schema[tIdx];
    const refCol = document.getElementById('refrows-ref-col')?.value || 'RefColumn';
    if (targetTable) {
      expression = 'REF_ROWS("' + targetTable.name + '", "' + refCol + '")';
      syntaxText = '構文: REF_ROWS(table-name, ref-column)';
      descText = '「' + targetTable.name + '」テーブル内で、[' + refCol + '] が現在行のキーと一致する子レコードのリスト（Related List）を自動取得します。';
      advice = '親テーブルに作成される Related ... Virtual Column で自動生成される標準的な式です。';
    }
  }
  else if (category === 'SELECT') {
    const tIdx = document.getElementById('select-target-table')?.value;
    const targetTable = schema[tIdx];
    const targetCol = document.getElementById('select-target-col')?.value || 'Column';
    const condCol = document.getElementById('select-cond-col')?.value || 'Status';
    const thisRowCol = document.getElementById('select-thisrow-col')?.value || 'ID';

    if (targetTable) {
      expression = 'SELECT(' + targetTable.name + '[' + targetCol + '], [' + condCol + '] = ' + thisRowPrefix + '[' + thisRowCol + '])';
      syntaxText = '構文: SELECT(column-to-select, condition)';
      descText = '「' + targetTable.name + '」テーブルから、[' + condCol + '] が現在行の [' + thisRowCol + '] と一致する全レコードの [' + targetCol + '] をリストとして取得します。';
      advice = '戻り値は List（配列）型です。Virtual Columnの参照リストやEnumListの選択肢候補に有効です。';
    }
  }
  else if (category === 'FILTER') {
    const tIdx = document.getElementById('filter-target-table')?.value;
    const targetTable = schema[tIdx];
    const condExpr = document.getElementById('filter-cond-expr')?.value || 'TRUE';
    if (targetTable) {
      expression = 'FILTER("' + targetTable.name + '", ' + condExpr + ')';
      syntaxText = '構文: FILTER(table-name, condition)';
      descText = '「' + targetTable.name + '」テーブルから条件（' + condExpr + '）に合致する行の「キー列」のリストを取得します。';
      advice = 'SELECT(Table[Key], 条件) と同等の動きをし、コードがシンプルになります。';
    }
  }
  else if (category === 'LIST') {
    const elems = document.getElementById('list-elements')?.value || '';
    expression = 'LIST(' + elems + ')';
    syntaxText = '構文: LIST(element1, element2, ...)';
    descText = '指定した複数の要素をまとめた新しい List（配列）を生成します。';
    advice = 'EnumListのカラム初期値や、IN()関数の検索対象リストの生成に役立ちます。';
  }
  else if (category === 'SPLIT') {
    const targetCol = document.getElementById('split-target-col')?.value || 'TextCol';
    const delim = document.getElementById('split-delimiter')?.value || ',';
    expression = 'SPLIT([' + targetCol + '], "' + delim + '")';
    syntaxText = '構文: SPLIT(text, delimiter)';
    descText = '[' + targetCol + '] の文字列を区切り文字で分割し、要素の List に変換します。';
    advice = 'CSV文字列やカンマ区切りテキストを個別要素として分解して処理する際に重宝します。';
  }
  else if (category === 'INTERSECT') {
    const l1 = document.getElementById('intersect-list1')?.value || 'LIST()';
    const l2 = document.getElementById('intersect-list2')?.value || 'LIST()';
    expression = 'INTERSECT(' + l1 + ', ' + l2 + ')';
    syntaxText = '構文: INTERSECT(list1, list2)';
    descText = '2つのリストに共通して存在する要素のみを抽出した新しいリストを返します。';
    advice = 'ユーザーの保持する権限リストと必要権限リストの重複チェックなどに活用されます。';
  }
  else if (category === 'UNIQUE') {
    const listExpr = document.getElementById('unique-target-list')?.value || 'LIST()';
    expression = 'UNIQUE(' + listExpr + ')';
    syntaxText = '構文: UNIQUE(list)';
    descText = 'リストの中から重複する要素を除外した一意なリストを生成します。';
    advice = '重複のない選択肢リストをフォームに提示したい場合に便利です。';
  }
  else if (category === 'AGGREGATE' || category === 'SUM' || category === 'COUNT' || category === 'AVERAGE' || category === 'MAX' || category === 'MIN') {
    const tIdx = document.getElementById('agg-target-table')?.value;
    const targetTable = schema[tIdx];
    const targetCol = document.getElementById('agg-target-col')?.value || 'Amount';
    const condCol = document.getElementById('agg-cond-col')?.value || 'ID';
    const thisRowCol = document.getElementById('agg-thisrow-col')?.value || 'ID';
    const funcName = category === 'AGGREGATE' ? (document.getElementById('agg-func')?.value || 'SUM') : category;

    if (targetTable) {
      expression = funcName + '(SELECT(' + targetTable.name + '[' + targetCol + '], [' + condCol + '] = ' + thisRowPrefix + '[' + thisRowCol + ']))';
      syntaxText = '構文: ' + funcName + '(SELECT(...))';
      descText = '「' + targetTable.name + '」から [' + condCol + '] が一致する行を抽出し、[' + targetCol + '] の' + getFuncJPName(funcName) + 'を算出します。';
      advice = '親テーブル側の Virtual Column に設定することで集計値を自動保持できます。';
    }
  }
  else if (category === 'MAXROW' || category === 'MINROW') {
    const tIdx = document.getElementById('maxrow-target-table')?.value;
    const targetTable = schema[tIdx];
    const targetCol = document.getElementById('maxrow-target-col')?.value || 'Amount';

    if (targetTable) {
      expression = category + '("' + targetTable.name + '", [' + targetCol + '])';
      syntaxText = '構文: ' + category + '(table-name, column-name)';
      descText = '「' + targetTable.name + '」テーブルの中で、[' + targetCol + '] が' + (category === 'MAXROW' ? '最大' : '最小') + 'となるレコードの行キーを1件返します。';
      advice = 'De-reference構造と組み合わせることで、最高額の注文日などを直接参照できます。';
    }
  }
  else if (category === 'STDEVP') {
    const listExpr = document.getElementById('stdevp-target-list')?.value || 'LIST()';
    expression = 'STDEVP(' + listExpr + ')';
    syntaxText = '構文: STDEVP(list)';
    descText = '数値リストの母標準偏差を計算します。';
    advice = 'データのばらつきや偏差値計算を行いたい高度な集計で利用します。';
  }
  else if (category === 'IFS') {
    const col = document.getElementById('ifs-col')?.value || 'Status';
    const cond1 = document.getElementById('ifs-cond-1')?.value || '= "完了"';
    const res1 = document.getElementById('ifs-res-1')?.value || '"Done"';
    const cond2 = document.getElementById('ifs-cond-2')?.value || '= "処理中"';
    const res2 = document.getElementById('ifs-res-2')?.value || '"Progress"';
    const resDef = document.getElementById('ifs-res-default')?.value || '"N/A"';

    expression = 'IFS(\n  [' + col + '] ' + cond1 + ', ' + res1 + ',\n  [' + col + '] ' + cond2 + ', ' + res2 + ',\n  TRUE, ' + resDef + '\n)';
    syntaxText = '構文: IFS(condition1, value1, condition2, value2, ...)';
    descText = '[' + col + '] の値に応じて複数の条件を上から順に評価し、最初に合致した結果を返します。';
    advice = 'AppSheetでは SWITCH() よりも IFS() の方が柔軟な条件式を書くことができ推奨されます。';
  }
  else if (category === 'SWITCH') {
    const targetCol = document.getElementById('switch-target-col')?.value || 'Status';
    const val1 = document.getElementById('switch-val-1')?.value || '"A"';
    const res1 = document.getElementById('switch-res-1')?.value || '"優"';
    const val2 = document.getElementById('switch-val-2')?.value || '"B"';
    const res2 = document.getElementById('switch-res-2')?.value || '"良"';
    const def = document.getElementById('switch-default')?.value || '"可"';

    expression = 'SWITCH([' + targetCol + '],\n  ' + val1 + ', ' + res1 + ',\n  ' + val2 + ', ' + res2 + ',\n  ' + def + '\n)';
    syntaxText = '構文: SWITCH(expression, value1, result1, value2, result2, ..., default)';
    descText = '[' + targetCol + '] の値に応じた分岐を行います。';
    advice = '1つのカラムの値と完全一致する条件で分岐させたい場合に可読性が高くなります。';
  }
  else if (category === 'IF') {
    const cond = document.getElementById('if-cond')?.value || 'TRUE';
    const tVal = document.getElementById('if-true-val')?.value || 'TRUE';
    const fVal = document.getElementById('if-false-val')?.value || 'FALSE';
    expression = 'IF(' + cond + ', ' + tVal + ', ' + fVal + ')';
    syntaxText = '構文: IF(logical-expression, value-if-true, value-if-false)';
    descText = '条件式が真の場合は真の値、偽の場合は偽の値を返します。';
    advice = '2段階のシンプルな条件分岐に使用します。';
  }
  else if (category === 'AND_OR') {
    const type = document.getElementById('andor-type')?.value || 'AND';
    const c1 = document.getElementById('andor-cond1')?.value || 'TRUE';
    const c2 = document.getElementById('andor-cond2')?.value || 'TRUE';
    expression = type + '(' + c1 + ', ' + c2 + ')';
    syntaxText = '構文: ' + type + '(condition1, condition2, ...)';
    descText = type === 'AND' ? 'すべての条件が満たされているか判定します。' : 'いずれかの条件が満たされているか判定します。';
    advice = '引数はカンマ区切りで3つ以上指定することも可能です。';
  }
  else if (category === 'NOT') {
    const cond = document.getElementById('not-cond')?.value || 'TRUE';
    expression = 'NOT(' + cond + ')';
    syntaxText = '構文: NOT(logical-expression)';
    descText = '条件式の真偽結果を反転させます。';
    advice = 'ISNOTBLANK([Col]) のような専用関数がある場合はそちらを使うとより見やすくなります。';
  }
  else if (category === 'EXISTS') {
    const tIdx = document.getElementById('exist-target-table')?.value;
    const targetTable = schema[tIdx];
    const targetCol = document.getElementById('exist-target-col')?.value || 'Email';
    const thisRowCol = document.getElementById('exist-thisrow-col')?.value || 'Email';
    const mode = document.getElementById('exist-mode')?.value;

    if (targetTable) {
      if (mode === 'NOT_EXISTS') {
        expression = 'ISBLANK(FILTER("' + targetTable.name + '", [' + targetCol + '] = ' + thisRowPrefix + '[' + thisRowCol + ']))';
        syntaxText = '構文: ISBLANK(FILTER(...))';
        descText = '「' + targetTable.name + '」テーブル内に同じ値がまだ存在しないかチェックします。';
        advice = '[Valid_If] に設定することで重複登録を防止できます。';
      } else {
        expression = 'COUNT(FILTER("' + targetTable.name + '", [' + targetCol + '] = ' + thisRowPrefix + '[' + thisRowCol + '])) > 0';
        syntaxText = '構文: COUNT(FILTER(...)) > 0';
        descText = '一致するレコードが1件以上存在するか判定します。';
        advice = '[Show_If] などの表示・編集制御ロジックに利用できます。';
      }
    }
  }
  else if (category === 'ISBLANK') {
    const col = document.getElementById('isblank-col')?.value || 'Column';
    const mode = document.getElementById('isblank-mode')?.value || 'ISBLANK';
    expression = mode + '([' + col + '])';
    syntaxText = '構文: ' + mode + '(value)';
    descText = '[' + col + '] が空であるか入力済みであるかをチェックします。';
    advice = '条件分岐や必須チェックのロジックで最も頻繁に使用される関数です。';
  }
  else if (category === 'IN') {
    const valCol = document.getElementById('in-val-col')?.value || 'Col';
    const targetList = document.getElementById('in-target-list')?.value || 'LIST()';
    expression = 'IN([' + valCol + '], ' + targetList + ')';
    syntaxText = '構文: IN(value, list)';
    descText = '[' + valCol + '] の値が指定したリストの中に含まれているか判定します。';
    advice = 'ユーザーの役割判定や特定カテゴリに属するかのチェックに便利です。';
  }
  else if (category === 'CONTAINS') {
    const col = document.getElementById('contains-target-col')?.value || 'Col';
    const kw = document.getElementById('contains-keyword')?.value || '';
    expression = 'CONTAINS([' + col + '], "' + kw + '")';
    syntaxText = '構文: CONTAINS(text, substring)';
    descText = '文字列の中にキーワードが含まれているかを部分一致判定します。';
    advice = 'あいまい検索などに役立ちます。';
  }
  else if (category === 'CONCATENATE') {
    const args = document.getElementById('concat-args')?.value || '';
    expression = 'CONCATENATE(' + args + ')';
    syntaxText = '構文: CONCATENATE(text1, text2, ...)';
    descText = '指定した複数のテキスト要素を1つの文字列に結合します。';
    advice = '& 演算子を使うことでも同様の結合が可能です。';
  }
  else if (category === 'TEXT') {
    const col = document.getElementById('text-target-col')?.value || 'Col';
    const fmt = document.getElementById('text-format')?.value || '';
    expression = fmt ? 'TEXT([' + col + '], "' + fmt + '")' : 'TEXT([' + col + '])';
    syntaxText = '構文: TEXT(value, format)';
    descText = '値（日付や数値）を指定したフォーマットの文字列に変換します。';
    advice = '日付を整形して通知文面に差し込む際などに使用します。';
  }
  else if (category === 'LEFT_RIGHT_MID') {
    const func = document.getElementById('lrm-func')?.value || 'LEFT';
    const col = document.getElementById('lrm-col')?.value || 'Col';
    const params = document.getElementById('lrm-params')?.value || '1';
    expression = func + '([' + col + '], ' + params + ')';
    syntaxText = '構文: ' + func + '(text, num_chars)';
    descText = '文字列から部分文字列を抽出します。';
    advice = 'コード番号からカテゴリを判別する場合などに有効です。';
  }
  else if (category === 'SUBSTITUTE') {
    const col = document.getElementById('sub-col')?.value || 'Col';
    const oldStr = document.getElementById('sub-old')?.value || '';
    const newStr = document.getElementById('sub-new')?.value || '';
    expression = 'SUBSTITUTE([' + col + '], "' + oldStr + '", "' + newStr + '")';
    syntaxText = '構文: SUBSTITUTE(text, old_text, new_text)';
    descText = '文字列に含まれる特定の文字を指定した文字に置換します。';
    advice = 'ハイフンやスペースの除去整形処理に適しています。';
  }
  else if (category === 'INDEX') {
    const listExpr = document.getElementById('index-list')?.value || 'LIST()';
    const pos = document.getElementById('index-pos')?.value || '1';
    expression = 'INDEX(' + listExpr + ', ' + pos + ')';
    syntaxText = '構文: INDEX(list, position)';
    descText = 'リストの中の指定した位置の要素を取り出します（1始まり）。';
    advice = 'AppSheetのリストインデックスは 1 から始まります。';
  }
  else if (category === 'LOWER_UPPER') {
    const func = document.getElementById('lu-func')?.value || 'LOWER';
    const col = document.getElementById('lu-col')?.value || 'Col';
    expression = func + '([' + col + '])';
    syntaxText = '構文: ' + func + '(text)';
    descText = '英字テキストを大文字または小文字に統一変換します。';
    advice = 'メールアドレスの一致判定前の正規化で有効です。';
  }
  else if (category === 'TODAY_NOW') {
    const func = document.getElementById('todaynow-func')?.value || 'TODAY';
    expression = func + '()';
    syntaxText = '構文: ' + func + '()';
    descText = '現在の日付や時刻を取得します。';
    advice = '初期値に指定することで登録日時の自動記録が可能です。';
  }
  else if (category === 'DATE_CONSTRUCT') {
    const y = document.getElementById('date-y')?.value || '2026';
    const m = document.getElementById('date-m')?.value || '11';
    const d = document.getElementById('date-d')?.value || '1';
    expression = 'DATE("' + y + '-' + m + '-' + d + '")';
    syntaxText = '構文: DATE(year, month, day)';
    descText = '指定された年月日からDateオブジェクトを生成します。';
    advice = '文字列から日付型へ安全にキャストしたい場合に役立ちます。';
  }
  else if (category === 'WORKDAY') {
    const start = document.getElementById('workday-start')?.value || 'TODAY()';
    const days = document.getElementById('workday-days')?.value || '5';
    expression = 'WORKDAY(' + start + ', ' + days + ')';
    syntaxText = '構文: WORKDAY(start_date, num_days)';
    descText = '基準日から土日を除いた営業日後の日付を返します。';
    advice = '納期計算やリマインダー日の自動算出に強力です。';
  }
  else if (category === 'EOMONTH') {
    const start = document.getElementById('eomonth-start')?.value || 'TODAY()';
    const months = document.getElementById('eomonth-months')?.value || '0';
    expression = 'EOMONTH(' + start + ', ' + months + ')';
    syntaxText = '構文: EOMONTH(start_date, num_months)';
    descText = '基準日の指定月数後の月末日を取得します。';
    advice = '月末締めの売上集計期間の自動計算などで定番の関数です。';
  }
  else if (category === 'USER_INFO') {
    const func = document.getElementById('user-info-func')?.value || 'USEREMAIL';
    expression = func + '()';
    syntaxText = '構文: ' + func + '()';
    descText = '現在ログインしているユーザーの情報を返します。';
    advice = 'セキュリティフィルターや初期値設定で必須の関数です。';
  }
  else if (category === 'CONTEXT') {
    const opt = document.getElementById('context-option')?.value || '"View"';
    expression = 'CONTEXT(' + opt + ')';
    syntaxText = '構文: CONTEXT(property_name)';
    descText = 'アプリの現在の実行環境情報を取得します。';
    advice = '特定の画面だけでアクションボタンを表示させたい場合の条件式に重宝します。';
  }
  else if (category === 'HERE') {
    expression = 'HERE()';
    syntaxText = '構文: HERE()';
    descText = 'デバイスの現在地をGPSから取得します。';
    advice = 'LatLong型のカラムのInitial Valueに指定すると現在地を自動記録できます。';
  }
  else if (category === 'LATLONG') {
    const lat = document.getElementById('latlong-lat')?.value || '34.6617';
    const lng = document.getElementById('latlong-lng')?.value || '133.9350';
    expression = 'LATLONG(' + lat + ', ' + lng + ')';
    syntaxText = '構文: LATLONG(latitude, longitude)';
    descText = '緯度と経度の数値からLatLongオブジェクトを生成します。';
    advice = '固定の店舗位置などを定義したい場合に利用します。';
  }
  else if (category === 'LAT' || category === 'LONG') {
    const targetVal = document.getElementById('latlong-target-col')?.value || 'HERE()';
    expression = category + '(' + targetVal + ')';
    syntaxText = '構文: ' + category + '(lat-long)';
    descText = 'LatLong型の値から緯度または経度の数値を抽出します。';
    advice = '座標の数値だけを取り出して計算を行いたい場合に便利です。';
  }
  else if (category === 'MOD') {
    const num = document.getElementById('mod-num')?.value || '[数量]';
    const divisor = document.getElementById('mod-divisor')?.value || '2';
    expression = 'MOD(' + num + ', ' + divisor + ')';
    syntaxText = '構文: MOD(number, divisor)';
    descText = '数値を別の数値で割ったときの余りを算出します。';
    advice = '偶数・奇数の判定などに活用できます。';
  }
  else if (category === 'POWER') {
    const base = document.getElementById('power-base')?.value || '2';
    const exp = document.getElementById('power-exp')?.value || '3';
    expression = 'POWER(' + base + ', ' + exp + ')';
    syntaxText = '構文: POWER(base, exponent)';
    descText = '底の指数乗（累乗）を計算します。';
    advice = '複利計算などの計算で使用されます。';
  }
  else if (category === 'OCRTEXT') {
    const col = document.getElementById('ocr-col')?.value || 'ImageCol';
    expression = 'OCRTEXT([' + col + '])';
    syntaxText = '構文: OCRTEXT(image-column)';
    descText = '画像データからテキストを自動抽出します。';
    advice = '名刺やレシートの情報を自動読み込みたい場合に強力です。';
  }
  else if (category === 'SORT') {
    const list = document.getElementById('sort-list')?.value || 'LIST()';
    expression = 'SORT(' + list + ')';
    syntaxText = '構文: SORT(list)';
    descText = 'リストの要素をアルファベット順・昇順に並び替えます。';
    advice = 'リストをシンプルに整列させたいときに便利です。';
  }
  else if (category === 'ORDERBY') {
    const list = document.getElementById('orderby-list')?.value || 'LIST()';
    const col = document.getElementById('orderby-col')?.value || 'Column';
    const ascending = document.getElementById('orderby-dir')?.value || 'TRUE';
    expression = 'ORDERBY(' + list + ', ' + col + ', ' + ascending + ')';
    syntaxText = '構文: ORDERBY(list, column, ascending?)';
    descText = 'リストを指定したカラムの値を基準に並び替えます。';
    advice = 'SELECT等で取得したレコードリストの表示順を整理したい場合に必須です。';
  }
  else if (category === 'ROUND') {
    const func = document.getElementById('round-func')?.value || 'ROUND';
    const num = document.getElementById('round-num')?.value || '0';
    expression = func + '(' + num + ')';
    syntaxText = '構文: ' + func + '(number)';
    descText = '数値に対して四捨五入・切り上げ・切り捨てを行います。';
    advice = '消費税計算や端数調整で利用します。';
  }
  else if (category === 'ABS') {
    const num = document.getElementById('abs-num')?.value || '0';
    expression = 'ABS(' + num + ')';
    syntaxText = '構文: ABS(number)';
    descText = '数値の絶対値を求めます。';
    advice = '予実の差額の大きさを判定する際に有効です。';
  }
  else if (category === 'RANDBETWEEN') {
    const min = document.getElementById('rand-min')?.value || '1';
    const max = document.getElementById('rand-max')?.value || '100';
    expression = 'RANDBETWEEN(' + min + ', ' + max + ')';
    syntaxText = '構文: RANDBETWEEN(min, max)';
    descText = '指定範囲内でランダムな整数を生成します。';
    advice = 'テストデータの作成などで活用できます。';
  } 
  else if (category === 'LINKTOVIEW') {
    const viewName = document.getElementById('link-viewname')?.value || 'ViewName';
    expression = 'LINKTOVIEW("' + viewName + '")';
    syntaxText = '構文: LINKTOVIEW(view-name)';
    descText = '指定したビューへ画面を遷移させます。';
    advice = 'ボタンタップで特定の画面を開かせる際に使用します。';
  }
  else if (category === 'LINKTOROW') {
    const key = document.getElementById('link-row-key')?.value || '[ID]';
    const viewName = document.getElementById('link-row-view')?.value || 'Detail_View';
    expression = 'LINKTOROW(' + key + ', "' + viewName + '")';
    syntaxText = '構文: LINKTOROW(row-key, view-name)';
    descText = '指定したレコードの行キーに対応する詳細・編集画面へ直接ジャンプします。';
    advice = '関連するレコードへ素早くアクセスさせたいときのアクション設定に必須です。';
  }
  else if (category === 'LINKTOFORM') {
    const formName = document.getElementById('link-form-name')?.value || 'Form_View';
    const col = document.getElementById('link-form-col')?.value || '[Column]';
    expression = 'LINKTOFORM("' + formName + '", ' + col + ', ' + thisRowPrefix + '[' + col.replace(/[\[\]]/g, '') + '])';
    syntaxText = '構文: LINKTOFORM(form-name, column1, value1, ...)';
    descText = '新規作成フォームを開き、項目に初期値を自動入力した状態で起動します。';
    advice = '現在のレコードのデータを引き継いだまま別テーブルに新規作成する際に強力です。';
  }
  else if (category === 'LINKTOFILTEREDVIEW') {
    const viewName = document.getElementById('link-filt-view')?.value || 'View_Name';
    const cond = document.getElementById('link-filt-cond')?.value || 'TRUE';
    expression = 'LINKTOFILTEREDVIEW("' + viewName + '", ' + cond + ')';
    syntaxText = '構文: LINKTOFILTEREDVIEW(view-name, condition)';
    descText = '指定したビューを条件に一致するレコードだけに絞り込んで表示します。';
    advice = '特定条件のデータ群だけをハイライトして確認させたい場合に便利です。';
  }
  else if (category === 'COMPOSITE_IF_SUM') {
    const tIdx = document.getElementById('comp-sum-table')?.value;
    const targetTable = schema[tIdx];
    const sumCol = document.getElementById('comp-sum-col')?.value || '金額';
    const condCol = document.getElementById('comp-sum-cond')?.value || 'ID顧客';
    const threshold = document.getElementById('comp-sum-threshold')?.value || '100000';
    if (targetTable) {
      expression = 'IF(SUM(SELECT(' + targetTable.name + '[' + sumCol + '], [' + condCol + '] = ' + thisRowPrefix + '[ID顧客])) >= ' + threshold + ', "VIP", "一般")';
      syntaxText = '構文: IF(SUM(SELECT(...)) >= threshold, ...)';
      descText = '関連テーブルの合計値を算出し、しきい値以上であれば「VIP」、それ以外は「一般」と判定します。';
      advice = '顧客ごとのランク分けやステータス自動制御に活用できます。';
    }
  } 
  else if (category === 'COMPOSITE_ISBLANK_FILTER') {
    const tIdx = document.getElementById('comp-dup-table')?.value;
    const targetTable = schema[tIdx];
    const dupCol = document.getElementById('comp-dup-col')?.value || 'メールアドレス';
    if (targetTable) {
      expression = 'ISBLANK(FILTER("' + targetTable.name + '", AND([' + dupCol + '] = ' + thisRowPrefix + '[' + dupCol + '], [ID] <> ' + thisRowPrefix + '[ID])))';
      syntaxText = '構文: ISBLANK(FILTER("' + targetTable.name + '", ...))';
      descText = '自分自身を除く他のレコードにすでに存在するかチェックし、重複を防ぎます。';
      advice = 'Valid_Ifに設定することで重複データの登録をリアルタイムにブロックできます。';
    }
  } 
  else if (category === 'COMPOSITE_INDEX_SPLIT') {
    const splitCol = document.getElementById('comp-split-col')?.value || 'タグ';
    const pos = document.getElementById('comp-split-pos')?.value || '1';
    expression = 'INDEX(SPLIT([' + splitCol + '], ","), ' + pos + ')';
    syntaxText = '構文: INDEX(SPLIT(text, ","), position)';
    descText = 'カンマ区切りの文字列を分解し、指定された位置の要素をピンポイントで取得します。';
    advice = '複数選択されたタグから最初の値だけを取り出したい場合に便利です。';
  } 
  else if (category === 'COMPOSITE_IN_SELECT') {
    const valExpr = document.getElementById('comp-in-val')?.value || 'USEREMAIL()';
    const tIdx = document.getElementById('comp-in-table')?.value;
    const targetTable = schema[tIdx];
    const inCol = document.getElementById('comp-in-col')?.value || 'メールアドレス';
    if (targetTable) {
      expression = 'IN(' + valExpr + ', SELECT(' + targetTable.name + '[' + inCol + '], TRUE))';
      syntaxText = '構文: IN(value, SELECT(table[column], TRUE))';
      descText = '値が対象テーブルのリスト内に含まれているかを判定します。';
      advice = 'セキュリティフィルターやボタンの表示制御の条件式として最適です。';
    }
  }

  if (codeOutput) codeOutput.textContent = expression;
  if (textExplanation) textExplanation.innerHTML = '<div class="text-emerald-400 font-mono font-medium">' + syntaxText + '</div><div class="mt-2 text-slate-400">' + descText + '</div>';
  if (textAdvice) textAdvice.textContent = advice;
  
  const FUNCTION_HELP_URLS = {
      'ABS': 'https://support.google.com/appsheet/answer/10107329?hl=ja',
      'AND': 'https://support.google.com/appsheet/answer/10107398?hl=ja',
      'AVERAGE': 'https://support.google.com/appsheet/answer/10107675?hl=ja',
      'CEILING': 'https://support.google.com/appsheet/answer/10104440?hl=ja',
      'CONCATENATE': 'https://support.google.com/appsheet/answer/10107400?hl=ja',
      'CONTAINS': 'https://support.google.com/appsheet/answer/10107955?hl=ja',
      'CONTEXT': 'https://support.google.com/appsheet/answer/10107885?hl=ja',
      'COUNT': 'https://support.google.com/appsheet/answer/10107676?hl=ja',
      'DATE': 'https://support.google.com/appsheet/answer/10107957?hl=ja',
      'DATETIME': 'https://support.google.com/appsheet/answer/10108190?hl=ja',
      'DAY': 'https://support.google.com/appsheet/answer/10107401?hl=ja',
      'DECIMAL': 'https://support.google.com/appsheet/answer/10107887?hl=ja',
      'DISTANCE': 'https://support.google.com/appsheet/answer/11587699?hl=ja',
      'DOMAINOF': 'https://support.google.com/appsheet/answer/13127104?hl=ja',
      'ENCODEURL': 'https://support.google.com/appsheet/answer/10106629?hl=ja',
      'ENDSWITH': 'https://support.google.com/appsheet/answer/11582090?hl=ja',
      'EOMONTH': 'https://support.google.com/appsheet/answer/10107332?hl=ja',
      'EOWEEK': 'https://support.google.com/appsheet/answer/10108191?hl=ja',
      'EWOMONTH': 'https://support.google.com/appsheet/answer/10108192?hl=ja',
      'EXTRACT': 'https://support.google.com/appsheet/answer/10107889?hl=ja',
      'EXTRACTCHOICE': 'https://support.google.com/appsheet/answer/10107958?hl=ja',
      'EXTRACTDATES': 'https://support.google.com/appsheet/answer/10107402?hl=ja',
      'EXTRACTDATETIMES': 'https://support.google.com/appsheet/answer/10108193?hl=ja',
      'EXTRACTDOMAINS': 'https://support.google.com/appsheet/answer/13124857?hl=ja',
      'EXTRACTEMAILS': 'https://support.google.com/appsheet/answer/10107403?hl=ja',
      'EXTRACTHASHTAGS': 'https://support.google.com/appsheet/answer/10107890?hl=ja',
      'EXTRACTMENTIONS': 'https://support.google.com/appsheet/answer/10108195?hl=ja',
      'EXTRACTNUMBERS': 'https://support.google.com/appsheet/answer/10107677?hl=ja',
      'EXTRACTPHONENUMBERS': 'https://support.google.com/appsheet/answer/10106631?hl=ja',
      'EXTRACTPRICES': 'https://support.google.com/appsheet/answer/10107891?hl=ja',
      'EXTRACTTIMES': 'https://support.google.com/appsheet/answer/10107404?hl=ja',
      'FILTER': 'https://support.google.com/appsheet/answer/10108196?hl=ja',
      'FIND': 'https://support.google.com/appsheet/answer/10108197?hl=ja',
      'FLOOR': 'https://support.google.com/appsheet/answer/10106537?hl=ja',
      'HERE': 'https://support.google.com/appsheet/answer/10107405?hl=ja',
      'HOUR': 'https://support.google.com/appsheet/answer/10107679?hl=ja',
      'HYPERLINK': 'https://support.google.com/appsheet/answer/10107911?hl=ja',
      'IF': 'https://support.google.com/appsheet/answer/10108198?hl=ja',
      'IFS': 'https://support.google.com/appsheet/answer/10107912?hl=ja',
      'IN': 'https://support.google.com/appsheet/answer/10107681?hl=ja',
      'INDEX': 'https://support.google.com/appsheet/answer/10107336?hl=ja',
      'INTERSECT': 'https://support.google.com/appsheet/answer/10107963?hl=ja',
      'ISBLANK': 'https://support.google.com/appsheet/answer/10107337?hl=ja',
      'ISNOTBLANK': 'https://support.google.com/appsheet/answer/10107964?hl=ja',
      'ISOWEEKNUM': 'https://support.google.com/appsheet/answer/11508685?hl=ja',
      'LAT': 'https://support.google.com/appsheet/answer/10107682?hl=ja',
      'LATLONG': 'https://support.google.com/appsheet/answer/10107965?hl=ja',
      'LEFT': 'https://support.google.com/appsheet/answer/10106634?hl=ja',
      'LEN': 'https://support.google.com/appsheet/answer/10107966?hl=ja',
      'LINKTEXT': 'https://support.google.com/appsheet/answer/10107913?hl=ja',
      'LINKTOAPP': 'https://support.google.com/appsheet/answer/10107914?hl=ja',
      'LINKTOFILTEREDVIEW': 'https://support.google.com/appsheet/answer/10107338?hl=ja',
      'LINKTOFORM': 'https://support.google.com/appsheet/answer/10106538?hl=ja',
      'LINKTOPARENTVIEW': 'https://support.google.com/appsheet/answer/11621687?hl=ja',
      'LINKTOROW': 'https://support.google.com/appsheet/answer/10106539?hl=ja',
      'LINKTOVIEW': 'https://support.google.com/appsheet/answer/10108105?hl=ja',
      'LINKTOURL': 'https://support.google.com/appsheet/answer/10107967?hl=ja',
      'LIST': 'https://support.google.com/appsheet/answer/10107339?hl=ja',
      'LN': 'https://support.google.com/appsheet/answer/10107406?hl=ja',
      'LOG': 'https://support.google.com/appsheet/answer/10107407?hl=ja',
      'LOG2': 'https://support.google.com/appsheet/answer/10107968?hl=ja',
      'LOG10': 'https://support.google.com/appsheet/answer/10108107?hl=ja',
      'LONG': 'https://support.google.com/appsheet/answer/10108108?hl=ja',
      'LOOKUP': 'https://support.google.com/appsheet/answer/10107410?hl=ja',
      'LOWER': 'https://support.google.com/appsheet/answer/10107342?hl=ja',
      'MAX': 'https://support.google.com/appsheet/answer/10107969?hl=ja',
      'MAXROW': 'https://support.google.com/appsheet/answer/10107920?hl=ja',
      'MID': 'https://support.google.com/appsheet/answer/10107345?hl=ja',
      'MIN': 'https://support.google.com/appsheet/answer/10107972?hl=ja',
      'MINROW': 'https://support.google.com/appsheet/answer/10107414?hl=ja',
      'MINUTE': 'https://support.google.com/appsheet/answer/10107346?hl=ja',
      'MOD': 'https://support.google.com/appsheet/answer/10108110?hl=ja',
      'MONTH': 'https://support.google.com/appsheet/answer/10107922?hl=ja',
      'NOT': 'https://support.google.com/appsheet/answer/10107360?hl=ja',
      'NOW': 'https://support.google.com/appsheet/answer/10108119?hl=ja',
      'NUMBER': 'https://support.google.com/appsheet/answer/10108120?hl=ja',
      'OCRTEXT': 'https://support.google.com/appsheet/answer/10106550?hl=ja',
      'OR': 'https://support.google.com/appsheet/answer/10108121?hl=ja',
      'ORDERBY': 'https://support.google.com/appsheet/answer/10107362?hl=ja',
      'POWER': 'https://support.google.com/appsheet/answer/10106551?hl=ja',
      'RANDBETWEEN': 'https://support.google.com/appsheet/answer/10107982?hl=ja',
      'REF_ROWS': 'https://support.google.com/appsheet/answer/10107364?hl=ja',
      'RIGHT': 'https://support.google.com/appsheet/answer/10107983?hl=ja',
      'ROUND': 'https://support.google.com/appsheet/answer/10108206?hl=ja',
      'SECOND': 'https://support.google.com/appsheet/answer/10108124?hl=ja',
      'SELECT': 'https://support.google.com/appsheet/answer/10108207?hl=ja',
      'SNAPSHOT': 'https://support.google.com/appsheet/answer/10107421?hl=ja',
      'SORT': 'https://support.google.com/appsheet/answer/10107698?hl=ja',
      'SPLIT': 'https://support.google.com/appsheet/answer/10107984?hl=ja',
      'SQRT': 'https://support.google.com/appsheet/answer/10107366?hl=ja',
      'STARTSWITH': 'https://support.google.com/appsheet/answer/11581808?hl=ja',
      'STDEVP': 'https://support.google.com/appsheet/answer/10107930?hl=ja',
      'SUBSTITUTE': 'https://support.google.com/appsheet/answer/10108126?hl=ja',
      'SUM': 'https://support.google.com/appsheet/answer/10107699?hl=ja',
      'SWITCH': 'https://support.google.com/appsheet/answer/10107700?hl=ja',
      'TEXT': 'https://support.google.com/appsheet/answer/10107701?hl=ja',
      'TEXT_ICON': 'https://support.google.com/appsheet/answer/11622091?hl=ja',
      'TIME': 'https://support.google.com/appsheet/answer/10107367?hl=ja',
      'TIMENOW': 'https://support.google.com/appsheet/answer/10107985?hl=ja',
      'TODAY': 'https://support.google.com/appsheet/answer/10108286?hl=ja',
      'TOP': 'https://support.google.com/appsheet/answer/10107704?hl=ja',
      'TOTALHOURS': 'https://support.google.com/appsheet/answer/10108287?hl=ja',
      'TOTALMINUTES': 'https://support.google.com/appsheet/answer/10108288?hl=ja',
      'TOTALSECONDS': 'https://support.google.com/appsheet/answer/10107422?hl=ja',
      'TRIM': 'https://support.google.com/appsheet/answer/10107932?hl=ja',
      'UNIQUE': 'https://support.google.com/appsheet/answer/10107368?hl=ja',
      'UNIQUEID': 'https://support.google.com/appsheet/answer/10108209?hl=ja',
      'UPPER': 'https://support.google.com/appsheet/answer/10107369?hl=ja',
      'USEREMAIL': 'https://support.google.com/appsheet/answer/10108210?hl=ja',
      'USERLOCALE': 'https://support.google.com/appsheet/answer/10108289?hl=ja',
      'USERNAME': 'https://support.google.com/appsheet/answer/10108211?hl=ja',
      'USERROLE': 'https://support.google.com/appsheet/answer/10108128?hl=ja',
      'USERSETTINGS': 'https://support.google.com/appsheet/answer/10108291?hl=ja',
      'USERTZOFFSET': 'https://support.google.com/appsheet/answer/12266029?hl=ja',
      'UTCNOW': 'https://support.google.com/appsheet/answer/10107371?hl=ja',
      'WEEKDAY': 'https://support.google.com/appsheet/answer/10107424?hl=ja',
      'WEEKNUM': 'https://support.google.com/appsheet/answer/10107425?hl=ja',
      'WORKDAY': 'https://support.google.com/appsheet/answer/10107426?hl=ja',
      'YEAR': 'https://support.google.com/appsheet/answer/10107427?hl=ja',
      'XY': 'https://support.google.com/appsheet/answer/13127784?hl=ja'
  };

  const helpLinkEl = document.getElementById('link-official-help');
  if (helpLinkEl) {
    const categoryVal = selectCategory?.value;
    const targetUrl = FUNCTION_HELP_URLS[categoryVal] !== undefined ? FUNCTION_HELP_URLS[categoryVal] : FUNCTION_HELP_URLS['DEFAULT'];
    if (targetUrl) {
      helpLinkEl.href = targetUrl;
      helpLinkEl.parentElement.style.display = ''; 
    } else {
      helpLinkEl.href = '#';
      helpLinkEl.parentElement.style.display = 'none'; 
    }
  }
}

function getFuncJPName(func) {
  switch(func) {
    case 'SUM': return '合計値';
    case 'COUNT': return '件数';
    case 'AVERAGE': return '平均値';
    case 'MAX': return '最大値';
    case 'MIN': return '最小値';
    default: return '計算結果';
  }
}

function copyToClipboard() {
  const code = codeOutput.textContent;
  if (!code || code.startsWith('--')) return;

  const textarea = document.createElement('textarea');
  textarea.value = code;
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showToast('AppSheet式をコピーしました！');
  } catch (err) {
    showToast('コピーに失敗しました');
  } finally {
    document.body.removeChild(textarea);
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.openHelpModal = () => {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

window.closeHelpModal = () => {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
};

document.addEventListener('click', (e) => {
  const modal = document.getElementById('help-modal');
  if (e.target === modal) {
    closeHelpModal();
  }
});

window.switchHelpTab = (tabName) => {
  const btnSteps = document.getElementById('tab-btn-steps');
  const btnUi = document.getElementById('tab-btn-ui');
  const contentSteps = document.getElementById('help-content-steps');
  const contentUi = document.getElementById('help-content-ui');

  if (tabName === 'steps') {
    if (btnSteps) btnSteps.className = 'px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x border-blue-500/50 bg-blue-600/20 text-blue-400 transition cursor-pointer flex items-center gap-1.5';
    if (btnUi) btnUi.className = 'px-4 py-2 text-xs font-medium rounded-t-xl border-t border-x border-transparent text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1.5';
    if (contentSteps) contentSteps.classList.remove('hidden');
    if (contentUi) contentUi.classList.add('hidden');
  } else {
    if (btnUi) btnUi.className = 'px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x border-blue-500/50 bg-blue-600/20 text-blue-400 transition cursor-pointer flex items-center gap-1.5';
    if (btnSteps) btnSteps.className = 'px-4 py-2 text-xs font-medium rounded-t-xl border-t border-x border-transparent text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1.5';
    if (contentUi) contentUi.classList.remove('hidden');
    if (contentSteps) contentSteps.classList.add('hidden');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
};
