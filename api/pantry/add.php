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
$location = sanitize($body['location'] ?? 'Vorratsschrank');
$expiresAt = $body['expires_at'] ?? null;
$immerDa  = (int)($body['immer_da'] ?? 0);

$db = get_db();

// Upsert: if same ingredient+location exists, update qty
$stmt = $db->prepare('
    SELECT id, qty FROM pantry
    WHERE user_id = ? AND ingredient_id = ? AND location = ?
    LIMIT 1
');
$stmt->execute([$user['id'], $ingredientId, $location]);
$existing = $stmt->fetch();

if ($existing) {
    $db->prepare('UPDATE pantry SET qty = qty + ?, expires_at = ?, immer_da = ? WHERE id = ?')
       ->execute([$qty, $expiresAt, $immerDa, $existing['id']]);
    json_success(['id' => $existing['id']]);
} else {
    $db->prepare('
        INSERT INTO pantry (user_id, ingredient_id, qty, unit, location, expires_at, immer_da)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ')->execute([$user['id'], $ingredientId, $qty, $unit, $location, $expiresAt, $immerDa]);
    json_success(['id' => (int)$db->lastInsertId()], 201);
}
