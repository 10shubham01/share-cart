// generateImage.ts
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { createCanvas } from 'canvas';

const filePath = './public/random.json';
const outputDir = './public/images';

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

// Read data
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

// Add new number
const newNumber = {
  number: Math.floor(Math.random() * 10000),
  timestamp: new Date().toISOString(),
};
numbers.push(newNumber);
await writeFile(filePath, JSON.stringify(numbers, null, 2));

// Filter repeated
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

// Draw to canvas
const canvas = createCanvas(1200, 800);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);

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

// Save
const buffer = canvas.toBuffer('image/png');
const filename = `output-${new Date().toISOString().split('T')[0]}.png`;
await writeFile(`${outputDir}/${filename}`, buffer);
console.log(`Image saved as ${filename}`);

function hashCode(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}
