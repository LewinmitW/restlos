<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$db   = get_db();

// Load all user's pantry ingredient IDs (immer_da counted as always available)
$stmt = $db->prepare('SELECT ingredient_id, qty, immer_da FROM pantry WHERE user_id = ?');
$stmt->execute([$user['id']]);
$pantryRows = $stmt->fetchAll();

$pantryAvailable = []; // ingredient_id => true
$immerDa         = [];
foreach ($pantryRows as $row) {
    if ($row['immer_da']) {
        $immerDa[$row['ingredient_id']] = true;
    } elseif ($row['qty'] > 0) {
        $pantryAvailable[$row['ingredient_id']] = true;
    }
}

// Load all recipes with their ingredients
$stmt = $db->prepare('
    SELECT r.id, r.name, r.category, r.prep_time, r.portions, r.is_meal_prep,
           r.kalt_essbar, r.tags, r.image_url, r.favorite, r.last_cooked
    FROM recipes r
    WHERE r.user_id = ?
    ORDER BY r.name
');
$stmt->execute([$user['id']]);
$recipes = $stmt->fetchAll();

if (empty($recipes)) {
    json_success(['allDa' => [], 'fastAlles' => [], 'mehr' => []]);
}

$recipeIds = array_column($recipes, 'id');
$placeholders = implode(',', array_fill(0, count($recipeIds), '?'));

$stmt = $db->prepare("
    SELECT ri.recipe_id, ri.ingredient_id, ri.optional
    FROM recipe_ingredients ri
    WHERE ri.recipe_id IN ($placeholders)
");
$stmt->execute($recipeIds);
$allIngredients = $stmt->fetchAll();

// Group by recipe
$byRecipe = [];
foreach ($allIngredients as $ing) {
    $byRecipe[$ing['recipe_id']][] = $ing;
}

// Score each recipe
$allDa   = [];
$fastAlles = [];
$mehr    = [];

foreach ($recipes as $recipe) {
    $ings    = $byRecipe[$recipe['id']] ?? [];
    $total   = 0;
    $matched = 0;
    $missing = [];

    foreach ($ings as $ing) {
        if ($ing['optional']) continue;
        $total++;
        $iid = $ing['ingredient_id'];
        if (isset($immerDa[$iid]) || isset($pantryAvailable[$iid])) {
            $matched++;
        } else {
            $missing[] = $iid;
        }
    }

    if ($total === 0) {
        $percent = 100;
    } else {
        $percent = (int)round($matched / $total * 100);
    }

    $recipe['match_percent'] = $percent;
    $recipe['matched']       = $matched;
    $recipe['total']         = $total;
    $recipe['missing_ids']   = $missing;
    $recipe['tags']          = $recipe['tags'] ? explode(',', $recipe['tags']) : [];
    $recipe['favorite']      = (bool)$recipe['favorite'];
    $recipe['is_meal_prep']  = (bool)$recipe['is_meal_prep'];
    $recipe['kalt_essbar']   = (bool)$recipe['kalt_essbar'];

    if ($percent === 100) {
        $allDa[] = $recipe;
    } elseif ($percent >= 80) {
        $fastAlles[] = $recipe;
    } else {
        $mehr[] = $recipe;
    }
}

// Sort by match % desc within groups
usort($fastAlles, fn($a, $b) => $b['match_percent'] <=> $a['match_percent']);
usort($mehr, fn($a, $b) => $b['match_percent'] <=> $a['match_percent']);

json_success([
    'allDa'     => $allDa,
    'fastAlles' => $fastAlles,
    'mehr'      => $mehr,
]);
