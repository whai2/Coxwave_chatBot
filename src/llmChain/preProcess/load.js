import fs from "fs";

class DataLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.filePath, "utf-8");
      const jsonData = JSON.parse(data);

      console.log("Data loaded successfully!");
      return jsonData;
    } catch (error) {
      console.error("Error loading data:", error.message);
    }
  }

  cleanData = (data) => {
    return Object.entries(data).map(([question, answer]) => {
      // 불필요한 텍스트 제거
      const cleanedAnswer = answer
        .replace(/위 도움말이 도움이 되었나요\?.*$/, "") // 불필요한 끝 부분 제거
        .replace(/별점\d점/g, "") // 별점 텍스트 제거
        .replace(/관련 도움말\/키워드.*$/, ""); // 관련 도움말 제거

      // 메타데이터 추가 (카테고리 분류)
      const category = question.match(/\[(.*?)\]/)?.[1] || "기타";

      return {
        question: question.replace(/\[.*?\]/, "").trim(), // 대괄호 내용 제거
        answer: cleanedAnswer.trim(),
        category,
      };
    });
  };
}

export default DataLoader;
