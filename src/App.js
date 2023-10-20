import React, { useState, useEffect } from 'react';
import './App.css';
import { handleRunExe } from './clientFunctions';
function App() {
  const [fileContents, setFileContents] = useState([]);
  const [ws, setWs] = useState(null);
  const [timerId, setTimerId] = useState(null);
  const [exeResult, setExeResult] = useState(''); // 실행 결과를 저장할 상태 변수
  
  const [imageData, setImageData] = useState(null);
  const [csvData, setCsvData] = useState(null);

  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already open.');
      return;
    }

    const newWs = new WebSocket('ws://localhost:5000');

    newWs.onmessage = (event) => {
      const [contentType, data] = event.data.split(' '); // 서버에서 content-type을 메시지에 포함
  
      if (contentType.startsWith('image/')) {
        // 이미지 데이터 처리
        setImageData(data);
      } else if (contentType === 'text/csv') {
        // CSV 파일 데이터 처리
        setCsvData(data);
      }
    };
    
    setWs(newWs);

    newWs.onopen = () => {
      setFileContents((prevContents) => [...prevContents, "파일 감지기 실행 중..."]);
    }

    // 30초 타이머 시작
    const timer = setTimeout(() => {
      if (newWs.readyState === WebSocket.OPEN) {
        newWs.close();
        console.log('WebSocket connection closed after 30 seconds.');
        setWs(null);
      }
    }, 300000); // 300초를 밀리초로 변환
    setTimerId(timer);
  };

  const closeWebSocket = () => {
    if (ws) {
      ws.close();
      console.log('WebSocket connection closed');
      setWs(null);
      // 타이머 초기화
      if (timerId) {
        clearTimeout(timerId);
        setTimerId(null);
      }
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      closeWebSocket();
    };
  }, []);

  return (
    <div className="App">
      <h1>Real-time File Content</h1>
      {ws ? (
        <button onClick={closeWebSocket}>Close WebSocket</button>
      ) : (
        <button onClick={connectWebSocket}>Connect WebSocket</button>
      )}
      <ul>
        <li>파일 감지기 변화</li>
        {fileContents.map((content, index) => (
          <li key={index}>{content}</li>
        ))}
      </ul>
      <ul>
      <h2>EXE 실행 결과:</h2>
        <pre>{exeResult}</pre>
      </ul>
          <div>
          {imageData && (
            <div>
              <h2>이미지</h2>
              <img src={`data:image/png;base64,${imageData}`} alt="이미지" />
            </div>
          )}
        </div>
        <div>
          {csvData && (
        <div>
          <h2>CSV 파일</h2>
          <pre>{csvData}</pre>
        </div>
           )}
        </div>  
    </div>
  );
}

export default App;