import express from "express";
import events from "events";

import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

events.EventEmitter.defaultMaxListeners = 20;

const app = express();

app.use(express.json());

app.listen(PORT, () => {
  console.log(`server Running on ${PORT}`);
});
