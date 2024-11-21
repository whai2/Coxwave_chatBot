import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

import { DataLoader, TextSplitter } from "./preProcess/index.js";
import { VectorStore } from "./storeAndRetrieval/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, "../../final_result.json");
const outputFilePath = path.resolve(__dirname, "../../processed_data.json");

dotenv.config();

// preProcess
const dataLoader = new DataLoader(filePath);
const loadedData = dataLoader.loadData();

const splitter = new TextSplitter();
export const processedData = splitter.splitText(loadedData);

// json save
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

// store
const vectorStore = new VectorStore(
  process.env.OPENAI_API_KEY,
  process.env.VECTOR_DB_URL,
  process.env.VECTOR_DB_COLLECTION_NAME
);
// await vectorStore.saveData(processedData);

// retrieval

export const cleanData = dataLoader.cleanData(loadedData);
