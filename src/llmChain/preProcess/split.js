class TextSplitter {
  constructor(splitBy = "\n\n", chunkSize = 300) {
    this.splitBy = splitBy; // 텍스트 분리 기준
    this.chunkSize = chunkSize;
  }

  splitText(data) {
    try {
      const processedData = [];

      // 데이터 순회하며 분리
      for (const [index, [question, answer]] of Object.entries(
        data
      ).entries()) {
        const relatedHelpMatch = answer.match(/관련 도움말\/키워드.*$/s);
        const relatedHelp = relatedHelpMatch
          ? relatedHelpMatch[0].replace("관련 도움말/키워드", "").trim()
          : null;

        const cleanedAnswer = answer
          .replace(/위 도움말이 도움이 되었나요\?.*$/s, "")
          .replace(/별점\d점/g, "")
          .replace(/\[관련 도움말\/키워드\].*$/s, "");

        const answerChunks = [];
        let currentChunk = "";

        cleanedAnswer.split(".").forEach((sentence) => {
          const trimmedSentence = sentence.trim();

          if (currentChunk.length + trimmedSentence.length <= this.chunkSize) {
            currentChunk += trimmedSentence + ". ";
          } else {
            answerChunks.push(currentChunk.trim());

            // 마지막 20글자를 다음 청크로 포함
            const overlap = currentChunk.slice(-20).trim();
            currentChunk = overlap + " " + trimmedSentence + ". ";
          }
        });

        // 마지막 청크 추가
        if (currentChunk) {
          answerChunks.push(currentChunk.trim());
        }

        const id = `${index + 1}`;

        processedData.push({
          id,
          question,
          answerChunks,
          relatedHelp,
        });
      }

      console.log("Text splitting completed!");
      return processedData;
    } catch (error) {
      console.error("Error splitting text:", error.message);
      throw new Error("Failed to split text");
    }
  }
}

export default TextSplitter;
