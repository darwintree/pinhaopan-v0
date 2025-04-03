import fs from 'fs';
import path from 'path';

const questDir = "./scripts/quest"

const PICK_FIELDS = [
  "chapter_id",
  // "quest_id",
  "quest_name",
  "thumbnail_image",
  "category",
];

// 读取目录下所有文件
const files = fs.readdirSync(questDir);

// 过滤出 JSON 文件
const jsonFiles = files.filter(file => path.extname(file) === '.json');

const result = [];

// 读取每个 JSON 文件的内容
jsonFiles.forEach(file => {
    const filePath = path.join(questDir, file);
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    for (const quest of jsonData["list"]) {
        const questData = {};
        for (const field of PICK_FIELDS) {
            questData[field] = quest[field];
      }
      questData["category"] = file.replace(".json", "");
      result.push(questData);
    }
});

// 将结果写入新的 JSON 文件
const outputFilePath = "./public/list/quest.json";
fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

console.log('转换完成，结果已保存到 quest.json');
