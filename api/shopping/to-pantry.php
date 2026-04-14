<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();
// Optionally pass location override; default Kühlschrank
$location = sanitize($body['location'] ?? 'Kühlschrank');

$db = get_db();

// Fetch all checked items for user
$stmt = $db->prepare('
    SELECT s.id, s.ingredient_id, s.qty, s.unit,
           i.default_unit
    FROM shopping_list s
    JOIN ingredients i ON i.id = s.ingredient_id
    WHERE s.user_id = ? AND s.checked = 1
');
$stmt->execute([$user['id']]);
$items = $stmt->fetchAll();

if (empty($items)) {
    json_error('Keine abgehakten Artikel vorhanden');
}

$checkExisting = $db->prepare('
    SELECT id, qty FROM pantry
    WHERE user_id = ? AND ingredient_id = ? AND location = ?
    LIMIT 1
');
$updatePantry = $db->prepare('UPDATE pantry SET qty = qty + ? WHERE id = ?');
$insertPantry = $db->prepare('
    INSERT INTO pantry (user_id, ingredient_id, qty, unit, location)
    VALUES (?, ?, ?, ?, ?)
');
$deleteItem = $db->prepare('DELETE FROM shopping_list WHERE id = ?');

$db->beginTransaction();
try {
    foreach ($items as $item) {
        $checkExisting->execute([$user['id'], $item['ingredient_id'], $location]);
        $existing = $checkExisting->fetch();

        if ($existing) {
            $updatePantry->execute([$item['qty'], $existing['id']]);
        } else {
            $unit = $item['unit'] ?: $item['default_unit'];
            $insertPantry->execute([
                $user['id'],
                $item['ingredient_id'],
                $item['qty'],
                $unit,
                $location,
            ]);
        }
        $deleteItem->execute([$item['id']]);
    }
    $db->commit();
    json_success(['moved' => count($items)]);
} catch (Exception $e) {
    $db->rollBack();
    json_error('Fehler: ' . $e->getMessage(), 500);
}
