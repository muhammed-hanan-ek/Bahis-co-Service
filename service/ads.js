module.exports = function (app, connection) {
  // Get the packages we need //

  var sql = require("mssql"); //adding mssql driver into this file.

  var config = require("../config").config;
  const multer = require("multer");
  const upload = multer();
  var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
  var configauth = require("../config");
  app.set("superSecret", configauth.secret);

  app.post("/ad/load", upload.none(), function (req, res) {
    if (req.body.slno != "null") {
      var slno = req.body.slno;
    } else {
      var slno = null;
    }

    connection
      .then((pool) => {
        return pool
          .request()
          .input("slno", sql.Int, slno)

          .execute("sp_AdbyId");
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

  app.post("/ad/add", upload.none(), function (req, res) {
    var slno =
      !req.body.slno || req.body.slno === "null" ? null : req.body.slno;
    var ad = req.body.ad;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var amount = req.body.amount;
    var client = req.body.client;
    var link = req.body.link;
    var LogId = req.LogID;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("slno", sql.Int, slno)
          .input("ad", sql.NVarChar(sql.MAX), ad)
          .input("startDate", sql.NVarChar(100), startDate)
          .input("endDate", sql.NVarChar(100), endDate)
          .input("amount", sql.NVarChar(sql.MAX), amount)
          .input("client", sql.Int, client)
          .input("link", sql.NVarChar(sql.MAX), link)
          .input("LogId", sql.Int, LogId)

          .execute("SP_SAVE_AD");
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

  app.post("/ad/List", upload.none(), function (req, res) {
    var LogId = req.LogID;

    var Client = JSON.parse(req.body?.Client);
    var date = req.body.date;

    var tvpClient = new sql.Table();
    tvpClient.columns.add("ID", sql.Int);

    if (Array.isArray(Client)) {
      Client.forEach((client) => tvpClient.rows.add(client));
    }

    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, LogId)
          .input("Client", tvpClient)
          .input("date", sql.NVarChar(10), date)
          .execute("PROCAdList");
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

  app.post("/ad/Delete", upload.none(), function (req, res) {
    var SLNO = req.body.SLNO;
    connection
      .then((pool) => {
        return (
          pool
            .request()
            // .input("LogID", sql.Int, req.LogID)
            .input("SLNO", sql.Int, SLNO)
            .execute("DELETEAD")
        );
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
