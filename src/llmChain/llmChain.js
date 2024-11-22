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
    await this.vectorStore.saveAnswersData();
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

  async vectorStoreQueryAndResponse(query) {
    await this.#saveData();

    const result = await this.vectorStore.queryData(query);
    // console.log(result.ids[0][0]);
    const answer = this.#findAnswerAboutQuery(result.ids[0][1]);
    const response = await this.#responseGenerate(query, answer.answerChunks);
    return response;
  }

  #findAnswerAboutQuery(id) {
    const answer = this.limitedData.find((item) => item.id === id);

    if (answer) {
      return answer;
    }

    return [];
  }

  async #responseGenerate(question, answerChunks) {
    return await this.llmGenerator.getResponse(question, answerChunks);
  }
}

export default LLMChain;
