// ==========================================================================
// CARDS MODE MODULE (MODO CARDS INDIVIDUAIS DE FOCO DIÁRIO)
// ==========================================================================

let currentCardIndex = 0;
let currentDayTasksForCard = [];

function getCurrentDayNameForCards() {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date().getDay()];
}
function startCardsMode() {

  if (window.showView) {
    window.showView('cards-view');
  } else {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const cv = document.getElementById('cards-view');
    if (cv) cv.classList.add('active');
  }

  const today = getCurrentDayNameForCards();
  const tasks = window.state ? (window.state.weekData[today] || []) : [];
  const currentDateStr = new Date().toLocaleDateString();

  let cardsProgress = JSON.parse(localStorage.getItem('cardsProgress')) || {};
  if (cardsProgress.date !== currentDateStr) {
    cardsProgress = { date: currentDateStr, completedIndices: [] };
    localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));
  }

  const isMinimal = window.state ? (window.state.routineStates[today] === 'minimal') : false;
  let visibleTasks = tasks
    .map((t, i) => ({ task: t, origIndex: i }))
    .filter(item => !isMinimal || (window.isEssential && window.isEssential(item.task, today)));

  currentDayTasksForCard = visibleTasks;

  currentCardIndex = 0;
  while (
    currentCardIndex < currentDayTasksForCard.length &&
    cardsProgress.completedIndices.includes(currentDayTasksForCard[currentCardIndex].origIndex)
  ) {
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
      const hudEnd = document.getElementById('hudEndMode');
      if (hudEnd) hudEnd.classList.add('active');
    }, 100);
    return;
  } else if (currentDayTasksForCard.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center; padding:30px; color:var(--text-muted);">
        <h3>Nenhuma tarefa pendente para hoje (${getCurrentDayNameForCards()}).</h3>
      </div>
    `;
    return;
  }

  const taskObj = currentDayTasksForCard[currentCardIndex];
  const taskText = taskObj.task.text || taskObj.task;
  const taskCat = taskObj.task.category || 'Geral';

  container.innerHTML = `
    <div class="daily-card-single" id="currentDailyCard">
      <div class="card-meta-bar">
        <span class="card-count-badge">Card ${currentCardIndex + 1} de ${currentDayTasksForCard.length}</span>
        <span class="card-cat-badge">📁 ${taskCat}</span>
      </div>
      <div class="daily-card-task">${taskText}</div>
      <button class="btn-card-complete" onclick="window.completeCurrentCard()">
        ✅ Concluir Tarefa
      </button>
    </div>
  `;
}

function completeCurrentCard() {
  const card = document.getElementById('currentDailyCard');
  if (card) {
    card.classList.add('fade-out');
  }

  const taskObj = currentDayTasksForCard[currentCardIndex];
  const currentDateStr = new Date().toLocaleDateString();
  let cardsProgress = JSON.parse(localStorage.getItem('cardsProgress')) || { date: currentDateStr, completedIndices: [] };

  if (!cardsProgress.completedIndices.includes(taskObj.origIndex)) {
    cardsProgress.completedIndices.push(taskObj.origIndex);
    localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));

    try {
      const today = getCurrentDayNameForCards();
      if (window.state) {
        if (!window.state.checklist[today]) window.state.checklist[today] = {};
        const taskId = taskObj.task.id || taskObj.task.text || taskObj.origIndex;
        window.state.checklist[today][taskId] = true;
        window.saveState('checklist');
        if (window.performAutoSave) window.performAutoSave();
        if (window.renderChecklist) window.renderChecklist();
      }
    } catch (e) {
      console.error(e);
    }
  }

  setTimeout(() => {
    currentCardIndex++;
    renderCard();
  }, 250);
}

function closeAndResetCardsMode() {
  const hudEnd = document.getElementById('hudEndMode');
  if (hudEnd) hudEnd.classList.remove('active');

  const currentDateStr = new Date().toLocaleDateString();
  const cardsProgress = { date: currentDateStr, completedIndices: [] };
  localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));

  try {
    const today = getCurrentDayNameForCards();
    if (window.state && window.state.checklist[today]) {
      window.state.checklist[today] = {};
      window.saveState('checklist');
      if (window.performAutoSave) window.performAutoSave();
      if (window.renderChecklist) window.renderChecklist();
    }
  } catch (e) {
    console.error(e);
  }

  if (window.showView) window.showView('checklist');
}

function checkResetCardsMode() {
  const currentDateStr = new Date().toLocaleDateString();
  const cardsProgress = JSON.parse(localStorage.getItem('cardsProgress'));
  if (cardsProgress && cardsProgress.date !== currentDateStr) {
    localStorage.setItem('cardsProgress', JSON.stringify({ date: currentDateStr, completedIndices: [] }));
  }
}

window.getCurrentDayNameForCards = getCurrentDayNameForCards;
window.startCardsMode = startCardsMode;
window.renderCard = renderCard;
window.completeCurrentCard = completeCurrentCard;
window.closeAndResetCardsMode = closeAndResetCardsMode;
window.checkResetCardsMode = checkResetCardsMode;
