const express = require("express");
const path = require("path");
const axios = require("axios");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const { requestHeaders } = require("./controllers/scraperUtils");

// Tambahkan penanganan error global
process.on("uncaughtException", (err) => {
  console.error("Ada error yang tidak tertangkap:", err);
  // Tidak exit process agar aplikasi tetap berjalan
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Tidak exit process agar aplikasi tetap berjalan
});

const app = express();
const port = process.env.PORT || 3001;
const rateLimiter = require("./middleware/rateLimiter");

app.use(rateLimiter);
app.use(
  express.static(path.join(__dirname, "frontend"), {
    etag: true,
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, filePath) => {
      const fileName = path.basename(filePath);
      if (["index.html", "robots.txt", "sitemap.xml"].includes(fileName)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// Middleware for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Komiku Rest API",
      version: "1.0.0",
      description: "API untuk mengambil data komik dari Komiku",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const rekomendasiRoute = require("./routes/rekomendasi");
const terbaruRoute = require("./routes/terbaru");
const pustakaRouter = require("./routes/pustaka");
const komikPopulerRoute = require("./routes/komik-populer");
const detailKomikRoute = require("./routes/detail-komik");
const bacaChapterRoute = require("./routes/baca-chapter");
const searchRoute = require("./routes/search");
const berwarnaRoute = require("./routes/berwarna");
const genreAll = require("./routes/genre-all");
const genreDetail = require("./routes/genre-detail");
const genreRekomendasi = require("./routes/genre-rekomendasi");

// Root route
app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/image-proxy", async (req, res) => {
  try {
    const imageUrl = new URL(req.query.url || "");
    const requestedReferer = req.query.referer
      ? new URL(req.query.referer, "https://komiku.org/")
      : new URL("https://komiku.org/");
    const referer =
      requestedReferer.hostname === "komiku.org"
        ? requestedReferer.toString()
        : "https://komiku.org/";
    const allowedHosts = new Set([
      "img.komiku.org",
      "cdn.komiku.org",
      "thumbnail.komiku.org",
    ]);

    if (!allowedHosts.has(imageUrl.hostname)) {
      return res.status(400).json({ error: "Domain gambar tidak diizinkan." });
    }

    const upstream = await axios.get(imageUrl.toString(), {
      responseType: "stream",
      timeout: 20000,
      headers: {
        ...requestHeaders,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: referer,
      },
    });

    res.setHeader("Content-Type", upstream.headers["content-type"] || "image/webp");
    res.setHeader("Cache-Control", "public, max-age=86400");
    upstream.data.pipe(res);
  } catch (error) {
    console.error("Gagal proxy gambar:", error.message);
    res.status(502).json({ error: "Gagal mengambil gambar dari sumber." });
  }
});

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/rekomendasi", rekomendasiRoute);
app.use("/terbaru", terbaruRoute);
app.use("/pustaka", pustakaRouter);
app.use("/komik-populer", komikPopulerRoute);
app.use("/detail-komik", detailKomikRoute);
app.use("/baca-chapter", bacaChapterRoute);
app.use("/search", searchRoute);
app.use("/berwarna", berwarnaRoute);
app.use("/genre-all", genreAll);
app.use("/genre-rekomendasi", genreRekomendasi);
app.use("/genre", genreDetail);

app.listen(port, () => {
  console.log(`Server jalan di http://localhost:${port}`);
});

module.exports = app;
