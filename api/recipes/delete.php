<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user = require_auth();
$body = get_body();
$id   = (int)($body['id'] ?? $_GET['id'] ?? 0);
if (!$id) json_error('ID fehlt');

$db   = get_db();
$stmt = $db->prepare('SELECT id FROM recipes WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
if (!$stmt->fetch()) json_error('Rezept nicht gefunden', 404);

// Cascade handled by FK constraints, but also clean up manually for safety
$db->prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?')->execute([$id]);
$db->prepare('DELETE FROM recipe_steps WHERE recipe_id = ?')->execute([$id]);
$db->prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);

json_success();
