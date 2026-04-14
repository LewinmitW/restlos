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
$stmt = $db->prepare('SELECT id FROM pantry WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
if (!$stmt->fetch()) json_error('Eintrag nicht gefunden', 404);

$fields = [];
$vals   = [];

if (isset($body['qty']))        { $fields[] = 'qty = ?';        $vals[] = (float)$body['qty']; }
if (isset($body['unit']))       { $fields[] = 'unit = ?';       $vals[] = sanitize($body['unit']); }
if (isset($body['location']))   { $fields[] = 'location = ?';   $vals[] = sanitize($body['location']); }
if (isset($body['expires_at'])) { $fields[] = 'expires_at = ?'; $vals[] = $body['expires_at']; }
if (isset($body['immer_da']))   { $fields[] = 'immer_da = ?';   $vals[] = (int)$body['immer_da']; }

if (empty($fields)) json_error('Keine Felder zum Aktualisieren');

$vals[] = $id;
$vals[] = $user['id'];
$db->prepare('UPDATE pantry SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?')
   ->execute($vals);

json_success();
