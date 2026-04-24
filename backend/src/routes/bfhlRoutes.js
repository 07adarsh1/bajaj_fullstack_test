const express = require("express");
const { processHierarchyRequest } = require("../services/graphService");

const router = express.Router();

router.post("/bfhl", (req, res) => {
  try {
    const payload = processHierarchyRequest(req.body);
    res.status(200).json(payload);
  } catch (error) {
    res.status(400).json({
      error: error.message || "Invalid request"
    });
  }
});

module.exports = router;
