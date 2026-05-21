
import { BioPhaser } from '../core/bio-phaser.js';
import { Progress } from '../core/progress.js';

const config = await BioPhaser.Utils.ConfigLoader.load('config/codon-game.json');
config.width = 1400;
config.height = 900;

const UI = { W: 1400, H: 900, CX: 700, CY: 450 };

const FONT  = BioPhaser.Theme.font;
const THEME = BioPhaser.Theme.colors;

class CodonStartScene extends BioPhaser.BioScene {
    constructor() {
        super('CodonStart', config);
        this.selectedGroups = [];
        this.selectedMode = null;
        this.selectedDifficulty = null;
        this.step = 0;
        this.visitedSteps = new Set();
    }

    init(data) {
        super.init(data);
    }
    
    preload() {
        BioPhaser.Utils.AssetLoader.preloadFromConfig(this, config);
        this.load.image('particlesDecor', 'assets/particles.png');
    }

    create() {
        this.createLayers();
        BioPhaser.UI.Helpers.addMenuButton(this);

        this.selectedGroups = [];
        this.selectedMode = null;
        this.selectedDifficulty = null;
        this.step = 0;
        this.visitedSteps = new Set();

        BioPhaser.UI.Helpers.createStandardBackground(this);
        this.ensurePersistentStepDNA();

        this.showCurrentStep();
    }

    ensurePersistentStepDNA() {
        if (this.stepDNAImage?.active) return;

        this.stepDNAImage = this.add.image(UI.CX, 80, 'dna')
            .setScale(0.15)
            .setVisible(false);
        this.layers.uiPersistent.add(this.stepDNAImage);

        this.stepDNATween = this.addTween({
            targets: this.stepDNAImage,
            angle: 360,
            duration: 20000,
            repeat: -1
        });
    }

    setStepDNAVisible(visible) {
        this.ensurePersistentStepDNA();
        if (this.stepDNAImage) this.stepDNAImage.setVisible(visible);
    }
    
    /**
     * Atvaizduoja dabartinį žingsnį
     * Išvalo UI ir rodo atitinkamą ekraną pagal this.step
     */
    showCurrentStep() {
        this.cleanupUI();
        this.setStepDNAVisible(this.step !== 0);
        
        switch(this.step) {
            case 0: this.showTitleScreen(); break;
            case 1: this.showGroupSelection(); break;
            case 2: this.showModeSelection(); break;
            case 3: this.showDifficultySelection(); break;
        }
    }
    
    /**
     * Rodo pradinį titulinį ekraną
     * Su animuota DNA ikona ir "Pradėti" mygtuku
     */
    showTitleScreen() {
        const layer = this.layers.ui;
        const leftX = 210;
        const previewX = 1040;
        const previewY = 430;

        const c1 = this.add.circle(100, 140, 100, parseInt(THEME.warning.replace('#', '0x')), 0.04);
        const c2 = this.add.circle(1110, 730, 140, parseInt(THEME.primary.replace('#', '0x')), 0.035);
        const c3 = this.add.circle(1030, 165, 75, parseInt(THEME.info.replace('#', '0x')), 0.03);
        layer.add([c1, c2, c3]);

        const moduleLabel = this.add.text(leftX, 220, 'DNR KODONŲ MOKYMASIS', {
            fontSize: '13px', fontStyle: 'bold', color: THEME.primary,
            fontFamily: FONT, letterSpacing: 2
        }).setOrigin(0, 0.5);
        layer.add(moduleLabel);

        const titleText = this.add.text(leftX, 255, 'Kodonų\nžaidimas', {
            fontSize: '60px', fontStyle: 'bold', color: THEME.text,
            fontFamily: FONT, lineSpacing: 6,
            wordWrap: { width: 460 }
        }).setOrigin(0, 0);
        layer.add(titleText);

        const descText = this.add.text(leftX, 430, 'Sužinok, kaip mRNR kodonai koduoja\naminorūgštis ir stop signalus.', {
            fontSize: '19px', color: THEME.muted, fontFamily: FONT, lineSpacing: 8
        }).setOrigin(0, 0);
        layer.add(descText);

        const chips = ['mRNR', 'Kodonai', 'Aminorūgštys'];
        chips.forEach((label, i) => {
            const chipX = leftX + i * 164;
            const chipBg = this.add.rectangle(chipX + 58, 545, 116, 36,
                parseInt(THEME.primary.replace('#', '0x')), 0.1).setOrigin(0.5);
            const chipText = this.add.text(chipX + 58, 545, label, {
                fontSize: '14px', fontStyle: 'bold', color: THEME.primary, fontFamily: FONT
            }).setOrigin(0.5);
            layer.add([chipBg, chipText]);
        });

        const startBtn = BioPhaser.UI.Helpers.addModernButton(this, 340, 650, 'Pradėti →', {
            width: 220, height: 52,
            variant: 'primary',
            container: layer,
            fontSize: '22px'
        });
        startBtn.onClick(() => { this.step = 1; this.showCurrentStep(); });

        const cardBg = this.add.rectangle(previewX, previewY, 410, 390, 0xFFFFFF)
            .setStrokeStyle(1.5, 0xD8E2EC);
        layer.add(cardBg);

        const cardTitle = this.add.text(previewX, previewY - 164, 'Kodono pavyzdžiai', {
            fontSize: '14px', fontStyle: 'bold', color: THEME.text, fontFamily: FONT
        }).setOrigin(0.5, 0);
        layer.add(cardTitle);

        const previewRows = [
            { codon: 'AUG', label: 'Met (Pradžia)', color: THEME.primary },
            { codon: 'UUU', label: 'Phe',           color: THEME.info },
            { codon: 'UAA', label: 'Stop',          color: THEME.danger }
        ];
        const rowStartY = previewY - 82;
        previewRows.forEach((row, i) => {
            const rowY = rowStartY + i * 82;
            const rowColor = parseInt(row.color.replace('#', '0x'));

            const tileBg = this.add.rectangle(previewX - 118, rowY, 64, 44, rowColor, 0.15)
                .setStrokeStyle(1, rowColor, 0.4);
            const tileText = this.add.text(previewX - 118, rowY, row.codon, {
                fontSize: '17px', fontStyle: 'bold', color: row.color, fontFamily: FONT
            }).setOrigin(0.5);

            const arrow = this.add.text(previewX - 58, rowY, '→', {
                fontSize: '18px', color: THEME.muted, fontFamily: FONT
            }).setOrigin(0.5);

            const groupBg = this.add.rectangle(previewX + 56, rowY, 168, 36, rowColor, 0.08)
                .setStrokeStyle(1, rowColor, 0.25);
            const groupText = this.add.text(previewX + 56, rowY, row.label, {
                fontSize: '15px', fontStyle: 'bold', color: row.color, fontFamily: FONT
            }).setOrigin(0.5);

            layer.add([tileBg, tileText, arrow, groupBg, groupText]);
        });

        BioPhaser.Animation.Tween.fadeIn(this, layer, 400, 0);
    }
    
    /**
     * Rodo grupių pasirinkimo ekraną
     * Leidžia pasirinkti amino rūgščių grupes filtravimui
     */
    showGroupSelection() {
        const centerX = UI.CX;
        
        const title = this.add.text(centerX, 145, 'Aminorūgščių grupės', {
            fontSize: '36px',
            fontStyle: 'bold',
            color: THEME.text,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(title);

        const subtitle = this.add.text(centerX, 195, config.ui.groupSelectionSubtitle, {
            fontSize: '15px',
            color: THEME.muted,
            fontStyle: 'italic',
            fontFamily: FONT,
            wordWrap: { width: 600 },
            align: 'center'
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);

        const selectAllBtn = BioPhaser.UI.Helpers.addModernButton(this, centerX + 290, 235, 'Pažymėti visas', {
            width: 170, height: 34,
            variant: 'info',
            container: this.layers.ui,
            fontSize: '13px'
        });
        selectAllBtn.onClick(() => {
            const allGroups = Object.keys(config.groups);
            if (allGroups.every(g => this.selectedGroups.includes(g))) {
                this.selectedGroups = [];
            } else {
                this.selectedGroups = [...allGroups];
            }
            this.showCurrentStep();
        });

        const startY = 285;
        const rowSpacing = 72;
        Object.entries(config.groups).forEach(([key, group], i) => {
            const isSelected = this.selectedGroups.includes(key);

            const row = BioPhaser.UI.Helpers.addSelectionRow(this, centerX, startY + i * rowSpacing, {
                width: 760, height: 64,
                title: group.label,
                subtitle: `${group.members.length} ${config.ui.membersName}`,
                color: group.color,
                selected: isSelected,
                badge: isSelected ? 'Pasirinkta ✓' : 'Rinktis',
                container: this.layers.ui
            });
            row.onClick(() => {
                const idx = this.selectedGroups.indexOf(key);
                if (idx > -1) this.selectedGroups.splice(idx, 1);
                else this.selectedGroups.push(key);
                this.showCurrentStep();
            });

            if (!this.visitedSteps.has(1)) {
                row.group.setAlpha(0);
                this.addTimer({ delay: i * 60, callback: () => {
                    BioPhaser.Animation.Tween.fadeIn(this, row.group, 280);
                }});
            }
        });

        const filteredItems = BioPhaser.Utils.DataProcessor.getFilteredItems(
            config.items, config.groups, this.selectedGroups
        );

        const countText = this.add.text(centerX, 720,
            this.selectedGroups.length > 0
                ? `Pažymėta: ${filteredItems.length} ${config.ui.itemsName}`
                : 'Pasirinkite bent vieną grupę', {
            fontSize: '16px', fontStyle: 'bold',
            color: this.selectedGroups.length > 0 ? THEME.primary : THEME.danger,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(countText);

        const hasGroups = this.selectedGroups.length > 0;
        const continueBtn = BioPhaser.UI.Helpers.addModernButton(this, centerX + 295, 800, 'Tęsti →', {
            width: 190, height: 46,
            variant: 'primary',
            disabled: !hasGroups,
            container: this.layers.ui,
            fontSize: '18px'
        });
        continueBtn.onClick(() => { this.step = 2; this.showCurrentStep(); });

        const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 180, 800, '← Atgal', {
            width: 150, height: 44,
            variant: 'secondary',
            container: this.layers.ui
        });
        backBtn.onClick(() => { this.step = 0; this.showCurrentStep(); });

        this.visitedSteps.add(1);
    }
    
    /**
     * Rodo režimo pasirinkimo ekraną
     * Leidžia pasirinkti tarp mokymosi ir iššūkio režimų
     */
    showModeSelection() {
        const centerX = UI.CX;
        
        const title = this.add.text(centerX, 165, 'Žaidimo režimas', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: THEME.text,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, 205, 'Kaip nori mokytis šiandien?', {
            fontSize: '15px',
            color: THEME.muted,
            fontStyle: 'italic',
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);
        
        const modes = Object.entries(config.modes);
        const startY = 320;
        const spacing = 125;

        modes.forEach(([key, mode], i) => {
            const isSelected = this.selectedMode === key;
            const row = BioPhaser.UI.Helpers.addSelectionRow(this, centerX, startY + i * spacing, {
                width: 760, height: 104,
                title: mode.label,
                subtitle: mode.description,
                color: mode.color,
                selected: isSelected,
                badge: isSelected ? 'Pasirinkta ✓' : 'Rinktis',
                container: this.layers.ui
            });
            row.onClick(() => {
                this.selectedMode = key;
                BioPhaser.Animation.Effects.starBurst(this, centerX, startY + i * spacing);
                this.showCurrentStep();
            });
        });

        const hasMode = !!this.selectedMode;
        const continueBtn = BioPhaser.UI.Helpers.addModernButton(this, centerX + 295, 820, 'Tęsti →', {
            width: 190, height: 46,
            variant: 'primary',
            disabled: !hasMode,
            container: this.layers.ui,
            fontSize: '18px'
        });
        continueBtn.onClick(() => { this.step = 3; this.showCurrentStep(); });

        const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 180, 820, '← Atgal', {
            width: 150, height: 44,
            variant: 'secondary',
            container: this.layers.ui
        });
        backBtn.onClick(() => { this.step = 1; this.showCurrentStep(); });

        this.visitedSteps.add(2);
    }
    
    /**
     * Rodo sunkumo lygio pasirinkimo ekraną
     * Leidžia pasirinkti lengvą, vidutinį arba sunkų lygį
     */
    showDifficultySelection() {
        const centerX = UI.CX;
        
        const title = this.add.text(centerX, 165, 'Sunkumo lygis', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: THEME.text,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, 205, 'Koks tavo pasirengimo lygis?', {
            fontSize: '15px',
            color: THEME.muted,
            fontStyle: 'italic',
            fontFamily: FONT
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);
        
        const isMokymosi = this.selectedMode === 'mokymosi';

        const difficulties = Object.entries(config.difficulties);
        const startY = 285;
        const spacing = 104;

        difficulties.forEach(([key, diff], i) => {
            const isSelected = this.selectedDifficulty === key;
            const desc = isMokymosi
                ? diff.description
                : `Kodonas matomas ${diff.introTime / 1000}s ir ${diff.timeLimitPerCodon}s surasti jį sekoje`;

            const row = BioPhaser.UI.Helpers.addSelectionRow(this, centerX, startY + i * spacing, {
                width: 760, height: 86,
                title: diff.label,
                subtitle: desc,
                color: diff.color,
                selected: isSelected,
                badge: isSelected ? 'Pasirinkta ✓' : 'Rinktis',
                container: this.layers.ui
            });
            row.onClick(() => {
                this.selectedDifficulty = key;
                BioPhaser.Animation.Effects.starBurst(this, centerX, startY + i * spacing);
                this.showCurrentStep();
            });

            if (!this.visitedSteps.has(3)) {
                row.group.setAlpha(0);
                this.addTimer({ delay: i * 80, callback: () => {
                    BioPhaser.Animation.Tween.fadeIn(this, row.group, 280);
                }});
            }
        });

        const backBtn = BioPhaser.UI.Helpers.addModernButton(this, 180, 820, '← Atgal', {
            width: 150, height: 44,
            variant: 'secondary',
            container: this.layers.ui
        });
        backBtn.onClick(() => { this.step = 2; this.showCurrentStep(); });

        const hasDiff = !!this.selectedDifficulty;
        const startBtn = BioPhaser.UI.Helpers.addModernButton(this, centerX + 295, 820, 'Pradėti žaidimą', {
            width: 210, height: 46,
            variant: 'primary',
            disabled: !hasDiff,
            container: this.layers.ui,
            fontSize: '18px'
        });
        startBtn.onClick(() => {
            this.scene.launch('CodonGame', {
                difficulty: this.selectedDifficulty,
                mode: this.selectedMode,
                selectedGroups: this.selectedGroups
            });
            this.addTimer({ delay: 0, callback: () => { this.scene.stop('CodonStart'); } });
        });

        this.visitedSteps.add(3);
    }
}

// ========================================
// GAME SCENE - Pagrindinis žaidimas
// ========================================
class CodonGameScene extends BioPhaser.BioScene {
    constructor() {
        super('CodonGame', config);
        this.totalCodons = 0;
        this.resultsHistory = [];
        this.timer = null;
        this._wheelBound = false;
    }
    
    init(data) {
        super.init(data);
        
        this._wheelBound = false;
        
        this.difficulty = data.difficulty || 'vidutinis';
        this.mode = data.mode || 'mokymosi';
        this.selectedGroups = data.selectedGroups || [];
        this.difficultySettings = this.getDifficultySettings(this.difficulty);
        this.modeSettings = this.getModeSettings(this.mode);
        
        if (this.mode === 'mokymosi') {
            this.hintLevel = 1;
            this.wrongAttempts = 0;
            this.totalWrongClicks = 0;
        }
        
        if (this.mode === 'issukio') {
            this.codonTimes = [];
        }
    }
    
    getModeSettings(mode) {
        const modeConfig = config.modes[mode];
        return {
            label: modeConfig.label,
            color: modeConfig.color,
            showHints: modeConfig.showHints || false,
            instantFeedback: modeConfig.instantFeedback || false,
            timerEnabled: modeConfig.timerEnabled || false
        };
    }
    
    getDifficultySettings(difficulty) {
        const diffConfig = config.difficulties[difficulty];
        return {
            introTime: diffConfig.introTime,
            introTimeChallenge: diffConfig.introTimeChallenge,
            timeLimitPerCodon: diffConfig.timeLimitPerCodon,
            sequenceLengthLearning: diffConfig.sequenceLengthLearning,
            sequenceLengthChallenge: diffConfig.sequenceLengthChallenge,
            label: diffConfig.label,
            color: diffConfig.color
        };
    }
    
    preload() {
        this.load.image('particlesDecor', 'assets/particles.png');
        this.load.image('arrowLeft', 'assets/left.png');
        this.load.image('arrowRight', 'assets/right.png');
        this.load.image('iconCorrect', 'assets/check.png');
        this.load.image('iconWrong', 'assets/delete.png');
        this.load.image('iconMissed', 'assets/warning.png');
        this.load.image('iconTimer', 'assets/timer.png');
    }
    
    create() {
        this.createLayers();

        BioPhaser.UI.Helpers.createStandardBackground(this);

        this.startTime = Date.now();
        this.bases = ['A', 'U', 'G', 'C'];
        
        const filteredArray = BioPhaser.Utils.DataProcessor.getFilteredItems(
            config.items, config.groups, this.selectedGroups
        );
        
        this.filteredCodons = {};
        filteredArray.forEach(item => {
            this.filteredCodons[item.key] = item.value;
        });
        
        this.codons = Object.keys(this.filteredCodons);
        this.codonsQueue = Phaser.Utils.Array.Shuffle(this.codons);
        this.currentIndex = 0;
        this.totalCodons = this.codons.length;
        
        this.targetCodon = this.codonsQueue[this.currentIndex];
        this.targetAmino = this.filteredCodons[this.targetCodon];
        
        this.generateSequence();
        
        this.selections = new Set();
        this.symbols = [];
        
        if (this.mode === 'mokymosi') {
            this.foundCodonCount = 0;
            this.totalTargetCodons = 0;
        }
        
        this.createPersistentUI();
        this.updateProgress();
        this.showIntro();
    }
    
    /**
     * Sukuria persistent UI elementus (badge'us, progress bar)
     * Šie elementai lieka visą žaidimo sceną ir nėra valomi per cleanupUI()
     */
    createPersistentUI() {
        const badgeY = 30;

        this.diffBadge = this.addComponent(new BioPhaser.UI.Badge(this, UI.CX - 440, badgeY, this.difficultySettings.label, {
                backgroundColor: this.difficultySettings.color,
                container: this.layers.uiPersistent
            })
        ).create();

        this.modeBadge = this.addComponent(new BioPhaser.UI.Badge(this, UI.CX + 440, badgeY, this.modeSettings.label, {
                backgroundColor: this.modeSettings.color,
                container: this.layers.uiPersistent
            })
        ).create();

        const centerX = UI.CX;
        const textY = 56;
        const barY = 78;
        
        this.progressTextObj = this.addComponent(new BioPhaser.GameObject(this, { container: this.layers.uiPersistent }));
        this.progressText = this.add.text(centerX, textY, 'Progresas: 0%', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: THEME.text,
            fontFamily: FONT
        }).setOrigin(0.5);
        this.progressTextObj.addElement(this.progressText);
        
        this.progressBar = this.addComponent(new BioPhaser.UI.ProgressBar(this, centerX, barY, {
                width: 500,
                height: 10,
                progress: 0,
                bgColor: '#e0e0e0',
                color: THEME.primary,
                container: this.layers.uiPersistent
            })
        ).create();
    }
    
    /**
     * Užtikrina kad persistent UI egzistuoja
     * Jei neegzistuoja - perkuria
     */
    ensurePersistentUI() {
        const needsRecreation = !this.diffBadge || !this.modeBadge || 
                                !this.progressText || !this.progressText.active || 
                                !this.progressBar;
        
        if (needsRecreation) {
            this.destroyPersistentUI();
            this.createPersistentUI();
        }
    }
    
    /**
     * Sunaikina persistent UI elementus
     * Naudojama prieš results screen
     */
    destroyPersistentUI() {
        if (this.diffBadge) {
            this.diffBadge.destroy();
            this.diffBadge = null;
        }
        if (this.modeBadge) {
            this.modeBadge.destroy();
            this.modeBadge = null;
        }
        if (this.progressTextObj) {
            this.progressTextObj.destroy();
            this.progressTextObj = null;
            this.progressText = null;
        }
        if (this.progressBar) {
            this.progressBar.destroy();
            this.progressBar = null;
        }
    }
    
    /**
     * Atnaujina pažangos rodiklį
     * Rodo kiek kodonų jau atlikta procentais
     */
    updateProgress() {
        this.ensurePersistentUI();
        
        const percent = Math.round(100 * (this.currentIndex / this.codonsQueue.length));
        
        if (this.progressText && this.progressText.active) {
            this.progressText.setText(`Progresas: ${percent}%`);
        }
        
        if (this.progressBar) {
            this.progressBar.setProgress(percent / 100);
        }
    }
    
    /**
     * Rodo intro ekraną su tiksliniu kodonu
     * Rodymo laikas priklauso nuo sunkumo ir režimo
     */
    showIntro() {
        if (this.timer && this.timer.text) {
            this.timer.text.setVisible(false);
        }

        const cardX = UI.CX;
        const cardY = 360;
        const cardW = 720;
        const cardH = 260;

        const shadow = this.add.rectangle(cardX + 4, cardY + 6, cardW, cardH, 0x000000, 0.06);
        const cardBg = this.add.rectangle(cardX, cardY, cardW, cardH, 0xFFFFFF, 0.97)
            .setStrokeStyle(1.5, 0xD8E2EC);

        const label = this.add.text(cardX, cardY - cardH / 2 + 32, 'ĮSIMINIMO ETAPAS', {
            fontFamily: FONT, fontSize: '13px', fontStyle: 'bold',
            color: THEME.primary, letterSpacing: 2
        }).setOrigin(0.5);

        const titleEl = this.add.text(cardX, cardY - cardH / 2 + 68, 'Įsimink kodoną', {
            fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: THEME.text
        }).setOrigin(0.5);

        const aminoEl = this.add.text(cardX - 80, cardY + 20, this.targetAmino, {
            fontFamily: FONT, fontSize: '36px', fontStyle: 'bold', color: THEME.text
        }).setOrigin(0.5);

        const arrowEl = this.add.text(cardX, cardY + 20, '→', {
            fontFamily: FONT, fontSize: '32px', color: THEME.muted
        }).setOrigin(0.5);

        const codonEl = this.add.text(cardX + 90, cardY + 20, this.targetCodon, {
            fontFamily: 'monospace', fontSize: '42px', fontStyle: 'bold',
            color: parseInt(THEME.primary.replace('#', '0x')) ? THEME.primary : THEME.text
        }).setOrigin(0.5);

        const hintEl = this.add.text(cardX, cardY + cardH / 2 - 28,
            'Netrukus reikės rasti šį kodoną mRNR sekoje.', {
            fontFamily: FONT, fontSize: '15px', color: THEME.muted
        }).setOrigin(0.5);

        const els = [shadow, cardBg, label, titleEl, aminoEl, arrowEl, codonEl, hintEl];
        this.layers.ui.add(els);
        BioPhaser.Animation.Tween.fadeIn(this, this.layers.ui, 300);

        const introTime = this.mode === 'issukio'
            ? this.difficultySettings.introTimeChallenge
            : this.difficultySettings.introTime;

        this.addTimer({
            delay: introTime,
            callback: () => {
                els.forEach(el => el.setVisible(false));
                this.showSequence();
            }
        });
    }
    
    /**
     * Rodo mRNR seką su interaktyviais nukleotidais
     * Sukuria slankiojančią seką su galimybe žymėti kodonus
     */
    showSequence() {
        const instructionText = this.add.text(UI.CX, 130, 'Surask visus atitinkamus kodonus mRNR sekoje', {
            fontFamily: FONT,
            fontSize: '24px',
            fontStyle: 'bold',
            color: THEME.text
        }).setOrigin(0.5);
        this.layers.ui.add(instructionText);
        
        if (this.mode === 'mokymosi') {
            this.showHintButtons();
        }
        
        if (this.mode === 'issukio') {
            const centerX = UI.CX;

            if (this.timer) {
                this.timer.stop();
                this.timer = null;
            }
            
            this.timer = this.addUI(new BioPhaser.UI.Timer(this, centerX, 30, {
                    duration: this.difficultySettings.timeLimitPerCodon,
                    warningThreshold: 10,
                    showIcon: true,
                    fontSize: '20px',
                    container: this.layers.ui,
                    onWarning: () => {
                        BioPhaser.Animation.Effects.createShake(this, this.timer.text, 3, 200);
                    },
                    onComplete: () => {
                        this.timeUp();
                    }
                })
            ).create().start();
        }
        
        const spacing = 28;
        const extraGap = 6;
        const viewX = 250;
        const viewWidth = 900;
        const y = 250;
        
        const colorMap = {
            'A': '#27ae60',
            'U': '#2980b9',
            'G': '#f39c12',
            'C': '#8e44ad'
        };
        
        this.sequenceContainer = this.add.container(viewX, y);
        this.layers.ui.add(this.sequenceContainer);
        this.symbols = [];
        
        if (this.mode === 'mokymosi') {
            this.totalTargetCodons = 0;
            for (let i = 0; i < this.fullSequence.length; i += 3) {
                const k = this.fullSequence.slice(i, i + 3).join('');
                if (k === this.targetCodon) {
                    this.totalTargetCodons++;
                }
            }
            this.updateFoundProgress();
        }
        
        for (let i = 0; i < this.fullSequence.length; i++) {
            const char = this.fullSequence[i];
            const offset = i > 0 ? Math.floor(i / 3) * extraGap : 0;
            const x = i * spacing + offset;
            
            const t = this.add.text(x, 0, char, {
                fontFamily: 'monospace',
                fontSize: '28px',
                color: colorMap[char] || '#000',
                backgroundColor: '#ffffff',
                padding: { left: 8, right: 8, top: 6, bottom: 6 }
            }).setInteractive();
            
            if (Math.floor(i / 3) % 2 === 1) {
                t.setBackgroundColor('#f2f2f2');
            }
            
            t.index = i;
            
            t.setAlpha(0);
            t.y += 30;
            
            this.addTimer({
                delay: i * 20,
                callback: () => {
                    BioPhaser.Animation.Tween.slideInXY(this, t, t.x, 0, 300);
                }
            });
            
            this.trackEvents(t, {
                'pointerdown': () => this.toggleMark(t),
                'pointerover': () => {
                    const codonStart = Math.floor(t.index / 3) * 3;
                    if (!this.selections.has(codonStart)) {
                        t.setStyle({ backgroundColor: '#f0f0f0' });
                    }
                    this.addTween({
                        targets: t,
                        scale: 1.15,
                        duration: 100,
                        ease: 'Back.easeOut'
                    });
                },
                'pointerout': () => {
                    const codonStart = Math.floor(t.index / 3) * 3;
                    if (!this.selections.has(codonStart)) {
                        const bg = Math.floor(t.index / 3) % 2 === 1 ? '#f2f2f2' : '#ffffff';
                        t.setStyle({ backgroundColor: bg });
                    }
                    this.addTween({
                        targets: t,
                        scale: 1,
                        duration: 100,
                        ease: 'Back.easeIn'
                    });
                }
            });
            
            this.symbols.push(t);
            this.sequenceContainer.add(t);
        }
        
        const first = this.symbols[0];
        const offsetFix = first.getBounds().x;
        this.symbols.forEach(t => t.x -= offsetFix);
        
        const last = this.symbols[this.symbols.length - 1];
        this.sequenceContainer.width = last.x + last.width;
        
        const codonWidth = this.symbols.length >= 3 ? this.symbols[3].x - this.symbols[0].x : spacing * 3;
        
        const arrowY = y - 20;
        
        const leftArrow = this.add.image(viewX - 80, arrowY, 'arrowLeft')
            .setInteractive()
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setScale(0.05);
        this.layers.ui.add(leftArrow);
        
        const rightArrow = this.add.image(viewX + viewWidth + 80, arrowY, 'arrowRight')
            .setInteractive()
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setScale(0.05);
        this.layers.ui.add(rightArrow);
        
        this.trackEvents(leftArrow, {
            'pointerdown': () => {
                this.sequenceContainer.x = Math.min(this.sequenceContainer.x + codonWidth, viewX);
            }
        });
        
        this.trackEvents(rightArrow, {
            'pointerdown': () => {
                const containerRightEdge = this.sequenceContainer.x + this.sequenceContainer.width;
                const viewRightEdge = viewX + viewWidth;
                if (containerRightEdge > viewRightEdge) {
                    this.sequenceContainer.x -= codonWidth;
                }
            }
        });
        
        if (this.mode === 'issukio') {
            this.showCheckButton();
        }
    }
    
    /**
     * Perjungia kodono žymėjimą (iššūkio režimas)
     */
    toggleMark(t) {
        if (this.mode === 'mokymosi') {
            this.handleMokymosiClick(t);
            return;
        }
        
        const i = t.index;
        if (i > this.fullSequence.length - 3 || i % 3 !== 0) return;
        
        if (this.selections.has(i)) {
            return;
        }
        
        this.selections.add(i);
        for (let j = 0; j < 3; j++) {
            this.symbols[i + j].setBackgroundColor('#fff7c2');
            BioPhaser.Animation.Tween.bounce(this, this.symbols[i + j], 1.2, 150);
        }
    }
    
    /**
     * Tvarko paspaudimą mokymosi režime
     * Tikrina ar teisingai pasirinktas kodonas ir duoda grįžtamąjį ryšį
     */
    handleMokymosiClick(t) {
        const i = t.index;
        
        if (i % 3 !== 0) {
            this.showMiniFeedback('warning', 'Ne nuo čia', 'Spausk tik pirmą kodono raidę.');
            return;
        }
        
        const clickedCodon = this.fullSequence.slice(i, i + 3).join('');
        const isCorrect = (clickedCodon === this.targetCodon);
        
        if (isCorrect) {
            for (let j = 0; j < 3; j++) {
                const sym = this.symbols[i + j];
                sym.setScale(1);
                sym.setBackgroundColor('#c8facc');
                sym.disableInteractive();
            }
            
            this.foundCodonCount++;
            this.wrongAttempts = 0;
            
            this.hintCardElements?.forEach(el => el?.destroy?.());
            this.hintCardElements = [];
            this.closeReferenceTableOnly?.();
            this.highlightedCodon = null;
            this.activeCodonTableTab = null;
            this.miniFeedbackElements?.forEach(el => el?.destroy?.());
            this.miniFeedbackElements = [];

            this.showMiniFeedback('success', 'Teisingai!', 'Radai ieškomą kodoną.');
            this.updateFoundProgress();
            
            if (this.foundCodonCount >= this.totalTargetCodons) {
                this.resultsHistory.push({
                    codon: this.targetCodon,
                    amino: this.targetAmino,
                    correct: this.foundCodonCount,
                    mistakes: this.totalWrongClicks
                });
                
                this.addTimer({
                    delay: 1000,
                    callback: () => {
                        this.showContinueButton();
                    }
                });
            }
        } else {
            for (let j = 0; j < 3; j++) {
                const sym = this.symbols[i + j];
                sym.setBackgroundColor('#ffc9c9');
                
                this.addTimer({
                    delay: 1000,
                    callback: () => {
                        const codonIndex = Math.floor((i + j) / 3);
                        const bg = codonIndex % 2 === 1 ? '#f2f2f2' : '#ffffff';
                        sym.setBackgroundColor(bg);
                    }
                });
            }
            
            this.wrongAttempts++;
            this.totalWrongClicks++;
            
            this.showMiniFeedback(
                'error',
                'Ne visai',
                'Šis trejetas nėra ieškomas kodonas. Bandyk dar kartą.'
            );

            this.unlockNextHint();
        }
    }
    
    /**
     * Rodo užuominų mygtukus mokymosi režime
     */
    showHintButtons() {
        const panelX = UI.CX;
        const panelY = 785;
        const panelW = 640;
        const panelH = 86;

        this.foundProgressText = this.add.text(panelX, 180, '', {
            fontSize: '16px', color: THEME.primary,
            fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.layers.ui.add(this.foundProgressText);

        const panelTitle = this.add.text(panelX, panelY - 30, 'Pagalba', {
            fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: THEME.muted
        }).setOrigin(0.5);
        this.layers.ui.add(panelTitle);

        const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0xFFFFFF, 0.97)
            .setStrokeStyle(1.5, 0xD8E2EC);
        this.layers.ui.add(panel);

        const hints = [
            { level: 1, label: 'Užuomina 1', desc: 'Pirma raidė' },
            { level: 2, label: 'Užuomina 2', desc: 'Aminorūgštis' },
            { level: 3, label: 'Kodonų lentelė', desc: 'Pilna lentelė' }
        ];

        this.hintButtons = [];
        const hintY = panelY + 2;
        const spacing = 185;
        const startX = panelX - spacing;

        hints.forEach((hint, i) => {
            const x = startX + i * spacing;
            const isLocked = hint.level > this.hintLevel;

            const btn = BioPhaser.UI.Helpers.addModernButton(this, x, hintY, hint.label, {
                width: 145, height: 36,
                variant: 'secondary',
                disabled: isLocked,
                container: this.layers.ui,
                fontSize: '13px'
            });

            btn.onClick(() => { this.activateHint(hint.level); });

            const desc = this.add.text(x, hintY + 29, hint.desc, {
                fontSize: '10px', color: THEME.muted, fontFamily: FONT
            }).setOrigin(0.5);
            this.layers.ui.add(desc);

            this.hintButtons.push({ btn, desc, level: hint.level });
        });
    }

    /**
     * Atrakina kitą užuominą po klaidingo atsakymo
     * Progresyviai atrakina užuominas: 1 klaida → užuomina 2, 2 klaidos → užuomina 3
     */
    unlockNextHint() {
        if (!this.hintButtons) return;

        let newLevel = 1;
        if (this.wrongAttempts >= 1) newLevel = 2;
        if (this.wrongAttempts >= 2) newLevel = 3;

        if (newLevel > this.hintLevel) {
            this.hintLevel = newLevel;
            this.hintButtons.forEach(({ btn, level }) => {
                if (level <= this.hintLevel) {
                    btn.enable();
                } else {
                    btn.disable();
                }
            });
        }
    }
    
    showHintCard(title, body, color = THEME.primary) {
        this.hintCardElements?.forEach(el => el?.destroy?.());
        this.hintCardElements = [];

        const boxX = UI.CX;
        const boxY = 650;
        const boxW = 620;
        const boxH = 76;
        const colorInt = parseInt(color.replace('#', '0x'));

        const bg = this.add.rectangle(boxX, boxY, boxW, boxH, 0xFFFFFF, 0.98)
            .setStrokeStyle(2, colorInt);
        const accent = this.add.rectangle(boxX - boxW / 2 + 6, boxY, 8, boxH - 14, colorInt, 1);

        const titleText = this.add.text(boxX - boxW / 2 + 36, boxY - 18, title, {
            fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color
        }).setOrigin(0, 0.5);

        const bodyText = this.add.text(boxX - boxW / 2 + 36, boxY + 12, body, {
            fontFamily: FONT, fontSize: '12px', color: THEME.text,
            wordWrap: { width: boxW - 100 }
        }).setOrigin(0, 0.5);

        const closeText = this.add.text(boxX + boxW / 2 - 26, boxY - 18, '×', {
            fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: THEME.muted
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeText.on('pointerdown', () => {
            this.hintCardElements?.forEach(el => el?.destroy?.());
            this.hintCardElements = [];
        });

        this.layers.ui.add([bg, accent, titleText, bodyText, closeText]);
        this.hintCardElements.push(bg, accent, titleText, bodyText, closeText);
    }

    activateHint(level) {
        this.hintCardElements?.forEach(el => el?.destroy?.());
        this.hintCardElements = [];

        if (level === 1) {
            this.showHintCard(
                'Užuomina 1',
                `Ieškok kodono, kuris prasideda raide „${this.targetCodon[0]}".`,
                '#38BDF8'
            );
        } else if (level === 2) {
            this.showHintCard(
                'Užuomina 2',
                `Šis kodonas koduoja aminorūgštį „${this.targetAmino}".`,
                '#10B981'
            );
        } else if (level === 3) {
            this.highlightInTable(this.targetCodon);
        }
    }
    
    highlightInTable(targetCodon) {
        this.highlightedCodon = targetCodon;
        this.activeCodonTableTab = targetCodon[0];
        this.closeReferenceTableOnly();
        this.showReferenceTable();
    }
    
    closeReferenceTableOnly() {
        this.referenceTableElements?.forEach(el => el?.destroy?.());
        this.referenceTableElements = [];
        this.referenceTableContainer = null;
    }

    showReferenceTable() {
        if (this.referenceTableElements?.length) return;

        this.activeCodonTableTab = this.highlightedCodon
            ? this.highlightedCodon[0]
            : (this.activeCodonTableTab || 'U');

        this.referenceTableElements = [];
        this.referenceTableContainer = true;

        const modalX = UI.CX;
        const modalY = 430;
        const modalW = 680;
        const modalH = 520;
        const D = 1002;

        const closeFull = () => {
            this.closeReferenceTableOnly();
            this.highlightedCodon = null;
            this.activeCodonTableTab = null;
        };

        const overlay = this.add.rectangle(UI.CX, UI.CY, UI.W, UI.H, 0x000000, 0.22)
            .setDepth(1000).setScrollFactor(0).setInteractive();
        overlay.on('pointerdown', closeFull);

        const box = this.add.rectangle(modalX, modalY, modalW, modalH, 0xFFFFFF, 1)
            .setStrokeStyle(1.5, 0xD8E2EC).setDepth(1001).setScrollFactor(0);

        const titleText = this.add.text(modalX, modalY - modalH / 2 + 36, 'Kodonų lentelė', {
            fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: THEME.text
        }).setOrigin(0.5).setDepth(D).setScrollFactor(0);

        const subtitleText = this.add.text(modalX, modalY - modalH / 2 + 62, 'mRNR kodonai ir atitinkamos aminorūgštys', {
            fontFamily: FONT, fontSize: '13px', color: THEME.muted
        }).setOrigin(0.5).setDepth(D).setScrollFactor(0);

        const closeBtn = this.add.text(modalX + modalW / 2 - 28, modalY - modalH / 2 + 28, '×', {
            fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: THEME.muted
        }).setOrigin(0.5).setDepth(D).setScrollFactor(0).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', closeFull);

        const divider = this.add.rectangle(modalX, modalY - modalH / 2 + 82, modalW - 40, 1.5, 0xD8E2EC, 1)
            .setDepth(D).setScrollFactor(0);

        this.layers.modal.add([overlay, box, titleText, subtitleText, closeBtn, divider]);
        this.referenceTableElements.push(overlay, box, titleText, subtitleText, closeBtn, divider);

        // Tab row
        const tabs = ['U', 'C', 'A', 'G'];
        const tabY = modalY - modalH / 2 + 110;
        const tabW = 130;
        const tabH = 36;
        const tabStartX = modalX - 210;
        const tabSpacing = tabW + 10;

        tabs.forEach((letter, i) => {
            const tx = tabStartX + i * tabSpacing;
            const isActive = letter === this.activeCodonTableTab;

            const tabBg = this.add.rectangle(tx, tabY, tabW, tabH,
                isActive ? 0xECFDF5 : 0xF8FAFC, 1)
                .setStrokeStyle(1.5, isActive ? 0x10B981 : 0xD8E2EC)
                .setDepth(D).setScrollFactor(0)
                .setInteractive({ useHandCursor: true });

            const tabLabel = this.add.text(tx, tabY, `${letter} pradžia`, {
                fontFamily: FONT, fontSize: '13px',
                fontStyle: isActive ? 'bold' : 'normal',
                color: isActive ? '#047857' : '#64748B'
            }).setOrigin(0.5).setDepth(D).setScrollFactor(0);

            tabBg.on('pointerdown', () => {
                if (letter !== this.activeCodonTableTab) {
                    this.activeCodonTableTab = letter;
                    this.closeReferenceTableOnly();
                    this.showReferenceTable();
                }
            });

            this.layers.modal.add([tabBg, tabLabel]);
            this.referenceTableElements.push(tabBg, tabLabel);
        });

        const activeKey = this.activeCodonTableTab || 'U';
        const rows = Object.entries(config.items).filter(([codon]) => codon[0] === activeKey);

        const listX = modalX;
        const rowH = 24;
        const rowW = modalW - 120;
        const listStartY = modalY - modalH / 2 + 148;

        rows.forEach(([codon, amino], idx) => {
            const rowY = listStartY + idx * rowH;
            const isTarget = codon === this.highlightedCodon;
            const rowBgColor = isTarget ? 0xFEF3C7 : (idx % 2 === 0 ? 0xFFFFFF : 0xF8FAFC);

            const rowBg = this.add.rectangle(listX, rowY, rowW, rowH, rowBgColor, 1)
                .setDepth(D).setScrollFactor(0);
            if (isTarget) rowBg.setStrokeStyle(1, 0xF59E0B);

            const codonEl = this.add.text(listX - 180, rowY, codon, {
                fontFamily: 'monospace', fontSize: '14px',
                fontStyle: isTarget ? 'bold' : 'normal',
                color: isTarget ? '#92400E' : '#1F2937'
            }).setOrigin(0.5).setDepth(D).setScrollFactor(0);

            const arrowEl = this.add.text(listX, rowY, '→', {
                fontFamily: FONT, fontSize: '14px', color: THEME.muted
            }).setOrigin(0.5).setDepth(D).setScrollFactor(0);

            const aminoEl = this.add.text(listX + 120, rowY, amino, {
                fontFamily: FONT, fontSize: '14px',
                fontStyle: isTarget ? 'bold' : 'normal',
                color: isTarget ? '#92400E' : THEME.text
            }).setOrigin(0.5).setDepth(D).setScrollFactor(0);

            this.layers.modal.add([rowBg, codonEl, arrowEl, aminoEl]);
            this.referenceTableElements.push(rowBg, codonEl, arrowEl, aminoEl);
        });
    }
    
    /**
     * Atnaujina rastų kodonų skaitiklį mokymosi režime
     */
    updateFoundProgress() {
        if (this.foundProgressText) {
            this.foundProgressText.setText(`Rasta: ${this.foundCodonCount} iš ${this.totalTargetCodons}`);
        }
    }
    
    showMiniFeedback(type, title, body) {
        this.miniFeedbackElements?.forEach(el => el?.destroy?.());
        this.miniFeedbackElements = [];

        const centerX = UI.CX;
        const cardY = 625;
        const cardW = 620;
        const cardH = 78;

        const isError   = type === 'error';
        const isWarning = type === 'warning';
        const bgColor    = isError ? 0xFFF7ED : isWarning ? 0xFFFBEB : 0xECFDF5;
        const strokeColor = isError ? 0xF97316 : isWarning ? 0xF59E0B : 0x10B981;
        const accentInt  = strokeColor;
        const titleColor = isError ? '#C2410C' : isWarning ? '#B45309' : '#047857';

        const cardBg  = this.add.rectangle(centerX, cardY, cardW, cardH, bgColor, 1)
            .setStrokeStyle(2, strokeColor);
        const accent  = this.add.rectangle(centerX - cardW / 2 + 6, cardY, 8, cardH - 14, accentInt, 1);
        const titleEl = this.add.text(centerX - cardW / 2 + 36, cardY - 16, title, {
            fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: titleColor
        }).setOrigin(0, 0.5);
        const bodyEl  = this.add.text(centerX - cardW / 2 + 36, cardY + 12, body, {
            fontFamily: FONT, fontSize: '12px', color: THEME.muted,
            wordWrap: { width: cardW - 80 }
        }).setOrigin(0, 0.5);

        this.layers.ui.add([cardBg, accent, titleEl, bodyEl]);
        this.miniFeedbackElements = [cardBg, accent, titleEl, bodyEl];
        [cardBg, accent, titleEl, bodyEl].forEach(el =>
            BioPhaser.Animation.Tween.fadeIn(this, el, 200)
        );

        const delay = type === 'success' ? 1200 : 1800;
        this.addTimer({
            delay,
            callback: () => {
                const els = this.miniFeedbackElements ?? [];
                this.miniFeedbackElements = [];
                els.forEach(el => {
                    this.addTween({
                        targets: el,
                        alpha: 0,
                        duration: 250,
                        ease: 'Sine.easeOut',
                        onComplete: () => el.destroy?.()
                    });
                });
            }
        });
    }

    /**
     * Rodo "Tikrinti" mygtuką iššūkio režime
     */
    showCheckButton() {
        this.checkBtn = BioPhaser.UI.Helpers.addModernButton(this, UI.CX, 690, 'Tikrinti', {
            width: 170, height: 50,
            variant: 'primary',
            container: this.layers.ui,
            fontSize: '20px'
        });
        this.checkBtn.onClick(() => this.evaluate());
        this.checkBtn.element.setScrollFactor(0);
    }
    
    /**
     * Iškviečiama kai baigėsi laikas iššūkio režime
     * Automatiškai tikrina rezultatus
     */
    timeUp() {
        this.symbols.forEach(sym => sym.disableInteractive());
        
        BioPhaser.UI.Notification.show(this, 'LAIKAS BAIGĖSI! ⏰', 'warning', 3000);
        
        this.addTimer({
            delay: 2000,
            callback: () => {
                this.evaluate();
            }
        });
    }
    
    /**
     * Generuoja atsitiktinę mRNR seką su tiksliniais kodonais
     * Sekos ilgis ir tikslinių kodonų kiekis priklauso nuo sunkumo lygio
     */
    generateSequence() {
        const allPossibleCodons = Object.keys(config.items);
        
        let totalCodonsInSequence;
        if (this.mode === 'mokymosi') {
            const range = this.difficultySettings.sequenceLengthLearning;
            totalCodonsInSequence = Array.isArray(range) 
                ? Phaser.Math.Between(range[0], range[1]) 
                : range;
        } else {
            const range = this.difficultySettings.sequenceLengthChallenge;
            totalCodonsInSequence = Array.isArray(range) 
                ? Phaser.Math.Between(range[0], range[1]) 
                : range;
        }
        
        const targetCount = Phaser.Math.Between(3, 7);
        this.targetCount = targetCount;
        
        const allCodons = Array.from({ length: totalCodonsInSequence }, () => null);
        
        const validIndices = Phaser.Utils.Array.Shuffle([...Array(totalCodonsInSequence).keys()]);
        const targetPositions = validIndices.slice(0, targetCount);
        
        targetPositions.forEach(i => {
            allCodons[i] = this.targetCodon;
        });
        
        for (let i = 0; i < totalCodonsInSequence; i++) {
            if (!allCodons[i]) {
                let rnd;
                do {
                    rnd = Phaser.Utils.Array.GetRandom(allPossibleCodons);
                } while (rnd === this.targetCodon);
                allCodons[i] = rnd;
            }
        }
        
        this.fullSequence = allCodons.flatMap(codon => codon.split(''));
    }
    
    /**
     * Įvertina vartotojo pasirinkimus ir parodo rezultatus
     * Skaičiuoja teisingus, klaidingus ir praleistus kodonus
     */
    evaluate() {
        const correct = [];
        for (let i = 0; i < this.fullSequence.length; i += 3) {
            const k = this.fullSequence.slice(i, i + 3).join('');
            if (k.length === 3 && k === this.targetCodon) {
                correct.push(i);
            }
        }
        
        let correctCount = 0, mistakes = 0, missed = 0;
        
        this.selections.forEach(i => {
            if (correct.includes(i)) {
                correctCount++;
                for (let j = 0; j < 3; j++) {
                    const sym = this.symbols[i + j];
                    sym.setBackgroundColor('#c8facc');
                    BioPhaser.Animation.Tween.bounce(this, sym, 1.1, 150);
                }
            } else {
                mistakes++;
                for (let j = 0; j < 3; j++) {
                    this.symbols[i + j].setBackgroundColor('#ffc9c9');
                }
            }
        });
        
        correct.forEach(i => {
            if (!this.selections.has(i)) {
                for (let j = 0; j < 3; j++) {
                    this.symbols[i + j].setBackgroundColor('#ffeaa7');
                }
                missed++;
            }
        });
        
        if (this.mode === 'issukio' && this.timer) {
            const usedTime = this.difficultySettings.timeLimitPerCodon - this.timer.timeLeft;
            this.codonTimes.push(usedTime);
            this.timer.stop();
        }
        
        this.lastRoundResults = {
            correct: correctCount,
            mistakes: mistakes,
            missed: missed
        };
        
        if (this.mode === 'issukio') {
            this.resultsHistory.push({
                codon: this.targetCodon,
                amino: this.targetAmino,
                correct: correctCount,
                mistakes: mistakes,
                missed: missed
            });
        }
        
        if (this.checkBtn) {
            this.checkBtn.element.setVisible(false);
        }
        
        this.showResults(correctCount, mistakes, missed);
        
        this.addTimer({
            delay: 2000,
            callback: () => {
                this.showContinueButton();
            }
        });
    }
    
    showResults(correct, mistakes, missed) {
        const isSuccess = mistakes === 0 && missed === 0;
        const centerX = UI.CX;
        const cardY = 600;
        const cardW = 720;
        const cardH = 150;

        const bgColor     = isSuccess ? 0xECFDF5 : 0xFFF7ED;
        const strokeColor = isSuccess ? 0x10B981 : 0xF97316;
        const accentInt   = isSuccess ? 0x10B981 : 0xF97316;
        const accentHex   = isSuccess ? '#10B981' : '#F97316';
        const titleStr    = isSuccess ? 'Puiku!' : 'Rezultatas';

        const commentStr = isSuccess
            ? 'Visi ieškomi kodonai pažymėti teisingai.'
            : missed > 0 && mistakes === 0
                ? 'Geltonai pažymėti praleisti kodonai.'
                : mistakes > 0 && missed === 0
                    ? 'Raudonai pažymėti neteisingi pasirinkimai.'
                    : 'Raudonai pažymėti neteisingi pasirinkimai, geltonai – praleisti kodonai.';

        const cardBg = this.add.rectangle(centerX, cardY, cardW, cardH, bgColor, 1)
            .setStrokeStyle(2, strokeColor);
        const accent = this.add.rectangle(centerX - cardW / 2 + 6, cardY, 8, cardH - 16, accentInt, 1);

        const titleEl = this.add.text(centerX - cardW / 2 + 36, cardY - 42, titleStr, {
            fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: accentHex
        }).setOrigin(0, 0.5);

        const stats = [
            { label: 'Teisingi', value: correct,  x: centerX - 160 },
            { label: 'Klaidos',  value: mistakes, x: centerX },
            { label: 'Praleista', value: missed,  x: centerX + 160 }
        ];
        const chipEls = [];
        stats.forEach(({ label, value, x }) => {
            const chip = this.add.text(x, cardY - 2, `${label}: ${value}`, {
                fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: THEME.text
            }).setOrigin(0.5);
            chipEls.push(chip);
        });

        const commentEl = this.add.text(centerX - cardW / 2 + 36, cardY + 46, commentStr, {
            fontFamily: FONT, fontSize: '13px', color: THEME.muted,
            wordWrap: { width: cardW - 60 }
        }).setOrigin(0, 0.5);

        const els = [cardBg, accent, titleEl, ...chipEls, commentEl];
        this.layers.ui.add(els);
        els.forEach((el, i) => BioPhaser.Animation.Tween.fadeIn(this, el, 280, i * 40));
    }
    
    /**
     * Rodo "Tęsti" mygtuką po rezultatų
     */
    showContinueButton() {
        const continueBtn = BioPhaser.UI.Helpers.addModernButton(this, UI.CX, 740, 'Tęsti →', {
            width: 170, height: 48,
            variant: 'primary',
            container: this.layers.ui,
            fontSize: '20px'
        });
        continueBtn.onClick(() => {
            if (this.mode === 'mokymosi') this.nextCodon();
            else this.nextChallengeRound();
        });
    }
    
    /**
     * Pereina prie kito kodono mokymosi režime
     */
    nextCodon() {
        if (this.mode !== 'mokymosi') return;
        
        this.currentIndex++;
        
        if (this.currentIndex < this.codonsQueue.length) {
            this.cleanupUI();
            
            this.wrongAttempts = 0;
            this.totalWrongClicks = 0;
            this.foundCodonCount = 0;
            this.hintLevel = 1;
            
            this.selections = new Set();
            this.symbols = [];
            this.sequenceContainer = null;
            this.hintCardElements = [];
            this.miniFeedbackElements?.forEach(el => el?.destroy?.());
            this.miniFeedbackElements = [];
            this.referenceTableElements?.forEach(el => el?.destroy?.());
            this.referenceTableElements = [];
            this.referenceTableContainer = null;
            this.highlightedCodon = null;
            this.activeCodonTableTab = null;
            this.hintButtons = null;
            this.foundProgressText = null;
            
            this.targetCodon = this.codonsQueue[this.currentIndex];
            this.targetAmino = this.filteredCodons[this.targetCodon];
            this.generateSequence();
            
            this.updateProgress();
            this.showIntro();
        } else {
            this.showEnd();
        }
    }
    
    /**
     * Pereina prie kito raundo iššūkio režime
     */
    nextChallengeRound() {
        if (this.mode !== 'issukio') return;
        
        this.currentIndex++;
        
        if (this.currentIndex < this.codonsQueue.length) {
            this.cleanupUI();
            
            this.selections.clear();
            this.symbols = [];
            this.sequenceContainer = null;
            
            this.targetCodon = this.codonsQueue[this.currentIndex];
            this.targetAmino = this.filteredCodons[this.targetCodon];
            this.generateSequence();
            
            this.updateProgress();
            this.showIntro();
        } else {
            this.showEnd();
        }
    }
    
    showEnd() {
        this.destroyPersistentUI();
        this.cleanupUI();

        const COLORS = {
            text:    '#1F2937',
            muted:   '#64748B',
            border:  0xD8E2EC,
            soft:    0xF8FAFC,
            header:  0xF1F5F9,
            success: '#10B981',
            warning: '#F59E0B',
            danger:  '#EF4444'
        };

        const totalRounds   = this.resultsHistory.length;
        const perfectRounds = this.resultsHistory.filter(r => r.mistakes === 0 && (r.missed ?? 0) === 0).length;
        const totalCorrect  = this.resultsHistory.reduce((s, r) => s + (r.correct  ?? 0), 0);
        const totalMistakes = this.resultsHistory.reduce((s, r) => s + (r.mistakes ?? 0), 0);
        const totalMissed   = this.resultsHistory.reduce((s, r) => s + (r.missed   ?? 0), 0);

        if (totalRounds > 0) {
            Progress.save('codon', { score: perfectRounds, total: totalRounds });
        }

        if (this.resultsPage == null) this.resultsPage = 0;

        const rowsPerPage = 6;
        const rowH        = 34;
        const totalPages  = Math.max(1, Math.ceil(totalRounds / rowsPerPage));
        const page        = Math.min(this.resultsPage, totalPages - 1);
        const start       = page * rowsPerPage;
        const visibleRows = this.resultsHistory.slice(start, start + rowsPerPage);

        const panelX = UI.CX;
        const panelY = 390;
        const panelW = 940;
        const panelH = 700;
        const top    = panelY - panelH / 2; 
        const left   = panelX - panelW / 2;  

        const layer = this.layers.ui;

        const shadow = this.add.rectangle(panelX + 4, panelY + 6, panelW, panelH, 0x000000, 0.07).setScrollFactor(0);
        const panel  = this.add.rectangle(panelX, panelY, panelW, panelH, 0xFFFFFF, 1)
            .setStrokeStyle(1.5, COLORS.border).setScrollFactor(0);
        layer.add([shadow, panel]);

        const headerH  = 80;
        const headerMY = top + headerH / 2;
        const headerBg = this.add.rectangle(panelX, headerMY, panelW, headerH, COLORS.header, 1)
            .setStrokeStyle(1, COLORS.border).setScrollFactor(0);
        layer.add(headerBg);

        const diffColor = this.difficultySettings.color;
        const diffFill  = typeof diffColor === 'number' ? diffColor : parseInt(String(diffColor).replace('#', ''), 16);
        const diffBadgeBg  = this.add.rectangle(left + 80, headerMY, 100, 28, diffFill, 0.12)
            .setStrokeStyle(1.2, diffFill).setScrollFactor(0);
        const diffBadgeTxt = this.add.text(left + 80, headerMY, this.difficultySettings.label, {
            fontFamily: FONT, fontSize: '12px', fontStyle: 'bold',
            color: typeof diffColor === 'string' ? diffColor : '#' + diffFill.toString(16).padStart(6, '0')
        }).setOrigin(0.5).setScrollFactor(0);
        layer.add([diffBadgeBg, diffBadgeTxt]);

        const modeColor = this.modeSettings.color;
        const modeFill  = typeof modeColor === 'number' ? modeColor : parseInt(String(modeColor).replace('#', ''), 16);
        const modeBadgeBg  = this.add.rectangle(left + panelW - 80, headerMY, 110, 28, modeFill, 0.12)
            .setStrokeStyle(1.2, modeFill).setScrollFactor(0);
        const modeBadgeTxt = this.add.text(left + panelW - 80, headerMY, this.modeSettings.label, {
            fontFamily: FONT, fontSize: '12px', fontStyle: 'bold',
            color: typeof modeColor === 'string' ? modeColor : '#' + modeFill.toString(16).padStart(6, '0')
        }).setOrigin(0.5).setScrollFactor(0);
        layer.add([modeBadgeBg, modeBadgeTxt]);

        layer.add([
            this.add.text(panelX, headerMY - 10, 'Rezultatai', {
                fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: COLORS.text
            }).setOrigin(0.5).setScrollFactor(0),
            this.add.text(panelX, headerMY + 14, 'Peržiūrėk, kaip sekėsi ieškoti kodonų.', {
                fontFamily: FONT, fontSize: '13px', color: COLORS.muted
            }).setOrigin(0.5).setScrollFactor(0)
        ]);

        const scoreY  = top + 145;   
        const msgY    = top + 183;   
        const tileY   = top + 222;  
        const sumCardTop = top + 96;
        const sumCardH   = 152;
        const sumBg = this.add.rectangle(panelX, sumCardTop + sumCardH / 2, panelW - 40, sumCardH, COLORS.soft, 1)
            .setStrokeStyle(1, COLORS.border).setScrollFactor(0);
        layer.add(sumBg);

        layer.add(
            this.add.text(panelX, scoreY, `${perfectRounds} / ${totalRounds}`, {
                fontFamily: FONT, fontSize: '36px', fontStyle: 'bold', color: COLORS.text
            }).setOrigin(0.5).setScrollFactor(0)
        );

        const allPerfect = perfectRounds === totalRounds;
        layer.add(
            this.add.text(panelX, msgY, allPerfect
                ? 'Puiku! Visi raundai atlikti be klaidų.'
                : 'Gerai! Peržiūrėk klaidas ir bandyk dar kartą.', {
                fontFamily: FONT, fontSize: '14px', color: COLORS.muted
            }).setOrigin(0.5).setScrollFactor(0)
        );

        const tileW = 140, tileH = 34;
        [
            { label: `Teisingi  ${totalCorrect}`,  color: COLORS.success, fill: 0x10B981 },
            { label: `Klaidos  ${totalMistakes}`,   color: COLORS.danger,  fill: 0xEF4444 },
            { label: `Praleisti  ${totalMissed}`,   color: COLORS.warning, fill: 0xF59E0B }
        ].forEach((t, i) => {
            const tx = panelX + (i - 1) * (tileW + 16);
            layer.add([
                this.add.rectangle(tx, tileY, tileW, tileH, t.fill, 0.10)
                    .setStrokeStyle(1.2, t.fill).setScrollFactor(0),
                this.add.text(tx, tileY, t.label, {
                    fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: t.color
                }).setOrigin(0.5).setScrollFactor(0)
            ]);
        });

        const reviewTitleY = top + 274;
        const sectionLabel = totalPages > 1
            ? `Atsakymų peržiūra  ·  ${start + 1}–${Math.min(start + rowsPerPage, totalRounds)} iš ${totalRounds}`
            : 'Atsakymų peržiūra';
        layer.add(
            this.add.text(left + 20, reviewTitleY, sectionLabel, {
                fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: COLORS.text
            }).setOrigin(0, 0.5).setScrollFactor(0)
        );

        const tblLeft = left + 20;
        const thY     = reviewTitleY + 38;

        const cols = [
            { label: 'Kodonas',      xOff: 60  },
            { label: 'Aminorūgštis', xOff: 200 },
            { label: '✓',            xOff: 370 },
            { label: 'Klaidos',      xOff: 490 },
            { label: 'Praleista',    xOff: 620 },
            { label: 'Rez.',         xOff: 780 }
        ];

        layer.add(
            this.add.rectangle(panelX, thY, panelW - 40, rowH, COLORS.header, 1)
                .setStrokeStyle(1, COLORS.border).setScrollFactor(0)
        );
        cols.forEach(col => {
            layer.add(
                this.add.text(tblLeft + col.xOff, thY, col.label, {
                    fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#334155'
                }).setOrigin(0, 0.5).setScrollFactor(0)
            );
        });

        visibleRows.forEach((entry, idx) => {
            const ry      = thY + rowH * (idx + 1) + rowH / 2;
            const rowFill = idx % 2 === 0 ? 0xFFFFFF : COLORS.soft;
            layer.add(
                this.add.rectangle(panelX, ry, panelW - 40, rowH, rowFill, 1)
                    .setStrokeStyle(0.5, COLORS.border).setScrollFactor(0)
            );

            const isPerfect = entry.mistakes === 0 && (entry.missed ?? 0) === 0;
            const rezLabel  = isPerfect ? 'Puiku!' : 'Gerai';
            const rezColor  = isPerfect ? COLORS.success : COLORS.warning;

            [
                { val: entry.codon,                 xOff: 60,  style: 'bold',   color: COLORS.text,    mono: true  },
                { val: entry.amino,                 xOff: 200, style: 'normal', color: COLORS.text,    mono: false },
                { val: String(entry.correct  ?? 0), xOff: 370, style: 'bold',   color: COLORS.success, mono: true  },
                { val: String(entry.mistakes ?? 0), xOff: 490, style: 'normal', color: COLORS.danger,  mono: true  },
                { val: String(entry.missed   ?? 0), xOff: 620, style: 'normal', color: COLORS.warning, mono: true  },
                { val: rezLabel,                    xOff: 780, style: 'bold',   color: rezColor,       mono: false }
            ].forEach(cell => {
                layer.add(
                    this.add.text(tblLeft + cell.xOff, ry, cell.val, {
                        fontFamily: cell.mono ? 'monospace' : FONT,
                        fontSize: '14px', fontStyle: cell.style, color: cell.color
                    }).setOrigin(0, 0.5).setScrollFactor(0)
                );
            });
        });

        if (totalPages > 1) {
            const pagerY      = thY + rowH * rowsPerPage + rowH + 24;
            const prevDisabled = page === 0;
            const nextDisabled = page >= totalPages - 1;

            const prevBtn = BioPhaser.UI.Helpers.addModernButton(this, panelX - 80, pagerY, '←', {
                width: 44, height: 32,
                variant: prevDisabled ? 'ghost' : 'secondary',
                container: layer, fontSize: '16px'
            });
            if (!prevDisabled) {
                prevBtn.onClick(() => { this.resultsPage = page - 1; this.showEnd(); });
            }
            prevBtn.element.setScrollFactor(0);

            layer.add(
                this.add.text(panelX, pagerY, `${page + 1} / ${totalPages}`, {
                    fontFamily: FONT, fontSize: '13px', color: COLORS.muted
                }).setOrigin(0.5).setScrollFactor(0)
            );

            const nextBtn = BioPhaser.UI.Helpers.addModernButton(this, panelX + 80, pagerY, '→', {
                width: 44, height: 32,
                variant: nextDisabled ? 'ghost' : 'secondary',
                container: layer, fontSize: '16px'
            });
            if (!nextDisabled) {
                nextBtn.onClick(() => { this.resultsPage = page + 1; this.showEnd(); });
            }
            nextBtn.element.setScrollFactor(0);
        }

        const btnY = top + panelH - 35;  

        const homeBtn = BioPhaser.UI.Helpers.addModernButton(this, left + 130, btnY, '← Grįžti', {
            width: 180, height: 46,
            variant: 'secondary', container: layer, fontSize: '16px'
        });
        homeBtn.onClick(() => {
            this.scene.stop('CodonGame');
            this.scene.start('CodonStart');
        });
        homeBtn.element.setScrollFactor(0);

        const playAgainBtn = BioPhaser.UI.Helpers.addModernButton(this, left + panelW - 130, btnY, 'Žaisti dar kartą', {
            width: 200, height: 46,
            variant: 'primary', container: layer, fontSize: '16px'
        });
        playAgainBtn.onClick(() => {
            this.resultsPage = 0;
            this.scene.start('CodonGame', {
                difficulty: this.difficulty,
                mode: this.mode,
                selectedGroups: this.selectedGroups
            });
        });
        playAgainBtn.element.setScrollFactor(0);
    }

    getRating(entry) {
        const correct  = entry.correct  || 0;
        const mistakes = entry.mistakes || 0;
        const missed   = entry.missed;
        if (correct === 0 && mistakes === 0 && missed !== undefined && missed > 0) return 'Praleista';
        if (correct > 0 && mistakes === 0) return 'Puiku!';
        if (correct === 0 && mistakes === 0) return 'Nepradėta';
        if (correct > mistakes) return 'Gerai';
        return 'Treniruokis';
    }

    getRatingColor(entry) {
        const correct  = entry.correct  || 0;
        const mistakes = entry.mistakes || 0;
        const missed   = entry.missed;
        if (correct === 0 && mistakes === 0 && missed !== undefined && missed > 0) return '#F59E0B';
        if (correct > 0 && mistakes === 0) return '#10B981';
        if (correct === 0 && mistakes === 0) return '#94A3B8';
        if (correct > mistakes) return '#F59E0B';
        return '#EF4444';
    }
}

const engine = new BioPhaser.Engine(config);
engine.registerScene(CodonStartScene);
engine.registerScene(CodonGameScene);
engine.start();

export { CodonGameScene, CodonStartScene, config };
