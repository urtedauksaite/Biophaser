import { BioPhaser } from '../core/bio-phaser.js';
import { Progress } from '../core/progress.js';

// Pagrindinio meniu modulis.
// Čia aprašomas žaidimų sąrašas ir pradinis ekranas,
// iš kurio vartotojas pereina į pasirinktą mokomąjį žaidimą.
const FONT = 'Inter, Arial, sans-serif';

const THEME = {
    text:    '#1F2937',
    muted:   '#64748B',
    primary: '#10B981'
};

const GAMES = [
    {
        key: 'amino',
        title: 'Aminorūgščių klasifikavimas',
        description: 'Atpažink savybes ir grupes.',
        accent: 0xF97316, soft: 0xFFF7ED,
        icon: 'dna', url: 'amino-acid-classification.html', displayType: 'fraction'
    },
    {
        key: 'codon',
        title: 'Kodonų žaidimas',
        description: 'Atpažink kodonus mRNR sekoje.',
        accent: 0x38BDF8, soft: 0xF0F9FF,
        icon: 'dna', url: 'codon-game.html', displayType: 'fraction'
    },
    {
        key: 'alignment',
        title: 'Sekų išlyginimas',
        description: 'Sulygink sekas ir vertink sutapimus.',
        accent: 0x10B981, soft: 0xECFDF5,
        icon: 'dna', url: 'sequence-alignment.html', displayType: 'score'
    },
    {
        key: 'lmer',
        title: 'Motyvo paieška',
        description: 'Rask geriausią l-merų rinkinį.',
        accent: 0x8B5CF6, soft: 0xF5F3FF,
        icon: 'dna', url: 'l-mer.html', displayType: 'fraction'
    }
];

const BUTTON_COLOR = 0x10B981;
const BUTTON_HOVER = 0x059669;
const CARD_FILL    = 0xFFFFFF;
const CARD_HOVER   = 0xF8FAFC;
const CARD_STROKE  = 0xD8E2EC;

const W  = 1200;
const H  = 900;
const CX = 600;

// Navigacija centralizuota vienoje vietoje, kad visi perėjimai tarp puslapių
// galėtų naudoti tą pačią animuotą logiką.
function navigateTo(url) {
    if (typeof window.__bioPhaserNavigate === 'function') {
        window.__bioPhaserNavigate(url);
        return;
    }
    window.location.href = url;
}

class MenuScene extends BioPhaser.BioScene {
    constructor() {
        super('MenuScene', {});
    }

    init(data) {
        super.init(data);
    }

    preload() {
        this.load.image('dna', 'assets/dna.png');
        this.load.image('particlesDecor', 'assets/particles.png');
    }

    create() {
        this.createLayers();

        this.addComponent(
            new BioPhaser.Background.Gradient(this, '#F8FAFC', '#F1F5F9').create()
        );

        this.addComponent(
            new BioPhaser.Background.Particles(this, {
                count: 3,
                icon: 'dna',
                sizeRange: [12, 22],
                alpha: 0.018
            })
        ).create();

        this.renderBackgroundDecor();
        this.renderHeader();
        this.renderGameCards();
    }

    // Dekoratyviniai elementai neša tik vizualinę funkciją:
    // jie suteikia meniu gyvumo, bet nedalyvauja žaidimo logikoje.
    renderBackgroundDecor() {
        const decorLayer = this.layers.background ?? this.layers.uiPersistent;

        const addFloatingDecor = ({ x, y, scale, alpha, angle, dx, dy, rotateBy, pulseBy, duration, pulseDuration }) => {
            const decor = this.add.image(x, y, 'particlesDecor')
                .setScale(scale)
                .setAlpha(alpha)
                .setAngle(angle);
            decorLayer.add(decor);
            this.addTween({ targets: decor, x: x + dx, y: y + dy, duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.addTween({ targets: decor, angle: angle + rotateBy, duration: duration + 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.addTween({ targets: decor, scale: scale + pulseBy, duration: pulseDuration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        };

        addFloatingDecor({ x: 1030, y: 665, scale: 0.86, alpha: 0.24, angle:   8, dx:  -14, dy: -18, rotateBy:  12, pulseBy: 0.04, duration: 7600, pulseDuration: 6000 });
        addFloatingDecor({ x:  250, y: 705, scale: 0.58, alpha: 0.18, angle: -14, dx:   12, dy: -14, rotateBy: -10, pulseBy: 0.04, duration: 6500, pulseDuration: 5600 });
        addFloatingDecor({ x:  320, y: 220, scale: 0.34, alpha: 0.10, angle:  18, dx:   10, dy:   8, rotateBy:  16, pulseBy: 0.03, duration: 4800, pulseDuration: 4400 });
        addFloatingDecor({ x: 1080, y: 190, scale: 0.38, alpha: 0.06, angle: -10, dx:  -10, dy:  10, rotateBy: -14, pulseBy: 0.03, duration: 5400, pulseDuration: 5000 });

        const addBubble = ({ x, y, radius, color, alpha, dx, dy, duration }) => {
            const bubble = this.add.circle(x, y, radius, color, alpha);
            decorLayer.add(bubble);
            this.addTween({ targets: bubble, x: x + dx, y: y + dy, duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            const pulseDuration = radius >= 38 ? 3600 : radius >= 20 ? 3000 : 2400;
            this.addTween({ targets: bubble, scaleX: 1.06, scaleY: 1.06, duration: pulseDuration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        };

        addBubble({ x: 160, y: 755, radius: 44, color: 0x4ADE80, alpha: 0.14, dx:  18, dy: -18, duration: 4400 });
        addBubble({ x: 285, y: 675, radius: 22, color: 0x60A5FA, alpha: 0.22, dx: -12, dy:  18, duration: 3000 });
        addBubble({ x: 195, y: 810, radius: 13, color: 0xF472B6, alpha: 0.28, dx:  14, dy: -12, duration: 2400 });
        addBubble({ x: 345, y: 745, radius: 34, color: 0xFBBF24, alpha: 0.16, dx: -18, dy: -16, duration: 3600 });
        addBubble({ x: 148, y: 635, radius: 18, color: 0xA78BFA, alpha: 0.24, dx:  12, dy:  18, duration: 2800 });
        addBubble({ x: 315, y: 815, radius: 11, color: 0xFB7185, alpha: 0.28, dx:  -8, dy: -16, duration: 2200 });

        addBubble({ x: 1045, y: 718, radius: 50, color: 0x60A5FA, alpha: 0.13, dx: -18, dy: -16, duration: 4800 });
        addBubble({ x:  875, y: 648, radius: 20, color: 0x4ADE80, alpha: 0.22, dx:  14, dy:  18, duration: 3000 });
        addBubble({ x:  965, y: 805, radius: 15, color: 0xFBBF24, alpha: 0.26, dx: -14, dy: -10, duration: 2500 });
        addBubble({ x: 1058, y: 618, radius: 28, color: 0xA78BFA, alpha: 0.18, dx:  16, dy:  14, duration: 3500 });
        addBubble({ x:  848, y: 768, radius: 12, color: 0xF472B6, alpha: 0.28, dx: -12, dy: -18, duration: 2300 });
        addBubble({ x: 1005, y: 828, radius: 38, color: 0xFB7185, alpha: 0.14, dx: -20, dy: -14, duration: 4200 });

        addBubble({ x: 258, y: 158, radius: 24, color: 0xFBBF24, alpha: 0.20, dx:  14, dy:  12, duration: 3200 });
        addBubble({ x: 922, y: 198, radius: 18, color: 0x4ADE80, alpha: 0.22, dx: -16, dy:  14, duration: 2800 });
        addBubble({ x: 498, y: 128, radius: 13, color: 0xA78BFA, alpha: 0.26, dx:  12, dy: -10, duration: 2400 });
        addBubble({ x: 752, y: 222, radius: 20, color: 0xF472B6, alpha: 0.20, dx: -14, dy:  16, duration: 2900 });
    }

    animateIn(target, delay = 0) {
        const origY     = target.y;
        const origAlpha = target.alpha;
        target.setAlpha(0).setY(origY + 12);
        this.tweens.add({
            targets: target,
            alpha: origAlpha,
            y: origY,
            duration: 600,
            delay,
            ease: 'Sine.easeOut'
        });
    }

    renderHeader() {
        const dna = this.add.image(CX, 120, 'dna')
            .setScale(0.085)
            .setOrigin(0.5)
            .setAlpha(0.7);
        this.layers.uiPersistent.add(dna);

        const title = this.add.text(CX, 180, 'BioPhaser', {
            fontSize: '46px',
            fontStyle: 'bold',
            fontFamily: FONT,
            color: THEME.text
        }).setOrigin(0.5);
        this.layers.uiPersistent.add(title);

        const subtitle = this.add.text(CX, 220, 'Interaktyvūs mokymosi žaidimai', {
            fontSize: '16px',
            fontFamily: FONT,
            color: THEME.muted
        }).setOrigin(0.5);
        this.layers.uiPersistent.add(subtitle);

        this.animateIn(dna,      0);
        this.animateIn(title,  120);
        this.animateIn(subtitle, 240);
    }

    renderGameCards() {
        const cardW = 540;
        const cardH = 160;
        const grid = [
            { x: 320, y: 345 },
            { x: 880, y: 345 },
            { x: 320, y: 535 },
            { x: 880, y: 535 }
        ];

        const label = this.add.text(CX, 250, 'Pasirink žaidimą', {
            fontSize: '13px',
            fontStyle: 'bold',
            fontFamily: FONT,
            color: THEME.primary
        }).setOrigin(0.5);
        this.layers.ui.add(label);
        this.animateIn(label, 320);

        GAMES.forEach((game, i) => {
            const pos = grid[i];
            if (!pos) return;
            this.createGameCard(game, pos.x, pos.y, cardW, cardH, i);
        });
    }

    // Viena kortelė apjungia žaidimo pavadinimą, progresą ir paleidimo mygtuką.
    // Toks modelis leidžia lengvai plėsti meniu naujais moduliais.
    createGameCard(game, x, y, w, h, index = 0) {
        const cardDelay = 100 + index * 120;
        const left = x - w / 2;
        const right = x + w / 2;
        const stripeW = 8;
        const accentX = left + stripeW / 2;
        const iconX = left + 82;
        const textX = left + 155;
        const buttonX = right - 105;
        const titleY = y - 50;
        const descY = y - 18;
        const progressY = y + 18;
        const linkY = y + 48;
        const buttonY = y + 35;
        const buttonW = 148;
        const buttonH = 44;
        const textRight = buttonX - buttonW / 2 - 26;
        const titleWrap = game.key === 'amino'
            ? w - 210
            : Math.max(220, textRight - textX);
        const descWrap = game.key === 'alignment'
            ? w - 210
            : Math.max(240, textRight - textX + 8);
        const progressMinW = Math.min(240, textRight - textX);

        const bg = this.add.rectangle(x, y, w, h, CARD_FILL, 0.97)
            .setStrokeStyle(1, CARD_STROKE)
            .setInteractive({ useHandCursor: true });
        this.layers.ui.add(bg);

        const accent = this.add.rectangle(accentX, y, stripeW, h - 16, game.accent, 0.85);
        this.layers.ui.add(accent);

        const circle = this.add.circle(iconX, y, 28, game.soft, 1);
        circle.setStrokeStyle(1.5, game.accent);
        this.layers.ui.add(circle);

        const icon = this.add.image(iconX, y, game.icon)
            .setScale(0.09)
            .setOrigin(0.5);
        this.layers.ui.add(icon);

        const titleFontSize = game.key === 'amino'
            ? '20px'
            : game.key === 'alignment'
                ? '22px'
                : (game.title.length > 24 ? '22px' : '24px');

        const titleText = this.add.text(textX, titleY, game.title, {
            fontSize: titleFontSize,
            fontStyle: 'bold',
            fontFamily: FONT,
            color: THEME.text,
            wordWrap: { width: titleWrap },
            lineSpacing: 2
        }).setOrigin(0, 0);
        this.layers.ui.add(titleText);

        const descText = this.add.text(textX, descY, game.description, {
            fontSize: '15px',
            fontFamily: FONT,
            color: THEME.muted,
            wordWrap: { width: descWrap },
            lineSpacing: 3
        }).setOrigin(0, 0);
        descText.y = Math.max(descY, titleText.y + titleText.height + 8);
        this.layers.ui.add(descText);

        const badge  = Progress.formatBadge(game.key, game.displayType);
        const progressCenterY = Math.max(progressY, descText.y + descText.height + 18);
        const linkCenterY = progressCenterY + 30;

        const pillTxt = this.add.text(textX + 12, progressCenterY, badge.text, {
            fontSize: '13px',
            fontFamily: FONT,
            fontStyle: 'bold',
            color: '#64748B'
        }).setOrigin(0, 0.5);
        const progressMaxW = Math.max(progressMinW, textRight - textX + 6);
        const progressInnerMaxW = Math.max(120, progressMaxW - 26);
        if (pillTxt.width > progressInnerMaxW) {
            pillTxt.setFontSize(12);
        }
        if (pillTxt.width > progressInnerMaxW) {
            pillTxt.setFontSize(11);
        }
        const progressW = Math.min(progressMaxW, Math.max(progressMinW, pillTxt.width + 26));
        const pillBg = this.add.rectangle(textX + progressW / 2, progressCenterY, progressW, 26, 0xF8FAFC, 1)
            .setStrokeStyle(1, 0xE2E8F0);

        const linkTxt = this.add.text(textX, Math.max(linkY, linkCenterY), 'Peržiūrėti pažangą', {
            fontSize: '14px',
            fontStyle: 'bold',
            fontFamily: FONT,
            color: THEME.primary
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        this.layers.ui.add([pillBg, pillTxt, linkTxt]);

        const btnBg = this.add.rectangle(buttonX, buttonY, buttonW, buttonH, BUTTON_COLOR, 1)
            .setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(buttonX, buttonY, 'Žaisti →', {
            fontSize: '18px',
            fontStyle: 'bold',
            fontFamily: FONT,
            color: '#ffffff'
        }).setOrigin(0.5);
        this.layers.ui.add([btnBg, btnTxt]);

        const elements = [bg, accent, circle, icon, titleText, descText, pillBg, pillTxt, linkTxt, btnBg, btnTxt];
        elements.forEach(el => { el.baseY = el.y; el.baseAlpha = el.alpha; });

        elements.forEach(el => { el.setAlpha(0).setY(el.baseY + 30); });
        this.tweens.add({
            targets: elements,
            props: {
                alpha: { getEnd: (t) => t.baseAlpha },
                y:     { getEnd: (t) => t.baseY }
            },
            duration: 500,
            delay: cardDelay,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: icon,
            scale: 0.105,
            duration: 2400 + index * 200,
            delay: index * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const navigate = () => { navigateTo(game.url); };

        bg.on('pointerover', () => {
            bg.setFillStyle(CARD_HOVER);
            accent.setAlpha(1);
            btnBg.setFillStyle(BUTTON_HOVER);
            this.tweens.add({
                targets: elements,
                props: { y: { getEnd: (t) => t.baseY - 3 } },
                duration: 160,
                ease: 'Sine.easeOut'
            });
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(CARD_FILL);
            accent.setAlpha(0.85);
            btnBg.setFillStyle(BUTTON_COLOR);
            this.tweens.add({
                targets: elements,
                props: { y: { getEnd: (t) => t.baseY } },
                duration: 160,
                ease: 'Sine.easeOut'
            });
        });

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(BUTTON_HOVER);
            this.tweens.add({ targets: [btnBg, btnTxt], scale: 1.03, duration: 120, ease: 'Sine.easeOut' });
        });
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(BUTTON_COLOR);
            this.tweens.add({ targets: [btnBg, btnTxt], scale: 1.0, duration: 120, ease: 'Sine.easeOut' });
        });
        btnBg.on('pointerdown', () => {
            this.tweens.add({ targets: [btnBg, btnTxt], scale: 0.97, duration: 80, ease: 'Sine.easeOut' });
        });

        bg.on('pointerdown', navigate);
        btnBg.on('pointerdown', navigate);
        btnTxt.setInteractive({ useHandCursor: true }).on('pointerdown', navigate);

        linkTxt.on('pointerover',  () => linkTxt.setColor('#059669'));
        linkTxt.on('pointerout',   () => linkTxt.setColor(THEME.primary));
        linkTxt.on('pointerdown',  () => this.showProgressModal(game));
    }

    showProgressModal(game) {
        const details = Progress.formatDetails(game.key, game.displayType, game.title);
        const palette = details.palette || { accent: '#10B981', soft: 0xECFDF5, tint: '#065F46' };
        const accentColor = parseInt(palette.accent.replace('#', '0x'));

        const modalElements = [];
        const MX = CX, MW = 700;
        const summaryCardH = 62;
        const summaryGapY = 16;
        const historyRowH = 38;
        const historyRowGap = 8;
        const detailRowH = 20;
        const cardItems = details.summaryCards?.slice(0, 4) || [];
        const summaryRows = Math.max(1, Math.ceil(cardItems.length / 2));
        const summaryBlockH = summaryRows * summaryCardH + (summaryRows - 1) * summaryGapY;
        const historyCount = details.hasProgress ? (details.historyItems?.length || 0) : 0;
        const historyBlockH = historyCount > 0 ? historyCount * historyRowH + Math.max(0, historyCount - 1) * historyRowGap : 28;
        const detailCount = details.detailLines?.length || 0;
        const detailBlockH = detailCount > 0 ? 34 + Math.min(detailCount, 5) * detailRowH : 0;
        const bodyH = details.hasProgress
            ? 90 + summaryBlockH + 38 + historyBlockH + detailBlockH + 34
            : 210;
        const MH = Math.max(540, Math.min(760, 110 + bodyH + 84));
        const MY = H / 2;
        const topY    = MY - MH / 2; 
        const bottomY = MY + MH / 2; 

        const add = (el) => { modalElements.push(el.setDepth(201)); return el; };
        const closeModal = () => modalElements.forEach(el => el.destroy());

        const overlay = this.add.rectangle(MX, MY, W, H, 0x000000, 0.23)
            .setDepth(200).setInteractive();
        modalElements.push(overlay);
        overlay.on('pointerdown', closeModal);

        add(this.add.rectangle(MX, MY, MW, MH, 0xFFFFFF, 1)
            .setStrokeStyle(1.5, 0xD8E2EC).setInteractive());
        add(this.add.rectangle(MX - MW / 2 + 5, MY, 10, MH - 24, accentColor, 0.95));
        add(this.add.rectangle(MX, topY + 58, MW - 36, 52, palette.soft, 0.95));

        add(this.add.text(MX, topY + 48, details.title, {
            fontSize: '22px', fontStyle: 'bold', fontFamily: FONT, color: palette.tint
        }).setOrigin(0.5, 0.5));

        add(this.add.text(MX, topY + 68, 'Mokymosi pažangos suvestinė', {
            fontSize: '13px', fontFamily: FONT, color: palette.tint
        }).setOrigin(0.5, 0.5));

        add(this.add.rectangle(MX, topY + 86, MW - 40, 1, accentColor, 0.22));

        if (!details.hasProgress) {
            add(this.add.circle(MX, MY - 58, 36, palette.soft, 1));
            add(this.add.text(MX, MY - 58, 'i', {
                fontSize: '20px', fontStyle: 'bold', fontFamily: FONT, color: palette.accent
            }).setOrigin(0.5, 0.5));

            add(this.add.text(MX, MY - 4, 'Dar nėra bandymų', {
                fontSize: '16px', fontStyle: 'bold', fontFamily: FONT, color: THEME.text
            }).setOrigin(0.5, 0.5));
            add(this.add.text(MX, MY + 24, 'Užbaik bent vieną žaidimą, kad čia atsirastų', {
                fontSize: '13px', fontFamily: FONT, color: '#94A3B8'
            }).setOrigin(0.5, 0.5));
            add(this.add.text(MX, MY + 44, 'rezultatai ir bandymų istorija.', {
                fontSize: '13px', fontFamily: FONT, color: '#94A3B8'
            }).setOrigin(0.5, 0.5));

        } else {
            const secStyle = { fontSize: '11px', fontStyle: 'bold', fontFamily: FONT, color: '#94A3B8' };

            const cardW = 302, cardH = 62, gapX = 16, gapY = 16;
            const leftCX  = MX - cardW / 2 - gapX / 2; 
            const rightCX = MX + cardW / 2 + gapX / 2;  

            let cy = topY + 90;  

            cardItems.forEach((item, i) => {
                const cx     = i % 2 === 0 ? leftCX : rightCX;
                const cyCard = cy + Math.floor(i / 2) * (cardH + gapY) + cardH / 2;
                add(this.add.rectangle(cx, cyCard, cardW, cardH, item.tone.fill, 1)
                    .setStrokeStyle(1.5, item.tone.stroke));
                add(this.add.text(cx, cyCard - 13, item.label, {
                    fontSize: '11px', fontStyle: 'bold', fontFamily: FONT, color: item.tone.labelColor
                }).setOrigin(0.5, 0.5));
                add(this.add.text(cx, cyCard + 11, item.value, {
                    fontSize: '15px', fontStyle: 'bold', fontFamily: FONT, color: item.tone.valueColor
                }).setOrigin(0.5, 0.5));
            });

            const numRows = Math.ceil(cardItems.length / 2);
            cy += numRows * cardH + (numRows - 1) * gapY;   

            cy += 20;
            add(this.add.text(MX - MW / 2 + 40, cy, 'PASKUTINIAI BANDYMAI', secStyle)
                .setOrigin(0, 0.5));
            cy += 18;

            if (details.historyLines.length === 0) {
                add(this.add.text(MX - MW / 2 + 40, cy + 14, 'Bandymų istorijos dar nėra.', {
                    fontSize: '13px', fontFamily: FONT, color: '#94A3B8'
                }).setOrigin(0, 0.5));
                cy += 28;
            } else {
                const rowW = 620, rowH = 38;
                details.historyItems.forEach(item => {
                    add(this.add.rectangle(MX, cy + rowH / 2, rowW, rowH, 0xFFFFFF, 1)
                        .setStrokeStyle(1, 0xE2E8F0));
                    add(this.add.circle(MX - rowW / 2 + 20, cy + rowH / 2, 5, item.tone.stroke, 1));
                    add(this.add.text(MX - rowW / 2 + 34, cy + rowH / 2, item.date, {
                        fontSize: '12px', fontFamily: FONT, color: '#64748B'
                    }).setOrigin(0, 0.5));
                    add(this.add.text(MX - 18, cy + rowH / 2, item.value, {
                        fontSize: '13px', fontStyle: 'bold', fontFamily: FONT, color: THEME.text
                    }).setOrigin(0.5, 0.5));
                    add(this.add.text(MX + rowW / 2 - 18, cy + rowH / 2, item.change, {
                        fontSize: '12px', fontStyle: 'bold', fontFamily: FONT, color: item.tone.valueColor
                    }).setOrigin(1, 0.5));
                    cy += rowH + 8;
                });
            }

            if (details.detailLines && details.detailLines.length > 0) {
                cy += 16;
                add(this.add.text(MX - MW / 2 + 40, cy, 'DETALĖS', secStyle).setOrigin(0, 0.5));
                cy += 18;
                details.detailLines.slice(0, 5).forEach(line => {
                    add(this.add.text(MX - MW / 2 + 40, cy, line, {
                        fontSize: '13px', fontFamily: FONT, color: '#374151'
                    }).setOrigin(0, 0.5));
                    cy += 20;
                });
            }
        }

        const btnY    = bottomY - 34;
        const closeBg = add(this.add.rectangle(MX, btnY, 140, 38, 0xF1F5F9, 1)
            .setStrokeStyle(1, 0xD8E2EC).setInteractive({ useHandCursor: true }));
        const closeTxt = add(this.add.text(MX, btnY, 'Uždaryti', {
            fontSize: '14px', fontFamily: FONT, color: THEME.muted
        }).setOrigin(0.5));

        closeBg.on('pointerover',  () => closeBg.setFillStyle(0xE2E8F0));
        closeBg.on('pointerout',   () => closeBg.setFillStyle(0xF1F5F9));
        closeBg.on('pointerdown',  closeModal);
        closeTxt.setInteractive({ useHandCursor: true }).on('pointerdown', closeModal);
    }
}

const engine = new BioPhaser.Engine({
    type: Phaser.AUTO,
    width: W,
    height: H,
    backgroundColor: '#F8FAFC',
    parent: 'game-container'
});

engine.registerScene(MenuScene);
engine.start();
