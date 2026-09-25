const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const axios = require('axios');
const { fetchHtml, BASE_URL } = require('../controllers/scraperUtils');

const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY;
const SUMOPOD_BASE_URL = (process.env.SUMOPOD_BASE_URL || 'https://api.sumopod.com/v1').replace(/\/+$/, '');
const SUMOPOD_MODEL = process.env.SUMOPOD_MODEL || 'claude-3-5-sonnet';

const ROUTE_CONTROLLER_MAP = [
  { prefix: '/rekomendasi', file: 'controllers/rekomendasiController.js', targetUrl: BASE_URL },
  { prefix: '/terbaru', file: 'controllers/terbaruControllers.js', targetUrl: BASE_URL },
  { prefix: '/pustaka', file: 'controllers/pustakaController.js', targetUrl: `${BASE_URL}/pustaka/` },
  { prefix: '/komik-populer', file: 'controllers/komikPopulerController.js', targetUrl: BASE_URL },
  { prefix: '/detail-komik', file: 'controllers/detailKomikController.js', targetUrl: `${BASE_URL}/manga/high-class/` },
  { prefix: '/baca-chapter', file: 'controllers/bacaChapterController.js', targetUrl: `${BASE_URL}/high-class-chapter-1/` },
  { prefix: '/search', file: 'controllers/searchController.js', targetUrl: `${BASE_URL}/?s=naruto&post_type=manga` },
  { prefix: '/berwarna', file: 'controllers/berwarnaController.js', targetUrl: `${BASE_URL}/pustaka/?tipe=berwarna` },
  { prefix: '/genre-all', file: 'controllers/genreAllController.js', targetUrl: BASE_URL },
  { prefix: '/genre-rekomendasi', file: 'controllers/genreRekomendasiController.js', targetUrl: BASE_URL },
  { prefix: '/genre', file: 'controllers/genreDetailController.js', targetUrl: `${BASE_URL}/genre/action/` },
  { prefix: '/image-proxy', file: 'index.js', targetUrl: BASE_URL },
];

function runTestRunner() {
  console.log('[Auto-Healer] Menjalankan test runner...');
  const result = spawnSync('node', ['test_runner.js'], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, PORT: '3099' },
  });

  return {
    exitCode: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function parseTestFailures(output) {
  const failures = [];
  const lines = output.split('\n');
  let currentFailure = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[❌ FAIL/WARN]')) {
      const match = line.match(/\[❌ FAIL\/WARN\]\s+([^\s]+(?:\s+[^\s]+)*?)\s+(\/[^\s]*)/);
      if (match) {
        currentFailure = {
          name: match[1],
          path: match[2],
          errors: [],
        };
        failures.push(currentFailure);
      }
    } else if (currentFailure && line.trim().startsWith('❌ Errors:')) {
      currentFailure.errors.push(line.replace('❌ Errors:', '').trim());
    }
  }

  return failures;
}

async function callSumopodAI(prompt) {
  if (!SUMOPOD_API_KEY) {
    throw new Error('SUMOPOD_API_KEY tidak ditemukan di environment variables.');
  }

  const endpoint = `${SUMOPOD_BASE_URL}/chat/completions`;
  console.log(`[Auto-Healer] Menghubungi Sumopod AI API (${SUMOPOD_MODEL}) di ${endpoint}...`);

  const response = await axios.post(
    endpoint,
    {
      model: SUMOPOD_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an elite Node.js web scraping engineer specializing in Express.js, Cheerio, and Axios.\n' +
            'Your goal is to fix broken HTML scrapers due to DOM/CSS selector changes in upstream websites.\n' +
            'You must return ONLY the complete updated JavaScript file inside a single ```javascript code block.\n' +
            'Do NOT include explanations or prose outside the code block.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${SUMOPOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000,
    }
  );

  const reply = response.data?.choices?.[0]?.message?.content || '';
  const codeMatch = reply.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
  return codeMatch ? codeMatch[1].trim() : reply.trim();
}

async function main() {
  console.log('=== Komiku REST API Auto-Healer (Sumopod Powered) ===\n');

  // Step 1: Jalankan test awal
  const initialTest = runTestRunner();
  if (initialTest.exitCode === 0) {
    console.log('✅ Seluruh 25 endpoint sehat (100% PASS)! Tidak ada perbaikan yang dibutuhkan.');
    process.exit(0);
  }

  console.log('⚠️ Terdeteksi kegagalan pada pengujian endpoint.');
  const failures = parseTestFailures(initialTest.stdout);
  console.log(`Ditemukan ${failures.length} kegagalan:`, failures.map((f) => `${f.name} (${f.path})`));

  if (!SUMOPOD_API_KEY) {
    console.error('❌ Error: SUMOPOD_API_KEY belum diset. Tidak dapat melakukan auto-fix.');
    process.exit(1);
  }

  const healedFiles = new Set();
  const summaryReports = [];

  for (const failure of failures) {
    const matched = ROUTE_CONTROLLER_MAP.find((m) => failure.path.startsWith(m.prefix));
    if (!matched) {
      console.warn(`[Skip] Tidak ada mapping controller untuk path: ${failure.path}`);
      continue;
    }

    const controllerPath = path.resolve(__dirname, '..', matched.file);
    if (!fs.existsSync(controllerPath)) {
      console.warn(`[Skip] File controller tidak ditemukan: ${matched.file}`);
      continue;
    }

    if (healedFiles.has(matched.file)) {
      continue;
    }

    console.log(`\n========================================`);
    console.log(`[Healer] Menganalisis perbaikan untuk ${matched.file} (${failure.name})...`);

    // Fetch snapshot HTML terbaru
    let sampleHtml = '';
    try {
      console.log(`[Healer] Mengambil snapshot HTML terbaru dari: ${matched.targetUrl}`);
      sampleHtml = await fetchHtml(matched.targetUrl, { timeout: 15000 });
      sampleHtml = sampleHtml.slice(0, 45000); // Ambil 45KB pertama yang memuat struktur relevan
    } catch (e) {
      console.error(`Gagal mengambil HTML snapshot: ${e.message}`);
    }

    const currentCode = fs.readFileSync(controllerPath, 'utf8');

    const prompt = `The REST API endpoint "${failure.path}" (${failure.name}) is failing.
Error details: ${failure.errors.join('; ')}

Controller file to fix: ${matched.file}

Current controller source code:
\`\`\`javascript
${currentCode}
\`\`\`

Here is the latest raw HTML snapshot from the target site (${matched.targetUrl}):
\`\`\`html
${sampleHtml}
\`\`\`

Task:
Analyze the new HTML structure and update the selectors/extraction logic in this controller so it extracts the expected fields correctly.
Requirements:
1. Preserve all existing exports and function signatures.
2. Return the COMPLETE, ready-to-run JavaScript file.
3. Enclose the code strictly in a \`\`\`javascript ... \`\`\` block.`;

    try {
      const fixedCode = await callSumopodAI(prompt);
      if (fixedCode && fixedCode.includes('function') || fixedCode.includes('=>')) {
        // Backup original
        fs.writeFileSync(`${controllerPath}.bak`, currentCode);
        fs.writeFileSync(controllerPath, fixedCode, 'utf8');
        healedFiles.add(matched.file);
        summaryReports.push({
          file: matched.file,
          endpoint: failure.path,
          error: failure.errors.join(', ') || 'Validation error',
        });
        console.log(`[Healer] Kode perbaikan berhasil diterapkan ke ${matched.file}`);
      }
    } catch (err) {
      console.error(`[Healer] Gagal memperbaiki ${matched.file}: ${err.message}`);
    }
  }

  // Step 2: Validasi ulang seluruh test
  console.log('\n[Auto-Healer] Menjalankan verifikasi akhir test runner...');
  const finalTest = runTestRunner();

  if (finalTest.exitCode === 0) {
    console.log('\n🎉 SUKSES: Seluruh test berhasil diperbaiki dan 100% PASS!');
    // Bersihkan file backup
    healedFiles.forEach((f) => {
      const bak = path.resolve(__dirname, '..', `${f}.bak`);
      if (fs.existsSync(bak)) fs.unlinkSync(bak);
    });

    // Buat laporan untuk body Pull Request
    const prBody = [
      '## 🤖 Automated Parser Repair (AI Self-Healing)',
      '',
      `Bot mendeteksi adanya perubahan struktur DOM pada situs upstream Komiku dan telah otomatis memperbaikinya menggunakan model **${SUMOPOD_MODEL}**.`,
      '',
      '### 📋 Ringkasan Perbaikan:',
      ...summaryReports.map(
        (s) => `- **Endpoint**: \`${s.endpoint}\`\n  - **File**: \`${s.file}\`\n  - **Isu Teratasi**: ${s.error}`
      ),
      '',
      '### ✅ Hasil Verifikasi:',
      '- Seluruh 25 endpoint telah diuji ulang via `test_runner.js` dan **100% PASS** tanpa error.',
      '',
      '_Pull Request ini dibuat secara otomatis oleh Komiku Rest API Healer Bot._',
    ].join('\n');

    fs.writeFileSync(path.resolve(__dirname, '..', 'heal_summary.md'), prBody, 'utf8');
    process.exit(0);
  } else {
    console.error('\n❌ Masih ada test yang gagal setelah percobaan auto-healing.');
    // Rollback jika gagal
    healedFiles.forEach((f) => {
      const bak = path.resolve(__dirname, '..', `${f}.bak`);
      const target = path.resolve(__dirname, '..', f);
      if (fs.existsSync(bak)) {
        fs.writeFileSync(target, fs.readFileSync(bak, 'utf8'), 'utf8');
        fs.unlinkSync(bak);
      }
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in auto_healer:', err);
  process.exit(1);
});
