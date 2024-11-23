import LLMChain from "../llmChain/llmChain.js";

export const queryAndAnswer = async (req, res) => {
  try {
    const { query } = req.body;
    const answer = "hi";
    const llmChain = new LLMChain();
    const response = await llmChain.vectorStoreQueryAndPostRagPromptResponse(query);

    return res
      .status(200)
      .json({ query: query, answer: answer, response: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
