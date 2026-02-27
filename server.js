const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/m2m", require("./routes/simm2m"));
app.use("/api/data", require("./routes/simdata"));
app.use("/api/voice", require("./routes/simvoice"));
app.use("/api/users", require("./routes/users"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/operators", require("./routes/operators"));
app.use("/api/import", require("./routes/import"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/locations", require("./routes/locations"));
app.use("/api/personnel", require("./routes/personnel"));

// SPA fallback — login veya index
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SIM Kart Takip Sistemi çalışıyor: http://localhost:${PORT}`);
});

module.exports = app;
 
