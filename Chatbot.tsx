import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './Button';
import { geminiService } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  context: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your CareerPath AI assistant. How can I help you with your career transition today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await geminiService.chatWithGemini(userMessage, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`mb-4 w-80 md:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px]'}`}
          >
            {/* Header */}
            <div className="p-5 bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Assistant.Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/50">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' 
                          : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-400" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Enter query..."
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all font-mono text-zinc-900 dark:text-white"
                    />
                    <Button size="md" onClick={handleSend} disabled={isLoading || !input.trim()} className="rounded-none px-5">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform duration-300"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
};
