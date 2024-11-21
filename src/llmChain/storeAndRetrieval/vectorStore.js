import OpenAI from "openai";
import { ChromaClient } from "chromadb";

class VectorStore {
  constructor(openaiApiKey, vectorDbUrl, collectionName) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });

    this.client = new ChromaClient({ host: vectorDbUrl });
    this.collectionName = collectionName;
    this.collection = null;
  }

  async initializeCollection() {
    try {
      if (!this.collection) {
        this.collection = await this.client.getOrCreateCollection({
          name: this.collectionName,
        });

        console.log(`Collection '${this.collectionName}' initialized.`);
      }
    } catch (error) {
      console.error("Error initializing collection:", error.message);
      throw new Error("Failed to initialize collection");
    }
  }

  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error.message);
      throw new Error("Failed to generate embedding");
    }
  }

  async saveData(processedData) {
    try {
      await this.initializeCollection();

      for (const item of processedData) {
        const questionEmbedding = await this.generateEmbedding(item.question);

        // 각 답변 청크의 임베딩 생성
        const answerChunks = item.answerChunks || [];
        const chunkEmbeddings = await Promise.all(
          answerChunks.map((chunk) => this.generateEmbedding(chunk))
        );

        // ChromaDB에 데이터 추가
        await this.collection.add({
          documents: answerChunks,
          metadatas: answerChunks.map((chunk, idx) => ({
            question: item.question,
            chunkIndex: idx,
          })),
          ids: answerChunks.map((_, idx) => `${item.id}_chunk_${idx}`),
          embeddings: chunkEmbeddings,
        });

        console.log(`Data for question "${item.question}" added to ChromaDB.`);
      }
    } catch (error) {
      console.error("Error saving data to ChromaDB:", error.message);
      throw new Error("Failed to save data to ChromaDB");
    }
  }
}

export default VectorStore;
