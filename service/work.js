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

  app.post("/work/add", upload.none(), function (req, res) {
    var title = req.body.title;
    var client = req.body.client;
    var description = req.body.desc;
    var link = req.body.link;
    var LogId = req.LogID;
    var slno =
      !req.body.slno || req.body.slno === "null" ? null : req.body.slno;
    let employee = req.body.taggedEmp;

    if (typeof employee === "string") {
      employee = JSON.parse(employee);
    }

    const tvp = new sql.Table("EmployeeType");
    tvp.columns.add("tag", sql.NVarChar(100));
    tvp.columns.add("employeeId", sql.Int);

    employee.forEach((emp) => {
      tvp.rows.add(emp.tag || null, emp.employeeId || null);
    });
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
          .input("employees", tvp)
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
    console.log(req.body);

    var Client = JSON.parse(req.body?.Client);
    var Status = JSON.parse(req.body?.status);
    var emplist = JSON.parse(req.body?.emplist);

    var date = req.body.date;

    var tvpClient = new sql.Table();
    tvpClient.columns.add("ID", sql.Int);
    var tvpStatus = new sql.Table();
    tvpStatus.columns.add("ID", sql.Int);
    var tvpEmp = new sql.Table();
    tvpEmp.columns.add("ID", sql.Int);
    if (Array.isArray(Client)) {
      Client.forEach((client) => tvpClient.rows.add(client));
    }

    if (Array.isArray(Status)) {
      Status.forEach((status) => {
        if (status == 2) {
          status = null;
        }
        tvpStatus.rows.add(status);
      });
    }
    if (Array.isArray(emplist)) {
      emplist.forEach((emp) => tvpEmp.rows.add(emp));
    }

    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, LogId)
          .input("Client", tvpClient)
          .input("status", tvpStatus)
          .input("emplist", tvpEmp)

          .input("date", sql.NVarChar(10), date)

          .execute("PROCWorkList");
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
          .input("LogID", sql.Int, req.LogID)
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

  app.post("/work/Delete", upload.none(), function (req, res) {
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

  app.post("/work/ApproveOrReject", upload.none(), function (req, res) {
    var workId = req.body.workId;
    var DESICION = req.body.DESICION;
    var remark=req.body.remark
    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, req.LogID)
          .input("WORKID", sql.Int, workId)
          .input("DESICION", sql.Int, DESICION)
          .input("remark", sql.NVarChar(sql.MAX), remark)
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

  app.post("/work/Excel", upload.none(), function (req, res) {
    var LogId = req.LogID;

    var Client = JSON.parse(req.body?.Client);
    var Status = JSON.parse(req.body?.status);
    var emplist = JSON.parse(req.body?.emplist);

    var date = req.body.date;

    var tvpClient = new sql.Table();
    tvpClient.columns.add("ID", sql.Int);
    var tvpStatus = new sql.Table();
    tvpStatus.columns.add("ID", sql.Int);
    var tvpEmp = new sql.Table();
    tvpEmp.columns.add("ID", sql.Int);
    if (Array.isArray(Client)) {
      Client.forEach((client) => tvpClient.rows.add(client));
    }

    if (Array.isArray(Status)) {
      Status.forEach((status) => {
        if (status == 2) {
          status = null;
        }
        tvpStatus.rows.add(status);
      });
    }
    if (Array.isArray(emplist)) {
      emplist.forEach((emp) => tvpEmp.rows.add(emp));
    }

    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, LogId)
          .input("Client", tvpClient)
          .input("status", tvpStatus)
          .input("emplist", tvpEmp)

          .input("date", sql.NVarChar(10), date)

          .execute("PROCWorkList");
      })
      .then((result) => {
        console.log(result.recordsets[0]);
        var works = result.recordsets[0];

        var workbook = excelbuilder.createWorkbook(
          "./uploads/Excel/",
          "WorkList" + ".xlsx",
        );
        var sheet1 = workbook.createSheet("Sheet", 6, works.length + 1);
        // Fill some data
        // sheet1.set('Code','Name','UOM','SystemStock','PhysicalStock','Variation');
        sheet1.set(1, 1, "Title");
        sheet1.set(2, 1, "Client");
        sheet1.set(3, 1, "Description");
        sheet1.set(4, 1, "DriveLink");
        sheet1.set(5, 1, "Status");

        sheet1.font(1, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(2, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(3, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(4, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(5, 1, { sz: "12", family: "3", bold: "true" });

        sheet1.border(1, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(2, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(3, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(4, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(5, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });

        for (var j = 0; j < works.length; j++) {
          sheet1.set(1, j + 2, works[j].title);
          sheet1.set(2, j + 2, works[j].Client);
          sheet1.set(3, j + 2, works[j].description);
          sheet1.set(4, j + 2, works[j].link);
          sheet1.set(5, j + 2, works[j].status);

          sheet1.border(1, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(2, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(3, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(4, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(5, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
        }

        workbook.save(function (ok) {
          if (ok == false) workbook.cancel();
          else
            //
            res.json({ result: "success", filename: "WorkList.xlsx" });
        });

        // res.json({
        //   result: "success",
        //   data: result.recordsets,
        // });
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });

  app.post("/work/PDF", upload.none(), function (req, res) {
    var LogId = req.LogID;
    console.log(req.body);

    var Client = JSON.parse(req.body?.Client);
    var Status = JSON.parse(req.body?.status);
    var emplist = JSON.parse(req.body?.emplist);

    var date = req.body.date;

    var tvpClient = new sql.Table();
    tvpClient.columns.add("ID", sql.Int);
    var tvpStatus = new sql.Table();
    tvpStatus.columns.add("ID", sql.Int);
    var tvpEmp = new sql.Table();
    tvpEmp.columns.add("ID", sql.Int);
    if (Array.isArray(Client)) {
      Client.forEach((client) => tvpClient.rows.add(client));
    }

    if (Array.isArray(Status)) {
      Status.forEach((status) => {
        if (status == 2) {
          status = null;
        }
        tvpStatus.rows.add(status);
      });
    }
    if (Array.isArray(emplist)) {
      emplist.forEach((emp) => tvpEmp.rows.add(emp));
    }

    connection
      .then((pool) => {
        return pool
          .request()
          .input("LogID", sql.Int, LogId)
          .input("Client", tvpClient)
          .input("status", tvpStatus)
          .input("emplist", tvpEmp)

          .input("date", sql.NVarChar(10), date)

          .execute("PROCWorkList");
      })
      .then((result) => {
        var data = result.recordsets[0];
        var Header1 = [];

        Header1.push({
          text: "Title",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Description",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Client",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Drive Link",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Status",
          style: "tableHeader",
          alignment: "center",
        });

        var head = ["title", "description", "Client", "link", "status"];
        var bodyData = [];
        bodyData.push(Header1);
        data.forEach(function (sourceRow) {
          var dataRow = [];
          head.forEach(function (key, index) {
            var align = "center";
            if (typeof sourceRow[key] == "number") {
              sourceRow[key] = sourceRow[key].toFixed(2);
              align = "right";
            }
            if (key != "$$hashKey") {
              dataRow.push({
                text: sourceRow[key].toString(),
                style: "tableData",
                alignment: align,
                colSpan: 1,
              });
            }
            // dataRow.push({ text: sourceRow[key].toString(), style: 'tableData', alignment: align, colSpan: 1 })
          });
          bodyData.push(dataRow);
        });

        var dd = {
          pageSize: "A4",
          pageOrientation: "landscape",
          pageMargins: [10, 40, 40, 60],
          footer: {
            columns: [
              {
                text: "Powered By ",
                style: "reportFooter",
                alignment: "right",
              },
            ],
          },
          content: [
            //   {
            //     image: path.join(__dirname, '../uploads/company.jpg'),
            //     fit: [150, 150],
            //     alignment: 'left'
            // },
            // { text: recordsets[3][0].com_name, alignment: 'center' },
            { text: "Works", style: "header", alignment: "center" },
            // {
            //     style: 'tableExample1',
            //     width: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            //     // table: {
            //     //     body: [
            //     //         [
            //     //             // { text: 'Pay Group: ' + criteria.Pay_Group, alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //             // { text: 'Pay Period: ' + criteria.Pay_Period, alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //             // { text: 'Printed On: ' + dateFormat(new Date(), 'dd-mmmm-yyyy'), alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //             // { text: 'Printed By: ' + recordsets[0][0].USR_Name, alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //             // { text: 'Project: ' + criteria.project, alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //             // { text: 'Employee: ' + criteria.Employee, alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //             // { text: 'Employer: ' + criteria.Employer, alignment: 'left', italics: true, color: 'gray', style: 'tableData1' },
            //     //         ]
            //     //     ]
            //     // }
            // },
            {
              style: "tableExample",
              table: {
                headerRows: 1,
                widths: ["*", "*", "*", "*", "*"],

                body: bodyData,
              },
            },
          ],
          styles: {
            header: {
              fontSize: 25,
              bold: true,
              margin: [0, 0, 0, 0],
            },
            subheader: {
              fontSize: 16,
              bold: true,
              margin: [0, 0, 0, 0],
            },
            tableExample: {
              margin: [0, 0, 0, 0],
            },
            tableExample1: {
              fontSize: 20,
              margin: [240, 5, 0, 15],
            },
            tableHeader: {
              bold: true,
              fontSize: 10,
              color: "black",
              margin: [0, 0, 0, 0],
            },
            tablesubHeader: {
              bold: true,
              fontSize: 8,
              color: "black",
            },
            tableData: {
              fontSize: 6,
              color: "black",
            },
            tableData1: {
              fontSize: 20,
              color: "black",
            },
            reportFooter: {
              bold: true,
              fontSize: 6,
              color: "grey",
              margin: [0, 25, 15, 0],
            },

            searchCrit: {
              fontSize: 10,
              color: "black",
            },
          },
        };
        // console.log(dd)

        var pdfDoc = printer.createPdfKitDocument(dd);
        pdfDoc
          .pipe(fs.createWriteStream("uploads/PDF/works.pdf"))
          .on("finish", function () {
            //success
            console.log("create the file");
            res.json({ result: "success", filename: "works.pdf" });
          });
        pdfDoc.end();

        // res.json({
        //   result: "success",
        //   data: result.recordsets,
        // });
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });

  app.post("/ad/excel", upload.none(), function (req, res) {
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
        console.log(result.recordsets[0]);
        var works = result.recordsets[0];

        var workbook = excelbuilder.createWorkbook(
          "./uploads/Excel/",
          "Ads" + ".xlsx",
        );
        var sheet1 = workbook.createSheet("Sheet", 6, works.length + 1);
        // Fill some data
        // sheet1.set('Code','Name','UOM','SystemStock','PhysicalStock','Variation');
        sheet1.set(1, 1, "Ad");
        sheet1.set(2, 1, "Client");
        sheet1.set(3, 1, "Date period");
        sheet1.set(4, 1, "Spend");
        sheet1.set(5, 1, "No.of conversions");
        sheet1.set(6, 1, "Revenue");

        sheet1.font(1, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(2, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(3, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(4, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(5, 1, { sz: "12", family: "3", bold: "true" });
        sheet1.font(6, 1, { sz: "12", family: "3", bold: "true" });

        sheet1.border(1, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(2, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(3, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(4, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(5, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });
        sheet1.border(6, 1, {
          left: "thin",
          top: "thin",
          right: "thin",
          bottom: "thin",
        });

        for (var j = 0; j < works.length; j++) {
          sheet1.set(1, j + 2, works[j].title);
          sheet1.set(2, j + 2, works[j].client);
          sheet1.set(3, j + 2, works[j].dateperiod);
          sheet1.set(4, j + 2, works[j].spend);
          sheet1.set(5, j + 2, works[j].count);
          sheet1.set(6, j + 2, works[j].Revenue);

          sheet1.border(1, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(2, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(3, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(4, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(5, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
          sheet1.border(6, j + 2, {
            left: "thin",
            top: "thin",
            right: "thin",
            bottom: "thin",
          });
        }

        workbook.save(function (ok) {
          if (ok == false) workbook.cancel();
          else
            //
            res.json({ result: "success", filename: "Ads.xlsx" });
        });

        // res.json({
        //   result: "success",
        //   data: result.recordsets,
        // });
      })
      .catch((err) => {
        console.log("SQL Error:", err);

        res.status(500).json({
          result: "failed",
          error: err.message,
        });
      });
  });

  app.post("/ad/pdf", upload.none(), function (req, res) {
    var LogId = req.LogID;
    console.log(req.body);

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
        var data = result.recordsets[0];
        var Header1 = [];

        Header1.push({
          text: "Title",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Client",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Date Period",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Spend",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "No.of conversions",
          style: "tableHeader",
          alignment: "center",
        });
        Header1.push({
          text: "Revenue",
          style: "tableHeader",
          alignment: "center",
        });

        var head = [
          "title",
          "client",
          "dateperiod",
          "spend",
          "count",
          "Revenue",
        ];
        var bodyData = [];
        bodyData.push(Header1);
        data.forEach(function (sourceRow) {
          var dataRow = [];
          head.forEach(function (key, index) {
            var align = "center";
            if (typeof sourceRow[key] == "number") {
              sourceRow[key] = sourceRow[key].toFixed(2);
              align = "right";
            }
            if (key != "$$hashKey") {
              dataRow.push({
                text: sourceRow[key].toString(),
                style: "tableData",
                alignment: align,
                colSpan: 1,
              });
            }
          });
          bodyData.push(dataRow);
        });

        var dd = {
          pageSize: "A4",
          pageOrientation: "landscape",
          pageMargins: [10, 40, 40, 60],
          footer: {
            columns: [
              {
                text: "Powered By ",
                style: "reportFooter",
                alignment: "right",
              },
            ],
          },
          content: [
            {
              text: "Ads and Conversions",
              style: "header",
              alignment: "center",
            },

            {
              style: "tableExample",
              table: {
                headerRows: 1,
                widths: ["*", "*", "*", "*", "*", "*"],

                body: bodyData,
              },
            },
          ],
          styles: {
            header: {
              fontSize: 25,
              bold: true,
              margin: [0, 0, 0, 0],
            },
            subheader: {
              fontSize: 16,
              bold: true,
              margin: [0, 0, 0, 0],
            },
            tableExample: {
              margin: [0, 0, 0, 0],
            },
            tableExample1: {
              fontSize: 20,
              margin: [240, 5, 0, 15],
            },
            tableHeader: {
              bold: true,
              fontSize: 10,
              color: "black",
              margin: [0, 0, 0, 0],
            },
            tablesubHeader: {
              bold: true,
              fontSize: 8,
              color: "black",
            },
            tableData: {
              fontSize: 6,
              color: "black",
            },
            tableData1: {
              fontSize: 20,
              color: "black",
            },
            reportFooter: {
              bold: true,
              fontSize: 6,
              color: "grey",
              margin: [0, 25, 15, 0],
            },

            searchCrit: {
              fontSize: 10,
              color: "black",
            },
          },
        };

        var pdfDoc = printer.createPdfKitDocument(dd);
        pdfDoc
          .pipe(fs.createWriteStream("uploads/PDF/ads.pdf"))
          .on("finish", function () {
            //success
            console.log("create the file");
            res.json({ result: "success", filename: "ads.pdf" });
          });
        pdfDoc.end();

        // res.json({
        //   result: "success",
        //   data: result.recordsets,
        // });
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
