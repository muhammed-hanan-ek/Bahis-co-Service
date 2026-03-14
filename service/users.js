module.exports = function (app, connection) {
  // Get the packages we need //

  var sql = require("mssql"); //adding mssql driver into this file.

  var config = require("../config").config;
  const multer = require("multer");
  const upload = multer();
  var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
  var configauth = require("../config");
  app.set("superSecret", configauth.secret);

  app.post("/user/login", upload.none(), function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("username", sql.NVarChar(100), username)
          .input("password", sql.NVarChar(100), password)
          .execute("ProcGetUserById");
      })
      .then((result) => {
        if (result.recordset.length === 0) {
          res.json({ result: "failed" });
        } else {
          console.log(result.recordsets);
          var user = {
            user_id: result.recordset[0].userId,
            Role: result.recordset[0].UsrRole,
            StartPage:result.recordset[0].START_PAGE
          };
          console.log(user);
          var token = jwt.sign(user, app.get("superSecret"), {
            expiresIn: 86400, // expires in 24 hours
          });

          res.json({
            result: "success",
            token: token,
            data: result.recordset,
          });
        }
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });
  app.post("/user/list", function (req, res) {
    // console.log(req.LogID);
    connection
      .then((pool) => {
        return pool
          .request()
          // .input("LogID", sql.Int, req.LogID)
          .input("LogID", sql.Int, 1)
          .execute("PROCGetUsers");
      })
      .then((result) => {
        if (result.recordset.length === 0) {
          res.json({ result: "failed" });
        } else {
          res.json({
            result: "success",
            data: result.recordset,
          });
        }
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });

  app.post("/user/add", upload.none(), function (req, res) {
    console.log(req.LogID);
    var username = req.body.username;
    var Fullname = req.body.Fullname;
    var password = req.body.password;
    var role = req.body.role;
    var email = req.body.email;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("USR_NAME", sql.NVarChar(100), username)
          .input("USR_PIN", sql.NVarChar(100), password)
          .input("USR_ROLE", sql.Int, role)
          .input("USR_EMAIL", sql.NVarChar(100), email)
          .input("Fullname", sql.NVarChar(100), Fullname)
          .execute("procSaveUser");
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
};
