# Biophaser

Mokomieji žaidimai, padaryti su `Phaser`.

Projektas šiuo metu turi kelis atskirus žaidimus:

- aminorūgščių klasifikavimas
- kodonų žaidimas
- sekų išlyginimas
- i-mer

## Kaip pasileisti

Paprasčiausias variantas yra paleisti projektą per lokalų serverį.

Pvz. su VS Code:

1. atsidaryti projektą
2. atsidaryti `index.html`
3. spausti `Open with Live Server`

Tada naršyklėje atsidarys meniu, iš kurio galima paleisti visus žaidimus.

Jei nenaudoji `Live Server`, tinka bet koks paprastas lokalus serveris, svarbu neatidarinėti failų vien per `file://`.

Galima paleisti ir su Python:

```bash
python -m http.server 8000
```

Tada atsidaryti naršyklėje:

```text
http://localhost:8000
```

## Struktūra

- `index.html` – pagrindinis meniu
- `games/` – visi žaidimų scriptai
- `config/` – žaidimų konfigūracijos
- `core/` – bendri helperiai ir progress logika
- `assets/` – paveikslėliai ir ikonėlės
