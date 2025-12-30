'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const demoResponses: Record<string, string> = {
  skills:
    "Based on our industry analysis, the most in-demand skills for geology graduates in Nigeria's energy sector are:\n\n1. Software proficiency (Petrel, GIS)\n2. Field mapping and analysis\n3. Data interpretation\n4. Project management\n\nWant to develop these skills? Our mentors can guide you! Sign up to get matched with industry experts.",
  career:
    "There are several exciting career paths in Nigeria's energy sector for geology graduates:\n\n• Exploration Geologist\n• Reservoir Geologist\n• Environmental Consultant\n• Mining Geologist\n\nOur mentors work in these roles and can help guide your career journey. Ready to connect with them?",
  default:
    "That's a great question! Our mentors specialize in providing detailed guidance on topics like this. Sign up to get personalized answers and connect with industry experts who can help guide your career journey.",
};

export function AIChatPreview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your energy career assistant. Try asking me about geology careers, industry skills, or mentorship opportunities.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current!.scrollTop =
          chatContainerRef.current!.scrollHeight;
      }, 100);
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInputValue('');

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let response: string;
    if (userMessage.content.toLowerCase().includes('skill')) {
      response = demoResponses.skills;
    } else if (userMessage.content.toLowerCase().includes('career')) {
      response = demoResponses.career;
    } else {
      response = demoResponses.default;
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  }

  return (
    <div className="card mx-auto w-full max-w-2xl p-3 sm:p-4">
      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="mb-3 h-[250px] space-y-3 overflow-y-auto p-2 sm:mb-4 sm:h-[300px] sm:space-y-4 sm:p-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex animate-fade-in',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] whitespace-pre-wrap rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-200 dark:bg-surface-700'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex animate-fade-in justify-start">
            <div className="rounded-lg bg-surface-200 p-3 dark:bg-surface-700">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about geology careers, skills, or mentorship..."
          className="input flex-1"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          <Send className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Send</span>
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-surface-600 dark:text-surface-400">
        Note: This is a preview. Sign up for full AI assistance and mentor
        connections!
      </p>
    </div>
  );
}
