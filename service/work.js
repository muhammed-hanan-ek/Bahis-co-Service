module.exports = function (app, connection) {
  // Get the packages we need //

  var sql = require("mssql"); //adding mssql driver into this file.

  var config = require("../config").config;
  const multer = require("multer");
  const upload = multer();
  var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
  var configauth = require("../config");
  app.set("superSecret", configauth.secret);

  app.post("/work/add", upload.none(), function (req, res) {
    var title = req.body.title;
    var client = req.body.client;
    var description = req.body.desc;
    var link = req.body.link;
    var LogId = req.LogID;
    console.log(LogId);

    connection
      .then((pool) => {
        return pool
          .request()
          .input("title", sql.NVarChar(200), title)
          .input("driveLink", sql.NVarChar(300), link)
          .input("description", sql.NVarChar(300), description)
          .input("client", sql.Int, client)
          .input("user", sql.Int, LogId)

          .execute("procSaveWork");
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

  app.post("/work/List", upload.none(), function (req, res) {
    var LogId = req.LogID;
    console.log(LogId);

    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, LogId)

          .execute("PROCWorkList");
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
