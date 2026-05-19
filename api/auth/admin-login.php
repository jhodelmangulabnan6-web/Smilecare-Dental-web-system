<?php
require_once __DIR__ . '/config.php';


$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$pass     = $data['password']      ?? '';

if (!$username || !$pass) {
    http_response_code(400);
    echo json_encode(['message' => 'Credentials required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT * FROM admin WHERE username = ?");
$stmt->execute([$username]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || !password_verify($pass, $admin['password'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid admin credentials.']);
    exit();
}

echo json_encode(['message' => 'Admin login successful.']);