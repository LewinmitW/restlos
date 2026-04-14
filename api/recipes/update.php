<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();
$id   = (int)($body['id'] ?? 0);
if (!$id) json_error('ID fehlt');

$db   = get_db();
$stmt = $db->prepare('SELECT id FROM recipes WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
if (!$stmt->fetch()) json_error('Rezept nicht gefunden', 404);

$name = sanitize($body['name'] ?? '');
if (!$name) json_error('Name erforderlich');

$db->beginTransaction();

try {
    $stmt = $db->prepare('
        UPDATE recipes SET
            name = ?, category = ?, prep_time = ?, portions = ?, is_meal_prep = ?,
            kalt_essbar = ?, shelf_life_days = ?, batch_portions = ?,
            tags = ?, notes = ?, favorite = ?
        WHERE id = ? AND user_id = ?
    ');
    $stmt->execute([
        $name,
        sanitize($body['category'] ?? ''),
        (int)($body['prep_time'] ?? 0),
        (int)($body['portions'] ?? 1),
        (int)($body['is_meal_prep'] ?? 0),
        (int)($body['kalt_essbar'] ?? 0),
        isset($body['shelf_life_days']) ? (int)$body['shelf_life_days'] : null,
        isset($body['batch_portions']) ? (int)$body['batch_portions'] : null,
        implode(',', array_map('trim', (array)($body['tags'] ?? []))),
        sanitize($body['notes'] ?? ''),
        (int)($body['favorite'] ?? 0),
        $id,
        $user['id'],
    ]);

    $db->prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM recipe_steps WHERE recipe_id = ?')->execute([$id]);

    $ingStmt = $db->prepare('
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, optional, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    foreach ((array)($body['ingredients'] ?? []) as $i => $ing) {
        $ingStmt->execute([
            $id,
            (int)$ing['ingredient_id'],
            (float)($ing['amount'] ?? 0),
            sanitize($ing['unit'] ?? ''),
            (int)($ing['optional'] ?? 0),
            $i,
        ]);
    }

    $stepStmt = $db->prepare('INSERT INTO recipe_steps (recipe_id, step_nr, description) VALUES (?, ?, ?)');
    foreach ((array)($body['steps'] ?? []) as $i => $step) {
        $stepStmt->execute([$id, $i + 1, sanitize($step)]);
    }

    $db->commit();
    json_success(['id' => $id]);
} catch (Exception $e) {
    $db->rollBack();
    json_error('Fehler beim Speichern: ' . $e->getMessage(), 500);
}
