<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$db   = get_db();

$stmt = $db->prepare('
    SELECT r.id, r.name, r.category, r.prep_time, r.portions, r.is_meal_prep,
           r.kalt_essbar, r.shelf_life_days, r.batch_portions,
           r.tags, r.image_url, r.favorite, r.last_cooked, r.notes,
           (SELECT GROUP_CONCAT(ri.ingredient_id, ":", ri.amount, ":", ri.unit, ":", ri.optional
                   ORDER BY ri.sort_order SEPARATOR "|")
            FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredients_raw
    FROM recipes r
    WHERE r.user_id = ?
    ORDER BY r.name
');
$stmt->execute([$user['id']]);
$rows = $stmt->fetchAll();

$recipes = array_map(function ($r) {
    $r['tags']        = $r['tags'] ? explode(',', $r['tags']) : [];
    $r['favorite']    = (bool)$r['favorite'];
    $r['is_meal_prep'] = (bool)$r['is_meal_prep'];
    $r['kalt_essbar'] = (bool)$r['kalt_essbar'];
    $r['ingredients'] = [];
    if ($r['ingredients_raw']) {
        foreach (explode('|', $r['ingredients_raw']) as $part) {
            [$iid, $amt, $unit, $opt] = explode(':', $part, 4);
            $r['ingredients'][] = [
                'ingredient_id' => (int)$iid,
                'amount'        => (float)$amt,
                'unit'          => $unit,
                'optional'      => (bool)$opt,
            ];
        }
    }
    unset($r['ingredients_raw']);
    return $r;
}, $rows);

json_success($recipes);
