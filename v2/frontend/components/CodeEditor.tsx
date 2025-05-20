'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/CodeEditor.module.css';
import terminalStyles from '../styles/Terminal.module.css';

interface CodeLine {
  content: string;
}

const CodeEditor: React.FC = () => {
  const [codeVisible, setCodeVisible] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Example code with syntax highlighting classes applied
  const codeLines: CodeLine[] = [
    { content: `<span class="${styles.codeTokenKeyword}">const</span> <span class="${styles.codeTokenVariable}">add</span> <span class="${styles.codeTokenOperator}">=</span> <span class="${styles.codeTokenOperator}">(</span><span class="${styles.codeTokenVariable}">a</span><span class="${styles.codeTokenOperator}">,</span> <span class="${styles.codeTokenVariable}">b</span><span class="${styles.codeTokenOperator}">)</span> <span class="${styles.codeTokenOperator}">=></span> <span class="${styles.codeTokenOperator}">{</span>` },
    { content: `  <span class="${styles.codeTokenKeyword}">return</span> <span class="${styles.codeTokenVariable}">a</span> <span class="${styles.codeTokenOperator}">+</span> <span class="${styles.codeTokenVariable}">b</span><span class="${styles.codeTokenOperator}">;</span>` },
    { content: `<span class="${styles.codeTokenOperator}">};</span>` },
    { content: `<span class="${styles.codeTokenOperator}">>></span> <span class="${styles.codeTokenVariable}">result</span>` },
    { content: `<span>5</span>` },
  ];

  useEffect(() => {
    // Animation delay to simulate code appearing
    const timer = setTimeout(() => {
      setCodeVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const languages = ['javascript', 'typescript', 'python', 'java', 'csharp'];

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`relative w-[600px] h-[400px] rounded-lg overflow-hidden shadow-2xl ${styles.codeWrapper}`}>
      <div className={`${styles.editorContainer} shadow-xl flex flex-col h-full`}>
        <div className="panel-header flex items-center p-3 bg-gray-800 border-b border-gray-700">
          <div className={terminalStyles.windowControls}>
            <div className={`${terminalStyles.windowDot} ${terminalStyles.red}`}></div>
            <div className={`${terminalStyles.windowDot} ${terminalStyles.yellow}`}></div>
            <div className={`${terminalStyles.windowDot} ${terminalStyles.green}`}></div>
          </div>
          <span className="mx-2">💡</span>
          <span className="text-white">Editor</span>
          
          {/* Language dropdown */}
          <div className="ml-auto flex items-center"> 
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="text-xs font-mono bg-indigo-700/30 px-2 py-0.5 rounded">
                  {language.toUpperCase()}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-3 w-3 text-indigo-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                  {languages.map(lang => (
                    <div 
                      key={lang}
                      className={`px-3 py-1 text-xs cursor-pointer hover:bg-gray-700 ${language === lang ? 'bg-indigo-900/30' : ''}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {lang.toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor content */}
        <div className={`flex-1 overflow-hidden ${styles.terminalBg} p-4`}>
          <div className={`text-white font-mono text-sm ${styles.codeEditor}`}>
            <pre>
              {codeLines.map((line, index) => (
                <div 
                  key={index} 
                  className={`opacity-0 ${codeVisible ? styles.codeLineAppear : ''}`}
                  style={{ animationDelay: `${index * 150 + 300}ms` }}
                >
                  <span className={styles.lineNumber}>{index + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: line.content }} />
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;