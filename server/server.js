const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const { execFile } = require('child_process');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const folderPath = 'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\data\\analyzedFile';

const processedFiles = new Set();
let connectedClient = null;

function stopChildProcesses(C, Py) {
  if (C) {
    C.kill('SIGINT')
  }
  if (Py) {
    Py.kill();
  }
}

wss.on('connection', (ws) => {
  let childProcessC = null;
  let childProcessPy = null;
  let watcher = null;
  if (connectedClient === null) {
    connectedClient = ws;
    console.log('클라이언트가 연결되었습니다.');
    
    ws.on('message', (message) => {
      console.log('클라이언트로부터 메시지 수신:', message);
    });

    ws.on('close', () => {
      connectedClient = null;
      console.log('클라이언트 연결이 닫혔습니다.');
    });


    const exePathC = 'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\bin\\x64\\Release\\net6.0\\playC.cmd';
    
    const exePathPy = 'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\data\\watch.py';
    
    // childProcessC = exec(`start /B "" "${exePathC}"`, (errorC, stdoutC, stderrC) => {
    //   if (errorC) {
    //     console.error(`C# 데이터 수집 파일 실행 오류: ${errorC}`);
    //   }
    // });
  // childProcessC = exec(`${exePath} &`);
    // // childProcessC = exec(`start /b "${exePath}"`, { stdio: 'inherit' });
    const exePath = 'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\bin\\x64\\Release\\net6.0\\AzureKinectBodyTracking.exe';
    // const args = [];
    childProcessC = spawn(exePath);

    childProcessC.stdout.on('data', (data) => {
      console.log(`표준 출력:\n${data}`);
    });
    
    childProcessC.stderr.on('data', (data) => {
      console.error(`표준 에러:\n${data}`);
    });
    
    childProcessC.on('close', (code) => {
      console.log(`프로세스 종료 코드: ${code}`);
    });
    
    childProcessC.on('error', (err) => {
      console.error(`에러 발생: ${err}`);
    });
    childProcessC.on('exit', (codeC, signalC) => {
      console.log(`childProcessC 종료됨. 코드: ${codeC}, 신호: ${signalC}`);
    });

    childProcessPy = spawn('python', [exePathPy]);

    let csvData = ''; // CSV 파일 데이터를 저장할 변수
    
    // 파일 감시자 활성화
    watcher = chokidar.watch(folderPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
      ignoreInitial: true,
    });

    watcher.on('add', (filePath) => {
      if (!processedFiles.has(filePath)) {
        console.log(`새 파일이 추가되었습니다: ${filePath}`);
        const fileExtension = filePath.split('.').pop().toLowerCase(); // 파일 확장자 추출
    
        fs.readFile(filePath, (readErr, data) => {
          if (readErr) {
            console.error(`파일 읽기 오류: ${readErr}`);
          } else {
            if (connectedClient && connectedClient.readyState === WebSocket.OPEN) {
              if (fileExtension === 'csv') {
                // CSV 파일인 경우
                csvData = data;
              } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                // 이미지 파일인 경우
                let imageContentType = 'image/png'; // 기본적으로 PNG로 설정
                if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
                  imageContentType = 'image/jpeg'; // JPEG 이미지
                } else if (fileExtension === 'gif') {
                  imageContentType = 'image/gif'; // GIF 이미지
                }
                const imageBuffer = fs.readFileSync(filePath); // 이미지 파일 읽기
                
                const base64Image = imageBuffer.toString('base64');

                connectedClient.send(`${imageContentType} ${base64Image}`);
              }
              // 클라이언트에 데이터를 보내는 로직
              if (csvData !== '') {
                connectedClient.send(`text/csv ${csvData}`);
                csvData = ''; // 데이터 전송 후 초기화
              }
            }
            processedFiles.add(filePath);
          }
        });
      }
    });

    // 30초 뒤에 연결을 닫도록 타이머 설정
    const connectionTimeout = 15 * 1000; // 30초를 밀리초로 변환
    setTimeout(() => {
      if (connectedClient) {
        childProcessC.kill('SIGKILL');

        if (childProcessPy && !childProcessPy.killed) {
          childProcessPy.kill('SIGINT', () => {
            // 종료되었을 때의 콜백
            console.log('childProcessPy 종료됨.');
          });
       }
        watcher.close();
        connectedClient.close();
        console.log(`연결이 ${connectionTimeout / 1000}초가 경과하여 자동으로 닫혔습니다.`);
      }
      childProcessC.kill();
    }, connectionTimeout);

  } else {
    console.log('이미 클라이언트가 연결되어 있습니다. 새로운 연결을 거부합니다.');
    ws.close();
    if (childProcessC && !childProcessC.killed && childProcessPy && !childProcessPy.killed) {
      childProcessC.kill(); // 프로세스가 실행 중일 때만 종료를 시도
      childProcessPy.kill();
    }
  }


});

server.listen(5000, () => {
  console.log('서버가 5000번 포트에서 실행 중입니다.');
});

server.on('close', () => {
  console.log('서버가 종료되었습니다.');
  // 파일 감시자 종료
  watcher.close();
});

    // childProcessC = exec(exePathC, (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`실행 중 오류 발생: ${error}`);
    //     return;
    //   }
    // });
  //   childProcessC = exec(`"${exePathC}"`, (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`오류 발생: ${error}`);
  //     }
  // });

  // childProcessC = exec(exePathC, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`오류 발생: ${error}`);
  //     return;
  //   }
  //   console.log(`프로그램 출력: ${stdout}`);
  // });

    // childProcessPy = exec(exePathPy, (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`파이썬 실시간 분석 파일 실행 오류: ${error}`);
    //   }
    // });



// app.get('/runexe', (req, res) => {
//   const exePathC = 'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\bin\\x64\\Release\\net6.0\\playC.cmd';
// const exePathPy = 'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\data\\playPy.cmd';
//   // 첫 번째 .exe 파일 실행
//   const childProcessC = exec(`start /B "" "${exePathC}"`, (errorC, stdoutC, stderrC) => {
//     if (errorC) {
//       res.status(500).send(`오류 발생: ${errorC.message}`);
//       console.error(`오류 발생: ${errorC}`);
//     } else {
      
//     }
//   });
//   // 두 번째 .exe 파일 실행
//   const childProcessPy = execFile(exePathPy, (error, stdout, stderr) => {
//     if (error) {
//       res.status(500).send(`오류 발생: ${error.message}`);
//       console.error(`오류 발생: ${error}`);
//     } else {
//       res.send(`Py 파일 실행됨. 표준 출력: ${stdout}`);
//       console.log('Py 파일 감시자 실행중...');
//     }
//   });
//   const executionTimeout = 30000; // 30초를 밀리초로 변환
//   setTimeout(() => {
//     if (childProcessC) {
//       childProcessC.kill();
//       console.log('첫 번째 .exe 파일이 30초가 경과하여 종료되었습니다.');
//     }
//     if (childProcessPy) {
//       childProcessPy.kill();
//       console.log('두 번째 .exe 파일이 30초가 경과하여 종료되었습니다.');
//     }
//   }, executionTimeout);
// });


// app.post('/api/insertdata', (req, res) => {
//   const data = req.body;

//   dbController.insertDataIntoTable(data, (err, result) => {
//     if (err) {
//       res.status(500).send('Internal Server Error');
//     } else {
//       res.json({ message: 'Data inserted successfully' });
//     }
//   });
// });

// app.get('/api/getdata', (req, res) => {
//     dbController.fetchDataFromDatabase((err, data) => {
//       if (err) {
//         res.status(500).send('Internal Server Error');
//       } else {
//         res.json(data);
//       }
//     });
//   });

// .exe 파일 경로 및 인수 설정


// const commands = [
//   'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\bin\\x64\\Release\\net6.0\\AzureCmd.cmd',
//   'E:\\CarpeDM\\dad\\AzureKinectBodyTracking\\TestExePy.py'
// ];

// let isRunning = false;

// function startExecution() {
//   if (!isRunning) {
//     isRunning = true;
//     executeCommands();
//     console.log('실행이 시작되었습니다.');

//     // 30초 후 실행 중지
//     setTimeout(stopExecution, 30000); // 30 seconds
//   }
// }

// function executeCommands() {
//   commands.forEach((cmdPath) => {
//     exec(cmdPath, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`오류 발생: ${error}`);
//       } else {
//         console.log(`명령어 실행됨: ${cmdPath}`);
//       }
//     });
//   });
// }

// function stopExecution() {
//   isRunning = false;
//   console.log('실행이 종료되었습니다.');
// }

// // 실행 시작
// startExecution();
