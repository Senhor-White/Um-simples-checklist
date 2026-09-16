// ==========================================================================
// CHECKLIST MODULE (VIEW SEMANAL COM BLOCOS CATEGORIZADOS & PROGRESSO NEON)
// ==========================================================================

function toggleTask(day, taskIdOrIndex) {
  if (!window.state) return;
  if (!window.state.checklist[day]) window.state.checklist[day] = {};
  window.state.checklist[day][taskIdOrIndex] = !window.state.checklist[day][taskIdOrIndex];
  window.saveState('checklist');
  if (window.performAutoSave) window.performAutoSave();
  renderChecklist();
}

function completeDay(day) {
  if (!window.state) return;
  const isMinimal = window.state.routineStates[day] === 'minimal';
  const tasks = window.state.weekData[day] || [];

  const visibleTasks = tasks.filter(t => !isMinimal || (window.isEssential && window.isEssential(t, day)));
  const total = visibleTasks.length;
  const completedCount = visibleTasks.filter(t => window.state.checklist[day]?.[t.id] || window.state.checklist[day]?.[t.text]).length;

  if (completedCount === total && total > 0) {
    if (window.saveToHistory) {
      window.saveToHistory(day, true, isMinimal ? 'Rotina Mínima Cumprida' : '');
    }
  } else {
    window.state.pendingDay = day;
    const modal = document.getElementById('justificationModal');
    if (modal) modal.classList.add('active');
  }
}

function resetChecklist() {
  if (confirm('Resetar tarefas do dia de hoje?')) {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const today = days[new Date().getDay()];
    if (window.state) {
      window.state.checklist[today] = {};
      window.saveState('checklist');
      if (window.performAutoSave) window.performAutoSave();
      renderChecklist();
      if (window.showToast) window.showToast(`Tarefas de ${today} resetadas.`, 'info');
    }
  }
}

function toggleRoutine(day) {
  if (!window.state) return;
  window.state.pendingRoutineDay = day;
  const current = window.state.routineStates[day] || 'normal';
  const modal = document.getElementById('routineModal');
  const title = document.getElementById('routineModalTitle');
  const icon = document.getElementById('routineModalIcon');

  if (modal && title && icon) {
    if (current === 'normal') {
      title.textContent = 'Deseja ativar a rotina mínima para hoje?';
      icon.textContent = '🍃';
    } else {
      title.textContent = 'Deseja alterar para rotina comum completa?';
      icon.textContent = '🔥';
    }
    modal.classList.add('active');
  }
}

function closeRoutineModal() {
  const modal = document.getElementById('routineModal');
  if (modal) modal.classList.remove('active');
  if (window.state) window.state.pendingRoutineDay = null;
}

function confirmRoutineChange() {
  if (!window.state || !window.state.pendingRoutineDay) return;
  const day = window.state.pendingRoutineDay;
  const current = window.state.routineStates[day] || 'normal';
  window.state.routineStates[day] = current === 'normal' ? 'minimal' : 'normal';
  window.saveState('routineStates');
  if (window.performAutoSave) window.performAutoSave();
  renderChecklist();
  closeRoutineModal();
}

function renderChecklist() {
  const container = document.getElementById('weekContainer');
  if (!container || !window.state) return;
  container.innerHTML = '';

  const dayKeys = Object.keys(window.state.weekData);

  dayKeys.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';

    const isMinimal = window.state.routineStates[day] === 'minimal';
    const allTasks = window.state.weekData[day] || [];

    const visibleTasks = allTasks.filter(item => !isMinimal || (window.isEssential && window.isEssential(item, day)));

    const total = visibleTasks.length;
    const completed = visibleTasks.filter(item => window.state.checklist[day]?.[item.id] || window.state.checklist[day]?.[item.text]).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const categoriesInDay = {};
    visibleTasks.forEach(task => {
      const cat = task.category || 'Geral';
      if (!categoriesInDay[cat]) categoriesInDay[cat] = [];
      categoriesInDay[cat].push(task);
    });

    const configuredCategories = window.getDayCategories ? window.getDayCategories(day) : Object.keys(categoriesInDay);
    const orderedActiveCats = configuredCategories.filter(cat => categoriesInDay[cat] && categoriesInDay[cat].length > 0);

    let blocksHtml = '';

    if (orderedActiveCats.length === 0) {
      blocksHtml = `
        <div class="empty-day-message" style="text-align:center; padding:20px; color:var(--text-muted);">
          <span>Sem tarefas programadas. Vá em "Gerenciar Blocos" para cadastrar blocos e atividades.</span>
        </div>
      `;
    } else {
      orderedActiveCats.forEach(cat => {
        const catTasks = categoriesInDay[cat];
        const catCompleted = catTasks.filter(t => window.state.checklist[day]?.[t.id] || window.state.checklist[day]?.[t.text]).length;
        const catTotal = catTasks.length;
        const isCatDone = catTotal > 0 && catCompleted === catTotal;

        blocksHtml += `
          <div class="checklist-category-block ${isCatDone ? 'all-done' : ''}">
            <div class="checklist-cat-header">
              <div class="checklist-cat-title">
                <span class="cat-dot"></span>
                <strong>${cat}</strong>
              </div>
              <span class="cat-progress-count">${catCompleted}/${catTotal}</span>
            </div>
            <div class="task-list">
              ${catTasks.map(task => {
                const taskId = task.id || task.text;
                const isChecked = Boolean(window.state.checklist[day]?.[taskId] || (task.text && window.state.checklist[day]?.[task.text]));
                const isEss = window.isEssential && window.isEssential(task, day);

                return `
                  <div class="task-item ${isChecked ? 'completed' : ''}" onclick="if (event.target.type !== 'checkbox') window.toggleTask('${day}', '${task.id || task.text}')">
                    <label class="neon-checkbox-label">
                      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.toggleTask('${day}', '${task.id || task.text}')">
                      <span class="neon-custom-checkbox"></span>
                    </label>
                    <span class="task-text">${task.text || task}</span>
                    ${isEss ? '<span class="mini-leaf" title="Rotina Mínima">🍃</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      });
    }

    dayCard.innerHTML = `
      <div class="day-header">
        <div class="day-title">
          <span>📅 ${day}</span>
          <button class="routine-toggle-btn ${isMinimal ? 'minimal-active' : ''}" onclick="window.toggleRoutine('${day}')" title="${isMinimal ? 'Rotina Mínima ativa (Clique para mudar)' : 'Ativar Rotina Mínima'}">
            ${isMinimal ? '🍃 Mínima' : '🔥 Completa'}
          </button>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill ${percentage === 100 ? 'done' : ''}" style="width: ${percentage}%"></div>
          </div>
          <div class="progress-count ${percentage === 100 ? 'is-complete' : ''}">${completed}/${total} (${percentage}%)</div>
        </div>
      </div>

      <div class="day-categories-container">
        ${blocksHtml}
      </div>

      <button class="complete-day-btn ${completed === total && total > 0 ? 'btn-ready' : ''}" onclick="window.completeDay('${day}')">
        ✅ Finalizar ${day}
      </button>
    `;

    container.appendChild(dayCard);
  });
}

window.toggleTask = toggleTask;
window.completeDay = completeDay;
window.resetChecklist = resetChecklist;
window.toggleRoutine = toggleRoutine;
window.closeRoutineModal = closeRoutineModal;
window.confirmRoutineChange = confirmRoutineChange;
window.renderChecklist = renderChecklist;
