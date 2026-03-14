module.exports = function (app, connection) {
  // Get the packages we need //

  var sql = require("mssql"); //adding mssql driver into this file.

  var config = require("../config").config;
  const multer = require("multer");
  const upload = multer();
  var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
  var configauth = require("../config");
  app.set("superSecret", configauth.secret);

  app.post("/sales/add", upload.none(), function (req, res) {
    var items = req.body.items;
    var count = req.body.count;
    var amount = req.body.amount;
    var LogId = req.LogID;
    console.log(LogId);

    connection
      .then((pool) => {
        return pool
          .request()
          .input("items", sql.Int, items)
          .input("count", sql.Int, count)
          .input("amount", sql.Float, amount)
          .input("user", sql.Int, LogId)

          .execute("procSaveSales");
      })
      .then((result) => {
        res.json({
          result: "success",
          data: "success",
        });
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });

  app.post("/sales/List", upload.none(), function (req, res) {
    var LogId = req.LogID;
    console.log(LogId);

    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, LogId)

          .execute("PROCSalesList");
      })
      .then((result) => {
        res.json({
          result: "success",
          data: result.recordset,
        });
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });
};
