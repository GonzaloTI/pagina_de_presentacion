// 1. Importar los módulos necesarios
const express = require('express');
const path = require('path'); // 'path' nos ayuda a manejar rutas de archivos
const FormData = require("form-data");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const qs = require("querystring");

const CLIENT_KEY = "sbaw2puy6r6vy609uj";
const CLIENT_SECRET = "voe6l33ALPpZw0cEbwX2cW0Asc0NO33U";
const REDIRECT_URI = "https://pagina-de-presentacion2.onrender.com/callback";

// Para subir archivos desde un form local
const upload = multer({ dest: "uploads/" });

// 2. Crear la aplicación de Express
const app = express();
const port = 3000; // El puerto donde correrá el servidor
app.use(cors());
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

app.get('/tiktokSTo4Zh8BLznHPQSovtA1HMDm3wsa26Af.txt', (req, res) => {
  // Simplemente le decimos que envíe el archivo que creamos en el Paso 1
  res.sendFile(path.join(__dirname, 'tiktokSTo4Zh8BLznHPQSovtA1HMDm3wsa26Af.txt'));
});

//
// ==========================================================
// ===== FIN DE CÓDIGO NUEVO                                =====
// ==========================================================


// =========================
// 2. CALLBACK (TikTok envía ?code=XYZ)
// =========================
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No llegó el code de TikTok.");
  }

  try {
    // 1. Mostrar todo lo que llega en la query (por ejemplo ?code=XYZ&state=ABC)
    const queryData = JSON.stringify(req.query, null, 2);
    const params = qs.stringify({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    });

    const response = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const responseData = JSON.stringify(response.data, null, 2);
    res.send(`
      <h2>Datos de la query recibida</h2>
      <pre>${queryData}</pre>

      <h2>Respuesta completa de TikTok</h2>
      <pre>${responseData}</pre>

      <h3>Subir video</h3>
      <form action="/uploadVideo" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="access_token" value="${response.data.access_token}">
        <input type="file" name="video">
        <button type="submit">Subir video a TikTok</button>
      </form>
    `);
  } catch (error) {
    console.error(error?.response?.data || error);
    res.send(`<h2>Error obteniendo token</h2><pre>${JSON.stringify(error?.response?.data || error, null, 2)}</pre>`);
  }
});

// =========================
// 4. Subida del video
// =========================
app.post("/uploadVideo", upload.single("video"), async (req, res) => {
  const access_token = req.body.access_token;
  const videoPath = req.file.path;

  try {
    const videoFile = fs.createReadStream(videoPath);

    const formData = new FormData();
    formData.append("video", videoFile);

    const response = await axios.post(
      "https://open.tiktokapis.com/v2/video/upload/",
      formData,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          ...formData.getHeaders(),
        },
      }
    );

    res.send(`
      <h2>Video subido correctamente</h2>
      <p>Respuesta TikTok:</p>
      <pre>${JSON.stringify(response.data, null, 2)}</pre>
    `);
  } catch (error) {
    console.error(error);

    // Mostrar el error crudo de manera detallada
    let errorData = {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : null,
      request: error.request ? error.request : null
    };

    res.send(`<h2>Error subiendo video (crudo)</h2><pre>${JSON.stringify(errorData, null, 2)}</pre>`);
  } finally {
    fs.unlinkSync(videoPath);
  }
});


// =========================
app.get("/login", (req, res) => {
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=video.upload&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});






// 4. Iniciar el servidor
app.listen(port, () => {
  console.log(`¡Servidor corriendo en http://localhost:${port}`);
});