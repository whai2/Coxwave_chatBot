import OpenAI from "openai";

import Prompt from "./prompt.js";
import { USER_QUESTION, LLM_ANSWER, LLM_FAULTY_ANSWER } from "./constants.js";

class LLMGenerator {
  constructor(openaiApiKey, model = "gpt-4") {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.model = model;
    this.history = [];
    this.prompt = new Prompt();
  }

  // 이전 대화 기록 추가
  addHistory(userMessage, botResponse) {
    // 만약 답변이 이상할 경우, 히스토리 저장 x. 맥락 흐리기 차단.
    if (botResponse.includes(LLM_FAULTY_ANSWER)) return;

    this.history.push({ role: "user", content: userMessage });
    this.history.push({ role: "assistant", content: botResponse });

    while (this.history.length > 5) {
      this.history.shift();
    }
  }

  async generateResponse(question, labelContent = [], relatedHelp) {
    const prompt = this.prompt.vanillaPrompt(
      question,
      labelContent,
      relatedHelp,
      this.history
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: prompt },
          // ...this.history,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const botResponse = completion.choices[0].message.content.trim();

      // 히스토리에 추가
      this.addHistory(question, botResponse);

      return botResponse;
    } catch (error) {
      console.error("Error generating response:", error.message);
      throw new Error("Failed to generate response");
    }
  }

  async generateResponseWithPostRagPrompt(query, answers) {
    const prompt = this.prompt.postRagPrompt(query, answers);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: prompt },
          // ...this.history,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const botResponse = completion.choices[0].message.content.trim();

      // 히스토리에 추가
      this.addHistory(query, botResponse);

      return botResponse;
    } catch (error) {
      console.error("Error generating response:", error.message);
      throw new Error("Failed to generate response");
    }
  }

  async generateQueryPrompt(query) {
    const queryPromptTemplate = this.prompt.queryPrompt(query);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "system", content: queryPromptTemplate }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content.trim();

      return response;
    } catch (error) {
      console.error("Error generating query response:", error.message);
      throw new Error("Failed to generate query response");
    }
  }

  // 히스토리 및 컨텍스트 초기화
  reset() {
    this.history = [];
  }
}

export default LLMGenerator;
