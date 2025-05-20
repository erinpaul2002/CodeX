'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import styles from '../styles/Terminal.module.css';

interface TerminalPaneProps {
  onData?: (data: string) => void;
  write: (terminal: Terminal) => void;
}

interface TerminalRef {
  fit: () => void;
}

export const TerminalPane = React.forwardRef<TerminalRef, TerminalPaneProps>(
  function TerminalPane({ onData, write }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitRef = useRef<FitAddon | null>(null);
    const [isTerminalReady, setIsTerminalReady] = useState(false);
    
    // Function to manually fit the terminal
    const fitTerminal = useCallback(() => {
      if (fitRef.current && isTerminalReady) {
        try {
          fitRef.current.fit();
        } catch (error) {
          console.error('Error fitting terminal:', error);
        }
      }
    }, [isTerminalReady]);
    
    // Expose the fit function to parent components via a ref
    React.useImperativeHandle(
      ref,
      () => ({
        fit: fitTerminal
      }),
      [fitTerminal]
    );
    
    useEffect(() => {
      // Safety check to ensure we're in browser environment
      if (typeof window === 'undefined') return;
      
      // Ensure the component is mounted and the container is available
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      let resizeObserver: ResizeObserver | null = null;
      let cleanupComplete = false;
  
      // Delay terminal initialization to ensure the container has dimensions
      const initTimeout = setTimeout(() => {
        try {
          const term = new Terminal({
            cursorBlink: true,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
            fontSize: 14,
            theme: {
              background: '#0a0a14',
              foreground: '#f0f0f0',
              cursor: '#a0a0ff',
              black: '#000000',
              red: '#ff5555',
              green: '#50fa7b',
              yellow: '#f1fa8c',
              blue: '#bd93f9',
              magenta: '#ff79c6',
              cyan: '#8be9fd',
              white: '#f8f8f2',
              brightBlack: '#6272a4',
              brightRed: '#ff6e6e',
              brightGreen: '#69ff94',
              brightYellow: '#ffffa5',
              brightBlue: '#d6acff',
              brightMagenta: '#ff92df',
              brightCyan: '#a4ffff',
              brightWhite: '#ffffff'
            },
            scrollback: 1000,
            cursorStyle: 'bar',
            cursorWidth: 2,
            allowTransparency: true,
            rows: 10,
            cols: 80
          });
          
          const fit = new FitAddon();
          term.loadAddon(fit);
          
          term.open(container);
          
          // Add terminal window styling
          container.querySelector('.xterm')?.classList.add('rounded-md', 'overflow-hidden');
          
          // Create a ResizeObserver to detect size changes
          if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => {
              if (fit && !cleanupComplete) {
                try {
                  fit.fit();
                } catch (error) {
                  console.error('Error fitting terminal:', error);
                }
              }
            });
            
            // Observe the container for size changes
            resizeObserver.observe(container);
          }
          
          // Add a small delay before calling fit to ensure dimensions are correct
          const fitTimeout = setTimeout(() => {
            try {
              fit.fit();
              setIsTerminalReady(true);
              
              if (onData) {
                term.onData(onData);
              }
              
              termRef.current = term;
              fitRef.current = fit;
              
              // Call the write callback to expose the terminal
              write(term);
            } catch (error) {
              console.error('Error fitting terminal:', error);
            }
          }, 100);
          
          return () => {
            clearTimeout(fitTimeout);
          };
        } catch (error) {
          console.error('Error initializing terminal:', error);
        }
      }, 100);
  
      return () => {
        cleanupComplete = true;
        clearTimeout(initTimeout);
        
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        
        if (termRef.current) {
          try {
            termRef.current.dispose();
          } catch (error) {
            console.error('Error disposing terminal:', error);
          }
        }
      };
    }, [onData, write]);
  
    // Add a useEffect for window resize
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      const handleResize = () => {
        fitTerminal();
      };
  
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [fitTerminal]);
  
    return (
      <div 
        className={`${styles.container} ${styles.xtermWrapper}`}
        ref={containerRef}
      />
    );
  }
);
