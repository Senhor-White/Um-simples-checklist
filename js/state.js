// ==========================================================================
// STATE MANAGEMENT & LOCAL STORAGE SYNCHRONIZATION
// ==========================================================================

const DEFAULT_DAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.map((t, idx) => {
    if (typeof t === 'string') {
      return {
        id: `t_${idx}_${Math.random().toString(36).substr(2, 6)}`,
        text: t,
        category: 'Geral'
      };
    }
    return {
      id: t.id || `t_${idx}_${Math.random().toString(36).substr(2, 6)}`,
      text: t.text || '',
      category: t.category || 'Geral'
    };
  });
}

function loadInitialWeekData() {
  const saved = localStorage.getItem('weekData');
  let data = {};
  if (saved) {
    try {
      data = JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler weekData do localStorage:', e);
    }
  }

  DEFAULT_DAYS.forEach(day => {
    if (!data[day]) {
      data[day] = [];
    } else {
      data[day] = normalizeTasks(data[day]);
    }
  });

  return data;
}

const initialWeekData = loadInitialWeekData();

// Carregar categorias específicas por dia da semana
function loadInitialDayCategories(weekData) {
  const saved = localStorage.getItem('dayCategories');
  let data = {};
  if (saved) {
    try {
      data = JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler dayCategories do localStorage:', e);
    }
  }

  DEFAULT_DAYS.forEach(day => {
    if (!data[day] || !Array.isArray(data[day])) {
      const taskCats = Array.from(new Set((weekData[day] || []).map(t => t.category || 'Geral')));
      data[day] = taskCats.length > 0 ? taskCats : ['Geral'];
    }
    if (!data[day].includes('Geral')) {
      data[day].unshift('Geral');
    }
  });

  return data;
}

const state = {
  weekData: initialWeekData,
  checklist: JSON.parse(localStorage.getItem('checklist')) || {},
  history: JSON.parse(localStorage.getItem('history')) || [],
  errors: JSON.parse(localStorage.getItem('errors')) || [],
  habits: JSON.parse(localStorage.getItem('habits')) || { good: [], bad: [] },
  planning: JSON.parse(localStorage.getItem('planning')) || [],
  customTabs: JSON.parse(localStorage.getItem('customTabs')) || [],
  currentTheme: JSON.parse(localStorage.getItem('theme')) || null,
  routineStates: JSON.parse(localStorage.getItem('routineStates')) || {},
  essentialTasks: JSON.parse(localStorage.getItem('essentialTasks')) || {},
  // Categorias específicas e independentes para cada dia
  dayCategories: loadInitialDayCategories(initialWeekData),
  currentFilter: 'all',
  pendingDay: null,
  pendingRoutineDay: null,
  autoSaveHandle: null,
  isAutoSaving: false
};

function saveState(key) {
  try {
    if (key === 'weekData') {
      localStorage.setItem('weekData', JSON.stringify(state.weekData));
    } else if (key === 'checklist') {
      localStorage.setItem('checklist', JSON.stringify(state.checklist));
    } else if (key === 'history') {
      localStorage.setItem('history', JSON.stringify(state.history));
    } else if (key === 'errors') {
      localStorage.setItem('errors', JSON.stringify(state.errors));
    } else if (key === 'habits') {
      localStorage.setItem('habits', JSON.stringify(state.habits));
    } else if (key === 'planning') {
      localStorage.setItem('planning', JSON.stringify(state.planning));
    } else if (key === 'customTabs') {
      localStorage.setItem('customTabs', JSON.stringify(state.customTabs));
    } else if (key === 'theme') {
      localStorage.setItem('theme', JSON.stringify(state.currentTheme));
    } else if (key === 'routineStates') {
      localStorage.setItem('routineStates', JSON.stringify(state.routineStates));
    } else if (key === 'essentialTasks') {
      localStorage.setItem('essentialTasks', JSON.stringify(state.essentialTasks));
    } else if (key === 'dayCategories') {
      localStorage.setItem('dayCategories', JSON.stringify(state.dayCategories));
    }
  } catch (err) {
    console.error(`Erro ao salvar estado para ${key}:`, err);
  }
}

function saveAllState() {
  [
    'weekData',
    'checklist',
    'history',
    'errors',
    'habits',
    'planning',
    'customTabs',
    'theme',
    'routineStates',
    'essentialTasks',
    'dayCategories'
  ].forEach(saveState);
}

function generateMarkdownString() {
  const now = new Date();
  let md = `# 🚀 SmartCheck Backup - ${now.toLocaleString('pt-BR')}\n\n`;

  md += `## 📋 Estado Atual da Semana\n`;
  Object.keys(state.weekData).forEach(day => {
    const tasks = state.weekData[day] || [];
    const total = tasks.length;
    const completed = tasks.filter(t => state.checklist[day]?.[t.id] || state.checklist[day]?.[t.text]).length;
    const isMin = state.routineStates[day] === 'minimal' ? ' (Rotina Mínima)' : '';
    md += `- **${day}**: ${completed}/${total}${isMin}\n`;
  });
  md += `\n---\n\n`;

  md += `## 📜 Histórico\n`;
  if (state.history.length > 0) {
    state.history.forEach(h => {
      md += `### ${h.date} - ${h.day}\n`;
      md += `- Status: ${h.completed ? '✅ Completo' : '⚠️ Incompleto'}\n`;
      md += `- Tarefas: ${h.completedTasks}/${h.totalTasks}\n`;
      if (h.justification) md += `- Justificativa: ${h.justification}\n`;
      md += `\n`;
    });
  } else {
    md += `_Sem histórico registrado._\n`;
  }
  md += `\n---\n\n`;

  md += `## 🧠 Reflexão (Erros)\n`;
  if (state.errors.length > 0) {
    state.errors.forEach(e => {
      md += `### ⛔ ${e.title} (${e.date})\n`;
      md += `- **Causa**: ${e.cause}\n`;
      md += `- **Correção**: ${e.fix}\n`;
      md += `\n`;
    });
  } else {
    md += `_Nenhum erro registrado._\n`;
  }
  md += `\n---\n\n`;

  md += `## 🌱 Hábitos\n`;
  md += `### Bons\n`;
  state.habits.good.forEach(h => (md += `- ✨ ${h}\n`));
  md += `\n### Maus\n`;
  state.habits.bad.forEach(h => {
    const status = h.destroyed ? `(💀 Destruído em ${h.dateDestroyed})` : '';
    md += `- 👹 ${h.text} ${status}\n`;
  });
  md += `\n---\n\n`;

  md += `## 🎯 Planejamento\n`;
  if (state.planning && state.planning.length > 0) {
    state.planning.forEach(p => {
      md += `### ${p.title} (${p.date})\n`;
      md += `**Objetivo**: ${p.goal}\n\n`;
      md += `**Plano de Ação**:\n${p.plan}\n\n`;
    });
  }
  md += `\n---\n\n`;

  if (state.customTabs.length > 0) {
    md += `## 📌 Abas Personalizadas\n`;
    state.customTabs.forEach(t => {
      md += `### ${t.title}\n`;
      md += `Criado em: ${t.createdAt}\n\n`;
      md += `${t.content}\n\n`;
    });
    md += `\n---\n\n`;
  }

  const fullState = {
    weekData: state.weekData,
    checklist: state.checklist,
    history: state.history,
    errors: state.errors,
    habits: state.habits,
    planning: state.planning,
    customTabs: state.customTabs,
    theme: state.currentTheme,
    routineStates: state.routineStates,
    essentialTasks: state.essentialTasks,
    dayCategories: state.dayCategories
  };

  md += `\n<!-- SMARTCHECK_DATA_START\n${JSON.stringify(fullState)}\nSMARTCHECK_DATA_END -->`;
  return md;
}

function exportToMarkdown() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `SmartCheck_Backup_${dateStr}.md`;
  const md = generateMarkdownString();

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerImport() {
  const input = document.getElementById('importFileInput');
  if (input) input.click();
}

function importFromMarkdown(input, onImportSuccess) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const startMarker = '<!-- SMARTCHECK_DATA_START';
    const endMarker = 'SMARTCHECK_DATA_END -->';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      alert('⚠️ Este arquivo não contém dados completos de backup ou é de uma versão antiga.');
      return;
    }

    try {
      const jsonStr = content.substring(startIndex + startMarker.length, endIndex).trim();
      const restoredData = JSON.parse(jsonStr);

      if (confirm('⚠️ ATENÇÃO: Isso irá substituir TODOS os seus dados atuais pelos dados do backup. Deseja continuar?')) {
        state.weekData = restoredData.weekData || state.weekData;
        Object.keys(state.weekData).forEach(day => {
          state.weekData[day] = normalizeTasks(state.weekData[day]);
        });

        state.checklist = restoredData.checklist || {};
        state.history = restoredData.history || [];
        state.errors = restoredData.errors || [];
        state.habits = restoredData.habits || { good: [], bad: [] };
        state.planning = restoredData.planning || [];
        state.customTabs = restoredData.customTabs || [];
        state.currentTheme = restoredData.theme || null;
        state.routineStates = restoredData.routineStates || {};
        state.essentialTasks = restoredData.essentialTasks || {};
        state.dayCategories = restoredData.dayCategories || loadInitialDayCategories(state.weekData);

        saveAllState();
        if (typeof onImportSuccess === 'function') {
          onImportSuccess();
        } else {
          location.reload();
        }
      }
    } catch (err) {
      console.error(err);
      alert('❌ Erro ao processar o arquivo de backup. O arquivo pode estar corrompido.');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

async function setupAutoSave(showToastFn) {
  if (!window.showSaveFilePicker) {
    alert('⚠️ Seu navegador não suporta salvamento direto em disco (Use Chrome, Edge ou Opera em Desktop).');
    return;
  }
  try {
    const options = {
      suggestedName: 'SmartCheck_AutoSave.md',
      types: [{ description: 'Markdown File', accept: { 'text/markdown': ['.md'] } }]
    };
    state.autoSaveHandle = await window.showSaveFilePicker(options);
    state.isAutoSaving = true;
    updateAutoSaveStatus();
    await performAutoSave(showToastFn);
    if (typeof showToastFn === 'function') {
      showToastFn('✅ Auto-Save Conectado!', 'success');
    } else if (window.showToast) {
      window.showToast('✅ Auto-Save Conectado!', 'success');
    }
  } catch (err) {
    console.error('Erro ao conectar Auto-Save:', err);
    if (window.showToast) window.showToast('❌ Conexão cancelada', 'error');
  }
}

async function performAutoSave(showToastFn) {
  if (!state.autoSaveHandle || !state.isAutoSaving) return;
  try {
    const writable = await state.autoSaveHandle.createWritable();
    const content = generateMarkdownString();
    await writable.write(content);
    await writable.close();

    const btn = document.getElementById('btnAutoSave');
    if (btn) {
      btn.innerHTML = '💾 Salvando...';
      setTimeout(() => updateAutoSaveStatus(), 1000);
    }
  } catch (err) {
    console.error('Falha no auto-save:', err);
    state.isAutoSaving = false;
    state.autoSaveHandle = null;
    updateAutoSaveStatus();
    if (window.showToast) window.showToast('⚠️ Erro ao salvar arquivo. Reconecte.', 'error');
  }
}

function updateAutoSaveStatus() {
  const btn = document.getElementById('btnAutoSave');
  if (!btn) return;
  if (state.isAutoSaving) {
    btn.innerHTML = '🟢 Auto-Save: Ligado';
    btn.style.color = '#ffffff';
    btn.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
  } else {
    btn.innerHTML = '🔴 Conectar Auto-Save';
    btn.style.color = '#ef4444';
    btn.style.textShadow = 'none';
  }
}

// Exposição global no window
window.DEFAULT_DAYS = DEFAULT_DAYS;
window.generateId = generateId;
window.normalizeTasks = normalizeTasks;
window.state = state;
window.saveState = saveState;
window.saveAllState = saveAllState;
window.generateMarkdownString = generateMarkdownString;
window.exportToMarkdown = exportToMarkdown;
window.triggerImport = triggerImport;
window.importFromMarkdown = importFromMarkdown;
window.setupAutoSave = setupAutoSave;
window.performAutoSave = performAutoSave;
window.updateAutoSaveStatus = updateAutoSaveStatus;
