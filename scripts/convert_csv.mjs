import xlsx from 'node-xlsx';
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

// 将XLSX转换为JSON的函数
async function convertXlsxToJson(inputFile, outputFile) {
    const records = [];
    
    // 解析xlsx文件
    const workSheetsFromFile = xlsx.parse(inputFile);
    
    // 假设数据在第一个工作表
    const worksheet = workSheetsFromFile[0];
    const rows = worksheet.data;
    
    if (rows.length < 2) {
        console.error('XLSX文件格式无效：缺少标题行或数据');
        return;
    }
    
    // 第一行是标题
    const headers = rows[0];
    
    // 处理每一行数据
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // 跳过空行
        if (!row || row.length === 0) continue;
        
        const record = {};
        // 将每个单元格的值与标题匹配
        for (let j = 0; j < headers.length; j++) {
            record[headers[j]] = row[j];
        }
        
        // 筛选所需字段
        const filteredRecord = {};
        for (const field of PICK_FIELDS) {
            if (record[field] !== undefined) {
                filteredRecord[field] = record[field].toString();
            }
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
        console.error('使用方法: node convert.js [<输入XLSX文件> <输出JSON文件>]');
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
    
    const fileName = inputFile.split('/').pop().replace('.xlsx', '.json');
    const outputFile = `${outputDir}/${fileName}`;
    
    await convertXlsxToJson(inputFile, outputFile);
}

// 处理所有文件
async function processAllFiles() {
    const inputDir = './scripts/equipments';
    const files = fs.readdirSync(inputDir);
    const xlsxFiles = files.filter(file => file.endsWith('.xlsx'));
    
    for (const file of xlsxFiles) {
        await processFile(`${inputDir}/${file}`);
    }
}

// 主程序入口
const args = parseArgs();
if (args) {
    // 处理单个指定文件
    convertXlsxToJson(args.input, args.output).catch(error => {
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
