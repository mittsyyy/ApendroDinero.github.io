<?php
include 'db.php';

// Traemos los datos. Usamos COALESCE para el progreso por si aún no hay registros
$sql = "SELECT id, titulo AS title, descripcion AS `desc`, 0 AS progress FROM modulos WHERE activo = 1";
$result = $conn->query($sql);

$datos = [];
while($row = $result->fetch_assoc()) {
    $datos[] = $row;
}

header('Content-Type: application/json');
echo json_encode($datos);
?>