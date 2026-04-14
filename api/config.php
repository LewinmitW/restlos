<?php
// ============================================
// Restlos — Datenbank-Konfiguration
// Auf Hetzner ausfüllen!
// ============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'restlos');
define('DB_USER', 'root');
define('DB_PASS', '');

define('API_URL',      'https://api.restlos.lewinstrobl.com');
define('FRONTEND_URL', 'https://restlos.lewinstrobl.com');
define('APP_NAME',     'Restlos');

// Upload
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_DIR',      __DIR__ . '/uploads/recipes/');
