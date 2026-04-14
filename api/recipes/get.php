<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$id   = (int)($_GET['id'] ?? 0);
if (!$id) json_error('ID fehlt');

$db   = get_db();
$stmt = $db->prepare('SELECT * FROM recipes WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
$recipe = $stmt->fetch();
if (!$recipe) json_error('Rezept nicht gefunden', 404);

// Ingredients with name
$stmt = $db->prepare('
    SELECT ri.ingredient_id, ri.amount, ri.unit, ri.optional, ri.sort_order,
           i.name AS ingredient_name, i.default_unit, i.supermarkt_kategorie
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = ?
    ORDER BY ri.sort_order
');
$stmt->execute([$id]);
$recipe['ingredients'] = $stmt->fetchAll();

// Steps
$stmt = $db->prepare('SELECT step_nr, description FROM recipe_steps WHERE recipe_id = ? ORDER BY step_nr');
$stmt->execute([$id]);
$recipe['steps'] = array_column($stmt->fetchAll(), 'description');

$recipe['tags']         = $recipe['tags'] ? explode(',', $recipe['tags']) : [];
$recipe['favorite']     = (bool)$recipe['favorite'];
$recipe['is_meal_prep'] = (bool)$recipe['is_meal_prep'];
$recipe['kalt_essbar']  = (bool)$recipe['kalt_essbar'];

foreach ($recipe['ingredients'] as &$ing) {
    $ing['optional'] = (bool)$ing['optional'];
    $ing['amount']   = (float)$ing['amount'];
}

json_success($recipe);
