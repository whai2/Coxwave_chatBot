# CoxWave-sdk 사용 예시

## 도큐먼트
- docs: https://jumbled-tablecloth-e39.notion.site/CoxWave-SDK-16f8114296a9807fb97cf980fc783baa?pvs=4

## 실행 방법
### 0. 설치

```bash
  yarn add coxwave-sdk
```

### 1. React (vite)

- 파일 위치: main.tsx

```js
  import { createRoot } from "react-dom/client";
  
  import CoxWaveSDK from 'coxwave-sdk'

  import App from "./App";

  const coxWaveSDK = new CoxWaveSDK({
    clientName: "fastCampus",
    apiKey: "1111",
  });

  createRoot(document.getElementById("root")!).render(<App />);
  coxWaveSDK.renderChat();
```

