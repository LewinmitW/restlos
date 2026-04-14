<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = require_auth();
$db   = get_db();

$week = isset($_GET['week']) ? (int)$_GET['week'] : null;
$year = isset($_GET['year']) ? (int)$_GET['year'] : null;

if (!$week || !$year) {
    $now  = new DateTime();
    $week = (int)$now->format('W');
    $year = (int)$now->format('Y');
}

$stmt = $db->prepare('
    SELECT wp.id, wp.recipe_id, wp.slot_type, wp.day_index, wp.portions,
           r.name, r.category, r.prep_time, r.is_meal_prep, r.kalt_essbar,
           r.image_url, r.tags
    FROM week_plan wp
    JOIN recipes r ON r.id = wp.recipe_id
    WHERE wp.user_id = ? AND wp.week = ? AND wp.year = ?
    ORDER BY wp.day_index, wp.slot_type
');
$stmt->execute([$user['id'], $week, $year]);
$slots = $stmt->fetchAll();

foreach ($slots as &$slot) {
    $slot['is_meal_prep'] = (bool)$slot['is_meal_prep'];
    $slot['kalt_essbar']  = (bool)$slot['kalt_essbar'];
    $slot['tags']         = $slot['tags'] ? explode(',', $slot['tags']) : [];
}

json_success([
    'week'  => $week,
    'year'  => $year,
    'slots' => $slots,
]);
