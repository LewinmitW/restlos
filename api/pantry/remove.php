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
$stmt = $db->prepare('DELETE FROM pantry WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);

if ($stmt->rowCount() === 0) json_error('Eintrag nicht gefunden', 404);

json_success();
