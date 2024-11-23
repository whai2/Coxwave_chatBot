import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

import { DataLoader, TextSplitter } from "./preProcess/index.js";
import { VectorStore, BM25Search } from "./storeAndRetrieval/index.js";
import { LLMGenerator } from "./generateAnswer/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, "../../final_result.json");
const outputFilePath = path.resolve(__dirname, "../../processed_data.json");

dotenv.config();

const RESPONSE_FAULTY_QUERY =
  "저는 스마트 스토어 FAQ를 위한 챗봇입니다. 스마트 스토어에 대한 질문을 부탁드립니다. (false)";

class LLMChain {
  constructor() {
    // preProcess
    this.dataLoader = new DataLoader(filePath);
    this.loadedData = this.dataLoader.loadData();

    this.splitter = new TextSplitter();
    this.processedData = this.splitter.splitText(this.loadedData);
    this.limitedData = this.processedData.slice(0, 100);
    // this.questionOnlyData = limitedData.map((item) => ({
    //   question: item.question,
    // }));

    // json save
    this.#saveJson(outputFilePath, this.processedData);

    // store
    this.vectorStore = new VectorStore(
      process.env.OPENAI_API_KEY,
      process.env.VECTOR_DB_URL,
      process.env.VECTOR_DB_QUESTION_COLLECTION_NAME,
      process.env.VECTOR_DB_ANSWER_COLLECTION_NAME,
      this.limitedData
    );

    // bm25 init
    // this.bm25 = new BM25Search(this.questionOnlyData);

    // generate
    this.llmGenerator = new LLMGenerator(process.env.OPENAI_API_KEY);
  }

  async #saveData() {
    await this.vectorStore.saveQuestionData();
    // await this.vectorStore.saveAnswersData(); // TODO: 답변에 대한 rag 기능은 아직 필요 없는 기능이라 비활성화
  }

  #saveJson(outputFilePath, processedData) {
    if (!fs.existsSync(outputFilePath)) {
      fs.writeFileSync(
        outputFilePath,
        JSON.stringify(processedData, null, 2),
        "utf-8"
      );

      console.log(`Processed data saved to ${outputFilePath}`);
    } else {
      console.log(`File already exists at ${outputFilePath}, skipping write.`);
    }
  }

  async queryAndRagResponse(query) {
    await this.#saveData();

    // RAG 강화: 쿼리 프롬프트 적용
    const queryResponse = await this.llmGenerator.generateQueryPrompt(query);

    // 관계 없는 질문 1차 선별
    if (
      queryResponse.includes(RESPONSE_FAULTY_QUERY) ||
      queryResponse.includes("(false)")
    ) {
      return RESPONSE_FAULTY_QUERY.replace("(false)", "").trim();
    }

    // retrieval
    const result = await this.vectorStore.queryData(queryResponse);
    const answer = this.#findAnswerAboutQuery(result.ids[0][0]);

    // generate response
    const response = await this.llmGenerator.getResponse(
      query,
      answer.answerChunks
    );

    return response;
  }

  async queryAndPostRagPromptResponse(query) {
    await this.#saveData();

    // RAG 강화: 쿼리 프롬프트 적용
    const queryResponse = await this.llmGenerator.generateQueryPrompt(query);

    // 관계 없는 질문 1차 선별
    if (
      queryResponse.includes(RESPONSE_FAULTY_QUERY) ||
      queryResponse.includes("(false)")
    ) {
      return RESPONSE_FAULTY_QUERY.replace("(false)", "").trim();
    }

    // retrieval
    const result = await this.vectorStore.queryData(queryResponse); // 10개로 지정
    const answers = this.#findAnswersAboutQuery(result.ids[0]);

    // generate response
    const response = await this.llmGenerator.getResponseAboutPostRagPrompt(
      query,
      answers
    );

    return response;
  }

  #findAnswerAboutQuery(id) {
    const answer = this.limitedData.find((item) => item.id === id);

    if (answer) {
      return answer;
    }

    return [];
  }

  #findAnswersAboutQuery(ids) {
    if (!Array.isArray(ids)) {
      throw new Error("The parameter 'ids' must be an array.");
    }

    const answers = this.limitedData.filter((item) => ids.includes(item.id));

    return answers;
  }
}

export default LLMChain;
