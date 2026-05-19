<?php
require_once __DIR__ . '/../auth/config.php';
require_once __DIR__ . '/../../auth/send_sms.php';

$id = $_GET['id'] ?? 0;

$stmt = $pdo->prepare("UPDATE appointments SET status = 'Confirmed' WHERE id = ?");
$stmt->execute([$id]);

$stmt = $pdo->prepare("
    SELECT a.*,
           CONCAT(u.first_name, ' ', u.last_name) AS patientName,
           u.phone AS patientPhone
    FROM appointments a
    JOIN users u ON u.email = a.patient_email
    WHERE a.id = ?
");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

// Send SMS
if (!empty($row['patientPhone'])) {
    $message = "Hi {$row['patientName']}! Your SmileCare appointment for {$row['service']} on {$row['date']} at {$row['time']} with {$row['dentist']} has been CONFIRMED. See you then!";
    sendSMS($row['patientPhone'], $message);
}

echo json_encode([
    'message'      => 'Appointment Confirmed.',
    'patientName'  => $row['patientName']  ?? '',
    'patientPhone' => $row['patientPhone'] ?? '',
    'service'      => $row['service']      ?? '',
    'date'         => $row['date']         ?? '',
    'time'         => $row['time']         ?? '',
    'dentist'      => $row['dentist']      ?? '',
]);