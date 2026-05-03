/*
 * CG Beautifier for SillyTavern
 * 美化 <CG>...</CG> 或 [CG]...[/CG] 包裹的过场 CG 内容。
 */

const MODULE_NAME = 'cg_beautifier';
const STORAGE_BG_KEY = `${MODULE_NAME}_background_data_url`;

const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    title: '过场 CG',
    subtitle: 'SCENE TRANSITION',
    backgroundUrl: '',
    overlayOpacity: 0.52,
    blur: 1.5,
    maxHeight: 420,
    allowPartial: true,
});

let observer = null;
let pending = false;
let storedBgDataUrl = '';

function ctx() {
    return SillyTavern.getContext();
}

function getSettings() {
    const context = ctx();
    const existing = context.extensionSettings[MODULE_NAME] || {};
    context.extensionSettings[MODULE_NAME] = Object.assign(structuredClone(DEFAULT_SETTINGS), existing);
    return context.extensionSettings[MODULE_NAME];
}

function saveSettings() {
    ctx().saveSettingsDebounced();
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function hashString(value) {
    let hash = 0;
    const text = String(value || '');
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return String(hash);
}

function normalizeHtmlToText(html) {
    const div = document.createElement('div');
    div.innerHTML = String(html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<\/div>\s*<div[^>]*>/gi, '\n');
    return div.textContent || '';
}

function normalizePlainText(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .trim();
}

function splitTitleAndBody(rawText) {
    const settings = getSettings();
    const text = normalizePlainText(rawText);
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    let title = settings.title || DEFAULT_SETTINGS.title;

    if (lines.length > 0) {
        const bracketTitle = lines[0].match(/^【(.{1,48})】$/u);
        const markdownTitle = lines[0].match(/^#{1,3}\s+(.{1,48})$/u);
        if (bracketTitle) {
            title = bracketTitle[1].trim();
            lines.shift();
        } else if (markdownTitle) {
            title = markdownTitle[1].trim();
            lines.shift();
        }
    }

    return { title, body: lines.join('\n') };
}

function bodyToParagraphs(body) {
    const safe = escapeHtml(body || '');
    if (!safe.trim()) {
        return '<p class="stcg-muted">生成中…</p>';
    }
    return safe
        .split(/\n{2,}/)
        .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

function makeCgCard(rawContent, partial = false) {
    const settings = getSettings();
    const { title, body } = splitTitleAndBody(rawContent);
    return `
<section class="stcg-card${partial ? ' stcg-streaming' : ''}" data-stcg-card="1">
    <div class="stcg-bg"></div>
    <div class="stcg-vignette"></div>
    <div class="stcg-glow stcg-glow-a"></div>
    <div class="stcg-glow stcg-glow-b"></div>
    <div class="stcg-content">
        <div class="stcg-subtitle">${escapeHtml(settings.subtitle || DEFAULT_SETTINGS.subtitle)}</div>
        <div class="stcg-title">${escapeHtml(title)}</div>
        <div class="stcg-rule"><span></span></div>
        <div class="stcg-body">${bodyToParagraphs(body)}</div>
    </div>
</section>`;
}

const TAG_OPEN_HTML = /(?:<\s*cg\s*>|&lt;\s*cg\s*&gt;|\[\s*cg\s*\])/i;
const TAG_CLOSE_HTML = /(?:<\s*\/\s*cg\s*>|&lt;\s*\/\s*cg\s*&gt;|\[\s*\/\s*cg\s*\])/i;
const TAG_ANY_RAW = /(?:<\s*\/?\s*cg\s*>|\[\s*\/?\s*cg\s*\])/i;

function containsCgTag(value) {
    return TAG_OPEN_HTML.test(String(value || ''));
}

function transformTaggedHtml(sourceHtml) {
    const settings = getSettings();
    let rest = String(sourceHtml || '');
    let output = '';
    let changed = false;

    while (rest.length > 0) {
        const open = rest.match(TAG_OPEN_HTML);
        if (!open) {
            output += rest;
            break;
        }

        output += rest.slice(0, open.index);
        const afterOpen = rest.slice(open.index + open[0].length);
        const close = afterOpen.match(TAG_CLOSE_HTML);

        if (close) {
            const cgInnerHtml = afterOpen.slice(0, close.index);
            output += makeCgCard(normalizeHtmlToText(cgInnerHtml), false);
            rest = afterOpen.slice(close.index + close[0].length);
            changed = true;
            continue;
        }

        if (settings.allowPartial) {
            output += makeCgCard(normalizeHtmlToText(afterOpen), true);
            changed = true;
        } else {
            output += rest.slice(open.index);
        }
        break;
    }

    return { changed, html: output };
}

function plainToSafeHtml(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function getRawMessageForElement(textElement) {
    const mes = textElement.closest('.mes');
    if (!mes) return null;

    const idText = mes.getAttribute('mesid') ?? mes.dataset?.mesid ?? mes.id?.match(/\d+/)?.[0];
    const id = Number(idText);
    if (!Number.isInteger(id)) return null;

    const message = ctx().chat?.[id];
    return typeof message?.mes === 'string' ? message.mes : null;
}

function transformMessageElement(textElement) {
    const settings = getSettings();
    if (!settings.enabled || !textElement || textElement.dataset.stcgProcessing === '1') return;

    const rawMessage = getRawMessageForElement(textElement);
    const basis = rawMessage && TAG_ANY_RAW.test(rawMessage)
        ? plainToSafeHtml(rawMessage)
        : textElement.innerHTML;

    if (!containsCgTag(basis)) return;

    const renderHash = hashString(JSON.stringify({
        basis,
        title: settings.title,
        subtitle: settings.subtitle,
        backgroundUrl: settings.backgroundUrl,
        overlayOpacity: settings.overlayOpacity,
        blur: settings.blur,
        maxHeight: settings.maxHeight,
        allowPartial: settings.allowPartial,
    }));

    if (textElement.dataset.stcgHash === renderHash) return;

    const result = transformTaggedHtml(basis);
    if (!result.changed) return;

    textElement.dataset.stcgProcessing = '1';
    textElement.innerHTML = result.html;
    textElement.dataset.stcgHash = renderHash;
    delete textElement.dataset.stcgProcessing;
}

function processAllMessages() {
    const settings = getSettings();
    if (!settings.enabled) return;
    document.querySelectorAll('.mes_text').forEach(transformMessageElement);
}

function scheduleProcess() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
        pending = false;
        processAllMessages();
    });
}

async function loadStoredBackground() {
    try {
        const { localforage } = SillyTavern.libs;
        storedBgDataUrl = await localforage.getItem(STORAGE_BG_KEY) || '';
    } catch (error) {
        console.warn('[CG Beautifier] Failed to load stored background', error);
    }
}

async function saveStoredBackground(dataUrl) {
    const { localforage } = SillyTavern.libs;
    if (dataUrl) {
        await localforage.setItem(STORAGE_BG_KEY, dataUrl);
    } else {
        await localforage.removeItem(STORAGE_BG_KEY);
    }
    storedBgDataUrl = dataUrl || '';
}

function applyCssVariables() {
    const settings = getSettings();
    const bg = storedBgDataUrl || settings.backgroundUrl || '';
    document.documentElement.style.setProperty('--stcg-bg-image', bg ? `url("${bg.replace(/"/g, '\\"')}")` : 'none');
    document.documentElement.style.setProperty('--stcg-overlay-opacity', String(settings.overlayOpacity));
    document.documentElement.style.setProperty('--stcg-blur', `${settings.blur}px`);
    document.documentElement.style.setProperty('--stcg-max-height', `${settings.maxHeight}px`);
    scheduleProcess();
}

function createSettingsPanel() {
    const settings = getSettings();
    if (document.getElementById('cg_beautifier_settings')) return;

    const html = `
<div id="cg_beautifier_settings" class="cg-beautifier-settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>CG Beautifier / 过场 CG 美化</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <label class="checkbox_label">
                <input id="stcg_enabled" type="checkbox" ${settings.enabled ? 'checked' : ''}>
                <span>启用 CG 美化</span>
            </label>

            <label for="stcg_title">默认标题</label>
            <input id="stcg_title" type="text" class="text_pole" value="${escapeHtml(settings.title)}" placeholder="过场 CG">

            <label for="stcg_subtitle">英文小标题</label>
            <input id="stcg_subtitle" type="text" class="text_pole" value="${escapeHtml(settings.subtitle)}" placeholder="SCENE TRANSITION">

            <label for="stcg_background_url">背景图 URL，可留空</label>
            <input id="stcg_background_url" type="text" class="text_pole" value="${escapeHtml(settings.backgroundUrl)}" placeholder="https://.../image.jpg 或 /backgrounds/xxx.png">

            <label for="stcg_background_file">或上传本地背景图，仅保存在当前浏览器</label>
            <input id="stcg_background_file" type="file" accept="image/*">
            <div class="flex-container alignitemscenter gap5">
                <button id="stcg_clear_local_bg" class="menu_button">清除本地背景图</button>
            </div>

            <label for="stcg_overlay">暗角强度：<span id="stcg_overlay_value">${settings.overlayOpacity}</span></label>
            <input id="stcg_overlay" type="range" min="0" max="0.9" step="0.01" value="${settings.overlayOpacity}">

            <label for="stcg_blur">背景模糊：<span id="stcg_blur_value">${settings.blur}px</span></label>
            <input id="stcg_blur" type="range" min="0" max="12" step="0.5" value="${settings.blur}">

            <label for="stcg_max_height">最大高度：<span id="stcg_max_height_value">${settings.maxHeight}px</span></label>
            <input id="stcg_max_height" type="range" min="220" max="720" step="10" value="${settings.maxHeight}">

            <label class="checkbox_label">
                <input id="stcg_allow_partial" type="checkbox" ${settings.allowPartial ? 'checked' : ''}>
                <span>流式时显示未闭合的 CG 预览</span>
            </label>
        </div>
    </div>
</div>`;

    $('#extensions_settings2').append(html);

    const bindInput = (id, key, parse = value => value) => {
        document.getElementById(id).addEventListener('input', event => {
            settings[key] = parse(event.target.type === 'checkbox' ? event.target.checked : event.target.value);
            saveSettings();
            updateValueLabels();
            applyCssVariables();
        });
    };

    bindInput('stcg_enabled', 'enabled');
    bindInput('stcg_title', 'title');
    bindInput('stcg_subtitle', 'subtitle');
    bindInput('stcg_background_url', 'backgroundUrl');
    bindInput('stcg_overlay', 'overlayOpacity', Number);
    bindInput('stcg_blur', 'blur', Number);
    bindInput('stcg_max_height', 'maxHeight', Number);
    bindInput('stcg_allow_partial', 'allowPartial');

    document.getElementById('stcg_background_file').addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toastr.warning('请选择图片文件');
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            await saveStoredBackground(String(reader.result));
            applyCssVariables();
            toastr.success('CG 背景图已保存到当前浏览器');
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('stcg_clear_local_bg').addEventListener('click', async () => {
        await saveStoredBackground('');
        applyCssVariables();
        toastr.info('已清除本地背景图');
    });

    updateValueLabels();
}

function updateValueLabels() {
    const settings = getSettings();
    const setText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    };
    setText('stcg_overlay_value', settings.overlayOpacity);
    setText('stcg_blur_value', `${settings.blur}px`);
    setText('stcg_max_height_value', `${settings.maxHeight}px`);
}

function startObserver() {
    if (observer) observer.disconnect();
    const target = document.getElementById('chat') || document.body;
    observer = new MutationObserver(() => scheduleProcess());
    observer.observe(target, { childList: true, subtree: true, characterData: true });
}

async function init() {
    getSettings();
    await loadStoredBackground();
    createSettingsPanel();
    applyCssVariables();
    startObserver();
    scheduleProcess();

    const { eventSource, event_types } = ctx();
    [
        event_types.CHARACTER_MESSAGE_RENDERED,
        event_types.MESSAGE_EDITED,
        event_types.MESSAGE_SWIPED,
        event_types.CHAT_CHANGED,
        event_types.STREAM_TOKEN_RECEIVED,
        event_types.GENERATION_ENDED,
    ].filter(Boolean).forEach(eventType => eventSource.on(eventType, scheduleProcess));

    console.log('[CG Beautifier] loaded');
}

jQuery(async () => {
    const { eventSource, event_types } = ctx();
    eventSource.on(event_types.APP_READY, init);
});
