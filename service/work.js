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
    var slno = (!req.body.slno || req.body.slno === 'null') ? null : req.body.slno;
 
 
    connection
      .then((pool) => {
        return pool
          .request()
          .input("title", sql.NVarChar(200), title)
          .input("link", sql.NVarChar(300), link)
          .input("description", sql.NVarChar(300), description)
          .input("client", sql.Int, client)
          .input("user", sql.Int, LogId)
          .input("slno", sql.Int, slno)
 
 
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

  app.post("/work/load", upload.none(), function (req, res) {
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

          .execute("sp_WorkbyId");
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

   app.post("/work/Delete", upload.none(),function (req, res) {
    var workId = req.body.workId;
    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, req.LogID)
          .input("WORKID", sql.Int, workId)
          .execute("sp_DeleteWork");
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

   app.post("/work/ApproveOrReject", upload.none(),function (req, res) {
    var workId = req.body.workId;
    var DESICION = req.body.DESICION;
    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, req.LogID)
          .input("WORKID", sql.Int, workId)
          .input("DESICION", sql.Int, DESICION)
          .execute("SP_APPROVE_OR_REJECT");
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
