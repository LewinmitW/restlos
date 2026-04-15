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

// Map qty label to numeric
$qtyLabel  = $body['quantity'] ?? 'viel';
$qtyLabels = ['viel' => 3, 'wenig' => 2, 'rest' => 1];
$qty       = (float)($qtyLabels[$qtyLabel] ?? 3);

$unit      = sanitize($body['unit'] ?? '');
$location  = sanitize($body['location'] ?? 'kuehlschrank');
$expiresAt = $body['expires_at'] ?? null;
$immerDa   = ($location === 'immer_da') ? 1 : (int)($body['immer_da'] ?? 0);

$db = get_db();

// Verify ingredient exists and get its name
$ingStmt = $db->prepare('SELECT id, name, default_unit FROM ingredients WHERE id = ?');
$ingStmt->execute([$ingredientId]);
$ingredient = $ingStmt->fetch();
if (!$ingredient) json_error('Zutat nicht gefunden', 404);

// Upsert: if same ingredient+location exists, update qty
$stmt = $db->prepare('
    SELECT id, qty FROM pantry
    WHERE user_id = ? AND ingredient_id = ? AND location = ?
    LIMIT 1
');
$stmt->execute([$user['id'], $ingredientId, $location]);
$existing = $stmt->fetch();

if ($existing) {
    $db->prepare('UPDATE pantry SET qty = ?, expires_at = ?, immer_da = ? WHERE id = ?')
       ->execute([$qty, $expiresAt, $immerDa, $existing['id']]);
    $newId = $existing['id'];
} else {
    $unit = $unit ?: $ingredient['default_unit'];
    $db->prepare('
        INSERT INTO pantry (user_id, ingredient_id, qty, unit, location, expires_at, immer_da)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ')->execute([$user['id'], $ingredientId, $qty, $unit, $location, $expiresAt, $immerDa]);
    $newId = (int)$db->lastInsertId();
}

json_success([
    'id'              => $newId,
    'ingredient_id'   => $ingredientId,
    'ingredient_name' => $ingredient['name'],
    'quantity'        => $qtyLabel,
    'unit'            => $unit ?: $ingredient['default_unit'],
    'location'        => $location,
    'expires_at'      => $expiresAt,
    'immer_da'        => (bool)$immerDa,
], 201);
