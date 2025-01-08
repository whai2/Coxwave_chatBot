import { createRoot } from "react-dom/client";

import CoxWaveSDK from "coxwave-sdk";

import App from "./App.tsx";

const coxWaveSDK = new CoxWaveSDK({
  clientName: "fastCampus",
  apiKey: "1111",
});

createRoot(document.getElementById("root")!).render(<App />);
coxWaveSDK.renderChat();