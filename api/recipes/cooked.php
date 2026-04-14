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

// Update last_cooked timestamp
$db->prepare('UPDATE recipes SET last_cooked = NOW() WHERE id = ? AND user_id = ?')
   ->execute([$id, $user['id']]);

// Optionally deduct from pantry
if (!empty($body['deduct_pantry'])) {
    $portions    = (int)($body['portions'] ?? 1);
    $basePortion = (int)($body['base_portions'] ?? 1);

    $ingStmt = $db->prepare('
        SELECT ri.ingredient_id, ri.amount, ri.optional
        FROM recipe_ingredients ri
        WHERE ri.recipe_id = ?
    ');
    $ingStmt->execute([$id]);
    $ingredients = $ingStmt->fetchAll();

    $pantryStmt = $db->prepare('
        SELECT id, qty, immer_da FROM pantry WHERE user_id = ? AND ingredient_id = ?
    ');
    $updateStmt = $db->prepare('UPDATE pantry SET qty = GREATEST(0, qty - ?) WHERE id = ?');
    $deleteStmt = $db->prepare('DELETE FROM pantry WHERE id = ?');

    foreach ($ingredients as $ing) {
        if ($ing['optional']) continue;
        $pantryStmt->execute([$user['id'], $ing['ingredient_id']]);
        $pantryItem = $pantryStmt->fetch();
        if (!$pantryItem || $pantryItem['immer_da']) continue;

        $scaled = $basePortion > 0 ? ($ing['amount'] * $portions / $basePortion) : $ing['amount'];
        $newQty = $pantryItem['qty'] - $scaled;
        if ($newQty <= 0) {
            $deleteStmt->execute([$pantryItem['id']]);
        } else {
            $updateStmt->execute([$scaled, $pantryItem['id']]);
        }
    }
}

json_success();
