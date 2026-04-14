# CLAUDE CODE PROMPT — Restlos: Koch-App

Kopiere diesen gesamten Prompt in Claude Code. Stelle sicher, dass die Dateien DESIGN.md und konzept-kochapp-v2.md im Projektordner liegen.

---

## Auftrag

Baue mir die komplette Web-App **"Restlos"** — eine Koch-, Vorrats- und Wochenplanungs-App für Solo-Haushalte. Die App besteht aus zwei Teilen:

1. **Frontend:** React + Vite → deployed automatisch via Vercel auf `restlos.lewinstrobl.com`
2. **Backend/API:** PHP + MySQL → liegt auf meinem Hetzner-Server auf `api.restlos.lewinstrobl.com`, deployed per FTP

Das GitHub Repo ist bereits verbunden. Jeder `git push` auf `main` triggert automatisch ein Vercel-Deployment.

---

## Technischer Stack

```

```

### Frontend (dieses Repo)

- **Framework:** React 18 + Vite
- **Routing:** React Router (HashRouter oder BrowserRouter)
- **State:** React Context + useReducer (kein Redux, kein Zustand — keep it simple)
- **Styling:** CSS Modules oder eine einzige globale CSS-Datei — kein Tailwind, kein Styled Components
- **PWA:** Vite PWA Plugin (vite-plugin-pwa) für Service Worker +
  ```

  ```

  Manifest
- **Icons:** Lucide React
- **Font:** Inter (Google Fonts)
- **API Calls:** fetch() Wrapper mit Basis-URL aus Environment Variable

### Backend (separater Ordner `api/`, wird per FTP auf Hetzner hochgeladen)

- **Sprache:** PHP 8.1+ (kein Framework, plain PHP)
- **Datenbank:** MySQL (InnoDB)
- **Auth:** bcrypt Passwort-Hashing, PHP Sessions mit CORS-Headers
- **CORS:** Muss Requests von `restlos.lewinstrobl.com` erlauben
- **Deployment:** FTP-Upload auf Hetzner (KonsoleH), kein SSH, kein Composer

### Domains

- **Frontend:** `restlos.lewinstrobl.com` (Vercel)
- **API:** `api.restlos.lewinstrobl.com` (Hetzner)

### Environment Variables

- In `.env` (lokal): `VITE_API_URL=http://localhost:8080` (für lokale Entwicklung)
- In Vercel Dashboard: `VITE_API_URL=https://api.restlos.lewinstrobl.com`

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

### Frontend (React — dieses Repo, deployed via Vercel)

```
restlos/
├── index.html
├── vite.config.js
├── package.json
├── .env                        ← VITE_API_URL=http://localhost:8080
├── .env.example                ← Template für andere Entwickler
├── .gitignore
├── DESIGN.md
├── konzept-kochapp-v2.md
│
├── public/
│   ├── icons/                  ← PWA Icons (192px, 512px)
│   └── img/                    ← Placeholder-Bilder
│
└── src/
    ├── main.jsx                ← Entry Point, React.createRoot
    ├── App.jsx                 ← Router + App Shell (Bottom Nav)
    ├── index.css               ← Globale Styles + Design Tokens
    │
    ├── api/
    │   └── client.js           ← fetch() Wrapper, Basis-URL, Auth-Header
    │
    ├── context/
    │   ├── AuthContext.jsx      ← Login/Logout/Session State
    │   └── AppContext.jsx       ← Globaler App State (Vorrat, Rezepte Cache)
    │
    ├── pages/
    │   ├── WeekPlanner.jsx     ← Wochenplaner (Setup + Plan-Ansicht)
    │   ├── QuickCook.jsx       ← Spontan Kochen
    │   ├── Pantry.jsx          ← Vorrat
    │   ├── ShoppingList.jsx    ← Einkaufsliste
    │   ├── Recipes.jsx         ← Rezeptliste
    │   ├── RecipeDetail.jsx    ← Rezeptdetail
    │   ├── RecipeForm.jsx      ← Rezept erstellen/bearbeiten
    │   ├── Login.jsx           ← Login Screen
    │   └── Register.jsx        ← Registrierung
    │
    ├── components/
    │   ├── BottomNav.jsx       ← 4-Tab Navigation
    │   ├── Header.jsx          ← Top Bar
    │   ├── RecipeCard.jsx      ← Rezeptkarte (wiederverwendbar)
    │   ├── IngredientRow.jsx   ← Zutat-Zeile mit Match-Status
    │   ├── Stepper.jsx         ← [–] [Zahl] [+] Component
    │   ├── ChipFilter.jsx      ← Toggle-Chips für Filter
    │   ├── BottomSheet.jsx     ← Slide-Up Modal
    │   ├── SearchInput.jsx     ← Suchfeld mit Autocomplete
    │   ├── EmptyState.jsx      ← Leere-Zustände Component
    │   └── LoadingSpinner.jsx
    │
    └── utils/
        ├── matchScore.js       ← Vorrat-Match Berechnung (client-side)
        └── formatters.js       ← Datum, Mengen, etc.
```

### Backend (PHP — separater Ordner, deployed per FTP auf Hetzner)

```
api/
├── config.php              ← DB-Credentials (auf Hetzner ausfüllen)
├── setup.php               ← Erstellt Tabellen + Seed-Daten
├── .htaccess               ← CORS + PHP-Routing
│
├── auth/
│   ├── login.php
│   ├── register.php
│   ├── logout.php
│   └── session.php
├── recipes/
│   ├── list.php
│   ├── get.php
│   ├── create.php
│   ├── update.php
│   └── delete.php
├── pantry/
│   ├── list.php
│   ├── add.php
│   ├── update.php
│   └── remove.php
├── shopping/
│   ├── list.php
│   ├── add.php
│   ├── check.php
│   ├── remove.php
│   └── to-pantry.php
├── planner/
│   ├── get.php
│   ├── generate.php
│   ├── save.php
│   └── swap-recipe.php
├── ingredients/
│   └── search.php          ← Autocomplete
├── match/
│   └── quick-cook.php      ← Vorrat-Match Berechnung
│
├── includes/
│   ├── db.php              ← PDO Connection
│   ├── auth.php            ← Session/Auth Helper
│   ├── cors.php            ← CORS Headers Helper
│   └── helpers.php         ← Utility Functions
│
└── uploads/
    └── recipes/            ← User-uploaded Rezeptbilder
```

---

## Architektur

### Frontend (React SPA auf Vercel)

- Vite als Build-Tool, React Router für Routing
- BrowserRouter (Vercel handled SPA-Routing automatisch via vercel.json rewrites)
- Jede Page ist eine eigene Komponente in `src/pages/`
- Wiederverwendbare UI-Komponenten in `src/components/`
- `src/api/client.js` ist der zentrale fetch-Wrapper:
  ```js
  const API_URL = import.meta.env.VITE_API_URL;

  export async function api(endpoint, options = {}) {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      credentials: 'include', // für PHP Session Cookies
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    return res.json();
  }
  ```
- AuthContext prüft beim App-Start ob eine Session existiert (api/auth/session.php)
- Wenn nicht eingeloggt → Login-Screen, sonst → App mit Bottom-Nav

### vercel.json (im Repo-Root für SPA-Routing)

```json
{
  "rewrites": [
    { "source": "/((?!assets|icons|img).*)", "destination": "/index.html" }
  ]
}
```

### Backend (PHP API auf Hetzner)

- Alle API Endpoints returnen JSON: `{"success": true, "data": {...}}` oder `{"success": false, "error": "..."}`
- CORS-Header in jeder Datei (oder zentral in cors.php):
  ```php
  header('Access-Control-Allow-Origin: https://restlos.lewinstrobl.com');
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
  ```
- Auth via PHP Sessions mit SameSite=None + Secure für Cross-Domain Cookies
- Alternativ: Token-basierte Auth (einfacher JWT-String in localStorage) wenn Cross-Domain Sessions Probleme machen
- Alle Inputs escapen/validieren (prepared statements, htmlspecialchars)
- POST für Create/Update/Delete, GET für Read

### Auth-Flow

1. User öffnet App → React AuthContext ruft `api/auth/session.php` auf
2. Wenn nicht eingeloggt → Login/Register Page
3. Login → PHP erstellt Session, setzt Cookie → React speichert User-State
4. Alle weiteren API Calls schicken Cookie/Token mit
5. Logout → Session destroyen, React clearet State

### Lokale Entwicklung

- Frontend: `npm run dev` → localhost:5173
- Backend: Entweder PHP Built-in Server (`php -S localhost:8080` im api/ Ordner) oder MAMP/XAMPP
- `.env` setzt `VITE_API_URL=http://localhost:8080`

---

## Kernfeatures & Logik

### 1. Wochenplaner (Hauptscreen `/woche`)

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
- "Einkaufsliste erstellen" Button → generiert Liste, wechselt zu `/liste`

**Toggle oben:** Segment Control "🗓 Woche" / "🍳 Jetzt" → wechselt zu Quick Cook

### 2. Quick Cook (`/quickcook`)

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

### 3. Vorrat (`/vorrat`)

- "+" Button oben → öffnet Bottom-Sheet (Modal) zum Hinzufügen
- Suchfeld filtert die Liste live (client-side)
- Zutat hinzufügen: Autocomplete aus `api/ingredients/search.php`, Menge (viel/wenig/rest), Ort (Kühlschrank/Schrank/Tiefkühl/Immer da)
- "Bald verwerten" Sektion: Zutaten mit location != 'immer_da' UND added_at > 4 Tage
- Mengen-Dots: Tap → wechselt viel→wenig→rest→löschen
- Swipe-to-delete (oder X-Button auf Mobile)
- "Immer da" Sektion: Kompakt als Chips dargestellt
- Tap auf Zutat → zeigt Rezepte die diese Zutat verwenden (Quick-Modal)

### 4. Einkaufsliste (`/liste`)

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

### 5. Rezepte (`/rezepte`)

- "+" Button → `/rezept/neu`
- Suchfeld + Filter-Chips (Alle, ❤️ Favoriten, 🥡 Meal Prep, 🧊 Kalt, <30 min)
- Rezeptkarten: Name, Tags, Zeit, Favorit-Heart, "Zuletzt: vor X Tagen"
- Tap → `/rezept/123` (Detail)
- Swipe-to-delete mit Bestätigung

### 6. Rezeptdetail (`/rezept/123`)

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

### 7. Rezept erstellen/bearbeiten (`/rezept/neu`, `/rezept/123/edit`)

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

### Vite PWA Plugin

Installiere `vite-plugin-pwa` und konfiguriere in `vite.config.js`:

```js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Restlos',
        short_name: 'Restlos',
        description: 'Koch- und Vorratsplaner',
        start_url: '/',
        display: 'standalone',
        background_color: '#F9F9F7',
        theme_color: '#316342',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.restlos\.lewinstrobl\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50 } }
          }
        ]
      }
    })
  ]
}
```

---

## config.php Template (für den api/ Ordner auf Hetzner)

```php
<?php
// Datenbank-Konfiguration
define('DB_HOST', 'localhost');
define('DB_NAME', 'restlos');
define('DB_USER', 'root');
define('DB_PASS', '');

// App-Konfiguration  
define('API_URL', 'https://api.restlos.lewinstrobl.com');
define('FRONTEND_URL', 'https://restlos.lewinstrobl.com');
define('APP_NAME', 'Restlos');

// Upload
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_DIR', __DIR__ . '/uploads/recipes/');
```

### .htaccess für api/ Ordner (auf Hetzner)

```apache
# CORS für alle PHP Dateien
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "https://restlos.lewinstrobl.com"
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Handle OPTIONS preflight
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
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

- Vite Code-Splitting: Jede Page wird lazy geladen mit `React.lazy()` und `Suspense`
- Bilder: WebP, max 800px Breite
- SQL Queries mit sinnvollen INDEXes
- API Responses cachen im React State (nicht bei jedem Tab-Wechsel neu laden)

### UX Details

- Alle Animationen: 200ms ease-out (nicht zu langsam, nicht zu schnell)
- Touch-Feedback: opacity 0.7 statt Material Ripple
- Leere Zustände: Freundliche Nachricht + CTA Button
- Loading States: Skeleton Shimmer oder dezenter Spinner
- Alle Texte auf Deutsch
- Bottom-Nav: 4 Tabs (Woche, Vorrat, Liste, Rezepte), aktiver Tab grün mit 4px Y-Offset

---

## Reihenfolge der Umsetzung

1. **Vite + React Setup** → `npm create vite@latest . -- --template react`, Dependencies installieren (react-router-dom, lucide-react, vite-plugin-pwa), vite.config.js, vercel.json
2. **App Shell** → App.jsx mit React Router + BottomNav Component + globale CSS mit Design Tokens aus DESIGN.md
3. **API Client** → src/api/client.js fetch-Wrapper + AuthContext
4. **Auth Screens** → Login.jsx + Register.jsx + PHP API (login.php, register.php, session.php)
5. **Rezepte** → Recipes.jsx, RecipeDetail.jsx, RecipeForm.jsx + PHP API (CRUD)
6. **Vorrat** → Pantry.jsx + BottomSheet für Hinzufügen + PHP API
7. **Quick Cook** → QuickCook.jsx mit Match-Algorithmus
8. **Einkaufsliste** → ShoppingList.jsx + Teilen + Vorrat-Übernahme
9. **Wochenplaner** → WeekPlanner.jsx + Optimierungs-Algorithmus
10. **Backend DB** → setup.php mit allen Tabellen + Seed-Daten
11. **PWA** → Icons generieren, Vite PWA Plugin konfigurieren
12. **Polish** → Animationen, leere Zustände, Offline-Modus, Fehlerbehandlung

**WICHTIG:** Der `api/` Ordner wird INNERHALB dieses Repos erstellt (damit ich alles in einem Projekt habe), aber NICHT von Vercel deployed. Er wird separat per FTP auf Hetzner hochgeladen. Füge `api/` NICHT zur .gitignore hinzu — er soll im Repo sein, nur Vercel ignoriert ihn.

Arbeite dich Screen für Screen durch. Committe und pushe nach jedem größeren Schritt auf GitHub (dann baut Vercel automatisch). Frag mich wenn dir Design-Entscheidungen unklar sind.

Starte jetzt mit Schritt 1 und 2.
