/**
 * Test script for Finance AI Chatbot
 * Run with: node test-finance-ai.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // You'll need to get a real token from login

const mockFinanceContext = {
  summary: {
    income: 5000,
    expense: 3200,
    balance: 1800
  },
  transactions: [
    { _id: '1', type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', date: new Date() },
    { _id: '2', type: 'expense', amount: 1200, category: 'Housing', description: 'Rent', date: new Date() },
    { _id: '3', type: 'expense', amount: 400, category: 'Food & Dining', description: 'Groceries', date: new Date() },
    { _id: '4', type: 'expense', amount: 200, category: 'Transportation', description: 'Gas', date: new Date() },
    { _id: '5', type: 'expense', amount: 150, category: 'Entertainment', description: 'Netflix', date: new Date() }
  ],
  budgets: [
    { _id: '1', category: 'Food & Dining', limit: 500 },
    { _id: '2', category: 'Entertainment', limit: 200 }
  ],
  subscriptions: [
    { _id: '1', name: 'Netflix', amount: 15.99, billingCycle: 'monthly', category: 'Entertainment' },
    { _id: '2', name: 'Spotify', amount: 9.99, billingCycle: 'monthly', category: 'Entertainment' }
  ],
  expensesByCategory: {
    'Housing': 1200,
    'Food & Dining': 400,
    'Transportation': 200,
    'Entertainment': 150
  }
};

const testQuestions = [
  { role: 'user', content: "What's my current balance?" },
  { role: 'user', content: "How much did I spend on food?" },
  { role: 'user', content: "Show me my expense breakdown" },
  { role: 'user', content: "What are my subscriptions?" }
];

async function testFinanceAI() {
  console.log('🤖 Testing Finance AI Chatbot\n');
  console.log('📊 Finance Context:');
  console.log(JSON.stringify(mockFinanceContext, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');

  try {
    for (const question of testQuestions) {
      console.log(`📝 Question: "${question.content}"`);
      console.log('⏳ Waiting for response...\n');

      const response = await axios.post(
        `${BASE_URL}/finance/chat`,
        {
          messages: [question],
          context: mockFinanceContext
        },
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
          responseType: 'stream'
        }
      );

      let answer = '';
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              console.log('\n✅ Response complete\n' + '-'.repeat(50) + '\n');
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                process.stdout.write(parsed.content);
                answer += parsed.content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });

      await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    }

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run test
testFinanceAI();
