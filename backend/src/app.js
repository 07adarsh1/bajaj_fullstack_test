const express = require("express");
const cors = require("cors");
const bfhlRoutes = require("./routes/bfhlRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "BFHL API is running" });
});

app.use("/", bfhlRoutes);

module.exports = app;
