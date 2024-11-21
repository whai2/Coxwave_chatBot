import OpenAI from "openai";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

class VectorStore {
  constructor(
    openaiApiKey,
    vectorDbUrl,
    questionCollectionName,
    answerCollectionName
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: openaiApiKey,
      model: "text-embedding-3-small",
    });

    this.client = new ChromaClient({ host: vectorDbUrl });
    this.questionCollectionName = questionCollectionName;
    this.answerCollectionName = answerCollectionName;
    this.questionCollection = null;
    this.answerCollection = null;
  }

  async #initializeQuestionCollection() {
    try {
      if (!this.questionCollection) {
        this.questionCollection = await this.client.getOrCreateCollection({
          name: this.questionCollectionName,
          embeddingFunction: this.embeddingFunction,
        });

        console.log(`Collection '${this.questionCollectionName}' initialized.`);
      }

      return this.questionCollection;
    } catch (error) {
      console.error("Error initializing questionCollection:", error.message);
      throw new Error("Failed to initialize questionCollection");
    }
  }

  async #initializeAnswerCollection() {
    try {
      if (!this.answerCollection) {
        this.answerCollection = await this.client.getOrCreateCollection({
          name: this.answerCollectionName,
          embeddingFunction: this.embeddingFunction,
        });

        console.log(`Collection '${this.answerCollectionName}' initialized.`);
      }

      return this.answerCollection;
    } catch (error) {
      console.error("Error initializing answerCollection:", error.message);
      throw new Error("Failed to initialize answerCollection");
    }
  }

  async #generateEmbedding(text) {
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

  async saveQuestionData(processedData) {
    try {
      const currentCollection = await this.#initializeQuestionCollection();

      const questions = processedData.map((item) => item.question);
      const metadatas = processedData.map((item) => ({
        relatedHelp: item.relatedHelp || null,
        id: item.id,
      }));
      const ids = processedData.map((item) => item.id);

      await currentCollection.add({
        documents: questions,
        metadatas: metadatas,
        ids: ids,
      });
    } catch (error) {
      console.error("Error saving question data to ChromaDB:", error.message);
      throw new Error("Failed to save question data to ChromaDB");
    }
  }

  async saveAnswersData(processedData) {
    try {
      const currentCollection = await this.#initializeAnswerCollection();

      const answerChunks = processedData
        .map((item) => item.answerChunks)
        .flat();
      const metadatas = processedData.flatMap((item) =>
        item.answerChunks.map(() => ({
          questions: item.question,
          id: item.id,
        }))
      );
      const ids = processedData.flatMap((item, itemIndex) =>
        item.answerChunks.map((_, chunkIndex) => `${item.id}-${chunkIndex}`)
      );

      await currentCollection.add({
        documents: answerChunks,
        metadatas: metadatas,
        ids: ids,
      });
    } catch (error) {
      console.error("Error saving answers data to ChromaDB:", error.message);
      throw new Error("Failed to save answers data to ChromaDB");
    }
  }

  async queryData(userQuery) {
    try {
      const currentCollection = await this.#initializeQuestionCollection();

      const results = await currentCollection.query({
        queryTexts: [userQuery],
        nResults: 20, // to be reRank
      });

      console.log("Query Results:", results);
    } catch (error) {
      console.error("Error querying data:", error.message);
    }
  }

  async checkCollectionStatus(collection = "question") {
    let currentCollection;
    if (collection === "question") {
      currentCollection = await this.#initializeQuestionCollection();
    } else {
      currentCollection = await this.#initializeAnswerCollection();
    }

    try {
      const collectionInfo = await currentCollection.get({
        nResults: 20,
      });

      return collectionInfo;
    } catch (error) {
      console.error("Error checking collection status:", error.message);
    }
  }
}

export default VectorStore;
