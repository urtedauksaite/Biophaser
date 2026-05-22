const STORAGE_KEY = 'biophaser_progress';

// Bendras progreso modulis visiems žaidimams.
// Čia apibrėžiamas vienodas rezultatų saugojimo formatas localStorage terpėje.
const GAME_PALETTES = {
    amino:     { accent: '#F97316', soft: 0xFFF7ED, tint: '#9A3412' },
    codon:     { accent: '#38BDF8', soft: 0xF0F9FF, tint: '#0C4A6E' },
    alignment: { accent: '#10B981', soft: 0xECFDF5, tint: '#065F46' },
    lmer:      { accent: '#8B5CF6', soft: 0xF5F3FF, tint: '#5B21B6' },
    imer:      { accent: '#8B5CF6', soft: 0xF5F3FF, tint: '#5B21B6' },
    default:   { accent: '#10B981', soft: 0xECFDF5, tint: '#065F46' }
};

function normalizeGameKey(gameKey) {
    return gameKey === 'imer' ? 'lmer' : gameKey;
}

function getPalette(gameKey) {
    return GAME_PALETTES[normalizeGameKey(gameKey)] || GAME_PALETTES.default;
}

function metricTone(value, { good = true } = {}) {
    if ((good && value >= 0) || (!good && value <= 0)) {
        return { fill: 0xECFDF5, stroke: 0x86EFAC, valueColor: '#047857', labelColor: '#065F46' };
    }
    return { fill: 0xFFF7ED, stroke: 0xFDBA74, valueColor: '#C2410C', labelColor: '#9A3412' };
}

function strongTone(hex) {
    return { fill: parseInt(hex.replace('#', '0x')), stroke: parseInt(hex.replace('#', '0x')), valueColor: '#ffffff', labelColor: '#DCFCE7' };
}

function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
}

function store(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function calculatePercent(score, total) {
    if (!Number.isFinite(score) || !Number.isFinite(total) || total === 0) return 0;
    return Math.max(0, Math.min(100, Math.round((score / total) * 100)));
}

function formatDate(iso) {
    if (!iso) return 'Data nežinoma';
    return new Date(iso).toLocaleString('lt-LT', {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit'
    });
}

function makeAttempt(score, total, details, date) {
    return { score, total, percent: calculatePercent(score, total), date: date || null, details: details || {} };
}

// Senesnių įrašų suderinamumo sluoksnis:
// jei naršyklėje randama ankstesnė duomenų struktūra,
// ji paverčiama į dabartinį formatą neprarandant rezultatų istorijos.
function normalizeEntry(entry) {
    if (!entry) return null;
    if (entry.best && entry.last && Array.isArray(entry.history)) return entry;
    const a = makeAttempt(entry.score || 0, entry.total || 1, {}, null);
    return {
        attempts:    entry.count || 1,
        best:        { ...a },
        last:        { ...a },
        first:       { ...a },
        improvement: 0,
        history:     [{ ...a }]
    };
}

const Progress = {
    save(gameKey, { score, total, details = {} }) {
        if (!total) return;
        const data    = load();
        const key     = normalizeGameKey(gameKey);
        const prev    = normalizeEntry(data[key] ?? data.imer);
        const now     = new Date().toISOString();
        const current = makeAttempt(score, total, details, now);

        // Saugojamas ne tik paskutinis bandymas, bet ir santrauka,
        // reikalinga progreso bei rezultatų ekranams.
        const attempts = (prev?.attempts || 0) + 1;
        const first    = prev?.first || current;
        const history  = [...(prev?.history || []), current].slice(-30);

        const prevBestPercent = prev?.best?.percent ?? -1;
        const prevBestScore   = prev?.best?.score   ?? -Infinity;
        const isBetter = current.percent > prevBestPercent ||
            (current.percent === prevBestPercent && current.score > prevBestScore);
        const best = isBetter ? current : prev.best;

        data[key] = {
            attempts,
            best,
            last:        current,
            first,
            improvement: current.percent - first.percent,
            history
        };
        if (key === 'lmer') delete data.imer;
        store(data);
    },

    get(gameKey) {
        const data = load();
        const key = normalizeGameKey(gameKey);
        return normalizeEntry(data[key] ?? (key === 'lmer' ? data.imer : undefined));
    },

    formatBadge(gameKey, displayType) {
        const entry = this.get(gameKey);
        if (!entry) return { text: 'Dar nepradėta', played: false };

        const { best, attempts } = entry;
        const text = displayType === 'score'
            ? `Geriausias balas: ${best.score} · ${attempts} band.`
            : `Geriausias: ${best.score}/${best.total} · ${attempts} band.`;

        return { text, played: true };
    },

    formatDetails(gameKey, displayType, title) {
        const entry = this.get(gameKey);
        const palette = getPalette(gameKey);
        if (!entry) {
            return {
                title,
                palette,
                hasProgress:  false,
                summaryLines: [
                    'Šis žaidimas dar nebuvo bandytas.',
                    'Paleisk žaidimą ir užbaik bent vieną bandymą, kad čia atsirastų istorija.'
                ],
                historyLines: [],
                detailLines:  []
            };
        }

        const { attempts, best, last, first, improvement, history } = entry;

        let summaryLines;
        let summaryCards;
        if (displayType === 'score') {
            const diff = last.score - first.score;
            summaryLines = [
                `Bandymų skaičius: ${attempts}`,
                `Geriausias balas: ${best.score}`,
                `Paskutinis balas: ${last.score}`,
                `Optimalus / tikslinis balas: ${last.total}`,
                `Pokytis nuo pirmo bandymo: ${diff >= 0 ? '+' : ''}${diff} bal.`
            ];
            summaryCards = [
                { label: 'Bandymų skaičius', value: `${attempts}`, tone: { fill: palette.soft, stroke: parseInt(palette.accent.replace('#', '0x')), valueColor: palette.tint, labelColor: palette.accent } },
                { label: 'Geriausias balas', value: `${best.score}`, tone: strongTone(palette.accent) },
                { label: 'Paskutinis balas', value: `${last.score}`, tone: { fill: 0xEFF6FF, stroke: 0x93C5FD, valueColor: '#1D4ED8', labelColor: '#1E3A8A' } },
                { label: 'Pokytis', value: `${diff >= 0 ? '+' : ''}${diff} bal.`, tone: metricTone(diff) }
            ];
        } else {
            summaryLines = [
                `Bandymų skaičius: ${attempts}`,
                `Geriausias rezultatas: ${best.score}/${best.total} (${best.percent}%)`,
                `Paskutinis rezultatas: ${last.score}/${last.total} (${last.percent}%)`,
                `Pokytis nuo pirmo bandymo: ${improvement >= 0 ? '+' : ''}${improvement}%`
            ];
            summaryCards = [
                { label: 'Bandymų skaičius', value: `${attempts}`, tone: { fill: palette.soft, stroke: parseInt(palette.accent.replace('#', '0x')), valueColor: palette.tint, labelColor: palette.accent } },
                { label: 'Geriausias rezultatas', value: `${best.score}/${best.total} • ${best.percent}%`, tone: strongTone(palette.accent) },
                { label: 'Paskutinis rezultatas', value: `${last.score}/${last.total} • ${last.percent}%`, tone: { fill: 0xEFF6FF, stroke: 0x93C5FD, valueColor: '#1D4ED8', labelColor: '#1E3A8A' } },
                { label: 'Pokytis', value: `${improvement >= 0 ? '+' : ''}${improvement}%`, tone: metricTone(improvement) }
            ];
        }

        const recentHistory = [...history].reverse().slice(0, 5);
        const historyItems  = recentHistory.map(h => {
            const value = displayType === 'score'
                ? `Balas ${h.score} / ${h.total}`
                : `${h.score}/${h.total} • ${h.percent}%`;
            const delta = displayType === 'score'
                ? h.score - first.score
                : h.percent - first.percent;
            return {
                date: formatDate(h.date),
                value,
                change: `${delta >= 0 ? '+' : ''}${delta}${displayType === 'score' ? ' bal.' : '%'}`,
                tone: metricTone(delta)
            };
        });
        const historyLines  = historyItems.map(item => `${item.date} · ${item.value} · ${item.change}`);

        return { title, palette, hasProgress: true, summaryLines, summaryCards, historyLines, historyItems, detailLines: [] };
    },

    reset(gameKey) {
        const data = load();
        delete data[gameKey];
        store(data);
    },

    resetAll() {
        store({});
    }
};

export { Progress };
