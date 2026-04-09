exports.config = {
  user: "sa",
  server: "localhost", // required

  // server: 'LAPTOP-LRBIJ3MG\SQLEXPRESS',
  database: "bac",
  password: "1077",
  port: 1433,
  connectionTimeout: 30000000,
  requestTimeout: 30000000,
  pool: {
    idleTimeoutMillis: 30000000,
    max: 100,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

exports.secret = "BHR";
