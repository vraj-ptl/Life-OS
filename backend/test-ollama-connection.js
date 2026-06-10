const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const MODEL_NAME = process.env.OLLAMA_MODEL || process.env.AI_MODEL || 'phi3:latest';
const OLLAMA_OPTIONS = {
  num_ctx: Number(process.env.OLLAMA_NUM_CTX || 1024),
  num_predict: Number(process.env.OLLAMA_NUM_PREDICT || 128),
  num_batch: Number(process.env.OLLAMA_NUM_BATCH || 64),
};
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

async function testOllamaConnection() {
  console.log(`\n🧪 Testing Ollama connection at: ${OLLAMA_URL}\n`);

  try {
    console.log('1️⃣  Sending test request to Ollama...');
    const response = await axios({
      method: 'post',
      url: OLLAMA_URL,
      data: {
        model: MODEL_NAME,
        messages: [
          { role: 'user', content: 'Answer with one word: What is the capital of France?' }
        ],
        stream: false,
        keep_alive: process.env.OLLAMA_KEEP_ALIVE || '10m',
        options: OLLAMA_OPTIONS
      },
      timeout: OLLAMA_TIMEOUT_MS
    });

    console.log('\n✅ SUCCESS! Ollama is responding.');
    console.log('\n📄 Response:');
    console.log('   Model:', response.data.model);
    console.log('   Message:', response.data.message?.content?.substring(0, 100) + '...');
    console.log('   Full Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ FAILED! Error connecting to Ollama:');
    console.error('   Error Message:', error.message);
    console.error('   Error Code:', error.code);
    console.error('   URL:', error.config?.url);
    console.error('   Response:', error.response?.data);
    process.exitCode = 1;
  }
}

testOllamaConnection();
