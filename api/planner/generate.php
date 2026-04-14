<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();

$homeMeals  = (int)($body['home_meals']  ?? 5);
$prepMeals  = (int)($body['prep_meals']  ?? 2);
$priority   = $body['priority']   ?? 'balanced'; // 'pantry', 'variety', 'balanced'
$preference = $body['preference'] ?? '';          // 'vegan', 'vegetarisch', etc.
$week       = (int)($body['week'] ?? (int)(new DateTime())->format('W'));
$year       = (int)($body['year'] ?? (int)(new DateTime())->format('Y'));

$db = get_db();

// Load pantry
$stmt = $db->prepare('SELECT ingredient_id, qty, immer_da FROM pantry WHERE user_id = ?');
$stmt->execute([$user['id']]);
$pantryRows = $stmt->fetchAll();

$pantryAvailable = [];
$immerDa         = [];
foreach ($pantryRows as $row) {
    if ($row['immer_da']) {
        $immerDa[$row['ingredient_id']] = true;
    } elseif ($row['qty'] > 0) {
        $pantryAvailable[$row['ingredient_id']] = true;
    }
}

// Load recipes
$whereClause = 'r.user_id = ?';
$params      = [$user['id']];

if ($preference) {
    $whereClause .= ' AND FIND_IN_SET(?, r.tags)';
    $params[]     = $preference;
}

$stmt = $db->prepare("
    SELECT r.id, r.name, r.category, r.prep_time, r.portions, r.is_meal_prep,
           r.kalt_essbar, r.shelf_life_days, r.batch_portions, r.tags,
           r.image_url, r.last_cooked
    FROM recipes r
    WHERE $whereClause
    ORDER BY r.last_cooked ASC, RAND()
");
$stmt->execute($params);
$allRecipes = $stmt->fetchAll();

if (empty($allRecipes)) {
    json_error('Keine Rezepte gefunden. Bitte erst Rezepte anlegen.');
}

// Load ingredients for all recipes
$recipeIds    = array_column($allRecipes, 'id');
$placeholders = implode(',', array_fill(0, count($recipeIds), '?'));
$stmt         = $db->prepare("SELECT recipe_id, ingredient_id, optional FROM recipe_ingredients WHERE recipe_id IN ($placeholders)");
$stmt->execute($recipeIds);
$byRecipe = [];
foreach ($stmt->fetchAll() as $ing) {
    $byRecipe[$ing['recipe_id']][] = $ing;
}

// Score each recipe by pantry match
$scored = array_map(function ($r) use ($byRecipe, $pantryAvailable, $immerDa) {
    $ings    = $byRecipe[$r['id']] ?? [];
    $total   = 0;
    $matched = 0;
    foreach ($ings as $ing) {
        if ($ing['optional']) continue;
        $total++;
        $iid = $ing['ingredient_id'];
        if (isset($immerDa[$iid]) || isset($pantryAvailable[$iid])) {
            $matched++;
        }
    }
    $r['match_pct'] = $total > 0 ? $matched / $total : 1.0;
    $r['tags_arr']  = $r['tags'] ? explode(',', $r['tags']) : [];
    return $r;
}, $allRecipes);

// Sort by priority
usort($scored, function ($a, $b) use ($priority) {
    if ($priority === 'pantry') {
        return $b['match_pct'] <=> $a['match_pct'];
    } elseif ($priority === 'variety') {
        // Prefer not recently cooked
        $aDate = $a['last_cooked'] ? strtotime($a['last_cooked']) : 0;
        $bDate = $b['last_cooked'] ? strtotime($b['last_cooked']) : 0;
        return $aDate <=> $bDate;
    }
    // balanced: high match + not recently cooked
    $aScore = $a['match_pct'] - ($a['last_cooked'] ? (time() - strtotime($a['last_cooked'])) / (86400 * 30) : 1);
    $bScore = $b['match_pct'] - ($b['last_cooked'] ? (time() - strtotime($b['last_cooked'])) / (86400 * 30) : 1);
    return $bScore <=> $aScore;
});

// Split into meal prep and fresh
$mealPrep = array_filter($scored, fn($r) => $r['is_meal_prep']);
$fresh    = array_filter($scored, fn($r) => !$r['is_meal_prep']);

$mealPrep = array_values($mealPrep);
$fresh    = array_values($fresh);

$slots = [];
$used  = [];

// Pick prep meals
$prepCount = 0;
foreach ($mealPrep as $r) {
    if ($prepCount >= $prepMeals) break;
    if (isset($used[$r['id']])) continue;
    $slots[] = [
        'recipe_id'  => $r['id'],
        'slot_type'  => 'prep',
        'day_index'  => 0,
        'portions'   => $r['batch_portions'] ?? $r['portions'] ?? 1,
        'recipe'     => $r,
    ];
    $used[$r['id']] = true;
    $prepCount++;
}

// Fill remaining with fresh meals
$freshCount = 0;
foreach ($fresh as $r) {
    if ($freshCount >= $homeMeals) break;
    if (isset($used[$r['id']])) continue;
    $slots[] = [
        'recipe_id' => $r['id'],
        'slot_type' => 'frisch',
        'day_index' => $freshCount + 1,
        'portions'  => $r['portions'] ?? 1,
        'recipe'    => $r,
    ];
    $used[$r['id']] = true;
    $freshCount++;
}

// Save generated plan
$db->prepare('DELETE FROM week_plan WHERE user_id = ? AND week = ? AND year = ?')
   ->execute([$user['id'], $week, $year]);

$saveStmt = $db->prepare('
    INSERT INTO week_plan (user_id, recipe_id, week, year, slot_type, day_index, portions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
');
foreach ($slots as $slot) {
    $saveStmt->execute([
        $user['id'],
        $slot['recipe_id'],
        $week,
        $year,
        $slot['slot_type'],
        $slot['day_index'],
        $slot['portions'],
    ]);
}

// Strip internal scoring fields before returning
foreach ($slots as &$slot) {
    unset($slot['recipe']['match_pct'], $slot['recipe']['tags_arr']);
    $slot['recipe']['is_meal_prep'] = (bool)$slot['recipe']['is_meal_prep'];
    $slot['recipe']['kalt_essbar']  = (bool)$slot['recipe']['kalt_essbar'];
    $slot['recipe']['tags']         = $slot['recipe']['tags'] ? explode(',', $slot['recipe']['tags']) : [];
}

json_success(['week' => $week, 'year' => $year, 'slots' => $slots]);
