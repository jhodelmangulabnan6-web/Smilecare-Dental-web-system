<?php
require_once __DIR__ . '/../auth/config.php';

$id     = $_GET['id'] ?? 0;
$status = 'Cancelled';

$stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
$stmt->execute([$status, $id]);

echo json_encode(['message' => "Appointment $status."]);