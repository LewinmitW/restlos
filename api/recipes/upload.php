<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$user     = require_auth();
$recipeId = (int)($_POST['recipe_id'] ?? 0);

// Verify recipe belongs to user
$db   = get_db();
$stmt = $db->prepare('SELECT id FROM recipes WHERE id = ? AND user_id = ?');
$stmt->execute([$recipeId, $user['id']]);
if (!$stmt->fetch()) json_error('Rezept nicht gefunden', 404);

if (empty($_FILES['image'])) json_error('Kein Bild hochgeladen');

$file     = $_FILES['image'];
$maxSize  = defined('UPLOAD_MAX_SIZE') ? UPLOAD_MAX_SIZE : 2 * 1024 * 1024;
$uploadDir = defined('UPLOAD_DIR') ? UPLOAD_DIR : __DIR__ . '/../uploads/recipes/';

if ($file['error'] !== UPLOAD_ERR_OK)    json_error('Upload-Fehler: ' . $file['error']);
if ($file['size'] > $maxSize)            json_error('Datei zu groß (max 2MB)');

// Validate MIME
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mimeType, $allowed)) json_error('Nur JPG, PNG, WebP oder GIF erlaubt');

// Build filename
$ext      = match($mimeType) {
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    default      => 'gif',
};
$filename = 'recipe_' . $recipeId . '_' . time() . '.' . $ext;
$destPath = rtrim($uploadDir, '/') . '/' . $filename;

// Ensure upload directory exists
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

if (!move_uploaded_file($file['tmp_name'], $destPath)) json_error('Speichern fehlgeschlagen');

// Build public URL
$imageUrl = (defined('API_URL') ? API_URL : '') . '/uploads/recipes/' . $filename;

// Update DB
$db->prepare('UPDATE recipes SET image_url = ? WHERE id = ? AND user_id = ?')
   ->execute([$imageUrl, $recipeId, $user['id']]);

json_success(['image_url' => $imageUrl]);
