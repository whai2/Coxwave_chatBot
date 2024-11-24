import LLMChain from "../llmChain/llmChain.js";

const llmChain = new LLMChain();
llmChain.saveData();

export const queryAndResponse = async (req, res) => {
  try {
    const { query } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await llmChain.queryAndRagResponse(query);
    let botResponse = "";

    for await (const chunk of stream) {
      const streamChunk = chunk.choices[0]?.delta?.content?.toString() || "";
      botResponse += streamChunk;

      for (const char of streamChunk) {
        res.write(`data: ${char}\n\n`); // 한 글자씩 EventSource로 전송

        await new Promise((resolve) => setTimeout(resolve, 50)); // 각 글자를 50ms 간격으로 전송
      }
    }

    llmChain.saveHistory(query, botResponse);
    console.log(botResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const queryAndResponseWithPostRagPrompt = async (req, res) => {
  try {
    const { query } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await llmChain.queryAndResponseWithPostRagPrompt(query);
    let botResponse = "";

    for await (const chunk of stream) {
      const streamChunk = chunk.choices[0]?.delta?.content?.toString() || "";
      botResponse += streamChunk;

      for (const char of streamChunk) {
        res.write(`data: ${char}\n\n`); // 한 글자씩 EventSource로 전송

        await new Promise((resolve) => setTimeout(resolve, 50)); // 각 글자를 50ms 간격으로 전송
      }
    }

    llmChain.saveHistory(query, botResponse);
    console.log(botResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
