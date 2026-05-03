// cg美化 / index.js
// 使用方式：
// import 'https://testingcf.jsdelivr.net/gh/你的用户名/你的仓库名@main/cg美化/index.js'

(() => {
  const MODULE_ID = 'cg_beautifier_v1';
  const SETTINGS_KEY = 'cg_beautifier_settings_v1';

  if (globalThis[MODULE_ID]) {
    console.info('[cg美化] 已加载，跳过重复初始化。');
    return;
  }

  globalThis[MODULE_ID] = true;

  const defaultSettings = {
    enabled: true,
    backgroundUrl: '',
    opacity: 0.38,
    blur: 1.2,
    maxWidth: 760,
    fontSize: 1,
    showPanelButton: true,
  };

  let settings = loadSettings();
  let renderScheduled = false;
  const renderedCache = new WeakMap();

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { ...defaultSettings, ...saved };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('[cg美化] 设置保存失败：', error);
      alert('CG 美化设置保存失败。图片可能太大，建议改用图片 URL。');
    }

    applyCssVariables();
    scheduleRenderAll();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeCssUrl(value) {
    return String(value ?? '')
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"')
      .replaceAll('\n', '')
      .replaceAll('\r', '');
  }

  function decodeHtmlEntities(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  function normalizeImageUrl(value) {
    const raw = String(value || '').trim();

    if (!raw) return '';

    if (raw.startsWith('data:image/')) {
      return raw;
    }

    try {
      const url = new URL(raw, location.href);

      if (['http:', 'https:', 'blob:'].includes(url.protocol)) {
        return url.href;
      }
    } catch {
      // ignore
    }

    alert('背景图只支持 http(s)、blob 或 data:image 图片地址。');
    return settings.backgroundUrl || '';
  }

  function injectStyle() {
    const styleId = `${MODULE_ID}_style`;

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;

    style.textContent = `
      :root {
        --cg-beautifier-bg: radial-gradient(circle at top, rgba(255, 230, 170, 0.18), rgba(18, 18, 26, 0.9));
        --cg-beautifier-opacity: 0.38;
        --cg-beautifier-blur: 1.2;
        --cg-beautifier-max-width: 760px;
        --cg-beautifier-font-size: 1;
      }

      .cg-beautifier-hidden-source {
        display: none !important;
      }

      .cg-beautifier-wrapper {
        white-space: normal;
      }

      .cg-beautifier-plain {
        white-space: pre-wrap;
        line-height: 1.75;
      }

      .cg-beautifier-card {
        position: relative;
        isolation: isolate;
        box-sizing: border-box;
        width: min(100%, var(--cg-beautifier-max-width));
        margin: 1.1em auto;
        padding: 1.35em 1.45em 1.25em;
        overflow: hidden;
        border-radius: 20px;
        border: 1px solid rgba(255, 232, 185, 0.42);
        background:
          linear-gradient(135deg, rgba(20, 14, 9, 0.88), rgba(10, 10, 18, 0.84)),
          var(--cg-beautifier-bg);
        box-shadow:
          0 18px 48px rgba(0, 0, 0, 0.36),
          inset 0 0 28px rgba(255, 226, 160, 0.07);
        color: rgba(255, 248, 230, 0.95);
        font-size: calc(1em * var(--cg-beautifier-font-size));
      }

      .cg-beautifier-card::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -2;
        background: var(--cg-beautifier-bg);
        background-size: cover;
        background-position: center;
        opacity: var(--cg-beautifier-opacity);
        filter: blur(calc(var(--cg-beautifier-blur) * 1px)) saturate(1.08);
        transform: scale(1.035);
      }

      .cg-beautifier-card::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 0%, rgba(255, 232, 175, 0.25), transparent 34%),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05), transparent 24%, transparent 76%, rgba(255, 255, 255, 0.04)),
          linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.34));
      }

      .cg-beautifier-kicker {
        display: flex;
        align-items: center;
        gap: 0.7em;
        margin-bottom: 0.6em;
        font-size: 0.74em;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: rgba(255, 222, 170, 0.72);
        user-select: none;
      }

      .cg-beautifier-kicker::before,
      .cg-beautifier-kicker::after {
        content: "";
        height: 1px;
        flex: 1;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 226, 170, 0.52),
          transparent
        );
      }

      .cg-beautifier-title {
        margin: 0;
        text-align: center;
        font-size: 1.24em;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: rgba(255, 242, 210, 0.98);
        text-shadow:
          0 2px 18px rgba(255, 211, 140, 0.25),
          0 0 1px rgba(255, 255, 255, 0.28);
      }

      .cg-beautifier-body {
        margin-top: 0.95em;
        line-height: 1.95;
        white-space: pre-wrap;
        text-align: left;
        color: rgba(255, 249, 235, 0.92);
      }

      .cg-beautifier-body::first-letter {
        color: rgba(255, 230, 178, 0.98);
      }

      .cg-beautifier-streaming {
        border-style: dashed;
      }

      .cg-beautifier-streaming-mark {
        margin-top: 0.75em;
        font-size: 0.78em;
        text-align: right;
        color: rgba(255, 232, 178, 0.58);
      }

      .cg-beautifier-panel-toggle {
        position: fixed;
        right: 18px;
        bottom: 72px;
        z-index: 10000;
        width: 43px;
        height: 43px;
        border-radius: 999px;
        border: 1px solid rgba(255, 230, 180, 0.42);
        background: rgba(30, 24, 18, 0.88);
        color: rgba(255, 238, 205, 0.96);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        backdrop-filter: blur(8px);
      }

      .cg-beautifier-panel-toggle:hover {
        background: rgba(48, 36, 24, 0.92);
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
        border: 1px solid rgba(255, 230, 180, 0.26);
        background: rgba(22, 20, 18, 0.95);
        color: rgba(255, 246, 230, 0.95);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(12px);
      }

      .cg-beautifier-panel.cg-beautifier-open {
        display: block;
      }

      .cg-beautifier-panel h3 {
        margin: 0 0 10px;
        font-size: 15px;
        color: rgba(255, 242, 216, 0.98);
      }

      .cg-beautifier-panel label {
        display: block;
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.45;
        color: rgba(255, 238, 210, 0.78);
      }

      .cg-beautifier-panel input[type="text"],
      .cg-beautifier-panel input[type="number"],
      .cg-beautifier-panel input[type="range"] {
        box-sizing: border-box;
        width: 100%;
        margin-top: 5px;
      }

      .cg-beautifier-panel input[type="text"],
      .cg-beautifier-panel input[type="number"] {
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 230, 190, 0.24);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 246, 230, 0.95);
      }

      .cg-beautifier-panel input[type="file"] {
        width: 100%;
        margin-top: 5px;
        font-size: 12px;
      }

      .cg-beautifier-panel-row {
        display: flex !important;
        gap: 8px;
        align-items: center;
      }

      .cg-beautifier-panel-row input {
        width: auto !important;
        margin-top: 0 !important;
      }

      .cg-beautifier-panel-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }

      .cg-beautifier-panel button {
        padding: 6px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 226, 180, 0.28);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 245, 226, 0.94);
        cursor: pointer;
      }

      .cg-beautifier-panel button:hover {
        background: rgba(255, 255, 255, 0.14);
      }

      .cg-beautifier-panel small {
        display: block;
        margin-top: 9px;
        line-height: 1.55;
        color: rgba(255, 238, 210, 0.56);
      }
    `;

    document.head.appendChild(style);
  }

  function applyCssVariables() {
    const root = document.documentElement;

    const background = settings.backgroundUrl
      ? `url("${escapeCssUrl(settings.backgroundUrl)}")`
      : 'radial-gradient(circle at top, rgba(255, 230, 170, 0.18), rgba(18, 18, 26, 0.9))';

    root.style.setProperty('--cg-beautifier-bg', background);
    root.style.setProperty('--cg-beautifier-opacity', String(settings.opacity));
    root.style.setProperty('--cg-beautifier-blur', String(settings.blur));
    root.style.setProperty('--cg-beautifier-max-width', `${Number(settings.maxWidth) || 760}px`);
    root.style.setProperty('--cg-beautifier-font-size', String(settings.fontSize || 1));
  }

  function extractMessageText(element) {
    if (!element) return '';

    let html = element.innerHTML || '';

    // 如果 SillyTavern 把 <CG> 当成 HTML 标签，这里把它还原成文本标记。
    html = html
      .replace(/<\s*cg\s*>/gi, '\n<CG>\n')
      .replace(/<\s*\/\s*cg\s*>/gi, '\n</CG>\n');

    html = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p\s*>/gi, '\n')
      .replace(/<\/div\s*>/gi, '\n')
      .replace(/<\/li\s*>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    return decodeHtmlEntities(html)
      .replace(/\u00a0/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function parseCgContent(rawContent) {
    const lines = String(rawContent || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    let title = '过场 CG';
    let bodyLines = lines;

    if (lines.length > 0) {
      const titleMatch = lines[0].match(/^【(.+?)】$/);

      if (titleMatch) {
        title = titleMatch[1].trim() || title;
        bodyLines = lines.slice(1);
      }
    }

    const body = bodyLines.join('\n').trim() || '画面正在显影……';

    return { title, body };
  }

  function renderPlainText(text) {
    const value = String(text || '');

    if (!value.trim()) return '';

    return `<div class="cg-beautifier-plain">${escapeHtml(value)}</div>`;
  }

  function renderCgBlock(rawContent, isStreaming) {
    const { title, body } = parseCgContent(rawContent);

    return `
      <section class="cg-beautifier-card ${isStreaming ? 'cg-beautifier-streaming' : ''}">
        <div class="cg-beautifier-kicker">SCENE CG</div>
        <h4 class="cg-beautifier-title">【${escapeHtml(title)}】</h4>
        <div class="cg-beautifier-body">${escapeHtml(body)}</div>
        ${isStreaming ? '<div class="cg-beautifier-streaming-mark">记录显影中…</div>' : ''}
      </section>
    `;
  }

  function renderMessage(rawText) {
    const source = String(rawText || '');

    const hasCg =
      source.includes('<CG>') ||
      source.includes('</CG>') ||
      source.includes('[CG]') ||
      source.includes('[/CG]');

    if (!hasCg) return null;

    const pattern = /(<CG>|\[CG\])([\s\S]*?)(<\/CG>|\[\/CG\]|$)/gi;

    let html = '';
    let lastIndex = 0;
    let found = false;
    let match;

    while ((match = pattern.exec(source))) {
      found = true;

      const before = source.slice(lastIndex, match.index);
      html += renderPlainText(before);

      const content = match[2] || '';
      const closeTag = match[3] || '';
      const isStreaming = closeTag === '';

      html += renderCgBlock(content, isStreaming);

      lastIndex = pattern.lastIndex;

      // 流式输出时，如果 CG 还没有闭合，就不要继续解析后面的内容。
      if (isStreaming) {
        break;
      }
    }

    if (!found) return null;

    const after = source.slice(lastIndex);
    html += renderPlainText(after);

    return `<div class="cg-beautifier-wrapper">${html}</div>`;
  }

  function getMessageElements() {
    return Array.from(document.querySelectorAll('.mes_text'));
  }

  function restoreElement(element) {
    if (!element) return;

    const next = element.nextElementSibling;

    if (next?.classList?.contains('cg-beautifier-rendered')) {
      next.remove();
    }

    element.classList.remove('cg-beautifier-hidden-source');
    renderedCache.delete(element);
  }

  function processElement(element) {
    if (!element || !(element instanceof HTMLElement)) return;

    if (!settings.enabled) {
      restoreElement(element);
      return;
    }

    const rawText = extractMessageText(element);
    const renderedHtml = renderMessage(rawText);

    if (!renderedHtml) {
      restoreElement(element);
      return;
    }

    const cacheKey = rawText;

    if (renderedCache.get(element) === cacheKey) return;

    let output = element.nextElementSibling;

    if (!output?.classList?.contains('cg-beautifier-rendered')) {
      output = document.createElement('div');
      output.className = 'cg-beautifier-rendered';
      element.insertAdjacentElement('afterend', output);
    }

    output.innerHTML = renderedHtml;
    element.classList.add('cg-beautifier-hidden-source');
    renderedCache.set(element, cacheKey);
  }

  function renderAll() {
    renderScheduled = false;
    getMessageElements().forEach(processElement);
  }

  function scheduleRenderAll() {
    if (renderScheduled) return;

    renderScheduled = true;
    requestAnimationFrame(renderAll);
  }

  function createSettingsPanel() {
    if (!settings.showPanelButton) return;

    const panelId = `${MODULE_ID}_panel`;

    if (document.getElementById(panelId)) return;

    const toggle = document.createElement('button');
    toggle.className = 'cg-beautifier-panel-toggle';
    toggle.type = 'button';
    toggle.textContent = 'CG';
    toggle.title = 'CG 美化设置';

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'cg-beautifier-panel';

    panel.innerHTML = `
      <h3>CG 美化设置</h3>

      <label class="cg-beautifier-panel-row">
        <input id="${MODULE_ID}_enabled" type="checkbox">
        启用 CG 美化
      </label>

      <label>
        背景图 URL
        <input id="${MODULE_ID}_background_url" type="text" placeholder="https://.../image.jpg">
      </label>

      <label>
        上传本地背景图
        <input id="${MODULE_ID}_background_file" type="file" accept="image/*">
      </label>

      <label>
        背景透明度
        <input id="${MODULE_ID}_opacity" type="range" min="0" max="1" step="0.05">
      </label>

      <label>
        背景模糊
        <input id="${MODULE_ID}_blur" type="range" min="0" max="8" step="0.5">
      </label>

      <label>
        卡片最大宽度 px
        <input id="${MODULE_ID}_max_width" type="number" min="320" max="1200" step="20">
      </label>

      <label>
        字体倍率
        <input id="${MODULE_ID}_font_size" type="range" min="0.8" max="1.5" step="0.05">
      </label>

      <div class="cg-beautifier-panel-actions">
        <button id="${MODULE_ID}_clear_background" type="button">清除背景</button>
        <button id="${MODULE_ID}_close_panel" type="button">关闭</button>
      </div>

      <small>
        支持 &lt;CG&gt;...&lt;/CG&gt; 和 [CG]...[/CG]。背景图设置保存在当前浏览器本地。
      </small>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    const $ = suffix => document.getElementById(`${MODULE_ID}_${suffix}`);

    const enabledInput = $('enabled');
    const backgroundUrlInput = $('background_url');
    const backgroundFileInput = $('background_file');
    const opacityInput = $('opacity');
    const blurInput = $('blur');
    const maxWidthInput = $('max_width');
    const fontSizeInput = $('font_size');
    const clearBackgroundButton = $('clear_background');
    const closePanelButton = $('close_panel');

    function syncInputs() {
      enabledInput.checked = Boolean(settings.enabled);
      backgroundUrlInput.value = settings.backgroundUrl || '';
      opacityInput.value = String(settings.opacity);
      blurInput.value = String(settings.blur);
      maxWidthInput.value = String(settings.maxWidth);
      fontSizeInput.value = String(settings.fontSize);
    }

    syncInputs();

    toggle.addEventListener('click', () => {
      panel.classList.toggle('cg-beautifier-open');
    });

    closePanelButton.addEventListener('click', () => {
      panel.classList.remove('cg-beautifier-open');
    });

    enabledInput.addEventListener('change', () => {
      settings.enabled = enabledInput.checked;
      saveSettings();
    });

    backgroundUrlInput.addEventListener('change', () => {
      settings.backgroundUrl = normalizeImageUrl(backgroundUrlInput.value);
      syncInputs();
      saveSettings();
    });

    backgroundFileInput.addEventListener('change', () => {
      const file = backgroundFileInput.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        settings.backgroundUrl = normalizeImageUrl(String(reader.result || ''));
        syncInputs();
        saveSettings();
      };

      reader.onerror = () => {
        alert('读取图片失败。');
      };

      reader.readAsDataURL(file);
    });

    opacityInput.addEventListener('input', () => {
      settings.opacity = Number(opacityInput.value);
      saveSettings();
    });

    blurInput.addEventListener('input', () => {
      settings.blur = Number(blurInput.value);
      saveSettings();
    });

    maxWidthInput.addEventListener('change', () => {
      settings.maxWidth = Number(maxWidthInput.value) || defaultSettings.maxWidth;
      saveSettings();
    });

    fontSizeInput.addEventListener('input', () => {
      settings.fontSize = Number(fontSizeInput.value) || defaultSettings.fontSize;
      saveSettings();
    });

    clearBackgroundButton.addEventListener('click', () => {
      settings.backgroundUrl = '';
      backgroundFileInput.value = '';
      syncInputs();
      saveSettings();
    });
  }

  function bindSillyTavernEvents() {
    try {
      const context = globalThis.SillyTavern?.getContext?.();
      const eventSource = context?.eventSource;
      const eventTypes = context?.event_types;

      if (!eventSource || !eventTypes) return;

      const events = [
        eventTypes.CHARACTER_MESSAGE_RENDERED,
        eventTypes.USER_MESSAGE_RENDERED,
        eventTypes.MESSAGE_EDITED,
        eventTypes.MESSAGE_SWIPED,
        eventTypes.CHAT_CHANGED,
        eventTypes.STREAM_TOKEN_RECEIVED,
        eventTypes.GENERATION_ENDED,
      ].filter(Boolean);

      events.forEach(eventName => {
        eventSource.on(eventName, scheduleRenderAll);
      });

      console.info('[cg美化] 已绑定 SillyTavern 事件。');
    } catch (error) {
      console.debug('[cg美化] SillyTavern 事件绑定失败，将使用 DOM 监听兜底。', error);
    }
  }

  function observeDomChanges() {
    const target = document.querySelector('#chat') || document.body;

    const observer = new MutationObserver(() => {
      scheduleRenderAll();
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function init() {
    injectStyle();
    applyCssVariables();
    createSettingsPanel();
    bindSillyTavernEvents();
    observeDomChanges();
    scheduleRenderAll();

    console.info('[cg美化] 加载完成。');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
