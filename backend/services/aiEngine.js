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
      You are Life OS, a personal AI coach. 
      Analyze the following user data and provide a short, motivating, 2-paragraph daily insight focusing on productivity, habits, and finances.
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
