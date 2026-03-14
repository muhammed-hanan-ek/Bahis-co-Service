const express = require("express");
const cors=require('cors')
const app = express();
const port = 3000;
var sql = require("mssql");
var multer = require("multer");

var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var config = require("./config").config;

const allowedUrls = ["/user/login"];

const regexPatterns = [/uploads/];

const connection = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed:", err);
  });
require("./service/users")(app, connection);
require("./service/work")(app, connection);
require("./service/sales")(app, connection);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(function (req, res, next) {
  var token = req.headers.authorization;
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Access-Control-Request-Headers,token,authorization,api-Authentication",
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  // decode token

  if (token || token != undefined) {
    // verifies secret and checks exp
    jwt.verify(token, app.get("superSecret"), function (err, decoded) {
      if (err) {
        return res.json({
          result: "Unauthorized",
          success: false,
          message: "Failed to authenticate token.",
        });
        //  next();
      } else {
        // console.log('decoded :-',decoded)
        // if everything is good, save to request for use in other routes
        // req.decoded = decoded;
        req.LogID = decoded.user_id;
        next();
      }
    });
  } else {
    //res.json({ "result": 'no tokens provided' });
    // console.log("hello")
    //  // if there is no token
    //  // return an error
    // return res.status(403).send({
    //     success: false,
    //     message: 'No token provided.'
    // });
    if (
      allowedUrls.includes(req.url) ||
      regexPatterns.some((pattern) => pattern.test(req.url))
    ) {
      // console.log('url ---',req.url);
      next();
    } else if (req.headers.mobileFlag == 1) {
      next();
    } else if (req.headers.chatbot == 1) {
      next();
    } else {
      // console.log(123);

      return res.json({
        result: "Unauthorized",
        success: false,
        message: "Failed to authenticate token.",
      });
    }
  }
});
