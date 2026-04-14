<?php
require_once __DIR__ . '/../config.php';

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 30, // 30 days
            'path'     => '/',
            'domain'   => '',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'None',
        ]);
        session_start();
    }
}

function require_auth(): array {
    start_session();
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'Nicht eingeloggt']));
    }
    return [
        'id'    => $_SESSION['user_id'],
        'email' => $_SESSION['user_email'] ?? '',
        'name'  => $_SESSION['user_name'] ?? '',
    ];
}

function get_user(): ?array {
    start_session();
    if (empty($_SESSION['user_id'])) return null;
    return [
        'id'    => $_SESSION['user_id'],
        'email' => $_SESSION['user_email'] ?? '',
        'name'  => $_SESSION['user_name'] ?? '',
    ];
}
