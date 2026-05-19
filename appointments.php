<?php
require '../../config.php';

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $pdo->prepare("
    INSERT INTO appointment 
        (patient_email, service, price, dentist, date, time, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
");
$stmt->execute([
    $data['patientEmail'],
    $data['service'],
    $data['price'],
    $data['dentist'],
    $data['date'],
    $data['time'],
    $data['notes'] ?? '—'
]);

echo json_encode(['message' => 'Appointment booked.']);