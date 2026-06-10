# Finance AI Chatbot - Setup & Testing Guide

## 🎯 What Was Fixed

### Issue
The AI chatbot was not properly analyzing finance data. The system prompt lacked clear instructions for analyzing transactions, budgets, and subscriptions.

### Solutions Implemented

1. **Enhanced System Prompt** 
   - Clear summary of financial data structure
   - Specific instructions for analyzing different question types
   - Full context with transactions, budgets, and subscriptions

2. **Rule-Based Fallback**
   - If Ollama is not available, the chatbot uses intelligent rule-based responses
   - Handles common finance questions like balance, income, expenses, categories, etc.

3. **Better Error Handling**
   - 30-second timeout for streaming responses
   - Proper error logging and fallback mechanisms
   - Smooth degradation when AI model is unavailable

## 🚀 How to Test

### Option 1: With Ollama (Best Experience)

1. **Install Ollama** (if not already installed)
   ```bash
   # Download from https://ollama.ai
   ```

2. **Start Ollama with phi4-mini model**
   ```bash
   ollama run phi4-mini
   # This will run on http://localhost:11434
   ```

3. **Start your backend**
   ```bash
   cd d:\Projects\Life-OS\backend
   npm start
   ```

4. **Test with the frontend**
   - Open http://localhost:3000/finance
   - Click the Finance AI button (bottom right)
   - Try asking: 
     - "What's my current balance?"
     - "How much did I spend on food?"
     - "Show me my expense breakdown"
     - "What are my subscriptions?"

### Option 2: Without Ollama (Fallback Mode)

1. **Start your backend without Ollama**
   ```bash
   cd d:\Projects\Life-OS\backend
   npm start
   ```

2. **Test with the frontend**
   - The chatbot will automatically use rule-based responses
   - All basic finance questions will still be answered correctly

3. **Test endpoint directly** (Optional)
   ```bash
   # Use the test script
   cd d:\Projects\Life-OS\backend
   # You'll need a valid auth token first
   node test-finance-ai.js
   ```

## 📊 Example Questions the Chatbot Can Answer

### With Ollama (AI-Powered)
- "Analyze my spending patterns"
- "Am I on track with my budget?"
- "Give me financial advice based on my transactions"
- "What are my top expense categories?"
- "How can I save more money?"

### Without Ollama (Rule-Based)
- "What's my current balance?"
- "How much have I earned?"
- "How much have I spent?"
- "Show me expenses by category"
- "What are my recent transactions?"
- "Do I have any budgets set?"
- "What subscriptions do I have?"

## 🔧 Configuration

### Environment Variables (Optional)
```bash
# In .env file
OLLAMA_URL=http://localhost:11434/api/chat  # Default
NODE_ENV=development
```

### Model Selection
Currently using: `phi4-mini` (optimized for 8GB RAM)

To change model, edit `backend/services/aiEngine.js`:
```javascript
const MODEL_NAME = 'phi4-mini'; // Change this to your preferred model
```

## 📁 Files Modified

- `/backend/services/aiEngine.js` - Enhanced chatbot logic with:
  - `ruleBasedFinanceAnswer()` - Fallback function
  - `chatWithFinanceAI()` - Main chatbot function with better system prompt

- `/backend/test-finance-ai.js` - New test script (optional)

## 🐛 Troubleshooting

### Chatbot returns error "Failed to connect to AI engine"
**Solution**: This is normal. The backend will automatically switch to rule-based responses. Make sure your finance data is being sent correctly.

### Chatbot gives irrelevant answers
**Solution**: Try rephrasing your question. The rule-based system matches keywords like "balance", "expense", "income", etc.

### Chatbot takes too long to respond
**Solution**: 
1. Check if Ollama is running: `curl http://localhost:11434/api/tags`
2. If Ollama is slow, switch to rule-based by stopping Ollama
3. Check backend logs: `npm start` shows real-time logs

### No response from chatbot at all
**Solution**:
1. Check if backend is running: Visit `http://localhost:5000/api/health`
2. Check browser console for errors
3. Check if you're authenticated (token in localStorage)
4. Try asking a simple question: "What's my balance?"

## ✅ How to Verify It's Working

1. **Frontend Test**
   - Open Finance page
   - Click Finance AI button
   - Ask: "What's my current balance?"
   - Should see a response within 5-10 seconds

2. **Backend Test**
   ```bash
   # Check if finance route is working
   curl -X POST http://localhost:5000/api/finance/chat \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{"role": "user", "content": "What is my balance?"}],
       "context": {"summary": {"income": 5000, "expense": 3000}}
     }'
   ```

3. **Health Check**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: { "success": true, "message": "Life OS API is running ⚡" }
   ```

## 📚 API Endpoint Reference

### POST /api/finance/chat
**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's my balance?"
    }
  ],
  "context": {
    "summary": {
      "income": 5000,
      "expense": 3200,
      "balance": 1800
    },
    "transactions": [...],
    "budgets": [...],
    "subscriptions": [...],
    "expensesByCategory": {...}
  }
}
```

**Response:** Server-Sent Events (SSE) stream
- Data format: `data: {"content": "response text"}\n\n`
- End signal: `data: [DONE]\n\n`

## 🎓 Next Steps

1. Test the chatbot with your actual finance data
2. If Ollama is available, install it for better AI responses
3. Consider adding more sophisticated prompts for specific analyses
4. Monitor performance and adjust timeout/model if needed

## 📞 Support

If the chatbot is still not working:
1. Check backend logs for errors
2. Verify finance data is being sent from frontend
3. Test with rule-based mode first (no Ollama needed)
4. Check that authentication token is valid
