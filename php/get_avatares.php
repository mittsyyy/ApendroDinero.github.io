<?php
// 1. Incluimos la conexión que ya configuraste
include 'db.php'; 

// 2. Preparamos la consulta para traer los avatares desbloqueados
$sql = "SELECT id, nombre, emoji, color_fondo FROM avatares WHERE desbloqueado = 1";
$result = $conn->query($sql);

$avatares = [];

if ($result->num_rows > 0) {
    // 3. Recorremos los resultados y los metemos a un arreglo
    while($row = $result->fetch_assoc()) {
        $avatares[] = $row;
    }
}

// 4. Lo mandamos al frontend en formato JSON
header('Content-Type: application/json');
echo json_encode($avatares);

$conn->close();
?>