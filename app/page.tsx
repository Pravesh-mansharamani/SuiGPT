"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { ModeToggle } from '@/components/mode-toggle';
import { CursorTypewriter, TopicsTypewriter } from '@/components/typewriter-effect';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const topics = ['Sui', 'Move Language', 'Smart Contracts', 'Blockchain Development'];

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
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-20 items-center justify-center max-w-screen-xl mx-auto px-4">
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-1 whitespace-nowrap">
              <span>Sui</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">
                GPT
              </span>
              <CursorTypewriter text="_" />
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-6 bg-white">
        <Card className="flex flex-col h-[calc(100vh-8rem)] border-0 shadow-sm bg-white">
          <ScrollArea 
            className="flex-1 p-4 md:p-6"
            ref={scrollAreaRef}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="p-6 rounded-full bg-blue-50">
                  <Bot className="w-12 h-12 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-medium text-slate-900 flex items-center gap-2 justify-center flex-wrap">
                    Hi! How can I help you with{" "}
                    <TopicsTypewriter topics={topics} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-5 py-3 max-w-[80%] shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-50 text-slate-900'
                      }`}
                    >
                      <ReactMarkdown 
                        className={`prose ${
                          message.role === 'user' 
                            ? 'prose-invert prose-p:text-white prose-headings:text-white' 
                            : 'prose-slate prose-p:text-slate-900 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-blue-600'
                        } max-w-none prose-p:leading-relaxed prose-p:whitespace-pre-wrap prose-pre:bg-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-li:text-slate-900 prose-headings:mb-4 prose-p:my-3 prose-ul:my-4 prose-ol:my-4 prose-pre:overflow-x-auto prose-pre:w-full`}
                        components={{
                          p: ({ children }) => (
                            <p className="whitespace-pre-wrap">{children}</p>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="bg-slate-50 rounded-2xl px-5 py-3 shadow-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-slate-100 bg-white p-4">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Sui... (Shift+Enter for new line)"
                className="min-h-[56px] max-h-[200px] resize-none bg-slate-50 border-slate-200 focus:border-blue-500 rounded-xl text-slate-900 placeholder:text-slate-500"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-[56px] w-[56px] bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}