import React, { useEffect, useState, useRef } from 'react';

// 1. COMPONENT TYPEWRITER (Més lent i amb cursor integrat)
const TypewriterLine = ({ text, onComplete, isActive }: { text: string; onComplete?: () => void, isActive: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    // Si és molt llarg, pinta-ho de cop per no avorrir
    if (text.length > 80) {
      setDisplayedText(text);
      if (onComplete) onComplete();
      return;
    }

    let index = 0;
    // ⚡ VELOCITAT RETRO: 30ms (sembla un mòdem de 300 bauds)
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, 15); 

    return () => clearInterval(intervalId);
  }, [text]);

  return (
    <span>
      {displayedText}
      {/* Si és la línia activa, mostrem el cursor enganxat al text */}
      {isActive && <span className="cursor-block">█</span>}
    </span>
  );
};

// 2. COMPONENT DE CÀRREGA (Els tres punts "...")
const LoadingDots = () => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
};

interface ConsoleProps { 
  logs: string[]; 
  isBusy?: boolean; // Nova prop per saber si estem carregant
}

export const ConsoleDisplay: React.FC<ConsoleProps> = ({ logs, isBusy = false }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Auto-scroll
  useEffect(() => { 
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [logs, currentLineIndex, isBusy]);

  // Si arriben logs nous, assegurar que el procés de mecanografia continua
  useEffect(() => {
    if (logs.length > 0 && currentLineIndex >= logs.length) {
        // Ja hem pintat tot, res a fer
    }
  }, [logs]);

  return (
    <>
      <style>{`
        /* Scrollbar Cyberpunk */
        .cyber-console::-webkit-scrollbar { width: 8px; }
        .cyber-console::-webkit-scrollbar-track { background: #001100; border-left: 1px solid #003300; }
        .cyber-console::-webkit-scrollbar-thumb { background: #004400; border: 1px solid #0f0; }
        .cyber-console::-webkit-scrollbar-thumb:hover { background: #0f0; cursor: pointer; }

        /* Cursor Bloc Parpellejant */
        @keyframes blink-block { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0; } 
        }
        .cursor-block {
          display: inline-block;
          width: 8px;
          height: 14px;
          background-color: #0f0;
          animation: blink-block 1s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
          box-shadow: 0 0 5px #0f0;
        }
      `}</style>

      <div 
        className="cyber-console"
        style={{
          background: '#050505', 
          border: '1px solid #333',
          borderTop: '2px solid #0f0', // Accent a dalt
          boxShadow: 'inset 0 0 20px #000', 
          height: '200px', // Una mica més alt
          overflowY: 'auto', 
          padding: '15px', 
          fontSize: '0.85rem', // Lletra una mica més gran estil DOS
          color: '#0f0',
          marginTop: '15px', 
          fontFamily: '"Courier New", Courier, monospace', 
          display: 'flex', 
          flexDirection: 'column',
          textShadow: '0 0 4px rgba(0, 255, 0, 0.6)' // Glow clàssic
        }}
      >
        {/* Línies ja processades (històric) */}
        {logs.map((log, i) => {
          // Línies passades (ja escrites)
          if (i < currentLineIndex) {
            return <div key={i} style={{ marginBottom: '4px', opacity: 0.8 }}>{'>'} {log}</div>;
          }
          // Línia actual (escrivint-se)
          if (i === currentLineIndex) {
            return (
              <div key={i} style={{ marginBottom: '4px' }}>
                {'> '} 
                <TypewriterLine 
                    text={log} 
                    isActive={true} 
                    onComplete={() => setCurrentLineIndex(p => p + 1)} 
                />
              </div>
            );
          }
          return null;
        })}

        {/* Estat d'espera: Si hem acabat de pintar totes les línies i el sistema està ocupat */}
        {currentLineIndex >= logs.length && isBusy && (
           <div style={{ marginTop: '5px', color: '#adff2f' }}>
             {'>'} PROCESSING_DATA <LoadingDots /> <span className="cursor-block">█</span>
           </div>
        )}

        {/* Estat Idle: Si no fa res, cursor esperant ordres al final */}
        {currentLineIndex >= logs.length && !isBusy && (
           <div style={{ marginTop: '5px' }}>
             {'>'} _ <span className="cursor-block">█</span>
           </div>
        )}

        <div ref={logsEndRef} />
      </div>
    </>
  );
};