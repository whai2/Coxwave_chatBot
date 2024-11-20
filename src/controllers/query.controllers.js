export const queryAndAnswer = (req, res) => {
  try {
    const { query } = req.body;

    const answer = "hi";

    return res.status(200).json({ query: query, answer: answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
