import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CodeEditor from '@/components/CodeEditor';


import { Metadata } from "next/types";

// Add metadata for better SEO
export const metadata: Metadata = {
  title: "CodeX - Learn to Code",
  description: "Start your coding journey with easy-to-follow tutorials and examples.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-hero-gradient overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-5 -right-5 w-40 h-40 bg-blue-500 rounded-full filter blur-[100px] opacity-20 animate-glow"></div>
        <div className="absolute top-1/3 left-20 w-60 h-60 bg-purple-500 rounded-full filter blur-[120px] opacity-10"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600 rounded-full filter blur-[140px] opacity-10"></div>
        
        {/* Code snippets in background */}
        <div className="absolute top-40 left-10 text-blue-300/20 text-xs">
          &lt;div class=&quot;container&quot;&gt;
        </div>
        <div className="absolute bottom-60 right-10 text-blue-300/20 text-xs">
          return(a + b);
        </div>
        <div className="absolute bottom-1/4 left-1/4 text-blue-300/10 text-xs">
          const result = 
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="navbar-centered">
          <Navbar />
        </div>
        
        <div className="flex flex-row items-center justify-between gap-8 mt-8">
          <div className="w-1/2 flex justify-center">
            <Hero />
          </div>
          <div className="w-1/2">
            <CodeEditor />
          </div>
        </div>
      </div>
    </div>
  );
}

