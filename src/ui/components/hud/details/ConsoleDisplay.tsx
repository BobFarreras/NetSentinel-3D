import React, { useEffect, useState, useRef } from 'react';

// Sub-component intern (privat d'aquest fitxer)
const TypewriterLine = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    if (!text) { if (onComplete) onComplete(); return; }

    const intervalId = setInterval(() => {
      setDisplayedText(() => text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, 20); // Una mica més ràpid (20ms)

    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayedText}</span>;
};

// Component Exportable
interface ConsoleProps {
    logs: string[];
}

export const ConsoleDisplay: React.FC<ConsoleProps> = ({ logs }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);

    // Auto-scroll i Reset
    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentLineIndex, logs]);
    useEffect(() => { if (logs.length === 0) setCurrentLineIndex(0); }, [logs]);

    return (
        <div style={{
            background: '#000', border: '1px inset #003300', height: '150px',
            overflowY: 'auto', padding: '10px', fontSize: '0.7rem', color: '#0f0',
            marginTop: '15px', fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column'
        }}>
            {logs.length === 0 && <span style={{ opacity: 0.5 }}>{'>'} WAITING FOR COMMAND...<span className="blinking-cursor" /></span>}

            {logs.map((log, i) => {
                if (i < currentLineIndex) return <div key={i}>{log}</div>;
                if (i === currentLineIndex) return (
                    <div key={i}>
                        <TypewriterLine text={log} onComplete={() => setCurrentLineIndex(prev => prev + 1)} />
                        <span className="blinking-cursor"></span>
                    </div>
                );
                return null;
            })}
            
            {logs.length > 0 && currentLineIndex >= logs.length && <div><span className="blinking-cursor"></span></div>}
            <div ref={logsEndRef} />
        </div>
    );
};