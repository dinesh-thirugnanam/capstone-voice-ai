const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error('GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.models) {
      console.log('Available Gemini models that support generateContent:');
      data.models
        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .forEach(model => {
          console.log(`- ${model.name.replace('models/', '')}`);
        });
    } else {
      console.error('Error:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listModels();
