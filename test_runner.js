const http = require('http');

process.env.PORT = process.env.PORT || '3099';
const app = require('./index.js');

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTests() {
  const port = process.env.PORT || 3099;
  const baseUrl = `http://localhost:${port}`;
  console.log('Testing against server running at', baseUrl);

  await wait(500);

  const testResults = [];

  async function testEndpoint(name, path, validateFn, expectedStatus = 200) {
    const url = `${baseUrl}${path}`;
    console.log(`\n========================================`);
    console.log(`Testing [${name}]: ${path}`);
    const start = Date.now();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'API-Tester/1.0' },
      });
      const duration = Date.now() - start;
      const status = res.status;
      const contentType = res.headers.get('content-type') || '';
      let body;

      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        const text = await res.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      const result = {
        name,
        path,
        status,
        duration: `${duration}ms`,
        contentType,
        emptyArrays: [],
        errors: [],
        itemCount: null,
      };

      if (status !== expectedStatus) {
        result.errors.push(
          `HTTP Status ${status} (expected ${expectedStatus})`
        );
      }

      // Check for empty arrays anywhere in the object recursively
      function findEmptyArrays(obj, currentPath = '') {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          if (obj.length === 0) {
            result.emptyArrays.push(currentPath || 'root');
          } else {
            obj.slice(0, 2).forEach((item, idx) => {
              findEmptyArrays(item, `${currentPath}[${idx}]`);
            });
          }
        } else {
          for (const key of Object.keys(obj)) {
            const nextPath = currentPath ? `${currentPath}.${key}` : key;
            findEmptyArrays(obj[key], nextPath);
          }
        }
      }

      if (typeof body === 'object') {
        findEmptyArrays(body);
      }

      if (validateFn) {
        try {
          validateFn(body, result, res);
        } catch (valErr) {
          result.errors.push(`Validation error: ${valErr.message}`);
        }
      }

      if (Array.isArray(body)) {
        result.itemCount = body.length;
      } else if (body && typeof body === 'object') {
        if (Array.isArray(body.data)) result.itemCount = body.data.length;
        else if (Array.isArray(body.results))
          result.itemCount = body.results.length;
      }

      console.log(`Status: ${status} (${duration}ms)`);
      if (result.itemCount !== null) {
        console.log(`Item count: ${result.itemCount}`);
      }
      if (result.emptyArrays.length > 0) {
        console.log(`⚠️ Empty arrays found in: ${result.emptyArrays.join(', ')}`);
      }
      if (result.errors.length > 0) {
        console.log(`❌ ERRORS: ${result.errors.join(', ')}`);
      }

      const preview =
        typeof body === 'string'
          ? body.slice(0, 150)
          : JSON.stringify(body).slice(0, 200);
      console.log(`Response Preview: ${preview}...`);

      testResults.push(result);
      await wait(600);
      return { status, body, result };
    } catch (err) {
      console.error(`Failed request to ${path}:`, err.message);
      testResults.push({
        name,
        path,
        status: 'ERROR',
        errors: [err.message],
        emptyArrays: [],
      });
      await wait(600);
      return { status: 'ERROR', error: err };
    }
  }

  // 1. Rekomendasi
  const recRes = await testEndpoint(
    'Rekomendasi',
    '/rekomendasi',
    (data) => {
      if (!Array.isArray(data) || data.length === 0)
        throw new Error('Expected non-empty array');
      if (!data[0].title || !data[0].apiDetailLink || !data[0].thumbnail)
        throw new Error('Missing fields in recommendation');
    }
  );

  // 2. Terbaru
  const terRes = await testEndpoint('Terbaru', '/terbaru', (data) => {
    if (!Array.isArray(data) || data.length === 0)
      throw new Error('Expected non-empty array');
    if (!data[0].title || !data[0].mangaSlug)
      throw new Error('Missing fields in terbaru');
  });

  // 3. Pustaka Page 1
  await testEndpoint('Pustaka Page 1', '/pustaka', (data) => {
    if (!Array.isArray(data.results) || data.results.length === 0)
      throw new Error('Expected data.results non-empty');
    if (!data.results[0].title || !data.results[0].url)
      throw new Error('Missing title or url in pustaka result');
  });

  // 4. Pustaka Page 2
  await testEndpoint('Pustaka Page 2', '/pustaka/page/2', (data) => {
    if (!Array.isArray(data.results) || data.results.length === 0)
      throw new Error('Expected data.results non-empty');
  });

  // 5. Komik Populer All
  await testEndpoint('Komik Populer All', '/komik-populer', (data) => {
    if (!data.manga?.items?.length) throw new Error('manga.items empty');
    if (!data.manhwa?.items?.length) throw new Error('manhwa.items empty');
    if (!data.manhua?.items?.length) throw new Error('manhua.items empty');
  });

  // 6. Komik Populer Manga
  await testEndpoint(
    'Komik Populer Manga',
    '/komik-populer/manga',
    (data) => {
      if (!data.items?.length) throw new Error('items empty');
    }
  );

  // 7. Komik Populer Manhwa
  await testEndpoint(
    'Komik Populer Manhwa',
    '/komik-populer/manhwa',
    (data) => {
      if (!data.items?.length) throw new Error('items empty');
    }
  );

  // 8. Komik Populer Manhua
  await testEndpoint(
    'Komik Populer Manhua',
    '/komik-populer/manhua',
    (data) => {
      if (!data.items?.length) throw new Error('items empty');
    }
  );

  // Find a valid slug
  let testSlug = 'komik-one-piece-indo';
  if (terRes.body && Array.isArray(terRes.body) && terRes.body[0]?.mangaSlug) {
    testSlug = terRes.body[0].mangaSlug;
  }

  // 9. Detail Komik (Dynamic)
  const detailRes = await testEndpoint(
    `Detail Komik (${testSlug})`,
    `/detail-komik/${testSlug}`,
    (data) => {
      if (!data.title) throw new Error('Missing title in detail');
      if (!Array.isArray(data.chapters) || data.chapters.length === 0)
        throw new Error('Chapters array is empty');
      if (!data.thumbnail) throw new Error('Missing thumbnail in detail');
    }
  );

  // 10. Detail Komik (One Piece Indo)
  const opDetailRes = await testEndpoint(
    'Detail Komik (One Piece)',
    '/detail-komik/komik-one-piece-indo',
    (data) => {
      if (!data.title) throw new Error('Missing title in One Piece detail');
      if (!Array.isArray(data.chapters) || data.chapters.length === 0)
        throw new Error('Chapters array empty');
    }
  );

  // 11. Detail Komik 404 Handling
  await testEndpoint(
    'Detail Komik (Non-Existent 404 Check)',
    '/detail-komik/non-existent-comic-slug-12345',
    (data) => {
      if (!data.error) throw new Error('Expected 404 error message');
    },
    404
  );

  // Find a chapter to test
  let testChapterNum = '1';
  let chapterSlug = testSlug;
  if (detailRes.body?.chapters && detailRes.body.chapters.length > 0) {
    const chap = detailRes.body.chapters[0];
    if (chap.apiLink) {
      const m = chap.apiLink.match(/\/baca-chapter\/([^/]+)\/([^/]+)/);
      if (m) {
        chapterSlug = m[1];
        testChapterNum = m[2];
      }
    } else if (chap.chapterNumber) {
      testChapterNum = chap.chapterNumber;
    }
  }

  // 12. Baca Chapter
  const bacaRes = await testEndpoint(
    `Baca Chapter (${chapterSlug} ch ${testChapterNum})`,
    `/baca-chapter/${chapterSlug}/${testChapterNum}`,
    (data) => {
      if (!data.title) throw new Error('Missing title in chapter');
      if (!Array.isArray(data.images) || data.images.length === 0)
        throw new Error('Images array is empty');
      if (!data.images[0].src) throw new Error('First image missing src');
    }
  );

  // 13. Baca Chapter 404 Handling
  await testEndpoint(
    'Baca Chapter (Non-Existent 404 Check)',
    '/baca-chapter/non-existent-manga-99999/99999',
    (data) => {
      if (!data.error) throw new Error('Expected 404 error message');
    },
    404
  );

  // 14. Search "naruto"
  await testEndpoint('Search "naruto"', '/search?q=naruto', (data) => {
    if (!Array.isArray(data.data) || data.data.length === 0)
      throw new Error('Search results empty');
    if (!data.data[0].title || !data.data[0].slug)
      throw new Error('Missing title or slug in search result');
  });

  // 15. Search "solo"
  await testEndpoint('Search "solo"', '/search?q=solo', (data) => {
    if (!Array.isArray(data.data) || data.data.length === 0)
      throw new Error('Search results empty');
  });

  // 16. Search "one piece"
  await testEndpoint('Search "one piece"', '/search?q=one%20piece', (data) => {
    if (!Array.isArray(data.data) || data.data.length === 0)
      throw new Error('Search results empty');
  });

  // 17. Berwarna Page 1
  await testEndpoint('Berwarna Page 1', '/berwarna', (data) => {
    if (!Array.isArray(data.data?.results) || data.data.results.length === 0)
      throw new Error('Berwarna results empty');
    if (!data.data.results[0].title)
      throw new Error('Missing title in berwarna item');
  });

  // 18. Berwarna Page 2
  await testEndpoint('Berwarna Page 2', '/berwarna/page/2', (data) => {
    if (!Array.isArray(data.data?.results) || data.data.results.length === 0)
      throw new Error('Berwarna page 2 results empty');
  });

  // 19. Genre All
  await testEndpoint('Genre All', '/genre-all', (data) => {
    if (!Array.isArray(data) || data.length === 0)
      throw new Error('Genre all empty');
    if (!data[0].title || !data[0].slug || !data[0].apiGenreLink)
      throw new Error('Missing fields in genre-all');
  });

  // 20. Genre Rekomendasi
  await testEndpoint('Genre Rekomendasi', '/genre-rekomendasi', (data) => {
    if (!Array.isArray(data) || data.length === 0)
      throw new Error('Genre rekomendasi empty');
    if (!data[0].title || !data[0].slug || !data[0].thumbnail)
      throw new Error('Missing fields in genre-rekomendasi');
  });

  // 21. Genre Detail "action"
  await testEndpoint('Genre Detail "action"', '/genre/action', (data) => {
    if (!Array.isArray(data.data) || data.data.length === 0)
      throw new Error('Genre action data empty');
    if (!data.data[0].title || !data.data[0].slug)
      throw new Error('Missing fields in genre action item');
  });

  // 22. Genre Detail "action" Page 2
  await testEndpoint(
    'Genre Detail "action" Page 2',
    '/genre/action/page/2',
    (data) => {
      if (!Array.isArray(data.data) || data.data.length === 0)
        throw new Error('Genre action page 2 data empty');
    }
  );

  // 23. Genre Detail "action" Backward Compat /genre/action/2
  await testEndpoint(
    'Genre Detail Backward Compat /genre/action/2',
    '/genre/action/2',
    (data) => {
      if (!Array.isArray(data.data) || data.data.length === 0)
        throw new Error('Genre action backward compat data empty');
    }
  );

  // 24. Genre Detail "romance"
  await testEndpoint('Genre Detail "romance"', '/genre/romance', (data) => {
    if (!Array.isArray(data.data) || data.data.length === 0)
      throw new Error('Genre romance data empty');
  });

  // 25. Image Proxy
  let sampleImgUrl =
    detailRes.body?.thumbnail ||
    opDetailRes.body?.thumbnail ||
    'https://thumbnail.komiku.org/uploads/manga/reality-quest/manga_img_horizontal-Komik-Reality-Quest.png';

  if (sampleImgUrl) {
    await testEndpoint(
      'Image Proxy',
      `/image-proxy?url=${encodeURIComponent(sampleImgUrl)}`,
      (data, res, httpRes) => {
        const ct = httpRes.headers.get('content-type') || '';
        if (!ct.startsWith('image/')) {
          throw new Error(`Expected image content-type, got ${ct}`);
        }
      }
    );
  }

  console.log('\n========================================');
  console.log('FINAL TEST SUMMARY TABLE:');
  console.log('========================================');
  let passedCount = 0;
  let failedCount = 0;
  let emptyArrayCount = 0;

  testResults.forEach((r, idx) => {
    const isOk =
      r.status !== 'ERROR' &&
      r.errors.length === 0 &&
      r.emptyArrays.length === 0;
    const marker = isOk ? '✅ PASS' : '❌ FAIL/WARN';
    if (isOk) passedCount++;
    else failedCount++;
    if (r.emptyArrays.length > 0) emptyArrayCount++;

    console.log(
      `${String(idx + 1).padStart(2, ' ')}. [${marker}] ${r.name.padEnd(45, ' ')} ${r.path.padEnd(45, ' ')} Status: ${r.status} (${r.duration})`
    );
    if (r.itemCount !== null) {
      console.log(`     Items: ${r.itemCount}`);
    }
    if (r.emptyArrays.length > 0) {
      console.log(`     ⚠️ Empty arrays in: ${r.emptyArrays.join(', ')}`);
    }
    if (r.errors.length > 0) {
      console.log(`     ❌ Errors: ${r.errors.join(', ')}`);
    }
  });

  console.log(`\n========================================`);
  console.log(`Total Endpoints Tested: ${testResults.length}`);
  console.log(
    `Passed (Status matched, no empty arrays, no errors): ${passedCount}`
  );
  console.log(`Issues / Warnings / Failures: ${failedCount}`);
  console.log(`========================================\n`);

  process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
