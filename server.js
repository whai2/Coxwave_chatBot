import express from "express";
import events from "events";
import dotenv from "dotenv";

import queryRoutes from "./src/routes/query.routes.js";

import convertPklToJson from "./src/llmChain/llmChain.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

events.EventEmitter.defaultMaxListeners = 20;

const app = express();

app.use(express.json());

app.use("/api/query", queryRoutes);

app.listen(PORT, () => {
  console.log(`server Running on ${PORT}`);
});
