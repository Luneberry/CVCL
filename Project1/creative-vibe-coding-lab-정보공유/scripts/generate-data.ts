import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// --- Start of new debug code ---
console.log('--- Key Loading Debug ---');
if (process.env.API_KEY || process.env.GEMINI_API_KEY) {
    console.log('Found existing environment variable before loading .env file:');
    if (process.env.API_KEY) {
        console.log(`- process.env.API_KEY starts with: ${process.env.API_KEY.substring(0, 5)}...`);
    }
    if (process.env.GEMINI_API_KEY) {
        console.log(`- process.env.GEMINI_API_KEY starts with: ${process.env.GEMINI_API_KEY.substring(0, 5)}...`);
    }
    console.log('NOTE: Forcing override of environment variables with .env.local file.');
} else {
    console.log('No pre-existing API_KEY or GEMINI_API_KEY found in environment.');
}
console.log('--------------------------');
// --- End of new debug code ---


// 1. Load Env variables immediately
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading env from ${envPath} and overriding any existing env variables.`);
  dotenv.config({ path: envPath, override: true });
} else {
  console.log('Loading env from default .env');
  dotenv.config();
}

// 2. Set API Key for GoogleGenAI
if (process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

if (!process.env.API_KEY) {
  console.warn('WARNING: API_KEY not found. Gemini processing might fail.');
} else {
  console.log(`Using API Key: ${process.env.API_KEY.substring(0, 10)}... (Verified)`);
}

// 3. Main execution
async function main() {
  try {
    // Dynamic import to ensure env vars are set before service initialization
    const { parseChatFile } = await import('../services/chatParser');
    const { processMessagesWithGemini } = await import('../services/geminiService');

    const INPUT_FILE = 'KakaoTalk_group.txt';
    const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
    const OUTPUT_FILE = path.join(OUTPUT_DIR, 'session-5.json');

    console.log(`Reading input file: ${INPUT_FILE}`);
    const filePath = path.resolve(process.cwd(), INPUT_FILE);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const text = fs.readFileSync(filePath, 'utf-8');
    
    console.log('Parsing chat messages...');
    const parsedMessages = parseChatFile(text);
    console.log(`Found ${parsedMessages.length} messages with links.`);

    if (parsedMessages.length === 0) {
        console.log("No messages with links found. Exiting.");
        return;
    }

    console.log('Processing with Gemini (this may take a moment)...');
    const processedItems = await processMessagesWithGemini(parsedMessages);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`Writing results to ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedItems, null, 2), 'utf-8');
    
    console.log('Done!');
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main();
