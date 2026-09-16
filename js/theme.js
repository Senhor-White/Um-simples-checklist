// ==========================================================================
// THEME MODULE (SISTEMA DE TEMAS - DARK MINIMALISTA NEON WHITE)
// ==========================================================================

const NEON_WHITE_THEME = {
  primary: '#ffffff',
  primaryDark: '#d4d4d8',
  accent: '#ffffff',
  accentDark: '#a1a1aa',
  bg: '#000000',
  bgGradientStart: '#050505',
  bgGradientEnd: '#000000',
  text: '#ffffff',
  cardBg: 'rgba(12, 12, 12, 0.85)',
  border: 'rgba(255, 255, 255, 0.12)'
};

function applyTheme(theme) {
  const root = document.documentElement;
  const t = theme || NEON_WHITE_THEME;

  root.style.setProperty('--primary-color', t.primary || '#ffffff');
  root.style.setProperty('--primary-dark', t.primaryDark || '#d4d4d8');
  root.style.setProperty('--accent-color', t.accent || '#ffffff');
  root.style.setProperty('--accent-dark', t.accentDark || '#a1a1aa');
  root.style.setProperty('--bg-color', t.bg || '#000000');
  root.style.setProperty('--bg-gradient-start', t.bgGradientStart || '#080808');
  root.style.setProperty('--bg-gradient-end', t.bgGradientEnd || '#000000');
  root.style.setProperty('--text-color', t.text || '#ffffff');
  root.style.setProperty('--text-muted', '#8e8e93');
  root.style.setProperty('--card-bg', t.cardBg || 'rgba(12, 12, 12, 0.85)');
  root.style.setProperty('--border-color', t.border || 'rgba(255, 255, 255, 0.15)');
}

function loadThemeInputs() {
  const theme = (window.state && window.state.currentTheme) ? window.state.currentTheme : NEON_WHITE_THEME;

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

function adjustBrightness(hex, percent) {
  if (!hex || !hex.startsWith('#')) return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function setupThemeListeners() {
  const pairs = [
    { picker: 'primaryColorPicker', input: 'primaryColorInput', var: '--primary-color' },
    { picker: 'accentColorPicker', input: 'accentColorInput', var: '--accent-color' },
    { picker: 'bgColorPicker', input: 'bgColorInput', var: '--bg-color', gradientVar: true },
    { picker: 'textColorPicker', input: 'textColorInput', var: '--text-color' }
  ];

  pairs.forEach(pair => {
    const pickerEl = document.getElementById(pair.picker);
    const inputEl = document.getElementById(pair.input);

    if (!pickerEl || !inputEl) return;

    pickerEl.addEventListener('input', e => {
      const color = e.target.value;
      inputEl.value = color;
      document.documentElement.style.setProperty(pair.var, color);
    });

    inputEl.addEventListener('input', e => {
      const color = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(color)) {
        pickerEl.value = color;
        document.documentElement.style.setProperty(pair.var, color);
      }
    });
  });
}

function saveTheme() {
  const primary = document.getElementById('primaryColorInput')?.value || '#ffffff';
  const accent = document.getElementById('accentColorInput')?.value || '#ffffff';
  const bg = document.getElementById('bgColorInput')?.value || '#000000';
  const text = document.getElementById('textColorInput')?.value || '#ffffff';

  const theme = {
    primary,
    primaryDark: adjustBrightness(primary, -30),
    accent,
    accentDark: adjustBrightness(accent, -30),
    bg,
    bgGradientStart: adjustBrightness(bg, 10),
    bgGradientEnd: bg,
    text
  };

  if (window.state) {
    window.state.currentTheme = theme;
    window.saveState('theme');
    if (window.performAutoSave) window.performAutoSave();
  }
  applyTheme(theme);
  if (window.showToast) window.showToast('✅ Tema salvo!', 'success');
}

function resetTheme() {
  if (confirm('Restaurar para a estética padrão Minimalista Neon White?')) {
    if (window.state) {
      window.state.currentTheme = null;
      localStorage.removeItem('theme');
    }
    applyTheme(NEON_WHITE_THEME);
    loadThemeInputs();
    if (window.showToast) window.showToast('Tema padrão restaurado.', 'info');
  }
}

window.NEON_WHITE_THEME = NEON_WHITE_THEME;
window.applyTheme = applyTheme;
window.loadThemeInputs = loadThemeInputs;
window.setupThemeListeners = setupThemeListeners;
window.saveTheme = saveTheme;
window.resetTheme = resetTheme;
window.adjustBrightness = adjustBrightness;
