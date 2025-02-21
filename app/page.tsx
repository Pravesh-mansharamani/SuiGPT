"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Allow new line with Shift+Enter
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-[hsl(0_0%_100%)] ${plusJakarta.className}`}>
      <header className="flex items-center justify-center py-6 bg-gradient-to-b from-white to-transparent backdrop-blur-sm border-b border-slate-100">
        <div className="relative">
          <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600 tracking-tight">
            AptosGPT
          </h1>
          <div className="absolute -inset-x-6 -inset-y-4 bg-gradient-to-r from-teal-100 to-emerald-100 opacity-20 blur-2xl rounded-full" />
        </div>
      </header>

      <main className="flex-grow flex flex-col">
        <div className="flex-grow relative overflow-hidden">
          <Card className="absolute inset-0 m-6 bg-white/50 backdrop-blur-sm border border-slate-200 shadow-xl">
            <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="p-4 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 mb-4">
                    <svg
                      className="w-8 h-8 text-teal-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-medium text-slate-700">How can I help you with Aptos today?</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white ml-12' 
                          : 'bg-slate-200 text-slate-900 mr-12'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' 
                            ? 'bg-white/20' 
                            : 'bg-gradient-to-br from-teal-500 to-emerald-500'
                        }`}>
                          {message.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className={`flex-grow prose ${
                          message.role === 'user' ? 'prose-invert' : 'prose-slate'
                        }`}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="p-4 rounded-2xl bg-slate-200 mr-12">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex-shrink-0 flex items-center justify-center">
                          🤖
                        </div>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        <div className="p-6 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Aptos... (Shift+Enter for new line)"
                className="flex-grow min-h-[60px] max-h-[60px] overflow-y-auto resize-none rounded-2xl bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 shadow-lg text-slate-900"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="h-[60px] px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}