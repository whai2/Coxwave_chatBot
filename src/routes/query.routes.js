import express from "express";

import {
  queryAndAnswer,
  queryAndAnswerWithPostRagPrompt,
} from "../controllers/query.controllers.js";

const router = express.Router();

router.post("/rag", queryAndAnswer);
router.post("/postRag,", queryAndAnswerWithPostRagPrompt);

export default router;
