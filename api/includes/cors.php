<?php
/**
 * CORS Headers für Cross-Domain Requests
 * von restlos.lewinstrobl.com → api.restlos.lewinstrobl.com
 */
function send_cors_headers() {
    $allowed = [
        'https://restlos.lewinstrobl.com',
        'http://localhost:5173',
        'http://localhost:4173',
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed)) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

send_cors_headers();
header('Content-Type: application/json; charset=utf-8');
