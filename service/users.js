module.exports = function (app, connection, upload) {
  // Get the packages we need //

  var sql = require("mssql"); //adding mssql driver into this file.

  var config = require("../config").config;
  const multer = require("multer");

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
          var user = {
            user_id: result.recordset[0].userId,
            Role: result.recordset[0].UsrRole,
            StartPage: result.recordset[0].START_PAGE,
          };
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
    connection
      .then((pool) => {
        return (
          pool
            .request()
            .input("LogID", sql.Int, req.LogID)
            // .input("LogID", sql.Int, 1)
            .execute("PROCGetUsers")
        );
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

  app.post("/user/add", upload.single("File"), function (req, res) {
    var username = req.body.username;
    var Fullname = req.body.Fullname;
    var password = req.body.password;
    var role = req.body.role;
    var email = req.body.email;
    var userID =
      req.body.userID && req.body.userID !== "null" ? req.body.userID : null;
    var img = req.file ? req.file.filename : null;

    connection
      .then((pool) => {
        return pool
          .request()
          .input("USR_NAME", sql.NVarChar(100), username)
          .input("USR_PIN", sql.NVarChar(100), password)
          .input("USR_ROLE", sql.Int, role)
          .input("USR_EMAIL", sql.NVarChar(100), email)
          .input("Fullname", sql.NVarChar(100), Fullname)
          .input("userID", sql.NVarChar(100), userID)
          .input("img", sql.NVarChar(300), img)
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

  app.post("/user/loadMenu", function (req, res) {
    connection
      .then((pool) => {
        return (
          pool
            .request()
            // .input("LogID", sql.Int, req.LogID)
            .input("user", sql.Int, req.LogID)
            .execute("sp_LoadMenu")
        );
      })
      .then((result) => {
        if (result.recordset.length === 0) {
          res.json({ result: "failed" });
        } else {
          res.json({
            result: "success",
            data: result.recordsets,
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

  app.post("/user/Load", upload.none(), function (req, res) {
    if (req.body.UserId != "null") {
      var UserId = req.body.UserId;
    } else {
      var UserId = null;
    }
    connection
      .then((pool) => {
        return pool
          .request()
          .input("UserId", sql.Int, UserId)
          .execute("sp_LoadEditUser");
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

  app.post("/user/Delete", upload.none(), function (req, res) {
    var UserId = req.body.UserId;
    connection
      .then((pool) => {
        return (
          pool
            .request()
            // .input("LogID", sql.Int, req.LogID)
            .input("UserId", sql.Int, UserId)
            .execute("sp_DeleteUser")
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

  app.post("/AdminDashboard", upload.none(), function (req, res) {
    connection
      .then((pool) => {
        return pool
          .request()

          .execute("SP_Admin_Dashboard");
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

  app.post("/ClientDashboard", upload.none(), function (req, res) {
    connection
      .then((pool) => {
        return pool
          .request()
          .input("userid", sql.Int, req.LogID)

          .execute("sp_ClientDashboard");
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

  app.post("/StaffDashboard", upload.none(), function (req, res) {
    connection
      .then((pool) => {
        return pool
          .request()
          .input("userid", sql.Int, req.LogID)

          .execute("sp_StaffDashboard");
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

  app.post("/user/notifications", upload.none(), function (req, res) {
    var LogID = req.LogID;
    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, req.LogID)
          .execute("SP_NOTIFICATIONS");
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

  app.post("/user/notificationMarkAsRead", upload.none(), function (req, res) {
    var LogID = req.LogID;
    var type = req.body.type;
    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, req.LogID)
          .input("type", sql.NVarChar(sql.MAX), type)
          .input("mode", sql.Int, 1)
          .execute("sp_notification_mark_as_read");
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

  app.post(
    "/user/notificationMarkALLAsRead",
    upload.none(),
    function (req, res) {
      var LogID = req.LogID;
      connection
        .then((pool) => {
          return pool
            .request()
            .input("LogID", sql.Int, req.LogID)
            .input("mode", sql.Int, 2)
            .execute("sp_notification_mark_as_read");
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
    },
  );
};
