# 🍳 Konzept: Koch-App für Solo-Haushalte (v2)

## Das Problem

Wer alleine wohnt, kennt das:
- Man kauft Zutaten für ein Rezept, die Hälfte bleibt übrig
- Man steht vor dem Kühlschrank und weiß nicht, was man kochen soll
- Sachen verderben, weil man vergisst, dass man sie hat
- Man kauft doppelt, weil man nicht weiß, was noch da ist
- Man braucht Essen für die Arbeit/Uni, will aber nicht jeden Tag kochen
- Meal Prep klingt gut, aber wie plant man das effizient mit dem restlichen Kochen?

---

## Kernidee

Die App hat zwei Modi, die ineinandergreifen:

**🗓 Wochenplaner** (Hauptfeature) — "Ich brauche X Mahlzeiten diese Woche, davon Y als Meal Prep. Was koche ich, und was muss ich einkaufen?"

**🍳 Quick Cook** — "Ich hab Hunger und will jetzt was machen mit dem, was da ist."

---

## User-Szenarien

### Szenario 1: Sonntagsplanung
Fia setzt sich Sonntag hin und sagt der App:
- "Ich brauche diese Woche **12 Mahlzeiten**"
- "Davon **5 zum Mitnehmen** (Meal Prep)"
- "Davon am liebsten **4 kalt essbar**, 1 kann aufgewärmt werden"

Die App schlägt eine Kombination vor:
- **Meal Prep Sonntag:** Mediterraner Kichererbsensalat (3 Portionen, kalt) + Wraps mit Hummus & Gemüse (2 Portionen, kalt)
- **Frisch kochen:** Mo: Pasta Puttanesca, Mi: Gemüsecurry, Fr: Omelette, Sa: Ofengemüse
- **Einkaufsliste:** nur 9 neue Zutaten (statt 25), weil Rezepte überlappende Zutaten haben

### Szenario 2: "Ich will möglichst wenig einkaufen"
Fia hat noch einiges daheim. Sie aktiviert den Modus "Vorrat zuerst" — die App priorisiert Rezeptkombinationen, die maximal aus dem Vorrat schöpfen. Ergebnis: "Du brauchst nur 4 neue Sachen für die ganze Woche."

### Szenario 3: Spontan am Mittwoch
Das geplante Rezept passt doch nicht. Fia öffnet den Quick-Cook-Tab und sieht, was sie jetzt mit dem, was noch da ist, kochen kann — ohne den Rest der Wochenplanung zu zerstören.

### Szenario 4: Meal Prep am Sonntag
Fia hat ihre 2 Meal-Prep-Rezepte für die Woche ausgewählt. Die App zeigt einen Prep-Guide: "Zuerst Kichererbsen kochen (die brauchst du für beides), dann Salat zusammenstellen, dann Wraps rollen." Optimierte Reihenfolge, geteilte Arbeitsschritte.

### Szenario 5: "Ich hab noch Zucchini und Feta übrig"
Fia tippt 1–2 Zutaten ein, die sie verwerten will. Die App zeigt Rezepte, die genau diese Zutaten verwenden — priorisiert nach geringstem Einkaufsaufwand.

### Szenario 6: "Kann ich Parmesan durch etwas ersetzen?"
Bei einem Rezept fehlt eine Zutat, aber Fia hat eine Alternative daheim. Das Rezept erlaubt flexible Zutaten oder zeigt Substitutions-Vorschläge.

---

## Navigation

### Bottom Navigation (4 Tabs)

```
┌─────────────────────────────────────────┐
│                                         │
│            [ Hauptinhalt ]              │
│                                         │
├─────────┬──────────┬─────────┬─────────┤
│   🗓    │   📦     │   🛒    │   📖    │
│  Woche  │  Vorrat  │  Liste  │ Rezepte │
└─────────┴──────────┴─────────┴─────────┘
```

**🗓 Woche** — Wochenplaner + Quick Cook (Hauptscreen)
**📦 Vorrat** — Was hab ich daheim?
**🛒 Liste** — Einkaufsliste
**📖 Rezepte** — Sammlung verwalten

---

## Screen-by-Screen

### 1. 🗓 WOCHE (Hauptscreen)

Dieser Screen hat zwei Zustände:

#### Zustand A: Woche noch nicht geplant

```
┌─────────────────────────────┐
│ Diese Woche                 │
│                             │
│ ┌─────────────────────────┐ │
│ │ Wie viele Mahlzeiten    │ │
│ │ brauchst du?            │ │
│ │                         │ │
│ │ Zuhause kochen:  [—][5][+] │
│ │ Meal Prep:        [—][4][+] │
│ │                         │ │
│ │ Meal Prep Vorlieben:    │ │
│ │ ◉ Kalt essbar bevorzugt │ │
│ │ ○ Aufwärmen ist ok      │ │
│ │ ○ Egal                  │ │
│ │                         │ │
│ │ Priorität:              │ │
│ │ ◉ Wenig einkaufen       │ │
│ │ ○ Abwechslung           │ │
│ │ ○ Schnell kochen        │ │
│ │                         │ │
│ │ [✨ Woche vorschlagen]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Zustand B: Woche ist geplant

```
┌─────────────────────────────┐
│ Diese Woche          [✏️]   │
│                             │
│ ── 🥘 Prep Day (Sonntag) ── │
│ ┌─────────────────────────┐ │
│ │ Mediterr. Kichererbsen- │ │
│ │ salat → 3 Portionen     │ │
│ │ 🧊 kalt · hält 4 Tage  │ │
│ ├─────────────────────────┤ │
│ │ Wraps m. Hummus         │ │
│ │ → 2 Portionen           │ │
│ │ 🧊 kalt · hält 2 Tage  │ │
│ └─────────────────────────┘ │
│ ⏱ Gesamte Prepzeit: ~1,5h  │
│                             │
│ ── 🍳 Frisch kochen ─────── │
│                             │
│ Mo │ Pasta Puttanesca  25m  │
│ Mi │ Gemüsecurry       35m  │
│ Fr │ Shakshuka         20m  │
│ Sa │ Ofengemüse        40m  │
│ So │ (Prep Day)             │
│                             │
│ ── 📦 Mitnehmen ──────────── │
│                             │
│ Di │ Kichererbsensalat 🧊  │
│ Mi │ Kichererbsensalat 🧊  │
│ Do │ Wrap m. Hummus    🧊  │
│ Fr │ Kichererbsensalat 🧊  │
│ Mo │ Wrap m. Hummus    🧊  │
│                             │
│ ─────────────────────────── │
│ 📊 Diese Woche:             │
│ Nur 11 neue Zutaten nötig   │
│ 6 Zutaten schon im Vorrat   │
│ Zutat-Überlappung: 73%      │
│                             │
│ [🛒 Einkaufsliste erstellen]│
└─────────────────────────────┘
```

**Die Optimierungs-Logik dahinter:**

Die App wählt Rezepte nicht einzeln, sondern als **Kombination**, und bewertet die gesamte Woche nach:

1. **Vorrat-Abdeckung:** Wie viel kann aus dem bestehenden Vorrat kommen?
2. **Zutat-Überlappung:** Verwenden mehrere Rezepte dieselben Zutaten? (z.B. Kichererbsen für Salat UND Curry → 1× kaufen statt 2×)
3. **Resteverwertung:** Wenn Rezept A eine halbe Dose Kokosmilch braucht, schlägt die App Rezept B vor, das die andere Hälfte verwendet
4. **Haltbarkeit:** Meal-Prep-Gerichte werden nach Haltbarkeit auf die Woche verteilt (das Kurzlebige zuerst)
5. **Ausgewogenheit:** Nicht 5× Pasta in einer Woche

**Interaktionen auf diesem Screen:**
- Jedes Rezept ist austauschbar (Tap → "Alternativen anzeigen" → App schlägt Ersatzrezepte vor, die ähnlich gut in die Wochenkombination passen)
- Tage sind verschiebbar (Drag & Drop)
- ✏️ Button → zurück zur Einstellungs-Ansicht (Anzahl ändern)
- Einkaufsliste-Button → generiert Liste mit allem, was fehlt

---

### 2. 📦 VORRAT

**Zweck:** Alles was in Kühlschrank, Schrank, und Tiefkühl ist

```
┌─────────────────────────────┐
│ Mein Vorrat           [＋]  │
│                             │
│ 🔍 Suchen...               │
│                             │
│ ── ⚠️ Bald verwerten ────── │
│  Spinat         ●○○  Rest  │
│  Joghurt        ●●○  wenig │
│                             │
│ ── Kühlschrank ──────────── │
│  Feta           ●●● viel   │
│  Eier (6 Stk)   ●●● viel   │
│  Milch          ●●○ wenig  │
│  Zucchini       ●●○ wenig  │
│                             │
│ ── Vorratsschrank ───────── │
│  Pasta          ●●● viel   │
│  Kichererbsen   ●●● viel   │
│  Reis           ●●● viel   │
│  Linsen         ●●○ wenig  │
│                             │
│ ── Immer da ─────────────── │
│  ✓ Salz  ✓ Pfeffer         │
│  ✓ Olivenöl  ✓ Knoblauch   │
│  ✓ Zwiebeln  ✓ Mehl        │
│  [✏️ Bearbeiten]            │
│                             │
│ ── Tiefkühl ─────────────── │
│  Erbsen         ●●● viel   │
│  Brot           ●●○ wenig  │
└─────────────────────────────┘
```

**Logik:**
- **3 Mengenstufen:** viel / wenig / Rest (Tap zum Wechseln, kein Abwiegen)
- **"Immer da"-Kategorie:** Basics wie Salz, Öl, Zwiebeln — werden bei der Wochenplanung als vorhanden angenommen, tauchen nie auf der Einkaufsliste auf. Einmal einrichten, dann vergessen.
- **"Bald verwerten"** oben: Frische Zutaten, die seit >4 Tagen im Vorrat sind. Beim Wochenplaner werden Rezepte mit diesen Zutaten bevorzugt.
- **Kategorien:** Kühlschrank, Vorratsschrank, Tiefkühl, Gewürze, Immer-da

**Interaktionen:**
- Zutat hinzufügen: Autocomplete aus Zutatenliste, oder Freitext
- Tap auf Menge-Dots → wechselt viel → wenig → Rest → weg
- Swipe links → entfernen
- Tap auf Zutat → "Rezepte mit dieser Zutat anzeigen"

---

### 3. 🛒 LISTE

```
┌─────────────────────────────┐
│ Einkaufsliste          [📤] │
│                             │
│ ── Gemüse ─────────────────  │
│  ☐ Paprika rot (2 Stk)     │
│    → Shakshuka, Ofengemüse  │
│  ☐ Tomaten (6 Stk)         │
│    → Shakshuka, Puttanesca  │
│  ☐ Aubergine (1 Stk)       │
│    → Ofengemüse             │
│                             │
│ ── Dosen & Gläser ──────── │
│  ☐ Kokosmilch (1 Dose)     │
│    → Gemüsecurry            │
│  ☐ Kapern (1 Glas)         │
│    → Puttanesca             │
│                             │
│ ── Sonstiges ──────────────  │
│  ☐ Klopapier               │
│  ☐ Spülmittel              │
│                             │
│ ── ✅ Erledigt ────────────  │
│  ☑ Kichererbsen             │
│  ☑ Hummus                   │
│                             │
│ [Einkauf fertig → Vorrat ✓] │
└─────────────────────────────┘
```

**Wichtige Unterschiede zur v1:**

- **Sortierung nach Supermarkt-Gang** (Gemüse, Milch, Dosen, ...) statt nach Rezept — praktischer beim Einkaufen
- **Herkunft klein darunter:** Zeigt welches Rezept die Zutat braucht (für Kontext)
- **Mengen zusammengerechnet:** Wenn Shakshuka 3 Tomaten braucht und Puttanesca 3, steht da "Tomaten (6 Stk)"
- **📤 Teilen:** Als Textliste kopieren oder per WhatsApp schicken
- **"Einkauf fertig":** Alle abgehakten Sachen werden in den Vorrat übernommen

---

### 4. 📖 REZEPTE

```
┌─────────────────────────────┐
│ Meine Rezepte         [＋]  │
│                             │
│ 🔍 Suchen...               │
│                             │
│ ┌─ Filter (scrollbar) ───┐ │
│ │ Alle │ Prep │ Kalt │ <30m│ │
│ └────────────────────────┘  │
│                             │
│ ┌───────────────────────┐   │
│ │ Mediterr. Kichererbsen│   │
│ │ salat             🧊❄ │   │
│ │ 25 min · Meal Prep    │   │
│ │ Kalt essbar · 4 Tage  │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ Pasta Puttanesca      │   │
│ │ 25 min · Abendessen   │   │
│ │ Zuletzt: vor 2 Wochen │   │
│ └───────────────────────┘   │
│ ...                         │
└─────────────────────────────┘
```

**Rezept anlegen — erweiterte Felder:**

```
┌─────────────────────────────┐
│ Neues Rezept           [✓]  │
│                             │
│ Name: [________________]    │
│ Kategorie: [Abendessen ▾]   │
│ Zeit: [25] min              │
│ Portionen: [1]              │
│                             │
│ ── Meal Prep? ──────────── │
│ ☐ Geeignet für Meal Prep   │
│   ↳ Kalt essbar?  ◉ Ja ○ Nein │
│   ↳ Hält sich:    [3] Tage │
│   ↳ Batch-Portionen: [3]   │
│                             │
│ ── Zutaten ──────────────── │
│ [＋ Zutat hinzufügen]       │
│                             │
│  Kichererbsen │ 240 │ g     │
│  Gurke        │ 1   │ Stk   │
│  Feta         │ 80  │ g  [⇄]│
│    └ Ersatz: Ziegenkäse     │
│  Oliven       │ 50  │ g     │
│  Petersilie   │ -   │    [?]│
│    └ Optional (Garnierung)  │
│  Zitronensaft │ 2   │ EL    │
│                             │
│ ── Zubereitung ──────────── │
│ 1. Kichererbsen abspülen   │
│ 2. Gurke + Oliven würfeln  │
│ 3. Alles vermengen mit ... │
│ [＋ Schritt]                │
│                             │
│ Tags: [meal-prep] [kalt]    │
│       [proteinreich]        │
│ Notizen: [Schmeckt besser  │
│  wenn es über Nacht zieht] │
└─────────────────────────────┘
```

---

## Das Datenmodell

### Rezept
```
- Name
- Kategorie (Frühstück, Mittag, Abend, Snack)
- Zubereitungszeit (Minuten)
- Portionen (default: 1)
- Zutaten[] →
    - Zutat (verlinkt)
    - Menge + Einheit
    - Optional? (Garnierung etc.)
    - Ersetzbar durch? (Alternative Zutaten)
- Schritte[] (nummeriert, Freitext)
- Tags (frei wählbar)
- Notizen
- Meal Prep:
    - meal_prep_geeignet (ja/nein)
    - kalt_essbar (ja/nein)
    - haltbarkeit_tage (Zahl)
    - batch_portionen (wie viele auf einmal sinnvoll)
- Zuletzt gekocht (Datum)
- Bewertung (❤️ Favorit oder nicht)
```

### Zutat (globale Liste)
```
- Name
- Supermarkt-Kategorie (Gemüse, Obst, Milch, Dosen, ...)
- Haltbarkeits-Typ (lang/mittel/kurz)
- Übliche Einheit
```

### Vorrat
```
- Zutat
- Menge (viel / wenig / Rest)
- Kategorie (Kühlschrank / Schrank / Tiefkühl / Immer-da)
- Hinzugefügt am
```

### Wochenplan
```
- Kalenderwoche
- Einstellungen:
    - Anzahl Mahlzeiten gesamt
    - Davon Meal Prep
    - Kalt-Präferenz
    - Optimierungs-Priorität
- Geplante Rezepte[] →
    - Rezept
    - Tag(e) zugeordnet
    - Typ (frisch / prep)
    - Portionen
```

---

## Die Optimierungs-Logik (Herzstück)

### Wie der Wochenvorschlag funktioniert:

```
Input:
  - 9 Mahlzeiten gesamt
  - 4 davon Meal Prep (3 kalt, 1 warm ok)
  - Vorrat: {Kichererbsen, Feta, Pasta, Reis, Eier, ...}
  - Priorität: wenig einkaufen

Schritt 1: FILTER
  → Alle Rezepte nach Typ filtern
  → Meal-Prep-Pool: Rezepte mit meal_prep=ja
  → Fresh-Pool: alle anderen
  → Kalt-Pool: Subset von Prep mit kalt_essbar=ja

Schritt 2: SCORE jede mögliche Kombination
  Für jede Kombination aus (4 Prep + 5 Fresh) berechne:

  Vorrat-Score:
    Wie viele Zutaten sind schon da?
    Gewichtung: Hauptzutaten zählen mehr als Gewürze

  Überlappungs-Score:
    Wie viele Zutaten teilen sich mehrere Rezepte?
    Bonus: Wenn eine Zutat komplett aufgebraucht wird

  Rest-Score:
    Bleiben halbe Dosen/Packungen übrig?
    Penalty: Wenn 50g Kokosmilch übrig bleiben → schlecht
    Bonus: Wenn die Dose genau für 2 Rezepte reicht → gut

  Einkaufs-Score:
    Wie viele NEUE Zutaten müssen gekauft werden?
    (Anzahl verschiedener Produkte, nicht Menge)

  Abwechslungs-Score:
    Nicht 3× Kichererbsen-Gerichte in einer Woche
    Verschiedene Proteinsorten, Kohlenhydrate, etc.

Schritt 3: BESTE KOMBINATION wählen
  → Gewichtete Summe aller Scores
  → Top 3 Vorschläge anbieten

Schritt 4: ZEITPLANUNG
  → Prep-Gerichte auf einen Tag legen (Prep Day)
  → Kurzlebige Prep-Gerichte → Wochenanfang
  → Frische Gerichte gleichmäßig verteilen
  → Gemeinsame Prep-Schritte identifizieren
    (z.B. "Kichererbsen kochen" nur 1× wenn 2 Rezepte
     sie brauchen)
```

### Praxisbeispiel der Optimierung:

```
Fia hat im Vorrat: Kichererbsen, Reis, Feta, Eier,
Pasta, Linsen, Tiefkühl-Erbsen, Kokosmilch (1 Dose)

App schlägt vor:

PREP (Sonntag, ~1.5h):
├─ Kichererbsensalat (3 Port.) → kalt, hält 4 Tage
│  Braucht: Kichererbsen✓, Feta✓, Gurke✗, Oliven✗
│
├─ Linsen-Wraps (2 Port.) → kalt, hält 3 Tage
│  Braucht: Linsen✓, Tortillas✗, Joghurt✗
│
└─ Gemüse Fried Rice (2 Port.) → aufwärmen, hält 3 Tage
   Braucht: Reis✓, Erbsen✓, Eier✓, Sojasauce✗

FRISCH:
├─ Mo: Pasta Aglio e Olio (Pasta✓, Knoblauch✓)
├─ Mi: Kokos-Linsensuppe (Linsen✓, Kokosmilch✓)
├─ Fr: Shakshuka (Eier✓, Tomaten✗)
└─ So: Ofengemüse mit Feta (Feta✓, Gemüse✗)

EINKAUFSLISTE: nur 8 neue Artikel
├─ Gurke, Oliven → Kichererbsensalat
├─ Tortillas, Joghurt → Linsen-Wraps
├─ Sojasauce → Fried Rice
├─ Tomaten → Shakshuka + Kokossuppe
└─ Saisonales Ofengemüse

WARUM diese Kombination?
• Kokosmilch wird komplett aufgebraucht (½ Suppe + ½ Curry)
• Kichererbsen + Linsen doppelt genutzt
• Feta in Salat + Ofengemüse → nichts bleibt übrig
• 0 Lebensmittel werden verschwendet
```

---

## Design-Prinzipien

1. **Woche zuerst:** Der Hauptbildschirm ist die Wochenplanung, nicht einzelne Rezepte
2. **Wenige Taps:** Wochenplan erstellen = 3 Zahlen eingeben + 1 Button
3. **Kein Overhead:** Mengen im Vorrat sind grob (viel/wenig/Rest) — niemand wiegt Knoblauch ab
4. **Transparenz:** Immer zeigen WARUM die App etwas vorschlägt ("du hast schon 6 von 8 Zutaten")
5. **Austauschbar:** Jedes vorgeschlagene Rezept kann mit einem Tap ersetzt werden
6. **Mobile First:** Wird am Handy benutzt — in der Küche und im Supermarkt
7. **Offline:** Einkaufsliste und Rezepte müssen ohne Internet funktionieren
8. **Persönlich:** Nur eigene Rezepte, kein Social, kein Algorithmus von außen

---

## Technische Überlegungen

### Stack
- **Frontend:** React (PWA — installierbar, offline-fähig)
- **Daten:** Alles lokal im Browser (IndexedDB) — kein Backend nötig
- **Optimierung:** Die Kombinations-Logik läuft client-side (bei ~50-100 Rezepten performant genug)
- **Offline:** Service Worker cached alles — Einkaufsliste funktioniert im Keller vom Supermarkt
- **Export:** Einkaufsliste als Text kopierbar (WhatsApp, Notizen)

### MVP (Phase 1)
1. Rezepte anlegen (mit Meal-Prep-Feldern)
2. Vorrat pflegen
3. Wochenplaner mit Optimierung
4. Einkaufsliste generieren

### Phase 2
5. Ersatzzutaten-System
6. Prep-Day Anleitung (Reihenfolge, gemeinsame Schritte)
7. "Bald verwerten"-Priorisierung
8. Einkaufsliste → Vorrat Übernahme

### Phase 3
9. Rezept-Import (Text einfügen → automatisch parsen)
10. Statistik (Lieblingsrezepte, Geld gespart, nichts verschwendet)
