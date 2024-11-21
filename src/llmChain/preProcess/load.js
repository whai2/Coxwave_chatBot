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
}

export default DataLoader;
