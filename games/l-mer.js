import { BioPhaser } from '../core/bio-phaser.js';
import { Progress } from '../core/progress.js';

// Motyvo paieškos žaidimo modulis.
// Jis padalytas į kelias scenas: įvadą, paaiškinimą,
// nustatymus, užduoties atlikimą ir rezultatų peržiūrą.
const config = await BioPhaser.Utils.ConfigLoader.load('config/l-mer.json');
config.width = 1400;
config.height = 900;

const UI = { W: 1400, H: 900, CX: 700, CY: 450 };
const FONT = BioPhaser.Theme.font;
const THEME = BioPhaser.Theme.colors;

const COLORS = {
    text: THEME.text,
    muted: THEME.muted,
    panel: THEME.panel,
    panelSoft: 0xF8FAFC,
    border: THEME.panelStroke,
    green: THEME.primary,
    greenDark: THEME.primaryHover,
    blue: THEME.info,
    violet: '#8B5CF6',
    orange: THEME.warning,
    amber: THEME.warning,
    teal: '#14B8A6',
    danger: THEME.danger
};

const BASE_COLORS = {
    A: BioPhaser.Theme.baseColors.A,
    T: BioPhaser.Theme.baseColors.T,
    G: BioPhaser.Theme.baseColors.G,
    C: BioPhaser.Theme.baseColors.C,
    '-': BioPhaser.Theme.baseColors.gap || '#94A3B8'
};


const ACCENT_SEQUENCE = [COLORS.green, COLORS.blue, COLORS.violet, COLORS.orange, COLORS.teal];

function toHex(color) {
    if (typeof color === 'number') return color;
    return parseInt(color.replace('#', '0x'), 16);
}

// Sugeneruoja naują užduotį ir iš karto apskaičiuoja optimalų sprendimą.
// Tai leidžia objektyviai palyginti vartotojo rezultatą su geriausiu galimu atveju.
function generateMotifTask({ l, sequenceLength, sequenceCount }) {
    const maxAttempts = config.generation?.maxAttempts || 300;
    const minRatio = config.generation?.minOptimalScoreRatio || 0.65;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const sequences = BioPhaser.Gameplay.MotifSearch.generateRandomSequences(sequenceCount, sequenceLength, config.alphabet || ['A', 'T', 'G', 'C']);
        const optimal = BioPhaser.Gameplay.MotifSearch.findOptimalMotif(sequences, l);
        const maxPossible = l * sequenceCount;

        if (optimal && optimal.score >= Math.ceil(maxPossible * minRatio)) {
            return {
                id: `generated-${Date.now()}-${attempt}`,
                title: 'Sugeneruota užduotis',
                l,
                sequenceLength,
                sequenceCount,
                sequences,
                targetScore: optimal.score,
                optimalScore: optimal.score,
                optimalConsensus: optimal.consensus,
                optimalSelection: optimal.selected,
                generated: true,
                hint: `Pabandyk pasiekti maksimalų galimą svorį: ${optimal.score}.`
            };
        }
    }

    const sequences = BioPhaser.Gameplay.MotifSearch.generateRandomSequences(sequenceCount, sequenceLength, config.alphabet || ['A', 'T', 'G', 'C']);
    const optimal = BioPhaser.Gameplay.MotifSearch.findOptimalMotif(sequences, l);
    return {
        id: `generated-fallback-${Date.now()}`,
        title: 'Sugeneruota užduotis',
        l,
        sequenceLength,
        sequenceCount,
        sequences,
        targetScore: optimal?.score || 0,
        optimalScore: optimal?.score || 0,
        optimalConsensus: optimal?.consensus || '',
        optimalSelection: optimal?.selected || [],
        generated: true,
        hint: `Pabandyk pasiekti maksimalų galimą svorį: ${optimal?.score || 0}.`
    };
}

function getButtonStyle(kind, overrides = {}) {
    const styles = {
        primary: {
            fontSize: '20px',
            fontFamily: FONT,
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: THEME.primary,
            hoverBackgroundColor: THEME.primaryHover,
            padding: { left: 28, right: 28, top: 11, bottom: 11 }
        },
        secondary: {
            fontSize: '16px',
            fontFamily: FONT,
            fontStyle: 'bold',
            color: THEME.text,
            backgroundColor: '#F1F5F9',
            hoverBackgroundColor: '#E2E8F0',
            padding: { left: 18, right: 18, top: 9, bottom: 9 }
        },
        utility: {
            fontSize: '14px',
            fontFamily: FONT,
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: THEME.info,
            hoverBackgroundColor: '#0EA5E9',
            padding: { left: 12, right: 12, top: 7, bottom: 7 }
        }
    };
    return { ...styles[kind], ...overrides };
}

function attachButtonHover(btn, style) {
    btn.onHover(
        () => btn.setStyle({ backgroundColor: style.hoverBackgroundColor }),
        () => btn.setStyle({ backgroundColor: style.backgroundColor })
    );
}

// Bendri UI helperiai naudojami tam, kad visos šio žaidimo scenos
// išlaikytų vienodą vizualinę struktūrą ir mažiau dubliuotų kodą.
function addCard(scene, x, y, w, h, {
    fill = THEME.panel,
    stroke = THEME.panelStroke,
    alpha = 0.96,
    shadow = true,
    layer = null
} = {}) {
    const targetLayer = layer ?? scene.layers.ui;
    const group = scene.add.container(x, y);
    targetLayer.add(group);

    if (shadow) {
        const sh = scene.add.rectangle(4, 6, w, h, 0x000000, 0.05).setOrigin(0.5);
        group.add(sh);
    }

    const bg = BioPhaser.UI.Helpers.createPanel(scene, {
        x: 0,
        y: 0,
        width: w,
        height: h,
        fill,
        alpha,
        stroke,
        strokeWidth: 1.4,
        container: group
    });

    return { group, bg };
}

function addSectionTitle(scene, x, y, title, subtitle, width = 760) {
    const t = scene.add.text(x, y, title, {
        fontFamily: FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: THEME.text
    }).setOrigin(0, 0);
    scene.layers.ui.add(t);

    if (subtitle) {
        const s = scene.add.text(x, y + 44, subtitle, {
            fontFamily: FONT,
            fontSize: '16px',
            color: THEME.muted,
            wordWrap: { width }
        }).setOrigin(0, 0);
        scene.layers.ui.add(s);
    }
}


function addTagPill(scene, x, y, w, h, text, fill, textColor = COLORS.text, stroke = COLORS.border) {
    const bg = scene.add.rectangle(x, y, w, h, fill, 1).setStrokeStyle(1, stroke);
    const label = scene.add.text(x, y, text, {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        color: textColor
    }).setOrigin(0.5);
    scene.layers.ui.add(bg);
    scene.layers.ui.add(label);
}

function addStatusPill(scene, leftX, y, text, accentColor) {
    const label = scene.add.text(leftX + 14, y, text, {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        color: accentColor
    }).setOrigin(0, 0.5);
    const pillW = (label.width || text.length * 9) + 28;
    const pillCX = leftX + pillW / 2;
    const hexColor = toHex(accentColor);
    const pill = scene.add.rectangle(pillCX, y, pillW, 28, hexColor, 0.1).setStrokeStyle(1.2, hexColor);
    scene.layers.ui.add(pill);
    scene.layers.ui.add(label);
    return pillW;
}


class BaseScene extends BioPhaser.BioScene {
    constructor(key) {
        super(key, config);
    }

    preload() {
        this.load.image('dna', 'assets/dna.png');
        this.load.image('particlesDecor', 'assets/particles.png');
        BioPhaser.Utils.AssetLoader.preloadFromConfig?.(this, config);
    }

    createBase({ showMenuButton = true } = {}) {
        this.createLayers();
        this.layers.bg?.setDepth?.(-100);
        this.layers.world?.setDepth?.(0);
        this.layers.uiPersistent?.setDepth?.(100);
        this.layers.ui?.setDepth?.(101);
        this.layers.modal?.setDepth?.(1000);
        BioPhaser.UI.Helpers.createStandardBackground(this);
        if (showMenuButton) {
            BioPhaser.UI.Helpers.addMenuButton(this);
        }
    }

    renderHeader(title, subtitle) {
        addSectionTitle(this, 170, 64, title, subtitle, 840);
    }
}

// Įvadinė scena trumpai parodo žaidimo idėją,
// prieš vartotojui pereinant prie teorinio paaiškinimo.
class MotifStartScene extends BaseScene {
    constructor() { super('KmerStart'); }

    create() {
        this.createBase();

        const leftX = 210;
        const titleY = 170;
        const subtitleY = 435;
        const chipsY = 530;
        const buttonY = 640;
        const previewX = 1040;
        const previewY = 450;

        this.layers.ui.add(this.add.circle(100, 140, 100, toHex(THEME.warning), 0.04));
        this.layers.ui.add(this.add.circle(1110, 730, 140, toHex(THEME.primary), 0.035));
        this.layers.ui.add(this.add.circle(1030, 165, 75, toHex(THEME.info), 0.03));

        this.layers.ui.add(this.add.text(leftX, titleY + 110, 'MOTYVO PAIEŠKA', {
            fontFamily: FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            color: THEME.primary,
            letterSpacing: 2
        }).setOrigin(0, 0.5));

        this.layers.ui.add(this.add.text(leftX, titleY + 150, 'Motyvo paieška', {
            fontFamily: FONT,
            fontSize: '58px',
            fontStyle: 'bold',
            color: THEME.text,
            wordWrap: { width: 500 },
            lineSpacing: 8
        }).setOrigin(0, 0));

        this.layers.ui.add(this.add.text(leftX, subtitleY, 'Rask l-merų rinkinį, kuris maksimaliai padidina konsensuso svorį.', {
            fontFamily: FONT,
            fontSize: '18px',
            color: THEME.muted,
            wordWrap: { width: 470 },
            lineSpacing: 7
        }).setOrigin(0, 0));

        const chips = [
            { label: 'Sekos', color: THEME.primary, width: 112 },
            { label: 'l-merai', color: THEME.info, width: 120 },
            { label: 'Konsensusas', color: COLORS.violet, width: 150, fontSize: '13px' },
            { label: 'Svoris', color: THEME.warning, width: 112 }
        ];
        let chipCursorX = leftX;
        chips.forEach((chip) => {
            const chipW = chip.width;
            const chipX = chipCursorX + chipW / 2;
            const bg = this.add.rectangle(chipX, chipsY, chipW, 34, 0xF8FAFC, 1);
            bg.setStrokeStyle(1, THEME.panelStroke);
            this.layers.ui.add(bg);
            const leftInset = chipX - chipW / 2;
            const dot = this.add.circle(leftInset + 18, chipsY, 5, toHex(chip.color), 1);
            const txt = this.add.text(leftInset + 29, chipsY, chip.label, {
                fontSize: chip.fontSize || '14px', color: THEME.text, fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.layers.ui.add(dot);
            this.layers.ui.add(txt);
            chipCursorX += chipW + 18;
        });

        const primaryStyle = getButtonStyle('primary', { fontSize: '22px', padding: { left: 52, right: 52, top: 18, bottom: 18 } });
        const startBtn = this.addComponent(
            new BioPhaser.UI.Button(this, 340, buttonY, 'Pradėti →', {
                ...primaryStyle, container: this.layers.ui
            })
        );
        startBtn.onClick(() => this.scene.start('KmerExplain'));
        attachButtonHover(startBtn, primaryStyle);
        startBtn.create();

        // Preview card
        const cardBg = this.add.rectangle(previewX, previewY, 410, 390, THEME.panel, 0.97);
        cardBg.setStrokeStyle(2, THEME.panelStroke);
        this.layers.ui.add(cardBg);

        const stripY = previewY - 178;
        this.layers.ui.add(
            this.add.rectangle(previewX, stripY, 410, 34, toHex(THEME.primary), 0.13)
        );
        this.layers.ui.add(this.add.text(previewX, stripY, 'Motyvo paieškos peržiūra', {
            fontFamily: FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            color: THEME.primary
        }).setOrigin(0.5));

        this.layers.ui.add(this.add.text(previewX - 178, previewY - 138, 'CTCATCA, l = 5', {
            fontFamily: FONT,
            fontSize: '18px',
            fontStyle: 'bold',
            color: COLORS.text
        }).setOrigin(0, 0.5));

        ['CTCAT', 'TCATC', 'CATCA'].forEach((line, index) => {
            const y = previewY - 60 + index * 72;
            const row = this.add.rectangle(previewX, y, 320, 54, 0xF8FAFC, 1).setStrokeStyle(1.2, THEME.panelStroke);
            const stripe = this.add.rectangle(previewX - 154, y, 7, 44, [0x10B981, 0x3B82F6, 0x8B5CF6][index], 1);
            const text = this.add.text(previewX - 136, y, line, {
                fontFamily: 'monospace',
                fontSize: '26px',
                fontStyle: 'bold',
                color: COLORS.text
            }).setOrigin(0, 0.5);
            this.layers.ui.add(row);
            this.layers.ui.add(stripe);
            this.layers.ui.add(text);
        });
    }
}

class MotifExplainScene extends BaseScene {
    constructor() { super('KmerExplain'); }

    create() {
        this.createBase();

        this.layers.ui.add(this.add.text(UI.CX, 100, 'Kaip veikia motyvo paieška?', {
            fontFamily: FONT,
            fontSize: '38px',
            fontStyle: 'bold',
            color: COLORS.text
        }).setOrigin(0.5));
        const { group } = addCard(this, UI.CX, 455, 1050, 620, { fill: THEME.panel, stroke: THEME.panelStroke, shadow: true });

        const cards = [
            { title: 'Kas yra l-meras?', body: 'l-meras – tai l ilgio sekos fragmentas.', accent: COLORS.green },
            { title: 'Kaip jį gauname?', body: 'Iš kiekvienos sekos galima išrinkti visus galimus l-merus.', accent: COLORS.blue },
            { title: 'Ką pasirenkame?', body: 'Iš kiekvienos sekos pasirenkamas vienas l-meras.', accent: COLORS.violet },
            { title: 'Kas gaunasi?', body: 'Pasirinkti l-merai sudaro stačiakampį.', accent: COLORS.orange },
            { title: 'Kaip vertiname?', body: 'Konsensusas gaunamas pagal dažniausias raides stulpeliuose, o svoris – tai jų suma.', accent: COLORS.teal }
        ];
        const stepColors = [
            toHex(COLORS.green), toHex(COLORS.blue), toHex(COLORS.violet),
            toHex(COLORS.orange), toHex(COLORS.teal)
        ];

        cards.forEach((card, index) => {
            const x = index < 3 ? -300 + index * 310 : -145 + (index - 3) * 310;
            const y = index < 3 ? -120 : 88;
            const cell = this.add.container(x, y);
            const bg = this.add.rectangle(0, 0, 280, 145, THEME.panel, 1).setStrokeStyle(1.4, THEME.panelStroke);
            const accentBar = this.add.rectangle(-138, 0, 6, 122, stepColors[index], 0.9);
            const numCircle = this.add.circle(-138, -52, 13, stepColors[index], 1);
            const numText = this.add.text(-138, -52, `${index + 1}`, {
                fontFamily: FONT,
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#ffffff'
            }).setOrigin(0.5);
            const title = this.add.text(-116, -44, card.title, {
                fontFamily: FONT,
                fontSize: '17px',
                fontStyle: 'bold',
                color: THEME.text,
                wordWrap: { width: 220 }
            }).setOrigin(0, 0.5);
            const body = this.add.text(-116, -4, card.body, {
                fontFamily: FONT,
                fontSize: '14px',
                color: '#374151',
                wordWrap: { width: 220 },
                lineSpacing: 5
            }).setOrigin(0, 0);
            cell.add([bg, accentBar, numCircle, numText, title, body]);
            group.add(cell);
        });

        const sample = this.add.container(0, 235);
        const sampleBg = this.add.rectangle(0, 0, 720, 60, 0xEFF6FF, 1).setStrokeStyle(1.2, THEME.panelStroke);
        const sampleText = this.add.text(0, 0, 'Pavyzdys: CTCATCA, l = 5 → CTCAT, TCATC, CATCA', {
            fontFamily: FONT,
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#4338CA'
        }).setOrigin(0.5);
        sample.add([sampleBg, sampleText]);
        group.add(sample);

        const backStyle = getButtonStyle('secondary');
        const backBtnEl = this.addComponent(
            new BioPhaser.UI.Button(this, 220, 810, '← Atgal', { ...backStyle, container: this.layers.ui })
        );
        backBtnEl.onClick(() => this.scene.start('KmerStart'));
        attachButtonHover(backBtnEl, backStyle);
        backBtnEl.create();

        const nextStyle = getButtonStyle('primary', { fontSize: '18px' });
        const nextBtnEl = this.addComponent(
            new BioPhaser.UI.Button(this, UI.W - 220, 810, 'Toliau →', { ...nextStyle, container: this.layers.ui })
        );
        nextBtnEl.onClick(() => this.scene.start('KmerSetup'));
        attachButtonHover(nextBtnEl, nextStyle);
        nextBtnEl.create();
    }
}

// Nustatymų scena leidžia valdyti sugeneruojamos užduoties sudėtingumą
// per l reikšmę, sekų ilgį ir sekų kiekį.
class MotifSetupScene extends BaseScene {
    constructor() {
        super('KmerSetup');
        this.selectedL = null;
        this.selectedSequenceLength = null;
        this.selectedSequenceCount = null;
    }

    init(data) {
        super.init(data);
        this.selectedL = data?.selectedL ?? null;
        this.selectedSequenceLength = data?.selectedSequenceLength ?? null;
        this.selectedSequenceCount = data?.selectedSequenceCount ?? null;
    }

    create() {
        this.createBase();

        const panelX = 700, panelY = 455, panelW = 1040, panelH = 560;
        const panelTop = panelY - panelH / 2;

        addSectionTitle(this, 190, 78, 'Pasirink analizės nustatymus', 'Pasirink l reikšmę, sekų ilgį ir sekų kiekį.', 840);
        addCard(this, panelX, panelY, panelW, panelH, { fill: 0xFFFFFF, stroke: COLORS.border, shadow: true });

        this.renderSetupSection('l reikšmė', 233, 303, (config.lOptions || []).map((value) => ({
            key: value,
            title: `l = ${value}`,
            subtitle: `${value} nukleotidų fragmentai`,
            accent: toHex(COLORS.blue),
            softFill: 0xEFF6FF
        })), this.selectedL, (value) => this.scene.start('KmerSetup', {
            selectedL: value,
            selectedSequenceLength: this.selectedSequenceLength,
            selectedSequenceCount: this.selectedSequenceCount
        }));

        this.renderSetupSection('Sekos ilgis', 385, 455, (config.sequenceLengthOptions || []).map((item, index) => ({
            key: item.value,
            title: item.label,
            subtitle: `${item.value} nukleotidai`,
            accent: [toHex(COLORS.violet), toHex(COLORS.teal), toHex(COLORS.orange)][index],
            softFill: [0xF5F3FF, 0xF0FDFA, 0xFFF7ED][index],
            disabled: this.selectedL !== null && item.value < this.selectedL
        })), this.selectedSequenceLength, (value) => this.scene.start('KmerSetup', {
            selectedL: this.selectedL,
            selectedSequenceLength: value,
            selectedSequenceCount: this.selectedSequenceCount
        }));

        this.renderSetupSection('Sekų kiekis', 537, 607, (config.sequenceCountOptions || []).map((item, index) => ({
            key: item.value,
            title: item.label,
            subtitle: ['Lengvesnė paieška', 'Daugiau palyginimo'][index],
            accent: [toHex(COLORS.green), toHex(COLORS.orange)][index],
            softFill: [0xECFDF5, 0xFFF7ED][index]
        })), this.selectedSequenceCount, (value) => this.scene.start('KmerSetup', {
            selectedL: this.selectedL,
            selectedSequenceLength: this.selectedSequenceLength,
            selectedSequenceCount: value
        }), true);

        const invalidLength = this.selectedL !== null && this.selectedSequenceLength !== null && this.selectedSequenceLength < this.selectedL;
        if (invalidLength) {
            this.layers.ui.add(this.add.text(UI.CX, 660, 'Sekos ilgis negali būti mažesnis už pasirinktą l reikšmę.', {
                fontFamily: FONT,
                fontSize: '14px',
                color: '#9A3412'
            }).setOrigin(0.5));
        }

        const ready = !!this.selectedL && !!this.selectedSequenceLength && !!this.selectedSequenceCount && !invalidLength;

        const summaryText = ready
            ? `Bus sugeneruotos ${this.selectedSequenceCount} sekos po ${this.selectedSequenceLength} nukleotidų, ieškant l = ${this.selectedL} motyvo.`
            : 'Pasirink nustatymus — sistema sugeneruos sekas ir apskaičiuos maksimalų galimą svorį.';
        this.layers.ui.add(this.add.text(UI.CX, panelTop + panelH - 42, summaryText, {
            fontFamily: FONT,
            fontSize: '13px',
            color: THEME.muted,
            align: 'center',
            wordWrap: { width: 820 }
        }).setOrigin(0.5));

        const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 255, 790, '← Atgal', { variant: 'secondary' });
        backBtn.onClick(() => this.scene.start('KmerExplain'));

        let ctaText;
        if (!this.selectedL) ctaText = 'Pasirink l reikšmę';
        else if (!this.selectedSequenceLength) ctaText = 'Pasirink sekos ilgį';
        else if (!this.selectedSequenceCount) ctaText = 'Pasirink sekų kiekį';
        else ctaText = 'Pradėti analizę →';

        const startBtn = BioPhaser.UI.Helpers.addModernButton(this, 1120, 790, ctaText, {
            variant: 'primary',
            disabled: !ready
        });
        if (!ready) startBtn.disable();
        startBtn.onClick(() => {
            const task = generateMotifTask({
                l: this.selectedL,
                sequenceLength: this.selectedSequenceLength,
                sequenceCount: this.selectedSequenceCount
            });
            this.scene.start('KmerTask', { task });
        });
    }

    renderSetupSection(label, labelY, cardY, options, selectedKey, onSelect, twoCards = false) {
        this.layers.ui.add(this.add.text(200, labelY, label, {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: COLORS.text
        }).setOrigin(0, 0.5));

        const positions = twoCards ? [560, 840] : [390, 700, 1010];
        const cardW = twoCards ? 245 : 245;
        const cardH = 82;

        options.forEach((option, index) => {
            const cx = positions[index];
            const isSelected = option.key === selectedKey;
            const isDisabled = !!option.disabled;
            const accentNum = option.accent;
            const softFill = option.softFill ?? 0xF0F9FF;
            const fill = isSelected ? softFill : 0xFFFFFF;
            const strokeColor = isSelected ? accentNum : THEME.panelStroke;
            const strokeW = isSelected ? 2.5 : 1.2;

            const bg = this.add.rectangle(cx, cardY, cardW, cardH, fill, isDisabled ? 0.45 : 1)
                .setStrokeStyle(strokeW, strokeColor);
            if (!isDisabled) {
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover', () => bg.setFillStyle(isSelected ? softFill : 0xF8FAFC, 1));
                bg.on('pointerout', () => bg.setFillStyle(fill, 1));
                bg.on('pointerdown', () => onSelect(option.key));
            }
            this.layers.ui.add(bg);

            const barW = isSelected ? 7 : 4;
            this.layers.ui.add(
                this.add.rectangle(cx - cardW / 2 + barW / 2, cardY, barW, cardH - 14, accentNum, isSelected ? 1 : 0.75)
            );

            const textX = cx - cardW / 2 + barW + 14;
            const titleColor = isDisabled ? '#9CA3AF' : COLORS.text;
            const subtitleColor = isDisabled ? '#9CA3AF' : THEME.muted;
            const subtitleW = cardW - barW - (isSelected ? 52 : 28);

            this.layers.ui.add(this.add.text(textX, cardY - 13, option.title, {
                fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: titleColor
            }).setOrigin(0, 0.5));

            this.layers.ui.add(this.add.text(textX, cardY + 13, option.subtitle, {
                fontFamily: FONT, fontSize: '12px', color: subtitleColor,
                wordWrap: { width: subtitleW }
            }).setOrigin(0, 0.5));

            if (isSelected) {
                const checkX = cx + cardW / 2 - 20;
                this.layers.ui.add(this.add.circle(checkX, cardY, 12, accentNum, 1));
                this.layers.ui.add(this.add.text(checkX, cardY, '✓', {
                    fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffffff'
                }).setOrigin(0.5));
            }
        });
    }
}

class MotifTaskScene extends BaseScene {
    constructor() {
        super('KmerTask');
        this.task = null;
        this.stage = 'collect';
        this.collectIndex = 0;
        this.collectedLmers = [];
        this.markedStarts = [];
        this.selectionState = [];
        this.solved = false;
        this.consensusData = null;
        this.sequenceTiles = [];
        this.collectFeedbackText = null;
        this.collectHintText = null;
    }

    init(data) {
        super.init(data);
        this.task = data?.task || config.exampleTask || null;
        this.stage = data?.stage || 'collect';
        this.collectIndex = data?.collectIndex || 0;
        this.collectedLmers = data?.collectedLmers || [];
        this.markedStarts = data?.markedStarts || [];
        this.selectionState = data?.selectionState || [];
        this.solved = !!data?.solved;
    }

    create() {
        this.createBase({ showMenuButton: false });
        if (!this.task) {
            this.renderHeader('Užduotis nerasta', 'Nepavyko paruošti analizės užduoties.');
            return;
        }
        this.ensureState();
        this.renderStage();
    }

    // Paruošiamos duomenų struktūros kiekvienai sekai,
    // kad tarp scenos perkrovimų būtų išlaikyta vartotojo pažanga.
    ensureState() {
        const seqCount = this.task.sequences.length;
        while (this.collectedLmers.length < seqCount) this.collectedLmers.push([]);
        while (this.markedStarts.length < seqCount) this.markedStarts.push([]);
        while (this.selectionState.length < seqCount) this.selectionState.push(null);
    }

    restartSelf(extra = {}) {
        this.scene.start('KmerTask', {
            task: this.task,
            stage: this.stage,
            collectIndex: this.collectIndex,
            collectedLmers: this.collectedLmers,
            markedStarts: this.markedStarts,
            selectionState: this.selectionState,
            solved: this.solved,
            ...extra
        });
    }

    renderStage() {
        if (this.stage === 'collect') this.renderCollectStage();
        else if (this.stage === 'choose') this.renderChooseStage();
        else this.renderEvaluateStage();
    }

    // Pirmame etape vartotojas pažymi visus galimus l-merus.
    // Taip prieš vertinimą įtvirtinamas pats motyvo paieškos principas.
    renderCollectStage() {
        const l = this.task.l;
        const sequence = this.task.sequences[this.collectIndex];
        const lmers = BioPhaser.Gameplay.MotifSearch.getLmers(sequence, l);
        const picked = this.markedStarts[this.collectIndex] || [];

        const leftX = 470, leftY = 450, leftW = 760, leftH = 560;
        const rightX = 1085, rightY = 450, rightW = 340, rightH = 560;
        const footerY = 760;
        const chipY = 146;

        this.renderHeader('Etapas 1 / 3 · Išrink visus l-merus');
        const pill1W = addStatusPill(this, 170, chipY, `Seka ${this.collectIndex + 1} / ${this.task.sequences.length}`, THEME.info);
        addStatusPill(this, 170 + pill1W + 8, chipY, `l = ${l}`, THEME.primary);

        addCard(this, leftX, leftY, leftW, leftH, { fill: 0xFFFFFF, stroke: COLORS.border, shadow: true });
        addCard(this, rightX, rightY, rightW, rightH, { fill: 0xFFFFFF, stroke: COLORS.border, shadow: true });

        const leftEdge = leftX - leftW / 2;
        const leftTop = leftY - leftH / 2;

        const infoX = leftX;
        const infoY = leftTop + 56;
        const infoW = leftW - 56;
        const infoH = 78;
        const infoCard = addCard(this, infoX, infoY, infoW, infoH, { fill: 0xF0FDF4, stroke: COLORS.border, shadow: false });
        infoCard.group.add(this.add.text(-infoW / 2 + 18, -13, `${this.task.title} · l = ${l}`, {
            fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: COLORS.green
        }).setOrigin(0, 0.5));
        infoCard.group.add(this.add.text(-infoW / 2 + 18, 13, 'Spausk visas galimas l-mero pradžias.', {
            fontFamily: FONT, fontSize: '14px', color: COLORS.muted
        }).setOrigin(0, 0.5));

        const sequenceLabelY = leftTop + 155;
        this.layers.ui.add(this.add.text(leftEdge + 56, sequenceLabelY, 'Seka', {
            fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: COLORS.text
        }).setOrigin(0, 0.5));

        const lettersY = leftTop + 235;
        const { progressY, feedbackY } = this.renderCollectSequence(
            sequence, picked, l, leftX, leftW, lettersY, leftEdge
        );

        addTagPill(this, leftX - 230, progressY, 110, 30, `l = ${l}`, 0xDBEAFE, COLORS.blue, 0xBFDBFE);
        addTagPill(this, leftX - 70, progressY, 168, 30, `Išrinkta: ${picked.length} / ${lmers.length}`, 0xECFDF5, COLORS.green, 0xBBF7D0);

        this.collectFeedbackText = this.add.text(leftEdge + 56, feedbackY, '', {
            fontFamily: FONT, fontSize: '14px', color: '#9A3412',
            wordWrap: { width: leftW - 112 }
        }).setOrigin(0, 0.5);
        this.layers.ui.add(this.collectFeedbackText);

        const rightTop = rightY - rightH / 2;
        this.layers.ui.add(this.add.text(rightX, rightTop + 44, 'Išrinkti l-merai', {
            fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: COLORS.text
        }).setOrigin(0.5));
        this.layers.ui.add(this.add.rectangle(rightX, rightTop + 64, rightW - 2, 1, COLORS.border, 1));

        const accentColor = toHex(ACCENT_SEQUENCE[this.collectIndex % ACCENT_SEQUENCE.length]);
        const pickedItems = this.collectedLmers[this.collectIndex] || [];
        if (!pickedItems.length) {
            this.layers.ui.add(this.add.text(rightX, rightTop + 120, 'Dar nėra išrinktų\nfragmentų.', {
                fontFamily: FONT, fontSize: '15px', color: COLORS.muted,
                align: 'center', wordWrap: { width: 220 }
            }).setOrigin(0.5, 0));
        } else {
            const itemH = 44, itemGap = 10;
            const itemW = rightW - 32;
            pickedItems.forEach((entry, index) => {
                const ry = rightTop + 96 + index * (itemH + itemGap) + itemH / 2;
                const row = addCard(this, rightX, ry, itemW, itemH, { fill: 0xF8FAFC, stroke: COLORS.border, shadow: false });
                row.group.add(this.add.rectangle(-itemW / 2 + 4, 0, 6, itemH - 16, accentColor, 1));
                row.group.add(this.add.text(-itemW / 2 + 20, -7, entry.value, {
                    fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: COLORS.text
                }).setOrigin(0, 0.5));
                row.group.add(this.add.text(-itemW / 2 + 20, 10, `pos. ${entry.start + 1}`, {
                    fontFamily: FONT, fontSize: '11px', color: COLORS.muted
                }).setOrigin(0, 0.5));
            });
        }

        const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 250, footerY, '← Atgal', { variant: 'secondary' });
        backBtn.onClick(() => this.scene.start('KmerSetup', {
            selectedL: this.task.l,
            selectedSequenceLength: this.task.sequenceLength,
            selectedSequenceCount: this.task.sequenceCount
        }));

        const nextEnabled = picked.length === lmers.length;
        const nextLabel = this.collectIndex < this.task.sequences.length - 1 ? 'Kita seka →' : 'Sudaryti rinkinį →';
        const nextBtn = BioPhaser.UI.Helpers.addModernButton(this, 1110, footerY, nextLabel, {
            variant: 'primary',
            disabled: !nextEnabled
        });
        if (!nextEnabled) nextBtn.disable();
        nextBtn.onClick(() => {
            if (this.collectIndex < this.task.sequences.length - 1) {
                this.restartSelf({ collectIndex: this.collectIndex + 1, stage: 'collect' });
            } else {
                this.restartSelf({ stage: 'choose' });
            }
        });
    }

    renderCollectSequence(sequence, picked, l, _leftX, leftW, lettersY, leftEdge) {
        this.sequenceTiles = [];

        let baseSize = 64, gap = 10;
        const maxWidth = leftW - 110;
        const totalUnscaled = sequence.length * baseSize + (sequence.length - 1) * gap;
        if (totalUnscaled > maxWidth) {
            const scale = maxWidth / totalUnscaled;
            baseSize = Math.floor(baseSize * scale);
            gap = Math.floor(gap * scale);
        }
        baseSize = Math.max(baseSize, 52);
        gap = Math.max(gap, 6);

        const tileW = baseSize;
        const tileH = baseSize;
        const fontSize = Math.max(18, Math.floor(tileW * 0.45)) + 'px';
        const startX = leftEdge + 55 + tileW / 2;
        const pickedStarts = new Set(picked);

        for (let i = 0; i < sequence.length; i++) {
            const x = startX + i * (tileW + gap);
            const letter = sequence[i];
            const color = toHex(BASE_COLORS[letter]);
            const bg = this.add.rectangle(x, lettersY, tileW, tileH, color, 1).setStrokeStyle(2, 0xFFFFFF);
            const txt = this.add.text(x, lettersY, letter, {
                fontFamily: 'monospace', fontSize, fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            const markerR = Math.max(6, Math.floor(tileW * 0.12));
            const marker = this.add.circle(x + tileW / 2 - markerR - 1, lettersY + tileH / 2 - markerR - 1, markerR, 0x10B981, 1)
                .setStrokeStyle(2, 0xFFFFFF).setVisible(false);
            bg.setInteractive({ useHandCursor: true });
            this.layers.ui.add(bg);
            this.layers.ui.add(txt);
            this.layers.ui.add(marker);
            this.sequenceTiles.push({ index: i, bg, text: txt, marker, letter });

            bg.on('pointerover', () => this.updateCollectSequenceStyles(i, sequence, l));
            bg.on('pointerout', () => this.clearCollectSequenceStyles());
            bg.on('pointerdown', () => this.handleCollectClick(i, sequence, l));
        }

        this.applyMarkedCollectStarts(pickedStarts);

        const hintY = lettersY + tileH / 2 + 64;
        const progressY = hintY + 52;
        const feedbackY = progressY + 46;

        this.collectHintText = this.add.text(leftEdge + 55, hintY, 'Užvesk pelę ant raidės, kad pamatytum būsimą l-merą.', {
            fontFamily: FONT, fontSize: '14px', color: COLORS.muted,
            wordWrap: { width: leftW - 110 }
        }).setOrigin(0, 0.5);
        this.layers.ui.add(this.collectHintText);

        return { hintY, progressY, feedbackY };
    }

    applyMarkedCollectStarts(pickedStarts) {
        this.sequenceTiles.forEach(({ index, bg, marker }) => {
            marker.setVisible(pickedStarts.has(index));
            bg.setStrokeStyle(pickedStarts.has(index) ? 4 : 1.5, pickedStarts.has(index) ? 0x10B981 : 0xFFFFFF);
        });
    }

    updateCollectSequenceStyles(start, sequence, l) {
        const pickedStarts = new Set(this.markedStarts[this.collectIndex] || []);
        const valid = start + l <= sequence.length;
        this.sequenceTiles.forEach(({ index, bg, marker }) => {
            const inWindow = valid && index >= start && index < start + l;
            const marked = pickedStarts.has(index);
            bg.setStrokeStyle(inWindow ? 4 : (marked ? 4 : 1.5), inWindow ? 0x0F172A : (marked ? 0x10B981 : 0xFFFFFF));
            marker.setVisible(marked);
        });
        this.collectHintText.setText(valid ? `Būsimas l-meras: ${sequence.slice(start, start + l)}` : 'Šioje vietoje nebeužtenka nukleotidų l-merui.');
    }

    clearCollectSequenceStyles() {
        this.collectHintText.setText('Užvesk pelę ant raidės, kad pamatytum būsimą l-merą.');
        this.applyMarkedCollectStarts(new Set(this.markedStarts[this.collectIndex] || []));
    }

    handleCollectClick(start, sequence, l) {
        const pickedStarts = new Set(this.markedStarts[this.collectIndex] || []);
        const maxStart = sequence.length - l;
        if (start > maxStart) {
            this.collectFeedbackText.setText('Čia l-merui nebeužtenka nukleotidų.');
            return;
        }
        if (pickedStarts.has(start)) {
            this.collectFeedbackText.setText('Ši pradžia jau pažymėta.');
            return;
        }

        const value = sequence.slice(start, start + l);
        this.markedStarts[this.collectIndex].push(start);
        this.collectedLmers[this.collectIndex].push({ start, value });
        this.restartSelf();
    }

    renderChooseStage() {
        this.renderHeader(
            'Etapas 2 / 3 · Sudaryk l-merų rinkinį',
            'Pasirink po vieną l-merą iš kiekvienos sekos.'
        );

        const panelX = 700;
        const panelY = 485;
        const panelW = 1120;
        const panelH = 610;

        const panelLeft = panelX - panelW / 2;
        const panelTop = panelY - panelH / 2;
        const panelRight = panelX + panelW / 2;

        const leftAreaX = panelLeft + 40;
        const leftAreaY = panelTop + 46;
        const leftAreaW = 760;

        const summaryX = panelRight - 170;
        const summaryY = panelY;
        const summaryW = 300;
        const summaryH = 540;

        const bottomY = 835;

        addCard(this, panelX, panelY, panelW, panelH, {
            fill: 0xFFFFFF,
            stroke: COLORS.border,
            shadow: true
        });

        addCard(this, summaryX, summaryY, summaryW, summaryH, {
            fill: 0xF8FAFC,
            stroke: COLORS.border,
            shadow: false
        });

        const cardsPerRow = 3;
        let rowBaseH = 92;
        let rowExtraH = 42;
        let rowGap = 14;
        let lmerCardH = 36;
        const lmerCardW = 124;
        const lmerGapX = 12;
        const lmerGapY = 10;

        let fontSize = this.task.l >= 5 ? 16 : 18;
        let letterSpacing = this.task.l >= 5 ? 15 : 17;

        const initialRowHeights = this.task.sequences.map((_, seqIndex) => {
            const lmers = this.collectedLmers[seqIndex] || [];
            const rowLines = Math.max(1, Math.ceil(lmers.length / cardsPerRow));
            return rowBaseH + Math.max(0, rowLines - 1) * rowExtraH;
        });
        const totalRowsH = initialRowHeights.reduce((a, b) => a + b, 0) + (initialRowHeights.length - 1) * rowGap;
        const compact = totalRowsH > 520;

        if (compact) {
            rowBaseH = 78;
            rowExtraH = 36;
            rowGap = 10;
            lmerCardH = 32;
            fontSize = this.task.l >= 5 ? 14 : 16;
            letterSpacing = this.task.l >= 5 ? 13 : 15;
        }

        let currentY = leftAreaY;

        this.task.sequences.forEach((_, seqIndex) => {
            const accent = toHex(ACCENT_SEQUENCE[seqIndex % ACCENT_SEQUENCE.length]);
            const lmers = this.collectedLmers[seqIndex] || [];
            const rowLines = Math.max(1, Math.ceil(lmers.length / cardsPerRow));
            const rowH = rowBaseH + Math.max(0, rowLines - 1) * rowExtraH;
            const rowY = currentY + rowH / 2;

            const row = addCard(this, leftAreaX + leftAreaW / 2, rowY, leftAreaW, rowH, {
                fill: 0xF8FAFC,
                stroke: COLORS.border,
                shadow: false
            });

            const rowW = leftAreaW;
            row.group.add(this.add.rectangle(-rowW / 2 - 14, 0, 8, rowH - 22, accent, 1));
            row.group.add(this.add.text(-rowW / 2 + 24, -rowH / 2 + 24, `Seka ${seqIndex + 1}:`, {
                fontFamily: FONT,
                fontSize: '16px',
                fontStyle: 'bold',
                color: COLORS.text
            }).setOrigin(0, 0.5));

            const cardsAreaX = -rowW / 2 + 190;
            const cardsTopY = -rowH / 2 + 40;

            lmers.forEach((item, itemIndex) => {
                const col = itemIndex % cardsPerRow;
                const line = Math.floor(itemIndex / cardsPerRow);

                const x = cardsAreaX + col * (lmerCardW + lmerGapX) + lmerCardW / 2;
                const y = cardsTopY + line * (lmerCardH + lmerGapY) + lmerCardH / 2;

                const selected = this.selectionState[seqIndex]?.value === item.value;

                const pill = this.add.rectangle(
                    x,
                    y,
                    lmerCardW,
                    lmerCardH,
                    selected ? 0xECFDF5 : 0xFFFFFF,
                    1
                )
                    .setStrokeStyle(
                        selected ? 2.4 : 1.2,
                        selected ? 0x10B981 : COLORS.border
                    )
                    .setInteractive({ useHandCursor: true });

                row.group.add(pill);

                BioPhaser.UI.Helpers.addColoredSequenceText(this, x - (selected ? 7 : 0), y, item.value, {
                    fontSize,
                    letterSpacing,
                    container: row.group
                });

                if (selected) {
                    const checkX = x + lmerCardW / 2 - 13;
                    const checkY = y;

                    const check = this.add.circle(checkX, checkY, 10, 0x10B981, 1);
                    const mark = this.add.text(checkX, checkY, '✓', {
                        fontFamily: FONT,
                        fontSize: '13px',
                        fontStyle: 'bold',
                        color: '#FFFFFF'
                    }).setOrigin(0.5);

                    row.group.add([check, mark]);
                }

                pill.on('pointerdown', () => {
                    this.selectionState[seqIndex] = item;
                    this.restartSelf();
                });
            });

            currentY += rowH + rowGap;
        });

        this.layers.ui.add(this.add.text(
            summaryX - summaryW / 2 + 26,
            summaryY - summaryH / 2 + 28,
            'Pasirinktas rinkinys',
            {
                fontFamily: FONT,
                fontSize: '18px',
                fontStyle: 'bold',
                color: COLORS.text
            }
        ).setOrigin(0, 0.5));

        const itemW = 205;
        const itemH = 54;
        const itemGap = 14;
        const summaryStartY = summaryY - summaryH / 2 + 86;

        this.selectionState.forEach((item, index) => {
            const y = summaryStartY + itemH / 2 + index * (itemH + itemGap);
            const accent = toHex(ACCENT_SEQUENCE[index % ACCENT_SEQUENCE.length]);

            const entry = addCard(this, summaryX, y, itemW, itemH, {
                fill: 0xFFFFFF,
                stroke: COLORS.border,
                shadow: false
            });

            entry.group.add(this.add.rectangle(-90, 0, 8, 34, accent, 1));

            if (item?.value) {
                BioPhaser.UI.Helpers.addColoredSequenceText(this, 8, 0, item.value, {
                    fontSize: this.task.l >= 5 ? 19 : 21,
                    letterSpacing: this.task.l >= 5 ? 18 : 21,
                    container: entry.group
                });
            } else {
                entry.group.add(this.add.text(-72, 0, '-----', {
                    fontFamily: 'monospace',
                    fontSize: '22px',
                    fontStyle: 'bold',
                    color: COLORS.muted
                }).setOrigin(0, 0.5));
            }
        });

        const allSelected = this.selectionState.every(Boolean);

        const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 170, bottomY, '← Atgal', {
            width: 150,
            height: 48,
            variant: 'secondary'
        });

        backBtn.onClick(() =>
            this.restartSelf({
                stage: 'collect',
                collectIndex: this.task.sequences.length - 1
            })
        );

        const nextBtn = BioPhaser.UI.Helpers.addModernButton(this, UI.W - 190, bottomY, 'Įvertinti →', {
            width: 190,
            height: 48,
            variant: 'primary',
            disabled: !allSelected
        });

        if (!allSelected) nextBtn.disable();

        nextBtn.onClick(() =>
            this.restartSelf({
                stage: 'evaluate',
                solved: false
            })
        );
    }

    renderEvaluateStage() {
        const selectedLmers = this.selectionState.map((item) => item?.value).filter(Boolean);
        const consensusData = BioPhaser.Gameplay.MotifSearch.computeConsensus(selectedLmers);
        this.consensusData = consensusData;
        const currentScore = consensusData.score;
        const optimalScore = this.task.optimalScore;
        const solved = currentScore >= optimalScore;
        const safeScore = Number.isFinite(currentScore) ? currentScore : 0;
        const safeTotal = Number.isFinite(optimalScore) && optimalScore > 0 ? optimalScore : 1;

        Progress.save('lmer', {
            score: safeScore,
            total: safeTotal,
            details: {
                solved: safeScore === safeTotal,
                consensus: consensusData.consensus || '',
                optimalConsensus: this.task?.optimalConsensus || '',
                l: this.task?.l ?? this.l ?? 0,
                sequenceCount: this.task?.sequences?.length || this.sequences?.length || 0,
                sequenceLength: this.task?.sequences?.[0]?.length || this.sequences?.[0]?.length || 0
            }
        });

        this.renderHeader(
            'Etapas 3 / 3 · Įvertink konsensusą',
            solved
                ? 'Tavo rinkinys pasiekė maksimalų galimą svorį.'
                : 'Tavo rinkinys dar nepasiekia maksimalaus svorio.'
        );

        const panelX = 700;
        const panelY = 455;
        const panelW = 1040;
        const panelH = 560;
        const matrixCardX = 420;
        const matrixCardY = 360;
        const matrixCardW = 420;
        const analysisCardX = 1010;
        const analysisCardY = 360;
        const analysisCardW = 360;
        const feedbackX = 700;
        const feedbackY = 665;
        const feedbackW = 720;
        const feedbackH = 84;
        const bottomY = 812;

        addCard(this, panelX, panelY, panelW, panelH, { fill: 0xFFFFFF, stroke: COLORS.border, shadow: true });

        const matrixCardH = Math.max(300, 56 + selectedLmers.length * 52);
        const matrixCard = addCard(this, matrixCardX, matrixCardY, matrixCardW, matrixCardH, {
            fill: 0xF8FAFC, stroke: COLORS.border, shadow: false
        });
        matrixCard.group.add(this.add.text(
            -matrixCardW / 2 + 20, -matrixCardH / 2 + 22,
            'Pasirinktas stačiakampis',
            { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: COLORS.text }
        ).setOrigin(0, 0.5));
        matrixCard.group.add(this.add.rectangle(
            0, -matrixCardH / 2 + 38, matrixCardW - 24, 1, COLORS.border, 0.4
        ));

        const matrixContentTop = -matrixCardH / 2 + 50;
        const matrixContentH = matrixCardH - 50 - 16;
        const totalRowsH = selectedLmers.length * 52;
        const rowStartY = matrixContentTop + Math.max(0, (matrixContentH - totalRowsH) / 2) + 26;
        selectedLmers.forEach((lmer, rowIndex) => {
            const rowY = rowStartY + rowIndex * 52;
            BioPhaser.UI.Helpers.addColoredSequenceText(this, 0, rowY, lmer, {
                fontSize: 26,
                letterSpacing: 42,
                container: matrixCard.group
            });
        });

        const analysisCardH = matrixCardH;
        const stats = addCard(this, analysisCardX, analysisCardY, analysisCardW, analysisCardH, {
            fill: 0xF8FAFC, stroke: COLORS.border, shadow: false
        });
        stats.group.add(this.add.text(
            -analysisCardW / 2 + 20, -analysisCardH / 2 + 22,
            'Analizė',
            { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: COLORS.text }
        ).setOrigin(0, 0.5));
        stats.group.add(this.add.rectangle(
            0, -analysisCardH / 2 + 38, analysisCardW - 24, 1, COLORS.border, 0.4
        ));

        const statDefs = [
            { label: 'Konsensusas', value: consensusData.consensus || '—', color: COLORS.blue, col: 0, row: 0 },
            { label: 'Tavo svoris', value: `${currentScore}`, color: solved ? COLORS.green : COLORS.orange, col: 1, row: 0 },
            { label: 'Maksimalus', value: `${optimalScore}`, color: COLORS.violet, col: 0, row: 1 },
            { label: 'Stulpelių balai', value: consensusData.columnScores.join(' · ') || '—', color: COLORS.text, col: 1, row: 1 }
        ];
        const statBoxW = 148;
        const statBoxH = 88;
        const statColX = [-82, 82];
        const statFirstRowY = -analysisCardH / 2 + 38 + 16 + statBoxH / 2;
        const statRowGap = statBoxH + 12;

        statDefs.forEach((item) => {
            const bx = statColX[item.col];
            const by = statFirstRowY + item.row * statRowGap;
            const box = this.add.rectangle(bx, by, statBoxW, statBoxH, 0xFFFFFF, 1).setStrokeStyle(1, COLORS.border);
            const lbl = this.add.text(bx - statBoxW / 2 + 10, by - 16, item.label, {
                fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: COLORS.muted
            }).setOrigin(0, 0.5);
            const val = this.add.text(bx - statBoxW / 2 + 10, by + 14, item.value, {
                fontFamily: FONT,
                fontSize: item.label === 'Stulpelių balai' ? '14px' : '22px',
                fontStyle: 'bold',
                color: item.color,
                wordWrap: { width: statBoxW - 14 }
            }).setOrigin(0, 0.5);
            stats.group.add([box, lbl, val]);
        });

        const feedback = addCard(this, feedbackX, feedbackY, feedbackW, feedbackH, {
            fill: solved ? 0xECFDF5 : 0xFFF7ED,
            stroke: solved ? 0x10B981 : 0xF97316,
            shadow: false
        });
        const fbColor = solved ? '#047857' : '#9A3412';
        feedback.group.add(this.add.text(
            -feedbackW / 2 + 24, -16,
            solved
                ? 'Puiku! Pasiektas maksimalus konsensuso svoris.'
                : `Dar galima geriau. Tavo svoris: ${currentScore}, maksimalus galimas: ${optimalScore}.`,
            { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: fbColor, wordWrap: { width: feedbackW - 48 } }
        ).setOrigin(0, 0));
        feedback.group.add(this.add.text(
            -feedbackW / 2 + 24, 10,
            solved
                ? 'Tavo pasirinktas rinkinys yra optimalus šiai užduočiai.'
                : 'Grįžk į pasirinkimus ir pabandyk pakeisti vieną l-merą.',
            { fontFamily: FONT, fontSize: '13px', color: fbColor, wordWrap: { width: feedbackW - 48 } }
        ).setOrigin(0, 0));

        if (!solved) {
            const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 430, bottomY, '← Keisti pasirinkimus', {
                width: 270,
                variant: 'secondary'
            });
            backBtn.onClick(() => this.restartSelf({ stage: 'choose' }));

            const newTaskBtn = BioPhaser.UI.Helpers.addModernButton(this, 970, bottomY, 'Nauja užduotis', { variant: 'primary' });
            newTaskBtn.onClick(() => this.scene.start('KmerSetup', {
                selectedL: this.task?.l ?? null,
                selectedSequenceLength: this.task?.sequenceLength ?? null,
                selectedSequenceCount: this.task?.sequenceCount ?? this.task?.sequences?.length ?? null
            }));
        } else {
            const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 430, bottomY, '← Keisti pasirinkimus', {
                width: 270,
                variant: 'secondary'
            });
            backBtn.onClick(() => this.restartSelf({ stage: 'choose' }));

            const resultBtn = BioPhaser.UI.Helpers.addModernButton(this, 760, bottomY, 'Rezultatai →', { variant: 'secondary' });
            resultBtn.onClick(() => this.scene.start('KmerResults', {
                task: this.task,
                solved: true,
                consensusData
            }));

            const newTaskBtn = BioPhaser.UI.Helpers.addModernButton(this, 1090, bottomY, 'Nauja užduotis', { variant: 'primary' });
            newTaskBtn.onClick(() => this.scene.start('KmerSetup', {
                selectedL: this.task?.l ?? null,
                selectedSequenceLength: this.task?.sequenceLength ?? null,
                selectedSequenceCount: this.task?.sequenceCount ?? this.task?.sequences?.length ?? null
            }));
        }
    }
}

class MotifResultsScene extends BaseScene {
    constructor() { super('KmerResults'); }

    init(data) {
        super.init(data);
        this.task = data?.task || config.exampleTask || null;
        this.solved = !!data?.solved;
        this.consensusData = data?.consensusData || { consensus: '', score: 0 };
    }

    create() {
        this.createBase();

        // Rezultatų ekrane rodoma ne tik surinkta reikšmė,
        // bet ir teorinis maksimumas bei gautas konsensusas.
        addCard(this, UI.CX, 430, 900, 540, { fill: 0xFFFFFF, stroke: COLORS.border, shadow: true });
        this.layers.ui.add(this.add.text(UI.CX, 170, 'Rezultatai', {
            fontFamily: FONT,
            fontSize: '38px',
            fontStyle: 'bold',
            color: COLORS.text
        }).setOrigin(0.5));

        const statDefs = [
            { title: 'Pasiektas svoris', value: `${this.consensusData.score}`, accent: COLORS.green, x: 430 },
            { title: 'Maksimalus galimas', value: `${this.task?.optimalScore ?? 0}`, accent: COLORS.violet, x: 700 },
            { title: 'Konsensusas', value: `${this.consensusData.consensus || '—'}`, accent: COLORS.blue, x: 970 }
        ];
        statDefs.forEach((card) => {
            const stat = addCard(this, card.x, 330, 220, 120, { fill: 0xF8FAFC, stroke: COLORS.border, shadow: false });
            stat.group.add(this.add.rectangle(-90, 0, 8, 78, toHex(card.accent), 1));
            stat.group.add(this.add.text(-70, -20, card.title, {
                fontFamily: FONT,
                fontSize: '13px',
                fontStyle: 'bold',
                color: COLORS.muted
            }).setOrigin(0, 0.5));
            stat.group.add(this.add.text(-70, 18, card.value, {
                fontFamily: FONT,
                fontSize: '28px',
                fontStyle: 'bold',
                color: card.accent
            }).setOrigin(0, 0.5));
        });

        this.layers.ui.add(this.add.text(UI.CX, 535, 'Konsensuso svoris parodo, kiek stipriai pasirinkti l-merai sutampa stulpeliuose. Tai svarbus motyvų paieškos principas bioinformatikoje.', {
            fontFamily: FONT,
            fontSize: '16px',
            color: COLORS.muted,
            align: 'center',
            wordWrap: { width: 720 },
            lineSpacing: 5
        }).setOrigin(0.5));

        const menuBtn = BioPhaser.UI.Helpers.addModernButton(this, UI.CX - 150, 760, '← Meniu', { width: 180, height: 48, variant: 'secondary' });
        menuBtn.onClick(() => { window.__bioPhaserNavigate ? window.__bioPhaserNavigate('index.html') : (window.location.href = 'index.html'); });

        const replayBtn = BioPhaser.UI.Helpers.addModernButton(this, UI.CX + 150, 760, 'Nauja užduotis', { width: 220, height: 48, variant: 'primary' });
        replayBtn.onClick(() => this.scene.start('KmerSetup', {
            selectedL: this.task?.l ?? null,
            selectedSequenceLength: this.task?.sequenceLength ?? null,
            selectedSequenceCount: this.task?.sequenceCount ?? this.task?.sequences?.length ?? null
        }));
    }
}

const engine = new BioPhaser.Engine(config);
engine.registerScene(MotifStartScene);
engine.registerScene(MotifExplainScene);
engine.registerScene(MotifSetupScene);
engine.registerScene(MotifTaskScene);
engine.registerScene(MotifResultsScene);
engine.start();

export {
    config,
    generateMotifTask, MotifExplainScene, MotifResultsScene, MotifSetupScene, MotifStartScene, MotifTaskScene
};
