import initializeChroma from "../db/chroma.js";

import { queryResult } from "../llmChain/llmChain.js";

export const queryAndAnswer = async (req, res) => {
  try {
    const { query } = req.body;
    const answer = "hi";
    console.log(queryResult)

    return res
      .status(200)
      .json({ query: query, answer: answer, queryResult: queryResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
