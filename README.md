<!-- GitAds-Verify: DBW8G884X4K725U9YJY8NEG65BPFJJKJ -->

# Komiku REST API

REST API berbasis Express.js untuk mengambil data komik (Manga, Manhwa, Manhua) dari situs Komiku secara terstruktur.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D.svg)](https://swagger.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

---

## Interactive Documentation (Swagger UI)

Akses dokumentasi interaktif untuk mencoba langsung seluruh endpoint:

![Komiku API Swagger Documentation](./img/swagger.png)

- **API Base URL**: `https://komiku-rest-api.vercel.app`
- **Swagger UI**: [https://komiku-rest-api.vercel.app/api-docs](https://komiku-rest-api.vercel.app/api-docs)
- **Static Docs Page**: [https://vernsg.is-a.dev/komiku-api-docs](https://vernsg.is-a.dev/komiku-api-docs)

---

## Features

- **Rekomendasi & Populer**: Daftar komik rekomendasi dan komik populer berdasarkan kategori (Manga, Manhwa, Manhua).
- **Komik Terbaru**: Update chapter terbaru secara real-time.
- **Pustaka Komik**: Katalog pustaka komik dengan dukungan pagination (`/page/:page`).
- **Pencarian Komik**: Pencarian komik berdasarkan kata kunci judul.
- **Detail Komik**: Sinopsis, metadata komik, info table, genre, komik serupa, dan daftar chapter.
- **Baca Chapter**: Ekstraksi seluruh tautan gambar per chapter dengan navigasi chapter sebelumnya dan selanjutnya.
- **Komik Berwarna & Genre**: Filter komik full-color dan filter berdasarkan puluhan genre.
- **Image Proxy**: Proxy gambar terintegrasi untuk menangani hotlink protection & CDN Komiku.

---

## API Endpoints

### 1. Komik Terbaru & Rekomendasi
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `GET` | `/rekomendasi` | Daftar komik rekomendasi |
| `GET` | `/terbaru` | Daftar rilisan komik terbaru |
| `GET` | `/komik-populer` | Daftar komik populer seluruh kategori |
| `GET` | `/komik-populer/manga` | Daftar manga populer |
| `GET` | `/komik-populer/manhwa` | Daftar manhwa populer |
| `GET` | `/komik-populer/manhua` | Daftar manhua populer |

### 2. Pustaka & Komik Berwarna
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `GET` | `/pustaka` | Katalog pustaka komik (Halaman 1) |
| `GET` | `/pustaka/page/:page` | Katalog pustaka komik dengan pagination |
| `GET` | `/berwarna` | Daftar komik berwarna (Halaman 1) |
| `GET` | `/berwarna/page/:page` | Daftar komik berwarna dengan pagination |

### 3. Detail Komik & Chapter
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `GET` | `/detail-komik/:slug` | Detail informasi komik dan daftar chapter |
| `GET` | `/baca-chapter/:slug/:chapter` | Konten gambar chapter dan navigasi chapter |

### 4. Pencarian & Genre
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `GET` | `/search?q=:keyword` | Pencarian komik berdasarkan kata kunci |
| `GET` | `/genre-all` | Daftar seluruh genre komik |
| `GET` | `/genre-rekomendasi` | Daftar genre rekomendasi |
| `GET` | `/genre/:slug` | Daftar komik berdasarkan genre (Halaman 1) |
| `GET` | `/genre/:slug/page/:page` | Daftar komik berdasarkan genre dengan pagination |

### 5. Media Proxy
| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `GET` | `/image-proxy?url=:imageUrl` | Proxy gambar dari CDN Komiku |

---

## Response Examples

### `GET /detail-komik/reality-quest`
```json
{
  "title": "Komik Reality Quest",
  "alternativeTitle": "Reality Quest",
  "description": "Sinopsis singkat komik...",
  "sinopsis": "Ha Do-wan, seorang gamer yang dipaksa main game...",
  "thumbnail": "https://thumbnail.komiku.to/uploads/manga/reality-quest/manga_thumbnail-Manga-Reality-Quest.jpg?w=500",
  "info": {
    "Judul Komik": "Reality Quest",
    "Jenis Komik": "Manhwa",
    "Konsep Cerita": "Aksi, Fantasi, Game",
    "Pengarang": "Joowon",
    "Status": "Berjalan"
  },
  "genres": ["Action", "Fantasy", "School Life"],
  "slug": "reality-quest",
  "chapters": [
    {
      "title": "Chapter 220",
      "originalLink": "https://komiku.org/reality-quest-chapter-220/",
      "apiLink": "/baca-chapter/reality-quest/220",
      "chapterNumber": "220",
      "views": "12.5rb",
      "date": "2 hari lalu"
    }
  ]
}
```

### `GET /baca-chapter/reality-quest/220`
```json
{
  "title": "Reality Quest Chapter 220",
  "mangaInfo": {
    "title": "Reality Quest",
    "apiLink": "/detail-komik/reality-quest",
    "slug": "reality-quest"
  },
  "images": [
    {
      "src": "https://img.komiku.to/upload/2026/09/reality-quest-220-1.jpg",
      "alt": "Reality Quest Chapter 220 Gambar 1",
      "id": "1"
    }
  ],
  "navigation": {
    "prevChapter": {
      "apiLink": "/baca-chapter/reality-quest/219",
      "chapter": "219"
    },
    "nextChapter": null,
    "allChapters": "/detail-komik/reality-quest"
  }
}
```

---

## Quick Start (cURL)

```bash
# 1. Mengambil komik terbaru
curl -s https://komiku-rest-api.vercel.app/terbaru

# 2. Mencari komik
curl -s "https://komiku-rest-api.vercel.app/search?q=naruto"

# 3. Mengambil detail komik
curl -s https://komiku-rest-api.vercel.app/detail-komik/reality-quest

# 4. Mengambil gambar chapter komik
curl -s https://komiku-rest-api.vercel.app/baca-chapter/reality-quest/220
```

---

## Local Development

### Requirements
- Node.js 18.x or newer
- npm

### Installation
1. Clone repository:
   ```bash
   git clone https://github.com/VernSG/komiku-rest-api.git
   cd komiku-rest-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open in browser:
   - Frontend: `http://localhost:3001`
   - Swagger Docs: `http://localhost:3001/api-docs`

5. Run test suite:
   ```bash
   npm test
   ```

---

## License

This project is licensed under the [ISC License](LICENSE).
