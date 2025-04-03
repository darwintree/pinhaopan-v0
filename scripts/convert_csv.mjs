import { parse } from 'csv-parse';
import fs from 'fs';

const PICK_FIELDS = [
    "ID",
    "name_chs", 
    "name_jp",
    "series_name",
    "category[]",
    "category",
    "element",
    "tag[]",
    "rarity",
]

// 将CSV转换为JSON的函数
async function convertCsvToJson(inputFile, outputFile) {
    const records = [];
    
    // 创建读取流
    const parser = fs
        .createReadStream(inputFile)
        .pipe(parse({
            columns: true, // 这会使用第一行作为列名
            skip_empty_lines: true
        }));

    // 读取每一行数据
    for await (const record of parser) {
        const filteredRecord = {}
        for (const field of PICK_FIELDS) {
            filteredRecord[field] = record[field]
        }
        records.push(filteredRecord);
    }

    // 将结果写入JSON文件
    fs.writeFileSync(outputFile, JSON.stringify(records, null, 2));
    
    console.log(`转换完成！数据已保存到 ${outputFile}`);
}

// 获取命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    
    if (args.length === 2) {
        return {
            input: args[0],
            output: args[1]
        };
    }
    
    if (args.length !== 0) {
        console.error('使用方法: node convert.js [<输入CSV文件> <输出JSON文件>]');
        process.exit(1);
    }
    
    return null;
}

// 确保目录存在
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 处理单个文件
async function processFile(inputFile) {
    const outputDir = './public/list';
    ensureDirectoryExists(outputDir);
    
    const fileName = inputFile.split('/').pop().replace('.csv', '.json');
    const outputFile = `${outputDir}/${fileName}`;
    
    await convertCsvToJson(inputFile, outputFile);
}

// 处理所有文件
async function processAllFiles() {
    const inputDir = './scripts/equipments';
    const files = fs.readdirSync(inputDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    for (const file of csvFiles) {
        await processFile(`${inputDir}/${file}`);
    }
}

// 主程序入口
const args = parseArgs();
if (args) {
    // 处理单个指定文件
    convertCsvToJson(args.input, args.output).catch(error => {
        console.error('转换过程中发生错误:', error);
        process.exit(1);
    });
} else {
    // 处理所有文件
    processAllFiles().catch(error => {
        console.error('转换过程中发生错误:', error);
        process.exit(1);
    });
}
