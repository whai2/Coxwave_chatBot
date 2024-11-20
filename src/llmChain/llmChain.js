import fs from "fs";
import pickle from "picklejs";

const convertPklToJson = (pklFilePath, jsonFilePath) => {
  try {
    const pklBuffer = fs.readFileSync(pklFilePath);

    const data = pickle.loads(pklBuffer);

    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 4), "utf-8");

    console.log(`Converted ${pklFilePath} to ${jsonFilePath} successfully!`);
  } catch (error) {
    console.error("Error during conversion:", error.message);
  }
};

export default convertPklToJson;

// 사용 예제
