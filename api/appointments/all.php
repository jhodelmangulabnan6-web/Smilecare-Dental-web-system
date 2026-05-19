<?php
require_once __DIR__ . '/../auth/config.php';

$stmt = $pdo->query("
    SELECT a.*, 
           CONCAT(u.first_name,' ',u.last_name) AS patientName,
           u.email AS patientEmail,
           u.phone AS patientPhone
    FROM appointments a
    JOIN users u ON u.email = a.patient_email
    ORDER BY a.created_at DESC
");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($rows);