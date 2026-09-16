// ==========================================================================
// PLANNING MODULE (PLANEJAMENTO, METAS & PROJETOS)
// ==========================================================================

function togglePlanningForm() {
  const form = document.getElementById('planningForm');
  const btn = document.querySelector('.toggle-form-btn');
  if (!form) return;

  if (form.style.display === 'block') {
    form.style.display = 'none';
    if (btn) btn.innerHTML = '➕ Novo Planejamento';
  } else {
    form.style.display = 'block';
    if (btn) btn.innerHTML = '✕ Fechar Formulário';
  }
}

function addPlan() {
  const title = document.getElementById('planTitle')?.value?.trim();
  const goal = document.getElementById('mainGoal')?.value?.trim();
  const plan = document.getElementById('actionPlan')?.value?.trim();

  if (!title || !goal || !plan) {
    alert('⚠️ Preencha todos os campos para criar o seu planejamento!');
    return;
  }

  if (!window.state) return;

  const newPlan = {
    id: `plan_${Date.now()}`,
    title,
    goal,
    plan,
    date: new Date().toLocaleDateString('pt-BR')
  };

  window.state.planning.unshift(newPlan);
  window.saveState('planning');
  if (window.performAutoSave) window.performAutoSave();

  if (document.getElementById('planTitle')) document.getElementById('planTitle').value = '';
  if (document.getElementById('mainGoal')) document.getElementById('mainGoal').value = '';
  if (document.getElementById('actionPlan')) document.getElementById('actionPlan').value = '';

  togglePlanningForm();
  renderPlanning();
  if (window.showToast) window.showToast('🎯 Planejamento criado com sucesso!', 'success');
}

function renderPlanning() {
  const container = document.getElementById('planningList');
  if (!container || !window.state) return;

  if (!window.state.planning || window.state.planning.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">Nenhum projeto ou planejamento registrado. Crie o primeiro objetivo! 🚀</div>';
    return;
  }

  container.innerHTML = window.state.planning.map((p, index) => `
    <div class="project-plan-card">
      <div class="project-plan-header">
        <div class="project-title-box">
          <span class="project-badge">PROJETO</span>
          <h3 class="project-title">${p.title}</h3>
          <span class="project-date">📅 Criado em ${p.date}</span>
        </div>
        <button onclick="window.deletePlan(${index})" class="btn-delete-project" title="Apagar Planejamento">🗑️</button>
      </div>

      <div class="project-plan-body">
        <div class="project-section goal-box" style="margin-bottom:12px;">
          <div class="project-label" style="font-weight:700; color:#fff; font-size:0.85rem;">🎯 Objetivo Principal</div>
          <div class="project-text" style="color:#d4d4d8; font-size:0.9rem; margin-top:4px;">${p.goal}</div>
        </div>

        <div class="project-section steps-box">
          <div class="project-label" style="font-weight:700; color:#fff; font-size:0.85rem;">🗺️ Plano de Ação (Etapas)</div>
          <div class="project-text" style="color:#d4d4d8; font-size:0.9rem; margin-top:4px;">${p.plan.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function deletePlan(index) {
  if (!window.state) return;
  if (confirm('Tem certeza que deseja apagar este planejamento?')) {
    window.state.planning.splice(index, 1);
    window.saveState('planning');
    if (window.performAutoSave) window.performAutoSave();
    renderPlanning();
    if (window.showToast) window.showToast('Planejamento excluído.', 'info');
  }
}

window.togglePlanningForm = togglePlanningForm;
window.addPlan = addPlan;
window.renderPlanning = renderPlanning;
window.deletePlan = deletePlan;
