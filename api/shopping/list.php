<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$db   = get_db();

$stmt = $db->prepare('
    SELECT s.id, s.ingredient_id, s.qty, s.unit, s.checked AS is_checked, s.recipe_id,
           s.custom_name, i.name AS ingredient_name, i.supermarkt_kategorie,
           r.name AS recipe_names
    FROM shopping_list s
    LEFT JOIN ingredients i ON i.id = s.ingredient_id
    LEFT JOIN recipes r ON r.id = s.recipe_id
    WHERE s.user_id = ?
    ORDER BY i.supermarkt_kategorie, COALESCE(i.name, s.custom_name)
');
$stmt->execute([$user['id']]);
$items = $stmt->fetchAll();

foreach ($items as &$item) {
    $item['is_checked']           = (bool)$item['is_checked'];
    $item['qty']                  = (float)$item['qty'];
    $item['amount']               = $item['qty'] > 0 ? $item['qty'] . ($item['unit'] ? ' ' . $item['unit'] : '') : null;
    $item['supermarkt_kategorie'] = $item['supermarkt_kategorie'] ?? 'sonstiges';
}

json_success($items);
