(() => {
  const MODULE_ID = 'cg_beautifier_fixed_v1';
  const SETTINGS_KEY = 'cg_beautifier_fixed_settings_v1';

  if (window[MODULE_ID]) {
    console.log('[CG美化] 已经加载过，跳过重复加载');
    return;
  }

  window[MODULE_ID] = true;

  const defaultSettings = {
    enabled: true,
    backgroundUrl: '',
    opacity: 0.42,
    blur: 1.2,
    maxWidth: 760,
    fontSize: 1,
  };

  let settings = loadSettings();
  let timer = null;

  function loadSettings() {
    try {
      return {
        ...defaultSettings,
        ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
      };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyVars();
    renderAll();
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectStyle() {
    if (document.getElementById('cg-beautifier-style')) return;

    const style = document.createElement('style');
    style.id = 'cg-beautifier-style';
    style.textContent = `
      .cg-beautifier-source-hidden {
        display: none !important;
      }

      .cg-beautifier-rendered {
        margin: 0.5em 0;
      }

      .cg-beautifier-plain {
        white-space: pre-wrap;
        line-height: 1.75;
      }

      .cg-beautifier-card {
        position: relative;
        isolation: isolate;
        box-sizing: border-box;
        width: min(100%, var(--cg-beautifier-max-width, 760px));
        margin: 1em auto;
        padding: 1.35em 1.45em;
        overflow: hidden;
        border-radius: 20px;
        border: 1px solid rgba(255, 226, 175, 0.45);
        background:
          linear-gradient(135deg, rgba(24, 18, 12, 0.9), rgba(8, 10, 18, 0.86)),
          radial-gradient(circle at top, rgba(255, 232, 180, 0.2), rgba(15, 16, 24, 0.92));
        box-shadow:
          0 18px 48px rgba(0, 0, 0, 0.35),
          inset 0 0 30px rgba(255, 226, 160, 0.08);
        color: rgba(255, 248, 232, 0.96);
        font-size: calc(1em * var(--cg-beautifier-font-size, 1));
      }

      .cg-beautifier-card::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -2;
        background-image: var(--cg-beautifier-bg, none);
        background-size: cover;
        background-position: center;
        opacity: var(--cg-beautifier-opacity, 0.42);
        filter: blur(calc(var(--cg-beautifier-blur, 1.2) * 1px)) saturate(1.08);
        transform: scale(1.04);
      }

      .cg-beautifier-card::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 0%, rgba(255, 230, 170, 0.28), transparent 36%),
          linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.36));
      }

      .cg-beautifier-kicker {
        display: flex;
        align-items: center;
        gap: 0.7em;
        margin-bottom: 0.7em;
        font-size: 0.74em;
        letter-spacing: 0.28em;
        color: rgba(255, 222, 170, 0.72);
      }

      .cg-beautifier-kicker::before,
      .cg-beautifier-kicker::after {
        content: "";
        height: 1px;
        flex: 1;
        background: linear-gradient(90deg, transparent, rgba(255, 226, 170, 0.55), transparent);
      }

      .cg-beautifier-title {
        margin: 0;
        text-align: center;
        font-size: 1.25em;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: rgba(255, 242, 210, 0.98);
        text-shadow: 0 2px 18px rgba(255, 211, 140, 0.25);
      }

      .cg-beautifier-body {
        margin-top: 0.95em;
        line-height: 1.95;
        white-space: pre-wrap;
        color: rgba(255, 249, 235, 0.92);
      }

      .cg-beautifier-streaming {
        border-style: dashed;
      }

      .cg-beautifier-streaming-mark {
        margin-top: 0.75em;
        text-align: right;
        font-size: 0.78em;
        color: rgba(255, 232, 178, 0.6);
      }

      .cg-beautifier-button {
        position: fixed;
        right: 18px;
        bottom: 72px;
        z-index: 10000;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid rgba(255, 230, 180, 0.45);
        background: rgba(30, 24, 18, 0.9);
        color: rgba(255, 238, 205, 0.96);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        font-weight: 700;
      }

      .cg-beautifier-panel {
        position: fixed;
        right: 18px;
        bottom: 124px;
        z-index: 10000;
        display: none;
        box-sizing: border-box;
        width: min(350px, calc(100vw - 36px));
        padding: 14px;
        border-radius: 16px;
        border: 1px solid rgba(255, 230, 180, 0.28);
        background: rgba(22, 20, 18, 0.96);
        color: rgba(255, 246, 230, 0.95);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
      }

      .cg-beautifier-panel.open {
        display: block;
      }

      .cg-beautifier-panel h3 {
        margin: 0 0 10px;
        font-size: 15px;
      }

      .cg-beautifier-panel label {
        display: block;
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.5;
      }

      .cg-beautifier-panel input[type="text"],
      .cg-beautifier-panel input[type="range"],
      .cg-beautifier-panel input[type="number"] {
        box-sizing: border-box;
        width: 100%;
        margin-top: 5px;
      }

      .cg-beautifier-panel button {
        margin-top: 10px;
        padding: 6px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 226, 180, 0.28);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 245, 226, 0.94);
      }

      .cg-beautifier-panel small {
        display: block;
        margin-top: 8px;
        opacity: 0.7;
        line-height: 1.5;
      }
    `;

    document.head.appendChild(style);
  }

  function applyVars() {
    const root = document.documentElement;

    if (settings.backgroundUrl) {
      root.style.setProperty('--cg-beautifier-bg', `url("${settings.backgroundUrl.replace(/"/g, '\\"')}")`);
    } else {
      root.style.setProperty('--cg-beautifier-bg', 'none');
    }

    root.style.setProperty('--cg-beautifier-opacity', String(settings.opacity));
    root.style.setProperty('--cg-beautifier-blur', String(settings.blur));
    root.style.setProperty('--cg-beautifier-max-width', `${settings.maxWidth}px`);
    root.style.setProperty('--cg-beautifier-font-size', String(settings.fontSize));
  }

  function getMessageText(el) {
    return (el.innerText || el.textContent || '').trim();
  }

  function parseCg(text) {
    const source = String(text || '');

    const hasCg =
      source.includes('[CG]') ||
      source.includes('[/CG]') ||
      source.includes('<CG>') ||
      source.includes('</CG>') ||
      source.includes('&lt;CG&gt;') ||
      source.includes('&lt;/CG&gt;');

    if (!hasCg) return null;

    const pattern = /(\[CG\]|<CG>|&lt;CG&gt;)([\s\S]*?)(\[\/CG\]|<\/CG>|&lt;\/CG&gt;|$)/gi;

    let html = '';
    let lastIndex = 0;
    let found = false;
    let match;

    while ((match = pattern.exec(source))) {
      found = true;

      const before = source.slice(lastIndex, match.index);
      if (before.trim()) {
        html += `<div class="cg-beautifier-plain">${escapeHtml(before)}</div>`;
      }

      const content = match[2].trim();
      const closeTag = match[3] || '';
      const isStreaming = closeTag === '';

      html += renderCgCard(content, isStreaming);

      lastIndex = pattern.lastIndex;

      if (isStreaming) break;
    }

    if (!found) return null;

    const after = source.slice(lastIndex);
    if (after.trim()) {
      html += `<div class="cg-beautifier-plain">${escapeHtml(after)}</div>`;
    }

    return html;
  }

  function renderCgCard(content, isStreaming) {
    const lines = String(content || '')
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);

    let title = '过场 CG';
    let bodyLines = lines;

    const titleMatch = lines[0]?.match(/^【(.+?)】$/);

    if (titleMatch) {
      title = titleMatch[1];
      bodyLines = lines.slice(1);
    }

    const body = bodyLines.join('\n') || '画面正在显影……';

    return `
      <section class="cg-beautifier-card ${isStreaming ? 'cg-beautifier-streaming' : ''}">
        <div class="cg-beautifier-kicker">SCENE CG</div>
        <h4 class="cg-beautifier-title">【${escapeHtml(title)}】</h4>
        <div class="cg-beautifier-body">${escapeHtml(body)}</div>
        ${isStreaming ? '<div class="cg-beautifier-streaming-mark">记录显影中…</div>' : ''}
      </section>
    `;
  }

  function restore(el) {
    const next = el.nextElementSibling;

    if (next && next.classList.contains('cg-beautifier-rendered')) {
      next.remove();
    }

    el.classList.remove('cg-beautifier-source-hidden');
  }

  function processMessage(el) {
    if (!el || !(el instanceof HTMLElement)) return;

    if (!settings.enabled) {
      restore(el);
      return;
    }

    const text = getMessageText(el);
    const html = parseCg(text);

    if (!html) {
      restore(el);
      return;
    }

    let output = el.nextElementSibling;

    if (!output || !output.classList.contains('cg-beautifier-rendered')) {
      output = document.createElement('div');
      output.className = 'cg-beautifier-rendered';
      el.insertAdjacentElement('afterend', output);
    }

    output.innerHTML = html;
    el.classList.add('cg-beautifier-source-hidden');
  }

  function renderAll() {
    document.querySelectorAll('.mes_text').forEach(processMessage);
  }

  function scheduleRenderAll() {
    clearTimeout(timer);
    timer = setTimeout(renderAll, 60);
  }

  function createPanel() {
    if (document.getElementById('cg-beautifier-panel')) return;

    const button = document.createElement('button');
    button.className = 'cg-beautifier-button';
    button.textContent = 'CG';

    const panel = document.createElement('div');
    panel.id = 'cg-beautifier-panel';
    panel.className = 'cg-beautifier-panel';

    panel.innerHTML = `
      <h3>CG 美化设置</h3>

      <label>
        <input id="cg-beautifier-enabled" type="checkbox">
        启用 CG 美化
      </label>

      <label>
        背景图 URL
        <input id="cg-beautifier-bg-url" type="text" placeholder="https://.../image.jpg">
      </label>

      <label>
        上传本地背景图
        <input id="cg-beautifier-bg-file" type="file" accept="image/*">
      </label>

      <label>
        背景透明度
        <input id="cg-beautifier-opacity" type="range" min="0" max="1" step="0.05">
      </label>

      <label>
        背景模糊
        <input id="cg-beautifier-blur" type="range" min="0" max="8" step="0.5">
      </label>

      <label>
        卡片最大宽度
        <input id="cg-beautifier-width" type="number" min="320" max="1200" step="20">
      </label>

      <label>
        字体倍率
        <input id="cg-beautifier-font" type="range" min="0.8" max="1.5" step="0.05">
      </label>

      <button id="cg-beautifier-clear-bg" type="button">清除背景</button>

      <small>
        推荐使用 [CG]...[/CG]。部分前端会吞掉真正的 &lt;CG&gt; HTML 标签。
      </small>
    `;

    document.body.appendChild(button);
    document.body.appendChild(panel);

    const enabled = document.getElementById('cg-beautifier-enabled');
    const bgUrl = document.getElementById('cg-beautifier-bg-url');
    const bgFile = document.getElementById('cg-beautifier-bg-file');
    const opacity = document.getElementById('cg-beautifier-opacity');
    const blur = document.getElementById('cg-beautifier-blur');
    const width = document.getElementById('cg-beautifier-width');
    const font = document.getElementById('cg-beautifier-font');
    const clearBg = document.getElementById('cg-beautifier-clear-bg');

    function sync() {
      enabled.checked = settings.enabled;
      bgUrl.value = settings.backgroundUrl || '';
      opacity.value = settings.opacity;
      blur.value = settings.blur;
      width.value = settings.maxWidth;
      font.value = settings.fontSize;
    }

    sync();

    button.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    enabled.addEventListener('change', () => {
      settings.enabled = enabled.checked;
      saveSettings();
    });

    bgUrl.addEventListener('change', () => {
      settings.backgroundUrl = bgUrl.value.trim();
      saveSettings();
    });

    bgFile.addEventListener('change', () => {
      const file = bgFile.files && bgFile.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        settings.backgroundUrl = String(reader.result || '');
        sync();
        saveSettings();
      };

      reader.readAsDataURL(file);
    });

    opacity.addEventListener('input', () => {
      settings.opacity = Number(opacity.value);
      saveSettings();
    });

    blur.addEventListener('input', () => {
      settings.blur = Number(blur.value);
      saveSettings();
    });

    width.addEventListener('change', () => {
      settings.maxWidth = Number(width.value) || 760;
      saveSettings();
    });

    font.addEventListener('input', () => {
      settings.fontSize = Number(font.value) || 1;
      saveSettings();
    });

    clearBg.addEventListener('click', () => {
      settings.backgroundUrl = '';
      bgFile.value = '';
      sync();
      saveSettings();
    });
  }

  function bindEvents() {
    const observer = new MutationObserver(scheduleRenderAll);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    try {
      const context = window.SillyTavern && window.SillyTavern.getContext
        ? window.SillyTavern.getContext()
        : null;

      const eventSource = context && context.eventSource;
      const eventTypes = context && context.event_types;

      if (eventSource && eventTypes) {
        [
          eventTypes.CHARACTER_MESSAGE_RENDERED,
          eventTypes.USER_MESSAGE_RENDERED,
          eventTypes.MESSAGE_EDITED,
          eventTypes.MESSAGE_SWIPED,
          eventTypes.CHAT_CHANGED,
          eventTypes.STREAM_TOKEN_RECEIVED,
          eventTypes.GENERATION_ENDED,
        ]
          .filter(Boolean)
          .forEach(eventName => eventSource.on(eventName, scheduleRenderAll));
      }
    } catch (error) {
      console.log('[CG美化] 事件绑定失败，已使用 DOM 监听兜底', error);
    }
  }

  function init() {
    injectStyle();
    applyVars();
    createPanel();
    bindEvents();
    scheduleRenderAll();
    console.log('[CG美化] 加载成功');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
