import React, { useEffect, useState, useRef } from 'react';
import { HUD_COLORS, HUD_TYPO } from "../../../styles/hudTokens";

// --- TYPEWRITER (Efecto de escritura) ---
const TypewriterLine = ({ text, onComplete, isActive }: { text: string; onComplete?: () => void; isActive: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    if (text.length > 120) { // Si es muy largo, pintar de golpe
      setDisplayedText(text);
      if (onComplete) onComplete();
      return;
    }

    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, 10); // Velocidad rápida

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return (
    <span>
      {displayedText}
      {isActive && <span className="cursor-block">█</span>}
    </span>
  );
};

// --- LOADING DOTS ---
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

// --- INTERFACE PARA EL PROMPT INTERACTIVO ---
export interface ConsolePrompt {
  type: 'CONFIRM' | 'SELECT';
  message: string;
  options: string[];
  onSelect: (index: number) => void;
}

interface ConsoleProps { 
  logs: string[]; 
  isBusy?: boolean;
  prompt?: ConsolePrompt | null; // <--- Nuevo Prop
}

export const ConsoleDisplay: React.FC<ConsoleProps> = ({ logs, isBusy = false, prompt = null }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [animatingLineIndex, setAnimatingLineIndex] = useState(0);
  
  // Estado para la selección del usuario (flechas)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  // Resetear selección cuando cambia el prompt
  useEffect(() => {
    if (prompt) setSelectedOptionIndex(0);
  }, [prompt]);

  // Manejador de Teclado (Flechas y Enter)
  useEffect(() => {
    if (!prompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOptionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedOptionIndex(prev => Math.min(prompt.options.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        prompt.onSelect(selectedOptionIndex); // Devolver la selección al padre
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, selectedOptionIndex]);

  // Inicialización de logs (para no re-animar lo viejo)
  useEffect(() => {
    setAnimatingLineIndex(logs.length);
  }, []); // Solo al montar

  // Auto-scroll
  useEffect(() => { 
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [logs, animatingLineIndex, isBusy, prompt]); // Scroll también si sale prompt

  return (
    <>
      <style>{`
        .cyber-console::-webkit-scrollbar { width: 8px; }
        .cyber-console::-webkit-scrollbar-track { background: #001100; border-left: 1px solid #003300; }
        .cyber-console::-webkit-scrollbar-thumb { background: #004400; border: 1px solid ${HUD_COLORS.accentGreen}; }
        .cyber-console::-webkit-scrollbar-thumb:hover { background: ${HUD_COLORS.accentGreen}; cursor: pointer; }
        @keyframes blink-block { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-block { display: inline-block; width: 8px; height: 14px; background-color: ${HUD_COLORS.accentGreen}; animation: blink-block 1s step-end infinite; vertical-align: middle; margin-left: 2px; box-shadow: 0 0 5px ${HUD_COLORS.accentGreen}; }
        
        /* Estilos para las opciones */
        .console-option { padding: 2px 0; cursor: pointer; transition: color 0.1s; }
        .console-option.selected { color: #00e5ff; font-weight: bold; text-shadow: 0 0 8px rgba(0, 229, 255, 0.6); }
        .console-option:hover { color: #ccffdd; }
      `}</style>

      <div 
        className="cyber-console"
        style={{
          background: HUD_COLORS.bgPanel, border: '1px solid #333', borderTop: `2px solid ${HUD_COLORS.accentGreen}`,
          boxShadow: 'inset 0 0 20px #000', height: '240px', overflowY: 'auto', 
          padding: '15px', fontSize: '0.85rem', color: HUD_COLORS.accentGreen, marginTop: '15px', 
          fontFamily: HUD_TYPO.mono, display: 'flex', flexDirection: 'column',
          textShadow: '0 0 4px rgba(0, 255, 0, 0.6)'
        }}
      >
        {logs.map((log, i) => {
          if (i < animatingLineIndex) {
             return <div key={i} style={{ marginBottom: '4px', opacity: 0.8 }}>{'>'} {log}</div>;
          }
          if (i === animatingLineIndex) {
            return (
              <div key={i} style={{ marginBottom: '4px' }}>
                {'>'} <TypewriterLine text={log} isActive={true} onComplete={() => setAnimatingLineIndex(p => p + 1)} />
              </div>
            );
          }
          return null;
        })}

        {/* --- ÁREA INTERACTIVA (PROMPT) --- */}
        {prompt && animatingLineIndex >= logs.length && (
          <div style={{ marginTop: '15px', borderTop: '1px dashed #004400', paddingTop: '10px' }}>
            <div style={{ color: '#ff5555', marginBottom: '8px' }}>[SYSTEM_QUERY]: {prompt.message}</div>
            <div style={{ paddingLeft: '10px' }}>
              {prompt.options.map((opt, idx) => (
                <div 
                  key={idx} 
                  className={`console-option ${idx === selectedOptionIndex ? 'selected' : ''}`}
                  onClick={() => prompt.onSelect(idx)} // Click support también
                >
                  {idx === selectedOptionIndex ? '>> ' : '   '} [{opt}]
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- LOADING --- */}
        {animatingLineIndex >= logs.length && isBusy && !prompt && (
           <div style={{ marginTop: '5px', color: '#adff2f' }}>{'>'} PROCESSING <LoadingDots /><span className="cursor-block">█</span></div>
        )}
        
        {/* --- IDLE CURSOR --- */}
        {animatingLineIndex >= logs.length && !isBusy && !prompt && (
           <div style={{ marginTop: '5px' }}>{'>'} _ <span className="cursor-block">█</span></div>
        )}

        <div ref={logsEndRef} />
      </div>
    </>
  );
};