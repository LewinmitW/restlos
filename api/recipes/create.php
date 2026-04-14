<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();

$name     = sanitize($body['name'] ?? '');
$category = sanitize($body['category'] ?? '');
if (!$name) json_error('Name erforderlich');

$db = get_db();
$db->beginTransaction();

try {
    $stmt = $db->prepare('
        INSERT INTO recipes
            (user_id, name, category, prep_time, portions, is_meal_prep,
             kalt_essbar, shelf_life_days, batch_portions, tags, notes, favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $user['id'],
        $name,
        $category,
        (int)($body['prep_time'] ?? 0),
        (int)($body['portions'] ?? 1),
        (int)($body['is_meal_prep'] ?? 0),
        (int)($body['kalt_essbar'] ?? 0),
        isset($body['shelf_life_days']) ? (int)$body['shelf_life_days'] : null,
        isset($body['batch_portions']) ? (int)$body['batch_portions'] : null,
        implode(',', array_map('trim', (array)($body['tags'] ?? []))),
        sanitize($body['notes'] ?? ''),
        (int)($body['favorite'] ?? 0),
    ]);
    $recipeId = (int)$db->lastInsertId();

    // Ingredients
    $ingStmt = $db->prepare('
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, optional, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    foreach ((array)($body['ingredients'] ?? []) as $i => $ing) {
        $ingStmt->execute([
            $recipeId,
            (int)$ing['ingredient_id'],
            (float)($ing['amount'] ?? 0),
            sanitize($ing['unit'] ?? ''),
            (int)($ing['optional'] ?? 0),
            $i,
        ]);
    }

    // Steps
    $stepStmt = $db->prepare('INSERT INTO recipe_steps (recipe_id, step_nr, description) VALUES (?, ?, ?)');
    foreach ((array)($body['steps'] ?? []) as $i => $step) {
        $stepStmt->execute([$recipeId, $i + 1, sanitize($step)]);
    }

    $db->commit();
    json_success(['id' => $recipeId], 201);
} catch (Exception $e) {
    $db->rollBack();
    json_error('Fehler beim Speichern: ' . $e->getMessage(), 500);
}
