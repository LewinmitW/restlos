<?php
/**
 * Restlos — DB Migration
 * Run once: https://api.restlos.lewinstrobl.com/migrate.php?token=restlos-migrate-2024
 * DELETE this file afterwards!
 */

require_once __DIR__ . '/config.php';

$token = $_GET['token'] ?? '';
if ($token !== 'restlos-migrate-2024') {
    http_response_code(403);
    die('Forbidden. Add ?token=restlos-migrate-2024');
}

$pdo = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$migrations = [
    // Allow NULL ingredient_id for custom shopping items
    'shopping_list_nullable_ingredient' => "
        ALTER TABLE shopping_list
        MODIFY COLUMN ingredient_id INT UNSIGNED NULL,
        ADD COLUMN IF NOT EXISTS custom_name VARCHAR(200) NULL AFTER ingredient_id
    ",
    // Ensure image_url exists on recipes (may already exist)
    'recipes_image_url' => "
        ALTER TABLE recipes
        ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL
    ",
];

$results = [];
foreach ($migrations as $name => $sql) {
    try {
        $pdo->exec(trim($sql));
        $results[$name] = 'OK';
    } catch (PDOException $e) {
        $results[$name] = 'ERROR: ' . $e->getMessage();
    }
}

header('Content-Type: application/json');
echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT);
