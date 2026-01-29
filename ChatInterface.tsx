
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ExternalLink } from 'lucide-react';
import { ChatMessage } from '../types';
import { queryNewsHistory } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await queryNewsHistory(input, history);
      
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: result.text,
        sources: result.sources
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">TrendPulse AI Analyst</h3>
          <p className="text-xs text-slate-400">Ask about historical news (RAG powered)</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6">
            <Bot size={48} className="text-slate-700" />
            <p className="text-slate-500">
              Ask me something like:<br/>
              <span className="italic font-medium text-slate-400">"What were the negative issues for Samsung in the last week?"</span>
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
            }`}>
              <div className="prose prose-invert text-sm max-w-none">
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700 space-y-1">
                  <p className="text-xs font-semibold text-slate-400">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, sIdx) => (
                      <a 
                        key={sIdx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors text-indigo-300"
                      >
                        <ExternalLink size={10} />
                        {src.title.length > 20 ? src.title.substring(0, 20) + '...' : src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl p-4 rounded-tl-none border border-slate-700 flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-500" size={18} />
              <span className="text-sm text-slate-400">Searching and analyzing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about news history or specific trends..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
