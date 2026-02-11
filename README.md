# BioPhaser

Bendras programinis pagrindas edukaciniams biologijos žaidimams.

BioPhaser yra JavaScript sistema, paremta Phaser.js biblioteka, skirta interaktyviems biologijos žaidimams kurti. Šiame projekte sukurti trys žaidimai, padedantys mokytis genetinio kodo, aminorūgščių savybių ir sekų lygiavimo.

---

## Žaidimai

### Kodonų paieškos žaidimas
Mokykitės atpažinti mRNR kodonus ir jiems atitinkančias aminorūgštis.

Galimybės:
- Du režimai: mokymosi ir iššūkio
- Trys sunkumo lygiai
- Automatinė sekų generacija
- Grįžtamasis ryšys

### Aminorūgščių klasifikavimo žaidimas
Praktiškai mokykitės klasifikuoti aminorūgštis pagal poliarumą, hidrofobiškumą ir aromatiškumą.

Galimybės:
- Trys klasifikavimo tipai
- Pamokos prieš treniruotę
- Automatinis klaidų kartojimas
- Detalūs rezultatai

### Sekų lygiavimo žaidimas
Supraskite sekų lygiavimo principus įterpiant tarpus ir maksimizuojant lygiavimo įvertį.

Galimybės:
- Interaktyvus tarpų dėliojimas
- Rezultatų skaičiavimas realiuoju laiku
- Trys sunkumo lygiai

---

## Kaip naudoti

### Atidarykite naršyklėje

1. Atsisiųskite projektą
2. Atidarykite `index.html` failą naršyklėje

Arba paleiskite su vietiniu serveriu:

```bash
python -m http.server 8000
```

Tada eikite į `http://localhost:8000`

### Žaidimo pasirinkimas

Redaguokite `index.html` failą ir pakeiskite import eilutę:

```html
<!-- Kodonų žaidimas -->
<script type="module" src="codon_game.js"></script>

<!-- Aminorūgščių žaidimas -->
<script type="module" src="amino_acid_classification.js"></script>

<!-- Sekų lygiavimas -->
<script type="module" src="sequence_alignment_game.js"></script>
```
