import OpenAI from "openai";

import Prompt from "./prompt.js";

class LLMGenerator {
  constructor(openaiApiKey, model = "gpt-4") {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.model = model;
    this.history = [];
    this.prompt = new Prompt();
    // this.context = [];
  }

  // 이전 대화 기록 추가
  addHistory(userMessage, botResponse) {
    this.history.push({ role: "user", content: userMessage });
    this.history.push({ role: "assistant", content: botResponse });
  }

  // 컨텍스트 업데이트
  // updateContext(newContext = []) {
  //   this.context = [...this.context, ...newContext];
  // }

  // 프롬프트 생성
  generatePrompt(question, labelContent = []) {
    let prompt =
      "You are a helpful assistant specializing in providing precise and helpful responses.\n";

    // 대화 히스토리 추가
    if (this.history.length > 0) {
      prompt += "\nHere is the conversation history:\n";
      this.history.forEach((entry) => {
        prompt += `${entry.role === "user" ? "User" : "Assistant"}: ${
          entry.content
        }\n`;
      });
    }

    // 레이블 콘텐츠 추가
    if (labelContent.length > 0) {
      prompt += "\nHere are some useful references:\n";
      labelContent.forEach((content, index) => {
        prompt += `Reference ${index + 1}: ${content}\n`;
      });
    }

    // 질문 및 컨텍스트 추가
    prompt += `\nThe user asked: "${question}"\n`;
    // if (this.context.length > 0) {
    //   prompt += "Here is some additional context:\n";
    //   this.context.forEach((ctx, index) => {
    //     prompt += `- ${ctx}\n`;
    //   });
    // }

    prompt +=
      "\nPlease provide a clear and natural response that references the relevant information above.";
    return prompt;
  }

  // OpenAI API 호출
  async getResponse(question, labelContent = []) {
    const prompt = this.generatePrompt(question, labelContent);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "system", content: prompt }],
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

  async generateQueryPrompt(query) {
    const queryPromptTemplate = this.prompt.queryPrompt(query);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "system", content: queryPromptTemplate }],
        max_tokens: 100,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content.trim();
      console.log(response)

      return response;
    } catch (error) {
      console.error("Error generating query response:", error.message);
      throw new Error("Failed to generate query response");
    }
  }

  // 히스토리 및 컨텍스트 초기화
  reset() {
    this.history = [];
    // this.context = [];
  }
}

export default LLMGenerator;
