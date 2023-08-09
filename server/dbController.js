// dbController.js

const mysql = require('mysql');

const dbConfig = {
  host: 'db-huc0t.pub-cdb.ntruss.com',
  port: '3306',
  user: 'carpedm',
  password: '!carpedm1',
  database: 'cpdb'
};

module.exports = {
fetchDataFromDatabase: function (callback) {
    const connection = mysql.createConnection(dbConfig);
    
    connection.connect(err => {
      if (err) {
        console.error('mysql connection error: ' + err);
        callback(err, null);
        return;
      }
      
      const query = 'SELECT * FROM TestTable';
      connection.query(query, (err, rows) => {
        if (err) {
          console.error('Error fetching data from TestTable: ' + err);
          callback(err, null);
        } else {
          callback(null, rows);
        }
        connection.end(); // 데이터베이스 연결 닫기
      });
    });
  },
  
  insertDataIntoTable: function (data, callback) {
    const connection = mysql.createConnection(dbConfig);
    const { name, address } = data;
    const query = 'INSERT INTO TestTable (no, name, regDate, address) VALUES ((SELECT IFNULL(MAX(t.no),0)+1 FROM TestTable t), ?, SYSDATE(), ?)';
    
    connection.connect(err => {
      if (err) {
        console.error('mysql connection error: ' + err);
        callback(err, null);
        return;
      }
      
      connection.query(query, [name, address], (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          callback(err, null);
        } else {
          callback(null, result);
        }
        connection.end(); // 데이터베이스 연결 닫기
      });
    });
  }
};
