import { BioPhaser } from '../core/bio-phaser.js';
import { Progress } from '../core/progress.js';

// Sekų išlyginimo modulis apjungia vartotojo sąsają ir algoritminę dalį.
// To reikia todėl, kad žaidimas ne tik rodo sekas, bet ir pats apskaičiuoja
// etaloninį išlyginimą bei tikslinį balą.

const config = await BioPhaser.Utils.ConfigLoader.load('config/sequence-alignment.json');


const UI = {
    W: 1400,
    H: config.ui.dimensions.height,
    CX: 700,
    
    headerY: config.ui.layout.headerY,
    contentTop: config.ui.layout.contentTop,
    footerY: config.ui.layout.footerY,
    
    colors: {
        text: config.ui.colors.text,
        muted: config.ui.colors.muted,
        white: parseInt(config.ui.colors.white),
        bg: parseInt(config.ui.colors.bg),
        
        primary: config.ui.colors.primary,
        primaryHover: config.ui.colors.primaryHover,
        info: config.ui.colors.info,
        danger: config.ui.colors.danger,
        warn: config.ui.colors.warn
    }
};

const FONT = BioPhaser.Theme.font;
const THEME = {
    ...BioPhaser.Theme.colors,
    darkText:     '#263238',
    panelSoft:    0xF8FAFC,
    panelBlue:    0xECFDF5,
    panelAlt:     0xFFFFFF,
    panelStrip:   0xF1F5F9,
    infoHover:    '#0EA5E9',
    neutral:      '#F1F5F9',
    neutralHover: '#E2E8F0',
    dnaA: BioPhaser.Theme.baseColors.A,
    dnaT: BioPhaser.Theme.baseColors.T,
    dnaG: BioPhaser.Theme.baseColors.G,
    dnaC: BioPhaser.Theme.baseColors.C,
    gap:  BioPhaser.Theme.baseColors.gap
};

function toHex(color) {
    return parseInt(color.replace('#', '0x'));
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
            backgroundColor: THEME.neutral,
            hoverBackgroundColor: THEME.neutralHover,
            padding: { left: 18, right: 18, top: 9, bottom: 9 }
        },
        utility: {
            fontSize: '14px',
            fontFamily: FONT,
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: THEME.info,
            hoverBackgroundColor: THEME.infoHover,
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


// Įvadinė scena trumpai pristato užduoties esmę prieš pereinant į mokomąją dalį.
class StartScene extends BioPhaser.BioScene {
    constructor() {
        super('Start', config);
    }

    preload() {
        this.load.image('dna', 'assets/dna.png');
        this.load.image('particlesDecor', 'assets/particles.png');
    }

    create() {
        this.createLayers();

        BioPhaser.UI.Helpers.addMenuButton(this);

        BioPhaser.UI.Helpers.createStandardBackground(this);

        this.showTitleScreen();
    }

    showTitleScreen() {
        this.cleanupUI();
        const leftX = 210;
        const previewX = 1040;
        const previewY = 430;

        this.layers.ui.add(this.add.circle(100, 140, 100, toHex(THEME.warning), 0.04));
        this.layers.ui.add(this.add.circle(1110, 730, 140, toHex(THEME.primary), 0.035));
        this.layers.ui.add(this.add.circle(1030, 165, 75, toHex(THEME.info), 0.03));

        this.layers.ui.add(
            this.add.text(leftX, 230, 'SEKŲ IŠLYGINIMAS', {
                fontSize: '13px', fontStyle: 'bold', color: THEME.primary,
                fontFamily: FONT, letterSpacing: 2
            }).setOrigin(0, 0.5)
        );
        this.layers.ui.add(
            this.add.text(leftX, 255, 'Sekų\nišlyginimas', {
                fontSize: '60px', fontStyle: 'bold', color: THEME.text,
                fontFamily: FONT, wordWrap: { width: 500 }, lineSpacing: 4
            }).setOrigin(0, 0)
        );
        this.layers.ui.add(
            this.add.text(leftX, 430, config.meta.description, {
                fontSize: '19px', color: THEME.muted, fontFamily: FONT,
                wordWrap: { width: 470 }, lineSpacing: 8
            }).setOrigin(0, 0)
        );

        const chips = [
            { label: 'Sulygiuok', color: THEME.dnaA },
            { label: 'Įterpk tarpą', color: THEME.dnaT },
            { label: 'Surink taškus', color: THEME.warning }
        ];
        chips.forEach((chip, i) => {
            const chipX = leftX + i * 164;
            const chipY = 545;
            const bg = this.add.rectangle(chipX + 62, chipY, 124, 38, THEME.panelSoft, 1);
            bg.setStrokeStyle(1, THEME.panelStroke);
            this.layers.ui.add(bg);
            const dot = this.add.circle(chipX + 14, chipY, 5, toHex(chip.color), 1);
            const txt = this.add.text(chipX + 26, chipY, chip.label, {
                fontSize: '14px', color: THEME.text, fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.layers.ui.add(dot);
            this.layers.ui.add(txt);
        });

        const primaryStyle = getButtonStyle('primary', { fontSize: '22px', padding: { left: 52, right: 52, top: 18, bottom: 18 } });
        const startBtn = this.addComponent(
            new BioPhaser.UI.Button(this, 340, 650, 'Pradėti', {
                ...primaryStyle, container: this.layers.ui
            })
        );
        startBtn.onClick(() => this.scene.start('Tutorial'));
        attachButtonHover(startBtn, primaryStyle);
        startBtn.create();

        const cardBg = this.add.rectangle(previewX, previewY, 410, 390, THEME.panel, 0.97);
        cardBg.setStrokeStyle(2, THEME.panelStroke);
        this.layers.ui.add(cardBg);

        const stripY = previewY - 182;
        this.layers.ui.add(
            this.add.rectangle(previewX, stripY, 410, 34, toHex(THEME.primary), 0.13)
        );
        this.layers.ui.add(
            this.add.text(previewX, stripY, 'Sekų išlyginimo peržiūra', {
                fontSize: '14px', fontStyle: 'bold', color: THEME.primary, fontFamily: FONT
            }).setOrigin(0.5)
        );

        const previewRows = [
            ['A', 'T', '-', 'G', 'C'],
            ['A', 'T', 'C', 'G', 'C'],
            ['A', '-', 'C', 'G', 'C']
        ];
        const tileSize = 48;
        const tileGap = 6;
        const baseY = previewY - 88;

        previewRows.forEach((row, r) => {
            this.layers.ui.add(
                this.add.text(previewX - 184, baseY + r * 64, `S${r + 1}`, {
                    fontSize: '16px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
                }).setOrigin(0, 0.5)
            );
            row.forEach((base, c) => {
                const x = previewX - 112 + c * (tileSize + tileGap);
                const colors = { A: THEME.dnaA, T: THEME.dnaT, G: THEME.dnaG, C: THEME.dnaC, '-': THEME.gap };
                const rect = this.add.rectangle(x, baseY + r * 64, tileSize, tileSize, toHex(colors[base]), 1);
                rect.setStrokeStyle(base === '-' ? 1 : 2, 0xffffff);
                const txt = this.add.text(x, baseY + r * 64, base, {
                    fontSize: '20px', color: '#ffffff', fontFamily: FONT, fontStyle: 'bold'
                }).setOrigin(0.5);
                this.layers.ui.add(rect);
                this.layers.ui.add(txt);
            });
        });
    }
}


// Mokomoji scena paaiškina pagrindinius veiksmus,
// kuriuos vartotojas atliks konstruodamas išlyginimą.
class TutorialScene extends BioPhaser.BioScene {
    constructor() {
        super('Tutorial', config);
    }
    
    preload() {
        this.load.image('dna', 'assets/dna.png');
        this.load.image('particlesDecor', 'assets/particles.png');
    }
    
    create() {
        this.createLayers();
        BioPhaser.UI.Helpers.addMenuButton(this);

        BioPhaser.UI.Helpers.createStandardBackground(this);

        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);

        this.showTutorial();
    }
    
    showTutorial() {
        const cx = UI.CX;

        this.layers.ui.add(
            this.add.text(cx, 72, config.text.tutorial.title, {
                fontSize: '40px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
            }).setOrigin(0.5)
        );
        this.layers.ui.add(
            this.add.text(cx, 114, 'Keturi paprasti žingsniai — ir galėsi žaisti.', {
                fontSize: '16px', color: THEME.muted, fontFamily: FONT
            }).setOrigin(0.5)
        );

        const instructions = config.text.tutorial.instructions;
        const stepColors = [toHex(THEME.dnaA), toHex(THEME.dnaT), toHex(THEME.warning), toHex(THEME.dnaC)];
        const cardW = 410;
        const cardH = 125;
        const positions = [
            { x: 470, y: 250 }, { x: 930, y: 250 },
            { x: 470, y: 405 }, { x: 930, y: 405 }
        ];

        instructions.forEach((instr, i) => {
            const pos = positions[i];
            const card = this.add.rectangle(pos.x, pos.y, cardW, cardH, THEME.panel, 0.97);
            card.setStrokeStyle(1, THEME.panelStroke);
            this.layers.ui.add(card);

            const accentBar = this.add.rectangle(pos.x - cardW / 2 + 3, pos.y, 5, cardH - 10, stepColors[i], 0.9);
            this.layers.ui.add(accentBar);

            const numCircle = this.add.circle(pos.x - 163, pos.y - 30, 15, stepColors[i], 1);
            const numText = this.add.text(pos.x - 163, pos.y - 30, `${i + 1}`, {
                fontSize: '14px', color: '#ffffff', fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0.5);
            this.layers.ui.add(numCircle);
            this.layers.ui.add(numText);

            this.layers.ui.add(
                this.add.text(pos.x - 142, pos.y - 32, instr.title, {
                    fontSize: '17px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
                }).setOrigin(0, 0.5)
            );
            this.layers.ui.add(
                this.add.text(pos.x - 142, pos.y + 4, instr.text, {
                    fontSize: '14px', color: '#374151', fontFamily: FONT,
                    wordWrap: { width: 280 }, lineSpacing: 5
                }).setOrigin(0, 0)
            );
        });

        const exCardCX = cx;
        const exCardCY = 640;
        const exCardW = 620;
        const exCardH = 170;
        const exCardTop = exCardCY - exCardH / 2;

        const exCard = this.add.rectangle(exCardCX, exCardCY, exCardW, exCardH, toHex(THEME.bgTop), 1);
        exCard.setStrokeStyle(1.5, toHex(THEME.primary));
        this.layers.ui.add(exCard);

        this._miniCaption = this.add.text(exCardCX, exCardTop + 18, 'Pradinis išdėstymas', {
            fontSize: '12px', fontStyle: 'bold', color: THEME.primary, fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(this._miniCaption);

        this.layers.ui.add(
            this.add.rectangle(exCardCX, exCardTop + 32, exCardW - 24, 1, toHex(THEME.primary), 0.18)
        );

        this.renderAnimatedMiniExample(exCardCX, exCardCY, exCardH);

        const primaryStyle = getButtonStyle('primary', { fontSize: '18px' });
        const btn = this.addComponent(
            new BioPhaser.UI.Button(this, cx, 810, 'Tęsti į nustatymus →', {
                ...primaryStyle, container: this.layers.ui
            })
        );
        btn.onClick(() => this.scene.start('Setup'));
        attachButtonHover(btn, primaryStyle);
        btn.create();
    }

    renderAnimatedMiniExample(cardCX, cardCY, cardH) {
        this.miniExampleState = 0;
        this._miniCardCX = cardCX;
        this._miniCardCY = cardCY;
        this._miniCardH  = cardH;

        this.miniExampleContainer = this.add.container(0, 0);
        this.layers.ui.add(this.miniExampleContainer);

        this.drawMiniExampleState();

        this.time.addEvent({
            delay: 1300,
            callback: this.advanceMiniExample,
            callbackScope: this,
            loop: true
        });
    }

    // Ši animacija parodo tarpų įterpimo ir perkėlimo logiką,
    // kad vartotojas dar prieš žaidimą suvoktų, kaip formuojami stulpeliai.
    drawMiniExampleState() {
        const MINI_STATES = [
            {
                seqs: [['A','T','G','C'], ['A','T','C','G'], ['A','C','G','C']],
                caption: 'Pradinis išdėstymas',
                highlight: null
            },
            {
                seqs: [['A','T','-','G','C'], ['A','T','C','G'], ['A','C','G','C']],
                caption: 'Įterpiamas vienas tarpas',
                highlight: { row: 0, col: 2 }
            },
            {
                seqs: [['A','-','T','G','C'], ['A','T','C','G'], ['A','C','G','C']],
                caption: 'Tarpas perkeliamas',
                highlight: { row: 0, col: 1 }
            },
            {
                seqs: [['A','T','G','C'], ['A','T','C','G'], ['A','C','G','C']],
                caption: 'Tarpas ištrinamas',
                highlight: null
            }
        ];

        const state = MINI_STATES[this.miniExampleState];
        const tileSize = 34;
        const gap = 6;
        const step = tileSize + gap;

        const cardTop    = this._miniCardCY - this._miniCardH / 2;
        const contentTop = cardTop + 36;
        const contentH   = this._miniCardH - 36 - 10;
        const numRows    = state.seqs.length;
        const totalRowH  = numRows * step - gap;
        const rowStartY  = contentTop + Math.floor((contentH - totalRowH) / 2) + Math.floor(tileSize / 2);


        const labelX     = this._miniCardCX - 117;
        const firstTileX = labelX + 57;

        this.miniExampleContainer.removeAll(true);

        state.seqs.forEach((seq, row) => {
            const rowY = rowStartY + row * step;

            const lbl = this.add.text(labelX, rowY, `S${row + 1}`, {
                fontSize: '11px', fontStyle: 'bold', color: THEME.muted, fontFamily: FONT
            }).setOrigin(0, 0.5);
            this.miniExampleContainer.add(lbl);

            seq.forEach((base, col) => {
                const x = firstTileX + col * step;
                const isHighlight = state.highlight &&
                    state.highlight.row === row && state.highlight.col === col;
                const colorHex = config.gameplay.baseColors[base];
                const color    = parseInt(colorHex.replace('#', '0x'));
                const tile = this.add.rectangle(x, rowY, tileSize, tileSize, color, 1);
                tile.setStrokeStyle(isHighlight ? 3 : 2, isHighlight ? 0xF59E0B : 0xffffff);
                const text = this.add.text(x, rowY, base, {
                    fontSize: '14px', fontStyle: 'bold', color: '#ffffff', fontFamily: FONT
                }).setOrigin(0.5);
                this.miniExampleContainer.add([tile, text]);
            });
        });

        if (this._miniCaption) {
            this._miniCaption.setText(state.caption);
        }
    }

    advanceMiniExample() {
        this.miniExampleState = (this.miniExampleState + 1) % 4;
        this.drawMiniExampleState();
    }
}



// Nustatymų scena leidžia pasirinkti sekų kiekį, sudėtingumą ir režimą,
// kurie vėliau lemia sugeneruotos užduoties parametrus.
class SetupScene extends BioPhaser.BioScene {
    constructor() {
        super('Setup', config);
        this.numSequences = 3;
        this.difficulty = 'easy';
        this.mode = 'learning';
    }
    
    preload() {
        this.load.image('dna', 'assets/dna.png');
        this.load.image('particlesDecor', 'assets/particles.png');
    }
    
    create() {
        this.createLayers();
        BioPhaser.UI.Helpers.addMenuButton(this);

        BioPhaser.UI.Helpers.createStandardBackground(this);

        this.layers.ui.setDepth(20);

        this.showSetup();
    }
    
    showSetup() {
        const centerX = UI.CX || this.scale.width / 2;

        const MODE_STYLES = {
            learning:  { accent: 0x10B981, accentHex: '#10B981', soft: 0xECFDF5, hover: 0xD1FAE5,
                         title: 'Mokymasis',  subtitle: 'Daugiau pagalbos ir patarimų',
                         badges: ['Užuominos', 'Be laiko'] },
            training:  { accent: 0xF59E0B, accentHex: '#F59E0B', soft: 0xFFFBEB, hover: 0xFEF3C7,
                         title: 'Treniruotė', subtitle: 'Laikas įjungtas, pagalba mažinama',
                         badges: ['Laikas', 'Ribota pagalba'] },
            challenge: { accent: 0xA855F7, accentHex: '#A855F7', soft: 0xFAF5FF, hover: 0xF3E8FF,
                         title: 'Iššūkis',    subtitle: 'Be pagalbos, tik tavo sprendimas',
                         badges: ['Be užuominų', 'Laikas'] }
        };
        const DIFF_STYLES = {
            easy:   { accent: 0x22C55E, accentHex: '#22C55E', soft: 0xF0FDF4, hover: 0xDCFCE7, label: 'Lengvas',   desc: '2–3 sekos · 5–8 bazės' },
            medium: { accent: 0x38BDF8, accentHex: '#38BDF8', soft: 0xF0F9FF, hover: 0xE0F2FE, label: 'Vidutinis', desc: 'iki 5 sekų · 7–11 bazių' },
            hard:   { accent: 0xF97316, accentHex: '#F97316', soft: 0xFFF7ED, hover: 0xFED7AA, label: 'Sunkus',    desc: 'iki 6 sekų · 10–14 bazių' }
        };

        this.layers.ui.add(
            this.add.text(centerX, 68, 'Pasirink bandymą', {
                fontSize: '34px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
            }).setOrigin(0.5)
        );
        this.layers.ui.add(
            this.add.text(centerX, 108, 'Pasirink žaidimo tipą, sudėtingumą ir sekų skaičių.', {
                fontSize: '18px', color: '#374151', fontFamily: FONT
            }).setOrigin(0.5)
        );

        const cardW = 300;
        const cardH = 280;
        const cardGap = 28;
        const cardsY = 310;
        const totalCardsW = cardW * 3 + cardGap * 2;
        const firstCardX = centerX - totalCardsW / 2 + cardW / 2;
        const cardXs = [
            firstCardX,
            firstCardX + cardW + cardGap,
            firstCardX + (cardW + cardGap) * 2
        ];
        const MODE_KEYS = ['learning', 'training', 'challenge'];
        const previewY = cardsY - cardH / 2 + 165;
        const chipsY = cardsY - cardH / 2 + 235;

        const DNA_ROW1 = ['A', 'T', '-', 'G'];
        const DNA_ROW2 = ['A', 'T', 'C', 'G'];
        const BASE_COLORS = { A: 0x22C55E, T: 0x38BDF8, G: 0xF59E0B, C: 0xA855F7, '-': 0x94A3B8 };
        const tileSize = 32, tileStep = 37;
        const dnaW = DNA_ROW1.length * tileSize + (DNA_ROW1.length - 1) * 5; // 143

        MODE_KEYS.forEach((key, i) => {
            const ms = MODE_STYLES[key];
            const sel = this.mode === key;
            const cx_c = cardXs[i];
            const cardTop = cardsY - cardH / 2;
            const badgeY = cardTop + 34;
            const titleY = cardTop + 72;
            const subtitleY = cardTop + 112;

            const bg = this.add.rectangle(cx_c, cardsY, cardW, cardH, sel ? ms.hover : ms.soft, 1)
                .setStrokeStyle(sel ? 3 : 1, sel ? ms.accent : 0xD1D5DB)
                .setInteractive({ useHandCursor: true });
            this.layers.ui.add(bg);

            this.layers.ui.add(
                this.add.rectangle(cx_c, cardTop + 6, cardW, 12, ms.accent, sel ? 1 : 0.6)
            );

            if (sel) {
                const bb = this.add.rectangle(cx_c, badgeY, 130, 26, ms.accent, 1);
                const bt = this.add.text(cx_c, badgeY, 'Pasirinkta', {
                    fontSize: '13px', fontStyle: 'bold', color: '#ffffff', fontFamily: FONT
                }).setOrigin(0.5);
                this.layers.ui.add([bb, bt]);
            }

            this.layers.ui.add(
                this.add.text(cx_c, titleY, ms.title, {
                    fontSize: '26px', fontStyle: 'bold',
                    color: sel ? ms.accentHex : '#1F2937', fontFamily: FONT
                }).setOrigin(0.5)
            );

            this.layers.ui.add(
                this.add.text(cx_c, subtitleY, ms.subtitle, {
                    fontSize: '15px', color: sel ? '#374151' : '#4B5563', fontFamily: FONT,
                    wordWrap: { width: cardW - 44 }, align: 'center'
                }).setOrigin(0.5)
            );

            const dnaStartX = cx_c - dnaW / 2 + tileSize / 2;
            [DNA_ROW1, DNA_ROW2].forEach((row, ri) => {
                const rowY = previewY + (ri === 0 ? -18 : 21);
                row.forEach((base, ci) => {
                    const tx = dnaStartX + ci * tileStep;
                    const tile = this.add.rectangle(tx, rowY, tileSize, tileSize,
                        BASE_COLORS[base], base === '-' ? 0.5 : 0.9);
                    const lbl = this.add.text(tx, rowY, base, {
                        fontSize: '14px', fontStyle: 'bold', color: '#ffffff', fontFamily: FONT
                    }).setOrigin(0.5);
                    this.layers.ui.add([tile, lbl]);
                });
            });

            ms.badges.forEach((badge, bi) => {
                const bx = cx_c + (bi === 0 ? -66 : 66);
                const bb = this.add.rectangle(bx, chipsY, 116, 28, ms.accent, sel ? 0.25 : 0.13);
                const bt = this.add.text(bx, chipsY, badge, {
                    fontSize: '14px', fontStyle: 'bold',
                    color: sel ? ms.accentHex : '#374151', fontFamily: FONT
                }).setOrigin(0.5);
                this.layers.ui.add([bb, bt]);
            });

            bg.on('pointerover', () => { if (!sel) bg.setFillStyle(ms.hover); });
            bg.on('pointerout',  () => bg.setFillStyle(sel ? ms.hover : ms.soft));
            bg.on('pointerdown', () => {
                if (this.mode === key) return;
                this.mode = key;
                this.cleanupUI(); this.showSetup();
            });
        });

        const difficultyLabelY = 475;
        const difficultyY = 525;
        this.layers.ui.add(
            this.add.text(centerX, difficultyLabelY, 'Sudėtingumas', {
                fontSize: '14px', fontStyle: 'bold', color: '#6B7280',
                fontFamily: FONT, letterSpacing: 1
            }).setOrigin(0.5)
        );

        const DIFF_KEYS = ['easy', 'medium', 'hard'];
        const diffW = 180;
        const diffH = 48;
        const diffGap = 18;
        const totalDiffW = diffW * 3 + diffGap * 2;
        const diffStartX = centerX - totalDiffW / 2 + diffW / 2;

        DIFF_KEYS.forEach((key, i) => {
            const ds = DIFF_STYLES[key];
            const sel = this.difficulty === key;
            const chipCX = diffStartX + i * (diffW + diffGap);
            const fill = sel ? ds.accent : ds.soft;

            const chip = this.add.rectangle(chipCX, difficultyY, diffW, diffH, fill, 1)
                .setStrokeStyle(sel ? 0 : 2, 0xD1D5DB)
                .setInteractive({ useHandCursor: true });
            const chipLbl = this.add.text(chipCX, difficultyY, ds.label, {
                fontSize: '18px', fontStyle: 'bold',
                color: sel ? '#ffffff' : '#1F2937', fontFamily: FONT
            }).setOrigin(0.5);
            this.layers.ui.add([chip, chipLbl]);

            chip.on('pointerover', () => { if (!sel) chip.setFillStyle(ds.hover); });
            chip.on('pointerout',  () => chip.setFillStyle(fill));
            chip.on('pointerdown', () => {
                if (this.difficulty === key) return;
                this.difficulty = key;
                const [min, max] = config.gameplay.difficulties[key].numSeqRange;
                if (this.numSequences < min) this.numSequences = min;
                if (this.numSequences > max) this.numSequences = max;
                this.cleanupUI(); this.showSetup();
            });
        });

        const ds = DIFF_STYLES[this.difficulty];
        const difficultyDescriptionY = difficultyY + 54;
        this.layers.ui.add(
            this.add.text(centerX, difficultyDescriptionY, ds.desc, {
                fontSize: '14px', color: '#374151', fontFamily: FONT
            }).setOrigin(0.5)
        );

        const sequenceCountY = 640;
        const [minSeq, maxSeq] = config.gameplay.difficulties[this.difficulty].numSeqRange;
        const numChips = maxSeq - minSeq + 1;
        const seqChipW = 52;
        const seqChipH = 46;
        const seqChipGap = 12;
        const seqChipsW = numChips * seqChipW + (numChips - 1) * seqChipGap;
        const seqLabelGap = 22;
        const labelText = 'Sekų skaičius:';
        const labelX = centerX - (220 + seqChipsW) / 2 + 72;
        const optionStartX = labelX + 110 + seqLabelGap + seqChipW / 2;

        this.layers.ui.add(
            this.add.text(labelX, sequenceCountY, labelText, {
                fontSize: '18px', fontStyle: 'bold', color: '#374151', fontFamily: FONT
            }).setOrigin(0.5)
        );

        let seqChipX = optionStartX;
        for (let n = minSeq; n <= maxSeq; n++) {
            const sel = this.numSequences === n;
            const fill = sel ? ds.accent : ds.soft;
            const chip = this.add.rectangle(seqChipX, sequenceCountY, seqChipW, seqChipH, fill, 1)
                .setStrokeStyle(sel ? 0 : 2, 0xD1D5DB)
                .setInteractive({ useHandCursor: true });
            const chipTxt = this.add.text(seqChipX, sequenceCountY, `${n}`, {
                fontSize: '18px', fontStyle: 'bold',
                color: sel ? '#ffffff' : '#1F2937', fontFamily: FONT
            }).setOrigin(0.5);
            chip.on('pointerover', () => { if (!sel) chip.setFillStyle(ds.hover); });
            chip.on('pointerout',  () => chip.setFillStyle(fill));
            chip.on('pointerdown', () => {
                if (this.numSequences === n) return;
                this.numSequences = n;
                this.cleanupUI(); this.showSetup();
            });
            this.layers.ui.add([chip, chipTxt]);
            seqChipX += seqChipW + seqChipGap;
        }

        this.layers.ui.add(
            this.add.rectangle(centerX, 718, 1100, 1, THEME.panelStroke, 0.3)
        );

        const footerY = 780;
        const backX = centerX - 410;
        const startX = centerX + 410;
        const backBg = this.add.rectangle(backX, footerY, 170, 50, 0xF1F5F9, 1)
            .setStrokeStyle(2, 0xD1D5DB)
            .setInteractive({ useHandCursor: true });
        const backTxt = this.add.text(backX, footerY, '← Atgal', {
            fontSize: '18px', color: '#374151', fontFamily: FONT
        }).setOrigin(0.5);
        backBg.on('pointerover', () => backBg.setFillStyle(0xE2E8F0));
        backBg.on('pointerout',  () => backBg.setFillStyle(0xF1F5F9));
        backBg.on('pointerdown', () => this.scene.start('Tutorial'));
        this.layers.ui.add([backBg, backTxt]);

        const startBg = this.add.rectangle(startX, footerY, 220, 50, toHex(THEME.primary), 1)
            .setInteractive({ useHandCursor: true });
        const startTxt = this.add.text(startX, footerY, 'Pradėti žaidimą →', {
            fontSize: '18px', fontStyle: 'bold', color: '#ffffff', fontFamily: FONT
        }).setOrigin(0.5);
        startBg.on('pointerover', () => startBg.setFillStyle(toHex(THEME.primaryHover)));
        startBg.on('pointerout',  () => startBg.setFillStyle(toHex(THEME.primary)));
        startBg.on('pointerdown', () => {
            this.scene.start('Game', {
                numSequences: this.numSequences,
                difficulty: this.difficulty,
                mode: this.mode
            });
        });
        this.layers.ui.add([startBg, startTxt]);
    }
}

// Pagrindinė scena valdo vieną pilną sekų išlyginimo bandymą:
// generuoja duomenis, priima vartotojo veiksmus ir skaičiuoja galutinį balą.
class GameScene extends BioPhaser.BioScene {
    constructor() {
        super('Game', config);
        this.DEBUG = false;
    }
    
    init(data) {
        super.init(data);
        this.numSequences = data.numSequences || 3;
        this.difficulty = data.difficulty || 'easy';
        this.mode = data.mode || 'learning';

        this.sequences = [];
        this.grid = [];
        this.score = 0;
        this.targetScore = 0;
        this.scoring = null;

        this.hasMoved = false;

        this.showingSolution = false;
        this.solutionContainer = null;

        this.tileSize = config.gameplay.grid.tileSize;
        this.tileGap = config.gameplay.grid.tileGap;

        this.draggingTile = null;
        this.dragStartPos = null;

        this.helpPenalties = 0;
        this.lastInteractionTime = Date.now();
        this.inactivityHintShown = false;
        this.inactivityHintText = null;
        this.worstColHighlights = [];
        this.colIndicators = [];
        this.timerSeconds = 0;
        this._submitModal = null;
        this._modalContBtn = null;
        this._modalOptBtn = null;
        this._optimalShown = false;

        this.history = [];
        this.initialGrid = [];
    }
    
    preload() {
        this.load.image('dna', 'assets/dna.png');
        this.load.image('particlesDecor', 'assets/particles.png');
    }
    
    create() {
        this.createLayers();

        BioPhaser.UI.Helpers.createStandardBackground(this);

        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);

        this.generateSequences();
        this.calculateTargetScore();
        this.renderUI();

        this.lastInteractionTime = Date.now();

        this.time.addEvent({ delay: 5000, loop: true, callback: () => this.checkInactivity() });

        if (this.mode === 'training' || this.mode === 'challenge') {
            this.startCountdown();
        }
    }
    
    generateSequences() {
        const result = Alignment.generateSequences({
            numSeq: this.numSequences,
            minLen: config.gameplay.difficulties[this.difficulty].minLen,
            maxLen: config.gameplay.difficulties[this.difficulty].maxLen,
            similarity: config.gameplay.difficulties[this.difficulty].similarity,
            bases: config.gameplay.bases
        });
        
        this.sequences = result.sequences;
        this.scoring = config.gameplay.difficulties[this.difficulty].scoring;
        
        this.grid = this.sequences.map(seq =>
            seq.split('').map(base => ({ base, kind: 'base', tile: null, text: null }))
        );
        this.initialGrid = this.grid.map(row => row.map(cell => ({ base: cell.base, kind: cell.kind })));
    }
    
    calculateTargetScore() {
        const target = computeTargetScore(this.sequences, this.scoring);
        
        this.targetScore = target.targetScore;
        this.targetAlignment = target.targetAlignment;
        this.alignmentMethod = target.method;
        
        if (this.DEBUG) {
            console.log('=== ALIGNMENT DEBUG ===');
            console.log('Sequences:', this.sequences);
            console.log('Target Alignment:', this.targetAlignment);
            console.log('Target Score:', this.targetScore);
            console.log('Method:', this.alignmentMethod);
            console.log('Scoring:', this.scoring);
            console.log('=====================');
        }
    }
    
    renderUI() {
        this.renderHeader();
        this.renderBoardCard();
        this.renderLabels();
        this.renderAnalysisPanel();

        this.colTip = this.add.container(0, 0);
        this.colTipBg = this.add.rectangle(0, 0, 260, 72, 0xffffff, 0.97)
            .setStrokeStyle(1, 0xdbeafe)
            .setOrigin(0, 0);
        this.colTipText = this.add.text(12, 8, '', {
            fontSize: '12px', color: '#1e293b', fontFamily: FONT,
            align: 'left', lineSpacing: 3
        }).setOrigin(0, 0);
        this.colTip.add([this.colTipBg, this.colTipText]);
        this.colTip.setVisible(false);
        this.colTip.setDepth(1000);
        this.add.existing(this.colTip);

        this.input.on('pointermove', (pointer) => {
            if (this.colTip.visible) this.positionColTip(pointer);
        });

        this.recreateAll();
        this.calculateScore();

        const H = BioPhaser.UI.Helpers;
        const fy = UI.footerY;

        H.createButton(this, {
            x: 150, y: fy, width: 150, height: 44,
            text: '← Grįžti', variant: 'secondary',
            container: this.layers.ui,
            onClick: () => this.scene.start('Setup'), fontFamily: FONT
        });

        if (this.mode !== 'challenge') {
            H.createButton(this, {
                x: 322, y: fy, width: 150, height: 44,
                text: 'Atšaukti', variant: 'secondary',
                container: this.layers.ui,
                onClick: () => this.undoMove(), fontFamily: FONT
            });
        }

        H.createButton(this, {
            x: this.mode !== 'challenge' ? 494 : 322, y: fy, width: 150, height: 44,
            text: 'Iš naujo', variant: 'secondary',
            container: this.layers.ui,
            onClick: () => this.resetBoard(), fontFamily: FONT
        });

        H.createButton(this, {
            x: 1060, y: fy, width: 200, height: 44,
            text: 'Pateikti ✓', variant: 'primary',
            container: this.layers.ui,
            onClick: () => this.showSubmitModal(), fontFamily: FONT
        });
    }

    renderAnalysisPanel() {
        const px = 1015;
        const py = 380;
        const pw = 280;
        const ph = 500;
        const panelTop = py - ph / 2;
        const panelLeft = px - pw / 2;
        const contentX = panelLeft + 18;
        const bg = this.add.rectangle(px, py, pw, ph, THEME.panelSoft, 0.97);
        bg.setStrokeStyle(1, THEME.panelStroke);
        bg.setDepth(0);
        this.layers.ui.add(bg);

        const stripY = panelTop + 18;
        const strip = this.add.rectangle(px, stripY, pw, 30, THEME.panelBlue, 1);
        strip.setDepth(1);
        this.layers.ui.add(strip);

        const panelTitle = this.add.text(contentX, stripY, 'Užrašai', {
            fontSize: '12px', color: THEME.primary, fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(2);
        this.layers.ui.add(panelTitle);

        const addStatBlock = (label, value, y) => {
            const sep = this.add.rectangle(px, y + 1, pw - 20, 1, THEME.panelStroke, 0.7);
            sep.setDepth(1);
            this.layers.ui.add(sep);

            const lbl = this.add.text(contentX, y + 10, label, {
                fontSize: '11px', color: THEME.muted, fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0, 0);
            const val = this.add.text(contentX, y + 26, value, {
                fontSize: '28px', color: THEME.text, fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0, 0);
            this.layers.ui.add(lbl);
            this.layers.ui.add(val);
            return val;
        };

        this._panelScore = addStatBlock('Balas', '0', panelTop + 44);
        this._panelTarget = this.mode === 'learning'
            ? addStatBlock('Optimalus', `${this.targetScore}`, panelTop + 114)
            : null;

        if (this.mode === 'learning') {
            const pctY = panelTop + 184;
            this._panelPct = addStatBlock('Procentas', '0%', pctY);
        } else {
            this._panelPct = null;
        }

        if (this.mode !== 'challenge') {
            const tipTop = this.mode === 'learning' ? panelTop + 300 : panelTop + 160;
            const tipCard = this.add.rectangle(px, tipTop + 36, pw - 20, 80, 0xfffbeb, 1);
            tipCard.setStrokeStyle(1, 0xfde68a);
            tipCard.setDepth(1);
            this.layers.ui.add(tipCard);

            const tipTitle = this.add.text(contentX, tipTop + 2, 'Patarimas', {
                fontSize: '11px', color: '#92400e', fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0, 0);
            this.layers.ui.add(tipTitle);

            this._panelTip = this.add.text(contentX, tipTop + 18, 'Spausk raidę → tarpas.\nTempk tarpą → keisk vietą.', {
                fontSize: '12px', color: '#78350f', fontFamily: FONT,
                wordWrap: { width: pw - 44 }, lineSpacing: 4
            }).setOrigin(0, 0);
            this.layers.ui.add(this._panelTip);
        }
    }

    updateAnalysisPanel() {
        if (!this._panelScore) return;
        const rawPct = this.targetScore > 0 ? Math.round((this.score / this.targetScore) * 100) : 0;
        const pct = Math.max(0, Math.min(100, rawPct));

        this._panelScore.setText(`${this.score}`);
        if (this._panelTarget) this._panelTarget.setText(`${this.targetScore}`);
        if (this._panelPct) {
            this._panelPct.setText(`${pct}%`);
            this._panelPct.setStyle({
                color: pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
            });
        }
    }

    saveHistory() {
        const snapshot = this.grid.map(row =>
            row.map(cell => ({ base: cell.base, kind: cell.kind }))
        );
        this.history.push(snapshot);
        if (this.history.length > 50) this.history.shift();
    }

    undoMove() {
        if (!this.history.length) return;
        this.hideTargetAlignment();
        const snapshot = this.history.pop();
        for (let r = 0; r < this.grid.length; r++) {
            this.grid[r].forEach(cell => { cell.tile?.destroy(); cell.text?.destroy(); });
        }
        this.grid = snapshot.map(row =>
            row.map(cell => ({ ...cell, tile: null, text: null }))
        );
        this.clearWorstHighlights();
        this.recreateAll();
        this.calculateScore();
    }

    resetBoard() {
        this.hideTargetAlignment();
        for (let r = 0; r < this.grid.length; r++) {
            this.grid[r].forEach(cell => { cell.tile?.destroy(); cell.text?.destroy(); });
        }
        this.grid = this.initialGrid.map(row =>
            row.map(cell => ({ ...cell, tile: null, text: null }))
        );
        this.history = [];
        this.hasMoved = false;
        this._optimalShown = false;
        this.clearWorstHighlights();
        this.recreateAll();
        this.calculateScore();
    }

    renderHeader() {
        const cx = UI.CX;
        const topGlow = this.add.rectangle(cx, 8, UI.W, 16, THEME.panelBlue, 0.9);
        this.layers.ui.add(topGlow);
        const hBg = this.add.rectangle(cx, 54, UI.W, 108, THEME.panel, 0.86);
        this.layers.ui.add(hBg);
        const hLine = this.add.rectangle(cx, 107, UI.W, 1, THEME.panelStroke, 1);
        this.layers.ui.add(hLine);

        const modeColors = { learning: THEME.info, training: THEME.warning, challenge: THEME.danger };
        const modeLabels = { learning: 'Mokymasis', training: 'Treniruotė', challenge: 'Iššūkis' };
        const modeColor = modeColors[this.mode] || THEME.info;

        const modeBadgeBg = this.add.rectangle(116, 42, 132, 28, toHex(modeColor), 0.14);
        modeBadgeBg.setStrokeStyle(1, toHex(modeColor));
        this.layers.ui.add(modeBadgeBg);

        const modeLbl = this.add.text(116, 42, modeLabels[this.mode] || '', {
            fontSize: '12px', color: modeColor, fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.layers.ui.add(modeLbl);

        this.totalText = null;
        if (this.mode !== 'learning') {
            this.timerText = this.add.text(116, 74, '⏱ --:--', {
                fontSize: '16px', color: THEME.text, fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0.5);
            this.layers.ui.add(this.timerText);
        }

        this.hintText = this.add.text(cx, 40, config.text.game.hint, {
            fontSize: '18px', color: THEME.text, fontFamily: FONT, fontStyle: 'bold',
            wordWrap: { width: 760 }, align: 'center'
        }).setOrigin(0.5);
        this.layers.ui.add(this.hintText);

        const s = this.scoring || { match: 0, mismatch: 0, gap: 0 };
        const lg = config.text.game.scoringLegend;
        const legendStr = `${lg.match} +${s.match}   ${lg.mismatch} ${s.mismatch}   ${lg.gap} ${s.gap}`;
        this.legendText = this.add.text(cx, 76, legendStr, {
            fontSize: '15px', color: THEME.muted, fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.layers.ui.add(this.legendText);

        if (this.mode !== 'challenge') {
            const utilityStyle = getButtonStyle('utility', { backgroundColor: THEME.warning, hoverBackgroundColor: '#D97706' });
            const helpBtn = this.addComponent(new BioPhaser.UI.Button(
                this, UI.W - 108, 54, 'Pagalba', {
                    ...utilityStyle,
                    container: this.layers.uiPersistent
                }
            ));
            helpBtn.onClick(() => this.handleHelp());
            attachButtonHover(helpBtn, utilityStyle);
            helpBtn.create();
        }
    }
    
    renderBoardCard() {
        const cardX = 450;
        const cardY = 380;
        const cardW = 840;
        const cardH = 500;

        const bg = this.add.rectangle(cardX, cardY, cardW, cardH, THEME.panelSoft, 0.97);
        bg.setStrokeStyle(1, THEME.panelStroke);
        bg.setDepth(0);
        this.layers.ui.add(bg);

        const stripY = cardY - cardH / 2 + 18;
        const strip = this.add.rectangle(cardX, stripY, cardW, 30, THEME.panelBlue, 1);
        strip.setDepth(1);
        this.layers.ui.add(strip);

        const cardTitle = this.add.text(cardX - cardW / 2 + 22, stripY, 'DNR dėlionės lenta', {
            fontSize: '13px', color: THEME.primary, fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        cardTitle.setDepth(2);
        this.layers.ui.add(cardTitle);
    }

    updateGridLayout() {
        const maxCols = Math.max(...this.grid.map(row => row.length));
        const rows = this.grid.length;

        const board = { left: 90, right: 875, top: 190, bottom: 570 };
        const labelSpace = 70;
        const innerLeft   = board.left + labelSpace;
        const innerRight  = board.right - 30;
        const innerTop    = board.top + 70;
        const innerBottom = board.bottom - 45;

        const gap = 4;
        const availableW = innerRight - innerLeft;
        const availableH = innerBottom - innerTop;

        const tileByWidth  = Math.floor((availableW - (maxCols - 1) * gap) / maxCols);
        const tileByHeight = Math.floor((availableH - (rows - 1) * gap) / rows);

        this.tileGap  = gap;
        this.tileSize = Math.max(28, Math.min(Math.min(tileByWidth, tileByHeight), 46));

        const gridW = maxCols * this.tileSize + (maxCols - 1) * this.tileGap;
        const gridH = rows * this.tileSize + (rows - 1) * this.tileGap;

        this.gridStartX = innerLeft + Math.max(0, (availableW - gridW) / 2) + this.tileSize / 2;
        this.gridStartY = innerTop  + Math.max(0, (availableH - gridH) / 2) + this.tileSize / 2;
        this.labelX = board.left + 35;
    }

    renderLabels() {
        this._seqLabels = [];
        this.updateGridLayout();
        const rowHeight = this.tileSize + this.tileGap;

        this.sequences.forEach((seq, i) => {
            const y = this.gridStartY + i * rowHeight;
            const label = this.add.text(this.labelX, y, `${config.text.game.sequenceLabelPrefix}${i + 1}`, {
                fontSize: '18px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
            }).setOrigin(0.5);
            this.layers.ui.add(label);
            this._seqLabels.push(label);
        });
    }
    
    
    createTile(base, x, y, row, col) {
        const cell = this.grid[row][col];
        const isGap = cell.base === '-';

        const rawColor = isGap ? THEME.gap : (config.gameplay.baseColors[base] || THEME.neutral);
        const tile = this.add.rectangle(
            x,
            y,
            this.tileSize,
            this.tileSize,
            parseInt(rawColor.replace('#', '0x')),
            1
        );
        tile.setStrokeStyle(isGap ? 2 : 3, isGap ? 0xe2e8f0 : 0xffffff);
        tile.setDepth(10);
        this.layers.ui.add(tile);

        if (isGap) {
            tile.setInteractive({ draggable: true });
            
            let dragStartX = 0;
            let dragStartY = 0;
            let hasDragged = false;
            
            tile.on('dragstart', (pointer) => {
                this.draggingTile = { row, col, tile };
                this.dragStartPos = { row, col };
                dragStartX = pointer.x;
                dragStartY = pointer.y;
                hasDragged = false;
                tile.setAlpha(0.78);
                this.hideColumnInfo();
            });
            
            tile.on('drag', (pointer, dragX, dragY) => {
                tile.x = dragX;
                tile.y = dragY;
                
                const dx = pointer.x - dragStartX;
                const dy = pointer.y - dragStartY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    hasDragged = true;
                }
            });
            
            tile.on('dragend', (pointer) => {
                const draggedRow = this.dragStartPos.row;
                const draggedCol = this.dragStartPos.col;
                
                this.draggingTile = null;
                this.dragStartPos = null;
                
                if (!hasDragged) {
                    this.hideColumnInfo();
                    this.deleteGap(draggedRow, draggedCol);
                } else {
                    const colWidth = this.tileSize + this.tileGap;
                    const startX = this.gridStartX;

                    const newCol = Math.round((pointer.x - startX) / colWidth);
                    const targetCol = Math.max(0, Math.min(newCol, this.grid[draggedRow].length));
                    
                    if (targetCol !== draggedCol) {
                        this.moveGap(draggedRow, draggedCol, targetCol);
                    } else {
                        this.recreateAll();
                    }
                }
            });
        } else {
            tile.setInteractive();

            tile.on('pointerover', () => tile.setScale(1.07));
            tile.on('pointerout',  () => tile.setScale(1.0));

            tile.on('pointerdown', (pointer) => {
                this.insertGap(row, col);
            });
        }
        
        tile.on('pointerover', () => {
            const colIndex = this.grid[row].indexOf(cell);
            if (colIndex >= 0 && !this.draggingTile) {
                this.showColumnInfo(colIndex);
            }
        });
        
        tile.on('pointerout', () => {
            if (!this.draggingTile) {
                this.hideColumnInfo();
            }
        });
        
        const tileFontSize = Math.max(12, Math.round(this.tileSize * 0.52));
        const text = this.add.text(x, y, base, {
            fontSize: `${tileFontSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: FONT
        }).setOrigin(0.5).setAlpha(1).setDepth(11);
        this.layers.ui.add(text);

        cell.tile = tile;
        cell.text = text;
    }
    
    insertGap(row, col) {
        this.hideTargetAlignment();
        this.saveHistory();
        this.hasMoved = true;
        this.lastInteractionTime = Date.now();
        this.inactivityHintShown = false;
        this.clearInactivityHint();
        this.clearWorstHighlights();

        this.hideColumnInfo();

        this.grid[row].splice(col, 0, {
            base: '-',
            kind: 'gap',
            tile: null,
            text: null
        });

        this.recreateAll();
        this.calculateScore();
    }

    moveGap(row, fromCol, toCol) {
        if (fromCol === toCol) return;
        this.hideTargetAlignment();
        this.saveHistory();
        this.hasMoved = true;
        this.lastInteractionTime = Date.now();
        this.inactivityHintShown = false;
        this.clearInactivityHint();
        this.clearWorstHighlights();

        const [gap] = this.grid[row].splice(fromCol, 1);
        this.grid[row].splice(toCol, 0, gap);

        this.recreateAll();
        this.calculateScore();
    }
    
    recreateAll() {
        for (let r = 0; r < this.grid.length; r++) {
            this.grid[r].forEach((cell) => {
                cell.tile?.destroy();
                cell.text?.destroy();
            });
        }

        this.updateGridLayout();
        const rowHeight = this.tileSize + this.tileGap;
        const colWidth  = this.tileSize + this.tileGap;

        if (this._seqLabels) {
            this._seqLabels.forEach((lbl, i) => lbl.setY(this.gridStartY + i * rowHeight));
        }

        for (let r = 0; r < this.grid.length; r++) {
            const y = this.gridStartY + r * rowHeight;
            for (let c = 0; c < this.grid[r].length; c++) {
                const cell = this.grid[r][c];
                const x = this.gridStartX + c * colWidth;
                this.createTile(cell.base, x, y, r, c);
            }
        }

        this.updateColumnIndicators();
    }
    
    recreateRow(row) {
        this.grid[row].forEach(cell => {
            cell.tile?.destroy();
            cell.text?.destroy();
        });

        this.updateGridLayout();
        const rowHeight = this.tileSize + this.tileGap;
        const colWidth  = this.tileSize + this.tileGap;
        const y = this.gridStartY + row * rowHeight;

        this.grid[row].forEach((cell, col) => {
            const x = this.gridStartX + col * colWidth;
            this.createTile(cell.base, x, y, row, col);
        });
    }
    
    deleteGap(row, col) {
        if (this.grid[row][col]?.base !== '-') return;
        this.hideTargetAlignment();
        this.saveHistory();
        this.hasMoved = true;
        this.lastInteractionTime = Date.now();
        this.inactivityHintShown = false;
        this.clearInactivityHint();
        this.clearWorstHighlights();

        this.hideColumnInfo();

        const cell = this.grid[row][col];
        cell.tile?.destroy();
        cell.text?.destroy();

        this.grid[row].splice(col, 1);

        this.recreateAll();
        this.calculateScore();
    }
    
    
    
    trimAllGapColumnsRight(rows) {
        let end = rows[0].length;
        while (end > 0) {
            let allGaps = true;
            for (const r of rows) {
                if (r[end - 1] !== '-') {
                    allGaps = false;
                    break;
                }
            }
            if (!allGaps) break;
            end--;
        }
        return rows.map(r => r.slice(0, end));
    }
    
    calculateScore() {
        const maxLen = Math.max(...this.grid.map(row => row.length));
        const alignedRows = this.grid.map(row => {
            const bases = row.map(cell => cell.base).join('');
            return bases + '-'.repeat(maxLen - bases.length);
        });

        this.lastAlignedRows = alignedRows;
        this.score = scoreAlignmentSP(alignedRows, this.scoring);

        const allRowsSameLength = this.grid.every(row => row.length === maxLen);

        if (this.mode === 'learning') {
            this.totalText?.setText(`${config.text.game.scoreLabel} ${this.score}`);
            this.updateColumnIndicators();
        }

        if (this.hasMoved && this.score >= this.targetScore && allRowsSameLength && !this._optimalShown) {
            this._optimalShown = true;
            BioPhaser.UI.Notification.show(this, 'Pasiekei optimalų balą! 🎉', 'success', 3000);
        }

        this.updateAnalysisPanel();
    }
    
    positionColTip(pointer) {
        const pad = 12;
        const offsetX = 20;
        const offsetY = 20;
        
        let x = pointer.x + offsetX;
        let y = pointer.y + offsetY;
        
        const w = this.colTipBg.width;
        const h = this.colTipBg.height;
        
        x = Math.max(pad, Math.min(UI.W - pad - w, x));
        y = Math.max(pad, Math.min(UI.H - pad - h, y));
        
        this.colTip.x = x;
        this.colTip.y = y;
    }
    
    showColumnInfo(col, pointer = this.input.activePointer) {
        if (!this.colTip || !this.lastAlignedRows || this.lastAlignedRows.length === 0) return;
        
        const L = this.lastAlignedRows[0].length;
        if (col < 0 || col >= L) {
            this.colTip.setVisible(false);
            return;
        }
        
        const info = columnBreakdown(this.lastAlignedRows, col, this.scoring);
        
        const charsLine = info.chars.join(' ');
        const totalPairs = info.matchPairs + info.mismatchPairs + info.gapPairs + info.gapGapPairs;
        
        const text =
            `${config.text.game.columnTooltip.columnPrefix} ${col + 1}:  ${charsLine}\n` +
            `${config.text.game.columnTooltip.sumLabel} ${info.total}`;
        
        this.colTipText.setText(text);
        
        const textWidth = this.colTipText.width;
        const textHeight = this.colTipText.height;
        const padding = 16;
        
        this.colTipBg.width = textWidth + padding * 2;
        this.colTipBg.height = textHeight + padding * 2;
        
        this.colTip.setVisible(true);
        this.positionColTip(pointer);
    }
    
    hideColumnInfo() {
        if (this.colTip) this.colTip.setVisible(false);
    }
    
    
    showWin() {
    }


    startCountdown() {
        const times = MODE_TIMER[this.mode] || {};
        this.timerSeconds = times[this.difficulty] ?? 300;
        this.updateTimerDisplay();
        this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => {
                if (this.timerSeconds <= 0) return;
                this.timerSeconds--;
                this.updateTimerDisplay();
                if (this.timerSeconds <= 0) this.timeUp();
            }
        });
    }

    updateTimerDisplay() {
        if (!this.timerText) return;
        const m = Math.floor(this.timerSeconds / 60);
        const s = this.timerSeconds % 60;
        const str = `⏱ ${m}:${s.toString().padStart(2, '0')}`;
        const color = this.timerSeconds < 30 ? '#e74c3c' : this.timerSeconds < 60 ? '#f39c12' : UI.colors.muted;
        this.timerText.setText(str).setColor(color);
    }

    timeUp() {
        BioPhaser.UI.Notification.show(this, 'Laikas baigėsi! ⏰', 'warning', 2000);
        this.addTimer({ delay: 2100, callback: () => this.showSubmitModal() });
    }


    updateColumnIndicators() {
        this.colIndicators.forEach(ind => ind.destroy());
        this.colIndicators = [];
        if (this.mode !== 'learning' || !this.lastAlignedRows || !this.lastAlignedRows.length) return;

        const maxLen = this.lastAlignedRows[0].length;
        let L = 0;
        for (let c = 0; c < maxLen; c++) {
            if (this.lastAlignedRows.some(row => row[c] !== '-')) L = c + 1;
        }
        const startX = this.gridStartX;
        const colW = this.tileSize + this.tileGap;
        const indicatorY = this.gridStartY - this.tileSize / 2 - 9;

        for (let c = 0; c < L; c++) {
            const info = columnBreakdown(this.lastAlignedRows, c, this.scoring);
            const color = info.total > 0 ? 0x27ae60 : info.total === 0 ? 0xf39c12 : 0xe74c3c;
            const ind = this.add.rectangle(startX + c * colW, indicatorY, this.tileSize - 4, 5, color, 0.95);
            ind.setDepth(12);
            this.layers.ui.add(ind);
            this.colIndicators.push(ind);
        }
    }


    showSubmitModal() {
        if (this._submitModal) { this._submitModal.destroy(true); this._submitModal = null; }
        if (this._modalContBtn) { this._modalContBtn.destroy(); this._modalContBtn = null; }
        if (this._modalOptBtn)  { this._modalOptBtn.destroy();  this._modalOptBtn = null; }

        const pct = this.targetScore > 0
            ? Math.max(0, Math.min(100, Math.round(this.score / this.targetScore * 100)))
            : (this.score >= 0 ? 100 : 0);
        const baseStars = pct >= 100 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0;
        const stars = Math.max(0, baseStars - this.helpPenalties);

        Progress.save('alignment', { score: this.score, total: this.targetScore });

        const cx = UI.CX, cy = Math.round(UI.H * 0.46);
        const mw = 760, mh = 470;

        this._submitModal = this.add.container(0, 0);
        this._submitModal.setDepth(600);

        const bg = this.add.rectangle(cx, cy, mw, mh, 0xffffff, 0.98);
        bg.setStrokeStyle(2, toHex(THEME.primary));
        this._submitModal.add(bg);

        const topStrip = this.add.rectangle(cx, cy - mh / 2 + 22, mw, 44, toHex(THEME.primary), 0.1);
        this._submitModal.add(topStrip);

        const titleTxt = this.add.text(cx, cy - mh / 2 + 22, 'Bandymas baigtas!', {
            fontSize: '26px', fontStyle: 'bold', color: THEME.primary, fontFamily: FONT
        }).setOrigin(0.5);
        this._submitModal.add(titleTxt);

        const scoreTxt = this.add.text(cx - 180, cy - 100,
            `Balas: ${this.score}`, {
            fontSize: '22px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
        }).setOrigin(0, 0.5);
        this._submitModal.add(scoreTxt);

        const pctColor = pct >= 75 ? THEME.primary : pct >= 50 ? THEME.warning : THEME.danger;
        const pctTxt = this.add.text(cx + 180, cy - 100, `${pct}%`, {
            fontSize: '28px', fontStyle: 'bold', color: pctColor, fontFamily: FONT
        }).setOrigin(1, 0.5);
        this._submitModal.add(pctTxt);

        const starColor = stars === 3 ? THEME.primary : stars === 2 ? THEME.warning : stars === 1 ? '#e67e22' : THEME.muted;
        const starStr = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
        const starTxt = this.add.text(cx, cy - 28, starStr, {
            fontSize: '56px', color: starColor, fontFamily: FONT
        }).setOrigin(0.5);
        this._submitModal.add(starTxt);

        const comment = pct >= 100 ? 'Puikus rezultatas!' : pct >= 75 ? 'Labai gerai!' : pct >= 50 ? 'Neblogai, galima geriau.' : 'Dar pasitreniruok.';
        const commentTxt = this.add.text(cx, cy + 34, comment, {
            fontSize: '15px', color: THEME.muted, fontFamily: FONT, fontStyle: 'italic'
        }).setOrigin(0.5);
        this._submitModal.add(commentTxt);

        if (this.helpPenalties > 0) {
            const penTxt = this.add.text(cx, cy + 62,
                `(naudota ${this.helpPenalties} pagalba — atimta iš žvaigždžių)`, {
                fontSize: '12px', color: THEME.muted, fontFamily: FONT, fontStyle: 'italic'
            }).setOrigin(0.5);
            this._submitModal.add(penTxt);
        }

        const topBtnY = cy + mh / 2 - 108;
        const bottomBtnY = cy + mh / 2 - 52;

        const contBg = this.add.rectangle(cx - 120, topBtnY, 200, 46, toHex(THEME.info))
            .setInteractive({ useHandCursor: true });
        const contTxt = this.add.text(cx - 120, topBtnY, 'Tobulinti', {
            fontSize: '16px', color: '#ffffff', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this._submitModal.add([contBg, contTxt]);
        contBg.on('pointerover', () => contBg.setFillStyle(toHex(THEME.infoHover)));
        contBg.on('pointerout',  () => contBg.setFillStyle(toHex(THEME.info)));
        contBg.on('pointerdown', () => {
            if (this._submitModal) { this._submitModal.destroy(true); this._submitModal = null; }
            this.highlightWorstColumns();
        });
        this._modalContBtn = contBg;

        const optBg = this.add.rectangle(cx + 120, topBtnY, 200, 46, toHex(THEME.primary))
            .setInteractive({ useHandCursor: true });
        const optTxt = this.add.text(cx + 120, topBtnY, 'Rodyti optimalų', {
            fontSize: '16px', color: '#ffffff', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this._submitModal.add([optBg, optTxt]);
        optBg.on('pointerover', () => optBg.setFillStyle(toHex(THEME.primaryHover)));
        optBg.on('pointerout',  () => optBg.setFillStyle(toHex(THEME.primary)));
        optBg.on('pointerdown', () => {
            if (this._submitModal) { this._submitModal.destroy(true); this._submitModal = null; }
            this.showTargetAlignment();
        });
        this._modalOptBtn = optBg;

        const menuBg = this.add.rectangle(cx - 120, bottomBtnY, 200, 46, 0xF1F5F9)
            .setStrokeStyle(2, 0xD1D5DB).setInteractive({ useHandCursor: true });
        const menuTxt = this.add.text(cx - 120, bottomBtnY, '← Meniu', {
            fontSize: '16px', color: '#374151', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this._submitModal.add([menuBg, menuTxt]);
        menuBg.on('pointerover', () => menuBg.setFillStyle(0xE2E8F0));
        menuBg.on('pointerout',  () => menuBg.setFillStyle(0xF1F5F9));
        menuBg.on('pointerdown', () => this.scene.start('Setup'));

        const replayBg = this.add.rectangle(cx + 120, bottomBtnY, 200, 46, toHex(THEME.primary))
            .setInteractive({ useHandCursor: true });
        const replayTxt = this.add.text(cx + 120, bottomBtnY, 'Žaisti dar kartą', {
            fontSize: '16px', color: '#ffffff', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this._submitModal.add([replayBg, replayTxt]);
        replayBg.on('pointerover', () => replayBg.setFillStyle(toHex(THEME.primaryHover)));
        replayBg.on('pointerout',  () => replayBg.setFillStyle(toHex(THEME.primary)));
        replayBg.on('pointerdown', () => {
            this.scene.start('Game', {
                numSequences: this.numSequences,
                difficulty: this.difficulty,
                mode: this.mode
            });
        });
    }


    highlightWorstColumns() {
        this.clearWorstHighlights();
        if (!this.lastAlignedRows || !this.lastAlignedRows.length) return;

        const L = this.lastAlignedRows[0].length;
        const colScores = Array.from({ length: L }, (_, c) => ({
            col: c, total: columnBreakdown(this.lastAlignedRows, c, this.scoring).total
        }));

        const negCols = colScores.filter(s => s.total < 0);
        if (!negCols.length) {
            BioPhaser.UI.Notification.show(this, 'Visi stulpeliai teigiami! Nėra ką taisyti.', 'success');
            return;
        }

        const minScore = negCols.reduce((m, s) => Math.min(m, s.total), Infinity);
        const threshold = negCols.length > 1
            ? negCols.sort((a, b) => a.total - b.total)[Math.ceil(negCols.length / 3) - 1].total
            : minScore;
        const worstCols = negCols.filter(s => s.total <= threshold).map(s => s.col);

        const startX = this.gridStartX;
        const startY = this.gridStartY;
        const colW = this.tileSize + this.tileGap;
        const rowH = this.tileSize + this.tileGap;
        const gridH = this.numSequences * rowH;
        const centerY = startY + (this.numSequences - 1) * rowH / 2;

        worstCols.forEach(col => {
            const ov = this.add.rectangle(startX + col * colW, centerY, this.tileSize, gridH, 0xe74c3c, 0.28);
            ov.setDepth(8);
            this.worstColHighlights.push(ov);
        });
    }

    clearWorstHighlights() {
        this.worstColHighlights.forEach(r => r.destroy());
        this.worstColHighlights = [];
    }


    getWorstColumn() {
        if (!this.lastAlignedRows || !this.lastAlignedRows.length) return null;
        const L = this.lastAlignedRows[0].length;
        let worst = 0, worstVal = Infinity;
        for (let c = 0; c < L; c++) {
            const t = columnBreakdown(this.lastAlignedRows, c, this.scoring).total;
            if (t < worstVal) { worstVal = t; worst = c; }
        }
        return worst;
    }

    checkInactivity() {
        if (!this.hasMoved) return;
        const elapsed = (Date.now() - this.lastInteractionTime) / 1000;
        if (elapsed >= 20 && !this.inactivityHintShown) {
            this.inactivityHintShown = true;
            this.showInactivityHint();
        }
    }

    showInactivityHint() {
        const worst = this.getWorstColumn();
        if (worst === null) return;
        const info = columnBreakdown(this.lastAlignedRows, worst, this.scoring);
        if (this._panelTip) {
            this._panelTip.setText(
                `Stulpelis ${worst + 1} turi mažiausią vertę (${info.total}).\nBandyk ten perkelti arba\npridėti tarpą.`
            );
        }
    }

    clearInactivityHint() {
        if (this.inactivityHintText) { this.inactivityHintText.destroy(); this.inactivityHintText = null; }
    }

    handleHelp() {
        this.helpPenalties = Math.min(3, this.helpPenalties + 1);
        const worst = this.getWorstColumn();
        if (worst === null) return;

        const info = columnBreakdown(this.lastAlignedRows, worst, this.scoring);
        const chars = info.chars.join(' · ');

        if (this._panelTip) {
            this._panelTip.setText(
                `Stulpelis ${worst + 1}: [${chars}]\nSuma: ${info.total}. Bandyk perkelti\narba įterpti tarpą šiame stulpelyje.`
            );
        }

        const label = this.helpPenalties >= 3
            ? '(daugiau pagalbos nėra)'
            : `(-${this.helpPenalties} žvaigždučių galutiniame įvertinime)`;
        BioPhaser.UI.Notification.show(this, `Pagalba suteikta! ${label}`, 'warning', 3000);
    }

    toggleSolution() {
        this.showingSolution = !this.showingSolution;
        if (!this.showingSolution) {
            this.hideTargetAlignment();
        }
    }
    
    showTargetAlignment() {
        this.hideTargetAlignment();
        this.showingSolution = true;

        const cx = UI.CX;
        const numSeqs = this.sequences.length;

        const tw = 34, tg = 3, cw = tw + tg, rh = tw + tg;

        const modalW = 820;
        const modalH = Math.max(300, 130 + numSeqs * rh + 80);
        const modalY = Math.min(460, 130 + modalH / 2);

        this.solutionContainer = this.add.container(0, 0);
        this.solutionContainer.setDepth(480);

        const overlay = this.add.rectangle(cx, UI.H / 2, UI.W, UI.H, 0x000000, 0.55);
        overlay.setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => this.hideTargetAlignment());
        this.solutionContainer.add(overlay);

        const box = this.add.rectangle(cx, modalY, modalW, modalH, 0xffffff, 0.98);
        box.setStrokeStyle(2, 0x27ae60);
        this.solutionContainer.add(box);

        const stripY = modalY - modalH / 2 + 20;
        const strip = this.add.rectangle(cx, stripY, modalW, 32, 0xf0fdf4, 1);
        this.solutionContainer.add(strip);

        const titleTxt = this.add.text(cx, stripY, config.text.game.solutionTitle, {
            fontSize: '16px', fontStyle: 'bold', color: '#16a34a', fontFamily: FONT
        }).setOrigin(0.5);
        this.solutionContainer.add(titleTxt);

        const scoreLnY = stripY + 30;
        const scoreTxt = this.add.text(cx, scoreLnY, `Optimalus balas: ${this.targetScore}`, {
            fontSize: '13px', color: '#64748b', fontFamily: FONT
        }).setOrigin(0.5);
        this.solutionContainer.add(scoreTxt);

        const orderedRows = this.sequences.map(orig => {
            for (const row of this.targetAlignment) {
                if (row.replace(/-/g, '') === orig) return row;
            }
            return null;
        });

        const maxCols = Math.max(...orderedRows.filter(Boolean).map(r => r.length));
        const labW = 38;
        const blockW = labW + maxCols * cw - tg;
        const blockStartX = cx - blockW / 2;
        const labCX = blockStartX + labW / 2;
        const firstTileX = blockStartX + labW + tw / 2;
        const seqStartY = scoreLnY + 28;

        orderedRows.forEach((row, r) => {
            if (!row) return;
            const ry = seqStartY + r * rh;

            const lbl = this.add.text(labCX, ry, `S${r + 1}`, {
                fontSize: '13px', fontStyle: 'bold', color: '#16a34a', fontFamily: FONT
            }).setOrigin(0.5);
            this.solutionContainer.add(lbl);

            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const tx = firstTileX + c * cw;
                const colHex = parseInt((config.gameplay.baseColors[ch] || '#95a5a6').replace('#', '0x'));
                const rect = this.add.rectangle(tx, ry, tw, tw, colHex, ch === '-' ? 0.45 : 0.95);
                rect.setStrokeStyle(ch === '-' ? 1 : 2, 0x27ae60);
                const txt = this.add.text(tx, ry, ch, {
                    fontSize: '14px', fontStyle: 'bold', color: '#ffffff', fontFamily: 'monospace'
                }).setOrigin(0.5);
                this.solutionContainer.add([rect, txt]);
            }
        });

        const closeY = modalY + modalH / 2 - 32;
        const closeBg = this.add.rectangle(cx, closeY, 150, 36, 0x27ae60, 1)
            .setInteractive({ useHandCursor: true });
        const closeLbl = this.add.text(cx, closeY, 'Uždaryti', {
            fontSize: '14px', fontStyle: 'bold', color: '#ffffff', fontFamily: FONT
        }).setOrigin(0.5);
        closeBg.on('pointerover', () => closeBg.setFillStyle(0x219150));
        closeBg.on('pointerout',  () => closeBg.setFillStyle(0x27ae60));
        closeBg.on('pointerdown', () => this.hideTargetAlignment());
        this.solutionContainer.add([closeBg, closeLbl]);
    }

    hideTargetAlignment() {
        this.showingSolution = false;
        if (this.solutionContainer) {
            this.solutionContainer.destroy(true);
            this.solutionContainer = null;
        }
    }
}

const MODE_TIMER = {
    training: { easy: 480, medium: 300, hard: 180 },
    challenge: { easy: 240, medium: 150, hard: 90 }
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBase(except = null, bases) {
    const choices = except ? bases.filter(b => b !== except) : bases;
    return choices[randInt(0, choices.length - 1)];
}

// Sum-of-pairs balas apskaičiuojamas sudedant visų porų įnašus kiekviename stulpelyje.
// Šis vertinimas naudojamas lyginant vartotojo sprendimą su etaloniniu rezultatu.
function scoreAlignmentSP(alignedRows, scoring) {
    const n = alignedRows.length;
    if (n < 2) return 0;
    const L = alignedRows[0].length;

    let total = 0;

    for (let col = 0; col < L; col++) {
        for (let i = 0; i < n; i++) {
        const a = alignedRows[i][col];
        for (let j = i + 1; j < n; j++) {
            const b = alignedRows[j][col];

            if (a === '-' && b === '-') {
            } else if (a === '-' || b === '-') {
            total += scoring.gap;
            } else if (a === b) {
            total += scoring.match;
            } else {
            total += scoring.mismatch;
            }
        }
        }
    }

    return total;
}

function countGoodColumns(alignedRows) {
    const L = alignedRows[0].length;
    let good = 0;
    for (let c = 0; c < L; c++) {
        const freq = new Map();
        for (const row of alignedRows) {
        const ch = row[c];
        if (ch === '-') continue;
        freq.set(ch, (freq.get(ch) || 0) + 1);
        }
        if (Math.max(0, ...freq.values()) >= 2) good++;
    }
    return good;
}

function generateReferenceSequence(Lref, bases) {
    return Array.from({ length: Lref }, () => randomBase(null, bases)).join('');
}

// Sekos generuojamos iš bendros referencinės sekos,
// sąmoningai įterpiant mutacijas ir indelius, kad užduotis būtų realistiškesnė.
function generateSequences({ numSeq, minLen, maxLen, similarity, ref = null, allowWindow = true, bases }) {
    const Lref = randInt(Math.max(minLen, 4), Math.max(maxLen, minLen));
    const reference = ref || generateReferenceSequence(Lref, bases);

    const sequences = [];
    for (let i = 0; i < numSeq; i++) {
        let seq = reference;
        
        let mutated = '';
        for (let p = 0; p < seq.length; p++) {
        const ch = seq[p];
        if (Math.random() <= similarity) {
            mutated += ch;
        } else {
            mutated += randomBase(ch, bases);
        }
        }
        seq = mutated;
        
        const numIndels = randInt(1, 3);
        for (let k = 0; k < numIndels; k++) {
        const pos = randInt(0, seq.length);
        if (Math.random() < 0.5 && seq.length > minLen) {
            // DELETION: remove a base
            seq = seq.slice(0, pos) + seq.slice(pos + 1);
        } else if (seq.length < maxLen) {
            // INSERTION: add a random base
            seq = seq.slice(0, pos) + randomBase(null, bases) + seq.slice(pos);
        }
        }
        
        sequences.push(seq);
    }

    return { reference, sequences };
    }

    function pairScore(a, b, scoring) {
    if (a === '-' && b === '-') return 0;
    if (a === '-' || b === '-') return scoring.gap;
    if (a === b) return scoring.match;
    return scoring.mismatch;
}

function columnBreakdown(alignedRows, col, scoring) {
    const n = alignedRows.length;
    let matchPairs = 0, mismatchPairs = 0, gapPairs = 0, gapGapPairs = 0;
    let total = 0;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
        const a = alignedRows[i][col] ?? '-';
        const b = alignedRows[j][col] ?? '-';

        if (a === '-' && b === '-') {
            gapGapPairs++;
        } else if (a === '-' || b === '-') {
            gapPairs++;
            total += scoring.gap;
        } else if (a === b) {
            matchPairs++;
            total += scoring.match;
        } else {
            mismatchPairs++;
            total += scoring.mismatch;
        }
        }
    }

    const chars = alignedRows.map(r => r[col] ?? '-');
    return { col, chars, matchPairs, mismatchPairs, gapPairs, gapGapPairs, total };
}

function needlemanWunsch(a, b, scoring) {
    const n = a.length;
    const m = b.length;

    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    const bt = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));

    for (let i = 1; i <= n; i++) {
        dp[i][0] = dp[i - 1][0] + scoring.gap;
        bt[i][0] = 'U';
    }
    for (let j = 1; j <= m; j++) {
        dp[0][j] = dp[0][j - 1] + scoring.gap;
        bt[0][j] = 'L';
    }

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
        const diag = dp[i - 1][j - 1] + pairScore(a[i - 1], b[j - 1], scoring);
        const up   = dp[i - 1][j] + scoring.gap;
        const left = dp[i][j - 1] + scoring.gap;

        let best = diag;
        let move = 'D';
        if (up > best) { best = up; move = 'U'; }
        if (left > best) { best = left; move = 'L'; }

        dp[i][j] = best;
        bt[i][j] = move;
        }
    }

    let i = n, j = m;
    let alignedA = '';
    let alignedB = '';
    while (i > 0 || j > 0) {
        const move = bt[i][j];
        if (move === 'D') {
        alignedA = a[i - 1] + alignedA;
        alignedB = b[j - 1] + alignedB;
        i--; j--;
        } else if (move === 'U') {
        alignedA = a[i - 1] + alignedA;
        alignedB = '-' + alignedB;
        i--;
        } else {
        alignedA = '-' + alignedA;
        alignedB = b[j - 1] + alignedB;
        j--;
        }
    }

    return { alignedA, alignedB, score: dp[n][m] };
}

function colScoreWithSeq(profileRows, colIndex, seqChar, scoring) {
    let s = 0;
    for (const row of profileRows) {
        s += pairScore(row[colIndex], seqChar, scoring);
    }
    return s;
}

function colScoreGapInSeq(profileRows, colIndex, scoring) {
    let s = 0;
    for (const row of profileRows) {
        s += pairScore(row[colIndex], '-', scoring);
    }
    return s;
}

function gapColScoreWithSeq(profileRows, seqChar, scoring) {
    let s = 0;
    for (let k = 0; k < profileRows.length; k++) {
        s += pairScore('-', seqChar, scoring);
    }
    return s;
    }

// Jei sekų yra daugiau nei dvi, nauja seka lygiuojama prie jau suformuoto profilio,
// o ne prie vienos sekos. Taip gaunamas progresyvus daugybinis išlyginimas.
function alignProfileToSequence(profileRows, seq, scoring) {
    const P = profileRows[0].length;
    const M = seq.length;

    const dp = Array.from({ length: P + 1 }, () => Array(M + 1).fill(-Infinity));
    const bt = Array.from({ length: P + 1 }, () => Array(M + 1).fill(null));

    dp[0][0] = 0;

    for (let i = 1; i <= P; i++) {
        dp[i][0] = dp[i - 1][0] + colScoreGapInSeq(profileRows, i - 1, scoring);
        bt[i][0] = 'U';
    }
    for (let j = 1; j <= M; j++) {
        dp[0][j] = dp[0][j - 1] + gapColScoreWithSeq(profileRows, seq[j - 1], scoring);
        bt[0][j] = 'L';
    }

    for (let i = 1; i <= P; i++) {
        for (let j = 1; j <= M; j++) {
        const seqChar = seq[j - 1];

        const diag = dp[i - 1][j - 1] + colScoreWithSeq(profileRows, i - 1, seqChar, scoring);
        const up   = dp[i - 1][j]     + colScoreGapInSeq(profileRows, i - 1, scoring);
        const left = dp[i][j - 1]     + gapColScoreWithSeq(profileRows, seqChar, scoring);

        let best = diag;
        let move = 'D';
        if (up > best) { best = up; move = 'U'; }
        if (left > best) { best = left; move = 'L'; }

        dp[i][j] = best;
        bt[i][j] = move;
        }
    }

    let i = P, j = M;
    let alignedSeq = '';
    const newProfile = profileRows.map(() => '');

    while (i > 0 || j > 0) {
        const move = bt[i][j];
        if (move === 'D') {
        for (let r = 0; r < profileRows.length; r++) {
            newProfile[r] = profileRows[r][i - 1] + newProfile[r];
        }
        alignedSeq = seq[j - 1] + alignedSeq;
        i--; j--;
        } else if (move === 'U') {
        for (let r = 0; r < profileRows.length; r++) {
            newProfile[r] = profileRows[r][i - 1] + newProfile[r];
        }
        alignedSeq = '-' + alignedSeq;
        i--;
        } else {
        for (let r = 0; r < profileRows.length; r++) {
            newProfile[r] = '-' + newProfile[r];
        }
        alignedSeq = seq[j - 1] + alignedSeq;
        j--;
        }
    }

    const rows = [...newProfile, alignedSeq];
    const score = scoreAlignmentSP(rows, scoring);
    return { rows, score };
}

function progressiveAlignment(seqs, scoring) {
    const base = seqs[0];

    const scored = seqs.slice(1).map(s => ({
        s,
        nw: needlemanWunsch(base, s, scoring).score
    }));

    scored.sort((a, b) => b.nw - a.nw);

    const first = scored.shift().s;
    const ab = needlemanWunsch(base, first, scoring);
    let profileRows = [ab.alignedA, ab.alignedB];

    for (const item of scored) {
        const res = alignProfileToSequence(profileRows, item.s, scoring);
        profileRows = res.rows;
    }

    return {
            alignedRows: profileRows,
            score: scoreAlignmentSP(profileRows, scoring)
        };
}

// Ši funkcija parenka, kurį metodą taikyti etaloniniam balui gauti:
// porinį Needleman-Wunsch arba progresyvų daugybinį išlyginimą.
function computeTargetScore(seqs, scoring) {
    if (seqs.length === 2) {
        const r = needlemanWunsch(seqs[0], seqs[1], scoring);
        return { targetScore: r.score, targetAlignment: [r.alignedA, r.alignedB], method: 'NW' };
    } else {
        const r = progressiveAlignment(seqs, scoring);
        return { targetScore: r.score, targetAlignment: r.alignedRows, method: 'PROGRESSIVE' };
    }
}

const Alignment = {
    scoreAlignmentSP,
    countGoodColumns,
    generateSequences,
    needlemanWunsch,
    progressiveAlignment,
    computeTargetScore
};

const engine = new BioPhaser.Engine({
    type: Phaser.AUTO,
    width: UI.W,
    height: UI.H,
    backgroundColor: '#ffffff',
    parent: 'game-container'
});

engine.registerScene(StartScene);
engine.registerScene(TutorialScene);
engine.registerScene(SetupScene);
engine.registerScene(GameScene);
engine.start();
