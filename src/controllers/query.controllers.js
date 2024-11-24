import LLMChain from "../llmChain/llmChain.js";

const llmChain = new LLMChain();

export const queryAndResponse = async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/json; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const { query } = req.body;

    let botResponse = "";

    const stream = await llmChain.queryAndRagResponse(query);
    for await (const chunk of stream) {
      const streamChunk = chunk.choices[0]?.delta?.content || "";
      botResponse += streamChunk;

      process.stdout.write(streamChunk);
      // res.write(chunk); // 클라이언트로 스트림 데이터를 전송
    }

    llmChain.saveHistory(query, botResponse);

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const queryAndResponseWithPostRagPrompt = async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/json; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const { query } = req.body;

    let botResponse = "";

    const stream = await llmChain.queryAndResponseWithPostRagPrompt(query);
    for await (const chunk of stream) {
      const streamChunk = chunk.choices[0]?.delta?.content || "";
      botResponse += streamChunk;

      process.stdout.write(streamChunk);
      // res.write(chunk); // 클라이언트로 스트림 데이터를 전송
    }

    llmChain.saveHistory(query, botResponse);

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
