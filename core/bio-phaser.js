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
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.NO_CENTER
            },
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
        // Pirmiausia įvykdomos visos rankiniu būdu užregistruotos valymo funkcijos,
        // o tik po to naikinami komponentai. Taip išvengiama nutekėjimų ir kabančių įvykių.
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
        // Šis metodas naudojamas, kai scena lieka ta pati,
        // tačiau reikia pilnai perpiešti jos laikiną vartotojo sąsajos būseną.
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
        
        // Jei komponentas turi konteinerį, visi jo elementai automatiškai keliauja į jį.
        // Taip vienas komponentas gali būti valdomas kaip vientisas blokas.
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
        // Mygtukas realizuotas kaip tekstinis Phaser objektas,
        // todėl jo stilių galima lanksčiai keisti tiesiog per tekstines savybes.
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
        
        // Laikmatis remiasi scenos laiko sistema,
        // todėl automatiškai sinchronizuojasi su Phaser ciklu ir scenos pauzėmis.
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
        // Pranešimas kuriamas trumpalaikiai ir nėra registruojamas kaip pilnas komponentas,
        // nes jo gyvavimo ciklą pilnai valdo dvi nuoseklios animacijos.
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

/**
 * Foninių burbuliukų ir dekoracijų helperis
 */
const Decor = {
    renderBubbles(scene, options = {}) {
        // Fono fazė saugoma globaliau žaidimo objekte, kad pereinant tarp scenų
        // dekoracijos neatrodytų staiga „persikrovusios“ ir judėtų tolygiai.
        const layer = options.layer ?? scene.layers?.background ?? scene.layers?.uiPersistent;
        const W     = options.width  ?? scene.scale.width;
        const H     = options.height ?? scene.scale.height;
        const phaseOrigin = scene.game.__bioPhaserBgPhaseOrigin ??= performance.now();
        const now = performance.now();

        const COLORS = [0x4ADE80, 0xF472B6, 0xFB7185, 0xFBBF24, 0x60A5FA, 0xA78BFA];

        const getYoyoState = (duration) => {
            const cycle = duration * 2;
            const elapsed = ((now - phaseOrigin) % cycle + cycle) % cycle;
            const forward = elapsed < duration;
            const progress = forward ? elapsed / duration : 1 - ((elapsed - duration) / duration);
            const remaining = forward ? duration - elapsed : cycle - elapsed;
            return { forward, progress, remaining: Math.max(1, remaining) };
        };

        const addBubble = ({ x, y, radius, color, alpha, dx, dy, duration }) => {
            const drift = getYoyoState(duration);
            const bubble = scene.add.circle(x, y, radius, color, alpha);
            bubble.setPosition(x + dx * drift.progress, y + dy * drift.progress);
            if (layer) layer.add(bubble);

            const pulseDur = radius >= 38 ? 3600 : radius >= 20 ? 3000 : 2400;
            const pulse = getYoyoState(pulseDur);
            const pulseScale = 1 + 0.06 * pulse.progress;
            bubble.setScale(pulseScale);

            scene.addTween({
                targets: bubble,
                x: drift.forward ? x + dx : x,
                y: drift.forward ? y + dy : y,
                duration: drift.remaining,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            scene.addTween({
                targets: bubble,
                scaleX: pulse.forward ? 1.06 : 1,
                scaleY: pulse.forward ? 1.06 : 1,
                duration: pulse.remaining,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        };

        if (scene.textures.exists('particlesDecor')) {
            const addDecor = ({ x, y, scale, alpha, angle, dx, dy, rotateBy, pulseBy, duration }) => {
                const drift = getYoyoState(duration);
                const rot = getYoyoState(duration + 3500);
                const pulse = getYoyoState(duration - 800);
                const decor = scene.add.image(x, y, 'particlesDecor').setScale(scale).setAlpha(alpha).setAngle(angle);
                decor.setPosition(x + dx * drift.progress, y + dy * drift.progress);
                decor.setAngle(angle + rotateBy * rot.progress);
                decor.setScale(scale + pulseBy * pulse.progress);
                if (layer) layer.add(decor);
                scene.addTween({
                    targets: decor,
                    x: drift.forward ? x + dx : x,
                    y: drift.forward ? y + dy : y,
                    duration: drift.remaining,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                scene.addTween({
                    targets: decor,
                    angle: rot.forward ? angle + rotateBy : angle,
                    duration: rot.remaining,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                scene.addTween({
                    targets: decor,
                    scale: pulse.forward ? scale + pulseBy : scale,
                    duration: pulse.remaining,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            };
            addDecor({ x: W * 0.858, y: H * 0.739, scale: 0.86, alpha: 0.24, angle:   8, dx: -14, dy: -18, rotateBy:  12, pulseBy: 0.04, duration: 7600 });
            addDecor({ x: W * 0.208, y: H * 0.783, scale: 0.58, alpha: 0.18, angle: -14, dx:  12, dy: -14, rotateBy: -10, pulseBy: 0.04, duration: 6500 });
            addDecor({ x: W * 0.267, y: H * 0.244, scale: 0.34, alpha: 0.10, angle:  18, dx:  10, dy:   8, rotateBy:  16, pulseBy: 0.03, duration: 4800 });
            addDecor({ x: W * 0.792, y: H * 0.272, scale: 0.38, alpha: 0.11, angle: -10, dx: -10, dy:  10, rotateBy: -14, pulseBy: 0.03, duration: 5400 });
        }

        addBubble({ x: W*0.133, y: H*0.839, radius: 44, color: COLORS[0], alpha: 0.14, dx:  18, dy: -18, duration: 4400 });
        addBubble({ x: W*0.238, y: H*0.750, radius: 22, color: COLORS[4], alpha: 0.22, dx: -12, dy:  18, duration: 3000 });
        addBubble({ x: W*0.163, y: H*0.900, radius: 13, color: COLORS[1], alpha: 0.28, dx:  14, dy: -12, duration: 2400 });
        addBubble({ x: W*0.288, y: H*0.828, radius: 34, color: COLORS[3], alpha: 0.16, dx: -18, dy: -16, duration: 3600 });
        addBubble({ x: W*0.123, y: H*0.706, radius: 18, color: COLORS[5], alpha: 0.24, dx:  12, dy:  18, duration: 2800 });
        addBubble({ x: W*0.263, y: H*0.906, radius: 11, color: COLORS[2], alpha: 0.28, dx:  -8, dy: -16, duration: 2200 });

        addBubble({ x: W*0.871, y: H*0.798, radius: 50, color: COLORS[4], alpha: 0.13, dx: -18, dy: -16, duration: 4800 });
        addBubble({ x: W*0.729, y: H*0.720, radius: 20, color: COLORS[0], alpha: 0.22, dx:  14, dy:  18, duration: 3000 });
        addBubble({ x: W*0.804, y: H*0.894, radius: 15, color: COLORS[3], alpha: 0.26, dx: -14, dy: -10, duration: 2500 });
        addBubble({ x: W*0.882, y: H*0.687, radius: 28, color: COLORS[5], alpha: 0.18, dx:  16, dy:  14, duration: 3500 });
        addBubble({ x: W*0.707, y: H*0.853, radius: 12, color: COLORS[1], alpha: 0.28, dx: -12, dy: -18, duration: 2300 });
        addBubble({ x: W*0.838, y: H*0.920, radius: 38, color: COLORS[2], alpha: 0.14, dx: -20, dy: -14, duration: 4200 });

        addBubble({ x: W*0.215, y: H*0.176, radius: 24, color: COLORS[3], alpha: 0.20, dx:  14, dy:  12, duration: 3200 });
        addBubble({ x: W*0.768, y: H*0.220, radius: 18, color: COLORS[0], alpha: 0.22, dx: -16, dy:  14, duration: 2800 });
        addBubble({ x: W*0.415, y: H*0.142, radius: 13, color: COLORS[5], alpha: 0.26, dx:  12, dy: -10, duration: 2400 });
        addBubble({ x: W*0.627, y: H*0.247, radius: 20, color: COLORS[1], alpha: 0.20, dx: -14, dy:  16, duration: 2900 });
    }
};

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

// Navigacija palikta framework lygyje, kad visos scenos naudotų tą patį perėjimo mechanizmą.
function navigateTo(url) {
    if (typeof window !== 'undefined' && typeof window.__bioPhaserNavigate === 'function') {
        window.__bioPhaserNavigate(url);
        return;
    }
    if (typeof window !== 'undefined') {
        window.location.href = url;
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
        
        // Tiksliniai fragmentai įterpiami tiesiai į sugeneruotą seką,
        // todėl vėliau galima tiksliai žinoti visas jų pradžios pozicijas.
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
        // Galutinis balas susideda iš bazinių taškų ir serijos premijos,
        // todėl skatinamas ne tik tikslumas, bet ir nuoseklus teisingų atsakymų srautas.
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
        
        // Filtravimas atskirtas į bendrą utilitą,
        // kad skirtingi žaidimai tą pačią grupavimo logiką naudotų vienodai.
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
        // Ištekliai kraunami tik tada, jei tekstūra dar neegzistuoja.
        // Tai sumažina pakartotinį tų pačių paveikslėlių įkėlimą tarp scenų.
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
// UI PAGALBININKAI
// ========================================

const Helpers = {
    createButton(scene, options = {}) {
        const {
            x,
            y,
            width = 180,
            height = 44,
            text,
            variant = 'primary',
            container = null,
            onClick = null,
            fontFamily = 'Inter, Arial, sans-serif',
            fontSize = '16px'
        } = options;

        const variants = {
            primary:   { fill: 0x16A34A, hoverFill: 0x15803D, textColor: '#ffffff' },
            secondary: { fill: 0xEAF2FB, hoverFill: 0xDCE8F5, textColor: '#102033' },
            utility:   { fill: 0x2563EB, hoverFill: 0x1D4ED8, textColor: '#ffffff' },
            danger:    { fill: 0xEF4444, hoverFill: 0xDC2626, textColor: '#ffffff' }
        };

        const style = variants[variant] || variants.primary;

        const bg = scene.add.rectangle(x, y, width, height, style.fill)
            .setInteractive({ useHandCursor: true });

        const label = scene.add.text(x, y, text, {
            fontFamily,
            fontSize,
            color: style.textColor
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(style.hoverFill));
        bg.on('pointerout', () => bg.setFillStyle(style.fill));
        if (onClick) {
            bg.on('pointerdown', onClick);
        }

        if (container) {
            container.add([bg, label]);
        }

        return {
            container,
            bg,
            label,
            setText(newText) { label.setText(newText); },
            setEnabled(enabled) {
                if (enabled) {
                    bg.setInteractive({ useHandCursor: true });
                    bg.setFillStyle(style.fill);
                    label.setAlpha(1);
                } else {
                    bg.disableInteractive();
                    bg.setFillStyle(style.fill);
                    label.setAlpha(0.4);
                }
            },
            destroy() {
                bg.destroy();
                label.destroy();
            }
        };
    },

    // Standartizuotas panelės generatorius leidžia skirtingiems žaidimams
    // naudoti vienodą kortelių geometriją ir kontūrų stilių.
    createPanel(scene, options = {}) {
        const {
            x,
            y,
            width,
            height,
            fill = 0xffffff,
            alpha = 0.96,
            stroke = 0xD7E7F7,
            strokeWidth = 1,
            container = null
        } = options;

        const rect = scene.add.rectangle(x, y, width, height, fill, alpha)
            .setStrokeStyle(strokeWidth, stroke);

        if (container) {
            container.add(rect);
        }

        return rect;
    },

    createChoiceCard(scene, options = {}) {
        const {
            x,
            y,
            width = 260,
            height = 90,
            title,
            subtitle = '',
            selected = false,
            accent = 0x2563EB,
            container = null,
            onClick = null,
            fontFamily = 'Inter, Arial, sans-serif'
        } = options;

        const bgFill      = selected ? 0xEFF6FF : 0xF8FAFC;
        const bgHoverFill = selected ? 0xDBEAFE : 0xF1F5F9;

        const bg = scene.add.rectangle(x, y, width, height, bgFill)
            .setInteractive({ useHandCursor: true });

        const accentBar = scene.add.rectangle(
            x - width / 2 + 3, y, 6, height - 8, accent
        );

        const titleText = scene.add.text(
            x - width / 2 + 18,
            y - (subtitle ? 14 : 0),
            title,
            { fontFamily, fontSize: '15px', color: '#0F172A', fontStyle: 'bold' }
        ).setOrigin(0, 0.5);

        const subtitleText = subtitle
            ? scene.add.text(
                x - width / 2 + 18, y + 14,
                subtitle,
                { fontFamily, fontSize: '12px', color: '#64748B' }
              ).setOrigin(0, 0.5)
            : null;

        const accentHex = '#' + accent.toString(16).padStart(6, '0');
        const checkText = selected
            ? scene.add.text(
                x + width / 2 - 18, y, '✓',
                { fontFamily, fontSize: '16px', color: accentHex }
              ).setOrigin(0.5)
            : null;

        bg.on('pointerover', () => bg.setFillStyle(bgHoverFill));
        bg.on('pointerout',  () => bg.setFillStyle(bgFill));
        if (onClick) {
            bg.on('pointerdown', onClick);
        }

        const elements = [bg, accentBar, titleText];
        if (subtitleText) elements.push(subtitleText);
        if (checkText)    elements.push(checkText);

        if (container) {
            container.add(elements);
        }

        return {
            container,
            bg,
            title: titleText,
            subtitle: subtitleText,
            destroy() {
                elements.forEach(el => { if (el) el.destroy(); });
            }
        };
    },

    // ------------------------------------------------------------------
    // Modernūs mygtukai su šešėliu, hover scale ir enable/disable
    // ------------------------------------------------------------------
    addModernButton(scene, x, y, label, options = {}) {
        const {
            width = 180, height = 48, variant = 'primary',
            disabled = false, container = null, fontSize = '17px'
        } = options;

        // Visi mygtukų variantai aprašomi vienoje vietoje,
        // todėl pakeitus spalvinę sistemą ji automatiškai atsinaujina visame projekte.
        const styles = {
            primary:   { bg: Theme.colors.primary,    hover: Theme.colors.primaryHover, text: '#FFFFFF', stroke: parseInt(Theme.colors.primary.replace('#', '0x'))  },
            secondary: { bg: '#F1F5F9',               hover: '#E2E8F0',                 text: Theme.colors.text, stroke: 0xD8E2EC },
            info:      { bg: '#E0F2FE',               hover: '#BAE6FD',                 text: '#0369A1', stroke: 0x7DD3FC },
            ghost:     { bg: '#FFFFFF',               hover: '#F8FAFC',                 text: Theme.colors.muted, stroke: 0xD8E2EC },
            danger:    { bg: Theme.colors.danger,     hover: '#DC2626',                 text: '#FFFFFF', stroke: parseInt(Theme.colors.danger.replace('#', '0x'))   },
            warning:   { bg: Theme.colors.warning,    hover: '#D97706',                 text: '#FFFFFF', stroke: parseInt(Theme.colors.warning.replace('#', '0x'))  }
        };

        const layer = container ?? scene.layers.ui;
        let isDisabled = disabled;
        let clickHandler = null;

        const group  = scene.add.container(x, y);
        layer.add(group);

        const shadow = scene.add.rectangle(3, 4, width, height, 0x000000, 0.08);
        const bg     = scene.add.rectangle(0, 0, width, height, 0xFFFFFF, 1);
        const text   = scene.add.text(0, 0, label, {
            fontFamily: Theme.font, fontSize, fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        group.add([shadow, bg, text]);
        group.setSize(width, height);

        const getStyle = () => {
            if (isDisabled) return { bg: '#94A3B8', hover: '#94A3B8', text: '#FFFFFF', stroke: 0x94A3B8 };
            return styles[variant] ?? styles.primary;
        };

        const applyNormal = () => {
            const s = getStyle();
            bg.setFillStyle(parseInt(s.bg.replace('#', '0x')), 1);
            bg.setStrokeStyle(1.5, s.stroke);
            text.setColor(s.text);
        };

        const applyHover = () => {
            const s = getStyle();
            bg.setFillStyle(parseInt(s.hover.replace('#', '0x')), 1);
        };

        applyNormal();
        bg.setInteractive({ useHandCursor: !isDisabled });

        bg.on('pointerover', () => {
            if (isDisabled) return;
            applyHover();
            scene.addTween({ targets: group, scale: 1.03, duration: 120, ease: 'Sine.easeOut' });
        });
        bg.on('pointerout', () => {
            if (isDisabled) return;
            applyNormal();
            scene.addTween({ targets: group, scale: 1, duration: 120, ease: 'Sine.easeOut' });
        });
        bg.on('pointerdown', () => {
            if (!isDisabled && clickHandler) clickHandler();
        });

        if (isDisabled) group.setAlpha(0.6);

        return {
            group, bg, text,
            element: group,
            onClick:  (cb) => { clickHandler = cb; },
            enable:   () => { isDisabled = false;  group.setAlpha(1);   bg.setInteractive({ useHandCursor: true }); applyNormal(); },
            disable:  () => { isDisabled = true;   group.setAlpha(0.6); bg.disableInteractive(); applyNormal(); },
            destroy:  () => group.destroy()
        };
    },

    // ------------------------------------------------------------------
    // Pasirinkimo eilutė su accent juosta, badge ir hover animacija
    // ------------------------------------------------------------------
    addSelectionRow(scene, x, y, options = {}) {
        const {
            width = 760, height = 74,
            title, subtitle,
            color = Theme.colors.primary,
            selected = false,
            badge = null,
            container = null
        } = options;

        const layer       = container ?? scene.layers.ui;
        const group       = scene.add.container(x, y);
        layer.add(group);

        // Pasirinkimo eilutė sukurta kaip bendras šablonas sudėtingesniems nustatymų ekranams,
        // kur vienoje vietoje reikia pavadinimo, aprašymo ir pasirinkimo būsenos.
        const colorInt    = parseInt(color.replace('#', '0x'));
        const bgColor     = selected ? 0xECFDF5 : 0xFFFFFF;
        const strokeColor = selected ? parseInt(Theme.colors.primary.replace('#', '0x')) : 0xD8E2EC;

        const shadow      = scene.add.rectangle(4, 5, width, height, 0x000000, 0.055);
        const bg          = scene.add.rectangle(0, 0, width, height, bgColor, 1)
            .setStrokeStyle(selected ? 2.5 : 1.5, strokeColor);
        const accent      = scene.add.rectangle(-width / 2 + 6, 0, 8, height - 14, colorInt, 1);

        const titleText   = scene.add.text(-width / 2 + 44, -13, title, {
            fontFamily: Theme.font, fontSize: '19px', fontStyle: 'bold', color: Theme.colors.text
        }).setOrigin(0, 0.5);

        const subText     = scene.add.text(-width / 2 + 44, 15, subtitle, {
            fontFamily: Theme.font, fontSize: '13px', color: Theme.colors.muted,
            wordWrap: { width: width - 220 }
        }).setOrigin(0, 0.5);

        group.add([shadow, bg, accent, titleText, subText]);

        if (badge) {
            const badgeBgColor = selected ? colorInt : 0xF8FAFC;
            const badgeStroke  = selected ? colorInt : 0xD8E2EC;
            const badgeAlpha   = selected ? 0.15 : 1;
            const badgeTextCol = selected ? color : Theme.colors.muted;

            const badgeBg   = scene.add.rectangle(width / 2 - 80, 0, 130, 28, badgeBgColor, badgeAlpha)
                .setStrokeStyle(1, badgeStroke);
            const badgeText = scene.add.text(width / 2 - 80, 0, badge, {
                fontFamily: Theme.font, fontSize: '12px', fontStyle: 'bold', color: badgeTextCol
            }).setOrigin(0.5);
            group.add([badgeBg, badgeText]);
        }

        group.setSize(width, height);
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
            if (!selected) bg.setFillStyle(0xF8FAFC, 1);
            scene.addTween({ targets: group, scale: 1.015, duration: 120, ease: 'Sine.easeOut' });
        });
        bg.on('pointerout', () => {
            if (!selected) bg.setFillStyle(bgColor, 1);
            scene.addTween({ targets: group, scale: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        return {
            group,
            bg,
            onClick: (cb) => bg.on('pointerdown', cb),
            destroy: () => group.destroy()
        };
    },

    // ------------------------------------------------------------------
    // Meniu mygtukas viršuje kairėje (visose scenose vienodas)
    // ------------------------------------------------------------------
    addMenuButton(scene, { x = 70, y = 34, label = '← Meniu', url = 'index.html' } = {}) {
        const btn = this.addModernButton(scene, x, y, label, {
            width: 120, height: 36, variant: 'primary',
            container: scene.layers.uiPersistent, fontSize: '14px'
        });
        btn.onClick(() => { navigateTo(url); });
    },

    // ------------------------------------------------------------------
    // Standartinis žaidimo fonas: gradientas + dalelės + burbuliukai
    // ------------------------------------------------------------------
    createStandardBackground(scene, options = {}) {
        scene.addComponent(
            new GradientBackground(scene, Theme.colors.bgTop, Theme.colors.bgBottom).create()
        );
        if (options.particles !== false) {
            scene.addComponent(
                new ParticleSystem(scene, {
                    count: options.particleCount ?? 2,
                    icon: 'dna',
                    sizeRange: [12, 22],
                    alpha: 0.015
                })
            ).create();
        }
        if (options.bubbles !== false) {
            Decor.renderBubbles(scene, {
                layer: scene.layers.bg ?? scene.layers.background ?? scene.layers.uiPersistent,
                width: scene.scale.width,
                height: scene.scale.height
            });
        }
    },

    // ------------------------------------------------------------------
    // Nukleotidų spalvos pagal bazę (A/T/U/G/C/-)
    // ------------------------------------------------------------------
    baseColor(base) {
        return Theme.baseColors[base] || Theme.colors.text;
    },

    // ------------------------------------------------------------------
    // Spalvota sekos tekstas su tarpais tarp bazių
    // ------------------------------------------------------------------
    addColoredSequenceText(scene, x, y, sequence, options = {}) {
        const {
            fontSize = 24, letterSpacing = 24,
            originX = 0.5, originY = 0.5,
            fontStyle = 'bold', container = null, layer = null
        } = options;

        const chars  = [];
        const totalW = (sequence.length - 1) * letterSpacing;

        sequence.split('').forEach((base, i) => {
            const tx = x - totalW / 2 + i * letterSpacing;
            const t  = scene.add.text(tx, y, base, {
                fontFamily: Theme.font,
                fontSize:   `${fontSize}px`,
                fontStyle,
                color: this.baseColor(base)
            }).setOrigin(originX, originY);

            if (container) {
                container.add(t);
            } else {
                const targetLayer = layer ?? scene.layers.ui;
                targetLayer.add(t);
            }
            chars.push(t);
        });

        return chars;
    }
};

// ========================================
// DIZAINO SISTEMA
// ========================================

const Theme = {
    // Dizaino sistema suvienodina tipografiją, bazines spalvas ir nukleotidų atvaizdavimą.
    font: 'Inter, Arial, sans-serif',

    colors: {
        bgTop:    '#F8FAFC',
        bgBottom: '#F1F5F9',

        text:     '#1F2937',
        muted:    '#64748B',
        softText: '#94A3B8',

        panel:       0xFFFFFF,
        panelStroke: 0xD8E2EC,

        primary:      '#10B981',
        primaryHover: '#059669',

        secondary:      '#F8FAFC',
        secondaryHover: '#E2E8F0',

        info:    '#38BDF8',
        warning: '#F59E0B',
        danger:  '#EF4444'
    },

    baseColors: {
        A: '#22C55E',
        T: '#38BDF8',
        U: '#38BDF8',
        G: '#F59E0B',
        C: '#A855F7',
        gap: '#94A3B8'
    },

    bubbleColors: [0x4ADE80, 0xF472B6, 0xFB7185, 0xFBBF24, 0x60A5FA, 0xA78BFA]
};

// ========================================
// MOTYVO PAIEŠKOS ALGORITMAI
// ========================================

/**
 * Bioinformatikos algoritmai motyvo paieškai l-merų pagrindu
 */
const MotifSearch = {
    getLmers(sequence, l) {
        const lmers = [];
        for (let i = 0; i <= sequence.length - l; i++) {
            lmers.push({ start: i, value: sequence.slice(i, i + l) });
        }
        return lmers;
    },

    computeConsensus(selectedLmers) {
        if (!selectedLmers.length) {
            return { consensus: '', score: 0, columnScores: [], columns: [] };
        }

        // Konsensusas sudaromas stulpeliais:
        // kiekvienoje pozicijoje pasirenkama dažniausiai pasikartojanti bazė.
        const l = selectedLmers[0].length;
        let consensus = '';
        let score = 0;
        const columnScores = [];
        const columns = [];

        for (let col = 0; col < l; col++) {
            const counts = {};
            selectedLmers.forEach((lmer) => {
                const base = lmer[col];
                counts[base] = (counts[base] || 0) + 1;
            });

            const sorted = Object.entries(counts).sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                return a[0].localeCompare(b[0]);
            });

            const [base, count] = sorted[0];
            consensus += base;
            score += count;
            columnScores.push(count);
            columns.push({ index: col, counts, consensusBase: base, score: count });
        }

        return { consensus, score, columnScores, columns };
    },

    randomDNA(length, alphabet = ['A', 'T', 'G', 'C']) {
        let s = '';
        for (let i = 0; i < length; i++) {
            s += Phaser.Utils.Array.GetRandom(alphabet);
        }
        return s;
    },

    generateRandomSequences(count, length, alphabet = ['A', 'T', 'G', 'C']) {
        return Array.from({ length: count }, () => this.randomDNA(length, alphabet));
    },

    _cartesianProduct(arrays) {
        // Kartesinė sandauga leidžia sugeneruoti visas galimas kombinacijas,
        // pasirenkant po vieną l-merą iš kiekvienos sekos.
        return arrays.reduce((acc, curr) => {
            const result = [];
            acc.forEach((a) => {
                curr.forEach((c) => {
                    result.push([...a, c]);
                });
            });
            return result;
        }, [[]]);
    },

    findOptimalMotif(sequences, l) {
        const lmerGroups   = sequences.map((seq) => this.getLmers(seq, l));
        const combinations = this._cartesianProduct(lmerGroups);
        let best = null;

        // Optimalus motyvas randamas pilna paieška:
        // įvertinamos visos kombinacijos ir paliekama ta, kurios konsensuso svoris didžiausias.
        combinations.forEach((combo) => {
            const values        = combo.map((item) => item.value);
            const consensusData = this.computeConsensus(values);
            if (!best || consensusData.score > best.score) {
                best = {
                    score:        consensusData.score,
                    consensus:    consensusData.consensus,
                    columnScores: consensusData.columnScores,
                    selected:     combo,
                    values
                };
            }
        });

        return best;
    }
};

// ========================================
// EKSPORTAS
// ========================================

export const BioPhaser = {
    Engine,
    BioScene,
    GameObject,
    Theme,

    UI: {
        Button,
        Card,
        ProgressBar,
        Modal,
        Badge,
        Timer,
        Notification,
        Table,
        Helpers
    },

    Background: {
        Gradient: GradientBackground,
        Particles: ParticleSystem,
        Decor
    },
    
    Animation: {
        Tween: TweenHelper,
        Effects
    },
    
    Gameplay: {
        SequenceMatching,
        Classification,
        ScoreManager,
        MotifSearch
    },
    
    Utils: {
        DataProcessor,
        ConfigLoader,
        AssetLoader
    }
};
