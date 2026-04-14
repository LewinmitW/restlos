<?php
/**
 * Restlos — Database Setup
 * Run once on Hetzner: https://api.restlos.lewinstrobl.com/setup.php
 * DELETE this file afterwards!
 */

require_once __DIR__ . '/config.php';

// Only allow local or with secret token
$token = $_GET['token'] ?? '';
if (php_sapi_name() !== 'cli' && $token !== 'restlos-setup-2024') {
    http_response_code(403);
    die('Forbidden. Add ?token=restlos-setup-2024');
}

$pdo = new PDO(
    'mysql:host=' . DB_HOST . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$pdo->exec("USE `" . DB_NAME . "`");

$tables = <<<SQL

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ingredients (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(150) NOT NULL UNIQUE,
    default_unit        VARCHAR(30)  NOT NULL DEFAULT 'g',
    supermarkt_kategorie VARCHAR(60) NOT NULL DEFAULT 'Sonstiges',
    substitute_for      INT UNSIGNED NULL REFERENCES ingredients(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipes (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NOT NULL REFERENCES users(id),
    name           VARCHAR(200) NOT NULL,
    category       VARCHAR(60)  NOT NULL DEFAULT '',
    prep_time      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    portions       TINYINT UNSIGNED  NOT NULL DEFAULT 2,
    is_meal_prep   TINYINT(1) NOT NULL DEFAULT 0,
    kalt_essbar    TINYINT(1) NOT NULL DEFAULT 0,
    shelf_life_days TINYINT UNSIGNED NULL,
    batch_portions  TINYINT UNSIGNED NULL,
    tags           VARCHAR(500) NOT NULL DEFAULT '',
    notes          TEXT,
    image_url      VARCHAR(500) NULL,
    favorite       TINYINT(1)  NOT NULL DEFAULT 0,
    last_cooked    DATETIME NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipe_id     INT UNSIGNED NOT NULL REFERENCES recipes(id),
    ingredient_id INT UNSIGNED NOT NULL REFERENCES ingredients(id),
    amount        DECIMAL(8,2) NOT NULL DEFAULT 0,
    unit          VARCHAR(30)  NOT NULL DEFAULT '',
    optional      TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
    INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipe_steps (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipe_id   INT UNSIGNED NOT NULL REFERENCES recipes(id),
    step_nr     TINYINT UNSIGNED NOT NULL,
    description TEXT NOT NULL,
    INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pantry (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL REFERENCES users(id),
    ingredient_id INT UNSIGNED NOT NULL REFERENCES ingredients(id),
    qty           DECIMAL(8,2) NOT NULL DEFAULT 1,
    unit          VARCHAR(30)  NOT NULL DEFAULT '',
    location      VARCHAR(60)  NOT NULL DEFAULT 'Vorratsschrank',
    expires_at    DATE NULL,
    immer_da      TINYINT(1)   NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shopping_list (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL REFERENCES users(id),
    ingredient_id INT UNSIGNED NOT NULL REFERENCES ingredients(id),
    qty           DECIMAL(8,2) NOT NULL DEFAULT 1,
    unit          VARCHAR(30)  NOT NULL DEFAULT '',
    checked       TINYINT(1)   NOT NULL DEFAULT 0,
    recipe_id     INT UNSIGNED NULL REFERENCES recipes(id),
    added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS week_plan (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL REFERENCES users(id),
    recipe_id  INT UNSIGNED NOT NULL REFERENCES recipes(id),
    week       TINYINT UNSIGNED NOT NULL,
    year       SMALLINT UNSIGNED NOT NULL,
    slot_type  ENUM('prep','frisch') NOT NULL DEFAULT 'frisch',
    day_index  TINYINT UNSIGNED NOT NULL DEFAULT 0,
    portions   TINYINT UNSIGNED NOT NULL DEFAULT 1,
    INDEX idx_user_week (user_id, week, year)
) ENGINE=InnoDB;

SQL;

foreach (explode(';', $tables) as $sql) {
    $sql = trim($sql);
    if ($sql) $pdo->exec($sql);
}

// Seed ingredients
$ingredients = [
    // Gemüse
    ['Zwiebel',         'Stück',  'Gemüse'],
    ['Knoblauch',       'Zehe',   'Gemüse'],
    ['Karotte',         'Stück',  'Gemüse'],
    ['Kartoffel',       'g',      'Gemüse'],
    ['Tomate',          'Stück',  'Gemüse'],
    ['Paprika',         'Stück',  'Gemüse'],
    ['Zucchini',        'Stück',  'Gemüse'],
    ['Spinat',          'g',      'Gemüse'],
    ['Brokkoli',        'g',      'Gemüse'],
    ['Blumenkohl',      'g',      'Gemüse'],
    ['Sellerie',        'Stange', 'Gemüse'],
    ['Lauch',           'Stück',  'Gemüse'],
    ['Aubergine',       'Stück',  'Gemüse'],
    ['Süßkartoffel',    'g',      'Gemüse'],
    ['Kürbis',          'g',      'Gemüse'],
    ['Pilze',           'g',      'Gemüse'],
    ['Champignons',     'g',      'Gemüse'],
    ['Gurke',           'Stück',  'Gemüse'],
    ['Eisbergsalat',    'Kopf',   'Gemüse'],
    ['Rucola',          'g',      'Gemüse'],
    ['Avocado',         'Stück',  'Gemüse'],
    ['Mais',            'Dose',   'Gemüse'],
    ['Erbsen',          'g',      'Gemüse'],
    ['Grüne Bohnen',    'g',      'Gemüse'],
    ['Linsen (grün)',   'g',      'Hülsenfrüchte'],
    ['Linsen (rot)',    'g',      'Hülsenfrüchte'],
    ['Kichererbsen',    'Dose',   'Hülsenfrüchte'],
    ['Weiße Bohnen',    'Dose',   'Hülsenfrüchte'],
    ['Kidneybohnen',    'Dose',   'Hülsenfrüchte'],
    // Obst
    ['Zitrone',         'Stück',  'Obst'],
    ['Limette',         'Stück',  'Obst'],
    ['Orange',          'Stück',  'Obst'],
    ['Apfel',           'Stück',  'Obst'],
    ['Banane',          'Stück',  'Obst'],
    // Fleisch & Fisch
    ['Hähnchenbrustfilet', 'g',   'Fleisch & Fisch'],
    ['Hackfleisch (gemischt)', 'g', 'Fleisch & Fisch'],
    ['Lachs',           'g',      'Fleisch & Fisch'],
    ['Thunfisch (Dose)','Dose',   'Fleisch & Fisch'],
    ['Speck',           'g',      'Fleisch & Fisch'],
    // Milch & Ei
    ['Ei',              'Stück',  'Milch & Ei'],
    ['Butter',          'g',      'Milch & Ei'],
    ['Milch',           'ml',     'Milch & Ei'],
    ['Sahne',           'ml',     'Milch & Ei'],
    ['Joghurt',         'g',      'Milch & Ei'],
    ['Quark',           'g',      'Milch & Ei'],
    ['Parmesan',        'g',      'Milch & Ei'],
    ['Mozzarella',      'g',      'Milch & Ei'],
    ['Feta',            'g',      'Milch & Ei'],
    ['Cheddar',         'g',      'Milch & Ei'],
    // Getreide & Pasta
    ['Reis',            'g',      'Getreide & Pasta'],
    ['Pasta',           'g',      'Getreide & Pasta'],
    ['Spaghetti',       'g',      'Getreide & Pasta'],
    ['Penne',           'g',      'Getreide & Pasta'],
    ['Couscous',        'g',      'Getreide & Pasta'],
    ['Quinoa',          'g',      'Getreide & Pasta'],
    ['Bulgur',          'g',      'Getreide & Pasta'],
    ['Haferflocken',    'g',      'Getreide & Pasta'],
    ['Mehl',            'g',      'Getreide & Pasta'],
    ['Paniermehl',      'g',      'Getreide & Pasta'],
    ['Toastbrot',       'Scheibe','Brot & Backwaren'],
    // Konserven & Saucen
    ['Tomaten (gehackt)','Dose',  'Konserven'],
    ['Tomaten (passiert)','ml',   'Konserven'],
    ['Kokosmilch',      'Dose',   'Konserven'],
    ['Gemüsebrühe',     'ml',     'Konserven'],
    ['Hühnerbrühe',     'ml',     'Konserven'],
    ['Sojasoße',        'ml',     'Konserven'],
    ['Tomatenmark',     'EL',     'Konserven'],
    ['Olivenöl',        'EL',     'Öle & Essig'],
    ['Pflanzenöl',      'EL',     'Öle & Essig'],
    ['Sesamöl',         'EL',     'Öle & Essig'],
    ['Balsamico',       'EL',     'Öle & Essig'],
    ['Apfelessig',      'EL',     'Öle & Essig'],
    // Gewürze
    ['Salz',            'Prise',  'Gewürze'],
    ['Pfeffer',         'Prise',  'Gewürze'],
    ['Paprikapulver',   'TL',     'Gewürze'],
    ['Kreuzkümmel',     'TL',     'Gewürze'],
    ['Kurkuma',         'TL',     'Gewürze'],
    ['Zimt',            'TL',     'Gewürze'],
    ['Oregano',         'TL',     'Gewürze'],
    ['Thymian',         'TL',     'Gewürze'],
    ['Basilikum',       'TL',     'Gewürze'],
    ['Petersilie',      'EL',     'Gewürze'],
    ['Ingwer',          'TL',     'Gewürze'],
    ['Chili',           'Stück',  'Gewürze'],
    ['Chilipulver',     'TL',     'Gewürze'],
    ['Curry',           'TL',     'Gewürze'],
    ['Zucker',          'EL',     'Gewürze'],
    ['Honig',           'EL',     'Gewürze'],
    ['Senf',            'TL',     'Gewürze'],
    ['Mayonnaise',      'EL',     'Gewürze'],
    // Nüsse & Samen
    ['Mandeln',         'g',      'Nüsse & Samen'],
    ['Cashews',         'g',      'Nüsse & Samen'],
    ['Erdnüsse',        'g',      'Nüsse & Samen'],
    ['Pinienkerne',     'g',      'Nüsse & Samen'],
    ['Sesam',           'EL',     'Nüsse & Samen'],
    ['Erdnussbutter',   'EL',     'Nüsse & Samen'],
    ['Tahini',          'EL',     'Nüsse & Samen'],
    // Tiefkühl
    ['TK-Spinat',       'g',      'Tiefkühl'],
    ['TK-Erbsen',       'g',      'Tiefkühl'],
    ['TK-Blattspinat',  'g',      'Tiefkühl'],
];

$stmt = $pdo->prepare('
    INSERT IGNORE INTO ingredients (name, default_unit, supermarkt_kategorie)
    VALUES (?, ?, ?)
');
foreach ($ingredients as $ing) {
    $stmt->execute($ing);
}

echo '<pre>';
echo "✅ Tabellen erstellt\n";
echo '✅ ' . count($ingredients) . " Zutaten eingefügt\n";
echo "\n⚠️  Diese Datei jetzt löschen!\n";
echo '</pre>';
