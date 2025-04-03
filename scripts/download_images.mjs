import fs from 'fs-extra';
import axios from 'axios';
import { promisify } from 'util';
import path from 'path';

const writeFile = promisify(fs.writeFile);

async function downloadImages(imageUrls) {
    try {
        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const fileName = url.split('/').pop();
            await writeFile(path.join("public/assets/quest", fileName), response.data);
            console.log(`Downloaded ${fileName}`);
        }
        console.log('All images downloaded successfully.');
    } catch (error) {
        console.error('Error downloading images:', error);
    }
}

function getQuestPhotoUrl(thumbnail_image) {
  return `https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/quest/assets/lobby/${thumbnail_image}.png`
}

const quests = fs.readJSONSync("./public/list/quest.json")

const imgUrls = quests.map((quest) => getQuestPhotoUrl(quest.thumbnail_image))

await downloadImages(imgUrls)

