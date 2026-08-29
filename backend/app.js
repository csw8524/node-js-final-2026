const config = require("./config/index");
const express = require("express");
const cors = require("cors");
const { dataSource } = require("./db/data-source");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/healthcheck", async (req, res) => {
  await dataSource.query("SELECT 1");
  res.status(200).type("text/plain").send("OK");
});

// 路由掛載（後續步驟逐一加入）
app.use("/api/coaches/skill", require("./routes/skill"));
app.use("/api/credit-package", require("./routes/creditPackage"));
app.use("/api/users", require("./routes/users"));

// 404 錯誤
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "無此路由",
  });
  return;
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: statusCode === 500 ? "error" : "failed",
    message: err.message || "伺服器錯誤",
  });
});

dataSource
  .initialize()
  .then(() => {
    app.listen(config.get("web.port"), () => {
      console.log(`Server running on port ${config.get("web.port")}`);
    });
  })
  .catch((err) => {
    console.error("資料庫連線失敗", err);
    process.exit(1);
  });

module.exports = app;
