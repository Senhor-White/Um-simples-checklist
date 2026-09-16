// ==========================================================================
// HABITS MODULE (GESTÃO DE HÁBITOS BONS E MAUS)
// ==========================================================================

function addHabit() {
  const input = document.getElementById('habitInput');
  const type = document.getElementById('habitType')?.value || 'good';
  const text = input ? input.value.trim() : '';

  if (!text || !window.state) return;

  if (type === 'good') {
    window.state.habits.good.push(text);
  } else {
    window.state.habits.bad.push({ text: text, destroyed: false, dateDestroyed: null });
  }

  window.saveState('habits');
  if (window.performAutoSave) window.performAutoSave();
  if (input) input.value = '';
  renderHabits();
  if (window.showToast) window.showToast('✅ Hábito adicionado!', 'success');
}

function renderHabits() {
  const goodList = document.getElementById('goodHabitsList');
  const badList = document.getElementById('badHabitsList');
  if (!window.state) return;

  if (goodList) {
    if (window.state.habits.good.length === 0) {
      goodList.innerHTML = '<div class="empty-list-hint" style="color:var(--text-muted); padding:10px;">Nenhum hábito positivo adicionado ainda.</div>';
    } else {
      goodList.innerHTML = window.state.habits.good.map((h, i) => `
        <div class="habit-item habit-good">
          <span class="habit-text">✨ ${h}</span>
          <button onclick="window.removeHabit('good', ${i})" class="btn-delete-habit" title="Remover">×</button>
        </div>
      `).join('');
    }
  }

  if (badList) {
    if (window.state.habits.bad.length === 0) {
      badList.innerHTML = '<div class="empty-list-hint" style="color:var(--text-muted); padding:10px;">Nenhum hábito para eliminar registrado.</div>';
    } else {
      badList.innerHTML = window.state.habits.bad.map((h, i) => `
        <div class="habit-item habit-bad ${h.destroyed ? 'destroyed' : ''}">
          <span class="habit-text">${h.destroyed ? '💀' : '👹'} ${h.text}</span>
          <div class="habit-actions">
            ${!h.destroyed 
              ? `<button onclick="window.destroyHabit(${i})" class="btn-destroy-habit">💥 Destruir</button>` 
              : `<span class="destroyed-badge" style="font-size:0.75rem; color:var(--text-muted); margin-right:6px;">Destruído (${h.dateDestroyed})</span>`
            }
            <button onclick="window.removeHabit('bad', ${i})" class="btn-delete-habit" title="Remover">×</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function destroyHabit(index) {
  if (!window.state) return;
  if (confirm('Parabéns! Você realmente eliminou e destruiu esse hábito?')) {
    window.state.habits.bad[index].destroyed = true;
    window.state.habits.bad[index].dateDestroyed = new Date().toLocaleDateString('pt-BR');
    window.saveState('habits');
    if (window.performAutoSave) window.performAutoSave();
    renderHabits();
    if (window.showToast) window.showToast('💥 Hábito destruído com sucesso!', 'success');
  }
}

function removeHabit(type, index) {
  if (!window.state) return;
  if (confirm('Remover este item da lista de hábitos?')) {
    if (type === 'good') {
      window.state.habits.good.splice(index, 1);
    } else {
      window.state.habits.bad.splice(index, 1);
    }
    window.saveState('habits');
    if (window.performAutoSave) window.performAutoSave();
    renderHabits();
  }
}

window.addHabit = addHabit;
window.renderHabits = renderHabits;
window.destroyHabit = destroyHabit;
window.removeHabit = removeHabit;
