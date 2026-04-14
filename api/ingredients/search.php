<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

require_auth();

$q    = trim($_GET['q'] ?? '');
$limit = min((int)($_GET['limit'] ?? 20), 50);

$db = get_db();

if ($q === '') {
    // Return popular/common ingredients
    $stmt = $db->prepare('SELECT id, name, default_unit, supermarkt_kategorie FROM ingredients ORDER BY name LIMIT ?');
    $stmt->execute([$limit]);
} else {
    $stmt = $db->prepare('
        SELECT id, name, default_unit, supermarkt_kategorie
        FROM ingredients
        WHERE name LIKE ?
        ORDER BY
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            name
        LIMIT ?
    ');
    $stmt->execute(['%' . $q . '%', $q . '%', $limit]);
}

json_success($stmt->fetchAll());
