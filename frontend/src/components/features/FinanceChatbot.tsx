'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, StopCircle, RefreshCw } from 'lucide-react';
import styles from './FinanceChatbot.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FinanceChatbot({ financeContext }: { financeContext: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Finance AI. You can ask me anything about your current balance, recent transactions, or tips on budgeting." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Add a placeholder message for the assistant
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/finance/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages,
          context: financeContext
        }),
        signal: controller.signal
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              setIsTyping(false);
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1].content = assistantContent;
                  return copy;
                });
              } else if (parsed.error) {
                console.error(parsed.error);
              }
            } catch (e) {
              // Ignore incomplete JSON parses and wait for more data
            }
          }
        }
      }
      setIsTyping(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Chat stream aborted');
      } else {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1].content += "\n\n*(Error connecting to AI)*";
          return copy;
        });
      }
      setIsTyping(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          className={styles.fab}
          onClick={() => setIsOpen(true)}
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Bot size={20} className="text-primary-light" />
              <span>Finance AI</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.map((m, idx) => (
              <div key={idx} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.wrapperUser : styles.wrapperAssistant}`}>
                <div className={`${styles.messageBubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className={`${styles.messageWrapper} ${styles.wrapperAssistant}`}>
                  <div className={`${styles.messageBubble} ${styles.bubbleAssistant}`}>
                     <RefreshCw size={14} className="animate-spin" />
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <input 
              type="text" 
              placeholder="Ask about your finances..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            {isTyping ? (
              <button onClick={handleStop} className={styles.stopBtn}>
                <StopCircle size={20} />
              </button>
            ) : (
              <button onClick={handleSend} className={styles.sendBtn} disabled={!input.trim()}>
                <Send size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
