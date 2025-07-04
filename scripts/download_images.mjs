import fs from "fs-extra";
import axios from "axios";
import { promisify } from "util";
import path from "path";
import xlsx from "node-xlsx";
import pLimit from "p-limit";
import { Command } from 'commander';

const writeFile = promisify(fs.writeFile);

const program = new Command();

program
  .version('1.0.0')
  .description('Download images based on the specified type')
  .option('-t, --type <type>', 'Type of images to download (quest, character, weapon, summon)')
  .option('-d, --databaseDir <databaseDir>', 'Directory to store downloaded images')
  .parse(process.argv);

async function downloadImages(imageUrls, parentDir, concurrency = 5) {
  if (!parentDir) {
    throw new Error("Parent directory is required");
  }
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const limit = pLimit(concurrency);

  try {
    const promises = imageUrls.map((url) =>
      limit(async () => {
        const fileName = url.split("/").pop();
        const filePath = path.join(parentDir, fileName);

        if (fs.existsSync(filePath)) {
          console.log(`Skipping ${fileName} because it already exists`);
          return;
        }

        const response = await axios.get(url, { responseType: "arraybuffer" });
        await writeFile(filePath, response.data);
        console.log(`Downloaded ${fileName} to ${filePath}`);
      })
    );

    await Promise.all(promises);
    console.log("All images downloaded successfully.");
  } catch (error) {
    console.error("Error downloading images:", imageUrls);
  }
}

function getQuestPhotoUrl(thumbnail_image) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/quest/assets/lobby/${thumbnail_image}.png`;
}

function getCharacterPhotoUrl(characterId, index) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/npc/quest/${characterId}_${index}.jpg`;
}

function getWeaponMainPhotoUrls(weaponId) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/weapon/ls/${weaponId}.jpg`;
}

function getWeaponNormalPhotoUrls(weaponId) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/weapon/m/${weaponId}.jpg`;
}

function getSummonMainPhotoUrls(summonId) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/summon/party_main/${summonId}.jpg`;
}

function getSummonSubPhotoUrls(summonId) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets/summon/party_sub/${summonId}.jpg`;
}

async function downloadQuestPhotos() {
  const quests = fs.readJSONSync("./public/list/quest.json");

  const imgUrls = quests.map((quest) =>
    getQuestPhotoUrl(quest.thumbnail_image)
  );

  await downloadImages(imgUrls);
}

async function downloadCharacterPhotos(databaseDir) {
  // 读取 xlsx 文件
  const workSheetsFromFile = xlsx.parse("./scripts/equipments/chara.xlsx");
  const data = workSheetsFromFile[0].data; // 获取第一个工作表的数据

  // 跳过表头
  const headers = data[0];
  const records = data.slice(1);

  for (const record of records) {
    try {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = record[index];
      });

      if (row.rarity !== "SSR") {
        continue;
      }
      const characterId = row.ID;
      try {
        Number(characterId);
      } catch (error) {
        continue;
      }
      const photoIndexes = ["01", "02"];
      if (row.star5_date) {
        photoIndexes.push("03");
      }
      if (row["category[]"] == "十天众") {
        photoIndexes.push("04");
      }
      if (row["extra_img[]"]) {
        const extraPhotoIndexes = row["extra_img[]"].toString().split(";");
        photoIndexes.push(...extraPhotoIndexes);
      }
      await downloadImages(
        photoIndexes.map((index) => getCharacterPhotoUrl(characterId, index)),
        `${databaseDir}/chara`
      );
    } catch (error) {
      console.error(`Error processing character `, error);
      console.log(record);
      throw error;
    }
  }
}

async function downloadSkinPhotos(databaseDir) {
  // 读取 xlsx 文件
  const workSheetsFromFile = xlsx.parse("./scripts/equipments/skin.xlsx");
  const data = workSheetsFromFile[0].data; // 获取第一个工作表的数据

  // 跳过表头
  const headers = data[0];
  const records = data.slice(1);

  await downloadImages(
    [
      getCharacterPhotoUrl("3710154000", "01_1"),
      getCharacterPhotoUrl("3710182000", "01_01"),
      getCharacterPhotoUrl("3710183000", "01_01"),
      getCharacterPhotoUrl("3710184000", "01_01"),
    ],
    `${databaseDir}/chara`
  )

  for (const record of records) {
    try {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = record[index];
      });

      const characterId = row.ID;
      if (characterId === "3710154000") {
        continue;
      }
      if (characterId === "3710182000") {
        continue;
      }
      if (characterId === "3710183000") {
        continue;
      }
      if (characterId === "3710184000") {
        continue;
      }
      try {
        Number(characterId);
      } catch (error) {
        continue;
      }
      const photoIndexes = ["01"];
      await downloadImages(
        photoIndexes.map((index) => getCharacterPhotoUrl(characterId, index)),
        `${databaseDir}/chara`
      );
    } catch (error) {
      console.error(`Error processing character `, error);
      console.log(record);
      throw error;
    }
  }
}

function weaponInPriority(seriesName, star5_date) {
  const prioritySeries = [
    "[極星器]",
    "[六道神器]",
    "[新世界の礎]",
    "[終末の神器]",
    "[アストラルウェポン]",
    "[アンセスタルシリーズ]",
    "[エニアドシリーズ]",
    "[オールド・プライマルシリーズ]",
    "[ドラゴニックウェポン]",
    "[ドラゴニックウェポン・オリジン]",
    "[マグナ・リバースシリーズ]",
    "[マグナシリーズ]",
    "[リミテッドシリーズ]",
    "[ルミナスシリーズ]",
    "[レヴァンスウェポン]",
    "[レガリアシリーズ]",
    "[ワールドシリーズ]",
  ]
  if (prioritySeries.includes(seriesName)) {
    return true;
  }
  const lessPrioritySeries = ["[オメガウェポン]", "[バハムートウェポン]"]
  if (lessPrioritySeries.includes(seriesName) && star5_date) {
    return true;
  }
  return false;
}

async function downloadWeaponPhotos(databaseDir) {
  // 读取 xlsx 文件
  const workSheetsFromFile = xlsx.parse("./scripts/equipments/weapon.xlsx");
  const data = workSheetsFromFile[0].data; // 获取第一个工作表的数据

  // 跳过表头
  const headers = data[0];
  const records = data.slice(1);
  const weaponIds = [];
  const priorityWeaponIds = [];
  for (const record of records) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = record[index];
    });

    if (row.rarity !== 4) {
      continue;
    }
    const isPriority = weaponInPriority(row.series_name, row.star5_date);
    const weaponId = row.ID;
    weaponIds.push(weaponId);
    if (isPriority) {
      priorityWeaponIds.push(weaponId);
    }
    if (row["uncap_img[]"]) {
      console.log(row["uncap_img[]"])
      const extraPhotoIndexes = row["uncap_img[]"].toString().split(";");
      weaponIds.push(...extraPhotoIndexes.map((index) => `${weaponId}_0${index}`));
      if (isPriority) {
        priorityWeaponIds.push(...extraPhotoIndexes.map((index) => `${weaponId}_0${index}`));
      }
    }
    console.log(`Adding ${row.series_name} ${row.name_jp}`);
  }
  await downloadImages(
    weaponIds.map((weaponId) => getWeaponMainPhotoUrls(weaponId)),
    `${databaseDir}/weapon/main`
  );
  await downloadImages(
    weaponIds.map((weaponId) => getWeaponNormalPhotoUrls(weaponId)),
    `${databaseDir}/weapon/normal`
  );
  await downloadImages(
    priorityWeaponIds.map((weaponId) => getWeaponMainPhotoUrls(weaponId)),
    `${databaseDir}/priority/weapon/main`
  );
  await downloadImages(
    priorityWeaponIds.map((weaponId) => getWeaponNormalPhotoUrls(weaponId)),
    `${databaseDir}/priority/weapon/normal`
  );
}

async function downloadSummonPhotos(databaseDir) {
  // 读取 xlsx 文件
  const workSheetsFromFile = xlsx.parse("./scripts/equipments/summon.xlsx");
  const data = workSheetsFromFile[0].data; // 获取第一个工作表的数据

  // 跳过表头
  const headers = data[0];
  const records = data.slice(1);
  const summonIds = [
    "2040430000", // 苍空之楔
    "2040290000", // 植松伸夫
  ];
  for (const record of records) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = record[index];
    });

    if (row.rarity !== 4) {
      continue;
    }
    if (row.category === "活动") {
      continue;
    }
    const summonId = row.ID;
    summonIds.push(summonId);
    if (row["uncap_img[]"]) {
      const extraPhotoIndexes = row["uncap_img[]"].toString().split(";");
      summonIds.push(
        ...extraPhotoIndexes.map((index) => `${summonId}_0${index}`)
      );
    }
    console.log(`Adding ${row.series_name} ${row.name_jp}`);
  }
  await downloadImages(
    summonIds.map((summonId) => getSummonMainPhotoUrls(summonId)),
    `${databaseDir}/summon/party_main`
  );
  await downloadImages(
    summonIds.map((summonId) => getSummonSubPhotoUrls(summonId)),
    `${databaseDir}/summon/party_sub`
  );
}

async function main() {
  const { type, databaseDir } = program.opts();

  if (!databaseDir) {
    console.error('Database directory is required');
    process.exit(1);
  }

  switch (type) {
    case 'quest':
      await downloadQuestPhotos();
      break;
    case 'character':
      await downloadCharacterPhotos(databaseDir);
      break;
    case 'weapon':
      await downloadWeaponPhotos(databaseDir);
      break;
    case 'summon':
      await downloadSummonPhotos(databaseDir);
      break;
    case 'skin':
      await downloadSkinPhotos(databaseDir);
      break;
    default:
      console.error('Invalid type specified');
      process.exit(1);
  }
}

main().catch(console.error);
