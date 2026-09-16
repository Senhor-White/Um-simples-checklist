// ==========================================================================
// REFLECTION MODULE (ANÁLISE DE ERROS & APRENDIZADOS)
// ==========================================================================

function addError() {
  const title = document.getElementById('errorTitle')?.value?.trim();
  const cause = document.getElementById('errorCause')?.value?.trim();
  const fix = document.getElementById('errorFix')?.value?.trim();

  if (!title || !cause || !fix) {
    alert('⚠️ Preencha todos os 3 campos para uma análise completa do aprendizado!');
    return;
  }

  if (!window.state) return;

  window.state.errors.unshift({
    id: `err_${Date.now()}`,
    title,
    cause,
    fix,
    date: new Date().toLocaleDateString('pt-BR')
  });

  window.saveState('errors');
  if (window.performAutoSave) window.performAutoSave();

  if (document.getElementById('errorTitle')) document.getElementById('errorTitle').value = '';
  if (document.getElementById('errorCause')) document.getElementById('errorCause').value = '';
  if (document.getElementById('errorFix')) document.getElementById('errorFix').value = '';

  renderErrors();
  if (window.showToast) window.showToast('🛡️ Aprendizado registrado!', 'success');
}

function renderErrors() {
  const list = document.getElementById('errorList');
  if (!list || !window.state) return;

  if (window.state.errors.length === 0) {
    list.innerHTML = '<p class="empty-state" style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">Nenhum erro registrado. Mantenha o foco e a consistência!</p>';
    return;
  }

  list.innerHTML = window.state.errors.map((err, index) => `
    <div class="reflection-card">
      <div class="reflection-card-header">
        <div class="reflection-title-group">
          <span class="reflection-icon">⛔</span>
          <span class="reflection-title">${err.title}</span>
        </div>
        <button onclick="window.deleteError(${index})" class="btn-delete-reflection" title="Apagar Registro">×</button>
      </div>

      <div class="reflection-date">📅 Registrado em: ${err.date}</div>

      <div class="reflection-section cause-section">
        <span class="section-tag">A CAUSA</span>
        <p>${err.cause}</p>
      </div>

      <div class="reflection-section solution-section">
        <span class="section-tag">O CAMINHO / SOLUÇÃO</span>
        <p>${err.fix}</p>
      </div>
    </div>
  `).join('');
}

function deleteError(index) {
  if (!window.state) return;
  if (confirm('Apagar este registro de aprendizado?')) {
    window.state.errors.splice(index, 1);
    window.saveState('errors');
    if (window.performAutoSave) window.performAutoSave();
    renderErrors();
    if (window.showToast) window.showToast('Registro de erro removido.', 'info');
  }
}

window.addError = addError;
window.renderErrors = renderErrors;
window.deleteError = deleteError;
