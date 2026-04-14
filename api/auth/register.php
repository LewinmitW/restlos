<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', 405);
}

$body  = get_body();
$name  = sanitize($body['name'] ?? '');
$email = trim($body['email'] ?? '');
$pass  = $body['password'] ?? '';

if (!$name || !$email || !$pass) {
    json_error('Name, E-Mail und Passwort erforderlich');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Ungültige E-Mail-Adresse');
}
if (strlen($pass) < 8) {
    json_error('Passwort muss mindestens 8 Zeichen haben');
}

$db   = get_db();
$stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_error('E-Mail bereits registriert', 409);
}

$hash = password_hash($pass, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);
$userId = (int)$db->lastInsertId();

start_session();
$_SESSION['user_id']    = $userId;
$_SESSION['user_email'] = $email;
$_SESSION['user_name']  = $name;

json_success(['id' => $userId, 'email' => $email, 'name' => $name], 201);
