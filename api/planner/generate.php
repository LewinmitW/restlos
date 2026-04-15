<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();

// Support new day_assignments format AND legacy format
$dayAssignments = $body['day_assignments'] ?? null; // [{day_index:1, slot_type:'frisch'}, ...]

// Legacy fallback
$homeMeals  = (int)($body['home_meals']   ?? $body['meals_total'] ?? 5);
$prepMeals  = (int)($body['prep_meals']   ?? $body['meals_prep']  ?? 2);
$priority   = $body['priority']   ?? 'balanced';
$preferCold = !empty($body['prefer_cold']);
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
$stmt = $db->prepare("
    SELECT r.id, r.name, r.category, r.prep_time, r.portions, r.is_meal_prep,
           r.kalt_essbar AS is_cold_edible, r.shelf_life_days, r.batch_portions,
           r.tags, r.image_url, r.last_cooked
    FROM recipes r
    WHERE r.user_id = ?
    ORDER BY r.last_cooked ASC, RAND()
");
$stmt->execute([$user['id']]);
$allRecipes = $stmt->fetchAll();

if (empty($allRecipes)) {
    json_error('Keine Rezepte gefunden. Bitte erst Rezepte anlegen.');
}

// Load ingredients per recipe
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
        if (isset($immerDa[$iid]) || isset($pantryAvailable[$iid])) $matched++;
    }
    $r['match_pct'] = $total > 0 ? $matched / $total : 1.0;
    return $r;
}, $allRecipes);

// Sort by priority
usort($scored, function ($a, $b) use ($priority) {
    if ($priority === 'pantry' || $priority === 'wenig_einkaufen') {
        return $b['match_pct'] <=> $a['match_pct'];
    } elseif ($priority === 'variety' || $priority === 'abwechslung') {
        $aDate = $a['last_cooked'] ? strtotime($a['last_cooked']) : 0;
        $bDate = $b['last_cooked'] ? strtotime($b['last_cooked']) : 0;
        return $aDate <=> $bDate;
    }
    // schnell / balanced
    $aScore = $a['match_pct'] - ($a['last_cooked'] ? (time() - strtotime($a['last_cooked'])) / (86400 * 30) : 1);
    $bScore = $b['match_pct'] - ($b['last_cooked'] ? (time() - strtotime($b['last_cooked'])) / (86400 * 30) : 1);
    return $bScore <=> $aScore;
});

// Separate prep vs fresh recipes
$prepPool  = array_values(array_filter($scored, fn($r) =>  $r['is_meal_prep']));
$freshPool = array_values(array_filter($scored, fn($r) => !$r['is_meal_prep']));

// If preferCold: bias prep pool toward cold-edible
if ($preferCold) {
    usort($prepPool, fn($a, $b) => (int)$b['is_cold_edible'] <=> (int)$a['is_cold_edible']);
}

$slots = [];
$used  = [];

// ── NEW: day_assignments mode ────────────────────────────────────────────────
if (!empty($dayAssignments) && is_array($dayAssignments)) {
    $prepCursor  = 0;
    $freshCursor = 0;

    foreach ($dayAssignments as $assignment) {
        $dayIndex = (int)($assignment['day_index'] ?? 0);
        $slotType = ($assignment['slot_type'] ?? 'frisch') === 'prep' ? 'prep' : 'frisch';

        if ($slotType === 'prep') {
            // Pick next unused prep recipe
            $recipe = null;
            while ($prepCursor < count($prepPool)) {
                $r = $prepPool[$prepCursor++];
                if (!isset($used[$r['id']])) { $recipe = $r; break; }
            }
            // Fallback to fresh pool if no prep recipe available
            if (!$recipe) {
                while ($freshCursor < count($freshPool)) {
                    $r = $freshPool[$freshCursor++];
                    if (!isset($used[$r['id']])) { $recipe = $r; break; }
                }
            }
        } else {
            $recipe = null;
            while ($freshCursor < count($freshPool)) {
                $r = $freshPool[$freshCursor++];
                if (!isset($used[$r['id']])) { $recipe = $r; break; }
            }
            // Fallback to prep pool
            if (!$recipe) {
                while ($prepCursor < count($prepPool)) {
                    $r = $prepPool[$prepCursor++];
                    if (!isset($used[$r['id']])) { $recipe = $r; break; }
                }
            }
        }

        if (!$recipe) continue; // no recipes left

        $used[$recipe['id']] = true;
        $slots[] = [
            'recipe_id'       => $recipe['id'],
            'slot_type'       => $slotType,
            'day_index'       => $dayIndex,
            'portions'        => $recipe['batch_portions'] ?? $recipe['portions'] ?? 2,
            'name'            => $recipe['name'],
            'prep_time'       => $recipe['prep_time'],
            'is_meal_prep'    => (bool)$recipe['is_meal_prep'],
            'is_cold_edible'  => (bool)$recipe['is_cold_edible'],
            'shelf_life_days' => $recipe['shelf_life_days'],
            'image_url'       => $recipe['image_url'],
            'tags'            => $recipe['tags'] ? explode(',', $recipe['tags']) : [],
        ];
    }
} else {
    // ── LEGACY: meals_total / meals_prep mode ────────────────────────────────
    $prepCount  = 0;
    foreach ($prepPool as $r) {
        if ($prepCount >= $prepMeals) break;
        if (isset($used[$r['id']])) continue;
        $slots[] = [
            'recipe_id'       => $r['id'],
            'slot_type'       => 'prep',
            'day_index'       => 0,
            'portions'        => $r['batch_portions'] ?? $r['portions'] ?? 2,
            'name'            => $r['name'],
            'prep_time'       => $r['prep_time'],
            'is_meal_prep'    => true,
            'is_cold_edible'  => (bool)$r['is_cold_edible'],
            'shelf_life_days' => $r['shelf_life_days'],
            'image_url'       => $r['image_url'],
            'tags'            => $r['tags'] ? explode(',', $r['tags']) : [],
        ];
        $used[$r['id']] = true;
        $prepCount++;
    }

    $freshCount = 0;
    foreach ($freshPool as $r) {
        if ($freshCount >= $homeMeals) break;
        if (isset($used[$r['id']])) continue;
        $slots[] = [
            'recipe_id'       => $r['id'],
            'slot_type'       => 'frisch',
            'day_index'       => $freshCount + 1,
            'portions'        => $r['portions'] ?? 2,
            'name'            => $r['name'],
            'prep_time'       => $r['prep_time'],
            'is_meal_prep'    => false,
            'is_cold_edible'  => (bool)$r['is_cold_edible'],
            'shelf_life_days' => $r['shelf_life_days'],
            'image_url'       => $r['image_url'],
            'tags'            => $r['tags'] ? explode(',', $r['tags']) : [],
        ];
        $used[$r['id']] = true;
        $freshCount++;
    }
}

// Save plan
$db->prepare('DELETE FROM week_plan WHERE user_id = ? AND week = ? AND year = ?')
   ->execute([$user['id'], $week, $year]);

$saveStmt = $db->prepare('
    INSERT INTO week_plan (user_id, recipe_id, week, year, slot_type, day_index, portions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
');
foreach ($slots as $slot) {
    $saveStmt->execute([
        $user['id'], $slot['recipe_id'], $week, $year,
        $slot['slot_type'], $slot['day_index'], $slot['portions'],
    ]);
}

json_success(['week' => $week, 'year' => $year, 'slots' => $slots]);
