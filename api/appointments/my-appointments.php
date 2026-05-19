<?php
require_once __DIR__ . '/../auth/config.php';

$email = $_GET['email'] ?? '';

$stmt = $pdo->prepare("
    SELECT a.*, CONCAT(u.first_name,' ',u.last_name) AS patientName
    FROM appointments a
    JOIN users u ON u.email = a.patient_email
    WHERE a.patient_email = ?
    ORDER BY a.created_at DESC
");
$stmt->execute([$email]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($rows);