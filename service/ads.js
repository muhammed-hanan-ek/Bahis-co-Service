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
    var slno = (!req.body.slno || req.body.slno === 'null') ? null : req.body.slno;
    var ad=req.body.ad;
    var startDate=req.body.startDate;
    var endDate=req.body.endDate;
    var amount=req.body.amount;
    var LogId=req.LogId;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("slno", sql.Int, slno)
          .input("ad", sql.Int, ad)
          .input("startDate", sql.NVarChar(100), startDate)
          .input("endDate", sql.NVarChar(100), endDate)
          .input("amount", sql.NVarChar(sql.MAX), amount)
          .input("LogId", sql.Int, LogId)
          
          .execute("SP_SAVE_AD");
      })
      .then((result) => {
        console.log(LogId,'log id for ad adding');
        
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
  })
}