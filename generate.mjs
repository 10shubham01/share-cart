import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const filePath = 'random.json';

// Read existing data or initialize an empty array
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

// Generate a new random number
const newNumber = {
  number: Math.floor(Math.random() * 10000),
  timestamp: new Date().toISOString()
};

// Add it to the array
numbers.push(newNumber);

// Save back to the file
await writeFile(filePath, JSON.stringify(numbers, null, 2));

console.log(`Random number ${newNumber.number} added to ${filePath}`);
