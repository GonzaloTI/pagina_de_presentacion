// 1. Importar los módulos necesarios
const express = require('express');
const path = require('path'); // 'path' nos ayuda a manejar rutas de archivos

// 2. Crear la aplicación de Express
const app = express();
const port = 3000; // El puerto donde correrá el servidor

// 3. Definir la ruta principal
// Cuando alguien entre a 'http://localhost:3000/'
app.get('/', (req, res) => {
  // 'res.sendFile' envía un archivo al navegador
  // 'path.join' crea una ruta correcta para encontrar tu HTML
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================================
// ===== INICIO DE CÓDIGO NUEVO (Paso de Verificación) =====
// ==========================================================
//
// 4. Definir la ruta para el archivo de verificación de TikTok
//    Cuando TikTok visite https://.../tiktokLslYtfl0tYEZ9a3qbZ1qse09uGg2diQQ.txt
//    esta función se ejecutará.
app.get('/tiktokLslYtfl0tYEZ9a3qbZ1qse09uGg2diQQ.txt', (req, res) => {
  // Simplemente le decimos que envíe el archivo que creamos en el Paso 1
  res.sendFile(path.join(__dirname, 'tiktokLslYtfl0tYEZ9a3qbZ1qse09uGg2diQQ.txt'));
});
//
// ==========================================================
// ===== FIN DE CÓDIGO NUEVO                                =====
// ==========================================================

// 4. Iniciar el servidor
app.listen(port, () => {
  console.log(`¡Servidor corriendo en http://localhost:${port}`);
});