<?php
require_once __DIR__ . '/../auth/config.php';


$id = $_GET['id'] ?? 0;

$stmt = $pdo->prepare("UPDATE appointments SET status = 'Rejected' WHERE id = ?");
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
    $message = "Hi {$row['patientName']}! Unfortunately your SmileCare appointment for {$row['service']} on {$row['date']} has been rejected. Please contact us to reschedule.";
    sendSMS($row['patientPhone'], $message);
}

echo json_encode([
    'message'      => 'Appointment Rejected.',
    'patientName'  => $row['patientName']  ?? '',
    'patientPhone' => $row['patientPhone'] ?? '',
    'service'      => $row['service']      ?? '',
    'date'         => $row['date']         ?? '',
]);