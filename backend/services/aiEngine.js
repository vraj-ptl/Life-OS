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

/**
 * Generate rule-based finance answers (fallback when Ollama is unavailable)
 */
const ruleBasedFinanceAnswer = (userQuestion, context) => {
  const { summary = {}, transactions = [], budgets = [], subscriptions = [], expensesByCategory = {} } = context;
  const questionLower = userQuestion.toLowerCase();

  // Balance question
  if (questionLower.includes('balance') || questionLower.includes('how much do i have')) {
    const balance = (summary.income || 0) - (summary.expense || 0);
    return `Your current balance is $${balance.toFixed(2)}. You have earned $${(summary.income || 0).toFixed(2)} and spent $${(summary.expense || 0).toFixed(2)}.`;
  }

  // Income question
  if (questionLower.includes('income') || questionLower.includes('earned')) {
    return `Your total income is $${(summary.income || 0).toFixed(2)}.`;
  }

  // Expense question
  if (questionLower.includes('expense') || questionLower.includes('spent') || questionLower.includes('spending')) {
    return `Your total expenses are $${(summary.expense || 0).toFixed(2)}. Here's the breakdown by category: ${Object.entries(expensesByCategory).map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`).join(', ')}`;
  }

  // Category breakdown
  if (questionLower.includes('category') || questionLower.includes('breakdown')) {
    if (Object.keys(expensesByCategory).length === 0) {
      return 'No expense data available yet.';
    }
    const breakdown = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
      .join(', ');
    return `Here's your expense breakdown: ${breakdown}`;
  }

  // Recent transactions
  if (questionLower.includes('recent') || questionLower.includes('latest')) {
    if (transactions.length === 0) return 'No transactions recorded yet.';
    const recent = transactions.slice(0, 5);
    return `Your 5 most recent transactions:\n${recent.map(t => `- ${t.description}: $${t.amount.toFixed(2)} (${t.type})`).join('\n')}`;
  }

  // Budget question
  if (questionLower.includes('budget')) {
    if (budgets.length === 0) return 'You haven\'t set any budgets yet. Consider creating one to help manage spending.';
    return `You have ${budgets.length} active budget(s). ${budgets.map(b => `${b.category}: $${b.limit}`).join(', ')}`;
  }

  // Subscriptions
  if (questionLower.includes('subscription')) {
    if (subscriptions.length === 0) return 'You have no active subscriptions tracked.';
    return `You have ${subscriptions.length} subscription(s): ${subscriptions.map(s => `${s.name} ($${s.amount}/${s.billingCycle})`).join(', ')}`;
  }

  // Default helpful response
  return `I can help you analyze your finances. You can ask me about your balance, income, expenses, budget, subscriptions, or request a breakdown by category. Your current balance is $${((summary.income || 0) - (summary.expense || 0)).toFixed(2)}.`;
};

const toMoneyNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toISODate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const compactFinanceContext = (context = {}) => {
  const summary = context.summary || {};
  const transactions = Array.isArray(context.transactions) ? context.transactions : [];
  const budgets = Array.isArray(context.budgets) ? context.budgets : [];
  const subscriptions = Array.isArray(context.subscriptions) ? context.subscriptions : [];
  const expensesByCategory = context.expensesByCategory || {};

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 4)
    .map((transaction) => ({
      date: toISODate(transaction.date),
      type: transaction.type,
      amount: toMoneyNumber(transaction.amount),
      category: transaction.category || 'Uncategorized',
      description: transaction.description || '',
    }));

  const topExpenseCategories = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ category, amount: toMoneyNumber(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    summary: {
      income: toMoneyNumber(summary.income),
      expense: toMoneyNumber(summary.expense),
      balance: toMoneyNumber(summary.balance ?? (toMoneyNumber(summary.income) - toMoneyNumber(summary.expense))),
    },
    counts: {
      transactions: transactions.length,
      budgets: budgets.length,
      subscriptions: subscriptions.length,
    },
    topExpenseCategories,
    recentTransactions,
    budgets: budgets.slice(0, 4).map((budget) => ({
      category: budget.category,
      limit: toMoneyNumber(budget.limit),
      period: budget.period,
    })),
    subscriptions: subscriptions.slice(0, 4).map((subscription) => ({
      name: subscription.name,
      amount: toMoneyNumber(subscription.amount),
      billingCycle: subscription.billingCycle,
      category: subscription.category,
      nextBillingDate: toISODate(subscription.nextBillingDate),
    })),
  };
};

const formatMoney = (amount) => `$${toMoneyNumber(amount).toFixed(2)}`;

const compactFinanceContextText = (financeContext) => {
  const recent = financeContext.recentTransactions
    .map((transaction) => (
      `${transaction.date || 'no-date'} ${transaction.type} ${formatMoney(transaction.amount)} ${transaction.category} ${transaction.description}`.trim()
    ))
    .join('; ') || 'none';

  const categories = financeContext.topExpenseCategories
    .map(({ category, amount }) => `${category} ${formatMoney(amount)}`)
    .join(', ') || 'none';

  const budgets = financeContext.budgets
    .map((budget) => `${budget.category} limit ${formatMoney(budget.limit)}`)
    .join(', ') || 'none';

  const subscriptions = financeContext.subscriptions
    .map((subscription) => `${subscription.name} ${formatMoney(subscription.amount)}/${subscription.billingCycle || 'cycle'}`)
    .join(', ') || 'none';

  return [
    `summary income ${formatMoney(financeContext.summary.income)}, expenses ${formatMoney(financeContext.summary.expense)}, balance ${formatMoney(financeContext.summary.balance)}`,
    `counts transactions ${financeContext.counts.transactions}, budgets ${financeContext.counts.budgets}, subscriptions ${financeContext.counts.subscriptions}`,
    `top categories ${categories}`,
    `recent transactions ${recent}`,
    `budgets ${budgets}`,
    `subscriptions ${subscriptions}`,
  ].join('\n');
};

/**
 * Finance AI Chatbot stream with enhanced analysis
 */
exports.chatWithFinanceAI = async (messages, context, res) => {
  // Set response headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const financeContext = compactFinanceContext(context);
    const financeContextText = compactFinanceContextText(financeContext);

    const systemPrompt = `You are Finance AI inside a personal finance dashboard.
Answer only finance questions. Use this data and do not invent missing details.
Keep answers concise and practical. For non-finance questions, redirect to finance.
Data:
${financeContextText}`;

    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Try to connect to Ollama
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
    console.log(`[AI Engine] Attempting to connect to Ollama at ${ollamaUrl} with model: ${MODEL_NAME}...`);

    const response = await axios({
      method: 'post',
      url: ollamaUrl,
      data: {
        model: MODEL_NAME,
        messages: ollamaMessages,
        stream: true,
        keep_alive: OLLAMA_KEEP_ALIVE,
        options: OLLAMA_OPTIONS
      },
      responseType: 'stream',
      timeout: OLLAMA_TIMEOUT_MS
    });

    console.log('[AI Engine] Connected to Ollama! Starting stream...');

    let hasStreamed = false;

    response.data.on('data', (chunk) => {
      hasStreamed = true;
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content) {
            res.write(`data: ${JSON.stringify({ content: parsed.message.content })}\n\n`);
          }
          if (parsed.done) {
            res.write(`data: [DONE]\n\n`);
            return;
          }
        } catch(e) {
          // Ignore parse errors
        }
      }
    });

    response.data.on('end', () => {
      if (hasStreamed) {
        res.end();
      }
    });
    
    response.data.on('error', (error) => {
      console.error('[AI Engine] Stream error:', error.message);
      if (!hasStreamed) {
        handleChatModelFailure(messages, context, res, error);
      } else {
        res.end();
      }
    });

  } catch (err) {
    console.error('[AI Engine] Chat failed:', err.message);
    console.error('[AI Engine] Error stack:', err.stack);
    console.error('[AI Engine] Error code:', err.code);
    handleChatModelFailure(messages, context, res, err);
  }
};

const handleChatModelFailure = (messages, context, res, error) => {
  if (CHAT_FALLBACK_ENABLED) {
    console.log('[AI Engine] Using fallback rule-based response because ENABLE_CHAT_FALLBACK=true.');
    return useFallbackResponse(messages, context, res);
  }

  sendModelUnavailableResponse(res, error);
};

const sendModelUnavailableResponse = (res, error) => {
  const details = error?.response?.data?.error || error?.message || 'Unknown Ollama error';
  const message = `The local ${MODEL_NAME} model is unavailable right now. Ollama returned: ${details}`;

  res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  res.write(`data: [DONE]\n\n`);
  res.end();
};

/**
 * Send fallback rule-based response
 */
const useFallbackResponse = (messages, context, res) => {
  try {
    const userMessage = messages[messages.length - 1]?.content || '';
    const fallbackAnswer = ruleBasedFinanceAnswer(userMessage, context);
    
    res.write(`data: ${JSON.stringify({ content: fallbackAnswer })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error('[AI Engine] Fallback failed:', err.message);
    res.write(`data: ${JSON.stringify({ content: 'Sorry, I encountered an error. Please try again.' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
};
