// == SillyTavern 心理治疗师风格 Think / Thinking / Content 分离美化脚本 ==
// 版本：1.0.0
// 用法：在 SillyTavern 中导入本文件，例如：
// import 'https://你的地址/therapist-think-content-stage.js';
//
// 识别：
// <think>...</think>
// <thinking>...</thinking>
// <content>...</content>
//
// 功能：
// - 思维链默认收起，点击展开
// - 右上角：编辑、放大阅读
// - 放大窗口：复制思考、复制正文、复制全部、夜读模式
// - 流式/未闭合 think：显示呼吸动画提示
// - 正文缺失提醒
// - 格式修复按钮
// - 用户上传高清背景图，保存到当前用户 extensionSettings
// - UI 语气模拟：知性、有耐心、人生阅历丰富的心理治疗师

(() => {
    'use strict';

    const MODULE_NAME = 'st_therapist_think_content_stage';

    const DEFAULT_SETTINGS = Object.freeze({
        enabled: true,
        customBackground: '',
        nightMode: false,
        keepOriginalUnderBytes: 8 * 1024 * 1024,
        compressMaxSide: 3200,
        compressQuality: 0.97,
        autoOpenWhileStreaming: false
    });

    const CONFIG = {
        cardTitle: '耐心一点哦，我正在认真理解你',
        modalTitle: '我把刚才的思考慢慢摊开给你看',
        missingBodyText: '她好像把想法留在心里，还没把正式回应说出口。',
        missingBodySubText: '可以点“修复格式”，或让模型重新输出 <content> 正文。',
        modalMaxWidth: 'min(960px, 94vw)',

        themes: {
            therapy: {
                keywords: /心理|咨询|治疗|疗愈|情绪|创伤|焦虑|抑郁|倾听|陪伴|关系|安全感|压力|内耗|自我|来访者|边界|接纳|包容/i,
                motes: ['🫧', '🌷', '☁️'],
                gradient: 'radial-gradient(circle at 18% 10%, rgba(255,210,225,.26), transparent 32%), radial-gradient(circle at 86% 18%, rgba(180,220,255,.20), transparent 30%), linear-gradient(135deg, rgba(35,30,42,.96), rgba(42,48,62,.88))'
            },
            xianxia: {
                keywords: /修仙|仙侠|灵气|宗门|剑修|金丹|元婴|渡劫|飞升|洞府|法宝|妖兽|灵根|天道|仙门|炉鼎|秘境/i,
                motes: ['🍃', '🪷', '✨'],
                gradient: 'radial-gradient(circle at 18% 8%, rgba(160,235,255,.28), transparent 32%), radial-gradient(circle at 90% 20%, rgba(80,170,255,.18), transparent 28%), linear-gradient(135deg, rgba(7,20,36,.95), rgba(18,38,54,.88))'
            },
            fantasy: {
                keywords: /魔法|法师|精灵|矮人|龙族|骑士|王国|帝国|圣剑|恶魔|神殿|地城|冒险者|魔王|咒文/i,
                motes: ['✨', '🌙', '🦋'],
                gradient: 'radial-gradient(circle at 20% 12%, rgba(210,160,255,.28), transparent 30%), radial-gradient(circle at 85% 15%, rgba(255,220,140,.16), transparent 26%), linear-gradient(135deg, rgba(31,18,54,.95), rgba(55,35,73,.88))'
            },
            cyber: {
                keywords: /赛博|义体|芯片|网络|黑客|霓虹|机械|仿生|AI|人工智能|数据|都市传说|公司战争|终端/i,
                motes: ['💠', '🫧', '✨'],
                gradient: 'linear-gradient(115deg, rgba(0,255,255,.16), transparent 28%), radial-gradient(circle at 82% 18%, rgba(255,0,180,.22), transparent 32%), linear-gradient(135deg, rgba(6,12,28,.96), rgba(16,20,40,.9))'
            },
            ocean: {
                keywords: /海|海洋|潮汐|港口|舰船|岛屿|人鱼|深海|灯塔|沙滩|浪潮|水手|海盗|珊瑚/i,
                motes: ['🫧', '🌊', '🐚'],
                gradient: 'radial-gradient(circle at 16% 12%, rgba(92,210,255,.28), transparent 34%), radial-gradient(circle at 86% 20%, rgba(80,110,255,.14), transparent 32%), linear-gradient(135deg, rgba(5,25,45,.96), rgba(8,48,70,.88))'
            },
            academy: {
                keywords: /学院|校园|学生会|社团|教室|老师|同桌|考试|宿舍|图书馆|青春|校服|讲台/i,
                motes: ['☕', '🌷', '📖'],
                gradient: 'radial-gradient(circle at 16% 10%, rgba(255,226,165,.24), transparent 30%), radial-gradient(circle at 90% 18%, rgba(165,205,255,.18), transparent 28%), linear-gradient(135deg, rgba(36,30,42,.96), rgba(58,48,62,.88))'
            },
            ancient: {
                keywords: /古风|王朝|宫廷|江湖|武林|皇帝|公主|太子|将军|刺客|锦衣|青楼|客栈|朝堂|门派/i,
                motes: ['🍂', '🕯️', '✨'],
                gradient: 'radial-gradient(circle at 20% 10%, rgba(255,218,150,.24), transparent 34%), radial-gradient(circle at 88% 22%, rgba(180,70,40,.18), transparent 28%), linear-gradient(135deg, rgba(43,24,18,.96), rgba(65,43,28,.88))'
            },
            dark: {
                keywords: /血族|吸血鬼|诅咒|深渊|末日|废土|怪谈|克苏鲁|邪神|黑暗|噩梦|瘟疫|亡灵|幽灵|污染/i,
                motes: ['🌙', '🕯️', '🖤'],
                gradient: 'radial-gradient(circle at 18% 10%, rgba(255,60,100,.2), transparent 30%), radial-gradient(circle at 88% 16%, rgba(120,80,255,.16), transparent 30%), linear-gradient(135deg, rgba(16,10,18,.98), rgba(34,18,30,.92))'
            },
            default: {
                keywords: /.^/,
                motes: ['🫧', '🌷', '✨'],
                gradient: 'radial-gradient(circle at 18% 10%, rgba(180,210,255,.22), transparent 32%), radial-gradient(circle at 86% 18%, rgba(220,180,255,.16), transparent 30%), linear-gradient(135deg, rgba(16,20,34,.96), rgba(34,38,54,.88))'
            }
        }
    };

    const THINK_RE = /<(thinking|think)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    const CONTENT_RE = /<content\b[^>]*>([\s\S]*?)<\/content>/gi;
    const ANY_TAG_RE = /<\/?(?:thinking|think|content)\b[^>]*>/gi;

    let mutationTimer = null;
    let saveTimer = null;
    let isRendering = false;
    let boundEvents = false;

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function getContext() {
        return globalThis.SillyTavern?.getContext?.();
    }

    function getSettings() {
        const ctx = getContext();
        const extensionSettings = ctx?.extensionSettings;

        if (!extensionSettings) return clone(DEFAULT_SETTINGS);

        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = clone(DEFAULT_SETTINGS);
        }

        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
            if (!Object.prototype.hasOwnProperty.call(extensionSettings[MODULE_NAME], key)) {
                extensionSettings[MODULE_NAME][key] = value;
            }
        }

        return extensionSettings[MODULE_NAME];
    }

    function saveSettings() {
        getContext()?.saveSettingsDebounced?.();
    }

    function cleanText(text) {
        return String(text || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    function cssUrl(url) {
        return String(url || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function extractContentBlocks(text) {
        const contentParts = [];
        let hasContent = false;

        String(text || '').replace(CONTENT_RE, (_whole, inner) => {
            hasContent = true;
            const content = cleanText(inner);
            if (content) contentParts.push(content);
            return '';
        });

        if (hasContent) {
            return {
                hasContent,
                body: cleanText(contentParts.join('\n\n'))
            };
        }

        return {
            hasContent,
            body: cleanText(text)
        };
    }

    function splitThinkInner(inner) {
        const bodyParts = [];

        const thinkText = String(inner || '').replace(CONTENT_RE, (_whole, contentInner) => {
            const content = cleanText(contentInner);
            if (content) bodyParts.push(content);
            return '';
        });

        return {
            think: cleanText(thinkText),
            body: cleanText(bodyParts.join('\n\n'))
        };
    }

    function extractThinkAndContent(rawText) {
        let body = String(rawText || '').replace(/\r\n/g, '\n');
        const thinkParts = [];

        body = body.replace(THINK_RE, (_whole, _tag, inner) => {
            const split = splitThinkInner(inner);

            if (split.think) {
                thinkParts.push(split.think);
            }

            return split.body ? `\n${split.body}\n` : '';
        });

        const content = extractContentBlocks(body);

        return {
            think: cleanText(thinkParts.join('\n\n――――――\n\n')),
            body: content.body,
            hasContent: content.hasContent,
            hadThink: thinkParts.length > 0
        };
    }

    function extractLooseThinkAndContent(rawText) {
        const text = String(rawText || '').replace(/\r\n/g, '\n');
        const closed = extractThinkAndContent(text);

        if (closed.hadThink || closed.hasContent) {
            return closed;
        }

        const open = /<(thinking|think)\b[^>]*>/i.exec(text);
        if (!open) {
            return {
                think: '',
                body: cleanText(text.replace(ANY_TAG_RE, '')),
                hasContent: false,
                hadThink: false
            };
        }

        const before = text.slice(0, open.index);
        const after = text.slice(open.index + open[0].length);
        const contentInAfter = extractContentBlocks(after);

        if (contentInAfter.hasContent) {
            const thinkWithoutContent = cleanText(after.replace(CONTENT_RE, ''));
            return {
                think: thinkWithoutContent,
                body: cleanText([before, contentInAfter.body].filter(Boolean).join('\n\n')),
                hasContent: true,
                hadThink: true
            };
        }

        return {
            think: cleanText(after.replace(/<\/?(?:thinking|think)\b[^>]*>/gi, '')),
            body: cleanText(before.replace(ANY_TAG_RE, '')),
            hasContent: false,
            hadThink: true
        };
    }

    function getUnclosedThink(rawText) {
        const text = String(rawText || '');
        const openMatches = [...text.matchAll(/<(thinking|think)\b[^>]*>/gi)];
        if (!openMatches.length) return '';

        const lastOpen = openMatches[openMatches.length - 1];
        const start = lastOpen.index + lastOpen[0].length;
        const rest = text.slice(start);
        const closing = new RegExp(`</${lastOpen[1]}>`, 'i');

        if (closing.test(rest)) return '';

        return cleanText(rest.replace(CONTENT_RE, '').replace(ANY_TAG_RE, ''));
    }

    function hasRawFormatTags(rawText) {
        return ANY_TAG_RE.test(String(rawText || ''));
    }

    function getMessageIdFromElement(mesEl) {
        if (!mesEl) return null;

        const candidates = [
            mesEl.getAttribute('mesid'),
            mesEl.dataset?.mesid,
            mesEl.dataset?.messageId,
            mesEl.dataset?.index
        ];

        for (const item of candidates) {
            if (item !== null && item !== undefined && /^\d+$/.test(String(item))) {
                return Number(item);
            }
        }

        const all = [...document.querySelectorAll('#chat .mes')];
        const index = all.indexOf(mesEl);
        return index >= 0 ? index : null;
    }

    function getMessageById(id) {
        const ctx = getContext();
        if (!ctx?.chat || id === null || id === undefined) return null;
        return ctx.chat[id] || null;
    }

    function getCurrentCharacterText() {
        const ctx = getContext();
        const parts = [];

        try {
            const charId = ctx?.characterId ?? ctx?.this_chid;
            const character = ctx?.characters?.[charId];

            if (character) {
                parts.push(character.name);
                parts.push(character.description);
                parts.push(character.personality);
                parts.push(character.scenario);
                parts.push(character.first_mes);
                parts.push(character.mes_example);
                parts.push(character.creator_notes);
                parts.push(character.system_prompt);
                parts.push(character.post_history_instructions);

                if (character.data) {
                    parts.push(JSON.stringify(character.data));
                }
            }

            if (ctx?.groupId && Array.isArray(ctx?.groups)) {
                const group = ctx.groups.find(g => g.id === ctx.groupId);
                if (group) {
                    parts.push(group.name);
                    parts.push(JSON.stringify(group));
                }
            }
        } catch (_) {}

        return parts.filter(Boolean).join('\n');
    }

    function detectThemeKey() {
        const text = getCurrentCharacterText();

        for (const [key, theme] of Object.entries(CONFIG.themes)) {
            if (key === 'default') continue;
            if (theme.keywords?.test(text)) return key;
        }

        return 'default';
    }

    function applyThemeVars() {
        const settings = getSettings();
        const key = detectThemeKey();
        const theme = CONFIG.themes[key] || CONFIG.themes.default;
        const hasCustomBg = Boolean(settings.customBackground);

        const bg = hasCustomBg
            ? `linear-gradient(135deg, rgba(5,8,18,.30), rgba(12,16,28,.22)), url("${cssUrl(settings.customBackground)}")`
            : theme.gradient;

        document.documentElement.style.setProperty('--sttc-bg', bg);
        document.documentElement.dataset.sttcTheme = key;
        document.documentElement.dataset.sttcCustomBg = hasCustomBg ? 'true' : 'false';
    }

    function getThemeMotes() {
        const key = detectThemeKey();
        return CONFIG.themes[key]?.motes || CONFIG.themes.default.motes;
    }

    function wordCount(text) {
        const raw = cleanText(text);
        if (!raw) return 0;

        const cjk = raw.match(/[\u4e00-\u9fff]/g)?.length || 0;
        const latin = raw.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length || 0;

        return cjk + latin;
    }

    function getThinkingStatus(text, pending = false) {
        const raw = cleanText(text);
        const count = wordCount(raw);

        if (pending) {
            return { emoji: '🫧', text: '我正在听，也正在慢慢想' };
        }

        if (/不确定|矛盾|冲突|风险|可能|也许|担心|误差|验证|确认|检查|斟酌|边界|谨慎/.test(raw)) {
            return { emoji: '🪞', text: '我在小心确认，不急着替你下结论' };
        }

        if (/情绪|感受|关系|安抚|压力|焦虑|害怕|难过|创伤|治疗|倾听|陪伴|安全感|委屈|痛苦|孤独|接纳|包容/.test(raw)) {
            return { emoji: '🫧', text: '我在轻轻梳理感受' };
        }

        if (/人生|故事|经历|过去|童年|家庭|父母|成长|回忆|时间线|还原|叙事/.test(raw)) {
            return { emoji: '📖', text: '我在帮你把故事重新连起来' };
        }

        if (/设定|剧情|角色|世界观|地点|CG|content|正文|格式/.test(raw)) {
            return { emoji: '🧩', text: '我在区分线索和真正要说的话' };
        }

        if (count < 80) {
            return { emoji: '🌱', text: '我先整理一点线索' };
        }

        if (count < 260) {
            return { emoji: '🧠', text: '我在慢慢想清楚' };
        }

        if (count < 620) {
            return { emoji: '🧩', text: '信息有点多，我正在拼起来' };
        }

        return { emoji: '🌙', text: '我会耐心一点点理清' };
    }

    function getGentleSummary(text, pending = false) {
        const raw = cleanText(text);
        if (pending) return '她还在听你说的话，像把一团线先轻轻托在掌心。';
        if (!raw) return '这里暂时还没有留下可读的思考。';

        if (/人生|故事|经历|过去|童年|家庭|父母|成长|回忆|时间线|还原|叙事/.test(raw)) {
            return '她正在帮你把人生故事里的线索慢慢排好，不急着替你定义任何东西。';
        }

        if (/情绪|感受|关系|安抚|压力|焦虑|害怕|难过|创伤|治疗|倾听|陪伴|安全感|委屈|痛苦|孤独/.test(raw)) {
            return '她正在把你的感受放到更安全的位置，先理解，再回应。';
        }

        if (/不确定|矛盾|冲突|风险|可能|也许|担心|误差|验证|确认|检查|斟酌|边界|谨慎/.test(raw)) {
            return '她在多确认一点，尽量不仓促地下判断，也不越过你的边界。';
        }

        if (/设定|剧情|角色|世界观|地点|CG|content|正文|格式|标签/.test(raw)) {
            return '她在把设定、剧情和真正要说给你的话分开，避免混在一起。';
        }

        if (wordCount(raw) > 600) {
            return '她想得比较细，正在把许多信息一点点整理成可以被理解的话。';
        }

        return '她正在认真听，并试着用更温和、清楚的方式回应你。';
    }

    async function saveChatDebounced({ reload = false } = {}) {
        clearTimeout(saveTimer);

        saveTimer = setTimeout(async () => {
            const ctx = getContext();

            try {
                await ctx?.saveChat?.();
                if (reload) {
                    await ctx?.reloadCurrentChat?.();
                }
            } catch (error) {
                console.warn(`[${MODULE_NAME}] 保存聊天失败：`, error);
            }
        }, 180);
    }

    function normalizeMessage(message) {
        const settings = getSettings();
        if (!settings.enabled || !message || typeof message.mes !== 'string') return false;

        const extracted = extractThinkAndContent(message.mes);
        const hasThink = Boolean(extracted.think);
        const hasContentTag = /<content\b[^>]*>[\s\S]*?<\/content>/i.test(message.mes);

        if (!hasThink && !hasContentTag) return false;

        message.extra ??= {};

        if (hasThink) {
            const oldThink = cleanText(message.extra.sttc_think || '');
            message.extra.sttc_think = oldThink
                ? `${oldThink}\n\n――――――\n\n${extracted.think}`
                : extracted.think;
        }

        message.extra.sttc_theme = detectThemeKey();
        message.extra.sttc_body_missing = !cleanText(extracted.body);

        message.mes = extracted.body;

        return true;
    }

    function normalizeAllMessages() {
        const ctx = getContext();
        if (!ctx?.chat) return false;

        let changed = false;

        for (const message of ctx.chat) {
            if (normalizeMessage(message)) {
                changed = true;
            }
        }

        if (changed) {
            saveChatDebounced({ reload: true });
        }

        return changed;
    }

    function repairMessageFormat(messageId) {
        const message = getMessageById(messageId);
        if (!message || typeof message.mes !== 'string') return;

        const repaired = extractLooseThinkAndContent(message.mes);
        const oldThink = cleanText(message.extra?.sttc_think || '');

        message.extra ??= {};

        if (repaired.think) {
            message.extra.sttc_think = oldThink
                ? `${oldThink}\n\n――――――\n\n${repaired.think}`
                : repaired.think;
        }

        message.mes = cleanText(repaired.body.replace(ANY_TAG_RE, ''));
        message.extra.sttc_body_missing = !cleanText(message.mes);
        message.extra.sttc_theme = detectThemeKey();

        saveChatDebounced({ reload: true });
    }

    function ensureStyles() {
        if (document.getElementById(`${MODULE_NAME}_style`)) return;

        const style = document.createElement('style');
        style.id = `${MODULE_NAME}_style`;
        style.textContent = `
            :root {
                --sttc-bg: ${CONFIG.themes.default.gradient};
                --sttc-border: rgba(220,230,255,.28);
                --sttc-text: rgba(248,250,255,.96);
                --sttc-muted: rgba(230,236,255,.76);
                --sttc-soft: rgba(255,255,255,.56);
                --sttc-glow: rgba(120,170,255,.26);
                --sttc-btn: rgba(255,255,255,.105);
                --sttc-btn-hover: rgba(255,255,255,.18);
            }

            :root[data-sttc-theme="therapy"] {
                --sttc-border: rgba(255,198,220,.34);
                --sttc-glow: rgba(255,185,215,.22);
            }

            :root[data-sttc-theme="xianxia"] {
                --sttc-border: rgba(164,230,255,.36);
                --sttc-glow: rgba(90,210,255,.25);
            }

            :root[data-sttc-theme="fantasy"] {
                --sttc-border: rgba(226,184,255,.36);
                --sttc-glow: rgba(176,104,255,.27);
            }

            :root[data-sttc-theme="cyber"] {
                --sttc-border: rgba(80,245,255,.42);
                --sttc-glow: rgba(0,240,255,.32);
            }

            :root[data-sttc-theme="ocean"] {
                --sttc-border: rgba(94,208,255,.38);
                --sttc-glow: rgba(72,164,255,.28);
            }

            :root[data-sttc-theme="academy"] {
                --sttc-border: rgba(255,226,170,.34);
                --sttc-glow: rgba(255,205,120,.22);
            }

            :root[data-sttc-theme="ancient"] {
                --sttc-border: rgba(255,210,148,.38);
                --sttc-glow: rgba(255,170,82,.22);
            }

            :root[data-sttc-theme="dark"] {
                --sttc-border: rgba(255,88,128,.34);
                --sttc-glow: rgba(255,45,92,.22);
            }

            .sttc-card {
                position: relative;
                margin: .45rem 0 .75rem;
                border: 1px solid var(--sttc-border);
                border-radius: 20px;
                overflow: hidden;
                color: var(--sttc-text);
                background-image: var(--sttc-bg);
                background-size: cover;
                background-position: center;
                box-shadow:
                    0 10px 28px rgba(0,0,0,.26),
                    inset 0 0 0 1px rgba(255,255,255,.055),
                    0 0 24px var(--sttc-glow);
                backdrop-filter: saturate(1.08);
            }

            .sttc-card::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background:
                    radial-gradient(circle at top left, rgba(255,255,255,.13), transparent 34%),
                    linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
                opacity: .82;
            }

            :root[data-sttc-custom-bg="true"] .sttc-card::before {
                opacity: .30;
            }

            .sttc-card[data-pending="true"] {
                animation: sttcBreath 2.8s ease-in-out infinite;
            }

            @keyframes sttcBreath {
                0%, 100% {
                    box-shadow:
                        0 10px 28px rgba(0,0,0,.26),
                        inset 0 0 0 1px rgba(255,255,255,.055),
                        0 0 18px var(--sttc-glow);
                }
                50% {
                    box-shadow:
                        0 10px 28px rgba(0,0,0,.30),
                        inset 0 0 0 1px rgba(255,255,255,.09),
                        0 0 34px var(--sttc-glow);
                }
            }

            .sttc-motes {
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            }

            .sttc-mote {
                position: absolute;
                opacity: .72;
                filter: drop-shadow(0 2px 8px rgba(0,0,0,.35));
                animation: sttcFloat 5.6s ease-in-out infinite;
            }

            .sttc-mote:nth-child(1) {
                top: 12%;
                left: 5%;
                animation-delay: 0s;
            }

            .sttc-mote:nth-child(2) {
                top: 18%;
                right: 8%;
                animation-delay: 1.2s;
            }

            .sttc-mote:nth-child(3) {
                bottom: 12%;
                right: 18%;
                animation-delay: 2.1s;
            }

            @keyframes sttcFloat {
                0%, 100% {
                    transform: translateY(0) scale(1);
                    opacity: .42;
                }
                50% {
                    transform: translateY(-8px) scale(1.08);
                    opacity: .9;
                }
            }

            .sttc-header {
                position: relative;
                z-index: 2;
                min-height: 48px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: .75rem;
                padding: .62rem .78rem;
                cursor: pointer;
                user-select: none;
                background: rgba(0,0,0,.12);
            }

            :root[data-sttc-custom-bg="true"] .sttc-header {
                background: rgba(0,0,0,.18);
            }

            .sttc-title {
                display: flex;
                align-items: center;
                gap: .5rem;
                min-width: 0;
                font-weight: 800;
                letter-spacing: .02em;
                text-shadow: 0 1px 8px rgba(0,0,0,.48);
            }

            .sttc-title-main {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .sttc-status {
                display: flex;
                align-items: center;
                gap: .28rem;
                font-size: .73rem;
                font-weight: 700;
                color: var(--sttc-muted);
                border: 1px solid rgba(255,255,255,.16);
                background: rgba(0,0,0,.18);
                border-radius: 999px;
                padding: .12rem .5rem;
                white-space: nowrap;
            }

            .sttc-actions {
                display: flex;
                align-items: center;
                gap: .35rem;
                flex-shrink: 0;
            }

            .sttc-btn {
                width: 28px;
                height: 28px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255,255,255,.14);
                border-radius: 999px;
                color: var(--sttc-text);
                background: var(--sttc-btn);
                cursor: pointer;
                transition: transform .12s ease, background .12s ease, border-color .12s ease;
            }

            .sttc-btn:hover {
                transform: translateY(-1px);
                background: var(--sttc-btn-hover);
                border-color: rgba(255,255,255,.28);
            }

            .sttc-body {
                position: relative;
                z-index: 2;
                display: none;
                padding: .25rem .9rem .95rem;
                background: rgba(0,0,0,.10);
            }

            :root[data-sttc-custom-bg="true"] .sttc-body {
                background: rgba(0,0,0,.18);
            }

            .sttc-card[data-open="true"] .sttc-body {
                display: block;
            }

            .sttc-card[data-open="false"] .sttc-chevron {
                transform: rotate(-90deg);
            }

            .sttc-chevron {
                display: inline-block;
                transition: transform .16s ease;
            }

            .sttc-summary {
                margin: .15rem 0 .72rem;
                padding: .54rem .68rem;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,.12);
                color: rgba(248,250,255,.86);
                background: rgba(0,0,0,.18);
                line-height: 1.55;
                font-size: .9rem;
                text-shadow: 0 1px 6px rgba(0,0,0,.46);
            }

            .sttc-content {
                margin: 0;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                color: var(--sttc-muted);
                line-height: 1.72;
                font-size: .94rem;
                text-shadow: 0 1px 6px rgba(0,0,0,.52);
                font-family: inherit;
            }

            .sttc-missing {
                position: relative;
                z-index: 2;
                margin: .45rem 0 .75rem;
                padding: .75rem .85rem;
                border-radius: 18px;
                border: 1px solid rgba(255,210,220,.28);
                color: rgba(255,248,250,.92);
                background:
                    radial-gradient(circle at 16% 10%, rgba(255,210,225,.22), transparent 32%),
                    linear-gradient(135deg, rgba(36,24,34,.92), rgba(44,38,52,.86));
                box-shadow: 0 8px 24px rgba(0,0,0,.22);
            }

            .sttc-missing-main {
                font-weight: 800;
                margin-bottom: .2rem;
            }

            .sttc-missing-sub {
                color: rgba(255,248,250,.72);
                font-size: .88rem;
                line-height: 1.5;
            }

            .sttc-modal-mask {
                position: fixed;
                z-index: 999999;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: rgba(0,0,0,.58);
                backdrop-filter: blur(6px);
            }

            .sttc-modal {
                width: ${CONFIG.modalMaxWidth};
                max-height: min(84vh, 820px);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid var(--sttc-border);
                border-radius: 22px;
                color: var(--sttc-text);
                background-image: var(--sttc-bg);
                background-size: cover;
                background-position: center;
                box-shadow:
                    0 24px 80px rgba(0,0,0,.55),
                    inset 0 0 0 1px rgba(255,255,255,.07),
                    0 0 36px var(--sttc-glow);
            }

            .sttc-modal[data-night="true"] {
                background-image:
                    linear-gradient(135deg, rgba(0,0,0,.72), rgba(8,10,18,.72)),
                    var(--sttc-bg);
            }

            .sttc-modal[data-night="true"] .sttc-modal-content {
                background: rgba(0,0,0,.42);
            }

            .sttc-modal-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: .9rem 1rem;
                background: rgba(0,0,0,.24);
                border-bottom: 1px solid rgba(255,255,255,.12);
            }

            .sttc-modal-title {
                font-weight: 800;
                letter-spacing: .03em;
            }

            .sttc-modal-actions {
                display: flex;
                align-items: center;
                gap: .45rem;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            .sttc-modal-content {
                padding: 1rem;
                overflow: auto;
                background: rgba(0,0,0,.18);
            }

            .sttc-modal-pre {
                margin: 0;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                color: rgba(246,248,255,.9);
                line-height: 1.78;
                font-family: inherit;
            }

            .sttc-textarea {
                width: 100%;
                min-height: min(58vh, 560px);
                resize: vertical;
                box-sizing: border-box;
                border: 1px solid rgba(255,255,255,.18);
                border-radius: 14px;
                padding: .85rem;
                color: rgba(248,250,255,.95);
                background: rgba(0,0,0,.38);
                outline: none;
                line-height: 1.65;
                font-family: inherit;
            }

            .sttc-textarea:focus {
                border-color: rgba(255,255,255,.36);
                box-shadow: 0 0 0 3px rgba(255,255,255,.08);
            }

            .sttc-primary {
                min-width: 64px;
                height: 32px;
                padding: 0 .8rem;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,.2);
                color: var(--sttc-text);
                background: rgba(255,255,255,.16);
                cursor: pointer;
                font-weight: 700;
            }

            .sttc-primary:hover {
                background: rgba(255,255,255,.24);
            }

            .sttc-bg-fab {
                position: fixed;
                right: 16px;
                bottom: 84px;
                z-index: 99999;
                min-width: 42px;
                height: 42px;
                padding: 0 .72rem;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,.18);
                color: rgba(250,252,255,.95);
                background: rgba(16,18,28,.72);
                box-shadow: 0 8px 26px rgba(0,0,0,.35);
                backdrop-filter: blur(8px);
                cursor: pointer;
                font-weight: 800;
            }

            .sttc-bg-panel {
                position: fixed;
                right: 16px;
                bottom: 134px;
                z-index: 99999;
                width: min(360px, calc(100vw - 32px));
                padding: 12px;
                display: none;
                border-radius: 18px;
                border: 1px solid rgba(255,255,255,.18);
                color: rgba(250,252,255,.94);
                background: rgba(16,18,28,.86);
                box-shadow: 0 12px 34px rgba(0,0,0,.42);
                backdrop-filter: blur(10px);
            }

            .sttc-bg-panel[data-open="true"] {
                display: block;
            }

            .sttc-bg-panel-title {
                font-weight: 800;
                margin-bottom: 8px;
            }

            .sttc-bg-panel-note {
                font-size: .82rem;
                opacity: .78;
                line-height: 1.5;
                margin: 8px 0 10px;
            }

            .sttc-bg-panel-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .sttc-bg-preview {
                width: 100%;
                height: 104px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,.14);
                background-image: var(--sttc-bg);
                background-size: cover;
                background-position: center;
                margin-top: 10px;
            }

            @media (max-width: 640px) {
                .sttc-title {
                    gap: .35rem;
                }

                .sttc-status {
                    display: none;
                }

                .sttc-modal-actions {
                    gap: .32rem;
                }

                .sttc-primary {
                    min-width: auto;
                    padding: 0 .62rem;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createButton(title, html, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sttc-btn';
        btn.title = title;
        btn.innerHTML = html;

        btn.addEventListener('click', event => {
            event.stopPropagation();
            event.preventDefault();
            onClick?.(event);
        });

        return btn;
    }

    function createPrimaryButton(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'sttc-primary';
        btn.type = 'button';
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }

    function copyText(text, button, doneText = '已复制') {
        navigator.clipboard.writeText(text || '').then(() => {
            const old = button.textContent;
            button.textContent = doneText;
            setTimeout(() => button.textContent = old, 900);
        }).catch(() => {
            const old = button.textContent;
            button.textContent = '失败';
            setTimeout(() => button.textContent = old, 900);
        });
    }

    function getMessageBody(message) {
        return cleanText(message?.mes || '');
    }

    function getMessageThink(message) {
        return cleanText(message?.extra?.sttc_think || '');
    }

    function openViewModal(messageId) {
        const message = getMessageById(messageId);
        openModal({
            mode: 'view',
            messageId,
            text: getMessageThink(message)
        });
    }

    function openEditModal(messageId) {
        const message = getMessageById(messageId);
        openModal({
            mode: 'edit',
            messageId,
            text: getMessageThink(message)
        });
    }

    function openModal({ mode, messageId, text }) {
        document.querySelector('.sttc-modal-mask')?.remove();

        const settings = getSettings();
        const message = getMessageById(messageId);
        const bodyText = getMessageBody(message);
        const thinkText = cleanText(text);

        const mask = document.createElement('div');
        mask.className = 'sttc-modal-mask';

        const modal = document.createElement('div');
        modal.className = 'sttc-modal';
        modal.dataset.night = settings.nightMode ? 'true' : 'false';

        const head = document.createElement('div');
        head.className = 'sttc-modal-head';

        const title = document.createElement('div');
        title.className = 'sttc-modal-title';
        title.textContent = mode === 'edit' ? '编辑她刚才的思考' : CONFIG.modalTitle;

        const actions = document.createElement('div');
        actions.className = 'sttc-modal-actions';

        const closeBtn = createPrimaryButton('关闭', () => mask.remove());
        actions.appendChild(closeBtn);

        head.appendChild(title);
        head.appendChild(actions);

        const content = document.createElement('div');
        content.className = 'sttc-modal-content';

        if (mode === 'edit') {
            const textarea = document.createElement('textarea');
            textarea.className = 'sttc-textarea';
            textarea.value = thinkText;

            const saveBtn = createPrimaryButton('保存', async () => {
                const msg = getMessageById(messageId);
                if (!msg) return;

                msg.extra ??= {};
                msg.extra.sttc_think = cleanText(textarea.value);

                await saveChatDebounced({ reload: false });
                renderAllThinkCards();
                mask.remove();
            });

            const nightBtn = createPrimaryButton(settings.nightMode ? '退出夜读' : '夜读', () => {
                const s = getSettings();
                s.nightMode = !s.nightMode;
                saveSettings();
                modal.dataset.night = s.nightMode ? 'true' : 'false';
                nightBtn.textContent = s.nightMode ? '退出夜读' : '夜读';
            });

            actions.insertBefore(nightBtn, closeBtn);
            actions.insertBefore(saveBtn, nightBtn);

            content.appendChild(textarea);
            setTimeout(() => textarea.focus(), 50);
        } else {
            const editBtn = createPrimaryButton('编辑', () => {
                mask.remove();
                openEditModal(messageId);
            });

            const copyThinkBtn = createPrimaryButton('复制思考', () => copyText(thinkText, copyThinkBtn));
            const copyBodyBtn = createPrimaryButton('复制正文', () => copyText(bodyText, copyBodyBtn));
            const copyAllBtn = createPrimaryButton('复制全部', () => {
                const all = [
                    thinkText ? `<think>\n${thinkText}\n</think>` : '',
                    bodyText ? `<content>\n${bodyText}\n</content>` : ''
                ].filter(Boolean).join('\n\n');

                copyText(all, copyAllBtn);
            });

            const nightBtn = createPrimaryButton(settings.nightMode ? '退出夜读' : '夜读', () => {
                const s = getSettings();
                s.nightMode = !s.nightMode;
                saveSettings();
                modal.dataset.night = s.nightMode ? 'true' : 'false';
                nightBtn.textContent = s.nightMode ? '退出夜读' : '夜读';
            });

            actions.insertBefore(nightBtn, closeBtn);
            actions.insertBefore(copyAllBtn, nightBtn);
            actions.insertBefore(copyBodyBtn, copyAllBtn);
            actions.insertBefore(copyThinkBtn, copyBodyBtn);
            actions.insertBefore(editBtn, copyThinkBtn);

            const summary = document.createElement('div');
            summary.className = 'sttc-summary';
            summary.textContent = getGentleSummary(thinkText);

            const pre = document.createElement('pre');
            pre.className = 'sttc-modal-pre';
            pre.textContent = thinkText || '这里还没有内容。';

            content.appendChild(summary);
            content.appendChild(pre);
        }

        modal.appendChild(head);
        modal.appendChild(content);
        mask.appendChild(modal);

        mask.addEventListener('click', event => {
            if (event.target === mask) mask.remove();
        });

        document.addEventListener('keydown', function escHandler(event) {
            if (event.key === 'Escape') {
                mask.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });

        document.body.appendChild(mask);
    }

    function createMotes() {
        const motes = document.createElement('div');
        motes.className = 'sttc-motes';

        for (const mote of getThemeMotes()) {
            const span = document.createElement('span');
            span.className = 'sttc-mote';
            span.textContent = mote;
            motes.appendChild(span);
        }

        return motes;
    }

    function createThinkCard(messageId, thinkText, options = {}) {
        const pending = Boolean(options.pending);
        const card = document.createElement('div');
        card.className = 'sttc-card';
        card.dataset.messageId = String(messageId);
        card.dataset.open = pending && getSettings().autoOpenWhileStreaming ? 'true' : 'false';
        card.dataset.pending = pending ? 'true' : 'false';

        const status = getThinkingStatus(thinkText, pending);

        const header = document.createElement('div');
        header.className = 'sttc-header';

        const title = document.createElement('div');
        title.className = 'sttc-title';

        const chevron = document.createElement('span');
        chevron.className = 'sttc-chevron';
        chevron.textContent = '▾';

        const titleMain = document.createElement('span');
        titleMain.className = 'sttc-title-main';
        titleMain.textContent = pending
            ? '🌷 请稍等，我正在认真听'
            : `🌷 ${CONFIG.cardTitle}`;

        const statusChip = document.createElement('span');
        statusChip.className = 'sttc-status';
        statusChip.textContent = `${status.emoji} ${status.text}`;

        title.appendChild(chevron);
        title.appendChild(titleMain);
        title.appendChild(statusChip);

        const actions = document.createElement('div');
        actions.className = 'sttc-actions';

        if (!pending) {
            actions.appendChild(createButton('编辑', '✎', () => openEditModal(messageId)));
            actions.appendChild(createButton('放大', '⛶', () => openViewModal(messageId)));
        }

        actions.appendChild(createButton('修复格式', '🩹', () => repairMessageFormat(messageId)));

        header.appendChild(title);
        header.appendChild(actions);

        const body = document.createElement('div');
        body.className = 'sttc-body';

        const summary = document.createElement('div');
        summary.className = 'sttc-summary';
        summary.textContent = getGentleSummary(thinkText, pending);

        const pre = document.createElement('pre');
        pre.className = 'sttc-content';
        pre.innerHTML = escapeHtml(thinkText || '她还在想，文字还没有完全落下来。');

        body.appendChild(summary);
        body.appendChild(pre);

        header.addEventListener('click', () => {
            card.dataset.open = card.dataset.open === 'true' ? 'false' : 'true';
        });

        card.appendChild(createMotes());
        card.appendChild(header);
        card.appendChild(body);

        return card;
    }

    function createMissingBodyNotice(messageId) {
        const box = document.createElement('div');
        box.className = 'sttc-missing';

        const main = document.createElement('div');
        main.className = 'sttc-missing-main';
        main.textContent = CONFIG.missingBodyText;

        const sub = document.createElement('div');
        sub.className = 'sttc-missing-sub';
        sub.textContent = CONFIG.missingBodySubText;

        const actions = document.createElement('div');
        actions.className = 'sttc-bg-panel-actions';
        actions.style.marginTop = '8px';

        const repairBtn = createPrimaryButton('修复格式', () => repairMessageFormat(messageId));
        actions.appendChild(repairBtn);

        box.appendChild(main);
        box.appendChild(sub);
        box.appendChild(actions);

        return box;
    }

    function renderThinkCardForMessage(mesEl) {
        const messageId = getMessageIdFromElement(mesEl);
        if (messageId === null) return;

        const message = getMessageById(messageId);
        if (!message) return;

        const thinkText = getMessageThink(message);
        const pendingThink = !thinkText ? getUnclosedThink(message.mes) : '';
        const bodyMissing = Boolean(message.extra?.sttc_body_missing) || (thinkText && !cleanText(message.mes));
        const rawTags = hasRawFormatTags(message.mes);

        mesEl.querySelectorAll('.sttc-card, .sttc-missing').forEach(el => el.remove());

        if (!thinkText && !pendingThink && !bodyMissing && !rawTags) return;

        const textEl =
            mesEl.querySelector('.mes_text') ||
            mesEl.querySelector('.mes_text_send') ||
            mesEl.querySelector('[class*="mes_text"]');

        if (!textEl) return;

        const parent = textEl.parentElement;
        if (!parent) return;

        if (thinkText || pendingThink) {
            const card = createThinkCard(messageId, thinkText || pendingThink, { pending: Boolean(pendingThink) });
            parent.insertBefore(card, textEl);
        }

        if (bodyMissing) {
            const notice = createMissingBodyNotice(messageId);
            parent.insertBefore(notice, textEl);
        }
    }

    function renderAllThinkCards() {
        isRendering = true;

        try {
            applyThemeVars();

            const messageElements = document.querySelectorAll('#chat .mes');
            for (const mesEl of messageElements) {
                renderThinkCardForMessage(mesEl);
            }
        } finally {
            setTimeout(() => {
                isRendering = false;
            }, 80);
        }
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    }

    function fileToImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = error => {
                URL.revokeObjectURL(url);
                reject(error);
            };

            img.src = url;
        });
    }

    async function imageFileToClearDataUrl(file) {
        const settings = getSettings();

        if (!file.type.startsWith('image/')) {
            throw new Error('请选择图片文件。');
        }

        if (file.size <= Number(settings.keepOriginalUnderBytes || DEFAULT_SETTINGS.keepOriginalUnderBytes)) {
            return await readFileAsDataURL(file);
        }

        const img = await fileToImage(file);
        const maxSide = Number(settings.compressMaxSide || DEFAULT_SETTINGS.compressMaxSide);
        const quality = Number(settings.compressQuality || DEFAULT_SETTINGS.compressQuality);

        let { width, height } = img;

        if (width > maxSide || height > maxSide) {
            const ratio = Math.min(maxSide / width, maxSide / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        return canvas.toDataURL('image/jpeg', quality);
    }

    function ensureBackgroundPanel() {
        if (document.querySelector('.sttc-bg-fab')) return;

        const fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'sttc-bg-fab';
        fab.textContent = '背景';

        const panel = document.createElement('div');
        panel.className = 'sttc-bg-panel';
        panel.dataset.open = 'false';

        const title = document.createElement('div');
        title.className = 'sttc-bg-panel-title';
        title.textContent = '思考卡片背景';

        const note = document.createElement('div');
        note.className = 'sttc-bg-panel-note';
        note.textContent = '小于 8MB 的图片会尽量按原图保存；大图才会高清压缩。背景保存在当前用户的扩展设置里。';

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        const uploadBtn = createPrimaryButton('高清上传', () => input.click());
        const clearBtn = createPrimaryButton('清除', () => {
            const settings = getSettings();
            settings.customBackground = '';

            saveSettings();
            applyThemeVars();
            renderAllThinkCards();
        });

        const actions = document.createElement('div');
        actions.className = 'sttc-bg-panel-actions';
        actions.appendChild(uploadBtn);
        actions.appendChild(clearBtn);

        const preview = document.createElement('div');
        preview.className = 'sttc-bg-preview';

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                uploadBtn.textContent = '处理中...';

                const dataUrl = await imageFileToClearDataUrl(file);
                const settings = getSettings();
                settings.customBackground = dataUrl;

                saveSettings();
                applyThemeVars();
                renderAllThinkCards();

                uploadBtn.textContent = '已上传';
                setTimeout(() => uploadBtn.textContent = '高清上传', 900);
            } catch (error) {
                console.warn(`[${MODULE_NAME}] 上传背景失败：`, error);
                uploadBtn.textContent = '失败';
                setTimeout(() => uploadBtn.textContent = '高清上传', 900);
            } finally {
                input.value = '';
            }
        });

        fab.addEventListener('click', () => {
            panel.dataset.open = panel.dataset.open === 'true' ? 'false' : 'true';
        });

        panel.appendChild(title);
        panel.appendChild(note);
        panel.appendChild(actions);
        panel.appendChild(preview);
        panel.appendChild(input);

        document.body.appendChild(fab);
        document.body.appendChild(panel);
    }

    function scheduleProcess() {
        if (isRendering) return;

        clearTimeout(mutationTimer);

        mutationTimer = setTimeout(() => {
            if (isRendering) return;

            const changed = normalizeAllMessages();

            if (!changed) {
                renderAllThinkCards();
            }
        }, 220);
    }

    function installObserver() {
        const chat = document.getElementById('chat');
        if (!chat || chat.dataset.sttcObserver === '1') return;

        chat.dataset.sttcObserver = '1';

        const observer = new MutationObserver(() => {
            if (isRendering) return;
            scheduleProcess();
        });

        observer.observe(chat, {
            childList: true,
            subtree: true
        });
    }

    function bindEvents() {
        if (boundEvents) return;

        const ctx = getContext();
        const eventSource = ctx?.eventSource;
        const eventTypes = ctx?.event_types || ctx?.eventTypes || {};

        if (!eventSource) return;

        boundEvents = true;

        const safeOn = (eventName, fn) => {
            if (!eventName) return;
            try {
                eventSource.on(eventName, fn);
            } catch (_) {}
        };

        safeOn(eventTypes.MESSAGE_RECEIVED || 'message_received', () => {
            setTimeout(scheduleProcess, 80);
            setTimeout(scheduleProcess, 420);
        });

        safeOn(eventTypes.CHARACTER_MESSAGE_RENDERED || 'character_message_rendered', () => {
            setTimeout(renderAllThinkCards, 80);
        });

        safeOn(eventTypes.CHAT_CHANGED || 'chat_id_changed', () => {
            setTimeout(() => {
                normalizeAllMessages();
                renderAllThinkCards();
                installObserver();
                ensureBackgroundPanel();
            }, 350);
        });

        safeOn(eventTypes.CHARACTER_EDITED || 'character_edited', () => {
            applyThemeVars();
            renderAllThinkCards();
        });
    }

    function init() {
        const ctx = getContext();

        if (!ctx) {
            setTimeout(init, 500);
            return;
        }

        getSettings();
        ensureStyles();
        applyThemeVars();
        bindEvents();
        installObserver();
        ensureBackgroundPanel();

        setTimeout(() => {
            normalizeAllMessages();
            renderAllThinkCards();
        }, 700);

        console.log(`[${MODULE_NAME}] loaded`);
    }

    init();
})();
