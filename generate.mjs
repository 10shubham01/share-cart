import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { createCanvas } from 'canvas';
import { exec } from 'child_process';

// Paths
const filePath = './public/random.json';
const outputDir = './public/images';
const videoDir = './public/video';
const videoOutputPath = `${videoDir}/output.mp4`;

// Create directories if not exist
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true });

// Read existing numbers
let numbers = [];
if (existsSync(filePath)) {
  const fileContent = await readFile(filePath, 'utf-8');
  try {
    numbers = JSON.parse(fileContent);
    if (!Array.isArray(numbers)) numbers = [];
  } catch {
    numbers = [];
  }
}

// Add a new random number with timestamp
const newNumber = {
  number: Math.floor(Math.random() * 10000),
  timestamp: new Date().toISOString(),
};
numbers.push(newNumber);
await writeFile(filePath, JSON.stringify(numbers, null, 2));

// Group and find repeated numbers
const grouped = numbers.reduce((acc, item) => {
  acc[item.number] = acc[item.number] || [];
  acc[item.number].push(item.timestamp);
  return acc;
}, {});

const repeated = Object.entries(grouped)
  .filter(([_, list]) => list.length > 1)
  .map(([num, timestamps]) => ({
    number: Number(num),
    count: timestamps.length,
    timestamps,
    hue: Math.abs(hashCode(num)) % 360,
  }));

// Create canvas
const canvas = createCanvas(1200, 800);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Draw abstract circles
for (const entry of repeated) {
  const x = 10 + Math.random() * (canvas.width - 20);
  const y = 10 + Math.random() * (canvas.height - 20);
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = `hsl(${entry.hue}, 100%, 70%)`;
  ctx.shadowColor = `hsl(${entry.hue}, 100%, 80%)`;
  ctx.shadowBlur = 12;
  ctx.fill();
}

// Save image to disk
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `output-${timestamp}.png`;
await writeFile(`${outputDir}/${filename}`, canvas.toBuffer('image/png'));
console.log(`✅ Image saved: ${filename}`);

// Generate video using FFmpeg
generateVideoFromImages();

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function generateVideoFromImages() {
  const ffmpegCmd = `ffmpeg -y -framerate 60 -pattern_type glob -i '${outputDir}/output-*.png' -c:v libx264 -pix_fmt yuv420p ${videoOutputPath}`;

  exec(ffmpegCmd, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Error generating video:', err.message);
      return;
    }
    console.log('🎬 Video created:', videoOutputPath);
  });
}
