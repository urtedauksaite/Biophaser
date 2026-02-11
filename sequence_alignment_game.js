import { BioPhaser } from './biophaser.js';


const config = await BioPhaser.Utils.ConfigLoader.load('./sequence_alignment.json');


const UI = {
    W: config.ui.dimensions.width,
    H: config.ui.dimensions.height,
    CX: config.ui.dimensions.centerX,
    
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

class StartScene extends BioPhaser.BioScene {
    constructor() {
        super('Start', config);
    }

    preload() {
        this.load.image('dna', './assets/dna.png');
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
            count: config.ui.particles.count,
            icon: 'dna',
            sizeRange: config.ui.particles.sizeRange,
            alpha: config.ui.particles.alpha
        })
        ).create();

        this.showTitleScreen();
    }

    showTitleScreen() {
        this.cleanupUI();

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const dnaComponent = this.addComponent(
        new BioPhaser.GameObject(this, { container: this.layers.ui })
        );

        const dna = this.add.image(centerX, centerY - 170, 'dna')
        .setScale(0.25);

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

        const title = this.add.text(centerX, centerY - 60, config.meta.title, {
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#2c3e50',
        fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);

        const desc = this.add.text(centerX, centerY + 10, config.meta.description, {
        fontSize: '18px',
        color: '#687475ff',
        fontFamily: 'Georgia',
        align: 'center',
        wordWrap: { width: 520 }
        }).setOrigin(0.5);
        this.layers.ui.add(desc);

        const startBtn = this.addUI(
        new BioPhaser.UI.Button(this, centerX, centerY + 120, config.text.start.buttonStart, {
            fontSize: '28px',
            backgroundColor: '#27ae60',
            padding: { left: 50, right: 50, top: 15, bottom: 15 },
            fontStyle: 'bold',
            container: this.layers.ui
        })
        );

        startBtn.onClick(() => {
        this.scene.start('Tutorial');
        });

        startBtn.onHover(
        () => startBtn.setStyle({ backgroundColor: '#219150' }),
        () => startBtn.setStyle({ backgroundColor: '#27ae60' })
        );

        startBtn.create();

        BioPhaser.Animation.Tween.fadeIn(this, startBtn.element, 1000, 500);
    }
}


class TutorialScene extends BioPhaser.BioScene {
    constructor() {
        super('Tutorial', config);
    }
    
    preload() {
        this.load.image('dna', './assets/dna.png');
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
                count: config.ui.particles.count,
                icon: 'dna',
                sizeRange: config.ui.particles.sizeRange,
                alpha: config.ui.particles.alpha
            })
        ).create();
        
        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);
        
        this.showTutorial();
    }
    
    showTutorial() {
        const cx = UI.CX;
        
        const title = this.add.text(cx, 80, config.text.tutorial.title, {
            fontSize: '48px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        const instructions = config.text.tutorial.instructions;
        
        const cardW = 320;
        const cardH = 160;
        const startX = cx - cardW - 30;
        const y = 250;
        
        instructions.forEach((instr, i) => {
            const x = startX + i * (cardW + 30);
            
            const card = this.add.rectangle(x, y, cardW, cardH, UI.colors.white, 0.9);
            card.setStrokeStyle(2, 0xDFE6E9);
            this.layers.ui.add(card);
            
            const titleText = this.add.text(x, y - 45, instr.title, {
                fontSize: '20px',
                fontStyle: 'bold',
                color: UI.colors.text,
                fontFamily: 'Georgia'
            }).setOrigin(0.5);
            this.layers.ui.add(titleText);
            
            const descText = this.add.text(x, y + 15, instr.text, {
                fontSize: '14px',
                color: UI.colors.muted,
                fontFamily: 'Georgia',
                align: 'center',
                wordWrap: { width: cardW - 40 }
            }).setOrigin(0.5);
            this.layers.ui.add(descText);
        });
        
        const exampleY = 480;
        this.showMiniExample(cx, exampleY);
        
        const btn = this.addComponent(
            new BioPhaser.UI.Button(this, cx, UI.footerY, config.text.tutorial.buttonContinue, {
                fontSize: '24px',
                backgroundColor: UI.colors.primary,
                padding: { left: 40, right: 40, top: 12, bottom: 12 },
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        
        btn.onClick(() => {
            this.scene.start('Setup');
        });
        
        btn.onHover(
            () => btn.setStyle({ backgroundColor: UI.colors.primaryHover }),
            () => btn.setStyle({ backgroundColor: UI.colors.primary })
        );
        
        btn.create();
    }
    
    showMiniExample(cx, y) {
        const tileSize = 36;
        const gap = 4;
        
        const sequences = [
            ['A', 'T', '-', 'G', 'C'],
            ['A', 'T', 'C', 'G', 'C'],
            ['A', '-', 'C', 'G', 'C']
        ];
        
        const label = this.add.text(cx, y - 60, config.text.tutorial.exampleLabel, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(label);
        
        sequences.forEach((seq, row) => {
            seq.forEach((base, col) => {
                const x = cx - (sequences[0].length * (tileSize + gap)) / 2 + col * (tileSize + gap) + tileSize / 2;
                const tileY = y + row * (tileSize + gap);
                
                const color = config.gameplay.baseColors[base];
                const tile = this.add.rectangle(x, tileY, tileSize, tileSize, parseInt(color.replace('#', '0x')), 0.9);
                tile.setStrokeStyle(2, 0xffffff);
                this.layers.ui.add(tile);
                
                const text = this.add.text(x, tileY, base, {
                    fontSize: '18px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);
                this.layers.ui.add(text);
            });
        });
        
    }
}


class SetupScene extends BioPhaser.BioScene {
    constructor() {
        super('Setup', config);
        this.numSequences = 3;
        this.difficulty = 'easy';
    }
    
    preload() {
        this.load.image('dna', './assets/dna.png');
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
                count: config.ui.particles.count,
                icon: 'dna',
                sizeRange: config.ui.particles.sizeRange,
                alpha: config.ui.particles.alpha
            })
        ).create();
        
        this.layers.ui.setDepth(20);
        
        this.showSetup();
    }
    
    showSetup() {
        const cx = UI.CX;
        
        const title = this.add.text(cx, 120, config.text.setup.title, {
            fontSize: '52px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(title);
        
        let currentY = 280;
        
        const diffProfile = config.gameplay.difficulties[this.difficulty];
        const [minSeq, maxSeq] = diffProfile.numSeqRange;
        const seqOptions = [];
        for (let i = minSeq; i <= maxSeq; i++) {
            seqOptions.push(i.toString());
        }
        
        this.renderOption(config.text.setup.sequenceCountLabel, currentY, 
            seqOptions,
            this.numSequences.toString(),
            (val) => { this.numSequences = parseInt(val); }
        );
        
        currentY += 180;
        
        this.renderOption(config.text.setup.difficultyLabel, currentY,
            Object.keys(config.gameplay.difficulties).map(k => config.gameplay.difficulties[k].label),
            config.gameplay.difficulties[this.difficulty].label,
            (val) => {
                for (let key in config.gameplay.difficulties) {
                    if (config.gameplay.difficulties[key].label === val) {
                        this.difficulty = key;
                        break;
                    }
                }
                this.cleanupUI();
                this.showSetup();
            }
        );
        
        const startBtn = this.addComponent(
            new BioPhaser.UI.Button(this, cx, 660, config.text.setup.buttonStart, {
                fontSize: '26px',
                width: 280,
                height: 65,
                backgroundColor: UI.colors.primary,
                fontStyle: 'bold',
                container: this.layers.ui
            })
        );
        
        startBtn.onClick(() => {
            this.scene.start('Game', {
                numSequences: this.numSequences,
                difficulty: this.difficulty
            });
        });
        
        startBtn.onHover(
            () => startBtn.setStyle({ backgroundColor: UI.colors.primaryHover }),
            () => startBtn.setStyle({ backgroundColor: UI.colors.primary })
        );
        
        startBtn.create();
        
        const backBtn = this.addComponent(
            new BioPhaser.UI.Button(this, 100, UI.footerY, config.text.setup.buttonBack, {
                fontSize: '18px',
                backgroundColor: UI.colors.info,
                padding: { left: 20, right: 20, top: 10, bottom: 10 },
                container: this.layers.ui
            })
        );
        
        backBtn.onClick(() => {
            this.scene.start('Tutorial');
        });
        
        backBtn.create();
    }
    
    renderOption(label, y, options, selected, onChange) {
        const cx = UI.CX;
        
        const labelText = this.add.text(cx, y - 50, label, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: UI.colors.text,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(labelText);
        
        const btnW = 110;
        const btnH = 60;
        const gap = 16;
        const totalW = options.length * btnW + (options.length - 1) * gap;
        const startX = cx - totalW / 2;
        
        options.forEach((opt, i) => {
            const x = startX + i * (btnW + gap) + btnW / 2;
            const isSelected = opt === selected;
            
            const btn = this.addComponent(
                new BioPhaser.UI.Button(this, x, y, opt, {
                    fontSize: '20px',
                    width: btnW,
                    height: btnH,
                    backgroundColor: isSelected ? UI.colors.primary : '#BDC3C7',
                    fontStyle: isSelected ? 'bold' : 'normal',
                    container: this.layers.ui
                })
            );
            
            btn.onClick(() => {
                onChange(opt);
                this.cleanupUI();
                this.showSetup();
            });
            
            if (!isSelected) {
                btn.onHover(
                    () => btn.setStyle({ backgroundColor: '#95A5A6' }),
                    () => btn.setStyle({ backgroundColor: '#BDC3C7' })
                );
            }
            
            btn.create();
        });
    }
}

class GameScene extends BioPhaser.BioScene {
    constructor() {
        super('Game', config);
        this.DEBUG = false;
    }
    
    init(data) {
        super.init(data);
        this.numSequences = data.numSequences || 3;
        this.difficulty = data.difficulty || 'easy';
        
        this.sequences = [];
        this.grid = [];
        this.score = 0;
        this.targetScore = 0;
        this.scoring = null;
        
        this.hasMoved = false;
        this.winShown = false;
        
        this.showingSolution = false;
        this.solutionContainer = null;
        
        this.tileSize = config.gameplay.grid.tileSize;
        this.tileGap = config.gameplay.grid.tileGap;
        
        this.draggingTile = null;
        this.dragStartPos = null;
    }
    
    preload() {
        this.load.image('dna', './assets/dna.png');
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
            count: config.ui.particles.count,
            icon: 'dna',
            sizeRange: config.ui.particles.sizeRange,
            alpha: config.ui.particles.alpha
        })
        ).create();
        
        this.layers.ui.setDepth(20);
        this.layers.modal.setDepth(30);
        
        this.generateSequences();
        this.calculateTargetScore();
        this.renderUI();
    }
    
    generateSequences() {
        const diffProfile = config.gameplay.difficulties[this.difficulty];
        
        const result = Alignment.generateSequences({
            numSeq: this.numSequences,
            minLen: diffProfile.minLen,
            maxLen: diffProfile.maxLen,
            similarity: diffProfile.similarity,
            bases: config.gameplay.bases
        });
        
        this.sequences = result.sequences;
        this.scoring = diffProfile.scoring;
        
        this.grid = this.sequences.map(seq => 
            seq.split('').map(base => ({ base, kind: 'base', tile: null, text: null }))
        );
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
        
        this.renderLabels();
        
        this.colTip = this.add.container(0, 0);
        this.colTipBg = this.add.rectangle(0, 0, 300, 80, 0xffffff, 0.95)
            .setStrokeStyle(2, 0xDFE6E9)
            .setOrigin(0, 0);
        this.colTipText = this.add.text(12, 8, '', {
            fontSize: '13px',
            color: UI.colors.text,
            fontFamily: 'monospace',
            align: 'left',
            lineSpacing: 2
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
        
        const backBtn = this.addComponent(
            new BioPhaser.UI.Button(this, 100, UI.footerY, config.text.game.buttonBack, {
                fontSize: '16px',
                backgroundColor: UI.colors.info,
                padding: { left: 16, right: 16, top: 8, bottom: 8 },
                container: this.layers.ui
            })
        );
        
        backBtn.onClick(() => {
            this.scene.start('Setup');
        });
        
        backBtn.create();
        
        const checkBtn = this.addComponent(
            new BioPhaser.UI.Button(this, UI.W - 140, UI.footerY, config.text.game.buttonCheck, {
                fontSize: '16px',
                backgroundColor: UI.colors.warn,
                padding: { left: 16, right: 16, top: 8, bottom: 8 },
                container: this.layers.ui
            })
        );
        
        checkBtn.onClick(() => {
            this.toggleSolution();
        });
        
        checkBtn.create();
    }
    
    renderHeader() {
        const cx = UI.CX;

        const headerBg = this.add.rectangle(cx, 60, 1100, 90, UI.colors.white, 0.92);
        headerBg.setStrokeStyle(2, 0xDFE6E9);
        this.layers.ui.add(headerBg);

        this.hintText = this.add.text(cx, 55, config.text.game.hint, {
            fontSize: '24px',
            color: '#2C3E50',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);

        this.layers.ui.add(this.hintText);
        
        const s = this.scoring || { match: 0, mismatch: 0, gap: 0 };
        const legend = config.text.game.scoringLegend;
        this.legendText = this.add.text(cx, 78, 
            `${legend.match} ${s.match}   ${legend.mismatch} ${s.mismatch}   ${legend.gap} ${s.gap}`, {
            fontSize: '15px',
            color: UI.colors.muted,
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.layers.ui.add(this.legendText);

        this.totalText = this.add.text(150, 30, `${config.text.game.scoreLabel} 0`, {
            fontSize: '15px',
            color: UI.colors.muted,
            fontFamily: 'Georgia',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.layers.ui.add(this.totalText);
    }
    
    renderLabels() {
        const startY = config.gameplay.grid.startY + 50;
        const rowHeight = this.tileSize + this.tileGap;
        
        this.sequences.forEach((seq, i) => {
            const y = startY + i * rowHeight;
            
            const label = this.add.text(120, y, `${config.text.game.sequenceLabelPrefix}${i + 1}`, {
                fontSize: '20px',
                fontStyle: 'bold',
                color: UI.colors.text,
                fontFamily: 'Georgia'
            }).setOrigin(0.5);
            this.layers.ui.add(label);
        });
    }
    
    
    createTile(base, x, y, row, col) {
        const cell = this.grid[row][col];
        const isGap = cell.base === '-';
        
        const color = config.gameplay.baseColors[base];
        const tile = this.add.rectangle(x, y, this.tileSize, this.tileSize, 
            parseInt(color.replace('#', '0x')), 0.9);
        tile.setStrokeStyle(2, 0xffffff);
        
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
                tile.setAlpha(0.5);
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
                    const startX = config.gameplay.grid.startX;
                    
                    const newCol = Math.round((pointer.x - startX) / colWidth);
                    const targetCol = Math.max(0, Math.min(newCol, this.grid[draggedRow].length));
                    
                    if (targetCol !== draggedCol) {
                        this.moveGap(draggedRow, draggedCol, targetCol);
                    }
                    
                    this.recreateAll();
                }
            });
        } else {
            tile.setInteractive();
            
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
        
        const text = this.add.text(x, y, base, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        cell.tile = tile;
        cell.text = text;
    }
    
    insertGap(row, col) {
        this.hasMoved = true;
        
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
        
        this.hasMoved = true;
        
        const [gap] = this.grid[row].splice(fromCol, 1);
        this.grid[row].splice(toCol, 0, gap);
        
        this.calculateScore();
    }
    
    recreateAll() {
        for (let r = 0; r < this.grid.length; r++) {
            this.grid[r].forEach((cell) => {
                cell.tile?.destroy();
                cell.text?.destroy();
            });
        }
        
        const startX = config.gameplay.grid.startX;
        const startY = config.gameplay.grid.startY + 50;
        const rowHeight = this.tileSize + this.tileGap;
        const colWidth = this.tileSize + this.tileGap;

        for (let r = 0; r < this.grid.length; r++) {
            const y = startY + r * rowHeight;
            
            for (let c = 0; c < this.grid[r].length; c++) {
                const cell = this.grid[r][c];
                const x = startX + c * colWidth;
                this.createTile(cell.base, x, y, r, c);
            }
        }
    }
    
    recreateRow(row) {
        this.grid[row].forEach(cell => {
            cell.tile?.destroy();
            cell.text?.destroy();
        });
        
        const startX = config.gameplay.grid.startX;
        const startY = config.gameplay.grid.startY + 50;
        const rowHeight = this.tileSize + this.tileGap;
        const colWidth = this.tileSize + this.tileGap;
        const y = startY + row * rowHeight;
        
        this.grid[row].forEach((cell, col) => {
            const x = startX + col * colWidth;
            this.createTile(cell.base, x, y, row, col);
        });
    }
    
    deleteGap(row, col) {
        if (this.grid[row][col]?.base !== '-') return;
        
        this.hasMoved = true;
        
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
        const matches = countGoodColumns(alignedRows);
        
        const allRowsSameLength = this.grid.every(row => row.length === maxLen);
        
        if (!this.winShown && this.hasMoved && this.score >= this.targetScore && allRowsSameLength) {
            this.winShown = true;
            this.showWin();
        }
        
        this.totalText?.setText(`${config.text.game.scoreLabel} ${this.score}`);
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
        const modalY = 400;
        const modalH = 100;

        this.addTimer({
        delay: 300,
        callback: () => {
            const btn = this.addComponent(
            new BioPhaser.UI.Button(this, UI.CX, 755, config.text.game.buttonNewGame, {
                fontSize: '18px',
                backgroundColor: UI.colors.primary,
                padding: { left: 26, right: 26, top: 10, bottom: 10 },
                container: this.layers.modal
            })
            );
            btn.onClick(() => this.scene.restart());
            btn.create();
        }
        });
    }
    
    toggleSolution() {
        this.showingSolution = !this.showingSolution;
        
        if (this.showingSolution) {
            this.showTargetAlignment();
        } else {
            this.hideTargetAlignment();
        }
    }
    
    showTargetAlignment() {
        this.hideTargetAlignment();
        
        this.solutionContainer = this.add.container(0, 0);
        this.solutionContainer.setDepth(25);
        this.add.existing(this.solutionContainer);
        
        const solutionY = 500;
        const startX = config.gameplay.grid.startX;
        const colW = this.tileSize + this.tileGap;
        const rowH = this.tileSize + this.tileGap;
        
        const title = this.add.text(startX, solutionY - 40, config.text.game.solutionTitle, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#27AE60',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);
        this.solutionContainer.add(title);
        
        const orderedAlignedRows = this.sequences.map(originalSeq => {
            for (const alignedRow of this.targetAlignment) {
                const withoutGaps = alignedRow.replace(/-/g, '');
                if (withoutGaps === originalSeq) {
                    return alignedRow;
                }
            }
            return null;
        });
        
        orderedAlignedRows.forEach((row, r) => {
            if (!row) return; // Skip if not found (shouldn't happen)
            
            const label = this.add.text(120, solutionY + r * rowH, `${config.text.game.sequenceLabelPrefix}${r + 1}`, {
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#27AE60',
                fontFamily: 'Georgia'
            }).setOrigin(0.5);
            this.solutionContainer.add(label);
            
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const x = startX + c * colW;
                const y = solutionY + r * rowH;
                
                const colorHex = config.gameplay.baseColors[ch] || '#95A5A6';
                const rect = this.add.rectangle(x, y, this.tileSize, this.tileSize,
                    parseInt(colorHex.replace('#', '0x')), 0.7);
                rect.setStrokeStyle(2, 0x27AE60);
                
                const txt = this.add.text(x, y, ch, {
                    fontSize: '16px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);
                
                this.solutionContainer.add([rect, txt]);
            }
        });
    }
    
    hideTargetAlignment() {
        if (this.solutionContainer) {
            this.solutionContainer.destroy(true);
            this.solutionContainer = null;
        }
    }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBase(except = null, bases) {
    const choices = except ? bases.filter(b => b !== except) : bases;
    return choices[randInt(0, choices.length - 1)];
}

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
            // 0
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