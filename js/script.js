// ========================================
// DADOS ORIGINAIS (MANTIDOS)
// ========================================
const extras = [

];

// Carregar dados da semana (suporta personalização)
// Se houver dados salvos, usa eles. Se não, usa o padrão.
let savedWeekData = JSON.parse(localStorage.getItem('weekData'));

// Dados padrão originais (fallback)
const defaultWeekData = {

};

let weekData = savedWeekData || defaultWeekData;

// ========================================
// GESTÃO DE ESTADO (LOCALSTORAGE)
// ========================================
let checklist = JSON.parse(localStorage.getItem('checklist')) || {};
let history = JSON.parse(localStorage.getItem('history')) || [];
let errors = JSON.parse(localStorage.getItem('errors')) || [];
let habits = JSON.parse(localStorage.getItem('habits')) || { good: [], bad: [] };
let planning = JSON.parse(localStorage.getItem('planning'));
let customTabs = JSON.parse(localStorage.getItem('customTabs')) || [];
let currentTheme = JSON.parse(localStorage.getItem('theme')) || null;
let routineStates = JSON.parse(localStorage.getItem('routineStates')) || {};
let pendingRoutineDay = null;

// ========================================
// FUNÇÃO DE BACKUP (EXPORTAR MD) & AUTO-SAVE
// ========================================
// ========================================
// FUNÇÃO DE BACKUP (EXPORTAR MD) & AUTO-SAVE
// ========================================
let autoSaveHandle = null;
let isAutoSaving = false;

// Gerar string do Markdown (separada para reuso)
function generateMarkdownString() {
  const now = new Date();
  let md = `# 🚀 SmartCheck Backup - ${now.toLocaleString('pt-BR')}\n\n`;

  // 1. Checklist Atual
  md += `## 📋 Estado Atual da Semana\n`;
  Object.keys(weekData).forEach(day => {
    const total = weekData[day].length;
    const completed = checklist[day] ? Object.values(checklist[day]).filter(v => v).length : 0;
    const isMin = routineStates[day] === 'minimal' ? ' (Rotina Mínima)' : '';
    md += `- **${day}**: ${completed}/${total}${isMin}\n`;
  });
  md += `\n---\n\n`;

  // 2. Histórico
  md += `## 📜 Histórico\n`;
  if (history.length > 0) {
    history.forEach(h => {
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

  // 3. Reflexão
  md += `## 🧠 Reflexão (Erros)\n`;
  if (errors.length > 0) {
    errors.forEach(e => {
      md += `### ⛔ ${e.title} (${e.date})\n`;
      md += `- **Causa**: ${e.cause}\n`;
      md += `- **Correção**: ${e.fix}\n`;
      md += `\n`;
    });
  } else {
    md += `_Nenhum erro registrado._\n`;
  }
  md += `\n---\n\n`;

  // 4. Hábitos
  md += `## 🌱 Hábitos\n`;
  md += `### Bons\n`;
  habits.good.forEach(h => md += `- ✨ ${h}\n`);
  md += `\n### Maus\n`;
  habits.bad.forEach(h => {
    const status = h.destroyed ? `(💀 Destruído em ${h.dateDestroyed})` : '';
    md += `- 👹 ${h.text} ${status}\n`;
  });
  md += `\n---\n\n`;

  // 5. Planejamento
  md += `## 🎯 Planejamento\n`;
  if (planning && planning.length > 0) {
    planning.forEach(p => {
      md += `### ${p.title} (${p.date})\n`;
      md += `**Objetivo**: ${p.goal}\n\n`;
      md += `**Plano de Ação**:\n${p.plan}\n\n`;
    });
  }
  md += `\n---\n\n`;

  // 6. Abas Personalizadas
  if (customTabs.length > 0) {
    md += `## 📌 Abas Personalizadas\n`;
    customTabs.forEach(t => {
      md += `### ${t.title}\n`;
      md += `Criado em: ${t.createdAt}\n\n`;
      md += `${t.content}\n\n`;
    });
    md += `\n---\n\n`;
  }

  // 7. BLOCO DE DADOS COMPLETOS (ESCONDIDO/EMBUTIDO)
  // Isso permite restaurar o estado EXATO do sistema
  const fullState = {
    weekData, checklist, history, errors, habits, planning, customTabs, theme: currentTheme, routineStates, essentialTasks
  };

  md += `\n<!-- SMARTCHECK_DATA_START\n${JSON.stringify(fullState)}\nSMARTCHECK_DATA_END -->`;

  return md;
}

function exportToMarkdown() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `SmartCheck_Backup_${dateStr}.md`;
  const md = generateMarkdownString();

  const blob = new Blob([md], { type: 'text/markdown' });
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
  document.getElementById('importFileInput').click();
}

function importFromMarkdown(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;

    // Tentar encontrar o bloco de dados
    const startMarker = '<!-- SMARTCHECK_DATA_START';
    const endMarker = 'SMARTCHECK_DATA_END -->';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      alert('⚠️ Este arquivo não contém dados completos de backup ou é de uma versão antiga. Não foi possível restaurar.');
      return;
    }

    try {
      const jsonStr = content.substring(startIndex + startMarker.length, endIndex).trim();
      const restoredData = JSON.parse(jsonStr);

      if (confirm('⚠️ ATENÇÃO: Isso irá substituir TODOS os seus dados atuais pelos dados do backup. Deseja continuar?')) {
        // Restaurar dados
        weekData = restoredData.weekData || weekData;
        checklist = restoredData.checklist || {};
        history = restoredData.history || [];
        errors = restoredData.errors || [];
        habits = restoredData.habits || { good: [], bad: [] };
        planning = restoredData.planning || [];
        customTabs = restoredData.customTabs || [];
        currentTheme = restoredData.theme || null;
        routineStates = restoredData.routineStates || {};
        essentialTasks = restoredData.essentialTasks || {};

        // Salvar no LocalStorage
        localStorage.setItem('weekData', JSON.stringify(weekData));
        localStorage.setItem('checklist', JSON.stringify(checklist));
        localStorage.setItem('history', JSON.stringify(history));
        localStorage.setItem('errors', JSON.stringify(errors));
        localStorage.setItem('habits', JSON.stringify(habits));
        localStorage.setItem('planning', JSON.stringify(planning));
        localStorage.setItem('customTabs', JSON.stringify(customTabs));
        if (currentTheme) localStorage.setItem('theme', JSON.stringify(currentTheme));
        localStorage.setItem('routineStates', JSON.stringify(routineStates));
        localStorage.setItem('essentialTasks', JSON.stringify(essentialTasks));

        alert('✅ Backup restaurado com sucesso! A página será recarregada.');
        location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('❌ Erro ao processar o arquivo de backup. O arquivo pode estar corrompido.');
    }
  };
  reader.readAsText(file);
  // Limpar input para permitir selecionar o mesmo arquivo novamente se necessário
  input.value = '';
}

// Configurar Auto-Save (API File System Access)
async function setupAutoSave() {
  if (!window.showSaveFilePicker) {
    alert("⚠️ Seu navegador não suporta salvamento direto em disco (Use Chrome, Edge ou Opera em Desktop).");
    return;
  }
  try {
    const options = {
      suggestedName: 'SmartCheck_AutoSave.md',
      types: [{ description: 'Markdown File', accept: { 'text/markdown': ['.md'] } }],
    };
    // Solicita ao usuário onde salvar
    autoSaveHandle = await window.showSaveFilePicker(options);
    isAutoSaving = true;

    updateAutoSaveStatus();
    performAutoSave(); // Salvar imediatamente
    showToast("✅ Auto-Save Conectado!", "success");
  } catch (err) {
    console.error("Erro/Cancelado:", err);
    showToast("❌ Conexão cancelada", "error");
  }
}

async function performAutoSave() {
  if (!autoSaveHandle || !isAutoSaving) return;
  try {
    const writable = await autoSaveHandle.createWritable();
    const content = generateMarkdownString();
    await writable.write(content);
    await writable.close();

    // Feedback visual discreto
    const btn = document.getElementById('btnAutoSave');
    if (btn) {
      btn.innerHTML = '💾 Salvando...';
      setTimeout(() => updateAutoSaveStatus(), 1000);
    }
  } catch (err) {
    console.error("Falha no auto-save:", err);
    isAutoSaving = false;
    autoSaveHandle = null;
    updateAutoSaveStatus();
    showToast("⚠️ Erro ao salvar arquivo. Reconecte.", "error");
  }
}

function updateAutoSaveStatus() {
  const btn = document.getElementById('btnAutoSave');
  if (!btn) return;
  if (isAutoSaving) {
    btn.innerHTML = '🟢 Auto-Save: Ligado';
    btn.style.color = '#10b981';
  } else {
    btn.innerHTML = '🔴 Conectar Auto-Save';
    btn.style.color = '#ef4444';
  }
}

// Sistema de Notificação (Toast)
function showToast(message, type = "info") {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
          position: fixed; bottom: 20px; right: 20px; 
          background: #1e293b; color: white; padding: 12px 24px; 
          border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          z-index: 9999; transform: translateY(100px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-left: 4px solid #3b82f6; font-weight: 500;
        `;
    document.body.appendChild(toast);
  }

  // Cores baseadas no tipo
  if (type === 'success') toast.style.borderLeftColor = '#10b981';
  else if (type === 'error') toast.style.borderLeftColor = '#ef4444';
  else toast.style.borderLeftColor = '#3b82f6';

  toast.textContent = message;
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
  }, 3000);
}

// Interceptor: Observar mudanças no localStorage
const originalSetItem = localStorage.setItem;
let saveTimeout;

localStorage.setItem = function (key, value) {
  originalSetItem.apply(this, arguments);
  const keysToWatch = ['checklist', 'weekData', 'history', 'errors', 'habits', 'planning', 'customTabs', 'theme', 'routineStates', 'essentialTasks'];

  if (keysToWatch.includes(key)) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (isAutoSaving) {
        performAutoSave();
      } else {
        // Mostra aviso que está salvando SÓ no navegador, se o usuário fizer uma ação importante
        // (Opcional, para não ser irritante, não mostramos nada ou mostramos só na 1ª vez)
        // showToast("💾 Salvo no Navegador (Offline)", "info");
      }
    }, 1000);
  }
};

// Migração de dados antigos de planejamento
if (planning && !Array.isArray(planning)) {
  planning = [{ title: 'Meu Objetivo Principal', goal: planning.goal, plan: planning.plan, date: new Date().toLocaleDateString('pt-BR') }];
} else if (!planning) {
  planning = [];
}

let currentFilter = 'all';
let pendingDay = null;

// ========================================
// FUNÇÕES DO HUD
// ========================================
function toggleHUD() {
  const menu = document.getElementById('hudMenu');
  const overlay = document.querySelector('.hud-overlay');
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
}

// ========================================
// FUNÇÕES GERAIS (MANTIDAS)
// ========================================
function updateCurrentDate() {
  const now = new Date();
  document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function showView(viewName) {
  // Fechar HUD ao trocar de view
  const menu = document.getElementById('hudMenu');
  const overlay = document.querySelector('.hud-overlay');
  menu.classList.remove('active');
  overlay.classList.remove('active');

  // Trocar view ativa
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById(viewName);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Atualizar item ativo no HUD
  document.querySelectorAll('.hud-item').forEach(item => item.classList.remove('active'));

  // Renderizar conteúdo conforme necessário
  if (viewName === 'reflection') renderErrors();
  if (viewName === 'habits') renderHabits();
  if (viewName === 'planning') renderPlanning();
  if (viewName === 'themes') loadThemeInputs();
  if (viewName === 'manage-tasks') renderTaskManagement();
}

// ========================================
// LÓGICA DA ROTINA MÍNIMA
// ========================================
function toggleRoutine(day) {
  pendingRoutineDay = day;
  const current = routineStates[day] || 'normal';
  const modal = document.getElementById('routineModal');
  const title = document.getElementById('routineModalTitle');
  const icon = document.getElementById('routineModalIcon');

  if (current === 'normal') {
    title.textContent = "Deseja ativar a rotina mínima para hoje?";
    icon.textContent = "🍃";
  } else {
    title.textContent = "Deseja alterar para rotina comum?";
    icon.textContent = "🔥";
  }
  modal.classList.add('active');
}

function closeRoutineModal() {
  document.getElementById('routineModal').classList.remove('active');
  pendingRoutineDay = null;
}

function confirmRoutineChange() {
  if (!pendingRoutineDay) return;

  const current = routineStates[pendingRoutineDay] || 'normal';
  routineStates[pendingRoutineDay] = current === 'normal' ? 'minimal' : 'normal';
  localStorage.setItem('routineStates', JSON.stringify(routineStates));

  renderChecklist();
  closeRoutineModal();
}

// ========================================
// LÓGICA DO CHECKLIST (MANTIDA)
// ========================================
// Helper para identificar tarefas essenciais da rotina mínima
function isEssential(task) {
  const keywords = [];
  const hasKeyword = keywords.some(k => task.includes(k));
  const hasWarning = task.includes('⚠️') && !task.includes('Exceção');
  return hasKeyword || hasWarning;
}

function renderChecklist() {
  const container = document.getElementById('weekContainer');
  container.innerHTML = '';

  Object.keys(weekData).forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';

    const isMinimal = routineStates[day] === 'minimal';
    const tasks = weekData[day];

    // Filtrar tarefas visíveis mantendo índice original
    const visibleIndices = tasks.map((t, i) => ({ task: t, index: i }))
      .filter(item => !isMinimal || isEssential(item.task, day));

    const total = visibleIndices.length;
    const completed = visibleIndices.filter(item => checklist[day]?.[item.index]).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    dayCard.innerHTML = `
          <div class="day-header">
            <div class="day-title">
              📅 ${day} 
              <button class="routine-toggle-btn" onclick="toggleRoutine('${day}')" title="${isMinimal ? 'Voltar ao Normal' : 'Ativar Rotina Mínima'}">
                ${isMinimal ? '🔥' : '🍃'}
              </button>
              ${isMinimal ? '<span style="font-size: 0.8rem; background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; vertical-align: middle; margin-left: 5px;">Mínima</span>' : ''}
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%"></div></div>
            <div style="font-weight: 600; color: ${percentage === 100 ? '#10b981' : '#94a3b8'}">${completed}/${total}</div>
          </div>
          <div class="task-list" id="tasks-${day}"></div>
          <button class="complete-day-btn" onclick="completeDay('${day}')">✅ Finalizar ${day}</button>
        `;
    container.appendChild(dayCard);

    const taskList = document.getElementById(`tasks-${day}`);

    visibleIndices.forEach(item => {
      const { task, index } = item;
      const isChecked = checklist[day]?.[index] || false;
      const div = document.createElement('div');
      div.className = `task-item ${isChecked ? 'completed' : ''}`;

      div.onclick = (e) => { if (e.target.type !== 'checkbox') toggleTask(day, index); };
      div.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTask('${day}', ${index})"><span>${task}</span>`;
      taskList.appendChild(div);
    });
  });
}

function toggleTask(day, index) {
  if (!checklist[day]) checklist[day] = {};
  checklist[day][index] = !checklist[day][index];
  localStorage.setItem('checklist', JSON.stringify(checklist));
  renderChecklist();
}

function completeDay(day) {
  const isMinimal = routineStates[day] === 'minimal';
  const tasks = weekData[day];

  const visibleIndices = tasks.map((t, i) => ({ task: t, index: i }))
    .filter(item => !isMinimal || isEssential(item.task, day));

  const total = visibleIndices.length;
  const completedCount = visibleIndices.filter(item => checklist[day]?.[item.index]).length;

  if (completedCount === total && total > 0) {
    saveToHistory(day, true, isMinimal ? 'Rotina Mínima Cumprida' : '');
  } else {
    pendingDay = day;
    document.getElementById('justificationModal').classList.add('active');
  }
}

function saveToHistory(day, completed, justification) {
  const now = new Date();
  const isMinimal = routineStates[day] === 'minimal';
  const tasks = weekData[day];

  const visibleIndices = tasks.map((t, i) => ({ task: t, index: i }))
    .filter(item => !isMinimal || isEssential(item.task, day));

  const totalTasks = visibleIndices.length;
  const completedTasks = visibleIndices.filter(item => checklist[day]?.[item.index]).length;

  history.unshift({
    day,
    date: now.toLocaleDateString('pt-BR'),
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    completed,
    completedTasks,
    totalTasks,
    justification
  });
  localStorage.setItem('history', JSON.stringify(history));
  checklist[day] = {};
  localStorage.setItem('checklist', JSON.stringify(checklist));
  renderChecklist();
  renderHistory();
  showView('history');
}

function resetChecklist() {
  if (confirm('Resetar dia atual?')) {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const today = days[new Date().getDay()];
    checklist[today] = {};
    localStorage.setItem('checklist', JSON.stringify(checklist));
    renderChecklist();
  }
}

// ========================================
// HISTÓRICO (MANTIDO)
// ========================================
function renderHistory() {
  const container = document.getElementById('historyContainer');
  let filtered = currentFilter === 'all' ? history : history.filter(h =>
    currentFilter === 'completed' ? h.completed : !h.completed
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b">🔭 Nada aqui ainda.</div>';
    return;
  }

  container.innerHTML = filtered.map(item => {
    // Encontrar o índice original para poder editar no array global 'history'
    const globalIndex = history.indexOf(item);
    return `
        <div class="history-item ${item.completed ? 'completed' : 'incomplete'}" style="border-left: 4px solid ${item.completed ? '#10b981' : '#ef4444'};">
          <div class="history-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <strong>${item.day}</strong> 
              <span style="font-size:0.9em; color:#94a3b8">${item.date}</span>
              <button onclick="editHistoryDate(${globalIndex})" class="edit-btn" title="Editar Data">✏️</button>
              <button onclick="deleteHistoryEntry(${globalIndex})" class="edit-btn" title="Excluir Registro">🗑️</button>
            </div>
            <span style="background:${item.completed ? '#10b981' : '#ef4444'}; padding:2px 8px; border-radius:10px; font-size:0.8em; color:white">${item.completed ? 'Completo' : 'Incompleto'}</span>
          </div>
          <div style="font-size:0.9rem; color:#94a3b8">📊 ${item.completedTasks}/${item.totalTasks} tarefas • 🕐 ${item.time}</div>
          ${item.justification ? `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:5px; font-style:italic">"${item.justification}"</div>` : ''}
        </div>
      `}).join('');
}

function editHistoryDate(index) {
  if (index === -1) return;

  const newDate = prompt("Digite a nova data (DD/MM/AAAA):", history[index].date);
  if (newDate) {
    // Validar formato simples DD/MM/AAAA
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(newDate)) {
      alert("Por favor, use o formato DD/MM/AAAA (ex: 06/03/2026).");
      return;
    }

    const [d, m, y] = newDate.split('/').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (isNaN(dateObj.getTime())) {
      alert("Data inválida.");
      return;
    }

    // Atualizar data e o dia da semana correspondente
    history[index].date = newDate;
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    history[index].day = weekdays[dateObj.getDay()];

    localStorage.setItem('history', JSON.stringify(history));
    renderHistory();
    showToast("✅ Data atualizada com sucesso!", "success");
  }
}

function deleteHistoryEntry(index) {
  if (index === -1 || !history[index]) return;

  if (confirm(`Tem certeza que deseja remover o registro de ${history[index].day} (${history[index].date}) do histórico?`)) {
    history.splice(index, 1);
    localStorage.setItem('history', JSON.stringify(history));
    renderHistory();
    showToast("✅ Registro removido com sucesso!", "success");
  }
}

function filterHistory(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderHistory();
}

// ========================================
// REFLEXÃO DE ERROS (MANTIDA)
// ========================================
function addError() {
  const title = document.getElementById('errorTitle').value;
  const cause = document.getElementById('errorCause').value;
  const fix = document.getElementById('errorFix').value;

  if (!title || !cause || !fix) return alert("Preencha todos os campos para uma análise completa!");

  errors.unshift({ title, cause, fix, date: new Date().toLocaleDateString('pt-BR') });
  localStorage.setItem('errors', JSON.stringify(errors));

  document.getElementById('errorTitle').value = '';
  document.getElementById('errorCause').value = '';
  document.getElementById('errorFix').value = '';
  renderErrors();
}

function renderErrors() {
  const list = document.getElementById('errorList');
  if (errors.length === 0) {
    list.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#64748b">Nenhum erro registrado. Continue assim!</p>';
    return;
  }

  list.innerHTML = errors.map((err, index) => `
        <div class="error-card">
          <h3><span>⛔ ${err.title}</span> <button onclick="deleteError(${index})" class="delete-btn">×</button></h3>
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">📅 ${err.date}</div>
          <div class="error-section">
            <div class="error-label">Causa (O Porquê)</div>
            <p>${err.cause}</p>
          </div>
          <div class="error-section" style="background: rgba(16, 185, 129, 0.1); margin-top: 10px;">
            <div class="error-label" style="color: #10b981;">Caminho (A Solução)</div>
            <p style="color: #e2e8f0;">${err.fix}</p>
          </div>
        </div>
      `).join('');
}

function deleteError(index) {
  if (confirm("Apagar este registro?")) {
    errors.splice(index, 1);
    localStorage.setItem('errors', JSON.stringify(errors));
    renderErrors();
  }
}

// ========================================
// HÁBITOS (MANTIDOS)
// ========================================
function addHabit() {
  const input = document.getElementById('habitInput');
  const type = document.getElementById('habitType').value;
  const text = input.value.trim();

  if (!text) return;

  if (type === 'good') habits.good.push(text);
  else habits.bad.push({ text: text, destroyed: false, dateDestroyed: null });

  localStorage.setItem('habits', JSON.stringify(habits));
  input.value = '';
  renderHabits();
}

function renderHabits() {
  const goodList = document.getElementById('goodHabitsList');
  goodList.innerHTML = habits.good.map((h, i) => `
        <div class="good-habit-card">
          <span>✨ ${h}</span>
          <button onclick="removeHabit('good', ${i})" class="delete-btn">×</button>
        </div>
      `).join('');

  const badList = document.getElementById('badHabitsList');
  badList.innerHTML = habits.bad.map((h, i) => `
        <div class="bad-habit-card ${h.destroyed ? 'destroyed' : ''}">
          <span>${h.destroyed ? '💀' : '👹'} ${h.text}</span>
          <div>
            ${!h.destroyed ? `<button onclick="destroyHabit(${i})" class="destroy-btn">💥 Destruir</button>` : '<span style="font-size:0.8rem; color:#94a3b8">Destruído!</span>'}
            <button onclick="removeHabit('bad', ${i})" class="delete-btn" style="margin-left: 5px;">×</button>
          </div>
        </div>
      `).join('');
}

function destroyHabit(index) {
  if (confirm("Parabéns! Você realmente eliminou esse hábito?")) {
    habits.bad[index].destroyed = true;
    habits.bad[index].dateDestroyed = new Date().toLocaleDateString('pt-BR');
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
  }
}

function removeHabit(type, index) {
  if (confirm("Remover da lista?")) {
    if (type === 'good') habits.good.splice(index, 1);
    else habits.bad.splice(index, 1);
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
  }
}

// ========================================
// PLANEJAMENTO (MANTIDO)
// ========================================
function togglePlanningForm() {
  const form = document.getElementById('planningForm');
  const btn = document.querySelector('.toggle-form-btn');
  if (form.style.display === 'block') {
    form.style.display = 'none';
    btn.innerHTML = '+ Novo Planejamento';
  } else {
    form.style.display = 'block';
    btn.innerHTML = '× Fechar Formulário';
  }
}

function addPlan() {
  const title = document.getElementById('planTitle').value;
  const goal = document.getElementById('mainGoal').value;
  const plan = document.getElementById('actionPlan').value;

  if (!title || !goal || !plan) return alert("Preencha todos os campos do planejamento!");

  const newPlan = {
    title,
    goal,
    plan,
    date: new Date().toLocaleDateString('pt-BR')
  };

  planning.unshift(newPlan);
  localStorage.setItem('planning', JSON.stringify(planning));

  document.getElementById('planTitle').value = '';
  document.getElementById('mainGoal').value = '';
  document.getElementById('actionPlan').value = '';
  togglePlanningForm();

  renderPlanning();
  alert('Planejamento adicionado com sucesso!');
}

function deletePlan(index) {
  if (confirm("Tem certeza que deseja apagar este planejamento?")) {
    planning.splice(index, 1);
    localStorage.setItem('planning', JSON.stringify(planning));
    renderPlanning();
  }
}

function renderPlanning() {
  const container = document.getElementById('planningList');

  if (planning.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px;">Nenhum planejamento encontrado. Crie o primeiro! 🚀</div>';
    return;
  }

  container.innerHTML = planning.map((p, index) => `
        <div class="plan-card">
          <div class="plan-header">
            <div>
              <div class="plan-title">${p.title}</div>
              <div class="plan-date">📅 Criado em ${p.date}</div>
            </div>
            <button onclick="deletePlan(${index})" class="delete-btn">🗑️</button>
          </div>
          
          <div class="plan-body">
            <h4>🎯 Objetivo</h4>
            <div class="plan-text">${p.goal}</div>
            
            <h4>🗺️ Plano de Ação</h4>
            <div class="plan-text">${p.plan}</div>
          </div>
        </div>
      `).join('');
}

// ========================================
// SISTEMA DE TEMAS (NOVO)
// ========================================
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primary);
  root.style.setProperty('--primary-dark', theme.primaryDark);
  root.style.setProperty('--accent-color', theme.accent);
  root.style.setProperty('--accent-dark', theme.accentDark);
  root.style.setProperty('--bg-color', theme.bg);
  root.style.setProperty('--bg-gradient-start', theme.bgGradientStart);
  root.style.setProperty('--bg-gradient-end', theme.bgGradientEnd);
  root.style.setProperty('--text-color', theme.text);
  root.style.setProperty('--card-bg', `rgba(30, 41, 59, 0.6)`);
}

function loadThemeInputs() {
  const savedTheme = localStorage.getItem('theme');
  let theme;

  if (savedTheme) {
    theme = JSON.parse(savedTheme);
  } else {
    theme = {
      primary: '#3b82f6',
      accent: '#10b981',
      bg: '#0f172a',
      text: '#e2e8f0'
    };
  }

  const primaryPicker = document.getElementById('primaryColorPicker');
  const primaryInput = document.getElementById('primaryColorInput');
  const accentPicker = document.getElementById('accentColorPicker');
  const accentInput = document.getElementById('accentColorInput');
  const bgPicker = document.getElementById('bgColorPicker');
  const bgInput = document.getElementById('bgColorInput');
  const textPicker = document.getElementById('textColorPicker');
  const textInput = document.getElementById('textColorInput');

  if (primaryPicker && primaryInput) {
    primaryPicker.value = theme.primary;
    primaryInput.value = theme.primary;
  }
  if (accentPicker && accentInput) {
    accentPicker.value = theme.accent;
    accentInput.value = theme.accent;
  }
  if (bgPicker && bgInput) {
    bgPicker.value = theme.bg;
    bgInput.value = theme.bg;
  }
  if (textPicker && textInput) {
    textPicker.value = theme.text;
    textInput.value = theme.text;
  }
}

function setupThemeListeners() {
  // Sincronizar picker e input, aplicar tema em tempo real
  const pairs = [
    { picker: 'primaryColorPicker', input: 'primaryColorInput', var: '--primary-color', darkVar: '--primary-dark' },
    { picker: 'accentColorPicker', input: 'accentColorInput', var: '--accent-color', darkVar: '--accent-dark' },
    { picker: 'bgColorPicker', input: 'bgColorInput', var: '--bg-color', gradientVar: true },
    { picker: 'textColorPicker', input: 'textColorInput', var: '--text-color', darkVar: null }
  ];

  pairs.forEach(pair => {
    const pickerEl = document.getElementById(pair.picker);
    const inputEl = document.getElementById(pair.input);

    if (!pickerEl || !inputEl) return;

    pickerEl.addEventListener('input', (e) => {
      const color = e.target.value;
      inputEl.value = color;
      document.documentElement.style.setProperty(pair.var, color);

      if (pair.darkVar) {
        const darker = adjustBrightness(color, -20);
        document.documentElement.style.setProperty(pair.darkVar, darker);
      }

      if (pair.gradientVar) {
        const lighter = adjustBrightness(color, 15);
        document.documentElement.style.setProperty('--bg-gradient-start', lighter);
        document.documentElement.style.setProperty('--bg-gradient-end', color);
      }
    });

    inputEl.addEventListener('input', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(color)) {
        pickerEl.value = color;
        document.documentElement.style.setProperty(pair.var, color);

        if (pair.darkVar) {
          const darker = adjustBrightness(color, -20);
          document.documentElement.style.setProperty(pair.darkVar, darker);
        }

        if (pair.gradientVar) {
          const lighter = adjustBrightness(color, 15);
          document.documentElement.style.setProperty('--bg-gradient-start', lighter);
          document.documentElement.style.setProperty('--bg-gradient-end', color);
        }
      }
    });
  });
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function saveTheme() {
  const primary = document.getElementById('primaryColorInput').value;
  const accent = document.getElementById('accentColorInput').value;
  const bg = document.getElementById('bgColorInput').value;
  const text = document.getElementById('textColorInput').value;

  const theme = {
    primary: primary,
    primaryDark: adjustBrightness(primary, -20),
    accent: accent,
    accentDark: adjustBrightness(accent, -20),
    bg: bg,
    bgGradientStart: adjustBrightness(bg, 15),
    bgGradientEnd: bg,
    text: text
  };

  localStorage.setItem('theme', JSON.stringify(theme));
  currentTheme = theme;
  applyTheme(theme);
  alert('✅ Tema salvo com sucesso!');
}

function resetTheme() {
  if (confirm('Resetar tema para o padrão?')) {
    localStorage.removeItem('theme');
    currentTheme = null;
    const defaultTheme = {
      primary: '#3b82f6',
      primaryDark: '#2563eb',
      accent: '#10b981',
      accentDark: '#059669',
      bg: '#0f172a',
      bgGradientStart: '#1e293b',
      bgGradientEnd: '#0f172a',
      text: '#e2e8f0'
    };
    applyTheme(defaultTheme);
    loadThemeInputs();
    alert('✅ Tema resetado!');
  }
}

// ========================================
// GERENCIADOR DE TAREFAS (ATUALIZADO)
// ========================================

// Estado das tarefas essenciais
let essentialTasks = JSON.parse(localStorage.getItem('essentialTasks')) || {};

// Migração única: Se não houver configuração salva, usar as keywords antigas
if (Object.keys(essentialTasks).length === 0) {
  const legacyKeywords = [""];

  Object.keys(weekData).forEach(day => {
    essentialTasks[day] = weekData[day].filter(task => {
      const hasKeyword = legacyKeywords.some(k => task.includes(k));
      const hasWarning = task.includes('⚠️') && !task.includes('Exceção');
      return hasKeyword || hasWarning;
    });
  });
  localStorage.setItem('essentialTasks', JSON.stringify(essentialTasks));
}

// Atualiza a função isEssential para usar o estado salvo
// OBS: Substitui a versão anterior baseada em keywords
function isEssential(task, day) {
  if (!essentialTasks[day]) return false;
  return essentialTasks[day].includes(task);
}

function addNewTask() {
  const day = document.getElementById('taskDaySelect').value;
  const taskInput = document.getElementById('newTaskInput');
  const taskText = taskInput.value.trim();

  if (!taskText) {
    alert('⚠️ Digite uma tarefa!');
    return;
  }

  if (!weekData[day]) {
    weekData[day] = [];
  }

  weekData[day].push(taskText);
  localStorage.setItem('weekData', JSON.stringify(weekData));

  taskInput.value = '';
  renderChecklist();
  renderTaskManagement();
  alert(`✅ Tarefa adicionada em ${day}!`);
}

function deleteTask(day, index) {
  if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
    const taskName = weekData[day][index];
    weekData[day].splice(index, 1);

    // Remover também da lista de essenciais se estiver lá
    if (essentialTasks[day]) {
      essentialTasks[day] = essentialTasks[day].filter(t => t !== taskName);
      localStorage.setItem('essentialTasks', JSON.stringify(essentialTasks));
    }

    localStorage.setItem('weekData', JSON.stringify(weekData));
    renderChecklist();
    renderTaskManagement();
  }
}

function editTask(day, index) {
  const currentTask = weekData[day][index];
  const newTask = prompt("Editar tarefa:", currentTask);

  if (newTask !== null && newTask.trim() !== "" && newTask !== currentTask) {
    weekData[day][index] = newTask.trim();

    // Se a tarefa antiga estava nos essenciais, atualiza ela lá também
    if (essentialTasks[day] && essentialTasks[day].includes(currentTask)) {
      const essIndex = essentialTasks[day].indexOf(currentTask);
      essentialTasks[day][essIndex] = newTask.trim();
      localStorage.setItem('essentialTasks', JSON.stringify(essentialTasks));
    }

    localStorage.setItem('weekData', JSON.stringify(weekData));
    renderChecklist();
    renderTaskManagement();
  }
}

function toggleEssentialTask(day, taskName) {
  if (!essentialTasks[day]) essentialTasks[day] = [];

  const index = essentialTasks[day].indexOf(taskName);
  if (index === -1) {
    essentialTasks[day].push(taskName);
  } else {
    essentialTasks[day].splice(index, 1);
  }

  localStorage.setItem('essentialTasks', JSON.stringify(essentialTasks));
  renderTaskManagement();
  renderChecklist();
}

function renderTaskManagement() {
  const day = document.getElementById('taskDaySelect').value;
  const container = document.getElementById('taskManagementList');

  if (!weekData[day] || weekData[day].length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma tarefa neste dia.</p>';
    return;
  }

  container.innerHTML = weekData[day].map((task, index) => {
    const isEss = isEssential(task, day);
    // Escapar aspas simples para evitar erro no onclick
    const escapedTask = task.replace(/'/g, "\\'");

    return `
        <div style="display: flex; align-items: center; padding: 12px; background: rgba(15, 23, 42, 0.4); border-radius: 10px; margin-bottom: 10px; gap: 10px;">
          <span style="flex: 1; color: ${isEss ? '#10b981' : 'inherit'}; font-weight: ${isEss ? 'bold' : 'normal'}" onclick="editTask('${day}', ${index})" title="Clique para editar">
            ${task} ${isEss ? '🍃' : ''}
          </span>
          
          <button class="btn" onclick="editTask('${day}', ${index})" style="padding: 6px 10px; font-size: 0.85rem; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.5);" title="Editar Tarefa">
            ✏️
          </button>

          <button class="btn" onclick="toggleEssentialTask('${day}', '${escapedTask}')" 
            style="padding: 6px 12px; font-size: 0.85rem; background: ${isEss ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}; color: ${isEss ? '#10b981' : '#94a3b8'}; border: 1px solid ${isEss ? '#10b981' : 'transparent'};"
            title="${isEss ? 'Remover da Rotina Mínima' : 'Adicionar à Rotina Mínima'}">
            ${isEss ? '🍃' : '⭕'}
          </button>
          
          <button class="btn btn-danger" onclick="deleteTask('${day}', ${index})" style="padding: 6px 12px; font-size: 0.85rem;">🗑️</button>
        </div>
      `}).join('');
}

// ========================================
// SISTEMA DE ABAS PERSONALIZADAS (NOVO)
// ========================================
function generateTabId(title) {
  // Gera ID único baseado no título + timestamp
  const base = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 20);
  return `custom-${base}-${Date.now()}`;
}

function createCustomTab() {
  const title = document.getElementById('newTabTitle').value.trim();
  const content = document.getElementById('newTabContent').value.trim();

  if (!title) {
    alert('⚠️ Por favor, insira um título para a aba.');
    return;
  }

  if (!content) {
    alert('⚠️ Por favor, insira um conteúdo para a aba.');
    return;
  }

  // Verificar se já existe uma aba com este título
  const existingTab = customTabs.find(tab => tab.title === title);
  if (existingTab) {
    alert('⚠️ Já existe uma aba com este título. Escolha outro nome.');
    return;
  }

  const newTab = {
    id: generateTabId(title),
    title: title,
    content: content,
    createdAt: new Date().toISOString()
  };

  customTabs.push(newTab);
  localStorage.setItem('customTabs', JSON.stringify(customTabs));

  // Criar a view dinamicamente
  createCustomTabView(newTab);

  // Atualizar HUD
  renderCustomTabsInHUD();

  // Limpar formulário
  clearTabForm();

  alert(`✅ Aba "${title}" criada com sucesso!`);

  // Navegar para a nova aba
  showView(newTab.id);
}

function createCustomTabView(tab) {
  // Verificar se a view já existe
  if (document.getElementById(tab.id)) {
    return;
  }

  const view = document.createElement('div');
  view.id = tab.id;
  view.className = 'view';
  view.innerHTML = `
        <div class="day-card" style="border-left: 4px solid #06b6d4;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #06b6d4;">📌 ${tab.title}</h2>
            <button class="btn btn-danger" onclick="deleteCustomTab('${tab.id}')" style="padding: 8px 15px;">🗑️ Excluir</button>
          </div>
          <div class="custom-tab-content">${tab.content}</div>
          <div style="margin-top: 20px; padding: 10px; background: rgba(148, 163, 184, 0.1); border-radius: 8px; font-size: 0.85rem; color: var(--text-muted);">
            📅 Criada em ${new Date(tab.createdAt).toLocaleDateString('pt-BR')} às ${new Date(tab.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;

  document.querySelector('.container').appendChild(view);
}

function deleteCustomTab(tabId) {
  const tab = customTabs.find(t => t.id === tabId);
  if (!tab) return;

  if (!confirm(`Tem certeza que deseja excluir a aba "${tab.title}"?`)) {
    return;
  }

  // Remover do array
  customTabs = customTabs.filter(t => t.id !== tabId);
  localStorage.setItem('customTabs', JSON.stringify(customTabs));

  // Remover a view do DOM
  const viewElement = document.getElementById(tabId);
  if (viewElement) {
    viewElement.remove();
  }

  // Atualizar HUD
  renderCustomTabsInHUD();

  // Voltar para o checklist
  showView('checklist');

  alert('✅ Aba excluída com sucesso!');
}

function renderCustomTabsInHUD() {
  const section = document.getElementById('customTabsSection');
  const list = document.getElementById('customTabsList');

  if (customTabs.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = customTabs.map(tab => `
        <div class="hud-item" onclick="showView('${tab.id}')">
          📌 ${tab.title}
          <button class="hud-item-delete" onclick="event.stopPropagation(); deleteCustomTab('${tab.id}')">×</button>
        </div>
      `).join('');
}

function loadCustomTabs() {
  customTabs.forEach(tab => {
    createCustomTabView(tab);
  });
  renderCustomTabsInHUD();
}

function clearTabForm() {
  document.getElementById('newTabTitle').value = '';
  document.getElementById('newTabContent').value = '';
}

// ========================================
// MODAL (MANTIDO)
// ========================================
function closeModal() {
  document.getElementById('justificationModal').classList.remove('active');
}

function saveWithJustification() {
  const txt = document.getElementById('justificationText').value;
  if (!txt) return alert("Escreva algo!");
  saveToHistory(pendingDay, false, txt);
  document.getElementById('justificationText').value = '';
  closeModal();
}

// ========================================
// INICIALIZAÇÃO
// ========================================
function init() {
  updateCurrentDate();
  renderChecklist();
  renderPlanning();

  // Aplicar tema salvo
  if (currentTheme) {
    applyTheme(currentTheme);
  }

  // Carregar abas personalizadas
  loadCustomTabs();

  // Adicionar listener ao select de dias para atualizar lista de tarefas
  const taskDaySelect = document.getElementById('taskDaySelect');
  if (taskDaySelect) {
    taskDaySelect.addEventListener('change', renderTaskManagement);
  }

  // Setup dos listeners de tema (precisa ser após DOM carregar)
  setTimeout(() => {
    setupThemeListeners();
  }, 100);
}

// Inicializar ao carregar a página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


// ========================================
// HUD MODAL: REGRAS DE CONDUTA (NOVO)
// ========================================

// === NOVA FUNCIONALIDADE CARDS ===

let currentCardIndex = 0;
let currentDayTasksForCard = [];

window.addEventListener('load', () => {
  // 1. Splash Screen
  const splash = document.createElement('div');
  splash.id = 'splashScreen';
  splash.innerHTML = '<div class="splash-emoji">✅</div>';
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.remove();
    }, 300);
  }, 800);

  // 2. Injetar Botão "Modo Cards do Dia" no HUD
  const hudMenu = document.getElementById('hudMenu');
  if (hudMenu) {
    const firstSection = hudMenu.querySelectorAll('.hud-section')[0];
    if (firstSection) {
      const cardsBtn = document.createElement('div');
      cardsBtn.className = 'hud-item';
      cardsBtn.innerHTML = '🎴 Modo Cards do Dia';
      cardsBtn.onclick = () => {
        startCardsMode();
        if (typeof toggleHUD === 'function') toggleHUD();
      };

      const checklistItem = Array.from(firstSection.querySelectorAll('.hud-item')).find(item => item.textContent.includes('Checklist'));
      if (checklistItem) {
        checklistItem.after(cardsBtn);
      } else {
        firstSection.appendChild(cardsBtn);
      }
    }
  }

  // 3. Criar a View do Modo Cards
  const mainContainer = document.querySelector('.container');
  if (mainContainer) {
    const cardsView = document.createElement('div');
    cardsView.id = 'cards-view';
    cardsView.className = 'view cards-mode-view';

    cardsView.innerHTML = `
            <div id="cardsModeContent" style="width:100%; display:flex; flex-direction:column; align-items:center;"></div>
            <button class="btn-back-mode" onclick="showView('checklist')">🔙 Voltar para Checklist Padrão</button>
        `;
    mainContainer.appendChild(cardsView);
  }

  // 4. Criar o HUD Final
  const hudEnd = document.createElement('div');
  hudEnd.id = 'hudEndMode';
  hudEnd.innerHTML = `
        <div class="hud-end-content">
            <h2>🎉 Parabéns!</h2>
            <p>Todos os cards do dia foram concluídos. A rotina foi resetada para amanhã.</p>
            <button class="btn btn-primary" style="width:100%; justify-content:center; font-size:1.2rem; padding: 15px;" onclick="closeAndResetCardsMode()">Fechar e Resetar</button>
        </div>
    `;
  document.body.appendChild(hudEnd);

  checkResetCardsMode();
});

function getCurrentDayNameForCards() {
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return days[new Date().getDay()];
}

function startCardsMode() {
  if (typeof showView === 'function') {
    showView('cards-view');
  } else {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('cards-view').classList.add('active');

  document.querySelectorAll('.hud-item').forEach(btn => btn.classList.remove('active'));

  const today = getCurrentDayNameForCards();
  let tasks = weekData[today] || [];

  const currentDateStr = new Date().toLocaleDateString();
  let cardsProgress = JSON.parse(localStorage.getItem('cardsProgress')) || {};

  if (cardsProgress.date !== currentDateStr) {
    cardsProgress = { date: currentDateStr, completedIndices: [] };
    localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));
  }

  const isMinimal = routineStates[today] === 'minimal';
  let visibleTasks = tasks.map((t, i) => ({ task: t, origIndex: i }));

  if (isMinimal && typeof isEssential === 'function') {
    visibleTasks = visibleTasks.filter(item => isEssential(item.task, today));
  }

  currentDayTasksForCard = visibleTasks;

  currentCardIndex = 0;
  while (currentCardIndex < currentDayTasksForCard.length && cardsProgress.completedIndices.includes(currentDayTasksForCard[currentCardIndex].origIndex)) {
    currentCardIndex++;
  }

  renderCard();
}

function renderCard() {
  const container = document.getElementById('cardsModeContent');
  if (!container) return;

  if (currentCardIndex >= currentDayTasksForCard.length && currentDayTasksForCard.length > 0) {
    container.innerHTML = '';
    setTimeout(() => {
      document.getElementById('hudEndMode').classList.add('active');
    }, 100);
    return;
  } else if (currentDayTasksForCard.length === 0) {
    container.innerHTML = '<h3 style="color:var(--text-color);">Nenhuma tarefa para hoje.</h3>';
    return;
  }

  const taskObj = currentDayTasksForCard[currentCardIndex];

  container.innerHTML = `
        <div class="daily-card-single" id="currentDailyCard">
            <div style="font-size: 0.8rem; color: var(--accent-color); margin-bottom: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Card ${currentCardIndex + 1} de ${currentDayTasksForCard.length}</div>
            <div class="daily-card-task">${taskObj.task}</div>
            <button class="btn-card-complete" onclick="completeCurrentCard()">✅ Concluir Tarefa</button>
        </div>
    `;
}

function completeCurrentCard() {
  const card = document.getElementById('currentDailyCard');
  if (card) {
    card.classList.add('fade-out');
  }

  const taskObj = currentDayTasksForCard[currentCardIndex];

  let cardsProgress = JSON.parse(localStorage.getItem('cardsProgress')) || {};
  if (!cardsProgress.completedIndices.includes(taskObj.origIndex)) {
    cardsProgress.completedIndices.push(taskObj.origIndex);
    localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));

    // Integrar com o checklist principal (marcar lá também silently)
    try {
      const today = getCurrentDayNameForCards();
      if (!checklist[today]) checklist[today] = {};
      checklist[today][taskObj.origIndex] = true;
      localStorage.setItem('checklist', JSON.stringify(checklist));
      if (typeof renderChecklist === 'function') renderChecklist();
    } catch (e) { }
  }

  setTimeout(() => {
    currentCardIndex++;
    renderCard();
  }, 300);
}

function closeAndResetCardsMode() {
  document.getElementById('hudEndMode').classList.remove('active');

  const currentDateStr = new Date().toLocaleDateString();
  let cardsProgress = { date: currentDateStr, completedIndices: [] };
  localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));

  // Desmarcar tudo no checklist principal de hoje
  try {
    const today = getCurrentDayNameForCards();
    if (checklist[today]) {
      checklist[today] = {};
      localStorage.setItem('checklist', JSON.stringify(checklist));
      if (typeof renderChecklist === 'function') renderChecklist();
    }
  } catch (e) { }

  if (typeof showView === 'function') {
    showView('checklist');
  }
}

function checkResetCardsMode() {
  const currentDateStr = new Date().toLocaleDateString();
  let cardsProgress = JSON.parse(localStorage.getItem('cardsProgress'));
  if (cardsProgress && cardsProgress.date !== currentDateStr) {
    cardsProgress = { date: currentDateStr, completedIndices: [] };
    localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));
  }
}
