<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();
$week = (int)($body['week'] ?? (int)(new DateTime())->format('W'));
$year = (int)($body['year'] ?? (int)(new DateTime())->format('Y'));

$db = get_db();

// Get all planned recipes for this week
$stmt = $db->prepare('
    SELECT wp.recipe_id, wp.portions
    FROM week_plan wp
    WHERE wp.user_id = ? AND wp.week = ? AND wp.year = ?
');
$stmt->execute([$user['id'], $week, $year]);
$planned = $stmt->fetchAll();

if (empty($planned)) {
    json_error('Kein Wochenplan für diese Woche');
}

// Load pantry for matching
$stmt = $db->prepare('SELECT ingredient_id, qty, immer_da FROM pantry WHERE user_id = ?');
$stmt->execute([$user['id']]);
$pantryRows = $stmt->fetchAll();

$pantryQty = [];
$immerDa   = [];
foreach ($pantryRows as $row) {
    if ($row['immer_da']) {
        $immerDa[$row['ingredient_id']] = true;
    } else {
        $pantryQty[$row['ingredient_id']] = (float)$row['qty'];
    }
}

// For each recipe, collect ingredients missing from pantry
$ingStmt = $db->prepare('
    SELECT ri.ingredient_id, ri.amount, ri.unit, ri.optional,
           r.portions AS base_portions
    FROM recipe_ingredients ri
    JOIN recipes r ON r.id = ri.recipe_id
    WHERE ri.recipe_id = ?
');

$addStmt = $db->prepare('
    INSERT INTO shopping_list (user_id, ingredient_id, qty, unit, recipe_id)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)
');

// We use "ON DUPLICATE KEY" — need a UNIQUE KEY on (user_id, ingredient_id, recipe_id)
// Fallback: check existence first
$checkStmt  = $db->prepare('
    SELECT id, qty FROM shopping_list
    WHERE user_id = ? AND ingredient_id = ? AND (recipe_id = ? OR recipe_id IS NULL)
    LIMIT 1
');
$insertStmt = $db->prepare('
    INSERT INTO shopping_list (user_id, ingredient_id, qty, unit, recipe_id)
    VALUES (?, ?, ?, ?, ?)
');
$updateStmt = $db->prepare('UPDATE shopping_list SET qty = qty + ? WHERE id = ?');

$added = 0;
$db->beginTransaction();
try {
    foreach ($planned as $plan) {
        $ingStmt->execute([$plan['recipe_id']]);
        $ings = $ingStmt->fetchAll();

        $scale = $plan['portions'] > 0 && isset($ings[0]['base_portions'])
            ? $plan['portions'] / $ings[0]['base_portions']
            : 1;

        foreach ($ings as $ing) {
            if ($ing['optional']) continue;
            $iid = $ing['ingredient_id'];

            // Skip immer_da
            if (isset($immerDa[$iid])) continue;

            // Calculate how much is missing
            $needed    = $ing['amount'] * $scale;
            $available = $pantryQty[$iid] ?? 0;
            $missing   = max(0, $needed - $available);

            if ($missing <= 0.001) continue;

            $checkStmt->execute([$user['id'], $iid, $plan['recipe_id']]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                $updateStmt->execute([$missing, $existing['id']]);
            } else {
                $insertStmt->execute([$user['id'], $iid, $missing, $ing['unit'], $plan['recipe_id']]);
            }
            $added++;
        }
    }
    $db->commit();
    json_success(['added' => $added]);
} catch (Exception $e) {
    $db->rollBack();
    json_error('Fehler: ' . $e->getMessage(), 500);
}
