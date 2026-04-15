<?php
// ============================================
// Restlos — Datenbank-Konfiguration
// Auf Hetzner ausfüllen!
// ============================================

define('DB_HOST', 'l308.your-database.de');
define('DB_NAME', 'restlos');
define('DB_USER', 'restlos_0');
define('DB_PASS', 'y2&A{FkZ!A3@');

define('API_URL',      'https://api.restlos.lewinstrobl.com');
define('FRONTEND_URL', 'https://restlos.lewinstrobl.com');
define('APP_NAME',     'Restlos');

// Upload
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_DIR',      __DIR__ . '/uploads/recipes/');
