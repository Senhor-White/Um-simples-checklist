// ==========================================================================
// TASK MANAGER MODULE (GERENCIAMENTO DE TAREFAS & BLOCOS CATEGORIZADOS)
// ==========================================================================

function getDayCategories(day) {
  if (!window.state) return ['Geral'];
  if (!window.state.dayCategories) window.state.dayCategories = {};

  if (!window.state.dayCategories[day] || !Array.isArray(window.state.dayCategories[day])) {
    const taskCats = Array.from(new Set((window.state.weekData[day] || []).map(t => t.category || 'Geral')));
    window.state.dayCategories[day] = taskCats.length > 0 ? taskCats : ['Geral'];
  }

  // Garantir que categorias usadas em tarefas existentes estejam na lista
  const tasks = window.state.weekData[day] || [];
  tasks.forEach(t => {
    const cat = t.category || 'Geral';
    if (!window.state.dayCategories[day].includes(cat)) {
      window.state.dayCategories[day].push(cat);
    }
  });

  if (!window.state.dayCategories[day].includes('Geral')) {
    window.state.dayCategories[day].unshift('Geral');
  }

  return window.state.dayCategories[day];
}

function isEssential(taskObjOrText, day) {
  if (!window.state || !window.state.essentialTasks[day]) return false;
  const taskText = typeof taskObjOrText === 'string' ? taskObjOrText : taskObjOrText.text;
  const taskId = typeof taskObjOrText === 'object' ? taskObjOrText.id : null;
  return window.state.essentialTasks[day].some(t => t === taskText || (taskId && t === taskId));
}

function addCategory(day, categoryName) {
  const name = categoryName ? categoryName.trim() : '';
  if (!name || !window.state) return false;

  const cats = getDayCategories(day);
  if (!cats.includes(name)) {
    cats.push(name);
    window.state.dayCategories[day] = cats;
    window.saveState('dayCategories');
    if (window.performAutoSave) window.performAutoSave();
    return true;
  }
  return false;
}

function moveCategory(day, categoryName, position) {
  if (!window.state || !categoryName) return;
  const cats = getDayCategories(day);
  const currentIndex = cats.indexOf(categoryName);

  if (currentIndex === -1) return;

  let targetIndex = currentIndex;

  if (position === 'top') {
    targetIndex = 0;
  } else if (position === 'bottom') {
    targetIndex = cats.length - 1;
  } else if (position === 'up') {
    targetIndex = Math.max(0, currentIndex - 1);
  } else if (position === 'down') {
    targetIndex = Math.min(cats.length - 1, currentIndex + 1);
  } else if (typeof position === 'number') {
    targetIndex = Math.max(0, Math.min(cats.length - 1, position));
  }

  if (currentIndex === targetIndex) return;

  // Reordena o array de categorias
  const [removed] = cats.splice(currentIndex, 1);
  cats.splice(targetIndex, 0, removed);

  window.state.dayCategories[day] = cats;
  window.saveState('dayCategories');
  if (window.performAutoSave) window.performAutoSave();

  // Atualiza as visualizações
  renderTaskManagement();
  if (window.renderChecklist) window.renderChecklist();
  if (window.showToast) window.showToast(`Bloco "${categoryName}" movido com sucesso!`, 'info');
}

function deleteCategory(day, categoryName) {
  if (!categoryName || categoryName === 'Geral') {
    alert('A categoria "Geral" não pode ser excluída.');
    return;
  }
  if (confirm(`Excluir o bloco "${categoryName}" de ${day}? As tarefas deste bloco serão movidas para "Geral".`)) {
    if (window.state.dayCategories && window.state.dayCategories[day]) {
      window.state.dayCategories[day] = window.state.dayCategories[day].filter(c => c !== categoryName);
    }

    if (window.state.weekData[day]) {
      window.state.weekData[day].forEach(task => {
        if (task.category === categoryName) {
          task.category = 'Geral';
        }
      });
    }

    window.saveState('dayCategories');
    window.saveState('weekData');
    if (window.performAutoSave) window.performAutoSave();
    renderTaskManagement();
    if (window.renderChecklist) window.renderChecklist();
  }
}

function addNewTask(dayOverride, categoryOverride, textOverride) {
  const daySelect = document.getElementById('taskDaySelect');
  const day = dayOverride || (daySelect ? daySelect.value : 'Segunda-feira');

  const catSelect = document.getElementById('taskCategorySelect');
  const category = categoryOverride || (catSelect ? catSelect.value : 'Geral');

  const taskInput = document.getElementById('newTaskInput');
  const taskText = textOverride !== undefined ? textOverride.trim() : (taskInput ? taskInput.value.trim() : '');

  if (!taskText) {
    alert('⚠️ Por favor, digite a descrição da tarefa!');
    return;
  }

  if (!window.state.weekData[day]) {
    window.state.weekData[day] = [];
  }

  // Garantir que a categoria esteja cadastrada para este dia
  const cats = getDayCategories(day);
  if (!cats.includes(category)) {
    cats.push(category);
    window.state.dayCategories[day] = cats;
    window.saveState('dayCategories');
  }

  const newTask = {
    id: window.generateId ? window.generateId('task') : `task_${Date.now()}`,
    text: taskText,
    category: category || 'Geral'
  };

  window.state.weekData[day].push(newTask);
  window.saveState('weekData');
  if (window.performAutoSave) window.performAutoSave();

  if (taskInput) taskInput.value = '';
  renderTaskManagement();

  if (window.renderChecklist) window.renderChecklist();
  if (window.showToast) window.showToast(`✅ Tarefa adicionada em ${day} (${category})!`, 'success');

  return newTask;
}

function editTask(day, taskIndex) {
  const task = window.state.weekData[day]?.[taskIndex];
  if (!task) return;

  const currentText = typeof task === 'string' ? task : task.text;
  const newText = prompt('Editar tarefa:', currentText);

  if (newText !== null && newText.trim() !== '' && newText.trim() !== currentText) {
    const updatedText = newText.trim();
    if (typeof task === 'string') {
      window.state.weekData[day][taskIndex] = updatedText;
    } else {
      task.text = updatedText;
    }

    if (window.state.essentialTasks[day]) {
      const essIdx = window.state.essentialTasks[day].findIndex(t => t === currentText || (task.id && t === task.id));
      if (essIdx !== -1) {
        window.state.essentialTasks[day][essIdx] = updatedText;
        window.saveState('essentialTasks');
      }
    }

    window.saveState('weekData');
    if (window.performAutoSave) window.performAutoSave();
    renderTaskManagement();
    if (window.renderChecklist) window.renderChecklist();
  }
}

function changeTaskCategory(day, taskIndex, newCategory) {
  const task = window.state.weekData[day]?.[taskIndex];
  if (!task) return;
  task.category = newCategory;

  const cats = getDayCategories(day);
  if (!cats.includes(newCategory)) {
    cats.push(newCategory);
    window.state.dayCategories[day] = cats;
    window.saveState('dayCategories');
  }

  window.saveState('weekData');
  if (window.performAutoSave) window.performAutoSave();
  renderTaskManagement();
  if (window.renderChecklist) window.renderChecklist();
}

function deleteTask(day, taskIndex) {
  if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;

  const task = window.state.weekData[day]?.[taskIndex];
  if (!task) return;

  const taskText = typeof task === 'string' ? task : task.text;
  const taskId = typeof task === 'object' ? task.id : null;

  window.state.weekData[day].splice(taskIndex, 1);

  if (window.state.essentialTasks[day]) {
    window.state.essentialTasks[day] = window.state.essentialTasks[day].filter(t => t !== taskText && t !== taskId);
    window.saveState('essentialTasks');
  }

  if (window.state.checklist[day]) {
    if (taskId && window.state.checklist[day][taskId] !== undefined) {
      delete window.state.checklist[day][taskId];
    }
    window.saveState('checklist');
  }

  window.saveState('weekData');
  if (window.performAutoSave) window.performAutoSave();
  renderTaskManagement();
  if (window.renderChecklist) window.renderChecklist();
}

function toggleEssentialTask(day, taskIdentifier) {
  if (!window.state.essentialTasks[day]) window.state.essentialTasks[day] = [];

  const index = window.state.essentialTasks[day].indexOf(taskIdentifier);
  if (index === -1) {
    window.state.essentialTasks[day].push(taskIdentifier);
  } else {
    window.state.essentialTasks[day].splice(index, 1);
  }

  window.saveState('essentialTasks');
  if (window.performAutoSave) window.performAutoSave();
  renderTaskManagement();
  if (window.renderChecklist) window.renderChecklist();
}

function promptNewCategory() {
  const daySelect = document.getElementById('taskDaySelect');
  const day = daySelect ? daySelect.value : 'Segunda-feira';

  const name = prompt(`Digite o nome do novo Bloco/Categoria de Tarefas para ${day} (Ex: Estudo - Português, Trabalho, Ciências):`);
  if (name && name.trim()) {
    const success = addCategory(day, name.trim());
    if (success) {
      renderTaskManagement();
      if (window.renderChecklist) window.renderChecklist();
      alert(`✅ Bloco "${name.trim()}" criado com sucesso para ${day}!`);
    } else {
      alert(`⚠️ Categoria já existe para ${day} ou nome inválido.`);
    }
  }
}

function renderTaskManagement() {
  const daySelect = document.getElementById('taskDaySelect');
  if (!daySelect || !window.state) return;
  const day = daySelect.value;
  const container = document.getElementById('taskManagementList');
  if (!container) return;

  const dayCats = getDayCategories(day);

  const categorySelect = document.getElementById('taskCategorySelect');
  if (categorySelect) {
    categorySelect.innerHTML = dayCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  const tasks = window.state.weekData[day] || [];

  const groupedTasks = {};
  dayCats.forEach(cat => {
    groupedTasks[cat] = [];
  });

  tasks.forEach((task, origIndex) => {
    const cat = task.category || 'Geral';
    if (!groupedTasks[cat]) {
      groupedTasks[cat] = [];
      if (!dayCats.includes(cat)) {
        dayCats.push(cat);
      }
    }
    groupedTasks[cat].push({ task, origIndex });
  });

  let html = `
    <div class="blocks-header-bar">
      <span class="blocks-count-badge">📊 Total de tarefas em ${day}: <strong>${tasks.length}</strong> em <strong>${dayCats.length}</strong> blocos</span>
      <button class="btn btn-outline-neon" onclick="window.promptNewCategory()">➕ Criar Novo Bloco em ${day}</button>
    </div>
  `;

  dayCats.forEach((cat, catIndex) => {
    const items = groupedTasks[cat] || [];
    const catTotal = items.length;
    const isFirst = catIndex === 0;
    const isLast = catIndex === dayCats.length - 1;

    html += `
      <div class="task-category-block" data-category="${cat}">
        <div class="category-block-header">
          <div class="category-block-title">
            <span class="category-icon">📁</span>
            <h3>${cat}</h3>
            <span class="category-badge">${catTotal} ${catTotal === 1 ? 'item' : 'itens'}</span>
          </div>
          <div class="category-block-actions">
            <div class="category-move-group">
              <button class="btn-block-move" onclick="window.moveCategory('${day}', '${cat}', 'top')" title="Mover para o Topo" ${isFirst ? 'disabled' : ''}>⏫ Topo</button>
              <button class="btn-block-move" onclick="window.moveCategory('${day}', '${cat}', 'up')" title="Subir Bloco" ${isFirst ? 'disabled' : ''}>🔼</button>
              <button class="btn-block-move" onclick="window.moveCategory('${day}', '${cat}', 'down')" title="Descer Bloco" ${isLast ? 'disabled' : ''}>🔽</button>
              <button class="btn-block-move" onclick="window.moveCategory('${day}', '${cat}', 'bottom')" title="Mover para o Fim" ${isLast ? 'disabled' : ''}>⏬ Fim</button>
            </div>
            <button class="btn-block-action" onclick="window.quickAddTaskToBlock('${day}', '${cat}')" title="Adicionar tarefa neste bloco">➕ Nova Tarefa</button>
            ${cat !== 'Geral' ? `<button class="btn-block-delete" onclick="window.deleteCategory('${day}', '${cat}')" title="Excluir este bloco">🗑️</button>` : ''}
          </div>
        </div>

        <div class="category-block-items category-drop-zone" data-category="${cat}">
          ${items.length === 0 ? `
            <div class="category-empty-dropzone" data-category="${cat}">
              <span>Nenhuma tarefa neste bloco em ${day}. Arraste itens aqui ou clique em "+ Nova Tarefa"</span>
            </div>
          ` : items.map(({ task, origIndex }) => {
            const isEss = isEssential(task, day);
            const taskText = task.text || task;
            const taskIdentifier = task.id || taskText;

            return `
              <div class="draggable-task-item" draggable="true" data-index="${origIndex}" data-category="${cat}">
                <div class="drag-handle" title="Segure e arraste para reordenar">⠿</div>
                <div class="task-info" onclick="window.editTask('${day}', ${origIndex})" title="Clique para editar texto">
                  <span class="task-name ${isEss ? 'is-essential' : ''}">${taskText}</span>
                  ${isEss ? '<span class="badge-essential" title="Tarefa Essencial (Rotina Mínima)">🍃 Mínima</span>' : ''}
                </div>

                <div class="task-item-actions">
                  <select class="category-inline-select" onchange="window.changeTaskCategory('${day}', ${origIndex}, this.value)" title="Mover para outro bloco">
                    ${dayCats.map(c => `<option value="${c}" ${c === cat ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>

                  <button class="btn-icon-action btn-essential ${isEss ? 'active' : ''}" 
                    onclick="window.toggleEssentialTask('${day}', '${taskIdentifier}')"
                    title="${isEss ? 'Remover da Rotina Mínima' : 'Tornar Essencial na Rotina Mínima'}">
                    ${isEss ? '🍃' : '⭕'}
                  </button>

                  <button class="btn-icon-action btn-edit" onclick="window.editTask('${day}', ${origIndex})" title="Editar Tarefa">
                    ✏️
                  </button>

                  <button class="btn-icon-action btn-delete" onclick="window.deleteTask('${day}', ${origIndex})" title="Excluir Tarefa">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  if (window.initDragAndDrop) {
    window.initDragAndDrop(container, day, () => {
      renderTaskManagement();
      if (window.renderChecklist) window.renderChecklist();
    });
  }
}

function quickAddTaskToBlock(day, category) {
  const text = prompt(`Adicionar nova tarefa no bloco "${category}" para ${day}:`);
  if (text && text.trim()) {
    addNewTask(day, category, text.trim());
  }
}

window.getDayCategories = getDayCategories;
window.isEssential = isEssential;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addNewTask = addNewTask;
window.editTask = editTask;
window.changeTaskCategory = changeTaskCategory;
window.deleteTask = deleteTask;
window.toggleEssentialTask = toggleEssentialTask;
window.promptNewCategory = promptNewCategory;
window.renderTaskManagement = renderTaskManagement;
window.quickAddTaskToBlock = quickAddTaskToBlock;
window.moveCategory = moveCategory;
