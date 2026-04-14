<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$db   = get_db();

$stmt = $db->prepare('
    SELECT s.id, s.ingredient_id, s.qty, s.unit, s.checked, s.recipe_id,
           i.name, i.supermarkt_kategorie,
           r.name AS recipe_name
    FROM shopping_list s
    JOIN ingredients i ON i.id = s.ingredient_id
    LEFT JOIN recipes r ON r.id = s.recipe_id
    WHERE s.user_id = ?
    ORDER BY i.supermarkt_kategorie, i.name
');
$stmt->execute([$user['id']]);
$items = $stmt->fetchAll();

foreach ($items as &$item) {
    $item['checked'] = (bool)$item['checked'];
    $item['qty']     = (float)$item['qty'];
}

json_success($items);
