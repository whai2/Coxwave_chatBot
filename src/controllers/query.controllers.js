import LLMChain from "../llmChain/llmChain.js";

const llmChain = new LLMChain();
llmChain.saveData();

const RESPONSE_FAULTY_QUERY =
  "저는 스마트 스토어 FAQ를 위한 챗봇입니다. 스마트 스토어에 대한 질문을 부탁드립니다.";
const RELATED_FAULTY_HELP = "\n-회원 가입 절차를 안내할까요?";

export const queryAndResponse = async (req, res) => {
  try {
    const { query } = req.body;

    const stream = await llmChain.queryAndRagResponse(query);

    // 부적절한 질문 답변
    if (stream === RESPONSE_FAULTY_QUERY + RELATED_FAULTY_HELP) {
      return res
        .status(200)
        .json({ answer: RESPONSE_FAULTY_QUERY + RELATED_FAULTY_HELP });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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

    const stream = await llmChain.queryAndResponseWithPostRagPrompt(query);

    // 부적절한 질문 답변
    if (stream === RESPONSE_FAULTY_QUERY + RELATED_FAULTY_HELP) {
      return res
        .status(200)
        .json({ answer: RESPONSE_FAULTY_QUERY + RELATED_FAULTY_HELP });
    }
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
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
