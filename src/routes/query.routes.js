import express from "express";

import { queryAndAnswer } from "../controllers/query.controllers.js";

const router = express.Router();

router.post("/", queryAndAnswer);

export default router;
