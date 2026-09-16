// ==========================================================================
// HISTORY MODULE (HISTÓRICO DE DIAS CONCLUÍDOS & JUSTIFICATIVAS)
// ==========================================================================

function saveToHistory(day, completed, justification) {
  if (!window.state) return;
  const now = new Date();
  const isMinimal = window.state.routineStates[day] === 'minimal';
  const tasks = window.state.weekData[day] || [];

  const visibleTasks = tasks.filter(t => !isMinimal || (window.isEssential && window.isEssential(t, day)));
  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => window.state.checklist[day]?.[t.id] || window.state.checklist[day]?.[t.text]).length;

  window.state.history.unshift({
    id: `hist_${Date.now()}`,
    day,
    date: now.toLocaleDateString('pt-BR'),
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    completed,
    completedTasks,
    totalTasks,
    justification
  });

  window.state.checklist[day] = {};
  window.saveState('history');
  window.saveState('checklist');
  if (window.performAutoSave) window.performAutoSave();

  if (window.renderChecklist) window.renderChecklist();
  renderHistory();
  if (window.showView) window.showView('history');
  if (window.showToast) window.showToast('✅ Registro salvo no Histórico!', 'success');
}

function filterHistory(filter) {
  if (!window.state) return;
  window.state.currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (window.event && window.event.target) window.event.target.classList.add('active');
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('historyContainer');
  if (!container || !window.state) return;

  let filtered = window.state.currentFilter === 'all'
    ? window.state.history
    : window.state.history.filter(h => (window.state.currentFilter === 'completed' ? h.completed : !h.completed));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state" style="text-align:center; padding:30px; color:var(--text-muted);">🔭 Nenhum registro no histórico ainda.</div>';
    return;
  }

  container.innerHTML = filtered.map(item => {
    const globalIndex = window.state.history.indexOf(item);
    const isComp = item.completed;

    return `
      <div class="history-card ${isComp ? 'status-completed' : 'status-incomplete'}">
        <div class="history-card-header">
          <div class="history-date-box">
            <span class="history-day-title">${item.day}</span>
            <span class="history-date-sub">${item.date} • ${item.time}</span>
          </div>
          <div class="history-status-badge ${isComp ? 'badge-complete' : 'badge-incomplete'}">
            ${isComp ? '✅ Concluído' : '⚠️ Incompleto'}
          </div>
        </div>

        <div class="history-progress-summary">
          <span>Progresso: <strong>${item.completedTasks} / ${item.totalTasks} tarefas</strong></span>
          <div class="history-actions-bar">
            <button onclick="window.editHistoryDate(${globalIndex})" class="btn-icon-history" title="Editar Data">✏️ Data</button>
            <button onclick="window.deleteHistoryEntry(${globalIndex})" class="btn-icon-history btn-delete" title="Excluir Registro">🗑️</button>
          </div>
        </div>

        ${item.justification ? `
          <div class="history-justification-box">
            <span class="justification-label">💬 Justificativa:</span>
            <p>${item.justification}</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function editHistoryDate(index) {
  if (!window.state || index === -1 || !window.state.history[index]) return;

  const newDate = prompt('Digite a nova data (DD/MM/AAAA):', window.state.history[index].date);
  if (newDate) {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(newDate)) {
      alert('Por favor, use o formato DD/MM/AAAA (ex: 25/08/2026).');
      return;
    }

    const [d, m, y] = newDate.split('/').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (isNaN(dateObj.getTime())) {
      alert('Data inválida.');
      return;
    }

    window.state.history[index].date = newDate;
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    window.state.history[index].day = weekdays[dateObj.getDay()];

    window.saveState('history');
    if (window.performAutoSave) window.performAutoSave();
    renderHistory();
    if (window.showToast) window.showToast('✅ Data atualizada!', 'success');
  }
}

function deleteHistoryEntry(index) {
  if (!window.state || index === -1 || !window.state.history[index]) return;

  if (confirm(`Remover o registro de ${window.state.history[index].day} (${window.state.history[index].date})?`)) {
    window.state.history.splice(index, 1);
    window.saveState('history');
    if (window.performAutoSave) window.performAutoSave();
    renderHistory();
    if (window.showToast) window.showToast('Registro removido do histórico.', 'info');
  }
}

function closeModal() {
  const modal = document.getElementById('justificationModal');
  if (modal) modal.classList.remove('active');
}

function saveWithJustification() {
  const txt = document.getElementById('justificationText')?.value;
  if (!txt || !txt.trim()) {
    alert('Por favor, insira uma justificativa.');
    return;
  }
  saveToHistory(window.state.pendingDay, false, txt.trim());
  const input = document.getElementById('justificationText');
  if (input) input.value = '';
  closeModal();
}

window.saveToHistory = saveToHistory;
window.filterHistory = filterHistory;
window.renderHistory = renderHistory;
window.editHistoryDate = editHistoryDate;
window.deleteHistoryEntry = deleteHistoryEntry;
window.closeModal = closeModal;
window.saveWithJustification = saveWithJustification;
