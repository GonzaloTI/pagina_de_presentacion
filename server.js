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
        <input type="file" name="video" accept="video/*">
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

// Ruta para subir video
// Ruta para subir video
app.post("/uploadVideo", upload.single("video"), async (req, res) => {
  const access_token = req.body.access_token;
  const videoPath = req.file.path;

  try {
    const videoStats = fs.statSync(videoPath);
    const videoSize = videoStats.size;

    // ⚠️ IMPORTANTE: TikTok requiere chunk_size EXACTAMENTE 10 MB
    const chunkSize = 10 * 1024 * 1024; // 10485760 bytes (10 MB exactos)
    const totalChunks = Math.ceil(videoSize / chunkSize);

    console.log(`Video size: ${videoSize} bytes`);
    console.log(`Chunk size: ${chunkSize} bytes`);
    console.log(`Total chunks: ${totalChunks}`);

    // 1️⃣ Inicializar subida en TikTok
    const initResponse = await axios.post(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        post_info: {
          title: "Video subido desde mi app Node.js",
          privacy_level: "SELF_ONLY", // Cambiado a SELF_ONLY para pruebas
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunks
        }
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
      }
    );

    const { upload_url, publish_id } = initResponse.data.data;
    console.log(`Upload URL obtenida: ${upload_url}`);
    console.log(`Publish ID: ${publish_id}`);

    // 2️⃣ Subir video por chunks
    const videoBuffer = fs.readFileSync(videoPath);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, videoSize);
      const chunk = videoBuffer.slice(start, end);

      console.log(`Subiendo chunk ${i + 1}/${totalChunks}: bytes ${start}-${end - 1}/${videoSize}`);

      await axios.put(upload_url, chunk, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end - 1}/${videoSize}`,
          "Content-Length": chunk.length
        }
      });

      console.log(`Chunk ${i + 1} subido exitosamente`);
    }

    res.send(`
      <h2>✅ Video subido correctamente</h2>
      <p><strong>Publish ID:</strong> ${publish_id}</p>
      <p><strong>Tamaño del video:</strong> ${(videoSize / (1024 * 1024)).toFixed(2)} MB</p>
      <p><strong>Total chunks subidos:</strong> ${totalChunks}</p>
      <p><strong>Chunk size usado:</strong> ${(chunkSize / (1024 * 1024)).toFixed(2)} MB</p>
      <hr>
      <a href="/">Volver al inicio</a>
    `);

  } catch (error) {
    console.error("Error completo:", error);

    const errorData = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    };

    res.send(`<h2>❌ Error subiendo video</h2><pre>${JSON.stringify(errorData, null, 2)}</pre>`);

  } finally {
    // Limpiar archivo temporal
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      console.log("Archivo temporal eliminado");
    }
  }
});

// =========================
// app.get("/login", (req, res) => {
//   const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=video.upload&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
//   res.redirect(authUrl);
// });
app.get("/login", (req, res) => {
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=video.upload,video.publish,user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});





// 4. Iniciar el servidor
app.listen(port, () => {
  console.log(`¡Servidor corriendo en http://localhost:${port}`);
});