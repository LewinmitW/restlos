<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$user = get_user();
if ($user) {
    json_success($user);
} else {
    json_error('Nicht eingeloggt', 401);
}
