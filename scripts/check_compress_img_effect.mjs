import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

const inputFile = "./public/uploads/charas/680e35941ca63f291fb09da5_charas_thumb.png";
// const inputFile = "./scripts/image.png";
const outputDir = 'scripts/output';

const compressionTasks = [
  {
    label: "PNG (C=1)",
    outputFilename: "png_c1.png",
    operation: (i) => i.png({ compressionLevel: 1 }),
  },
  {
    label: "PNG (C=5)",
    outputFilename: "png_c5.png",
    operation: (i) => i.png({ compressionLevel: 5 }),
  },
  {
    label: "PNG (C=9)",
    outputFilename: "png_c9.png",
    operation: (i) => i.png({ compressionLevel: 9 }),
  },
  {
    label: "WebP (Q=1)",
    outputFilename: "webp_q1.webp",
    operation: (i) => i.webp({ quality: 1 }),
  },
  {
    label: "WebP (Q=5)",
    outputFilename: "webp_q5.webp",
    operation: (i) => i.webp({ quality: 5 }),
  },
  {
    label: "WebP (Q=10)",
    outputFilename: "webp_q10.webp",
    operation: (i) => i.webp({ quality: 10 }),
  },
  {
    label: "WebP (Q=50)",
    outputFilename: "webp_q50.webp",
    operation: (i) => i.webp({ quality: 50 }),
  },
  {
    label: "WebP (Q=75)",
    outputFilename: "webp_q75.webp",
    operation: (i) => i.webp({ quality: 75 }),
  },
  {
    label: "WebP (Q=90)",
    outputFilename: "webp_q90.webp",
    operation: (i) => i.webp({ quality: 90 }),
  },
  {
    label: "WebP (Lossless)",
    outputFilename: "webp_lossless.webp",
    operation: (i) => i.webp({ lossless: true }),
  },
];

(async () => {
  try {
    console.log(`Input file: ${inputFile}`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Output directory created/ensured: ${outputDir}`);

    // Get original file size
    const originalStat = await fs.stat(inputFile);
    console.log(`Original PNG Size: ${(originalStat.size / 1024).toFixed(2)} KB`);

    // Initialize results array
    const results = [];

    console.log("\nStarting compression tests...");

    // Loop through compression tasks
    for (const task of compressionTasks) {
      // Construct output path
      const outputPath = path.join(outputDir, task.outputFilename);
      console.log(`Processing: ${task.label}...`);

      // Record start time
      const startTime = performance.now();

      // Execute compression
      await task.operation(sharp(inputFile)).toFile(outputPath);

      // Record end time
      const endTime = performance.now();

      // Calculate duration
      const duration = endTime - startTime;

      // Get stats
      const stats = await fs.stat(outputPath);

      // Push result
      results.push({
        Setting: task.label,
        'Size (KB)': (stats.size / 1024).toFixed(2),
        'Time (ms)': duration.toFixed(2),
      });
    }

    // Add table header
    console.log("\n--- Compression Test Results ---");
    // Print results table
    console.table(results);

  } catch (error) {
    console.error('Error during compression test:', error);
    if (error.code === 'ENOENT') {
      console.error(`Please ensure the input file exists at: ${path.resolve(inputFile)}`);
    }
  }
})();
