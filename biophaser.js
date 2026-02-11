/**
 * ================================================
 * BioPhaser Framework v2.1
 * ================================================
 * 
 * Edukacinių žaidimų kūrimo framework'as paremtas Phaser 3
 * 
 * Pagrindinės savybės:
 * - Sluoksniais paremta rendering sistema (layer-based)
 * - Automatinis atminties ir lifecycle valdymas
 * - Pakartotinai naudojamų UI komponentų biblioteka
 * - JSON konfigūracija žaidimų kūrimui
 * - Įtaisyti animacijų pagalbininkai
 * - Fono efektų sistema
 * 
 * Architektūra:
 * - Engine: Žaidimo inicializacija ir scenų valdymas
 * - BioScene: Patobulintas scene su lifecycle valdymu
 * - GameObject: Bazinė klasė visiems komponentams
 * - UI komponentai: Button, Card, Modal, Badge, Timer, Table
 * - Background: Gradiento ir dalelių sistemos
 * - Animation: Tween pagalbininkai ir vizualiniai efektai
 * - Gameplay: Pakartotinai naudojami žaidimo logikos moduliai
 * - Utils: Konfigūracijos ir išteklių įkėlimas
 */

// ========================================
// PAGRINDINĖS KLASĖS
// ========================================

/**
 * Žaidimo variklio (engine) apvalkalas Phaser
 * Valdo scenų registraciją ir inicializaciją
 * 
 * @example
 * const engine = new Engine({
 *   type: Phaser.AUTO,
 *   width: 900,
 *   height: 800,
 *   parent: 'game-container'
 * });
 * engine.registerScene(MyScene);
 * engine.start();
 */
class Engine {
    /**
     * Sukuria naują žaidimo variklį
     * @param {Object} config - Phaser žaidimo konfigūracija
     * @param {number} config.type - Renderer tipas (Phaser.AUTO, WEBGL, CANVAS)
     * @param {number} config.width - Žaidimo plotis pikseliais
     * @param {number} config.height - Žaidimo aukštis pikseliais
     * @param {string} config.parent - DOM konteinerio elemento ID
     * @param {string} [config.backgroundColor] - Fono spalva
     */
    constructor(config) {
        this.config = config;
        this.scenes = [];
    }
    
    /**
     * Registruoja scenos klasę įtraukti į žaidimą
     * @param {Phaser.Scene} scene - Registruojama scenos klasė
     * @returns {Engine} this metodų grandinei
     */
    registerScene(scene) {
        this.scenes.push(scene);
        return this;
    }
    
    /**
     * Inicializuoja ir paleidžia Phaser žaidimą
     * @returns {Phaser.Game} Sukurtas žaidimo instance
     */
    start() {
        const phaserConfig = {
            type: this.config.type ?? Phaser.AUTO,
            width: this.config.width ?? this.config.ui?.width ?? 900,
            height: this.config.height ?? this.config.ui?.height ?? 900,
            parent: this.config.parent ?? 'game-container',
            backgroundColor: this.config.backgroundColor ?? this.config.ui?.theme?.backgroundColor ?? '#e3f2fd',
            scene: this.scenes
        };
        
        return new Phaser.Game(phaserConfig);
    }
}

/**
 * Bazinė scenos klasė su pagerintu lifecycle valdymu
 * Išplečia Phaser.Scene su komponentų sistema ir automatiniu valymų
 * 
 * Savybės:
 * - Sluoksniais paremtas renderinimas (bg, world, ui, modal)
 * - Automatinis komponentų, laikmačių ir tween'ų valymas
 * - Registruojami disposables funkcijai custom cleanup
 * - Atskiras lifecycle persistent vs temporary UI elementams
 * 
 * @example
 * class MyScene extends BioScene {
 *   create() {
 *     this.createLayers();
 *     
 *     // Pridedame ilgaamžį foną
 *     this.addComponent(
 *       new BioPhaser.Background.Gradient(this, '#fff', '#eee')
 *     ).create();
 *     
 *     // Pridedame laikiną UI
 *     const btn = this.addUI(
 *       new BioPhaser.UI.Button(this, 100, 100, 'Spausk')
 *     );
 *     btn.create();
 *   }
 * }
 */
class BioScene extends Phaser.Scene {
    /**
     * Sukuria naują BioScene
     * @param {string} key - Unikalus scenos identifikatorius
     * @param {Object} gameConfig - Žaidimui specifinė konfigūracija (paprastai iš JSON)
     */
    constructor(key, gameConfig) {
        super(key);
        this.gameConfig = gameConfig;
        this.components = [];      // Ilgaamžiai komponentai (fonai, persistent UI)
        this.uiComponents = [];    // Trumpaamžiai UI (mygtukai, modalai, laikini elementai)
        this.disposables = [];     // Valymo funkcijos laikmačiams, tweens, events
        this.layers = null;
    }
    
    /**
     * Inicializuoja sceną ir registruoja valymo handler'ius
     * @param {Object} data - Duomenys perduoti iš ankstesnės scenos
     */
    init(data) {
        this.events.once('shutdown', () => this._cleanup());
        this.events.once('destroy', () => this._cleanup());
    }
    
    /**
     * Vidinis valymo metodas iškviečiamas scenos išjungimo metu
     * Vykdo visas registruotas valymo funkcijas ir sunaikina komponentus
     * @private
     */
    _cleanup() {
        this.disposables.forEach(fn => {
            try {
                fn();
            } catch (e) {
                console.warn('Disposable cleanup failed:', e);
            }
        });
        this.disposables = [];
        
        this.destroyComponents();
    }
    
    /**
     * Sukuria standartinius sluoksnių konteinerius renderinimo hierarchijai
     * 
     * Sluoksniai užtikrina tinkamą z-ordering ir izoliaciją tarp UI elementų:
     * - bg (-100): Fono gradientai ir dalelės
     * - world (0): Žaidimo pasaulio objektai
     * - uiPersistent (100): Progress barai, badge'ai kurie lieka per UI pakeitimus
     * - uiTemporary (101): Mygtukai, kortelės, laikinas UI kuris išvalomas
     * - modal (1000): Modal dialogs ir overlays
     * 
     * @returns {Object} sluoksnių objektas su konteinerių nuorodomis
     */
    createLayers() {
        this.layers = {
            bg: this.add.container(0, 0).setDepth(-100).setScrollFactor(0),
            world: this.add.container(0, 0).setDepth(0),
            uiPersistent: this.add.container(0, 0).setDepth(100).setScrollFactor(0),
            uiTemporary: this.add.container(0, 0).setDepth(101).setScrollFactor(0),
            modal: this.add.container(0, 0).setDepth(1000).setScrollFactor(0)
        };
        
        this.layers.ui = this.layers.uiTemporary;
        
        return this.layers;
    }
    
    /**
     * Registruoja valymo funkciją kuri bus iškviesta scenos sunaikinimo metu
     * Naudinga rankiniam išorinių išteklių valymui
     * 
     * @param {Function} disposableFn - Funkcija vykdyti valymo metu
     * @returns {Function} Registruota funkcija
     * @example
     * this.track(() => {
     *   console.log('Valau custom resource');
     *   myResource.dispose();
     * });
     */
    track(disposableFn) {
        this.disposables.push(disposableFn);
        return disposableFn;
    }
    
    /**
     * Sukuria laikmačio įvykį su automatiniu valymu
     * Laikmatis automatiškai pašalinamas kai scena sunaikinama
     * 
     * @param {Object} config - Phaser timer event konfigūracija
     * @param {number} config.delay - Vėlavimas milisekundėmis
     * @param {Function} config.callback - Funkcija iškviesti
     * @param {boolean} [config.loop=false] - Ar kartoti
     * @returns {Phaser.Time.TimerEvent}
     */
    addTimer(config) {
        const event = this.time.addEvent(config);
        this.track(() => {
            if (event) event.remove();
        });
        return event;
    }
    
    /**
     * Sukuria tween su automatiniu valymu
     * Tween automatiškai sustabdomas kai scena sunaikinama
     * 
     * @param {Object} config - Phaser tween konfigūracija
     * @returns {Phaser.Tweens.Tween}
     */
    addTween(config) {
        const tween = this.tweens.add(config);
        this.track(() => {
            if (tween) tween.stop();
        });
        return tween;
    }
    
    /**
     * Registruoja input įvykį su automatiniu valymu
     * @param {string} event - Įvykio pavadinimas (pvz., 'pointerdown')
     * @param {Function} handler - Įvykio handler funkcija
     */
    trackInput(event, handler) {
        this.input.on(event, handler);
        this.track(() => {
            this.input.off(event, handler);
        });
    }
    
    /**
     * Registruoja kelis įvykius ant žaidimo objekto
     * Pastaba: Phaser automatiškai pašalina įvykius kai objektas sunaikinamas,
     * todėl rankinis valymas nereikalingas
     * 
     * @param {Phaser.GameObjects.GameObject} gameObject - Tikslo žaidimo objektas
     * @param {Object} eventsMap - Įvykių pavadinimų ir handler funkcijų žemėlapis
     * @example
     * this.trackEvents(button, {
     *   'pointerover': () => console.log('hover'),
     *   'pointerout': () => console.log('exit')
     * });
     */
    trackEvents(gameObject, eventsMap) {
        Object.entries(eventsMap).forEach(([event, handler]) => {
            gameObject.on(event, handler);
        });
    }
    
    /**
     * Prideda ilgaamžį komponentą (pvz., foną, daleles)
     * Komponentas išlieka visą scenos gyvavimo laiką
     * 
     * @param {GameObject} component - Pridedamas komponentas
     * @returns {GameObject} Pridėtas komponentas
     */
    addComponent(component) {
        this.components.push(component);
        return component;
    }
    
    /**
     * Prideda trumpaamžį UI komponentą (pvz., mygtuką, modalą)
     * Šie komponentai automatiškai išvalomi kai iškviečiama cleanupUI()
     * 
     * @param {GameObject} component - UI komponentas pridėti
     * @returns {GameObject} Pridėtas komponentas
     */
    addUI(component) {
        this.uiComponents.push(component);
        return component;
    }
    
    /**
     * Išvalo laikinus UI elementus
     * Iškviečiama pereinant tarp UI būsenų (pvz., kitas klausimas, naujas ekranas)
     * 
     * Šis metodas:
     * 1. Sunaikina visus UI komponentus registruotus su addUI()
     * 2. Išvalo laikinus UI sluoksnius (uiTemporary, modal)
     * 3. Išsaugo persistent UI (progress bars, badge'us uiPersistent sluoksnyje)
     */
    cleanupUI() {
        (this.uiComponents || []).forEach(c => {
            try {
                c.destroy?.();
            } catch (e) {
                console.warn('UI component destroy failed:', e);
            }
        });
        this.uiComponents = [];
        
        if (this.layers?.uiTemporary) this.layers.uiTemporary.removeAll(true);
        if (this.layers?.ui) this.layers.ui.removeAll(true);
        if (this.layers?.modal) this.layers.modal.removeAll(true);
    }
    
    /**
     * Sunaikina visus ilgaamžius komponentus
     * Iškviečiama scenos valymo metu
     * @private
     */
    destroyComponents() {
        this.components.forEach(c => {
            try {
                c.destroy?.();
            } catch (e) {
                console.warn('Component destroy failed:', e);
            }
        });
        this.components = [];
    }
}

/**
 * Bazinė klasė visiems žaidimo objektams ir komponentams
 * Valdo Phaser žaidimo objektus su automatiniu valymu
 * 
 * Savybės:
 * - Elementų stebėjimas ir valymas
 * - Automatinis konteinerio priskyrimas
 * - Saugus sunaikinimo handling
 */
class GameObject {
    /**
     * Sukuria naują žaidimo objektą
     * @param {Phaser.Scene} scene - Tėvinė scena
     * @param {Object} [config={}] - Konfigūracijos opcijos
     * @param {Phaser.GameObjects.Container} [config.container] - Konteineris pridėti elementus
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = config;
        this.elements = [];
        this.container = config.container || null;
    }
    
    /**
     * Prideda Phaser žaidimo objektą prie šio komponento
     * Automatiškai prideda į konteinerį jei vienas nustatytas
     * 
     * @param {Phaser.GameObjects.GameObject} element - Phaser žaidimo objektas pridėti
     * @param {Phaser.GameObjects.Container} [container] - Papildomas konteinerio override
     * @returns {GameObject} this metodų grandinei
     */
    addElement(element, container = null) {
        this.elements.push(element);
        
        const targetContainer = container || this.container;
        if (targetContainer && targetContainer.add) {
            targetContainer.add(element);
        }
        
        return this;
    }
    
    /**
     * Nustato konteinerį būsimiems elementams
     * @param {Phaser.GameObjects.Container} container
     * @returns {GameObject} this metodų grandinei
     */
    setContainer(container) {
        this.container = container;
        return this;
    }
    
    /**
     * Sunaikina visus valdomus elementus
     * Saugiai tvarko interaktyvius ir sunaikinamus objektus
     */
    destroy() {
        this.elements.forEach(el => {
            try {
                if (el && el.disableInteractive) {
                    el.disableInteractive();
                }
                if (el && el.destroy) {
                    el.destroy();
                }
            } catch (e) {
                // Tylus fail kad išvengtume cascade klaidų
            }
        });
        this.elements = [];
    }
}

// ========================================
// UI KOMPONENTAI
// ========================================

/**
 * Interaktyvus mygtuko komponentas
 * 
 * Savybės:
 * - Paspaudimo ir hover callback'ai
 * - Stiliaus pritaikymas
 * - Teksto atnaujinimas
 * - Enable/disable būsena
 * 
 * @example
 * const btn = new Button(scene, 100, 100, 'Spausk', {
 *   fontSize: '20px',
 *   backgroundColor: '#3498db',
 *   container: scene.layers.ui
 * });
 * btn.onClick(() => console.log('Paspaustas!'));
 * btn.onHover(
 *   () => btn.setStyle({ backgroundColor: '#2980b9' }),
 *   () => btn.setStyle({ backgroundColor: '#3498db' })
 * );
 * btn.create();
 */
class Button extends GameObject {
    /**
     * Sukuria naują mygtuką
     * @param {Phaser.Scene} scene
     * @param {number} x - X pozicija
     * @param {number} y - Y pozicija
     * @param {string} text - Mygtuko tekstas
     * @param {Object} [style={}] - Mygtuko stiliaus opcijos
     * @param {string} [style.fontSize='20px']
     * @param {string} [style.backgroundColor='#3498db']
     * @param {string} [style.color='#fff']
     * @param {Object} [style.padding] - Padding {left, right, top, bottom}
     * @param {string} [style.fontFamily='Georgia']
     * @param {Phaser.GameObjects.Container} [style.container] - Konteineris pridėti
     */
    constructor(scene, x, y, text, style = {}) {
        super(scene, { container: style.container });
        this.x = x;
        this.y = y;
        this.text = text;
        this.style = {
            fontSize: style.fontSize || '20px',
            backgroundColor: style.backgroundColor || '#3498db',
            color: style.color || '#fff',
            padding: style.padding || { left: 20, right: 20, top: 12, bottom: 12 },
            fontFamily: style.fontFamily || 'Georgia',
            ...style
        };
        this.element = null;
        this.callbacks = {
            click: null,
            hover: null,
            exit: null
        };
    }
    
    /**
     * Sukuria mygtuko vizualinį elementą
     * Turi būti iškviesta po konstrukcijos mygtukui atvaizduoti
     * @returns {Button} this metodų grandinei
     */
    create() {
        this.element = this.scene.add.text(this.x, this.y, this.text, this.style)
            .setOrigin(0.5)
            .setInteractive();
        
        this.addElement(this.element);
        
        if (this.callbacks.click) {
            this.element.on('pointerdown', this.callbacks.click);
        }
        if (this.callbacks.hover) {
            this.element.on('pointerover', this.callbacks.hover);
        }
        if (this.callbacks.exit) {
            this.element.on('pointerout', this.callbacks.exit);
        }
        
        return this;
    }
    
    /**
     * Nustato paspaudimo handler'į
     * @param {Function} callback - Funkcija iškviesti paspaudus
     * @returns {Button} this metodų grandinei
     */
    onClick(callback) {
        if (this.element && this.callbacks.click) {
            this.element.off('pointerdown', this.callbacks.click);
        }
        
        this.callbacks.click = callback;
        
        if (this.element) {
            this.element.on('pointerdown', callback);
        }
        
        return this;
    }
    
    /**
     * Nustato hover handler'ius
     * @param {Function} enterCallback - Iškviečiama kai pointer'is užeina
     * @param {Function} exitCallback - Iškviečiama kai pointer'is išeina
     * @returns {Button} this metodų grandinei
     */
    onHover(enterCallback, exitCallback) {
        if (this.element && this.callbacks.hover) {
            this.element.off('pointerover', this.callbacks.hover);
        }
        if (this.element && this.callbacks.exit) {
            this.element.off('pointerout', this.callbacks.exit);
        }
        
        this.callbacks.hover = enterCallback;
        this.callbacks.exit = exitCallback;
        
        if (this.element) {
            this.element.on('pointerover', enterCallback);
            
            if (exitCallback) {
                this.element.on('pointerout', exitCallback);
            }
        }
        
        return this;
    }
    
    /**
     * Atnaujina mygtuko stilių
     * @param {Object} style - Stiliaus savybės atnaujinti
     * @returns {Button} this metodų grandinei
     */
    setStyle(style) {
        if (this.element) {
            this.element.setStyle(style);
        }
        return this;
    }
    
    /**
     * Atnaujina mygtuko tekstą
     * @param {string} text - Naujas tekstas
     * @returns {Button} this metodų grandinei
     */
    setText(text) {
        if (this.element) {
            this.element.setText(text);
        }
        return this;
    }
}

/**
 * Pasirenkama kortelės komponentas su ikona, label ir sublabel
 * Naudojamas pasirinkimų meniu ir pasirinkimo ekranuose
 * 
 * @example
 * const card = new Card(scene, 450, 300, {
 *   width: 600,
 *   height: 80,
 *   label: 'Lengvas režimas',
 *   sublabel: 'Rekomenduojama pradedantiesiems',
 *   color: '#27ae60',
 *   icon: 'easy',
 *   isSelected: false,
 *   container: scene.layers.ui
 * });
 * card.onClick(() => console.log('Pasirinkta!'));
 * card.create();
 */
class Card extends GameObject {
    constructor(scene, x, y, options = {}) {
        super(scene, { container: options.container });
        this.x = x;
        this.y = y;
        this.width = options.width || 600;
        this.height = options.height || 70;
        this.label = options.label || '';
        this.sublabel = options.sublabel || '';
        this.color = options.color || '#85c1e9';
        this.icon = options.icon || null;
        this.isSelected = options.isSelected || false;
        this.showCheckmark = options.showCheckmark !== false;
        this.clickCallback = null;
        this.cardElement = null;
    }
    
    create() {
        const cardColor = parseInt(this.color.replace('#', '0x'));
        
        const shadow = this.scene.add.rectangle(
            this.x, this.y + 2, this.width, this.height, 0x000000, 0.05
        );
        shadow.setDepth(-1);
        this.addElement(shadow);
        
        const card = this.scene.add.rectangle(
            this.x, this.y, this.width, this.height, cardColor, 0.3
        ).setStrokeStyle(this.isSelected ? 3 : 2, this.isSelected ? cardColor : 0xe0e0e0)
        .setInteractive();
        this.addElement(card);
        this.cardElement = card;
        
        if (this.icon && this.scene.textures.exists(this.icon)) {
            const icon = this.scene.add.image(this.x - this.width/2 + 40, this.y, this.icon)
                .setScale(0.5)
                .setOrigin(0.5);
            this.addElement(icon);
        }
        
        const labelX = this.icon ? this.x - this.width/2 + 90 : this.x - this.width/2 + 20;
        const label = this.scene.add.text(labelX, this.y - 6, this.label, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#000000',
            fontFamily: 'Georgia'
        }).setOrigin(0, 0.5);
        this.addElement(label);
        
        if (this.sublabel) {
            const sublabel = this.scene.add.text(labelX, this.y + 18, this.sublabel, {
                fontSize: '16px',
                color: '#333333',
                fontFamily: 'Georgia'
            }).setOrigin(0, 0.5);
            this.addElement(sublabel);
        }
        
        if (this.isSelected && this.showCheckmark && this.scene.textures.exists('checkCircle')) {
            const check = this.scene.add.image(this.x + this.width/2 - 40, this.y, 'checkCircle')
                .setScale(0.55)
                .setOrigin(0.5)
                .setTint(cardColor);
            this.addElement(check);
        }
        
        const onOver = () => card.setFillStyle(cardColor, 0.45);
        const onOut = () => card.setFillStyle(cardColor, 0.3);
        
        const eventsToTrack = {
            'pointerover': onOver,
            'pointerout': onOut
        };
        
        if (this.clickCallback) {
            eventsToTrack['pointerdown'] = this.clickCallback;
        }
        
        this.scene.trackEvents(card, eventsToTrack);
        
        return this;
    }
    
    onClick(callback) {
        if (this.cardElement && this.clickCallback) {
            this.cardElement.off('pointerdown', this.clickCallback);
        }
        
        this.clickCallback = callback;
        
        if (this.cardElement) {
            this.cardElement.on('pointerdown', callback);
        }
        
        return this;
    }
}

/**
 * Pažangos juostos komponentas su animuotu užpildymu
 */
class ProgressBar extends GameObject {
    constructor(scene, x, y, options = {}) {
        super(scene, { container: options.container });
        this.x = x;
        this.y = y;
        this.width = options.width || 500;
        this.height = options.height || 16;
        this.progress = options.progress || 0;
        this.color = options.color || '#3498db';
        this.bgColor = options.bgColor || '#e0e0e0';
        this.fill = null;
    }
    
    create() {
        const bg = this.scene.add.rectangle(
            this.x, this.y, this.width, this.height, 
            parseInt(this.bgColor.replace('#', '0x'))
        ).setOrigin(0.5).setScrollFactor(0);
        this.addElement(bg);
        
        this.fill = this.scene.add.rectangle(
            this.x - this.width / 2 + 2,
            this.y,
            0,
            this.height - 4,
            parseInt(this.color.replace('#', '0x'))
        ).setOrigin(0, 0.5);
        this.addElement(this.fill);
        
        return this;
    }
    
    /**
     * Nustato pažangos vertę ir atnaujina užpildymo plotį
     * @param {number} value - Pažangos vertė (0-1)
     * @returns {ProgressBar} this metodų grandinei
     */
    setProgress(value) {
        this.progress = Phaser.Math.Clamp(value, 0, 1);

        if (this.fill) {
            this.fill.width = (this.width - 4) * this.progress;
        }

        return this;
    }
}

/**
 * Modal dialogo komponentas
 */
class Modal extends GameObject {
    constructor(scene, x, y, options = {}) {
        super(scene, { container: options.container ?? scene.layers?.modal });
        
        if (typeof x === 'object' && y === undefined) {
            options = x;
            x = this.scene.scale.width / 2;
            y = this.scene.scale.height / 2;
        }
        
        this.centerX = x;
        this.centerY = y;
        this.width = options.width || 500;
        this.height = options.height || 250;
        this.title = options.title || '';
        this.content = options.content || '';
        this.borderColor = options.borderColor || 0x3498db;
        this.titleStyle = options.titleStyle || {};
        this.closeCallback = options.onClose || null;
    }
    
    create() {
        const box = this.scene.add.rectangle(
            this.centerX, this.centerY,
            this.width, this.height, 0xffffff
        ).setScrollFactor(0).setDepth(1001)
        .setStrokeStyle(3, this.borderColor);
        this.addElement(box);
        
        if (this.title) {
            const defaultTitleStyle = {
                fontSize: '28px',
                fontStyle: 'bold',
                color: '#2c3e50',
                fontFamily: 'Georgia',
                align: 'center',
                wordWrap: { width: this.width - 60 }
            };
            
            const finalTitleStyle = { ...defaultTitleStyle, ...this.titleStyle };
            
            const title = this.scene.add.text(
                this.centerX, this.centerY,
                this.title,
                finalTitleStyle
            ).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
            this.addElement(title);
        }
        
        if (this.content) {
            const content = this.scene.add.text(
                this.centerX, this.centerY + 30,
                this.content, {
                    fontSize: '18px',
                    color: '#7f8c8d',
                    fontFamily: 'Georgia',
                    align: 'center',
                    wordWrap: { width: this.width - 60 }
                }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
            this.addElement(content);
        }
        
        return this;
    }
    
    addButton(text, callback, style = {}) {
        const buttonY = this.centerY + this.height/2 - 40;
        const btn = new Button(this.scene, this.centerX, buttonY, text, {
            ...style,
            container: this.container,
            padding: style.padding || { left: 30, right: 30, top: 12, bottom: 12 }
        }).create().onClick(() => {
            if (callback) callback();
            this.destroy();
        });
        
        btn.element.setScrollFactor(0).setDepth(1002);
        this.addElement(btn);
        return this;
    }
}

/**
 * Badge komponentas mažiems žymiems rodiniams
 */
class Badge extends GameObject {
    constructor(scene, x, y, text, options = {}) {
        super(scene, { container: options.container });
        this.x = x;
        this.y = y;
        this.text = text;
        
        if (typeof options === 'string') {
            options = { backgroundColor: options };
        }
        
        this.backgroundColor = options.backgroundColor || '#3498db';
        this.fontSize = options.fontSize || '16px';
    }
    
    create() {
        const badge = this.scene.add.text(this.x, this.y, this.text, {
            fontSize: this.fontSize,
            backgroundColor: this.backgroundColor,
            color: '#fff',
            padding: { left: 12, right: 12, top: 6, bottom: 6 },
            fontFamily: 'Georgia'
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.addElement(badge);
        this.element = badge;
        return this;
    }
}

/**
 * Lentelės komponentas duomenų rodymui lentelėje
 */
class Table extends GameObject {
    constructor(scene, x, y, options = {}) {
        super(scene, { container: options.container });
        this.x = x;
        this.y = y;
        this.width = options.width || 750;
        this.rowHeight = options.rowHeight || 40;
        this.headers = options.headers || [];
        this.data = options.data || [];
        this.headerColor = options.headerColor || 0x5c4d7d;
        this.scrollFactor = options.scrollFactor !== undefined ? options.scrollFactor : 0;
    }
    
    create() {
        const headerBg = this.scene.add.rectangle(
            this.x, this.y, this.width, this.rowHeight, this.headerColor
        ).setScrollFactor(this.scrollFactor);
        this.addElement(headerBg);
        
        this.headers.forEach((header) => {
            const headerText = this.scene.add.text(header.x, this.y, header.text, {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffffff',
                fontFamily: 'Georgia'
            }).setOrigin(0.5).setScrollFactor(this.scrollFactor);
            this.addElement(headerText);
        });
        
        this.data.forEach((row, i) => {
            const rowY = this.y + (i + 1) * (this.rowHeight + 5);
            const bgColor = i % 2 === 0 ? 0xf8f8f8 : 0xffffff;
            
            const rowBg = this.scene.add.rectangle(
                this.x, rowY, this.width, this.rowHeight, bgColor
            ).setStrokeStyle(1, 0xe0e0e0).setScrollFactor(this.scrollFactor);
            this.addElement(rowBg);
            
            row.forEach((cell, j) => {
                if (j < this.headers.length) {
                    const cellData = typeof cell === 'object' ? cell : { text: cell };
                    
                    const cellText = this.scene.add.text(
                        this.headers[j].x, rowY, cellData.text || cell, {
                            fontSize: cellData.fontSize || '16px',
                            color: cellData.color || '#333',
                            fontFamily: cellData.fontFamily || 'Georgia',
                            fontStyle: cellData.fontStyle || 'normal'
                        }
                    ).setOrigin(0.5).setScrollFactor(this.scrollFactor);
                    this.addElement(cellText);
                    
                    if (cellData.icon && this.scene.textures.exists(cellData.icon)) {
                        const icon = this.scene.add.image(
                            this.headers[j].x - 20, rowY, cellData.icon
                        ).setDisplaySize(18, 18).setScrollFactor(this.scrollFactor);
                        this.addElement(icon);
                    }
                }
            });
        });
        
        return this;
    }
}

/**
 * Laikmačio komponentas su atgaline skaičiuote
 */
class Timer extends GameObject {
    constructor(scene, x, y, config = {}) {
        super(scene, config);
        this.x = x;
        this.y = y;
        this.duration = config.duration || 60;
        this.timeLeft = this.duration;
        this.onTick = config.onTick || null;
        this.onComplete = config.onComplete || null;
        this.onWarning = config.onWarning || null;
        this.warningThreshold = config.warningThreshold || 10;
        this.showIcon = config.showIcon !== false;
        this.style = {
            fontSize: config.fontSize || '24px',
            color: config.color || '#2c3e50',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            ...config.style
        };
        this.text = null;
        this.event = null;
        this.isRunning = false;
    }
    
    create() {
        const displayText = this.showIcon ? `⏱️ ${this.format()}` : this.format();
        this.text = this.scene.add.text(this.x, this.y, displayText, this.style)
            .setOrigin(0.5);
        this.addElement(this.text);
        
        return this;
    }
    
    start() {
        if (this.isRunning) return this;
        
        this.isRunning = true;
        this.event = this.scene.addTimer({
            delay: 1000,
            callback: () => this.tick(),
            loop: true
        });
        
        return this;
    }
    
    tick() {
        this.timeLeft--;
        this.updateDisplay();
        
        if (this.timeLeft === this.warningThreshold && this.onWarning) {
            this.onWarning(this.timeLeft);
        }
        
        if (this.onTick) {
            this.onTick(this.timeLeft);
        }
        
        if (this.timeLeft <= 0) {
            this.stop();
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }
    
    format() {
        if (this.timeLeft < 60) {
            return `${this.timeLeft}s`;
        }
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        if (this.text) {
            const displayText = this.showIcon ? `⏱️ ${this.format()}` : this.format();
            this.text.setText(displayText);
            
            if (this.timeLeft <= this.warningThreshold) {
                this.text.setColor('#e74c3c');
            }
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.event) {
            this.event.remove();
            this.event = null;
        }
        return this;
    }
    
    pause() {
        if (this.event) {
            this.event.paused = true;
        }
        return this;
    }
    
    resume() {
        if (this.event) {
            this.event.paused = false;
        }
        return this;
    }
    
    reset() {
        this.timeLeft = this.duration;
        this.updateDisplay();
        return this;
    }
    
    addTime(seconds) {
        this.timeLeft += seconds;
        this.updateDisplay();
        return this;
    }
}

/**
 * Pranešimų (notification) sistema
 * Statinė klasė greito pranešimų rodymo
 */
class Notification {
    static show(scene, message, type = 'info', duration = 2000) {
        const centerX = scene.scale.width / 2;
        const centerY = scene.scale.height / 2;
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };
        
        const color = colors[type] || colors.info;
        const colorHex = parseInt(color.replace('#', '0x'));
        
        const bg = scene.add.rectangle(centerX, centerY - 100, 400, 80, 0xffffff, 0.95)
            .setStrokeStyle(3, colorHex)
            .setDepth(2000);
        
        const text = scene.add.text(centerX, centerY - 100, message, {
            fontSize: '20px',
            color: color,
            fontFamily: 'Georgia',
            align: 'center',
            wordWrap: { width: 360 }
        }).setOrigin(0.5).setDepth(2001);
        
        bg.setAlpha(0);
        text.setAlpha(0);
        
        scene.addTween({
            targets: [bg, text],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        scene.addTimer({
            delay: duration,
            callback: () => {
                scene.addTween({
                    targets: [bg, text],
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        if (bg && bg.scene) bg.destroy();
                        if (text && text.scene) text.destroy();
                    }
                });
            }
        });
    }
}

// ========================================
// FONO KOMPONENTAI
// ========================================

/**
 * Gradiento fono komponentas
 */
class GradientBackground extends GameObject {
    constructor(scene, topColor, bottomColor, options = {}) {
        super(scene, { container: options.container ?? scene.layers?.bg });
        this.topColor = topColor;
        this.bottomColor = bottomColor;
    }
    
    create() {
        const graphics = this.scene.add.graphics();
        const top = parseInt(this.topColor.replace('#', '0x'));
        const bottom = parseInt(this.bottomColor.replace('#', '0x'));
        
        graphics.fillGradientStyle(top, top, bottom, bottom, 1);
        graphics.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        graphics.setDepth(-100);
        
        this.addElement(graphics);
        return this;
    }
}

/**
 * Dalelių sistema fono dekoracijai
 */
class ParticleSystem extends GameObject {
    constructor(scene, options = {}) {
        super(scene, { container: options.container ?? scene.layers?.bg });
        this.count = options.count || 15;
        this.icon = options.icon || 'dna';
        this.sizeRange = options.sizeRange || [20, 40];
        this.alpha = options.alpha || 0.15;
    }
    
    create() {
        if (!this.scene.textures.exists(this.icon)) {
            return this;
        }
        
        for (let i = 0; i < this.count; i++) {
            const x = Phaser.Math.Between(0, this.scene.scale.width);
            const y = Phaser.Math.Between(0, this.scene.scale.height);
            const size = Phaser.Math.Between(this.sizeRange[0], this.sizeRange[1]);
            
            const particle = this.scene.add.image(x, y, this.icon)
                .setScale(size / 50)
                .setAlpha(this.alpha)
                .setDepth(-50);
            
            this.addElement(particle);
            
            this.scene.addTween({
                targets: particle,
                y: y + Phaser.Math.Between(-100, 100),
                x: x + Phaser.Math.Between(-50, 50),
                duration: Phaser.Math.Between(10000, 20000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            this.scene.addTween({
                targets: particle,
                angle: 360,
                duration: Phaser.Math.Between(15000, 25000),
                repeat: -1
            });
        }
        
        return this;
    }
}

// ========================================
// ANIMACIJOS PAGALBININKAI
// ========================================

/**
 * Tween animacijų pagalbininkai
 */
class TweenHelper {
    static fadeIn(scene, targets, duration = 200, delay = 0) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                target.setAlpha(0);
                scene.addTween({
                    targets: target,
                    alpha: 1,
                    duration: duration,
                    delay: delay
                });
            }
        });
    }
    
    static fadeOut(scene, targets, duration = 200, onComplete = null) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                scene.addTween({
                    targets: target,
                    alpha: 0,
                    duration: duration,
                    onComplete: () => {
                        if (target.destroy) target.destroy();
                        if (onComplete) onComplete();
                    }
                });
            }
        });
    }
    
    static slideIn(scene, targets, direction = 'left', duration = 400, delay = 0) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                const originalX = target.x;
                const offset = direction === 'left' ? -600 : 600;
                target.setX(originalX + offset);
                
                scene.addTween({
                    targets: target,
                    x: originalX,
                    duration: duration,
                    delay: delay,
                    ease: 'Back.easeOut'
                });
            }
        });
    }
    
    static pulse(scene, targets, scale = 1.1, duration = 2000) {
        scene.addTween({
            targets: targets,
            scale: scale,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    static rotate(scene, targets, duration = 20000) {
        scene.addTween({
            targets: targets,
            angle: 360,
            duration: duration,
            repeat: -1
        });
    }
    
    static scaleUp(scene, targets, scale = 1.15, duration = 100) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                scene.addTween({
                    targets: target,
                    scale: scale,
                    duration: duration,
                    ease: 'Back.easeOut'
                });
            }
        });
    }
    
    static bounce(scene, targets, scale = 1.2, duration = 150) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                scene.addTween({
                    targets: target,
                    scale: scale,
                    duration: duration,
                    yoyo: true,
                    ease: 'Bounce.easeOut'
                });
            }
        });
    }
    
    static slideInXY(scene, targets, targetX, targetY, duration = 400, delay = 0) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                scene.addTween({
                    targets: target,
                    x: targetX,
                    y: targetY,
                    alpha: 1,
                    duration: duration,
                    delay: delay,
                    ease: 'Back.easeOut'
                });
            }
        });
    }
}

/**
 * Vizualiniai efektai
 */
class Effects {
    static createStarBurst(scene, x, y, count = 8, color = '#f39c12') {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 40;
            
            const star = scene.add.text(x, y, '✦', {
                fontSize: '20px',
                color: color
            }).setOrigin(0.5);
            
            scene.addTween({
                targets: star,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                    try {
                        if (star && star.active && star.scene) {
                            star.destroy();
                        }
                    } catch (e) {
                        // Tylus fail
                    }
                }
            });
        }
    }
    
    static createShake(scene, targets, intensity = 5, duration = 300) {
        const targetsArray = Array.isArray(targets) ? targets : [targets];
        targetsArray.forEach(target => {
            if (target) {
                const originalX = target.x;
                const originalY = target.y;
                
                scene.addTween({
                    targets: target,
                    x: originalX + Phaser.Math.Between(-intensity, intensity),
                    y: originalY + Phaser.Math.Between(-intensity, intensity),
                    duration: 50,
                    yoyo: true,
                    repeat: duration / 100,
                    onComplete: () => {
                        if (target) target.setPosition(originalX, originalY);
                    }
                });
            }
        });
    }
    
    static starBurst(scene, x, y, options = {}) {
        const count = options.count || 8;
        const color = options.color || '#f39c12';
        const distance = options.distance || 40;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            
            const star = scene.add.text(x, y, '✦', {
                fontSize: '20px',
                color: color
            }).setOrigin(0.5);
            
            scene.addTween({
                targets: star,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                    if (star) star.destroy();
                }
            });
        }
    }
}

// ========================================
// ŽAIDIMO LOGIKOS MODULIAI
// ========================================

/**
 * Sekų suderinimo žaidimo logika
 * Naudojama kodonų atpažinimo žaidimuose
 */
class SequenceMatching {
    constructor(config) {
        this.config = config;
        this.sequence = [];
        this.targetPositions = [];
        this.currentItem = null;
    }
    
    generateSequence(bases, length) {
        this.sequence = [];
        for (let i = 0; i < length; i++) {
            this.sequence.push(bases[Phaser.Math.Between(0, bases.length - 1)]);
        }
        return this.sequence;
    }
    
    insertTargets(targetKey, itemSize, count) {
        this.targetPositions = [];
        
        for (let i = 0; i < count; i++) {
            const pos = Phaser.Math.Between(0, this.sequence.length - itemSize);
            
            for (let j = 0; j < itemSize; j++) {
                this.sequence[pos + j] = targetKey[j];
            }
            
            this.targetPositions.push(pos);
        }
        
        return this.targetPositions;
    }
    
    checkMatch(position, targetKey) {
        const itemSize = targetKey.length;
        if (position + itemSize > this.sequence.length) {
            return false;
        }
        const selectedSequence = this.sequence.slice(position, position + itemSize).join('');
        return selectedSequence === targetKey;
    }
    
    getTargetCount() {
        return this.targetPositions.length;
    }
    
    getSequence() {
        return this.sequence;
    }
}

/**
 * Klasifikacijos žaidimo logika
 * Naudojama amino rūgščių klasifikavimo žaidimuose
 */
class Classification {
    constructor(config) {
        this.config = config;
        this.items = [];
        this.groups = config.groups;
    }
    
    getItemGroup(itemValue) {
        for (const [groupKey, groupData] of Object.entries(this.groups)) {
            if (groupData.members && groupData.members.includes(itemValue)) {
                return groupKey;
            }
        }
        return null;
    }
    
    checkClassification(item, selectedGroup) {
        const correctGroup = this.getItemGroup(item.value);
        return correctGroup === selectedGroup;
    }
}

/**
 * Taškų valdymo sistema
 */
class ScoreManager {
    constructor(config = {}) {
        this.correct = 0;
        this.incorrect = 0;
        this.total = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.bonusMultiplier = config.bonusMultiplier || 1.5;
        this.pointsPerCorrect = config.pointsPerCorrect || 10;
    }
    
    addCorrect() {
        this.correct++;
        this.total++;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
    }
    
    addIncorrect() {
        this.incorrect++;
        this.total++;
        this.streak = 0;
    }
    
    getScore() {
        let base = this.correct * this.pointsPerCorrect;
        let bonus = this.maxStreak >= 5 
            ? Math.floor(this.maxStreak * this.bonusMultiplier) 
            : 0;
        return base + bonus;
    }
    
    getAccuracy() {
        return this.total > 0 
            ? (this.correct / this.total * 100).toFixed(1) 
            : 0;
    }
    
    getStats() {
        return {
            correct: this.correct,
            incorrect: this.incorrect,
            total: this.total,
            streak: this.streak,
            maxStreak: this.maxStreak,
            score: this.getScore(),
            accuracy: this.getAccuracy()
        };
    }
    
    reset() {
        this.correct = 0;
        this.incorrect = 0;
        this.total = 0;
        this.streak = 0;
        this.maxStreak = 0;
    }
}

// ========================================
// PAGALBINIAI ĮRANKIAI
// ========================================

/**
 * Duomenų apdorojimo įrankiai
 */
class DataProcessor {
    static getFilteredItems(items, groups, selectedGroups) {
        const filtered = [];
        
        Object.entries(items).forEach(([key, value]) => {
            const group = this.getItemGroup(value, groups);
            if (selectedGroups.includes(group)) {
                filtered.push({ key, value });
            }
        });
        
        return filtered;
    }
    
    static getItemGroup(itemValue, groups) {
        for (const [groupKey, groupData] of Object.entries(groups)) {
            if (groupData.members && groupData.members.includes(itemValue)) {
                return groupKey;
            }
        }
        return null;
    }
}

/**
 * Konfigūracijos įkėlėjas
 */
class ConfigLoader {
    static async load(path) {
        try {
            const response = await fetch(path);
            return await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
            return null;
        }
    }
    
    static validate(config) {
        const required = ['meta', 'gameplay', 'items', 'groups'];
        return required.every(key => config.hasOwnProperty(key));
    }
}

/**
 * Išteklių įkėlėjas
 */
class AssetLoader {
    static preloadFromConfig(scene, config) {
        if (config.assets?.images) {
            Object.entries(config.assets.images).forEach(([key, path]) => {
                if (!scene.textures.exists(key)) {
                    scene.load.image(key, path);
                }
            });
        }
    }
}

// ========================================
// EKSPORTAS
// ========================================

export const BioPhaser = {
    Engine,
    BioScene,
    GameObject,
    
    UI: {
        Button,
        Card,
        ProgressBar,
        Modal,
        Badge,
        Timer,
        Notification,
        Table
    },
    
    Background: {
        Gradient: GradientBackground,
        Particles: ParticleSystem
    },
    
    Animation: {
        Tween: TweenHelper,
        Effects
    },
    
    Gameplay: {
        SequenceMatching,
        Classification,
        ScoreManager
    },
    
    Utils: {
        DataProcessor,
        ConfigLoader,
        AssetLoader
    }
};