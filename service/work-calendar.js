module.exports = function (app, connection) {
  // Get the packages we need //

  var sql = require("mssql"); //adding mssql driver into this file.

  var config = require("../config").config;
  const multer = require("multer");
  const upload = multer();
  var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
  var configauth = require("../config");
  app.set("superSecret", configauth.secret);
  var excelbuilder = require("msexcel-builder-extended");
  const PdfPrinter = require("pdfmake/src/printer");
  const fs = require("fs");

  const fonts = {
    Roboto: {
      normal: "./fonts/Roboto-Regular.ttf",
      bold: "./fonts/Roboto-Medium.ttf",
      italics: "./fonts/Roboto-Italic.ttf",
      bolditalics: "./fonts/Roboto-Italic.ttf",
    },
  };

  const printer = new PdfPrinter(fonts);

  app.post("/work_calendar/load", upload.none(), function (req, res) {
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
          .input("mode", sql.Int, 1)

          .execute("Proc_Work_calendar");
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

  app.post("/work_calendar/add", upload.none(), function (req, res) {
    if (req.body.slno != "null") {
      var slno = req.body.slno;
    } else {
      var slno = null;
    }
    var LogId = req.LogID;
    var title = req.body.title;
    var content = req.body.content;
    var date = req.body.date;
    var client = req.body.client;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("slno", sql.Int, slno)
          .input("mode", sql.Int, 2)
          .input("LogID", sql.Int, LogId)
          .input("title", sql.NVarChar(sql.MAX), title)
          .input("content", sql.NVarChar(sql.MAX), content)
          .input("client", sql.Int, client)
          .input("date", sql.NVarChar(50), date)

          .execute("Proc_Work_calendar");
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

  app.post("/work_calendar/list", upload.none(), function (req, res) {
    var LogId = req.LogID;
    var Client = JSON.parse(req.body?.Client);
    var Status = JSON.parse(req.body?.status);
    var date = req.body.date;

    var tvpClient = new sql.Table();
    tvpClient.columns.add("ID", sql.Int);
    var tvpStatus = new sql.Table();
    tvpStatus.columns.add("ID", sql.Int);

    if (Array.isArray(Client)) {
      Client.forEach((client) => tvpClient.rows.add(client));
    }

    if (Array.isArray(Status)) {
      Status.forEach((status) => {
        tvpStatus.rows.add(status);
      });
    }

    connection
      .then((pool) => {
        return pool
          .request()
          .input("mode", sql.Int, 3)
          .input("LogID", sql.Int, LogId)
          .input("clientFilter", tvpClient)
          .input("statusFilter", tvpStatus)
          .input("date", sql.NVarChar(50), date)

          .execute("Proc_Work_calendar");
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
  app.post("/work_calendar/markAsComplete", upload.none(), function (req, res) {
    var LogId = req.LogID;
    var slno = req.body.slno;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("mode", sql.Int, 4)
          .input("LogID", sql.Int, LogId)
          .input("slno", sql.Int, slno)

          .execute("Proc_Work_calendar");
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
  app.post("/work_calendar/delete", upload.none(), function (req, res) {
    var LogId = req.LogID;
    var slno = req.body.slno;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("mode", sql.Int, 5)
          .input("LogID", sql.Int, LogId)
          .input("slno", sql.Int, slno)

          .execute("Proc_Work_calendar");
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
