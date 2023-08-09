const express = require('express');
const cors = require('cors');
const app = express();
const dbController = require('./dbController'); // dbController 모듈 불러오기

app.use(cors());
app.use(express.json()); // JSON 파싱 미들웨어 추가

app.post('/api/insertdata', (req, res) => {
  const data = req.body;

  dbController.insertDataIntoTable(data, (err, result) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else {
      res.json({ message: 'Data inserted successfully' });
    }
  });
});

app.get('/api/getdata', (req, res) => {
    dbController.fetchDataFromDatabase((err, data) => {
      if (err) {
        res.status(500).send('Internal Server Error');
      } else {
        res.json(data);
      }
    });
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
