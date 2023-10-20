export const handleRunExe = () => {
    let canceled = false; // 변수를 사용하여 요청이 취소되었는지 추적
  
    const cancelRequest = () => {
      canceled = true; // 요청 취소 플래그 설정
    };
  
    // 30초 후에 요청을 취소
    const timeout = 30000; // 30초를 밀리초로 나타낸 값
    setTimeout(() => {
      cancelRequest();
      console.log('30초가 경과하여 요청을 취소합니다.');
    }, timeout);
  
    return fetch('/runexe', {
      method: 'GET',
    })
      .then(response => {
        if (canceled) {
          // 요청이 이미 취소된 경우, 처리하지 않음
          throw new Error('Request canceled');
        }
        return response.text();
      })
      .then(data => {
        if (!canceled) {
          console.log('Exe 파일 실행 결과:', data);
          return data;
        }
      })
      .catch(error => {
        if (!canceled) {
          console.error('Exe 파일 실행 오류:', error);
          throw error;
        }
      });
  };
  
  // 요청 취소 함수를 외부에서 호출할 수 있도록 만들어두면 필요할 때 사용할 수 있습니다.
  // 예를 들어, 다른 이벤트에서 요청을 취소하려면 `cancelRequest` 함수를 호출하면 됩니다.
  