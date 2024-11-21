import LlmChain from "../llmChain/llmChain.js";

export const queryAndAnswer = async (req, res) => {
  try {
    const { query } = req.body;
    const answer = "hi";
    const llmChain = new LlmChain();

    return res.status(200).json({ query: query, answer: answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
