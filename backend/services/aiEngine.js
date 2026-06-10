const axios = require('axios');
const User = require('../models/User');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = 'phi4-mini'; // User requested this for 8GB RAM

/**
 * Fallback local rule-based engine in case Ollama is not running.
 */
const ruleBasedInsights = (userData) => {
  const insights = [];
  
  if (userData.stats.completedTasksLastWeek < 5) {
    insights.push("You've been a bit inactive with tasks recently. Let's try breaking them down into smaller chunks.");
  } else {
    insights.push("Great momentum on your tasks! Consider tackling that one big project you've been putting off.");
  }

  if (userData.stats.habitStreakAvg > 3) {
    insights.push("Your habit streaks are looking solid. Consistency is key!");
  } else {
    insights.push("Don't worry about missing a habit day. The most important thing is starting again today.");
  }

  if (userData.stats.totalExpenses > userData.stats.totalIncome) {
    insights.push("Warning: Your expenses are outpacing your income this week. Keep an eye on non-essential spending.");
  }

  return insights.join(' ');
};

/**
 * Generate AI Insights for the user dashboard.
 * Tries to call local Ollama model. Falls back to rule-based.
 */
exports.generateDailyInsights = async (userId, userContext) => {
  try {
    const prompt = `
      You are Life OS, an advanced personal AI coach. 
      Analyze the following user data and provide an actionable overview and specific alerts. 
      You MUST structure your response into exactly three distinct paragraphs:
      1. Tasks: Provide an overview of productivity. If there are overdue tasks, you MUST include a specific alert emphasizing that they need attention.
      2. Habits: Provide an overview of consistency. If there are broken habits (current streak = 0), you MUST include an alert to restart them today.
      3. Finance: Provide an overview of financial health. If there are budget overruns, you MUST include a strict alert warning about overspending.
      Keep it motivating but highlight any alerts clearly so the user knows exactly what is wrong.
      User Data: ${JSON.stringify(userContext)}
    `;

    // Try Ollama
    const response = await axios.post(OLLAMA_URL, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: false,
    }, { timeout: 10000 }); // 10s timeout

    if (response.data && response.data.response) {
      return response.data.response;
    }
    
    throw new Error('Empty response from AI model');
  } catch (error) {
    console.log(`[AI Engine] Ollama (${MODEL_NAME}) unreachable or failed. Falling back to rule-based engine.`);
    return ruleBasedInsights(userContext);
  }
};

/**
 * Smart Scheduling (Task time suggestion)
 */
exports.suggestTaskTime = (taskData, userProductivityPattern) => {
  // Simple rule-based suggestion for now
  // E.g., if high energy, schedule for morning (10 AM)
  const date = new Date();
  if (taskData.energyRequired === 'high') {
    date.setDate(date.getDate() + 1); // Tomorrow
    date.setHours(10, 0, 0, 0);
    return {
      startTime: date,
      reason: 'You typically handle high-energy tasks best in the morning.',
      confidence: 0.85
    };
  } else {
    // low energy -> afternoon
    date.setDate(date.getDate() + 1);
    date.setHours(15, 0, 0, 0);
    return {
      startTime: date,
      reason: 'Low energy tasks are perfect for the mid-afternoon slump.',
      confidence: 0.75
    };
  }
};

/**
 * Finance AI Chatbot stream
 */
exports.chatWithFinanceAI = async (messages, context, res) => {
  const systemPrompt = `You are a financial advisor AI strictly embedded in the user's personal finance dashboard.
Your ONLY purpose is to answer questions related to personal finance, budgeting, saving, and the user's provided transactions.
If asked about programming, general knowledge, or other non-finance topics, you MUST politely decline and remind them you are a finance AI.

User Context:
${JSON.stringify(context, null, 2)}
`;

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/chat',
      data: {
        model: MODEL_NAME,
        messages: ollamaMessages,
        stream: true
      },
      responseType: 'stream'
    });

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content) {
            res.write(`data: ${JSON.stringify({ content: parsed.message.content })}\n\n`);
          }
          if (parsed.done) {
            res.write(`data: [DONE]\n\n`);
            res.end();
          }
        } catch(e) {}
      }
    });

    response.data.on('end', () => {
       res.end();
    });
    
    response.data.on('error', () => {
      res.write(`data: [DONE]\n\n`);
      res.end();
    });
  } catch (err) {
    console.error('[AI Engine] Chat streaming failed', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to connect to AI engine' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
};
