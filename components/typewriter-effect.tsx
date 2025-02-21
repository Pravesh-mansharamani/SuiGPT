'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const TypewriterComponent = dynamic(() => import('typewriter-effect'), {
  ssr: false,
  loading: () => <span>_</span>,
});

interface CursorTypewriterProps {
  text: string;
  delay?: number;
}

interface TopicsTypewriterProps {
  topics: string[];
}

export function CursorTypewriter({ text, delay = 400 }: CursorTypewriterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="animate-pulse">_</span>;
  }

  return (
    <div className="w-[16px] -ml-1">
      <TypewriterComponent
        onInit={(typewriter) => {
          typewriter
            .typeString(text)
            .pauseFor(500)
            .deleteAll()
            .pauseFor(500)
            .start();
        }}
        options={{
          autoStart: true,
          loop: true,
          cursor: "",
          delay,
        }}
      />
    </div>
  );
}

export function TopicsTypewriter({ topics }: TopicsTypewriterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="animate-pulse">{topics[0]}</span>;
  }

  return (
    <div className="text-blue-600 font-bold inline-flex">
      <TypewriterComponent
        onInit={(typewriter) => {
          topics.forEach((topic) => {
            typewriter
              .typeString(topic)
              .pauseFor(1000)
              .deleteAll()
              .pauseFor(200);
          });
          typewriter.start();
        }}
        options={{
          autoStart: true,
          loop: true,
          delay: 50,
          deleteSpeed: 30,
          cursor: "|",
        }}
      />
    </div>
  );
} 