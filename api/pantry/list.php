<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$db   = get_db();

$stmt = $db->prepare('
    SELECT p.id, p.ingredient_id, p.qty, p.unit, p.location, p.expires_at, p.immer_da,
           i.name AS ingredient_name, i.default_unit, i.supermarkt_kategorie
    FROM pantry p
    JOIN ingredients i ON i.id = p.ingredient_id
    WHERE p.user_id = ?
    ORDER BY i.name
');
$stmt->execute([$user['id']]);
$items = $stmt->fetchAll();

$qtyMap = function (float $qty): string {
    if ($qty >= 3) return 'viel';
    if ($qty >= 2) return 'wenig';
    return 'rest';
};

foreach ($items as &$item) {
    $item['immer_da'] = (bool)$item['immer_da'];
    $item['quantity'] = $item['immer_da'] ? 'viel' : $qtyMap((float)$item['qty']);
    unset($item['qty']);
}

json_success($items);
