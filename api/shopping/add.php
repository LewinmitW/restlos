<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();
$db   = get_db();

$ingredientId = isset($body['ingredient_id']) ? (int)$body['ingredient_id'] : null;
$customName   = isset($body['custom_name']) ? sanitize($body['custom_name']) : null;

if (!$ingredientId && !$customName) json_error('ingredient_id oder custom_name fehlt');

$qty      = (float)($body['qty'] ?? 1);
$unit     = sanitize($body['unit'] ?? '');
$recipeId = isset($body['recipe_id']) ? (int)$body['recipe_id'] : null;

if ($ingredientId) {
    // Known ingredient: upsert by ingredient+recipe
    $stmt = $db->prepare('
        SELECT id FROM shopping_list
        WHERE user_id = ? AND ingredient_id = ? AND (recipe_id = ? OR (recipe_id IS NULL AND ? IS NULL))
        LIMIT 1
    ');
    $stmt->execute([$user['id'], $ingredientId, $recipeId, $recipeId]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare('UPDATE shopping_list SET qty = qty + ?, checked = 0 WHERE id = ?')
           ->execute([$qty, $existing['id']]);
        $newId = $existing['id'];
    } else {
        $db->prepare('
            INSERT INTO shopping_list (user_id, ingredient_id, qty, unit, recipe_id)
            VALUES (?, ?, ?, ?, ?)
        ')->execute([$user['id'], $ingredientId, $qty, $unit, $recipeId]);
        $newId = (int)$db->lastInsertId();
    }

    // Return full item
    $itemStmt = $db->prepare('
        SELECT s.id, s.ingredient_id, s.qty, s.unit, s.checked AS is_checked,
               s.custom_name, i.name AS ingredient_name, i.supermarkt_kategorie,
               r.name AS recipe_names
        FROM shopping_list s
        JOIN ingredients i ON i.id = s.ingredient_id
        LEFT JOIN recipes r ON r.id = s.recipe_id
        WHERE s.id = ?
    ');
    $itemStmt->execute([$newId]);
    $item = $itemStmt->fetch();
    $item['is_checked'] = (bool)$item['is_checked'];
    $item['qty']        = (float)$item['qty'];
    $item['amount']     = $item['qty'] > 0 ? $item['qty'] . ($item['unit'] ? ' ' . $item['unit'] : '') : null;
    json_success($item, 201);
} else {
    // Custom item (no ingredient_id)
    $db->prepare('
        INSERT INTO shopping_list (user_id, ingredient_id, custom_name, qty, unit)
        VALUES (?, NULL, ?, ?, ?)
    ')->execute([$user['id'], $customName, $qty, $unit]);
    $newId = (int)$db->lastInsertId();

    json_success([
        'id'                   => $newId,
        'ingredient_id'        => null,
        'custom_name'          => $customName,
        'ingredient_name'      => null,
        'qty'                  => $qty,
        'unit'                 => $unit,
        'amount'               => null,
        'is_checked'           => false,
        'recipe_id'            => null,
        'recipe_names'         => null,
        'supermarkt_kategorie' => 'sonstiges',
    ], 201);
}
