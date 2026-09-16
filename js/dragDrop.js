// ==========================================================================
// DRAG AND DROP MODULE (REORDENAÇÃO POR ARRASTE)
// ==========================================================================

let draggedItem = null;
let draggedDay = null;
let draggedIndex = null;
let draggedCategory = null;

function initDragAndDrop(container, day, onReorderCallback) {
  if (!container) return;

  const items = container.querySelectorAll('.draggable-task-item');

  items.forEach((item) => {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      draggedDay = day;
      draggedIndex = parseInt(item.dataset.index, 10);
      draggedCategory = item.dataset.category || 'Geral';

      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedIndex.toString());

      setTimeout(() => {
        item.style.opacity = '0.35';
      }, 0);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      item.style.opacity = '1';
      document.querySelectorAll('.drag-over, .drag-over-bottom, .drag-over-top').forEach(el => {
        el.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-top');
      });
      draggedItem = null;
      draggedDay = null;
      draggedIndex = null;
      draggedCategory = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (!draggedItem || draggedItem === item) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        item.classList.add('drag-over-top');
        item.classList.remove('drag-over-bottom');
      } else {
        item.classList.add('drag-over-bottom');
        item.classList.remove('drag-over-top');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-top');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      item.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-top');

      if (!draggedItem || draggedItem === item || draggedDay !== day) return;

      const targetIndex = parseInt(item.dataset.index, 10);
      const targetCategory = item.dataset.category || 'Geral';

      if (isNaN(draggedIndex) || isNaN(targetIndex) || draggedIndex === targetIndex) return;

      reorderTasks(day, draggedIndex, targetIndex, targetCategory);

      if (typeof onReorderCallback === 'function') {
        onReorderCallback();
      }
    });
  });

  const categoryContainers = container.querySelectorAll('.category-drop-zone');
  categoryContainers.forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('category-drop-active');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('category-drop-active');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('category-drop-active');

      if (!draggedItem || draggedDay !== day) return;

      const targetCategory = zone.dataset.category;
      if (targetCategory && !isNaN(draggedIndex)) {
        moveTaskToCategory(day, draggedIndex, targetCategory);
        if (typeof onReorderCallback === 'function') {
          onReorderCallback();
        }
      }
    });
  });
}

function reorderTasks(day, fromIndex, toIndex, newCategory = null) {
  if (!window.state || !window.state.weekData[day]) return;

  const list = window.state.weekData[day];
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;

  const [movedTask] = list.splice(fromIndex, 1);

  if (newCategory) {
    movedTask.category = newCategory;
    if (window.getDayCategories) {
      const cats = window.getDayCategories(day);
      if (!cats.includes(newCategory)) {
        cats.push(newCategory);
        window.state.dayCategories[day] = cats;
        window.saveState('dayCategories');
      }
    }
  }

  list.splice(toIndex, 0, movedTask);

  window.saveState('weekData');
  if (window.performAutoSave) window.performAutoSave();
}

function moveTaskToCategory(day, taskIndex, targetCategory) {
  if (!window.state || !window.state.weekData[day] || !window.state.weekData[day][taskIndex]) return;

  window.state.weekData[day][taskIndex].category = targetCategory;

  if (window.getDayCategories) {
    const cats = window.getDayCategories(day);
    if (!cats.includes(targetCategory)) {
      cats.push(targetCategory);
      window.state.dayCategories[day] = cats;
      window.saveState('dayCategories');
    }
  }

  window.saveState('weekData');
  if (window.performAutoSave) window.performAutoSave();
}

window.initDragAndDrop = initDragAndDrop;
window.reorderTasks = reorderTasks;
window.moveTaskToCategory = moveTaskToCategory;
