import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch('/api/getdata')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  const handleInsert = () => {
    const newData = { name, address };

    fetch('/api/insertdata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newData)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Data inserted successfully:', data);
        setName('');
        setAddress('');
        fetchData(); // 삽입 후 데이터 다시 불러오기
      })
      .catch(error => console.error('Error inserting data:', error));
  };

  return (
    <div className="App">
      <h1> 데이터베이스 TestTable CRUD 기능 구현</h1>
      <div>
        <h2>데이터 삽입하기</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <button onClick={handleInsert}>Insert</button>
      </div>
      <h2>데이터 출력</h2>
      <div style={{ display: 'flex', justifyContent: 'center'}}>
        <table style={{border:'solid 1px black', width: '450px'}}>
          <thead>
            <th>이름</th>
            <th>날짜</th>
            <th>주소</th>
          </thead>
          {data.map(item => (
            <tr key={item.no}>
              <td>{item.name}</td>
              <td>{item.regDate}</td>
              <td>{item.address}</td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
}

export default App;
