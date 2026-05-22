import { BioPhaser } from '../core/bio-phaser.js';
import { Progress } from '../core/progress.js';

// Aminorūgščių klasifikavimo modulis apjungia įžanginę dalį,
// klasifikavimo tipo pasirinkimą ir pačią treniruotės sceną.
const config = await BioPhaser.Utils.ConfigLoader.load('config/amino-acid-classification.json');

const FONT  = BioPhaser.Theme.font;
const THEME = BioPhaser.Theme.colors;

const AMINO_STRUCTURE_FILES = {
    Ala: 'assets/amino/Ala.svg',
    Arg: 'assets/amino/Arg.svg',
    Asn: 'assets/amino/Asn.svg',
    Asp: 'assets/amino/Asp.svg',
    Cys: 'assets/amino/Cys.svg',
    Gln: 'assets/amino/Gln.svg',
    Glu: 'assets/amino/Glu.svg',
    Gly: 'assets/amino/Gly.svg',
    His: 'assets/amino/His.svg',
    Ile: 'assets/amino/Ile.svg',
    Leu: 'assets/amino/Leu.svg',
    Lys: 'assets/amino/Lys.svg',
    Met: 'assets/amino/Met.svg',
    Phe: 'assets/amino/Phe.svg',
    Pro: 'assets/amino/Pro.svg',
    Ser: 'assets/amino/Ser.svg',
    Thr: 'assets/amino/Thr.svg',
    Trp: 'assets/amino/Trp.svg',
    Tyr: 'assets/amino/Tyr.svg',
    Val: 'assets/amino/Val.png'
};

/**
 * UI konstantos - centralizuotas dizaino sistema
 * Naudojama visoje aplikacijoje vienodai išvaizdai
 */
const UI = {
  W: config.ui.dimensions.width,
  H: config.ui.dimensions.height,
  CX: config.ui.dimensions.centerX,

  headerY: config.ui.layout.headerY,
  headerH: config.ui.layout.headerH,

  contentTop: config.ui.layout.contentTop,
  footerY: config.ui.layout.footerY,

  cardW: config.ui.layout.cardW,
  cardH: config.ui.layout.cardH,
  gap: config.ui.layout.gap,

  choiceW: config.ui.layout.choiceW,
  choiceH: config.ui.layout.choiceH,
  choiceGapX: config.ui.layout.choiceGapX,
  choiceGapY: config.ui.layout.choiceGapY,

  colors: {
    text: config.ui.colors.text,
    muted: config.ui.colors.muted,
    white: parseInt(config.ui.colors.white),
    stroke: parseInt(config.ui.colors.stroke),
    primary: config.ui.colors.primary,
    primaryHover: config.ui.colors.primaryHover,
    info: config.ui.colors.info,
    infoHover: config.ui.colors.infoHover,
    danger: config.ui.colors.danger,
    warn: config.ui.colors.warn
  }
};

function preloadAminoStructures(scene) {
    Object.entries(AMINO_STRUCTURE_FILES).forEach(([key, path]) => {
        scene.load.image(`amino_${key}`, path);
    });
}

// ========================================
// START SCENE - Navigacija ir pamokos
// ========================================

class AminoStartScene extends BioPhaser.BioScene {
    constructor() {
        super('AminoStart', config);
        this.selectedClassificationType = null;
        this.step = 0;
        this.lessonPage = 0;
        this.step1Animated = false;
        this.step1Dna = null;
        this.step1DnaTween = null;
    }
    
    init(data) {
        super.init(data);
    }
    
    preload() {
        BioPhaser.Utils.AssetLoader.preloadFromConfig(this, config);
        this.load.image('particlesDecor', 'assets/particles.png');
        preloadAminoStructures(this);
    }

    create() {
        this.createLayers();
        BioPhaser.UI.Helpers.addMenuButton(this);

        this.selectedClassificationType = null;
        this.step = 0;
        this.lessonPage = 0;

        BioPhaser.UI.Helpers.createStandardBackground(this);
        
        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);
        
        this.showCurrentStep();
    }
    
    /**
     * Sukuria header elementus su title ir subtitle
     */
    renderHeader({ title, subtitle, y }) {
        const headerY = y ?? UI.headerY;
        const headerW = Math.min(1100, UI.W - 180);
        
        const bg = this.add.rectangle(UI.CX, headerY, headerW, UI.headerH, UI.colors.white, 0.86);
        bg.setStrokeStyle(2, UI.colors.stroke);
        this.layers.ui.add(bg);
        
        const t = this.add.text(UI.CX, headerY - 14, title, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(t);
        
        if (subtitle) {
            const s = this.add.text(UI.CX, headerY + 16, subtitle, {
                fontSize: '14px',
                color: UI.colors.muted,
                fontStyle: 'italic',
                fontFamily: FONT
            }).setOrigin(0.5);
            this.layers.ui.add(s);
        }
    }
    
    /**
     * Sukuria footer su "Atgal" ir pirminiu mygtukais
     */
    renderFooter({ backEnabled, primaryText, primaryEnabled, onBack, onPrimary }) {
        const backX = 180;
        const primaryX = UI.W - 180;
        const backBtn = this.addUI(
            new BioPhaser.UI.Button(this, backX, UI.footerY, config.text.start.buttonBack, {
                fontSize: '18px',
                backgroundColor: backEnabled ? UI.colors.info : '#95a5a6',
                width: 170,
                height: 48,
                padding: { left: 18, right: 18, top: 11, bottom: 11 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        backBtn.onClick(() => backEnabled && onBack?.());
        if (backEnabled) {
            backBtn.onHover(
                () => backBtn.setStyle({ backgroundColor: UI.colors.infoHover }),
                () => backBtn.setStyle({ backgroundColor: UI.colors.info })
            );
        }
        backBtn.create();
        
        const primaryBtn = this.addUI(
            new BioPhaser.UI.Button(this, primaryX, UI.footerY, primaryText, {
                fontSize: '18px',
                backgroundColor: primaryEnabled ? UI.colors.primary : '#95a5a6',
                width: 220,
                height: 50,
                padding: { left: 18, right: 18, top: 11, bottom: 11 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        primaryBtn.onClick(() => primaryEnabled && onPrimary?.());
        if (primaryEnabled) {
            primaryBtn.onHover(
                () => primaryBtn.setStyle({ backgroundColor: UI.colors.primaryHover }),
                () => primaryBtn.setStyle({ backgroundColor: UI.colors.primary })
            );
        }
        primaryBtn.create();
    }
    
    /**
     * Atvaizduoja dabartinį žingsnį
     * Išvalo UI ir rodo atitinkamą ekraną pagal this.step
     */
    showCurrentStep() {
        this.cleanupUI();
        
        switch(this.step) {
            case 0: this.showTitleScreen(); break;
            case 1: this.showClassificationTypeSelection(); break;
            case 2: this.showLessonScreen(); break;
        }
    }
    
    /**
     * Rodo pradinį titulinį ekraną
     * Su animuota DNA ikona ir "Pradėti" mygtuku
     */
    showTitleScreen() {
        if (this.step1Dna) this.step1Dna.setVisible(false);
        this.step1Animated = false;

        const leftX    = 210;
        const previewX = 1040;
        const previewY = 430;

        this.layers.ui.add(this.add.circle(100,  140, 100, parseInt(THEME.warning.replace('#', '0x')), 0.04));
        this.layers.ui.add(this.add.circle(1110, 730, 140, parseInt(THEME.primary.replace('#', '0x')), 0.035));
        this.layers.ui.add(this.add.circle(1030, 165,  75, parseInt(THEME.info.replace('#', '0x')), 0.03));

        this.layers.ui.add(
            this.add.text(leftX, 220, 'AMINORUGŠČIŲ KLASIFIKATORIUS', {
                fontSize: '13px', fontStyle: 'bold', color: THEME.primary,
                fontFamily: FONT, letterSpacing: 2
            }).setOrigin(0, 0.5)
        );

        
        this.layers.ui.add(
            this.add.text(leftX, 255, 'Aminorūgščių klasifikavimas', {
                fontSize: '60px', fontStyle: 'bold', color: THEME.text,
                fontFamily: FONT, wordWrap: { width: 500 }, lineSpacing: 4
            }).setOrigin(0, 0)
        );

        this.layers.ui.add(
            this.add.text(leftX, 430, 'Atpažink aminorūgščių savybes ir\npriskirk jas tinkamoms grupėms.', {
                fontSize: '19px', color: THEME.muted, fontFamily: FONT, lineSpacing: 8
            }).setOrigin(0, 0)
        );

        const chipColors = [THEME.primary, THEME.info, THEME.warning];
        ['Grupės', 'Savybės', 'Klasifikavimas'].forEach((label, i) => {
            const chipX = leftX + i * 164;
            const chipY = 545;
            const bg = this.add.rectangle(chipX + 66, chipY, 132, 38, 0xF8FAFC, 1);
            bg.setStrokeStyle(1, THEME.panelStroke);
            this.layers.ui.add(bg);
            const dot = this.add.circle(chipX + 14, chipY, 5, parseInt(chipColors[i].replace('#', '0x')), 1);
            const txt = this.add.text(chipX + 26, chipY, label, {
                fontSize: '14px', color: THEME.text, fontFamily: FONT, fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.layers.ui.add(dot);
            this.layers.ui.add(txt);
        });

        const startBtn = this.addUI(
            new BioPhaser.UI.Button(this, 340, 650, 'Pradėti', {
                fontSize: '22px',
                backgroundColor: THEME.primary,
                padding: { left: 52, right: 52, top: 18, bottom: 18 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        startBtn.onClick(() => { this.step = 1; this.showCurrentStep(); });
        startBtn.onHover(
            () => startBtn.setStyle({ backgroundColor: THEME.primaryHover }),
            () => startBtn.setStyle({ backgroundColor: THEME.primary })
        );
        startBtn.create();

        const cardBg = this.add.rectangle(previewX, previewY, 410, 390, THEME.panel, 0.97);
        cardBg.setStrokeStyle(2, THEME.panelStroke);
        this.layers.ui.add(cardBg);

        const stripY = previewY - 182;
        this.layers.ui.add(
            this.add.rectangle(previewX, stripY, 410, 34, parseInt(THEME.primary.replace('#', '0x')), 0.13)
        );
        this.layers.ui.add(
            this.add.text(previewX, stripY, 'Klasifikavimo pavyzdys', {
                fontSize: '14px', fontStyle: 'bold', color: THEME.primary, fontFamily: FONT
            }).setOrigin(0.5)
        );
        this.layers.ui.add(
            this.add.rectangle(previewX, stripY + 18, 384, 1, parseInt(THEME.primary.replace('#', '0x')), 0.18)
        );

        const previewData = [
            { abbr: 'Lys', group: 'Bazinė',   color: THEME.info },
            { abbr: 'Asp', group: 'Rūgštinė', color: THEME.danger },
            { abbr: 'Val', group: 'Nepolinė',  color: THEME.muted }
        ];
        previewData.forEach((row, i) => {
            const rowY     = (previewY - 86) + i * 82;
            const colorNum = parseInt(row.color.replace('#', '0x'));
            const tileX    = previewX - 118;

            const tile = this.add.rectangle(tileX, rowY, 68, 48, colorNum, 0.15);
            tile.setStrokeStyle(2, colorNum);
            this.layers.ui.add(tile);
            this.layers.ui.add(
                this.add.text(tileX, rowY, row.abbr, {
                    fontSize: '20px', fontStyle: 'bold', color: row.color, fontFamily: FONT
                }).setOrigin(0.5)
            );

            this.layers.ui.add(
                this.add.text(previewX - 52, rowY, '→', {
                    fontSize: '22px', color: THEME.muted, fontFamily: FONT
                }).setOrigin(0.5)
            );

            const groupBg = this.add.rectangle(previewX + 70, rowY, 164, 38, colorNum, 0.12);
            groupBg.setStrokeStyle(1, colorNum);
            this.layers.ui.add(groupBg);
            this.layers.ui.add(
                this.add.text(previewX + 70, rowY, row.group, {
                    fontSize: '17px', fontStyle: 'bold', color: row.color, fontFamily: FONT
                }).setOrigin(0.5)
            );
        });
    }
    
    /**
     * Rodo klasifikacijos tipo pasirinkimo ekraną
     * Vartotojas pasirenka: poliarumą, hidrofobiškumą arba aromatiškumą
     */
    showClassificationTypeSelection() {
        const centerX = this.scale.width / 2;

        if (!this.step1Dna) {
            this.step1Dna = this.add.image(centerX, 80, 'dna').setScale(0.15);
            this.layers.uiPersistent.add(this.step1Dna);
            
            this.step1DnaTween = this.addTween({
                targets: this.step1Dna,
                angle: 360,
                duration: 20000,
                repeat: -1
            });
            
            this.track(() => {
                this.step1DnaTween?.stop();
                this.step1Dna?.destroy();
            });
        } else {
            this.step1Dna.setVisible(true);
            this.step1Dna.setPosition(centerX, 80);
        }

        const panelX = UI.CX;
        const panelY = 430;
        const panelW = 900;
        const panelH = 480;
        const panelTop = panelY - panelH / 2;
        const titleY = panelTop + 58;
        const subtitleY = titleY + 42;

        const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0xFFFFFF, 0.96);
        panel.setStrokeStyle(1, 0xD8E2EC);
        panel.setDepth(20);
        this.layers.ui.add(panel);

        const title = this.add.text(centerX, titleY, 'Pasirink treniruotę', {
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#1F2937',
            fontFamily: FONT
        }).setOrigin(0.5).setDepth(21);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, subtitleY, 'Kokią aminorūgščių savybę nori mokytis?', {
            fontSize: '16px',
            color: '#64748B',
            fontFamily: FONT
        }).setOrigin(0.5).setDepth(21);
        this.layers.ui.add(subtitle);

        const divider = this.add.rectangle(UI.CX, subtitleY + 36, panelW - 100, 1, 0xE2E8F0, 1).setDepth(21);
        this.layers.ui.add(divider);
        
        const types = config.gameplay.classificationTypes;
        const rowW = 760;
        const rowH = 92;
        const rowGap = 18;
        const firstRowY = panelY - 55;
        
        types.forEach((type, i) => {
            const rowY = firstRowY + i * (rowH + rowGap);
            const isSelected = this.selectedClassificationType === type.id;
            const content = this.getClassificationCardContent(type.id);
            const accentColor = parseInt(content.color.replace('#', '0x'));

            const bg = this.add.rectangle(UI.CX, rowY, rowW, rowH, isSelected ? 0xECFDF5 : 0xF8FAFC, 1);
            bg.setStrokeStyle(isSelected ? 3 : 2, isSelected ? 0x10B981 : 0xE2E8F0);
            bg.setDepth(21);
            bg.setInteractive({ useHandCursor: true });
            this.layers.ui.add(bg);

            const iconX = UI.CX - rowW / 2 + 58;
            const iconBubble = this.add.circle(iconX, rowY, 24, accentColor, 0.12);
            iconBubble.setStrokeStyle(1.5, accentColor, 0.45);
            iconBubble.setDepth(21);
            this.layers.ui.add(iconBubble);

            const iconText = this.add.text(iconX, rowY, content.icon, {
                fontSize: '22px',
                fontStyle: 'bold',
                color: content.color,
                fontFamily: FONT
            }).setOrigin(0.5).setDepth(21);
            this.layers.ui.add(iconText);

            const textX = UI.CX - rowW / 2 + 104;
            const cardTitle = this.add.text(textX, rowY - 26, content.title, {
                fontSize: '22px',
                fontStyle: 'bold',
                color: '#1F2937',
                fontFamily: FONT
            }).setOrigin(0, 0).setDepth(21);
            this.layers.ui.add(cardTitle);

            const cardSubtitle = this.add.text(textX, rowY + 2, content.subtitle, {
                fontSize: '14px',
                color: '#64748B',
                fontFamily: FONT,
                wordWrap: { width: 470 }
            }).setOrigin(0, 0).setDepth(21);
            this.layers.ui.add(cardSubtitle);

            const groupsText = this.add.text(textX, rowY + 28, content.groups, {
                fontSize: '12px',
                color: '#94A3B8',
                fontFamily: FONT,
                wordWrap: { width: 470 }
            }).setOrigin(0, 0).setDepth(21);
            this.layers.ui.add(groupsText);

            const badgeX = UI.CX + rowW / 2 - 86;
            const badgeY = rowY - 16;
            let badgeBg = null;
            let badgeText = null;
            if (isSelected) {
                badgeBg = this.add.rectangle(badgeX, badgeY, 118, 28, 0xECFDF5, 1)
                    .setStrokeStyle(1, 0x10B981)
                    .setDepth(21);
                badgeText = this.add.text(badgeX, badgeY, '✓ Pasirinkta', {
                    fontSize: '12px',
                    color: '#10B981',
                    fontStyle: 'bold',
                    fontFamily: FONT
                }).setOrigin(0.5).setDepth(21);
                this.layers.ui.add(badgeBg);
                this.layers.ui.add(badgeText);
            } else {
                badgeBg = this.add.rectangle(badgeX, badgeY, 92, 28, 0xFFFFFF, 1)
                    .setStrokeStyle(1, 0xE2E8F0)
                    .setDepth(21);
                badgeText = this.add.text(badgeX, badgeY, content.meta, {
                    fontSize: '12px',
                    color: '#475569',
                    fontStyle: 'bold',
                    fontFamily: FONT
                }).setOrigin(0.5).setDepth(21);
                this.layers.ui.add(badgeBg);
                this.layers.ui.add(badgeText);
            }

            const hoverIn = () => {
                if (isSelected) return;
                bg.setStrokeStyle(2, accentColor);
                bg.setFillStyle(0xFFFFFF, 1);
            };
            const hoverOut = () => {
                if (isSelected) return;
                bg.setStrokeStyle(2, 0xE2E8F0);
                bg.setFillStyle(0xF8FAFC, 1);
            };
            const onSelect = () => {
                this.selectedClassificationType = type.id;
                this.showCurrentStep();
            };

            bg.on('pointerover', hoverIn);
            bg.on('pointerout', hoverOut);
            bg.on('pointerdown', onSelect);

            [iconBubble, iconText, cardTitle, cardSubtitle, groupsText, badgeBg, badgeText]
                .filter(Boolean)
                .forEach((el) => {
                    el.setInteractive?.({ useHandCursor: true });
                    el.on?.('pointerover', hoverIn);
                    el.on?.('pointerout', hoverOut);
                    el.on?.('pointerdown', onSelect);
                });
        });

        this.renderFooter({
            backEnabled: true,
            primaryText: 'Pradėti →',
            primaryEnabled: !!this.selectedClassificationType,
            onBack: () => {
                this.step = 0;
                this.showCurrentStep();
            },
            onPrimary: () => {
                if (!this.selectedClassificationType) return;
                this.lessonPage = 0;
                this.step = 2;
                this.showCurrentStep();
            }
        });
    }

    getClassificationCardContent(typeId) {
        const content = {
            polarumas: {
                title: 'Poliarumas',
                subtitle: 'Atskirk krūvį, polines ir nepolines grupes',
                groups: 'Nepolinės · Polinės neutralios · Rūgštinės · Bazinės',
                meta: '4 grupės',
                icon: '±',
                color: '#E74C3C'
            },
            hidrofobiskumas: {
                title: 'Hidrofobiškumas',
                subtitle: 'Įvertink, kaip šoninė grandinė sąveikauja su vandeniu',
                groups: 'Hidrofobinės · Hidrofilinės',
                meta: '2 grupės',
                icon: '≈',
                color: '#38BDF8'
            },
            aromatiskumas: {
                title: 'Aromatiškumas',
                subtitle: 'Ieškok aromatinio žiedo šoninėje grandinėje',
                groups: 'Aromatinės · Nearomatinės',
                meta: '2 grupės',
                icon: '⌬',
                color: '#A855F7'
            }
        };
        return content[typeId] || {
            title: 'Klasifikacija',
            subtitle: 'Pasirink savybę, kurią nori treniruoti',
            groups: 'Grupės',
            meta: '1 grupė',
            icon: '•',
            color: '#10B981'
        };
    }
    
    /**
     * Rodo pamokos ekraną su teorine medžiaga
     */
    showLessonScreen() {
        if (this.step1Dna) this.step1Dna.setVisible(false);

        const content = this.getRecognitionIntroContent(this.selectedClassificationType);
        if (!content) {
            this.step = 1;
            this.showCurrentStep();
            return;
        }

        const panelX = UI.CX;
        const panelY = 430;
        const panelW = 900;
        const panelH = 560;
        const top = panelY - panelH / 2;
        const panelBottom = panelY + panelH / 2;
        const depthBase = 25;
        const accent = parseInt(content.accentColor.replace('#', '0x'), 16);
        const page = this.lessonPage ?? 0;
        const pageHeaders = [
            '1 / 3 · Pagrindas',
            '2 / 3 · Grupės',
            '3 / 3 · Įsidėmėk'
        ];

        const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0xFFFFFF, 1);
        panel.setStrokeStyle(1, 0xD8E2EC);
        panel.setDepth(depthBase);
        this.layers.ui.add(panel);

        const title = this.add.text(panelX, top + 45, content.title, {
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#1F2937',
            fontFamily: FONT
        }).setOrigin(0.5);
        title.setDepth(depthBase + 2);
        this.layers.ui.add(title);

        const subtitle = this.add.text(panelX, top + 102, pageHeaders[page], {
            fontSize: '15px',
            color: content.accentColor,
            fontStyle: 'bold',
            fontFamily: FONT,
        }).setOrigin(0.5);
        subtitle.setDepth(depthBase + 2);
        this.layers.ui.add(subtitle);

        const divider = this.add.rectangle(panelX, top + 128, panelW - 90, 1, 0xE2E8F0, 1);
        divider.setDepth(depthBase + 1);
        this.layers.ui.add(divider);

        if (page === 0) {
            const introSubtitle = this.add.text(panelX, top + 150, content.subtitle, {
                fontSize: '15px',
                color: '#64748B',
                fontFamily: FONT,
                wordWrap: { width: 700 },
                align: 'center',
                lineSpacing: 4
            }).setOrigin(0.5, 0);
            introSubtitle.setDepth(depthBase + 2);
            this.layers.ui.add(introSubtitle);

            const ruleY = top + 300;
            const ruleW = 660;
            const ruleH = 230;
            const ruleBlock = this.add.rectangle(panelX, ruleY, ruleW, ruleH, 0xF8FAFC, 1);
            ruleBlock.setStrokeStyle(1, 0xE2E8F0);
            ruleBlock.setDepth(depthBase + 1);
            this.layers.ui.add(ruleBlock);

            const ruleAccent = this.add.rectangle(panelX - ruleW / 2 + 10, ruleY, 10, ruleH - 20, accent, 1);
            ruleAccent.setDepth(depthBase + 2);
            this.layers.ui.add(ruleAccent);

            const ruleTitle = this.add.text(panelX - ruleW / 2 + 34, ruleY - 70, 'Pagrindinė taisyklė', {
                fontSize: '20px',
                fontStyle: 'bold',
                color: content.accentColor,
                fontFamily: FONT
            }).setOrigin(0, 0);
            ruleTitle.setDepth(depthBase + 2);
            this.layers.ui.add(ruleTitle);

            const ruleText = this.add.text(panelX - ruleW / 2 + 34, ruleY - 20, content.mainRule, {
                fontSize: '18px',
                color: '#1F2937',
                fontFamily: FONT,
                wordWrap: { width: 560 },
                lineSpacing: 6
            }).setOrigin(0, 0);
            ruleText.setDepth(depthBase + 2);
            this.layers.ui.add(ruleText);

        } else if (page === 1) {
            const sectionTitleY = 300;
            const groupsTitle = this.add.text(panelX, sectionTitleY, 'Kaip atskirti grupes?', {
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#1F2937',
                fontFamily: FONT
            }).setOrigin(0.5, 0);
            groupsTitle.setDepth(depthBase + 2);
            this.layers.ui.add(groupsTitle);

            const isTwoGroupLayout = content.groupRules.length <= 2;
            const groupCardW = isTwoGroupLayout ? 390 : 360;
            const groupCardH = isTwoGroupLayout ? 165 : 130;
            const groupGapX = 32;
            const padX = 24;
            const positions = isTwoGroupLayout
                ? [
                    { x: UI.CX - groupCardW / 2 - groupGapX / 2, y: 435 },
                    { x: UI.CX + groupCardW / 2 + groupGapX / 2, y: 435 }
                ]
                : [
                    { x: UI.CX - 190, y: 405 },
                    { x: UI.CX + 190, y: 405 },
                    { x: UI.CX - 190, y: 555 },
                    { x: UI.CX + 190, y: 555 }
                ];

            content.groupRules.forEach((group, index) => {
                const { x, y } = positions[index];

                const card = this.add.rectangle(x, y, groupCardW, groupCardH, 0xFFFFFF, 1);
                card.setStrokeStyle(1, 0xE2E8F0);
                card.setDepth(depthBase + 1);
                this.layers.ui.add(card);

                const marker = this.add.circle(x - groupCardW / 2 + 24, y - groupCardH / 2 + 22, 6, accent, 1);
                marker.setDepth(depthBase + 2);
                this.layers.ui.add(marker);

                const titleY = y - groupCardH / 2 + 26;
                const label = this.add.text(x - groupCardW / 2 + 40, titleY, group.label, {
                    fontSize: '18px',
                    fontStyle: 'bold',
                    color: '#1F2937',
                    fontFamily: FONT
                }).setOrigin(0, 0);
                label.setDepth(depthBase + 2);
                this.layers.ui.add(label);

                const listY = titleY + 38;
                const listFontSize = isTwoGroupLayout ? '14px' : '13px';
                const groupList = this.add.text(x - groupCardW / 2 + padX, listY, group.list, {
                    fontSize: listFontSize,
                    color: '#475569',
                    fontFamily: FONT,
                    fontStyle: 'bold',
                    wordWrap: { width: groupCardW - 48 },
                    lineSpacing: 2
                }).setOrigin(0, 0);
                groupList.setDepth(depthBase + 2);
                this.layers.ui.add(groupList);

                const descY = groupList.y + groupList.height + 12;
                const groupText = this.add.text(x - groupCardW / 2 + padX, descY, group.note, {
                    fontSize: '14px',
                    color: '#64748B',
                    fontFamily: FONT,
                    wordWrap: { width: groupCardW - 48 },
                    lineSpacing: 2
                }).setOrigin(0, 0);
                groupText.setDepth(depthBase + 2);
                this.layers.ui.add(groupText);
            });
        } else {
            const trapY = top + 250;
            const trapW = 700;
            const trapH = 150;
            const trapBlock = this.add.rectangle(panelX, trapY, trapW, trapH, 0xFFF7ED, 1);
            trapBlock.setStrokeStyle(1, 0xFDBA74);
            trapBlock.setDepth(depthBase + 1);
            this.layers.ui.add(trapBlock);

            const trapTitle = this.add.text(panelX - trapW / 2 + 24, trapY - 46, 'Įsidėmėk', {
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#9A3412',
                fontFamily: FONT
            }).setOrigin(0, 0);
            trapTitle.setDepth(depthBase + 2);
            this.layers.ui.add(trapTitle);

            const trapText = this.add.text(panelX - trapW / 2 + 24, trapY - 8, content.trap, {
                fontSize: '15px',
                color: '#7C2D12',
                fontFamily: FONT,
                wordWrap: { width: 620 },
                lineSpacing: 5
            }).setOrigin(0, 0);
            trapText.setDepth(depthBase + 2);
            this.layers.ui.add(trapText);

            if (content.examples?.length) {
                const exampleTitle = this.add.text(panelX, top + 390, 'Pavyzdžiai', {
                    fontSize: '18px',
                    fontStyle: 'bold',
                    color: '#1F2937',
                    fontFamily: FONT
                }).setOrigin(0.5, 0);
                exampleTitle.setDepth(depthBase + 2);
                this.layers.ui.add(exampleTitle);

                const pillsY = top + 438;
                const pillGap = 14;
                const pillWidths = content.examples.map((example) => Math.max(150, example.length * 8 + 34));
                const totalWidth = pillWidths.reduce((sum, width) => sum + width, 0) + pillGap * (pillWidths.length - 1);
                let currentX = panelX - totalWidth / 2;

                content.examples.forEach((example, index) => {
                    const width = pillWidths[index];
                    const pillX = currentX + width / 2;
                    const pill = this.add.rectangle(pillX, pillsY, width, 34, 0xFFFFFF, 1);
                    pill.setStrokeStyle(1, 0xE2E8F0);
                    pill.setDepth(depthBase + 1);
                    this.layers.ui.add(pill);

                    const pillText = this.add.text(pillX, pillsY, example, {
                        fontSize: '13px',
                        color: '#475569',
                        fontFamily: FONT,
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    pillText.setDepth(depthBase + 2);
                    this.layers.ui.add(pillText);

                    currentX += width + pillGap;
                });
            }
        }

        const dotsY = panelBottom - 72;
        [0, 1, 2].forEach((index) => {
            const dot = this.add.circle(panelX + (index - 1) * 20, dotsY, 6, index === page ? accent : 0xCBD5E1, 1);
            dot.setDepth(depthBase + 2);
            this.layers.ui.add(dot);
        });

        const footerY = panelBottom - 42;
        const secondaryStyle = {
            fontSize: '16px',
            fontFamily: FONT,
            fontStyle: 'bold',
            width: 150,
            height: 44,
            backgroundColor: '#EAF2FB',
            color: '#334155'
        };
        const primaryStyle = {
            fontSize: '16px',
            fontFamily: FONT,
            fontStyle: 'bold',
            width: 230,
            height: 46,
            backgroundColor: '#10B981',
            color: '#FFFFFF'
        };

        const backBtn = this.addUI(new BioPhaser.UI.Button(
            this,
            panelX - 250,
            footerY,
            '← Atgal',
            { ...secondaryStyle, container: this.layers.ui }
        ));
        backBtn.onClick(() => {
            if (page === 0) {
                this.step = 1;
            } else {
                this.lessonPage = page - 1;
            }
            this.showCurrentStep();
        });
        backBtn.onHover(
            () => backBtn.setStyle({ backgroundColor: '#DCE8F5' }),
            () => backBtn.setStyle({ backgroundColor: '#EAF2FB' })
        );
        backBtn.create();

        const startBtn = this.addUI(new BioPhaser.UI.Button(
            this,
            panelX + 250,
            footerY,
            page === 2 ? 'Pradėti treniruotę →' : 'Toliau →',
            { ...primaryStyle, container: this.layers.ui }
        ));
        startBtn.onClick(() => {
            if (page < 2) {
                this.lessonPage = page + 1;
                this.showCurrentStep();
                return;
            }
            this.scene.start('AminoGame', {
                classificationType: this.selectedClassificationType,
                mode: 'full'
            });
        });
        startBtn.onHover(
            () => startBtn.setStyle({ backgroundColor: '#059669' }),
            () => startBtn.setStyle({ backgroundColor: '#10B981' })
        );
        startBtn.create();
    }

    getRecognitionIntroContent(classificationType) {
        const lesson = config.lessons?.[classificationType];
        if (!lesson) return null;

        return {
            title: lesson.title,
            subtitle: lesson.subtitle,
            mainRule: lesson.mainRule,
            groupRules: lesson.groups || [],
            trap: lesson.trap,
            examples: lesson.examples || [],
            accentColor: lesson.accentColor
        };
    }

    getTypeDescription(type) {
        if (type.groups) {
            const groupLabels = type.groups.map(g => config.groups[g]?.label).filter(Boolean);
            return groupLabels.join(', ');
        }
        if (type.property) {
            const prop = config.properties[type.property];
            if (prop) {
                return Object.values(prop).map(p => p.label).join(' / ');
            }
        }
        return '';
    }

    getTypeColor(type) {
        if (config.ui.typeColors[type.id]) {
            return config.ui.typeColors[type.id];
        }
        
        if (type.groups && type.groups.length > 0) {
            return config.groups[type.groups[0]]?.color || '#3498db';
        }
        if (type.property) {
            const prop = config.properties[type.property];
            if (prop) {
                const firstKey = Object.keys(prop)[0];
                return prop[firstKey]?.color || '#3498db';
            }
        }
        return '#3498db';
    }
    
    getTypeIcon(type) {
        if (type.groups && type.groups.length > 0) {
            return config.groups[type.groups[0]]?.icon || 'circle';
        }
        if (type.property) {
            const prop = config.properties[type.property];
            if (prop) {
                const firstKey = Object.keys(prop)[0];
                return prop[firstKey]?.icon || 'circle';
            }
        }
        return 'circle';
    }
}

// ========================================
// GAME SCENE - Treniruotė ir testas
// ========================================

class AminoGameScene extends BioPhaser.BioScene {
    constructor() {
        super('AminoGame', config);
    }
    
    init(data) {
        super.init(data);
        
        this.classificationType = data.classificationType;
        this.mode = data.mode || 'full';
        this.reviewOnly = data.reviewOnly || null;
        
        this.classificationConfig = config.gameplay.classificationTypes.find(
            t => t.id === this.classificationType
        );
        
        this.currentIndex = 0;
        this.queue = [];
        this.reviewQueue = [];
        this.mastered = new Set();
        this.resultsHistory = [];
        
        this.currentAminoAcid = null;
        this.availableGroups = [];

        this.resultsPage = 0;
        this.resultsPerPage = 10;
        this.aminoHelpElements = null;
        this.feedbackElements = [];
        this.answerLocked = false;
        this.selectedGroupKey = null;
        this.correctGroupKey = null;
        this.lastAnswerCorrect = null;
        this.choiceElements = [];
        this.quickHintElements = [];
        this.quickHintVisible = false;
        this.supportElements = [];
        this.currentChoicesY = 0;

    }

    preload() {
        preloadAminoStructures(this);
    }

    uiReset() {
        this.closeAminoHelp?.();
        this.feedbackElements?.forEach(el => el?.destroy?.());
        this.feedbackElements = [];
        this.choiceElements?.forEach(el => el?.destroy?.());
        this.choiceElements = [];
        this.closeQuickHint?.();
        this.supportElements?.forEach(el => el?.destroy?.());
        this.supportElements = [];
        this.answerLocked = false;
        this.selectedGroupKey = null;
        this.correctGroupKey = null;
        this.lastAnswerCorrect = null;
        this.cleanupUI();
    }
    
    renderHeader({ leftLabel, rightLabel, centerText, showProgress = true }) {
        const headerW = Math.min(1100, UI.W - 180);
        const leftBadgeX = UI.CX - headerW / 2 + 110;
        const rightBadgeX = UI.CX + headerW / 2 - 110;

        const bg = this.add.rectangle(UI.CX, UI.headerY, headerW, UI.headerH, UI.colors.white, 0.86);
        bg.setStrokeStyle(2, UI.colors.stroke);
        this.layers.ui.add(bg);
        
        const left = this.addUI(
            new BioPhaser.UI.Badge(this, leftBadgeX, UI.headerY, leftLabel, {
                backgroundColor: THEME.text,
                container: this.layers.ui
            })
        ).create();
        
        const right = this.addUI(
            new BioPhaser.UI.Badge(this, rightBadgeX, UI.headerY, rightLabel, {
                backgroundColor: THEME.text,
                container: this.layers.ui
            })
        ).create();
        
        const title = this.add.text(UI.CX, UI.headerY - 18, centerText, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(title);

        if (this.progressBarFill && this.progressBarBg) {
            if (showProgress) {
                const progressW = Math.min(520, headerW - 360);
                this.progressBarBg.setVisible(true);
                this.progressBarFill.setVisible(true);
                const percent = Math.min((this.currentIndex + 1) / this.totalQuestions, 1);
                this.progressBarFill.width = Math.min(progressW * percent, progressW);
            } else {
                this.progressBarBg.setVisible(false);
                this.progressBarFill.setVisible(false);
            }
        }
    }
    
    renderFooter({ backText, primaryText, primaryEnabled, onBack, onPrimary, primaryBg, primaryBgHover, primaryPaddingV, showPrimary = true }) {
        backText = backText || config.text.game.buttonBack;
        const pBg = primaryBg || (primaryEnabled ? UI.colors.primary : '#95a5a6');
        const pBgHover = primaryBgHover || UI.colors.primaryHover;
        const pPadV = primaryPaddingV ?? 10;
        const backX = 180;
        const primaryX = UI.W - 180;

        const backBtn = this.addUI(
            new BioPhaser.UI.Button(this, backX, UI.footerY, backText, {
                fontSize: '18px',
                backgroundColor: UI.colors.info,
                width: 170,
                height: 48,
                padding: { left: 18, right: 18, top: 11, bottom: 11 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        backBtn.onClick(() => onBack?.());
        backBtn.onHover(
            () => backBtn.setStyle({ backgroundColor: UI.colors.infoHover }),
            () => backBtn.setStyle({ backgroundColor: UI.colors.info })
        );
        backBtn.create();

        let primaryBtn = null;
        if (showPrimary) {
            primaryBtn = this.addUI(
                new BioPhaser.UI.Button(this, primaryX, UI.footerY, primaryText, {
                    fontSize: '18px',
                    backgroundColor: primaryEnabled ? pBg : '#95a5a6',
                    width: 220,
                    height: 50,
                    padding: { left: 18, right: 18, top: pPadV + 1, bottom: pPadV + 1 },
                    fontStyle: 'bold',
                    container: this.layers.ui
                })
            );
            primaryBtn.onClick(() => primaryEnabled && onPrimary?.());
            if (primaryEnabled) {
                primaryBtn.onHover(
                    () => primaryBtn.setStyle({ backgroundColor: pBgHover }),
                    () => primaryBtn.setStyle({ backgroundColor: pBg })
                );
            }
            primaryBtn.create();
        }

        return { backBtn, primaryBtn };
    }
    
    create() {
        this.createLayers();
        this._progressSaved = false;

        BioPhaser.UI.Helpers.createStandardBackground(this);

        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);

        this.determineAvailableGroups();
        this.generateQuestionsQueue();
        
        this.totalQuestions = this.queue.length;
        
        const headerW = Math.min(1100, UI.W - 180);
        const progressW = Math.min(520, headerW - 360);
        this.progressBarBg = this.add.rectangle(
            UI.CX, UI.headerY + 18, progressW, 10,
            0xe0e0e0
        );
        this.layers.uiPersistent.add(this.progressBarBg);
        
        this.progressBarFill = this.add.rectangle(
            UI.CX - progressW / 2, UI.headerY + 18, 0, 10,
            0x10B981
        );
        this.progressBarFill.setOrigin(0, 0.5);
        this.layers.uiPersistent.add(this.progressBarFill);
        
        this.startQuestion();
    }
    
    /**
     * Nustato galimas grupės pasirinkimus pagal klasifikacijos tipą
     */
    determineAvailableGroups() {
        if (this.classificationConfig.groups) {
            this.availableGroups = this.classificationConfig.groups.map(
                groupKey => ({ key: groupKey, ...config.groups[groupKey] })
            );
        } else if (this.classificationConfig.property) {
            const property = config.properties[this.classificationConfig.property];
            this.availableGroups = Object.entries(property).map(
                ([key, data]) => ({ key, ...data })
            );
        }
    }
    
    /**
     * Generuoja klausimų eilę pagal režimą
     */
    generateQuestionsQueue() {
        const all = Object.keys(config.items);
        
        if (this.mode === 'full') {
            this.queue = Phaser.Utils.Array.Shuffle([...all]);
        } else if (this.mode === 'review') {
            this.queue = this.reviewOnly && this.reviewOnly.length 
                ? [...this.reviewOnly] 
                : [];
        }
        
        this.reviewQueue = [];
        this.mastered = new Set();
        this.resultsHistory = [];
        this.currentIndex = 0;
    }
    
    /**
     * Pradeda naują klausimą arba rodo rezultatus jei baigta
     */
    startQuestion() {
        this.uiReset();
        
        if (this.currentIndex >= this.queue.length) {
            this.showEnd();
            return;
        }
        
        this.currentAminoAcid = this.queue[this.currentIndex];
        
        this.renderHeader({
            leftLabel: `${config.text.game.masteredLabel} ${this.mastered.size}`,
            rightLabel: `${config.text.game.reviewLabel} ${this.reviewQueue.length}`,
            centerText: `Klausimas ${this.currentIndex + 1} / ${this.queue.length}`
        });
        
        this.renderQuestionContent();
    }
    
    /**
     * Grąžina trumpą klasifikacijos tipo pavadinimą header'iui
     */
    getHeaderRightLabel() {
        return config.text.game.headerLabels[this.classificationType] || 'Klasė';
    }
    
    /**
     * Atvaizduoja klausimo turinį:
     * - Klausimo tekstą
     * - Amino rūgšties kortelę (kodas + pavadinimas)
     * - Pasirinkimų grid'ą
     */
    renderQuestionContent() {
        const cx = UI.CX;

        const questionY = UI.contentTop + 8;
        const q = this.add.text(cx, questionY, this.classificationConfig.question, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: FONT,
            align: 'center',
            wordWrap: { width: 840 }
        }).setOrigin(0.5);
        this.layers.ui.add(q);

        const cardY = UI.contentTop + 155;
        const cardW = 720;
        const cardH = 250;
        const box = this.add.rectangle(cx, cardY, cardW, cardH, 0xFFFFFF, 0.97);
        box.setStrokeStyle(2, 0xD8E2EC);
        this.layers.ui.add(box);
        BioPhaser.Animation.Tween.fadeIn(this, box, 200, 0);

        const labelY = cardY - cardH / 2 + 30;
        const label = this.add.text(cx, labelY, `${this.currentAminoAcid} · ${config.items[this.currentAminoAcid]}`, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#1F2937',
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(label);
        BioPhaser.Animation.Tween.fadeIn(this, label, 300, 80);

        const imgKey = `amino_${this.currentAminoAcid}`;
        const imageY = cardY - 12;
        if (this.textures.exists(imgKey)) {
            const image = this.add.image(cx, imageY, imgKey);
            const maxW = 390;
            const maxH = 135;
            const scale = Math.min(maxW / image.width, maxH / image.height, 1);
            image.setScale(scale);
            this.layers.ui.add(image);
            BioPhaser.Animation.Tween.fadeIn(this, image, 350, 120);
        } else {
            const missing = this.add.text(cx, imageY, 'Struktūros paveikslėlis nerastas', {
                fontSize: '14px',
                color: '#94A3B8',
                fontFamily: FONT
            }).setOrigin(0.5);
            this.layers.ui.add(missing);
        }

        const supportY = cardY + cardH / 2 - 34;
        const supportW = 680;
        const supportH = 52;
        const supportBar = this.add.rectangle(cx, supportY, supportW, supportH, 0xF8FAFC, 1);
        supportBar.setStrokeStyle(1, 0xE2E8F0);
        this.layers.ui.add(supportBar);

        const supportLabel = this.add.text(cx - supportW / 2 + 16, supportY, 'Reikia pagalbos?', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#475569',
            fontFamily: FONT
        }).setOrigin(0, 0.5);
        this.layers.ui.add(supportLabel);

        const hintBtn = this.addUI(
            new BioPhaser.UI.Button(this, cx + 100, supportY, 'Užuomina', {
                fontSize: '14px',
                color: '#047857',
                backgroundColor: '#ECFDF5',
                width: 130,
                height: 36,
                padding: { left: 12, right: 12, top: 7, bottom: 7 },
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.ui
            })
        );
        hintBtn.onClick(() => this.toggleQuickHint());
        hintBtn.onHover(
            () => hintBtn.setStyle({ backgroundColor: '#D1FAE5' }),
            () => hintBtn.setStyle({ backgroundColor: '#ECFDF5' })
        );
        hintBtn.create();

        const helpBtn = this.addUI(
            new BioPhaser.UI.Button(this, cx + 258, supportY, 'Paaiškinimas', {
                fontSize: '14px',
                color: '#4338CA',
                backgroundColor: '#EEF2FF',
                width: 150,
                height: 36,
                padding: { left: 12, right: 12, top: 7, bottom: 7 },
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.ui
            })
        );
        helpBtn.onClick(() => this.showAminoHelp());
        helpBtn.onHover(
            () => helpBtn.setStyle({ backgroundColor: '#E0E7FF' }),
            () => helpBtn.setStyle({ backgroundColor: '#EEF2FF' })
        );
        helpBtn.create();

        this.supportElements = [supportBar, supportLabel, hintBtn.element, helpBtn.element];

        const choicesY = this.availableGroups.length === 4
            ? UI.contentTop + 375
            : UI.contentTop + 415;
        this.currentChoicesY = choicesY;
        this.renderChoices(cx, choicesY);
    }

    getQuickHint() {
        const aa = this.currentAminoAcid;
        const correctGroup = this.getCorrectGroup?.();

        if (!aa || !correctGroup) {
            return config.hints?.fallback?.default || 'Pažiūrėk į šoninę grandinę ir ieškok svarbiausio požymio.';
        }

        const specificHint = config.hints?.[this.classificationType]?.[aa];
        if (specificHint) return specificHint;

        const fallbackHint = config.hints?.fallback?.[correctGroup.key];
        if (fallbackHint) return fallbackHint;

        return config.hints?.fallback?.default || 'Pažiūrėk į šoninę grandinę ir ieškok svarbiausio požymio.';
    }

    closeQuickHint() {
        this.quickHintElements?.forEach(el => el?.destroy?.());
        this.quickHintElements = [];
        this.quickHintVisible = false;
    }

    toggleQuickHint() {
        if (this.quickHintVisible) {
            this.closeQuickHint();
            return;
        }

        this.quickHintVisible = true;
        this.quickHintElements = [];

        const modalW = 560;
        const modalH = 210;
        const modalX = UI.CX;
        const modalY = 360;

        const overlay = this.add.rectangle(UI.CX, UI.H / 2, UI.W, UI.H, 0x000000, 0.16)
            .setDepth(120)
            .setInteractive();
        overlay.on('pointerdown', () => this.closeQuickHint());
        this.layers.modal.add(overlay);
        this.quickHintElements.push(overlay);

        const box = this.add.rectangle(modalX, modalY, modalW, modalH, 0xFFFFFF, 1)
            .setStrokeStyle(2, 0x86EFAC)
            .setDepth(121);
        this.layers.modal.add(box);
        this.quickHintElements.push(box);

        const titleText = this.add.text(modalX, modalY - 68, 'Užuomina', {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#047857',
            fontFamily: FONT
        }).setOrigin(0.5).setDepth(122);
        this.layers.modal.add(titleText);
        this.quickHintElements.push(titleText);

        const hintText = this.add.text(modalX, modalY - 18, this.getQuickHint(), {
            fontSize: '16px',
            color: '#1F2937',
            fontFamily: FONT,
            wordWrap: { width: 460 },
            align: 'center'
        }).setOrigin(0.5).setDepth(122);
        this.layers.modal.add(hintText);
        this.quickHintElements.push(hintText);

        const closeBtn = this.addUI(
            new BioPhaser.UI.Button(this, modalX, modalY + 70, 'Gerai', {
                fontSize: '15px',
                color: '#ffffff',
                backgroundColor: '#10B981',
                width: 120,
                height: 38,
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.modal
            })
        );
        closeBtn.onClick(() => this.closeQuickHint());
        closeBtn.onHover(
            () => closeBtn.setStyle({ backgroundColor: '#059669' }),
            () => closeBtn.setStyle({ backgroundColor: '#10B981' })
        );
        closeBtn.create();
        this.quickHintElements.push(closeBtn.element);
    }

    getStructureHelpText(aminoAcid, correctGroup) {
        if (!correctGroup) return 'Peržiūrėk šoninę grandinę ir ieškok požymių, kurie svarbūs šiame klasifikavimo režime.';

        if (this.classificationType === 'aromatiskumas') {
            if (correctGroup.key === 'aromatines') {
                return 'Šoninėje grandinėje ieškok aromatinio žiedo. Ši aminorūgštis priskiriama aromatinėms, nes jos struktūroje yra žiedinė sistema.';
            }
            return 'Šioje struktūroje nėra aromatinio žiedo, todėl šiame režime aminorūgštis priskiriama nearomatinėms.';
        }

        if (this.classificationType === 'hidrofobiskumas') {
            if (correctGroup.key === 'hidrofobines') {
                return 'Atkreipk dėmesį į nepolinę šoninę grandinę. Tokios aminorūgštys dažniausiai vengia vandens.';
            }
            return 'Ieškok polinių arba įkrautų grupių. Tokios aminorūgštys gali sąveikauti su vandeniu.';
        }

        if (this.classificationType === 'polarumas') {
            if (correctGroup.key === 'rugsties') {
                return 'Šoninėje grandinėje yra rūgštinė grupė, todėl aminorūgštis priskiriama rūgštinėms.';
            }
            if (correctGroup.key === 'bazines') {
                return 'Šoninėje grandinėje ieškok bazinių grupių, kurios gali turėti teigiamą krūvį arba prisijungti protoną.';
            }
            if (correctGroup.key === 'polines_neutralios') {
                return 'Ši aminorūgštis turi polinę, bet neįkrautą šoninę grandinę. Ji gali sudaryti sąveikas su vandeniu.';
            }
            if (correctGroup.key === 'nepolines') {
                return 'Šoninė grandinė neturi ryškių polinių ar įkrautų grupių, todėl aminorūgštis priskiriama nepolinėms.';
            }
        }

        return `Peržiūrėk ${aminoAcid} šoninę grandinę ir įvertink požymius, kurie apibūdina grupę „${correctGroup.label}“.`;
    }

    closeAminoHelp() {
        if (!this.aminoHelpElements) return;
        this.aminoHelpElements.forEach((el) => el?.destroy());
        this.aminoHelpElements = null;
    }

    showAminoHelp() {
        this.closeAminoHelp();

        const correctGroup = this.getCorrectGroup();
        const modalElements = [];
        this.aminoHelpElements = modalElements;
        const modalW = 720;
        const modalH = 600;
        const modalX = UI.CX;
        const modalY = UI.H / 2;
        const top = modalY - modalH / 2;

        const close = () => this.closeAminoHelp();

        const overlay = this.add.rectangle(UI.CX, UI.H / 2, UI.W, UI.H, 0x000000, 0.22)
            .setInteractive({ useHandCursor: true })
            .setDepth(200);
        overlay.on('pointerdown', close);
        this.layers.modal.add(overlay);
        modalElements.push(overlay);

        const box = this.add.rectangle(modalX, modalY, modalW, modalH, 0xFFFFFF, 1)
            .setStrokeStyle(1, 0xD8E2EC)
            .setDepth(201);
        this.layers.modal.add(box);
        modalElements.push(box);

        const title = this.add.text(modalX, top + 48, `${this.currentAminoAcid} — ${config.items[this.currentAminoAcid]}`, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#1F2937',
            fontFamily: FONT
        }).setOrigin(0.5).setDepth(202);
        this.layers.modal.add(title);
        modalElements.push(title);

        const subtitle = this.add.text(modalX, top + 80, 'Struktūra ir klasifikavimo paaiškinimas', {
            fontSize: '13px',
            color: '#64748B',
            fontFamily: FONT
        }).setOrigin(0.5).setDepth(202);
        this.layers.modal.add(subtitle);
        modalElements.push(subtitle);

        const divider = this.add.rectangle(modalX, top + 104, modalW - 80, 1, 0xE2E8F0, 1).setDepth(202);
        this.layers.modal.add(divider);
        modalElements.push(divider);

        const imageBox = this.add.rectangle(modalX, top + 225, 520, 230, 0xF8FAFC, 1)
            .setStrokeStyle(1, 0xE2E8F0)
            .setDepth(202);
        this.layers.modal.add(imageBox);
        modalElements.push(imageBox);

        const imgKey = `amino_${this.currentAminoAcid}`;
        if (this.textures.exists(imgKey)) {
            const image = this.add.image(modalX, top + 225, imgKey).setDepth(202);
            const maxW = 460;
            const maxH = 190;
            const scale = Math.min(maxW / image.width, maxH / image.height, 1);
            image.setScale(scale);
            this.layers.modal.add(image);
            modalElements.push(image);
        } else {
            const missing = this.add.text(modalX, top + 225, 'Struktūros paveikslėlis nerastas.', {
                fontSize: '16px',
                color: '#64748B',
                fontFamily: FONT
            }).setOrigin(0.5).setDepth(202);
            this.layers.modal.add(missing);
            modalElements.push(missing);
        }

        const helpTitle = this.add.text(UI.CX - 260, top + 360, 'Kaip atpažinti?', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#1F2937',
            fontFamily: FONT
        }).setOrigin(0, 0).setDepth(202);
        this.layers.modal.add(helpTitle);
        modalElements.push(helpTitle);

        const helpText = this.add.text(UI.CX - 260, top + 392, this.getStructureHelpText(this.currentAminoAcid, correctGroup), {
            fontSize: '14px',
            color: '#475569',
            fontFamily: FONT,
            wordWrap: { width: 520 },
            lineSpacing: 4
        }).setOrigin(0, 0).setDepth(202);
        this.layers.modal.add(helpText);
        modalElements.push(helpText);

        const footnote = this.add.text(UI.CX, top + 515, 'Struktūra pateikta supaprastinta forma, kad būtų lengviau atpažinti šoninę grandinę.', {
            fontSize: '12px',
            color: '#94A3B8',
            fontFamily: FONT
        }).setOrigin(0.5).setDepth(202);
        this.layers.modal.add(footnote);
        modalElements.push(footnote);

        const closeBtn = this.addUI(
            new BioPhaser.UI.Button(this, UI.CX, top + 560, 'Uždaryti', {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: UI.colors.primary,
                width: 140,
                height: 42,
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.modal
            })
        );
        closeBtn.onClick(close);
        closeBtn.onHover(
            () => closeBtn.setStyle({ backgroundColor: UI.colors.primaryHover }),
            () => closeBtn.setStyle({ backgroundColor: UI.colors.primary })
        );
        closeBtn.create();
        modalElements.push(closeBtn.element);
    }

    renderGroupReference(cx, y) {
        const groups = this.availableGroups;
        const gap = 14;
        const maxTotalW = UI.W - 220;
        const cardW = Math.min(220, Math.floor((maxTotalW - (groups.length - 1) * gap) / groups.length));
        const cardH = 76;
        const totalW = groups.length * cardW + (groups.length - 1) * gap;
        const startX = UI.CX - totalW / 2;

        groups.forEach((group, i) => {
            const cardX = startX + i * (cardW + gap) + cardW / 2;
            const accent = parseInt(config.ui.groupAccentColors[group.key]) || 0x3498db;

            const bg = this.add.rectangle(cardX, y, cardW, cardH, UI.colors.white, 0.88);
            bg.setStrokeStyle(1, 0xDFE6E9);
            this.layers.ui.add(bg);

            const bar = this.add.rectangle(cardX - cardW / 2 + 4, y, 8, cardH - 4, accent, 1);
            bar.setOrigin(0.5);
            this.layers.ui.add(bar);

            const label = this.add.text(cardX - cardW / 2 + 16, y - 16, group.label, {
                fontSize: '15px',
                fontStyle: 'bold',
                color: UI.colors.text,
                fontFamily: FONT
            }).setOrigin(0, 0.5);
            this.layers.ui.add(label);

            const memberStr = (group.members || []).join(', ');
            const members = this.add.text(cardX - cardW / 2 + 16, y + 12, memberStr, {
                fontSize: '11px',
                color: UI.colors.muted,
                fontFamily: FONT,
                wordWrap: { width: cardW - 24 }
            }).setOrigin(0, 0.5);
            this.layers.ui.add(members);
        });
    }
    
    renderChoices(cx, startY, state = {}) {
        this.choiceElements?.forEach(el => el?.destroy?.());
        this.choiceElements = [];

        const groups = this.availableGroups;
        const locked = state.locked || false;
        const selectedKey = state.selectedKey;
        const correctKey = state.correctKey;
        const cols = 2;
        const isFour = groups.length === 4;
        const cardW = isFour ? 430 : 460;
        const cardH = isFour ? 72 : 96;
        const gapX = 28;
        const gapY = isFour ? 10 : 20;
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = UI.CX - totalW / 2 + cardW / 2;

        const symbols = {
            nepolines: '●',
            polines_neutralios: '◌',
            rugsties: '−',
            bazines: '+',
            aromatines: '⌬',
            alifatines: '○',
            hidrofobines: '●',
            hidrofilines: '≈'
        };
        
        groups.forEach((group, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = startX + col * (cardW + gapX);
            const y = startY + row * (cardH + gapY);
            const accentColor = parseInt((group.color || UI.colors.info).replace('#', '0x'));
            const symbol = symbols[group.key] || '•';
            const titleSize = isFour ? '17px' : (group.label.length > 18 ? '20px' : '22px');
            let fill = 0xFFFFFF;
            let fillAlpha = 0.96;
            let stroke = 0xE2E8F0;
            let strokeWidth = 1;
            let cardAlpha = 1;

            if (locked && group.key === correctKey) {
                fill = 0xECFDF5;
                stroke = 0x10B981;
                strokeWidth = 3;
            } else if (locked && group.key === selectedKey && group.key !== correctKey) {
                fill = 0xFFF7ED;
                stroke = 0xF97316;
                strokeWidth = 3;
            } else if (locked && group.key !== selectedKey && group.key !== correctKey) {
                cardAlpha = 0.55;
            }

            const bg = this.add.rectangle(x, y, cardW, cardH, fill, fillAlpha);
            bg.setStrokeStyle(strokeWidth, stroke);
            bg.setAlpha(cardAlpha);
            if (!locked) bg.setInteractive({ useHandCursor: true });
            this.layers.ui.add(bg);
            this.choiceElements.push(bg);

            const stripe = this.add.rectangle(x - cardW / 2 + 5, y, 10, cardH - 8, accentColor, 1);
            stripe.setAlpha(cardAlpha);
            this.layers.ui.add(stripe);
            this.choiceElements.push(stripe);

            const dot = this.add.circle(x - cardW / 2 + 48, y, 20, accentColor, 0.12);
            dot.setStrokeStyle(1, accentColor, 0.25);
            dot.setAlpha(cardAlpha);
            this.layers.ui.add(dot);
            this.choiceElements.push(dot);

            const symbolText = this.add.text(x - cardW / 2 + 48, y, symbol, {
                fontSize: '24px',
                fontStyle: 'bold',
                color: group.color || UI.colors.info,
                fontFamily: FONT
            }).setOrigin(0.5).setAlpha(cardAlpha);
            this.layers.ui.add(symbolText);
            this.choiceElements.push(symbolText);

            const titleOffsetY = isFour ? -22 : -28;
            const title = this.add.text(x - cardW / 2 + 82, y + titleOffsetY, group.label, {
                fontSize: titleSize,
                fontStyle: 'bold',
                fontFamily: FONT,
                color: '#1F2937'
            }).setOrigin(0, 0).setAlpha(cardAlpha);
            this.layers.ui.add(title);
            this.choiceElements.push(title);

            const descOffsetY = isFour ? 1 : 4;
            const description = this.add.text(x - cardW / 2 + 82, y + descOffsetY, group.description, {
                fontSize: isFour ? '11px' : '12px',
                fontFamily: FONT,
                color: '#64748B',
                wordWrap: { width: cardW - 120 },
                lineSpacing: 3
            }).setOrigin(0, 0).setAlpha(cardAlpha);
            this.layers.ui.add(description);
            this.choiceElements.push(description);

            const hoverIn = () => {
                if (locked) return;
                bg.setStrokeStyle(1.5, accentColor);
                bg.setFillStyle(0xF8FAFC, 0.98);
            };
            const hoverOut = () => {
                if (locked) return;
                bg.setStrokeStyle(1, 0xE2E8F0);
                bg.setFillStyle(0xFFFFFF, 0.96);
            };
            const onClick = () => this.checkAnswer(group);

            if (!locked) {
                bg.on('pointerover', hoverIn);
                bg.on('pointerout', hoverOut);
                bg.on('pointerdown', onClick);

                [stripe, dot, symbolText, title, description].forEach((el) => {
                    el.setInteractive?.({ useHandCursor: true });
                    el.on?.('pointerover', hoverIn);
                    el.on?.('pointerout', hoverOut);
                    el.on?.('pointerdown', onClick);
                });
            }
        });
    }
    
    checkAnswer(selectedGroup) {
        if (this.answerLocked) return;
        this.answerLocked = true;

        this.closeQuickHint?.();
        this.supportElements?.forEach(el => el?.setAlpha?.(0.35));

        const correctGroup = this.getCorrectGroup();
        const isCorrect = selectedGroup.key === correctGroup.key;
        this.selectedGroupKey = selectedGroup.key;
        this.correctGroupKey = correctGroup.key;
        this.lastAnswerCorrect = isCorrect;
        
        this.resultsHistory.push({
            aminoAcid: this.currentAminoAcid,
            name: config.items[this.currentAminoAcid],
            correct: isCorrect,
            correctGroup: correctGroup.label
        });
        
        if (isCorrect) {
            this.mastered.add(this.currentAminoAcid);
        } else {
            if (!this.reviewQueue.includes(this.currentAminoAcid)) {
                this.reviewQueue.push(this.currentAminoAcid);
                const insertPos = Math.min(
                    this.currentIndex + Phaser.Math.Between(3, 5),
                    this.queue.length
                );
                this.queue.splice(insertPos, 0, this.currentAminoAcid);
            }
        }

        this.renderChoices(UI.CX, this.currentChoicesY, {
            locked: true,
            selectedKey: selectedGroup.key,
            correctKey: correctGroup.key
        });

        this.showFeedback(isCorrect, correctGroup);
        
        this.renderFooter({
            onBack: () => {
                this.scene.stop('AminoGame');
                this.scene.start('AminoStart');
            },
            showPrimary: false
        });
    }
    
    getCorrectGroup() {
        if (this.classificationConfig.groups) {
            for (const groupKey of this.classificationConfig.groups) {
                const g = config.groups[groupKey];
                if (g?.members?.includes(this.currentAminoAcid)) {
                    return { key: groupKey, ...g };
                }
            }
        } else if (this.classificationConfig.property) {
            const prop = config.properties[this.classificationConfig.property];
            for (const [key, data] of Object.entries(prop)) {
                if (data?.members?.includes(this.currentAminoAcid)) {
                    return { key, ...data };
                }
            }
        }
        return null;
    }
    
    showFeedback(isCorrect, correctGroup) {
        this.feedbackElements?.forEach(el => el?.destroy?.());
        this.feedbackElements = [];

        const cx = UI.CX;
        const isFour = this.availableGroups.length === 4;
        const feedbackY = isFour ? 690 : 670;
        const feedbackW = 760;
        const feedbackH = 86;
        const fill = isCorrect ? 0xECFDF5 : 0xFFF7ED;
        const stroke = isCorrect ? 0x86EFAC : 0xFDBA74;
        const accent = isCorrect ? 0x10B981 : 0xF97316;
        const titleColor = isCorrect ? '#065F46' : '#9A3412';
        const title = isCorrect ? 'Teisingai!' : 'Ne visai';
        const subtitle = isCorrect
            ? `Grupė: ${correctGroup.label}`
            : `Teisinga grupė: ${correctGroup.label}`;
        const explanation = this.getExplanation(this.currentAminoAcid, correctGroup);
        const learningText = isCorrect
            ? `${this.currentAminoAcid} priskirta tinkamai grupei. ${explanation}`
            : `${this.currentAminoAcid} priklauso grupei „${correctGroup.label}“. ${explanation}`;

        const bg = this.add.rectangle(cx, feedbackY, feedbackW, feedbackH, fill, 1);
        bg.setStrokeStyle(2, stroke);
        this.layers.ui.add(bg);
        this.feedbackElements.push(bg);

        const badge = this.add.circle(cx - feedbackW / 2 + 38, feedbackY - 16, 18, accent, 1);
        this.layers.ui.add(badge);
        this.feedbackElements.push(badge);

        const badgeText = this.add.text(cx - feedbackW / 2 + 38, feedbackY - 16, isCorrect ? '✓' : '!', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(badgeText);
        this.feedbackElements.push(badgeText);

        const titleText = this.add.text(cx - feedbackW / 2 + 70, feedbackY - 36, title, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: titleColor,
            fontFamily: FONT
        }).setOrigin(0, 0);
        this.layers.ui.add(titleText);
        this.feedbackElements.push(titleText);

        const subtitleText = this.add.text(cx - feedbackW / 2 + 70, feedbackY - 14, subtitle, {
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#334155',
            fontFamily: FONT
        }).setOrigin(0, 0);
        this.layers.ui.add(subtitleText);
        this.feedbackElements.push(subtitleText);

        const explanationText = this.add.text(cx - feedbackW / 2 + 70, feedbackY + 8, learningText, {
            fontSize: '13px',
            color: '#475569',
            fontFamily: FONT,
            wordWrap: { width: 520 },
            lineSpacing: 3
        }).setOrigin(0, 0);
        this.layers.ui.add(explanationText);
        this.feedbackElements.push(explanationText);

        const nextBtn = this.addUI(
            new BioPhaser.UI.Button(this, UI.CX + feedbackW / 2 - 78, feedbackY + 22, 'Toliau →', {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#10B981',
                width: 120,
                height: 36,
                padding: { left: 12, right: 12, top: 8, bottom: 8 },
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.ui
            })
        );
        nextBtn.onClick(() => {
            this.currentIndex++;
            this.startQuestion();
        });
        nextBtn.onHover(
            () => nextBtn.setStyle({ backgroundColor: '#059669' }),
            () => nextBtn.setStyle({ backgroundColor: '#10B981' })
        );
        nextBtn.create();
        this.feedbackElements.push(nextBtn.element);
    }
    
    /**
     * Grąžina paaiškinimą kodėl amino rūgštis priklauso grupei
     */
    getExplanation(aminoAcid, correctGroup) {
        const explanations = config.text.game.explanations;
        return explanations[correctGroup.key] || correctGroup.description || explanations.default;
    }
    
    /**
     * Rodo rezultatų ekraną pabaigoje
     * Įskaičiuoja statistiką ir siūlo kartoti klaidas arba visą treniruotę
     */
    showEnd() {
        this.uiReset();

        this.progressBarBg?.setVisible(false);
        this.progressBarFill?.setVisible(false);

        if (this.resultsPage == null) this.resultsPage = 0;

        const cx = UI.CX;
        const correct = this.resultsHistory.filter(r => r.correct).length;
        const total = this.resultsHistory.length || 1;
        const pct = Math.round((correct / total) * 100);
        const wrong = this.resultsHistory.filter(r => !r.correct).map(r => r.aminoAcid);
        const uniqueWrong = [...new Set(wrong)];
        const hasErrors = uniqueWrong.length > 0;
        const masteredCount = this.mastered.size;
        const totalItems = Object.keys(config.items).length;

        if (!this._progressSaved && this.resultsHistory.length > 0) {
            this._progressSaved = true;
            Progress.save('amino', { score: correct, total: this.resultsHistory.length });
        }

        const panelX = UI.CX;
        const panelY = 430;
        const panelW = 940;
        const panelH = 620;
        const ptop  = panelY - panelH / 2;
        const pleft = panelX - panelW / 2;

        const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0xFFFFFF, 0.98);
        panel.setStrokeStyle(1.5, 0xD8E2EC);
        this.layers.ui.add(panel);

        const hdrY = ptop + 33;

        const leftBadgeStr = `${config.text.game.masteredLabel} ${masteredCount}/${totalItems}`;
        const lbg = this.add.rectangle(pleft + 86, hdrY, 164, 26, 0xE0F2FE, 1);
        lbg.setStrokeStyle(1, 0x38BDF8);
        this.layers.ui.add(lbg);
        this.layers.ui.add(
            this.add.text(pleft + 86, hdrY, leftBadgeStr, {
                fontSize: '13px', color: '#0369A1', fontFamily: FONT
            }).setOrigin(0.5)
        );

        const rightBadgeStr = this.getHeaderRightLabel();
        const rbg = this.add.rectangle(pleft + panelW - 76, hdrY, 130, 26, 0xE0F2FE, 1);
        rbg.setStrokeStyle(1, 0x38BDF8);
        this.layers.ui.add(rbg);
        this.layers.ui.add(
            this.add.text(pleft + panelW - 76, hdrY, rightBadgeStr, {
                fontSize: '13px', color: '#0369A1', fontFamily: FONT
            }).setOrigin(0.5)
        );

        this.layers.ui.add(
            this.add.text(cx, hdrY, config.text.game.resultsTitle, {
                fontSize: '22px', fontStyle: 'bold', color: '#1F2937', fontFamily: FONT
            }).setOrigin(0.5)
        );
        this.layers.ui.add(
            this.add.text(cx, hdrY + 22, 'Peržiūrėk savo atsakymus ir klaidas.', {
                fontSize: '13px', color: '#6B7280', fontFamily: FONT
            }).setOrigin(0.5)
        );
        this.layers.ui.add(
            this.add.rectangle(cx, hdrY + 38, panelW - 48, 1, 0xE2E8F0, 1)
        );

        const scoreY = ptop + 130;
        const scoreColor = pct >= 70 ? '#10B981' : pct >= 50 ? '#F97316' : '#EF4444';
        this.layers.ui.add(
            this.add.text(cx, scoreY, `${correct} / ${total}`, {
                fontSize: '54px', fontStyle: 'bold', color: scoreColor, fontFamily: FONT
            }).setOrigin(0.5)
        );

        const starsY = scoreY + 50;
        const stars = pct === 100 ? '★ ★ ★' : pct >= 75 ? '★ ★ ☆' : pct >= 50 ? '★ ☆ ☆' : '☆ ☆ ☆';
        this.layers.ui.add(
            this.add.text(cx, starsY, stars, {
                fontSize: '22px', color: '#FBBF24', fontFamily: FONT
            }).setOrigin(0.5)
        );

        const motiv = pct === 100 ? 'Puikiai! Viską išmokai ✓'
            : pct >= 75 ? 'Beveik tobulai! Dar kartą?'
            : pct >= 50 ? 'Pakartok klaidas!'
            : 'Reikia daugiau praktikos.';
        const motivColor = pct === 100 ? '#10B981' : pct >= 75 ? '#F97316' : pct >= 50 ? '#F97316' : '#EF4444';
        this.layers.ui.add(
            this.add.text(cx, starsY + 28, motiv, {
                fontSize: '17px', fontStyle: 'italic', color: motivColor, fontFamily: FONT
            }).setOrigin(0.5)
        );

        const cardsY = starsY + 66;
        const cardDefs = [
            { label: 'Teisingai',  value: String(correct),                 color: '#10B981' },
            { label: 'Klaidų',     value: String(total - correct),          color: '#EF4444' },
            { label: 'Įsisavinta', value: `${masteredCount}/${totalItems}`, color: '#38BDF8' }
        ];
        const cW = 178, cH = 44, cGap = 14;
        const cStartX = cx - (cW * 3 + cGap * 2) / 2 + cW / 2;
        cardDefs.forEach((card, i) => {
            const cardX = cStartX + i * (cW + cGap);
            const cbg = this.add.rectangle(cardX, cardsY, cW, cH, 0xF8FAFC, 1);
            cbg.setStrokeStyle(1, 0xE2E8F0);
            this.layers.ui.add(cbg);
            this.layers.ui.add(
                this.add.text(cardX, cardsY - 9, card.label, {
                    fontSize: '11px', color: '#6B7280', fontFamily: FONT
                }).setOrigin(0.5)
            );
            this.layers.ui.add(
                this.add.text(cardX, cardsY + 10, card.value, {
                    fontSize: '17px', fontStyle: 'bold', color: card.color, fontFamily: FONT
                }).setOrigin(0.5)
            );
        });

        const tableAreaY = cardsY + cH / 2 + 14;
        this.showDetailedResults(cx, tableAreaY, pleft, panelW);

        const btnY = 796;

        const backBtn = this.addUI(
            new BioPhaser.UI.Button(this, 180, btnY, config.text.game.buttonBack, {
                fontSize: '16px',
                backgroundColor: '#F1F5F9',
                color: '#1F2937',
                width: 170,
                height: 46,
                padding: { left: 18, right: 18, top: 11, bottom: 11 },
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.ui
            })
        );
        backBtn.onClick(() => {
            this.scene.stop('AminoGame');
            this.scene.start('AminoStart');
        });
        backBtn.onHover(
            () => backBtn.setStyle({ backgroundColor: '#E2E8F0' }),
            () => backBtn.setStyle({ backgroundColor: '#F1F5F9' })
        );
        backBtn.create();

        if (hasErrors) {
            const reviewBtn = this.addUI(
                new BioPhaser.UI.Button(this, UI.W - 390, btnY, config.text.game.reviewWrongButton, {
                    fontSize: '16px',
                    backgroundColor: '#F97316',
                    width: 230,
                    height: 46,
                    padding: { left: 18, right: 18, top: 11, bottom: 11 },
                    fontStyle: 'bold',
                    fontFamily: FONT,
                    container: this.layers.ui
                })
            );
            reviewBtn.onClick(() => {
                this.scene.stop('AminoGame');
                this.scene.start('AminoGame', {
                    classificationType: this.classificationType,
                    mode: 'review',
                    reviewOnly: uniqueWrong
                });
            });
            reviewBtn.onHover(
                () => reviewBtn.setStyle({ backgroundColor: '#EA6C00' }),
                () => reviewBtn.setStyle({ backgroundColor: '#F97316' })
            );
            reviewBtn.create();
        }

        const playAgainBtn = this.addUI(
            new BioPhaser.UI.Button(this, UI.W - 180, btnY, 'Žaisti dar kartą', {
                fontSize: '16px',
                backgroundColor: '#10B981',
                width: 230,
                height: 46,
                padding: { left: 18, right: 18, top: 11, bottom: 11 },
                fontStyle: 'bold',
                fontFamily: FONT,
                container: this.layers.ui
            })
        );
        playAgainBtn.onClick(() => {
            this.scene.stop('AminoGame');
            this.scene.start('AminoGame', {
                classificationType: this.classificationType,
                mode: 'full',
                reviewOnly: []
            });
        });
        playAgainBtn.onHover(
            () => playAgainBtn.setStyle({ backgroundColor: '#059669' }),
            () => playAgainBtn.setStyle({ backgroundColor: '#10B981' })
        );
        playAgainBtn.create();
    }

    /**
     * Rodo švarią atsakymų peržiūros lentelę su fiksuotu aukščiu ir puslapiavimo valdikliais
     */
    showDetailedResults(cx, startY, pleft, panelW) {
        const rowsPerPage = 5;
        const totalRows   = this.resultsHistory.length;
        const totalPages  = Math.max(1, Math.ceil(totalRows / rowsPerPage));
        const page        = Math.min(this.resultsPage ?? 0, totalPages - 1);
        const start       = page * rowsPerPage;
        const slice       = this.resultsHistory.slice(start, start + rowsPerPage);

        const rangeStr = totalRows > rowsPerPage
            ? ` · ${start + 1}–${Math.min(start + rowsPerPage, totalRows)} iš ${totalRows}`
            : '';
        this.layers.ui.add(
            this.add.text(cx, startY + 12, `Atsakymų peržiūra${rangeStr}`, {
                fontSize: '14px', fontStyle: 'bold', color: '#334155', fontFamily: FONT
            }).setOrigin(0.5)
        );

        const rowH    = 28;
        const hdrRowY = startY + 34;
        const hdrBg   = this.add.rectangle(cx, hdrRowY, panelW - 48, 26, 0xF1F5F9, 1);
        hdrBg.setStrokeStyle(1, 0xE2E8F0);
        this.layers.ui.add(hdrBg);

        const COL_CODE    = pleft + 52;  
        const COL_NAME    = pleft + 172; 
        const COL_RESULT  = cx    + 60;  
        const COL_CORRECT = cx    + 150; 

        const hdrStyle = { fontSize: '12px', fontStyle: 'bold', color: '#334155', fontFamily: FONT };
        this.layers.ui.add(this.add.text(COL_CODE,    hdrRowY, config.text.game.tableHeaders.code,    hdrStyle).setOrigin(0.5));
        this.layers.ui.add(this.add.text(COL_NAME,    hdrRowY, config.text.game.tableHeaders.name,    hdrStyle).setOrigin(0, 0.5));
        this.layers.ui.add(this.add.text(COL_RESULT,  hdrRowY, config.text.game.tableHeaders.result,  hdrStyle).setOrigin(0.5));
        this.layers.ui.add(this.add.text(COL_CORRECT, hdrRowY, config.text.game.tableHeaders.correct, hdrStyle).setOrigin(0, 0.5));

        const rowsStartY = hdrRowY + 13 + rowH / 2;

        for (let i = 0; i < rowsPerPage; i++) {
            const rowY  = rowsStartY + i * rowH;
            const r     = slice[i];
            const isEven = i % 2 === 0;

            const rowBg = this.add.rectangle(cx, rowY, panelW - 48, rowH, isEven ? 0xFFFFFF : 0xF8FAFC, 1);
            this.layers.ui.add(rowBg);
            this.layers.ui.add(
                this.add.rectangle(cx, rowY + rowH / 2, panelW - 48, 1, 0xF1F5F9, 1)
            );

            if (!r) continue;

            const rs = { fontSize: '13px', color: '#1F2937', fontFamily: FONT };
            this.layers.ui.add(
                this.add.text(COL_CODE, rowY, r.aminoAcid, {
                    ...rs, fontStyle: 'bold', fontFamily: 'monospace'
                }).setOrigin(0.5)
            );
            const nameStr = r.name.length > 20 ? r.name.slice(0, 19) + '…' : r.name;
            this.layers.ui.add(
                this.add.text(COL_NAME, rowY, nameStr, rs).setOrigin(0, 0.5)
            );
            this.layers.ui.add(
                this.add.text(COL_RESULT, rowY, r.correct ? '✓' : '✕', {
                    ...rs, fontStyle: 'bold',
                    color: r.correct ? '#10B981' : '#EF4444',
                    fontSize: '15px'
                }).setOrigin(0.5)
            );
            this.layers.ui.add(
                this.add.text(COL_CORRECT, rowY, r.correct ? '—' : (r.correctGroup || ''), {
                    ...rs, color: r.correct ? '#9CA3AF' : '#EF4444'
                }).setOrigin(0, 0.5)
            );
        }

        if (totalPages > 1) {
            const navY = rowsStartY + rowsPerPage * rowH + 22;

            const prevActive = page > 0;
            const prevBtn = this.addUI(new BioPhaser.UI.Button(this, cx - 80, navY, '◀', {
                fontSize: '13px',
                backgroundColor: prevActive ? '#38BDF8' : '#CBD5E1',
                color: prevActive ? '#ffffff' : '#94A3B8',
                padding: { left: 12, right: 12, top: 5, bottom: 5 },
                fontFamily: FONT,
                container: this.layers.ui
            }));
            prevBtn.onClick(() => {
                if (this.resultsPage > 0) { this.resultsPage--; this.showEnd(); }
            });
            prevBtn.create();

            this.layers.ui.add(
                this.add.text(cx, navY, `${page + 1} / ${totalPages}`, {
                    fontSize: '13px', color: '#6B7280', fontFamily: FONT
                }).setOrigin(0.5)
            );

            const nextActive = page < totalPages - 1;
            const nextBtn = this.addUI(new BioPhaser.UI.Button(this, cx + 80, navY, '▶', {
                fontSize: '13px',
                backgroundColor: nextActive ? '#38BDF8' : '#CBD5E1',
                color: nextActive ? '#ffffff' : '#94A3B8',
                padding: { left: 12, right: 12, top: 5, bottom: 5 },
                fontFamily: FONT,
                container: this.layers.ui
            }));
            nextBtn.onClick(() => {
                if (this.resultsPage < totalPages - 1) { this.resultsPage++; this.showEnd(); }
            });
            nextBtn.create();
        }
    }
    
    getTypeColor() {
        if (this.classificationConfig.groups?.length) {
            return config.groups[this.classificationConfig.groups[0]]?.color || UI.colors.info;
        }
        if (this.classificationConfig.property) {
            const prop = config.properties[this.classificationConfig.property];
            if (prop) {
                const k = Object.keys(prop)[0];
                return prop[k]?.color || UI.colors.info;
            }
        }
        return UI.colors.info;
    }
}

const engine = new BioPhaser.Engine({
    type: Phaser.AUTO,
    width: UI.W,
    height: UI.H,
    backgroundColor: '#ffffff',
    parent: 'game-container'
});

engine.registerScene(AminoStartScene);
engine.registerScene(AminoGameScene);
engine.start();
