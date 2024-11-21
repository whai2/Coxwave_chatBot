import { BM25 } from "fast-bm25";

class BM25Search {
  constructor(processedData) {
    this.processedData = processedData;
    this.bm25 = new BM25(processedData);
  }

  query(query) {
    return this.bm25.search(query, 20);
  }
}

export default BM25Search;
