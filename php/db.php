<?php
$host = "sql212.infinityfree.com";
$user = "if0_41904034";
$pass = "J33CJRRwmgLpIa"; // La que sacas del ojito
$db   = "if0_41904034_aprendodinero1";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión"]));
}

$conn->set_charset("utf8mb4");
?>