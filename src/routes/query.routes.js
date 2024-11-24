import express from "express";

import {
  queryAndResponse,
  queryAndResponseWithPostRagPrompt,
} from "../controllers/query.controllers.js";

const router = express.Router();

router.post("/rag", queryAndResponse);
router.post("/postRag,", queryAndResponseWithPostRagPrompt);

export default router;
