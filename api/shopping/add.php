<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();

$ingredientId = (int)($body['ingredient_id'] ?? 0);
if (!$ingredientId) json_error('ingredient_id fehlt');

$qty      = (float)($body['qty'] ?? 1);
$unit     = sanitize($body['unit'] ?? '');
$recipeId = isset($body['recipe_id']) ? (int)$body['recipe_id'] : null;

$db = get_db();

// If same ingredient+recipe already on list, add to qty
$stmt = $db->prepare('
    SELECT id, qty FROM shopping_list
    WHERE user_id = ? AND ingredient_id = ? AND (recipe_id = ? OR (recipe_id IS NULL AND ? IS NULL))
    LIMIT 1
');
$stmt->execute([$user['id'], $ingredientId, $recipeId, $recipeId]);
$existing = $stmt->fetch();

if ($existing) {
    $db->prepare('UPDATE shopping_list SET qty = qty + ?, checked = 0 WHERE id = ?')
       ->execute([$qty, $existing['id']]);
    json_success(['id' => $existing['id']]);
} else {
    $db->prepare('
        INSERT INTO shopping_list (user_id, ingredient_id, qty, unit, recipe_id)
        VALUES (?, ?, ?, ?, ?)
    ')->execute([$user['id'], $ingredientId, $qty, $unit, $recipeId]);
    json_success(['id' => (int)$db->lastInsertId()], 201);
}
