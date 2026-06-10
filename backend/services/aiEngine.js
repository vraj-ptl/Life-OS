const axios = require('axios');
const User = require('../models/User');

const MODEL_NAME = process.env.OLLAMA_MODEL || process.env.AI_MODEL || 'phi3:latest';

const parseNumberOption = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Phi 3 runs on this machine with a 1024-token context. Higher defaults can
// make Ollama fail during KV-cache allocation and trigger chatbot fallback.
const OLLAMA_OPTIONS = {
  num_ctx: parseNumberOption(process.env.OLLAMA_NUM_CTX, 1024),
  num_predict: parseNumberOption(process.env.OLLAMA_NUM_PREDICT, 128),
  num_batch: parseNumberOption(process.env.OLLAMA_NUM_BATCH, 64),
  temperature: parseNumberOption(process.env.OLLAMA_TEMPERATURE, 0.7),
  top_k: parseNumberOption(process.env.OLLAMA_TOP_K, 40),
  top_p: parseNumberOption(process.env.OLLAMA_TOP_P, 0.9),
};
const OLLAMA_TIMEOUT_MS = parseNumberOption(process.env.OLLAMA_TIMEOUT_MS, 60000);
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || '10m';
const CHAT_FALLBACK_ENABLED = process.env.ENABLE_CHAT_FALLBACK === 'true';

const getOllamaUrl = (endpoint) => {
  const explicitUrl = endpoint === 'chat'
    ? process.env.OLLAMA_CHAT_URL
    : process.env.OLLAMA_GENERATE_URL;

  if (explicitUrl) return explicitUrl;

  const rawUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const trimmedUrl = rawUrl.replace(/\/+$/, '');

  if (/\/api\/(chat|generate)$/.test(trimmedUrl)) {
    return trimmedUrl.replace(/\/api\/(chat|generate)$/, `/api/${endpoint}`);
  }

  if (trimmedUrl.endsWith('/api')) {
    return `${trimmedUrl}/${endpoint}`;
  }

  return `${trimmedUrl}/api/${endpoint}`;
};

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
    const response = await axios.post(getOllamaUrl('generate'), {
      model: MODEL_NAME,
      prompt: prompt,
      stream: false,
      keep_alive: OLLAMA_KEEP_ALIVE,
      options: OLLAMA_OPTIONS,
    }, { timeout: OLLAMA_TIMEOUT_MS });

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

