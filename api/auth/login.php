<?php
require_once __DIR__ . '/config.php';

$data  = json_decode(file_get_contents("php://input"), true);
$email = strtolower(trim($data['email'] ?? ''));
$pass  = $data['password'] ?? '';

if (!$email || !$pass) {
    http_response_code(400);
    echo json_encode(['message' => 'Email and password are required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($pass, $user['password'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid email or password.']);
    exit();
}

echo json_encode([
    'message'  => 'Login successful.',
    'fullName' => $user['first_name'] . ' ' . $user['last_name'],
    'email'    => $user['email']
]);