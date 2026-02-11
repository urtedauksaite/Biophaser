
import { BioPhaser } from './biophaser.js';

const config = await BioPhaser.Utils.ConfigLoader.load('./codon_game.json');

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
    }
    
    create() {
        this.createLayers();
        
        this.selectedGroups = [];
        this.selectedMode = null;
        this.selectedDifficulty = null;
        this.step = 0;
        this.visitedSteps = new Set();
        
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
        
        this.showCurrentStep();
    }
    
    /**
     * Atvaizduoja dabartinį žingsnį
     * Išvalo UI ir rodo atitinkamą ekraną pagal this.step
     */
    showCurrentStep() {
        this.cleanupUI();
        
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
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        const dnaComponent = this.addComponent(
            new BioPhaser.GameObject(this, { container: this.layers.ui })
        );
        
        const dna = this.add.image(centerX, centerY - 150, 'dna').setScale(0.25);
        dnaComponent.addElement(dna);
        
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
        
        const startBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, centerY + 100, 'Pradėti', {
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
     * Rodo grupių pasirinkimo ekraną
     * Leidžia pasirinkti amino rūgščių grupes filtravimui
     */
    showGroupSelection() {
        const centerX = this.scale.width / 2;
        
        const centerDNA = this.addComponent(
            new BioPhaser.GameObject(this, { container: this.layers.ui })
        );
        
        const dnaImage = this.add.image(centerX, 80, 'dna').setScale(0.15);
        centerDNA.addElement(dnaImage);
        
        this.addTween({
            targets: dnaImage,
            angle: 360,
            duration: 20000,
            repeat: -1
        });
        
        const title = this.add.text(centerX, 165, 'Aminorūgščių grupės', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, 205, config.ui.groupSelectionSubtitle, {
            fontSize: '15px',
            color: '#858f90ff',
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            wordWrap: { width: 600 },
            align: 'center'
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);
        
        const selectAllBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, 240, 'Pažymėti visas grupes', {
                fontSize: '15px',
                backgroundColor: 'transparent',
                color: '#3498db',
                container: this.layers.ui
            })
        );
        
        selectAllBtn.onClick(() => {
            const allGroups = Object.keys(config.groups);
            if (allGroups.every(g => this.selectedGroups.includes(g))) {
                this.selectedGroups = [];
            } else {
                this.selectedGroups = [...allGroups];
            }
            this.showCurrentStep();
        });
        
        selectAllBtn.onHover(
            () => selectAllBtn.setStyle({ color: '#2980b9' }),
            () => selectAllBtn.setStyle({ color: '#3498db' })
        );
        
        selectAllBtn.create();
        
        const startY = 295;
        Object.entries(config.groups).forEach(([key, group], i) => {
            const isSelected = this.selectedGroups.includes(key);
            
            const card = this.addUI(new BioPhaser.UI.Card(this, centerX, startY + i * 82, {
                    width: 600,
                    height: 70,
                    label: group.label,
                    sublabel: `${group.members.length} ${config.ui.membersName}`,
                    color: group.color,
                    icon: group.icon,
                    isSelected: isSelected,
                    container: this.layers.ui
                })
            );
            
            card.onClick(() => {
                const idx = this.selectedGroups.indexOf(key);
                if (idx > -1) this.selectedGroups.splice(idx, 1);
                else this.selectedGroups.push(key);
                
                BioPhaser.Animation.Effects.starBurst(this, centerX, startY + i * 82, {
                    count: 8,
                    color: '#f39c12',
                    distance: 50
                });
                
                this.showCurrentStep();
            });
            
            card.create();
            
            if (!this.visitedSteps.has(1)) {
                card.elements.forEach(el => {
                    const originalX = el.x;
                    el.setX(originalX - 600);
                    
                    this.addTimer({
                        delay: i * 50,
                        callback: () => {
                            BioPhaser.Animation.Tween.slideInXY(this, el, originalX, el.y, 400);
                        }
                    });
                });
            }
        });
        
        const filteredItems = BioPhaser.Utils.DataProcessor.getFilteredItems(
            config.items, config.groups, this.selectedGroups
        );
        
        const countText = this.add.text(centerX, 720, 
            this.selectedGroups.length > 0 
                ? `Pažymėta: ${filteredItems.length} ${config.ui.itemsName}` 
                : 'Pasirinkite bent vieną grupę', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: this.selectedGroups.length > 0 ? '#27ae60' : '#e74c3c',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(countText);
        
        const continueBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, 770, 'Tęsti', {
                fontSize: '20px',
                backgroundColor: this.selectedGroups.length > 0 ? '#27ae60' : '#95a5a6',
                padding: { left: 40, right: 40, top: 12, bottom: 12 },
                container: this.layers.ui
            })
        );
        
        continueBtn.onClick(() => {
            if (this.selectedGroups.length === 0) return;
            this.step = 2;
            this.showCurrentStep();
        });
        
        if (this.selectedGroups.length > 0) {
            continueBtn.onHover(
                () => continueBtn.setStyle({ backgroundColor: '#219150' }),
                () => continueBtn.setStyle({ backgroundColor: '#27ae60' })
            );
        }
        
        continueBtn.create();
        
        const backBtn = this.addUI(new BioPhaser.UI.Button(this, 80, 50, '< Atgal', {
                fontSize: '18px',
                backgroundColor: 'transparent',
                color: '#3498db',
                container: this.layers.ui
            })
        );
        
        backBtn.onClick(() => {
            this.step = 0;
            this.showCurrentStep();
        });
        
        backBtn.onHover(
            () => backBtn.setStyle({ color: '#2980b9' }),
            () => backBtn.setStyle({ color: '#3498db' })
        );
        
        backBtn.create();
        backBtn.element.setOrigin(0, 0.5);
        
        this.visitedSteps.add(1);
    }
    
    /**
     * Rodo režimo pasirinkimo ekraną
     * Leidžia pasirinkti tarp mokymosi ir iššūkio režimų
     */
    showModeSelection() {
        const centerX = this.scale.width / 2;
        
        const centerDNA = this.addComponent(
            new BioPhaser.GameObject(this, { container: this.layers.ui })
        );
        const dnaImage = this.add.image(centerX, 80, 'dna').setScale(0.15);
        centerDNA.addElement(dnaImage);
        this.addTween({
            targets: dnaImage,
            angle: 360,
            duration: 20000,
            repeat: -1
        });
        
        const title = this.add.text(centerX, 165, 'Žaidimo režimas', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, 205, 'Kaip nori mokytis šiandien?', {
            fontSize: '15px',
            color: '#858f90ff',
            fontStyle: 'italic',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);
        
        const modes = Object.entries(config.modes);
        const startY = 340;
        const spacing = 140;
        
        modes.forEach(([key, mode], i) => {
            const isSelected = this.selectedMode === key;
            
            const card = this.addUI(new BioPhaser.UI.Card(this, centerX, startY + i * spacing, {
                    width: 700,
                    height: 120,
                    label: mode.label,
                    sublabel: mode.description,
                    color: mode.color,
                    icon: mode.icon,
                    isSelected: isSelected,
                    container: this.layers.ui
                })
            );
            
            card.onClick(() => {
                this.selectedMode = key;
                BioPhaser.Animation.Effects.starBurst(this, centerX, startY + i * spacing);
                this.showCurrentStep();
            });
            
            card.create();
            
            if (card.cardElement) {
                card.cardElement.setFillStyle(parseInt(mode.color.replace('#', '0x')), 0.15);
                card.cardElement.setStrokeStyle(isSelected ? 4 : 2, parseInt(mode.color.replace('#', '0x')));
            }
        });
        
        const continueBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, this.scale.height - 150, 'Tęsti', {
                fontSize: '20px',
                backgroundColor: this.selectedMode ? '#27ae60' : '#95a5a6',
                padding: { left: 40, right: 40, top: 12, bottom: 12 },
                container: this.layers.ui
            })
        );
        
        continueBtn.onClick(() => {
            if (!this.selectedMode) return;
            this.step = 3;
            this.showCurrentStep();
        });
        
        if (this.selectedMode) {
            continueBtn.onHover(
                () => continueBtn.setStyle({ backgroundColor: '#219150' }),
                () => continueBtn.setStyle({ backgroundColor: '#27ae60' })
            );
        }
        
        continueBtn.create();
        
        const backBtn = this.addUI(new BioPhaser.UI.Button(this, 80, 50, '< Atgal', {
                fontSize: '18px',
                backgroundColor: 'transparent',
                color: '#3498db',
                container: this.layers.ui
            })
        );
        
        backBtn.onClick(() => {
            this.step = 1;
            this.showCurrentStep();
        });
        
        backBtn.onHover(
            () => backBtn.setStyle({ color: '#2980b9' }),
            () => backBtn.setStyle({ color: '#3498db' })
        );
        
        backBtn.create();
        backBtn.element.setOrigin(0, 0.5);
        
        this.visitedSteps.add(2);
    }
    
    /**
     * Rodo sunkumo lygio pasirinkimo ekraną
     * Leidžia pasirinkti lengvą, vidutinį arba sunkų lygį
     */
    showDifficultySelection() {
        const centerX = this.scale.width / 2;
        
        const centerDNA = this.addComponent(
            new BioPhaser.GameObject(this, { container: this.layers.ui })
        );
        const dnaImage = this.add.image(centerX, 80, 'dna').setScale(0.15);
        centerDNA.addElement(dnaImage);
        this.addTween({
            targets: dnaImage,
            angle: 360,
            duration: 20000,
            repeat: -1
        });
        
        const title = this.add.text(centerX, 165, 'Sunkumo lygis', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const subtitle = this.add.text(centerX, 205, 'Koks tavo pasirengimo lygis?', {
            fontSize: '15px',
            color: '#858f90ff',
            fontStyle: 'italic',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(subtitle);
        
        const isMokymosi = this.selectedMode === 'mokymosi';
        
        const difficulties = Object.entries(config.difficulties);
        const startY = 285;
        const spacing = 120;
        
        difficulties.forEach(([key, diff], i) => {
        const isSelected = this.selectedDifficulty === key;
        const desc = isMokymosi ? 
            diff.description : 
            `Kodonas matomas ${diff.introTime/1000}s ir ${diff.timeLimitPerCodon}s surasti jį sekoje`;

            
            const card = this.addUI(new BioPhaser.UI.Card(this, centerX, startY + i * spacing, {
                    width: 600,
                    height: 95,
                    label: diff.label,
                    sublabel: desc,
                    color: diff.color,
                    isSelected: isSelected,
                    container: this.layers.ui
                })
            );
            
            card.onClick(() => { 
                this.selectedDifficulty = key; 
                BioPhaser.Animation.Effects.starBurst(this, centerX, startY + i * spacing);
                this.showCurrentStep(); 
            });
            
            card.create();
            
            if (!this.visitedSteps.has(3)) {
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
        
        const backBtn = this.addUI(new BioPhaser.UI.Button(this, 80, 50, '< Atgal', {
                fontSize: '18px',
                backgroundColor: 'transparent',
                color: '#3498db',
                container: this.layers.ui
            })
        );
        
        backBtn.onClick(() => { this.step = 2; this.showCurrentStep(); });
        backBtn.onHover(
            () => backBtn.setStyle({ color: '#2980b9' }),
            () => backBtn.setStyle({ color: '#3498db' })
        );
        backBtn.create();
        backBtn.element.setOrigin(0, 0.5);
        
        const startBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, 750, 'Pradėti žaidimą', {
                fontSize: '22px',
                backgroundColor: this.selectedDifficulty ? '#27ae60' : '#95a5a6',
                padding: { left: 40, right: 40, top: 15, bottom: 15 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        
        startBtn.onClick(() => {
            if (!this.selectedDifficulty) return;
            
            this.scene.launch('CodonGame', {
                difficulty: this.selectedDifficulty,
                mode: this.selectedMode,
                selectedGroups: this.selectedGroups
            });
            
            this.addTimer({
                delay: 0,
                callback: () => {
                    this.scene.stop('CodonStart');
                }
            });
        });
        
        if (this.selectedDifficulty) {
            startBtn.onHover(
                () => startBtn.setStyle({ backgroundColor: '#219150' }),
                () => startBtn.setStyle({ backgroundColor: '#27ae60' })
            );
        }
        
        startBtn.create();
        
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
        this.load.image('arrowLeft', 'assets/left.png');
        this.load.image('arrowRight', 'assets/right.png');
        this.load.image('iconCorrect', 'assets/check.png');
        this.load.image('iconWrong', 'assets/delete.png');
        this.load.image('iconMissed', 'assets/warning.png');
        this.load.image('iconTimer', 'assets/timer.png');
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
        
        this.diffBadge = this.addComponent(new BioPhaser.UI.Badge(this, 150, badgeY, this.difficultySettings.label, {
                backgroundColor: this.difficultySettings.color,
                container: this.layers.uiPersistent
            })
        ).create();
        
        this.modeBadge = this.addComponent(new BioPhaser.UI.Badge(this, 720, badgeY, this.modeSettings.label, {
                backgroundColor: this.modeSettings.color,
                container: this.layers.uiPersistent
            })
        ).create();
        
        const centerX = this.scale.width / 2;
        const textY = 510;
        const barY = 535;
        
        this.progressTextObj = this.addComponent(new BioPhaser.GameObject(this, { container: this.layers.uiPersistent }));
        this.progressText = this.add.text(centerX, textY, 'Progresas: 0%', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.progressTextObj.addElement(this.progressText);
        
        this.progressBar = this.addComponent(new BioPhaser.UI.ProgressBar(this, centerX, barY, {
                width: 500,
                height: 10,
                progress: 0,
                bgColor: '#e0e0e0',
                color: '#27ae60',
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
        const centerX = this.scale.width / 2;
        
        if (this.timer && this.timer.text) {
            this.timer.text.setVisible(false);
        }
        
        const introText = this.add.text(centerX, 200, 'Įsimink šį kodoną:', {
            fontSize: '50px',
            color: '#5c4d7d'
        }).setOrigin(0.5);
        this.layers.ui.add(introText);
        
        const targetText = this.add.text(centerX, 280, `${this.targetAmino} → ${this.targetCodon}`, {
            fontSize: '52px', color: '#000'
        }).setOrigin(0.5);
        this.layers.ui.add(targetText);
        
        const introTime = this.mode === 'issukio' ? 
            this.difficultySettings.introTimeChallenge : 
            this.difficultySettings.introTime;
        
        this.addTimer({
            delay: introTime,
            callback: () => {
                introText.setVisible(false);
                targetText.setVisible(false);
                this.showSequence();
            }
        });
    }
    
    /**
     * Rodo mRNR seką su interaktyviais nukleotidais
     * Sukuria slankiojančią seką su galimybe žymėti kodonus
     */
    showSequence() {
        const instructionText = this.add.text(450, 130, 'Surask visus atitinkamus kodonus mRNR sekoje', {
            fontSize: '25px',
            color: '#5c4d7d'
        }).setOrigin(0.5);
        this.layers.ui.add(instructionText);
        
        if (this.mode === 'mokymosi') {
            this.showHintButtons();
        }
        
        if (this.mode === 'issukio') {
            const centerX = this.scale.width / 2;
            
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
                    onWarning: (time) => {
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
        const viewX = 100;
        const viewWidth = 700;
        const y = 260;
        
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
            BioPhaser.UI.Notification.show(this, 'Spausk tik pirmas kodono raides!', 'warning');
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
            
            if (this.hintDisplay) {
                this.hintDisplay.setVisible(false);
            }
            if (this.highlightedRow) {
                this.highlightedRow.destroy();
                this.highlightedRow = null;
            }
            
            BioPhaser.UI.Notification.show(this, 'Teisingai! ✓', 'success');
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
            
            BioPhaser.UI.Notification.show(this, 'NETEISINGAI! Bandyk dar kartą ✗', 'error');
            
            this.unlockNextHint();
        }
    }
    
    /**
     * Rodo užuominų mygtukus mokymosi režime
     * Trys užuominos: pirma raidė, amino rūgštis, lentelė
     */
    showHintButtons() {
        const hintY = 760;
        const centerX = 450;
        
        this.foundProgressText = this.add.text(centerX, 180, '', {
            fontSize: '18px',
            color: '#27ae60',
            fontFamily: 'Georgia',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.layers.ui.add(this.foundProgressText);
        
        const hints = [
            { level: 1, label: 'Užuomina 1', desc: 'Pirma raidė' },
            { level: 2, label: 'Užuomina 2', desc: 'Aminorūgštis' },
            { level: 3, label: 'Lentelė', desc: 'Paryškinta' }
        ];
        
        this.hintButtons = [];
        const spacing = 220;
        const startX = centerX - spacing;
        
        hints.forEach((hint, i) => {
            const x = startX + i * spacing;
            
            const btn = this.addUI(new BioPhaser.UI.Button(this, x, hintY, hint.label, {
                    fontSize: '18px',
                    backgroundColor: hint.level === 1 ? '#7790bcff' : '#b0bec5',
                    padding: { left: 20, right: 20, top: 12, bottom: 12 },
                    fontStyle: 'bold',
                    container: this.layers.ui
                })
            );
            
            btn.onClick(() => {
                this.activateHint(hint.level);
            });
            
            btn.create();
            btn.element.setScrollFactor(0);
            
            if (hint.level !== 1) {
                btn.element.setAlpha(0.5);
                btn.element.disableInteractive();
            }
            
            const desc = this.add.text(x, hintY + 35, hint.desc, {
                fontSize: '13px',
                color: '#7f8c8d',
                fontFamily: 'Georgia'
            }).setOrigin(0.5).setScrollFactor(0);
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
                    btn.element.setAlpha(1);
                    btn.setStyle({ backgroundColor: '#7790bcff' });
                    btn.element.setInteractive();
                } else {
                    btn.element.setAlpha(0.5);
                    btn.setStyle({ backgroundColor: '#95a5a6' });
                }
            });
        }
    }
    
    /**
     * Aktyvuoja užuominą ir rodo jos turinį
     */
    activateHint(level) {
        const centerX = 450;
        const hintY = 700;
        
        if (!this.hintDisplay) {
            this.hintDisplay = this.add.text(centerX, hintY, '', {
                fontSize: '16px',
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: { left: 16, right: 16, top: 10, bottom: 10 },
                fontFamily: 'Georgia',
                align: 'center',
                wordWrap: { width: 500 }
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(100);
            
            this.layers.ui.add(this.hintDisplay);
        }
        
        let hintText = '';
        
        if (level === 1) {
            hintText = `Kodonas prasideda raide "${this.targetCodon[0]}"`;
        } 
        else if (level === 2) {
            hintText = `Ieškome aminorūgšties "${this.targetAmino}"`;
        } 
        else if (level === 3) {
            hintText = `Žiūrėk į paryškintą eilutę lentelėje`;
            this.highlightInTable(this.targetCodon);
        }
        
        this.hintDisplay.setText(hintText);
        this.hintDisplay.setVisible(true);
        this.hintDisplay.setAlpha(1);
    }
    
    /**
     * Paryškina kodono eilutę kodonų lentelėje
     */
    highlightInTable(targetCodon) {
        if (!this.referenceTableContainer || !this.referenceTableContainer.visible) {
            this.showReferenceTable();
        }
        
        if (this.highlightedRow) {
            this.highlightedRow.destroy();
            this.highlightedRow = null;
        }
        
        this.addTimer({
            delay: 100,
            callback: () => {
                if (!this.referenceTableContainer) return;
                
                const children = this.referenceTableContainer.list;
                
                for (let child of children) {
                    if (child.text && child.text.includes(targetCodon)) {
                        const bounds = child.getBounds();
                        
                        this.highlightedRow = this.add.rectangle(
                            bounds.x - 2,
                            bounds.y - 1,
                            bounds.width + 4,
                            bounds.height + 2,
                            0xffeb3b,
                            0.8
                        ).setOrigin(0).setScrollFactor(0).setDepth(1001);
                        
                        child.setColor('#000');
                        child.setFontStyle('bold');
                        child.setDepth(1002);
                        
                        break;
                    }
                }
            }
        });
    }
    
    /**
     * Rodo kodonų lentelę kaip pagalbinę informaciją
     * Lentelė rodoma modal layer'yje ir gali būti uždaryta
     */
    showReferenceTable() {
        if (this.referenceTableContainer && this.referenceTableContainer.visible) {
            return;
        }
        
        if (this.referenceTableContainer) {
            this.referenceTableContainer.destroy();
        }
        
        const tableX = 580;
        const tableY = 360;
        
        this.referenceTableContainer = this.add.container(tableX, tableY).setScrollFactor(0).setDepth(1000);
        this.layers.modal.add(this.referenceTableContainer);
        
        const bg = this.add.rectangle(0, 0, 300, 370, 0xffffff, 1)
            .setOrigin(0)
            .setStrokeStyle(3, 0x3498db);
        
        this.referenceTableContainer.add(bg);
        
        const closeBtn = this.addUI(new BioPhaser.UI.Button(this, tableX + 285, tableY + 12, '✖', {
                fontSize: '20px',
                backgroundColor: 'transparent',
                color: '#e74c3c',
                fontStyle: 'bold',
                container: this.layers.modal
            })
        );
        
        closeBtn.onClick(() => {
            if (this.referenceTableContainer) {
                this.referenceTableContainer.setVisible(false);
            }
            if (this.highlightedRow) {
                this.highlightedRow.destroy();
                this.highlightedRow = null;
            }
            if (closeBtn && closeBtn.element) {
                closeBtn.destroy();
            }
        });
        
        closeBtn.create();
        closeBtn.element.setScrollFactor(0);
        closeBtn.element.setDepth(1001);
        
        const title = this.add.text(150, 10, 'Kodonų lentelė', {
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#4a3f75',
            fontFamily: 'Georgia'
        }).setOrigin(0.5, 0);
        
        this.referenceTableContainer.add(title);
        
        const entries = Object.entries(config.items);
        const lineHeight = 14;
        const maxPerColumn = 22;
        const columnWidth = 98;
        
        entries.forEach(([codon, amino], i) => {
            const col = Math.floor(i / maxPerColumn);
            const rowInCol = i % maxPerColumn;
            const x = 10 + col * columnWidth;
            const y = 38 + rowInCol * lineHeight;
            
            const row = this.add.text(x, y, `${codon}→${amino}`, {
                fontSize: '15px',
                color: '#333',
                fontFamily: 'monospace'
            }).setOrigin(0);
            
            this.referenceTableContainer.add(row);
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
    
    /**
     * Rodo "Tikrinti" mygtuką iššūkio režime
     */
    showCheckButton() {
        const centerX = this.scale.width / 2;
        
        this.checkBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, 400, 'Tikrinti', {
                fontSize: '24px',
                backgroundColor: '#27ae60',
                padding: { left: 40, right: 40, top: 15, bottom: 15 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        
        this.checkBtn.onClick(() => this.evaluate());
        this.checkBtn.onHover(
            () => this.checkBtn.setStyle({ backgroundColor: '#229954' }),
            () => this.checkBtn.setStyle({ backgroundColor: '#27ae60' })
        );
        this.checkBtn.create();
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
    
    /**
     * Rodo dabartinio raundo rezultatus
     */
    showResults(correct, mistakes, missed) {
        const resultLines = [
            { icon: 'iconCorrect', label: `Teisingi: ${correct}` },
            { icon: 'iconWrong', label: `Klaidos: ${mistakes}` },
            { icon: 'iconMissed', label: `Praleista: ${missed}` }
        ];
        
        const centerX = this.scale.width / 2;
        const baseY = 600;
        const lineHeight = 38;
        
        resultLines.forEach((item, i) => {
            const y = baseY + i * lineHeight;
            
            const labelText = this.add.text(0, 0, item.label, {
                fontSize: '18px',
                fontFamily: 'Georgia',
                color: '#000'
            }).setOrigin(0, 0.5);
            
            const icon = this.add.image(0, 0, item.icon)
                .setOrigin(0, 0.5)
                .setDisplaySize(24, 24);
            
            labelText.x = icon.displayWidth + 10;
            
            const totalWidth = icon.displayWidth + 10 + labelText.width;
            
            const container = this.add.container(centerX - totalWidth / 2, y, [icon, labelText]);
            this.layers.ui.add(container);
            
            BioPhaser.Animation.Tween.fadeIn(this, container, 300, i * 100);
        });
    }
    
    /**
     * Rodo "Tęsti" mygtuką po rezultatų
     */
    showContinueButton() {
        const centerX = this.scale.width / 2;
        
        const continueBtn = this.addUI(new BioPhaser.UI.Button(this, centerX, 730, 'Tęsti', {
                fontSize: '24px',
                backgroundColor: '#27ae60',
                padding: { left: 40, right: 40, top: 15, bottom: 15 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        
        continueBtn.onClick(() => {
            if (this.mode === 'mokymosi') {
                this.nextCodon();
            } else {
                this.nextChallengeRound();
            }
        });
        
        continueBtn.onHover(
            () => continueBtn.setStyle({ backgroundColor: '#219150' }),
            () => continueBtn.setStyle({ backgroundColor: '#27ae60' })
        );
        
        continueBtn.create();
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
            this.hintDisplay = null;
            this.highlightedRow = null;
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
    
    /**
     * Rodo galutinių rezultatų ekraną
     * Su detalia lentele ir galimybe grįžti arba žaisti iš naujo
     */
    showEnd() {
        this.destroyPersistentUI();
        this.cleanupUI();
        
        const centerX = this.scale.width / 2;
        
        this.addUI(new BioPhaser.UI.Badge(this, 150, 30, this.difficultySettings.label, {
                backgroundColor: this.difficultySettings.color,
                container: this.layers.ui
            })
        ).create().element.setScrollFactor(0);
        
        this.addUI(new BioPhaser.UI.Badge(this, 720, 30, this.modeSettings.label, {
                backgroundColor: this.modeSettings.color,
                container: this.layers.ui
            })
        ).create().element.setScrollFactor(0);
        
        const title = this.add.text(centerX, 80, 'REZULTATAI', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#2c3e50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5).setScrollFactor(0);
        this.layers.ui.add(title);
        
        this.showDetailedResults(centerX, 140);
        this.showResultButtons(centerX);
    }
    
    /**
     * Rodo detalią rezultatų lentelę
     */
    showDetailedResults(centerX, startY) {
        const headerY = startY;
        
        const headers = [
            { text: 'Kodonas', x: centerX - 280 },
            { text: 'Aminorūgštis', x: centerX - 120 },
            { text: 'Teisingi', x: centerX + 30 },
            { text: 'Klaidos', x: centerX + 140 },
            { text: 'Rezultatas', x: centerX + 260 }
        ];
        
        const tableData = this.resultsHistory.map(entry => [
            { text: entry.codon, fontStyle: 'bold', color: '#4a3f75', fontFamily: 'monospace', fontSize: '18px' },
            { text: entry.amino, fontSize: '16px' },
            { text: entry.correct.toString(), color: '#27ae60', fontFamily: 'monospace' },
            { text: entry.mistakes.toString(), color: '#e74c3c', fontFamily: 'monospace' },
            { text: this.getRating(entry), fontStyle: 'bold', color: this.getRatingColor(entry), fontSize: '14px' }
        ]);
        
        this.addUI(new BioPhaser.UI.Table(this, centerX, headerY, {
                width: 750,
                rowHeight: 40,
                headers: headers,
                data: tableData,
                headerColor: 0x5c4d7d,
                scrollFactor: 0,
                container: this.layers.ui
            })
        ).create();
        
        const contentHeight = startY + this.resultsHistory.length * 45 + 150;
        const viewHeight = this.scale.height;
        const maxScroll = Math.max(0, contentHeight - viewHeight);
        
        if (!this._wheelBound) {
            this._wheelBound = true;
            this.trackInput('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const newScrollY = this.cameras.main.scrollY + deltaY * 0.5;
                this.cameras.main.scrollY = Phaser.Math.Clamp(newScrollY, 0, maxScroll);
            });
        }
    }
    
    /**
     * Grąžina įvertinimą pagal rezultatus
     */
    getRating(entry) {
        const correct = entry.correct || 0;
        const mistakes = entry.mistakes || 0;
        const missed = entry.missed;
        
        if (correct === 0 && mistakes === 0 && missed !== undefined && missed > 0) {
            return 'Praleista';
        }
        
        if (correct > 0 && mistakes === 0) {
            return 'Puiku!';
        }
        
        if (correct === 0 && mistakes === 0) {
            return 'Nepradėta';
        }
        
        if (correct > mistakes) {
            return 'Gerai';
        }
        
        return 'Treniruokis';
    }
    
    /**
     * Grąžina įvertinimo spalvą
     */
    getRatingColor(entry) {
        const correct = entry.correct || 0;
        const mistakes = entry.mistakes || 0;
        const missed = entry.missed;
        
        if (correct === 0 && mistakes === 0 && missed !== undefined && missed > 0) {
            return '#f39c12';
        }
        
        if (correct > 0 && mistakes === 0) {
            return '#27ae60';
        }
        
        if (correct === 0 && mistakes === 0) {
            return '#95a5a6';
        }
        
        if (correct > mistakes) {
            return '#f39c12';
        }
        
        return '#e74c3c';
    }
    
    /**
     * Rodo rezultatų mygtukus (grįžti į pradžią, žaisti dar kartą)
     */
    showResultButtons(centerX) {
        const buttonY = this.scale.height - 100;
        
        const homeBtn = this.addUI(new BioPhaser.UI.Button(this, centerX - 130, buttonY, 'Grįžti į pradžią', {
                fontSize: '20px',
                backgroundColor: '#3498db',
                padding: { left: 20, right: 20, top: 12, bottom: 12 },
                container: this.layers.ui
            })
        );
        
        homeBtn.onClick(() => {
            this.scene.stop('CodonGame');
            this.scene.start('CodonStart');
        });
        
        homeBtn.onHover(
            () => homeBtn.setStyle({ backgroundColor: '#2980b9' }),
            () => homeBtn.setStyle({ backgroundColor: '#3498db' })
        );
        
        homeBtn.create();
        homeBtn.element.setScrollFactor(0);
        
        const playAgainBtn = this.addUI(new BioPhaser.UI.Button(this, centerX + 130, buttonY, 'Žaisti dar kartą', {
                fontSize: '20px',
                backgroundColor: '#27ae60',
                padding: { left: 20, right: 20, top: 12, bottom: 12 },
                container: this.layers.ui
            })
        );
        
        playAgainBtn.onClick(() => {
            this.scene.start('CodonGame', {
                difficulty: this.difficulty,
                mode: this.mode,
                selectedGroups: this.selectedGroups
            });
        });
        
        playAgainBtn.onHover(
            () => playAgainBtn.setStyle({ backgroundColor: '#229954' }),
            () => playAgainBtn.setStyle({ backgroundColor: '#27ae60' })
        );
        
        playAgainBtn.create();
        playAgainBtn.element.setScrollFactor(0);
    }
}

const engine = new BioPhaser.Engine(config);
engine.registerScene(CodonStartScene);
engine.registerScene(CodonGameScene);
engine.start();

export { CodonGameScene, CodonStartScene, config };
