import LLMChain from "../llmChain/llmChain.js";

export const queryAndResponse = async (req, res) => {
  try {
    const { query } = req.body;
    const llmChain = new LLMChain();
    const response = await llmChain.queryAndRagResponse(query);

    return res
      .status(200)
      .json({ query: query, response: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const queryAndResponseWithPostRagPrompt = async (req, res) => {
  try {
    const { query } = req.body;
    const llmChain = new LLMChain();
    const response = await llmChain.queryAndResponseWithPostRagPrompt(query);

    return res
      .status(200)
      .json({ query: query, response: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
