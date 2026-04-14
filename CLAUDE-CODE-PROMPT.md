# CLAUDE CODE PROMPT — Restlos: Koch-App

Kopiere diesen gesamten Prompt in Claude Code. Stelle sicher, dass die Dateien DESIGN.md und konzept-kochapp-v2.md im Projektordner liegen.

---

## Auftrag

Baue mir die komplette Web-App **"Restlos"** — eine Koch-, Vorrats- und Wochenplanungs-App für Solo-Haushalte. Das Ergebnis soll ein fertiger, deploy-barer Ordner sein, den ich per FTP auf meinen Hetzner-Server hochlade, eine `config.php` mit meinen DB-Daten ausfülle, ein Setup-Script laufen lasse, und fertig.

---

## Technischer Stack

- **Backend:** PHP 8.1+ (kein Framework, plain PHP wie meine anderen Projekte)
- **Datenbank:** MySQL (InnoDB)
- **Frontend:** Vanilla JS + CSS (kein React, kein Build-Step — muss direkt auf dem Server laufen ohne npm/node)
- **PWA:** Service Worker für Offline-Zugriff + Web App Manifest (installierbar auf dem Handy)
- **Auth:** Eigenes Login-System mit Registrierung, bcrypt Passwort-Hashing, PHP Sessions
- **Deployment:** FTP-Upload, kein SSH, kein Composer — alles muss self-contained sein
- **Domain:** restlos.lewinstrobl.com

---

## Design

Verwende den Figma MCP Server um die Designs aus meinem Figma File auszulesen. Das File heißt "The Living Kitchen" und enthält alle Screens.

Hier ist der Link zum Figma File: https://www.figma.com/design/1A9gggk207drf3lzRewI7V/Untitled?node-id=0-1&t=pBFOpvspW2Z6vmLP-1

Lies auch die Datei `DESIGN.md` im Projektordner — sie enthält das komplette Design System (Farben, Typografie, Komponenten, Do's & Don'ts).

**Wichtig:**
- Halte dich visuell eng an die Figma-Designs
- Das Layout darf angepasst werden wo es für Code sinnvoll ist
- Die Design-Tokens (Farben, Fonts, Radii, Shadows) aus DESIGN.md sind verbindlich
- Mobile-first, optimiert für iPhone (390px Breite)
- Inter Font (von Google Fonts laden)
- Lucide Icons (als SVG inline oder als CDN)
- Kein pure Black (#000), verwende #1A1C1B
- Glassmorphic Bottom-Navigation (backdrop-blur)
- Keine harten Borders — Tonal Shifts für Tiefe

---

## Datenbankstruktur

Erstelle ein `setup.php` Script das alle Tabellen anlegt. Hier ist das Schema:

### users
```sql
id INT AUTO_INCREMENT PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
name VARCHAR(100) NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### ingredients (globale Zutatenliste)
```sql
id INT AUTO_INCREMENT PRIMARY KEY
name VARCHAR(150) NOT NULL
category ENUM('gemuese','obst','milch','fleisch','fisch','dosen','gewuerze','grundzutaten','tiefkuehl','sonstiges') DEFAULT 'sonstiges'
shelf_life ENUM('lang','mittel','kurz') DEFAULT 'mittel'
default_unit VARCHAR(20) DEFAULT 'g'
supermarket_category ENUM('gemuese_obst','milch_kuehl','fleisch_fisch','dosen_glaeser','backwaren','getraenke','tiefkuehl','gewuerze','sonstiges') DEFAULT 'sonstiges'
```

### recipes
```sql
id INT AUTO_INCREMENT PRIMARY KEY
user_id INT NOT NULL (FK → users.id)
name VARCHAR(200) NOT NULL
category ENUM('fruehstueck','mittag','abend','snack') DEFAULT 'abend'
prep_time INT DEFAULT 30 (Minuten)
base_servings INT DEFAULT 1
is_meal_prep TINYINT(1) DEFAULT 0
is_cold_edible TINYINT(1) DEFAULT 0
shelf_life_days INT DEFAULT 0
batch_portions INT DEFAULT 1
is_favorite TINYINT(1) DEFAULT 0
steps TEXT (JSON array of strings)
tags VARCHAR(500) (comma-separated)
notes TEXT
last_cooked DATE NULL
image_url VARCHAR(500) NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### recipe_ingredients
```sql
id INT AUTO_INCREMENT PRIMARY KEY
recipe_id INT NOT NULL (FK → recipes.id, CASCADE DELETE)
ingredient_id INT NOT NULL (FK → ingredients.id)
amount DECIMAL(10,2) NOT NULL
unit VARCHAR(20) NOT NULL
is_optional TINYINT(1) DEFAULT 0
sort_order INT DEFAULT 0
```

### ingredient_substitutes
```sql
id INT AUTO_INCREMENT PRIMARY KEY
recipe_ingredient_id INT NOT NULL (FK → recipe_ingredients.id, CASCADE DELETE)
substitute_ingredient_id INT NOT NULL (FK → ingredients.id)
```

### pantry (Vorrat pro User)
```sql
id INT AUTO_INCREMENT PRIMARY KEY
user_id INT NOT NULL (FK → users.id)
ingredient_id INT NOT NULL (FK → ingredients.id)
quantity ENUM('viel','wenig','rest') DEFAULT 'viel'
location ENUM('kuehlschrank','schrank','tiefkuehl','immer_da') DEFAULT 'kuehlschrank'
added_at DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(user_id, ingredient_id)
```

### shopping_list
```sql
id INT AUTO_INCREMENT PRIMARY KEY
user_id INT NOT NULL (FK → users.id)
ingredient_id INT NULL (FK → ingredients.id, NULL für manuelle Einträge)
custom_name VARCHAR(200) NULL (für Nicht-Zutaten wie "Klopapier")
amount VARCHAR(50) NULL
recipe_ids VARCHAR(500) NULL (comma-separated recipe IDs als Herkunft)
is_checked TINYINT(1) DEFAULT 0
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### weekly_plans
```sql
id INT AUTO_INCREMENT PRIMARY KEY
user_id INT NOT NULL (FK → users.id)
calendar_week INT NOT NULL
year INT NOT NULL
meals_total INT DEFAULT 9
meals_prep INT DEFAULT 4
prefer_cold TINYINT(1) DEFAULT 1
priority ENUM('wenig_einkaufen','abwechslung','schnell') DEFAULT 'wenig_einkaufen'
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(user_id, calendar_week, year)
```

### weekly_plan_recipes
```sql
id INT AUTO_INCREMENT PRIMARY KEY
plan_id INT NOT NULL (FK → weekly_plans.id, CASCADE DELETE)
recipe_id INT NOT NULL (FK → recipes.id)
day_of_week ENUM('mo','di','mi','do','fr','sa','so') NULL
meal_type ENUM('frisch','prep') NOT NULL
portions INT DEFAULT 1
```

---

## Ordnerstruktur

```
restlos/
├── config.php              ← DB-Credentials (User füllt aus)
├── setup.php               ← Erstellt Tabellen + Seed-Daten
├── index.php               ← Entry Point, lädt App-Shell
├── manifest.json           ← PWA Manifest
├── sw.js                   ← Service Worker
│
├── api/                    ← JSON API Endpoints
│   ├── auth/
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── logout.php
│   │   └── session.php
│   ├── recipes/
│   │   ├── list.php
│   │   ├── get.php
│   │   ├── create.php
│   │   ├── update.php
│   │   └── delete.php
│   ├── pantry/
│   │   ├── list.php
│   │   ├── add.php
│   │   ├── update.php
│   │   └── remove.php
│   ├── shopping/
│   │   ├── list.php
│   │   ├── add.php
│   │   ├── check.php
│   │   ├── remove.php
│   │   └── to-pantry.php
│   ├── planner/
│   │   ├── get.php
│   │   ├── generate.php
│   │   ├── save.php
│   │   └── swap-recipe.php
│   ├── ingredients/
│   │   └── search.php      ← Autocomplete
│   └── match/
│       └── quick-cook.php   ← Vorrat-Match Berechnung
│
├── includes/
│   ├── db.php              ← PDO Connection
│   ├── auth.php            ← Session/Auth Helper
│   └── helpers.php         ← Utility Functions
│
├── assets/
│   ├── css/
│   │   └── app.css         ← Gesamtes Styling (eine Datei)
│   ├── js/
│   │   ├── app.js          ← Router, Navigation, App-Shell
│   │   ├── api.js          ← Fetch-Wrapper für alle API Calls
│   │   ├── week.js         ← Wochenplaner Logik + UI
│   │   ├── quickcook.js    ← Quick Cook Screen
│   │   ├── pantry.js       ← Vorrat Screen
│   │   ├── shopping.js     ← Einkaufsliste Screen
│   │   ├── recipes.js      ← Rezeptliste Screen
│   │   ├── recipe-detail.js
│   │   ├── recipe-form.js  ← Erstellen/Bearbeiten
│   │   └── auth.js         ← Login/Register UI
│   ├── icons/              ← PWA Icons (192px, 512px)
│   └── img/                ← Placeholder/Illustrations
│
└── uploads/
    └── recipes/            ← User-uploaded Rezeptbilder
```

---

## Architektur

### SPA-artiges Routing (ohne Framework)
- `index.php` liefert die App-Shell (HTML-Grundgerüst mit Bottom-Nav + Content-Container)
- JavaScript rendert die Screens dynamisch in den Content-Container
- URL-Hash-Routing: `#woche`, `#quickcook`, `#vorrat`, `#liste`, `#rezepte`, `#rezept/123`, `#rezept/neu`, `#rezept/123/edit`
- Jeder Screen hat sein eigenes JS-Modul das `render()` und `init()` exportiert
- Beim Tab-Wechsel: altes Modul aufräumen, neues laden und rendern
- Die App-Shell (Header + Bottom-Nav) bleibt immer stehen

### API-Design
- Alle API Endpoints returnen JSON: `{"success": true, "data": {...}}` oder `{"success": false, "error": "..."}`
- Auth-Check am Anfang jedes API-Calls (außer login/register)
- Alle Inputs escapen/validieren (prepared statements, htmlspecialchars)
- POST für Create/Update/Delete, GET für Read

### Auth-Flow
1. User öffnet App → `api/auth/session.php` checkt ob eingeloggt
2. Wenn nicht → Login/Register Screen (KEIN Hash-Routing, eigener Screen)
3. Nach Login → Session starten, App laden
4. Logout → Session destroyen, zurück zum Login

---

## Kernfeatures & Logik

### 1. Wochenplaner (Hauptscreen `#woche`)

**Zustand A: Noch nicht geplant**
- Stepper für "Zuhause kochen" (Default: 5) und "Zum Mitnehmen" (Default: 4)
- Toggle-Chips: Kalt / Aufwärmen ok / Egal
- Toggle-Chips: Wenig einkaufen / Abwechslung / Schnell
- Button "Woche vorschlagen" → ruft `api/planner/generate.php` auf

**Optimierungs-Algorithmus in generate.php:**
```
1. Hole alle Rezepte des Users
2. Hole den aktuellen Vorrat
3. Für Meal-Prep-Slots: Filtere auf is_meal_prep=1
   - Wenn "kalt" gewählt: zusätzlich is_cold_edible=1
4. Für jede mögliche Kombination (oder: greedy/heuristic):
   a. Berechne Vorrat-Match-Score (wie viele Zutaten schon da?)
   b. Berechne Überlappungs-Score (teilen Rezepte Zutaten?)
   c. Berechne Einkaufs-Score (wie wenig Neues kaufen?)
   d. Optional: Abwechslungs-Score (nicht 3x Pasta)
5. Sortiere nach gewichteter Summe (basierend auf Priorität)
6. Return Top-Kombination + Statistik
```

Hinweis: Bei <50 Rezepten reicht ein heuristischer Greedy-Algorithmus (nicht alle Kombinationen durchprobieren). Wähle erst das Prep-Rezept mit bestem Vorrat-Match, dann das nächste das am meisten Zutaten mit dem ersten teilt, usw.

**Zustand B: Woche geplant**
- Zeigt Prep-Day Sektion + Frisch-Kochen Sektion
- Statistik-Banner: "X Mahlzeiten · Y neue Zutaten · Z schon daheim"
- "Austauschen" Button bei jedem Rezept → öffnet Modal mit Alternativen
- "Einkaufsliste erstellen" Button → generiert Liste, wechselt zu `#liste`

**Toggle oben:** Segment Control "🗓 Woche" / "🍳 Jetzt" → wechselt zu Quick Cook

### 2. Quick Cook (`#quickcook`)

- Suchfeld oben: "Zutat eingeben die du verwerten willst..."
- Filter-Chips: Alle · <15 min · <30 min · Alles da · 1 fehlt
- API Call `api/match/quick-cook.php`:
  1. Hole alle Rezepte + Vorrat des Users
  2. Für jedes Rezept: Zähle wie viele Zutaten im Vorrat sind (beachte: "immer_da" = immer vorhanden, optionale Zutaten ignorieren, Ersatzzutaten prüfen)
  3. Berechne Match-Prozent: vorhanden / benötigt * 100
  4. Gruppiere: "Alles da" (100%) → "Fast alles da" (≥70%) → "Mehr einkaufen"
  5. Sortiere innerhalb jeder Gruppe nach prep_time
- Rezeptkarten zeigen: Name, Match-Dots (🟢🟡🔴), Zeit, fehlende Zutaten
- Tap auf fehlende Zutat → "+ Liste" Button direkt daneben

### 3. Vorrat (`#vorrat`)

- "+" Button oben → öffnet Bottom-Sheet (Modal) zum Hinzufügen
- Suchfeld filtert die Liste live (client-side)
- Zutat hinzufügen: Autocomplete aus `api/ingredients/search.php`, Menge (viel/wenig/rest), Ort (Kühlschrank/Schrank/Tiefkühl/Immer da)
- "Bald verwerten" Sektion: Zutaten mit location != 'immer_da' UND added_at > 4 Tage
- Mengen-Dots: Tap → wechselt viel→wenig→rest→löschen
- Swipe-to-delete (oder X-Button auf Mobile)
- "Immer da" Sektion: Kompakt als Chips dargestellt
- Tap auf Zutat → zeigt Rezepte die diese Zutat verwenden (Quick-Modal)

### 4. Einkaufsliste (`#liste`)

- Toggle oben: "Nach Gang" / "Nach Rezept" (ändert Gruppierung)
- Gruppiert nach Supermarkt-Kategorie (aus ingredients.supermarket_category)
- Zeigt unter jedem Artikel klein das Rezept von dem er kommt
- Mengen werden zusammengerechnet wenn gleiche Zutat aus mehreren Rezepten
- Checkbox → abhaken → rutscht in "Erledigt" Sektion
- "Artikel hinzufügen" Input unten (Freitext, landet in "Sonstiges")
- "📤" Teilen-Button: Generiert Plaintext-Liste, Web Share API oder Clipboard
- "Einkauf fertig → Vorrat" Button:
  1. Zeigt Bestätigungs-Modal mit allen abgehakten Lebensmitteln
  2. Jede Zutat wird kategorisiert (Kühlschrank/Schrank) basierend auf ingredient.category
  3. Nicht-Lebensmittel (custom_name ohne ingredient_id) werden übersprungen
  4. Bestätigen → ruft `api/shopping/to-pantry.php` → Items werden als "viel" in den Vorrat eingetragen

### 5. Rezepte (`#rezepte`)

- "+" Button → `#rezept/neu`
- Suchfeld + Filter-Chips (Alle, ❤️ Favoriten, 🥡 Meal Prep, 🧊 Kalt, <30 min)
- Rezeptkarten: Name, Tags, Zeit, Favorit-Heart, "Zuletzt: vor X Tagen"
- Tap → `#rezept/123` (Detail)
- Swipe-to-delete mit Bestätigung

### 6. Rezeptdetail (`#rezept/123`)

- Hero-Bild oben (falls vorhanden, sonst Placeholder mit Farbverlauf)
- Name, Tags, Zeit, Portionen
- Portionen-Stepper → Zutatenmengen skalieren live (client-side Mathe)
- Zutatenliste mit Vorrat-Check:
  - 🟢 Grün = im Vorrat
  - 🔴 Rot = fehlt, mit "+ Liste" Button
  - ⚪ Grau = optional
  - 🔄 Ersatzzutat vorhanden → Hinweis
- "Fehlende auf die Liste" Sammel-Button
- Zubereitungsschritte (nummeriert)
- Notizen
- "Gekocht!" Button → Modal: "Zutaten vom Vorrat abziehen?" → Ja/Nein → aktualisiert last_cooked + optional Vorrat reduzieren

### 7. Rezept erstellen/bearbeiten (`#rezept/neu`, `#rezept/123/edit`)

- Formular mit allen Feldern
- Zutaten: Dynamische Liste (+ Button für neue Zeile)
  - Jede Zeile: Autocomplete Zutatname | Menge | Einheit (Dropdown)
  - ⋮ Menü: "Ersatzzutat hinzufügen", "Optional markieren", "Entfernen"
- Schritte: Dynamische Liste mit Textareas
- Meal Prep Toggle → zeigt/versteckt Zusatzfelder
- Tags als Chip-Input
- Bild-Upload (optional, max 2MB, wird zu WebP konvertiert und in /uploads/recipes/ gespeichert)
- Speichern-Button → POST an create.php oder update.php

### 8. Auth Screens

- Login: Email + Passwort + "Registrieren" Link
- Register: Name + Email + Passwort + Passwort bestätigen
- Minimalistisches Design, zentriert, mit App-Logo
- Nach Registration: Automatisch einloggen

---

## PWA Setup

### manifest.json
```json
{
  "name": "Restlos",
  "short_name": "Restlos",
  "description": "Koch- und Vorratsplaner",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9F9F7",
  "theme_color": "#316342",
  "icons": [
    {"src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```

### Service Worker (sw.js)
- Cache-First für CSS, JS, Fonts, Icons
- Network-First für API Calls
- Offline-Fallback: Zeige gecachte Version der App-Shell
- Einkaufsliste muss offline lesbar sein (letzte Version aus Cache)

---

## config.php Template

```php
<?php
// Datenbank-Konfiguration
define('DB_HOST', 'localhost');
define('DB_NAME', 'restlos');
define('DB_USER', 'root');
define('DB_PASS', '');

// App-Konfiguration  
define('APP_URL', 'https://restlos.lewinstrobl.com');
define('APP_NAME', 'Restlos');

// Upload
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_DIR', __DIR__ . '/uploads/recipes/');
```

---

## setup.php Verhalten

1. Prüfe DB-Verbindung mit config.php
2. Erstelle alle Tabellen (IF NOT EXISTS)
3. Seede die `ingredients` Tabelle mit ~80 gängigen Zutaten (deutsch):
   - Gemüse: Tomate, Gurke, Paprika, Zucchini, Spinat, Brokkoli, Karotte, Zwiebel, Knoblauch, Kartoffel, Süßkartoffel, Aubergine, Lauch, Champignon, Mais, Erbsen, Bohnen, Salat, Avocado, Kürbis
   - Obst: Apfel, Banane, Zitrone, Limette, Orange
   - Milch: Milch, Butter, Sahne, Schmand, Crème fraîche, Joghurt, Käse, Feta, Parmesan, Mozzarella, Eier
   - Fleisch/Fisch: Hühnchen, Hackfleisch, Lachs, Thunfisch, Speck, Schinken
   - Dosen: Kichererbsen, Kidneybohnen, Linsen, Kokosmilch, Tomatenmark, Passierte Tomaten, Mais (Dose), Oliven, Kapern, Sardellen
   - Grundzutaten: Mehl, Zucker, Reis, Pasta, Nudeln, Couscous, Haferflocken, Brot, Tortillas, Semmelbrösel
   - Gewürze: Salz, Pfeffer, Paprikapulver, Kreuzkümmel, Kurkuma, Chili, Oregano, Basilikum, Petersilie, Koriander, Thymian, Rosmarin, Ingwer, Sojasauce, Essig, Senf, Honig
   - Öle: Olivenöl, Sonnenblumenöl, Sesamöl
   - Sonstiges: Nüsse, Erdnussbutter, Hummus
4. Zeige Erfolgs-/Fehlermeldung
5. Lösche sich nicht selbst, aber zeige Warnung: "Lösche setup.php nach der Installation"

---

## Wichtige Details

### Seed-Daten für Ingredient-Kategorien
Jede Zutat muss sowohl `category` (für Vorrat-Gruppierung) als auch `supermarket_category` (für Einkaufslisten-Sortierung) korrekt gesetzt haben. Beispiel:
- Tomate: category='gemuese', supermarket_category='gemuese_obst', shelf_life='kurz'
- Kokosmilch: category='dosen', supermarket_category='dosen_glaeser', shelf_life='lang'
- Feta: category='milch', supermarket_category='milch_kuehl', shelf_life='mittel'

### Sicherheit
- Prepared Statements überall (kein String-Concatenation in Queries)
- htmlspecialchars für alle Outputs
- bcrypt für Passwörter
- CSRF-Token für alle POST-Requests
- Session-Regeneration nach Login
- Rate Limiting auf Login (optional, nice-to-have)

### Performance
- Eine einzige CSS-Datei, kein Build-Step
- JS-Module werden lazy geladen (nur der aktive Screen)
- Bilder: WebP, max 800px Breite
- SQL Queries mit sinnvollen INDEXes

### UX Details
- Alle Animationen: 200ms ease-out (nicht zu langsam, nicht zu schnell)
- Touch-Feedback: opacity 0.7 statt Material Ripple
- Leere Zustände: Freundliche Nachricht + CTA Button
- Loading States: Skeleton Shimmer oder dezenter Spinner
- Alle Texte auf Deutsch
- Bottom-Nav: 4 Tabs (Woche, Vorrat, Liste, Rezepte), aktiver Tab grün mit 4px Y-Offset

---

## Reihenfolge der Umsetzung

1. **Config + Setup + DB** → Tabellen + Seed-Daten
2. **App-Shell** → index.php + CSS + Bottom-Nav + Router
3. **Auth** → Login/Register Screens + API
4. **Rezepte** → CRUD (Liste, Detail, Erstellen, Bearbeiten)
5. **Vorrat** → CRUD + Autocomplete
6. **Quick Cook** → Match-Algorithmus + UI
7. **Einkaufsliste** → CRUD + Teilen + Vorrat-Übernahme
8. **Wochenplaner** → Algorithmus + UI
9. **PWA** → Service Worker + Manifest + Icons
10. **Polish** → Animationen, leere Zustände, Offline-Modus

Arbeite dich Screen für Screen durch. Zeige mir nach jedem größeren Schritt den Zwischenstand. Frag mich wenn dir Design-Entscheidungen unklar sind.

Starte jetzt mit Schritt 1 und 2.
