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
    var AD = req.body.AD;
    var SLNO = (!req.body.SLNO || req.body.SLNO === 'null') ? null : req.body.SLNO;
    var count = req.body.count;
    var amount = req.body.amount;
    var LOGID = req.LogId;
    console.log(LOGID);

    connection
      .then((pool) => {
        return pool
          .request()
          .input("SLNO", sql.Int, SLNO)
          .input("AD", sql.Int, AD)
          .input("count", sql.Int, count)
          .input("amount", sql.Float, amount)
          .input("LOGID", sql.Int, LOGID)

          .execute("procSaveSales");
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

  app.post("/sales/List", upload.none(), function (req, res) {
    var slno=req.body.slno

    connection
      .then((pool) => {
        return pool
          .request()
          .input("slno", sql.Int, slno)

          .execute("LoadConvesrionList");
      })
      .then((result) => {
        res.json({
          result: "success",
          data: result.recordsets,
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

  app.post("/sales/Load", upload.none(), function (req, res) {
    var SLNO = req.body.SLNO;
    var LOGID = req.LogId;
    console.log(LogId);

    connection
      .then((pool) => {
        return pool
          .request()
          .input("SLNO", sql.Int, SLNO)
          .input("LOGID", sql.Int, LOGID)

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
