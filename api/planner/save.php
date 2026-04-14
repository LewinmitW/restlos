<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();

$week  = (int)($body['week'] ?? 0);
$year  = (int)($body['year'] ?? 0);
$slots = (array)($body['slots'] ?? []);

if (!$week || !$year) json_error('week/year fehlen');

$db = get_db();
$db->beginTransaction();

try {
    // Clear existing plan for this week
    $db->prepare('DELETE FROM week_plan WHERE user_id = ? AND week = ? AND year = ?')
       ->execute([$user['id'], $week, $year]);

    $stmt = $db->prepare('
        INSERT INTO week_plan (user_id, recipe_id, week, year, slot_type, day_index, portions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');

    foreach ($slots as $slot) {
        $stmt->execute([
            $user['id'],
            (int)$slot['recipe_id'],
            $week,
            $year,
            sanitize($slot['slot_type'] ?? 'frisch'),
            (int)($slot['day_index'] ?? 0),
            (int)($slot['portions'] ?? 1),
        ]);
    }

    $db->commit();
    json_success();
} catch (Exception $e) {
    $db->rollBack();
    json_error('Fehler: ' . $e->getMessage(), 500);
}
