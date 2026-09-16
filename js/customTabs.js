// ==========================================================================
// CUSTOM TABS MODULE (ABAS PERSONALIZADAS)
// ==========================================================================

function generateTabId(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 20);
  return `custom-${base}-${Date.now()}`;
}

function createCustomTab() {
  const title = document.getElementById('newTabTitle')?.value?.trim();
  const content = document.getElementById('newTabContent')?.value?.trim();

  if (!title) {
    alert('⚠️ Por favor, insira um título para a aba.');
    return;
  }

  if (!content) {
    alert('⚠️ Por favor, insira o conteúdo para a aba.');
    return;
  }

  if (!window.state) return;

  const existingTab = window.state.customTabs.find(tab => tab.title.toLowerCase() === title.toLowerCase());
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

  window.state.customTabs.push(newTab);
  window.saveState('customTabs');
  if (window.performAutoSave) window.performAutoSave();

  createCustomTabView(newTab);
  renderCustomTabsInHUD();
  clearTabForm();

  if (window.showToast) window.showToast(`✅ Aba "${title}" criada com sucesso!`, 'success');
  if (window.showView) window.showView(newTab.id);
}

function createCustomTabView(tab) {
  if (document.getElementById(tab.id)) return;

  const view = document.createElement('div');
  view.id = tab.id;
  view.className = 'view';
  view.innerHTML = `
    <div class="day-card custom-tab-wrapper">
      <div class="custom-tab-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div class="custom-tab-title-group" style="display:flex; align-items:center; gap:8px;">
          <span class="custom-tab-icon">📌</span>
          <h2>${tab.title}</h2>
        </div>
        <button class="btn btn-danger btn-delete-tab" onclick="window.deleteCustomTab('${tab.id}')">🗑️ Excluir Aba</button>
      </div>

      <div class="custom-tab-content-area" style="font-size:0.95rem; line-height:1.6; color:#f4f4f5; white-space:pre-wrap; padding:16px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.08);">${tab.content}</div>

      <div class="custom-tab-footer" style="margin-top:14px; font-size:0.8rem; color:var(--text-muted);">
        📅 Criada em ${new Date(tab.createdAt).toLocaleDateString('pt-BR')} às ${new Date(tab.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  `;

  const container = document.querySelector('.container');
  if (container) container.appendChild(view);
}

function deleteCustomTab(tabId) {
  if (!window.state) return;
  const tab = window.state.customTabs.find(t => t.id === tabId);
  if (!tab) return;

  if (!confirm(`Tem certeza que deseja excluir a aba "${tab.title}"?`)) return;

  window.state.customTabs = window.state.customTabs.filter(t => t.id !== tabId);
  window.saveState('customTabs');
  if (window.performAutoSave) window.performAutoSave();

  const viewElement = document.getElementById(tabId);
  if (viewElement) viewElement.remove();

  renderCustomTabsInHUD();
  if (window.showView) window.showView('checklist');
  if (window.showToast) window.showToast('Aba excluída.', 'info');
}

function renderCustomTabsInHUD() {
  const section = document.getElementById('customTabsSection');
  const list = document.getElementById('customTabsList');
  if (!section || !list || !window.state) return;

  if (window.state.customTabs.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = window.state.customTabs.map(tab => `
    <div class="hud-item hud-custom-tab-item" onclick="window.showView('${tab.id}')">
      <span>📌 ${tab.title}</span>
      <button class="hud-item-delete" onclick="event.stopPropagation(); window.deleteCustomTab('${tab.id}')" title="Excluir">×</button>
    </div>
  `).join('');
}

function loadCustomTabs() {
  if (!window.state) return;
  window.state.customTabs.forEach(tab => {
    createCustomTabView(tab);
  });
  renderCustomTabsInHUD();
}

function clearTabForm() {
  if (document.getElementById('newTabTitle')) document.getElementById('newTabTitle').value = '';
  if (document.getElementById('newTabContent')) document.getElementById('newTabContent').value = '';
}

window.generateTabId = generateTabId;
window.createCustomTab = createCustomTab;
window.createCustomTabView = createCustomTabView;
window.deleteCustomTab = deleteCustomTab;
window.renderCustomTabsInHUD = renderCustomTabsInHUD;
window.loadCustomTabs = loadCustomTabs;
window.clearTabForm = clearTabForm;
