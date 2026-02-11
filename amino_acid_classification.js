import { BioPhaser } from './biophaser.js';

const config = await BioPhaser.Utils.ConfigLoader.load('./amino_acid_game.json');

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

// ========================================
// START SCENE - Navigacija ir pamokos
// ========================================

class AminoStartScene extends BioPhaser.BioScene {
    constructor() {
        super('AminoStart', config);
        this.selectedClassificationType = null;
        this.step = 0;
        this.step1Animated = false;
        this.step1Dna = null;
        this.step1DnaTween = null;
    }
    
    init(data) {
        super.init(data);
    }
    
    preload() {
        BioPhaser.Utils.AssetLoader.preloadFromConfig(this, config);
    }
    
    create() {
        this.createLayers();
        
        this.selectedClassificationType = null;
        this.step = 0;
        
        this.addComponent(
            new BioPhaser.Background.Gradient(
                this, 
                config.ui.theme.gradientTop, 
                config.ui.theme.gradientBottom
            ).create()
        );
        
        this.addComponent(
            new BioPhaser.Background.Particles(this, {
                count: config.ui.particles.count,
                icon: 'dna',
                sizeRange: config.ui.particles.sizeRange,
                alpha: config.ui.particles.alpha
            })
        ).create();
        
        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);
        
        this.showCurrentStep();
    }
    
    /**
     * Sukuria header elementus su title ir subtitle
     */
    renderHeader({ title, subtitle, y }) {
        const headerY = y ?? UI.headerY;
        
        const bg = this.add.rectangle(UI.CX, headerY, 860, UI.headerH, UI.colors.white, 0.86);
        bg.setStrokeStyle(2, UI.colors.stroke);
        this.layers.ui.add(bg);
        
        const t = this.add.text(UI.CX, headerY - 14, title, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(t);
        
        if (subtitle) {
            const s = this.add.text(UI.CX, headerY + 16, subtitle, {
                fontSize: '14px',
                color: UI.colors.muted,
                fontStyle: 'italic',
                fontFamily: 'Georgia'
            }).setOrigin(0.5);
            this.layers.ui.add(s);
        }
    }
    
    /**
     * Sukuria footer su "Atgal" ir pirminiu mygtukais
     */
    renderFooter({ backEnabled, primaryText, primaryEnabled, onBack, onPrimary }) {
        const backBtn = this.addUI(
            new BioPhaser.UI.Button(this, 160, UI.footerY, config.text.start.buttonBack, {
                fontSize: '18px',
                backgroundColor: backEnabled ? UI.colors.info : '#95a5a6',
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
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
            new BioPhaser.UI.Button(this, 740, UI.footerY, primaryText, {
                fontSize: '18px',
                backgroundColor: primaryEnabled ? UI.colors.primary : '#95a5a6',
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
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
        
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        const dna = this.add.image(centerX, centerY - 150, 'dna').setScale(0.25);
        this.layers.ui.add(dna);
        
        this.addTween({
            targets: dna,
            angle: 360,
            duration: 20000,
            repeat: -1
        });
        
        this.addTween({
            targets: dna,
            scale: 0.27,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        const title = this.add.text(centerX, centerY - 50, config.meta.title, {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const desc = this.add.text(centerX, centerY + 20, config.meta.description, {
            fontSize: '18px',
            color: '#687475ff',
            fontFamily: 'Georgia',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);
        this.layers.ui.add(desc);
        
        const startBtn = this.addUI(
            new BioPhaser.UI.Button(this, centerX, centerY + 100, config.text.start.buttonStart, {
                fontSize: '28px',
                backgroundColor: '#27ae60',
                padding: { left: 50, right: 50, top: 15, bottom: 15 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        
        startBtn.onClick(() => {
            this.step = 1;
            this.showCurrentStep();
        });
        
        startBtn.onHover(
            () => startBtn.setStyle({ backgroundColor: '#219150' }),
            () => startBtn.setStyle({ backgroundColor: '#27ae60' })
        );
        
        startBtn.create();
        BioPhaser.Animation.Tween.fadeIn(this, startBtn.element, 1000, 500);
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
        
        const title = this.add.text(centerX, 165, config.text.start.classificationTypeTitle, {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, 205, config.text.start.classificationTypeSubtitle, {
            fontSize: '15px',
            color: '#858f90ff',
            fontStyle: 'italic',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);
        
        const types = config.gameplay.classificationTypes;
        const startY = 280;
        const spacing = 140;
        
        types.forEach((type, i) => {
            const y = startY + i * spacing;
            const isSelected = this.selectedClassificationType === type.id;
            
            const card = this.addUI(
                new BioPhaser.UI.Card(this, centerX, y, {
                    width: 700,
                    height: 100,
                    label: type.question,
                    sublabel: this.getTypeDescription(type),
                    color: this.getTypeColor(type),
                    icon: this.getTypeIcon(type),
                    isSelected: isSelected,
                    container: this.layers.ui
                })
            );
            
            card.onClick(() => {
                this.selectedClassificationType = type.id;
                this.showCurrentStep();
            });
            
            card.create();
            
            if (card.cardElement) {
                card.cardElement.setFillStyle(
                    parseInt(this.getTypeColor(type).replace('#', '0x')), 
                    isSelected ? 0.4 : 0.3
                );
                card.cardElement.setStrokeStyle(
                    isSelected ? 4 : 2,
                    parseInt(this.getTypeColor(type).replace('#', '0x'))
                );
            }
            
            if (!this.step1Animated) {
                card.elements.forEach(el => {
                    const originalX = el.x;
                    el.setX(originalX - 600);
                    this.addTimer({
                        delay: i * 100,
                        callback: () => {
                            BioPhaser.Animation.Tween.slideInXY(this, el, originalX, el.y, 400);
                        }
                    });
                });
            }
        });
        
        this.step1Animated = true;
        
        this.renderFooter({
            backEnabled: true,
            primaryText: config.text.start.buttonContinue,
            primaryEnabled: !!this.selectedClassificationType,
            onBack: () => {
                this.step = 0;
                this.showCurrentStep();
            },
            onPrimary: () => {
                if (!this.selectedClassificationType) return;
                this.step = 2;
                this.showCurrentStep();
            }
        });
    }
    
    /**
     * Rodo pamokos ekraną su teorine medžiaga
     */
    showLessonScreen() {
        if (this.step1Dna) this.step1Dna.setVisible(false);
        
        const cx = UI.CX;
        
        const lesson = config.lessons[this.selectedClassificationType];
        if (!lesson) {
            this.step = 1;
            this.showCurrentStep();
            return;
        }
        
        this.renderHeader({
            title: lesson.title,
            subtitle: config.text.start.lessonSubtitle,
            y: 90
        });
        
        const dna = this.add.image(cx, 180, 'dna').setScale(0.12);
        this.layers.ui.add(dna);
        this.addTween({ 
            targets: dna, 
            angle: 360, 
            duration: 20000, 
            repeat: -1 
        });
        
        const intro = this.add.text(cx, 230, lesson.intro, {
            fontSize: '16px',
            color: UI.colors.text,
            fontFamily: 'Georgia',
            align: 'center',
            wordWrap: { width: 740 },
            lineSpacing: 4
        }).setOrigin(0.5);
        this.layers.ui.add(intro);
        
        const gap = 14;
        let yTop = intro.y + intro.height + 20;
        const cardW = 780;
        const leftX = cx - 360;
        const padTop = 14;
        const padBottom = 14;

        const cardBgColor = 0xf7f8fa;
        const borderColor = 0xdfe6e9;

        lesson.groups.forEach((g) => {
            const accent = parseInt(config.ui.groupAccentColors[g.key]) || 0x3498db;

            const shadow = this.add.rectangle(cx + 2, yTop + 36 + 2, cardW, 72, 0x000000, 0.06);
            this.layers.ui.add(shadow);

            const bg = this.add.rectangle(cx, yTop + 36, cardW, 72, cardBgColor, 0.98);
            bg.setStrokeStyle(2, borderColor);
            this.layers.ui.add(bg);

            const stripe = this.add.rectangle(cx - cardW / 2 + 6, yTop + 36, 10, 72, accent, 1);
            this.layers.ui.add(stripe);

            const label = this.add.text(leftX, yTop + padTop, g.label, {
                fontSize: '18px',
                fontStyle: 'bold',
                color: UI.colors.text,
                fontFamily: 'Georgia'
            }).setOrigin(0, 0);
            this.layers.ui.add(label);

            const tip = this.add.text(leftX, yTop + padTop + 26, g.tip, {
                fontSize: '12px',
                color: UI.colors.muted,
                fontFamily: 'Georgia',
                wordWrap: { width: 705 },
                lineSpacing: 2
            }).setOrigin(0, 0);
            this.layers.ui.add(tip);

            const neededH = Math.max(72, (tip.y + tip.height) - yTop + padBottom);

            bg.setSize(cardW, neededH);
            bg.y = yTop + neededH / 2;

            shadow.setSize(cardW, neededH);
            shadow.y = bg.y;

            stripe.setSize(10, neededH);
            stripe.y = bg.y;

            yTop += neededH + gap;
        });
        
        this.renderFooter({
            backEnabled: true,
            primaryText: config.text.start.buttonStartTraining,
            primaryEnabled: true,
            onBack: () => {
                this.step = 1;
                this.showCurrentStep();
            },
            onPrimary: () => {
                this.scene.start('AminoGame', {
                    classificationType: this.selectedClassificationType,
                    mode: 'full'
                });
            }
        });
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
        
    }

    uiReset() {
        this.cleanupUI();
    }
    
    renderHeader({ leftLabel, rightLabel, centerText, showProgress = true }) {
        const bg = this.add.rectangle(UI.CX, UI.headerY, 860, UI.headerH, UI.colors.white, 0.86);
        bg.setStrokeStyle(2, UI.colors.stroke);
        this.layers.ui.add(bg);
        
        const left = this.addUI(
            new BioPhaser.UI.Badge(this, 140, UI.headerY, leftLabel, {
                backgroundColor: '#2C3E50',
                container: this.layers.ui
            })
        ).create();
        
        const right = this.addUI(
            new BioPhaser.UI.Badge(this, 760, UI.headerY, rightLabel, {
                backgroundColor: '#2C3E50',
                container: this.layers.ui
            })
        ).create();
        
        const title = this.add.text(UI.CX, UI.headerY - 18, centerText, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);

        if (this.progressBarFill && this.progressBarBg) {
            if (showProgress) {
                this.progressBarBg.setVisible(true);
                this.progressBarFill.setVisible(true);
                const percent = Math.min((this.currentIndex + 1) / this.totalQuestions, 1);
                this.progressBarFill.width = Math.min(420 * percent, 420);
            } else {
                this.progressBarBg.setVisible(false);
                this.progressBarFill.setVisible(false);
            }
        }
    }
    
    renderFooter({ backText, primaryText, primaryEnabled, onBack, onPrimary }) {
        backText = backText || config.text.game.buttonBack;
        
        const backBtn = this.addUI(
            new BioPhaser.UI.Button(this, 160, UI.footerY, backText, {
                fontSize: '18px',
                backgroundColor: UI.colors.info,
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
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
        
        const primaryBtn = this.addUI(
            new BioPhaser.UI.Button(this, 740, UI.footerY, primaryText, {
                fontSize: '18px',
                backgroundColor: primaryEnabled ? UI.colors.primary : '#95a5a6',
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
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
        
        return { backBtn, primaryBtn };
    }
    
    create() {
        this.createLayers();
        
        this.addComponent(
            new BioPhaser.Background.Gradient(
                this, 
                config.ui.theme.gradientTop, 
                config.ui.theme.gradientBottom
            ).create()
        );
        
        this.addComponent(
            new BioPhaser.Background.Particles(this, {
                count: 15,
                icon: 'dna',
                sizeRange: [20, 40],
                alpha: 0.08
            })
        ).create();
        
        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);
        
        this.determineAvailableGroups();
        this.generateQuestionsQueue();
        
        this.totalQuestions = this.queue.length;
        
        // Progress bar (persistent UI elementai)
        this.progressBarBg = this.add.rectangle(
            UI.CX, UI.headerY + 18, 420, 10, 
            0xe0e0e0
        );
        this.layers.uiPersistent.add(this.progressBarBg);
        
        this.progressBarFill = this.add.rectangle(
            UI.CX - 210, UI.headerY + 18, 0, 10,
            0x27AE60
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
            centerText: `${this.currentIndex + 1} / ${this.queue.length}`
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
        
        const q = this.add.text(cx, UI.contentTop, this.classificationConfig.question, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia',
            align: 'center',
            wordWrap: { width: 760 }
        }).setOrigin(0.5);
        this.layers.ui.add(q);
        
        const cardY = UI.contentTop + 95;
        const box = this.add.rectangle(cx, cardY, 560, 120, UI.colors.white, 0.88);
        box.setStrokeStyle(2, UI.colors.stroke);
        this.layers.ui.add(box);
        
        BioPhaser.Animation.Tween.fadeIn(this, box, 200, 0);
        
        const code = this.add.text(cx, cardY - 16, this.currentAminoAcid, {
            fontSize: '38px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.layers.ui.add(code);
        BioPhaser.Animation.Tween.fadeIn(this, code, 300, 100);
        
        const name = this.add.text(cx, cardY + 26, config.items[this.currentAminoAcid], {
            fontSize: '18px',
            color: UI.colors.muted,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(name);
        BioPhaser.Animation.Tween.fadeIn(this, name, 300, 150);
        
        const choicesY = UI.contentTop + 270;
        this.renderChoices(cx, choicesY);
    }
    
    renderChoices(cx, startY) {
        const groups = this.availableGroups;
        const cols = groups.length === 4 ? 2 : groups.length;
        const rows = groups.length === 4 ? 2 : 1;
        
        const choiceW = UI.choiceW;
        const choiceH = UI.choiceH;
        const gapX = UI.choiceGapX;
        const gapY = UI.choiceGapY;
        
        groups.forEach((group, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = cx - ((cols - 1) * (choiceW + gapX)) / 2 + col * (choiceW + gapX);
            const y = startY + row * (choiceH + gapY);
            
            const choice = this.addUI(
                new BioPhaser.UI.Card(this, x, y, {
                    width: choiceW,
                    height: choiceH,
                    label: group.label,
                    sublabel: group.description,
                    color: group.color,
                    icon: group.icon,
                    container: this.layers.ui
                })
            );
            
            choice.onClick(() => this.checkAnswer(group));
            choice.create();
            
            // Slide-in animacija
            choice.elements.forEach(el => {
                const originalX = el.x;
                el.setX(originalX - 600);
                this.addTimer({
                    delay: i * 80,
                    callback: () => {
                        BioPhaser.Animation.Tween.slideInXY(this, el, originalX, el.y, 300);
                    }
                });
            });
        });
    }
    
    checkAnswer(selectedGroup) {
        const correctGroup = this.getCorrectGroup();
        const isCorrect = selectedGroup.key === correctGroup.key;
        
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
                // Įterpiame atgal į eilę po 3-5 klausimų
                const insertPos = Math.min(
                    this.currentIndex + Phaser.Math.Between(3, 5),
                    this.queue.length
                );
                this.queue.splice(insertPos, 0, this.currentAminoAcid);
            }
        }
        
        this.showFeedback(isCorrect, correctGroup);
        
        this.renderFooter({
            primaryText: config.text.game.buttonNext,
            primaryEnabled: true,
            onBack: () => {
                this.scene.stop('AminoGame');
                this.scene.start('AminoStart');
            },
            onPrimary: () => {
                this.currentIndex++;
                this.startQuestion();
            }
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
        const cx = UI.CX;
        const color = isCorrect ? UI.colors.primary : UI.colors.danger;
        
        const title = isCorrect 
            ? config.text.game.feedback.correct
            : config.text.game.feedback.incorrect;
        const subtitle = isCorrect 
            ? `${config.text.game.feedback.groupLabel} ${correctGroup.label}` 
            : `${config.text.game.feedback.correctGroupLabel} ${correctGroup.label}`;
        const explanation = this.getExplanation(this.currentAminoAcid, correctGroup);
        
        const modal = this.addUI(
            new BioPhaser.UI.Modal(this, cx, 640, {
                width: 700,
                height: 140,
                title: `${title}\n${subtitle}\n\n${explanation}`,
                borderColor: parseInt(color.replace('#', '0x')),
                titleStyle: {
                    fontSize: '16px',
                    color: UI.colors.text,
                    fontStyle: 'bold',
                    align: 'center',
                    lineSpacing: 6
                },
                container: this.layers.modal
            })
        );
        modal.create();
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
        
        const cx = UI.CX;
        const correct = this.resultsHistory.filter(r => r.correct).length;
        const total = this.resultsHistory.length || 1;
        const pct = Math.round((correct / total) * 100);
        
        this.renderHeader({
            leftLabel: `${config.text.game.masteredLabel} ${this.mastered.size}/${Object.keys(config.items).length}`,
            rightLabel: this.getHeaderRightLabel(),
            centerText: config.text.game.resultsTitle,
            showProgress: false
        });
        
        const title = this.add.text(cx, UI.contentTop + 10, `${correct} / ${total}`, {
            fontSize: '32px',
            fontStyle: 'bold',
            color: pct >= 70 ? UI.colors.primary : pct >= 50 ? UI.colors.warn : UI.colors.danger,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const mastered = this.add.text(cx, UI.contentTop + 67, 
            `${config.text.game.masteredLabel} ${this.mastered.size}`, {
            fontSize: '12px',
            color: UI.colors.muted,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(mastered);
        
        this.showDetailedResults(cx, UI.contentTop + 95);
        
        const wrong = this.resultsHistory.filter(r => !r.correct).map(r => r.aminoAcid);
        const uniqueWrong = [...new Set(wrong)];
        
        this.renderFooter({
            primaryText: uniqueWrong.length 
                ? config.text.game.reviewWrongButton
                : config.text.game.repeatTrainingButton,
            primaryEnabled: true,
            onBack: () => {
                this.scene.stop('AminoGame');
                this.scene.start('AminoStart');
            },
            onPrimary: () => {
                this.scene.stop('AminoGame');
                this.scene.start('AminoGame', {
                    classificationType: this.classificationType,
                    mode: uniqueWrong.length ? 'review' : 'full',
                    reviewOnly: uniqueWrong
                });
            }
        });
    }
    
    /**
     * Rodo detalią rezultatų lentelę
     */
    showDetailedResults(cx, startY) {
        const perPage = this.resultsPerPage ?? 10;
        const page = this.resultsPage ?? 0;

        const total = this.resultsHistory.length;
        const pageCount = Math.max(1, Math.ceil(total / perPage));
        const start = page * perPage;
        const slice = this.resultsHistory.slice(start, start + perPage);

        const navY = startY - 40;

        const pageLabel = this.add.text(cx, navY, `${config.text.game.pageLabel} ${page + 1} / ${pageCount}`, {
            fontSize: '12px',
            color: UI.colors.muted,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(pageLabel);

        const prevBtn = this.addUI(new BioPhaser.UI.Button(this, cx - 170, navY, '◀', {
            fontSize: '14px',
            backgroundColor: page > 0 ? UI.colors.info : '#95a5a6',
            padding: { left: 10, right: 10, top: 6, bottom: 6 },
            container: this.layers.ui
        }));
        prevBtn.onClick(() => {
            if (this.resultsPage > 0) {
            this.resultsPage--;
            this.showEnd();
            }
        });
        prevBtn.create();

        const nextBtn = this.addUI(new BioPhaser.UI.Button(this, cx + 170, navY, '▶', {
            fontSize: '14px',
            backgroundColor: page < pageCount - 1 ? UI.colors.info : '#95a5a6',
            padding: { left: 10, right: 10, top: 6, bottom: 6 },
            container: this.layers.ui
        }));
        nextBtn.onClick(() => {
            if (this.resultsPage < pageCount - 1) {
            this.resultsPage++;
            this.showEnd();
            }
        });
        nextBtn.create();

        const tableY = startY + 10;

        this.addUI(new BioPhaser.UI.Table(this, cx, tableY, {
            width: 760,
            rowHeight: 24,
            headers: [
            { x: cx - 280, text: config.text.game.tableHeaders.code },
            { x: cx - 110, text: config.text.game.tableHeaders.name },
            { x: cx + 100, text: config.text.game.tableHeaders.result },
            { x: cx + 260, text: config.text.game.tableHeaders.correct }
            ],
            data: slice.map(r => ([
            { text: r.aminoAcid, fontStyle: 'bold', fontFamily: 'monospace' },
            { text: r.name.length > 12 ? r.name.slice(0, 12) + '..' : r.name },
            { text: r.correct ? '✓' : '✗', color: r.correct ? UI.colors.primary : UI.colors.danger, fontStyle: 'bold' },
            { text: r.correct ? '—' : r.correctGroup, color: UI.colors.primary }
            ])),
            scrollFactor: 0
        })).create();
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