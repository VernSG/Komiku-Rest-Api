const express = require("express");
const router = express.Router();
const { handleGenreRequest } = require("../controllers/genreDetailController");

router.get("/:slug", async (req, res) => {
  req.params.page = "1";
  return handleGenreRequest(req, res);
});

// GET /genre/:slug/page/:page - Route untuk pagination yang benar
router.get("/:slug/page/:page", async (req, res) => {
  return handleGenreRequest(req, res);
});

// GET /genre/:slug/:page - Backward compatibility
router.get("/:slug/:page", async (req, res) => {
  return handleGenreRequest(req, res);
});

module.exports = router;
