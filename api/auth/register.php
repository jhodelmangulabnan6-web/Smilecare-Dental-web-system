<?php
require_once __DIR__ . '/config.php';

$data = json_decode(file_get_contents("php://input"), true);

$firstName = trim($data['firstName'] ?? '');
$lastName  = trim($data['lastName']  ?? '');
$email     = strtolower(trim($data['email'] ?? ''));
$emailParts = explode('@', $email);
$domain = count($emailParts) === 2 ? $emailParts[1] : '';
$allowedDomains = ['gmail.com', 'yahoo.com'];
if (!in_array($domain, $allowedDomains)) {
    http_response_code(400);
    echo json_encode(['message' => 'Only @gmail.com or @yahoo.com email addresses are allowed.']);
    exit();
}
$phone     = trim($data['phone']    ?? '');
$dob       = $data['dob']           ?? null;
$gender    = $data['gender']        ?? null;
$password  = $data['password']      ?? '';

if (!$firstName || !$lastName || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['message' => 'Please fill in all required fields.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['message' => 'Email already registered.']);
    exit();
}

$hashed = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("
    INSERT INTO users (first_name, last_name, email, phone, date_of_birth, gender, password)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$firstName, $lastName, $email, $phone, $dob, $gender, $hashed]);

echo json_encode([
    'message'  => 'Account created.',
    'fullName' => $firstName . ' ' . $lastName,
    'email'    => $email
]);