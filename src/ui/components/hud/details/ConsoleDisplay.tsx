import React, { useEffect, useState, useRef } from 'react';
import { HUD_COLORS, HUD_TYPO } from "../../../styles/hudTokens";

// 1. COMPONENT TYPEWRITER
const TypewriterLine = ({ text, onComplete, isActive }: { text: string; onComplete?: () => void; isActive: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    // Animació normal
    if (text.length > 80) { // Si és molt llarg, pinta-ho de cop
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
    }, 15); // 15ms per caràcter

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return (
    <span>
      {displayedText}
      {isActive && <span className="cursor-block">█</span>}
    </span>
  );
};

// 2. PUNTS DE CÀRREGA
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
  isBusy?: boolean; 
}

export const ConsoleDisplay: React.FC<ConsoleProps> = ({ logs, isBusy = false }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Aquest índex controla quina línia s'està ANIMANT ara mateix
  const [animatingLineIndex, setAnimatingLineIndex] = useState(0);

  // Aquest Ref recorda quantes línies ja teníem abans de desmuntar el component
  // Per defecte és 0, però la gràcia és que si el component es remunta amb els mateixos logs,
  // podem detectar-ho. (NOTA: React destruirà l'estat local al desmuntar, així que la persistència
  // real entre canvis de pestanya necessitaria guardar això al pare. 
  // PERÒ: Com que 'logs' venen del pare, podem fer el truc següent:
  
  // TRUC: Si al muntar el component ja hi ha logs, assumim que els VLELS (tots menys l'últim potser) són històrics.
  // O millor: Si l'usuari canvia de pestanya i torna, volem veure el text, no l'animació.
  
  // Solució simple: Animem només si l'índex és >= al que teníem.
  // Però com que l'estat es reinicia, usarem un efecte d'inicialització.

  useEffect(() => {
    // Quan es munta el component, si ja hi ha logs, no volem animar-los tots des de zero.
    // Volem animar només els nous que arribin DESPRÉS del muntatge.
    // Però volem que es vegi el text.
    
    // Si tenim 10 logs, posar l'índex a 10 faria que no s'animés res (es mostrarien instantanis).
    setAnimatingLineIndex(logs.length);
  }, []); // Només al muntar!

  // Si arriben nous logs (logs.length creix), l'animació continuarà des d'on estava
  // No cal fer res especial perquè el renderitzat de baix s'encarrega.

  // Auto-scroll
  useEffect(() => { 
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [logs, animatingLineIndex, isBusy]);

  return (
    <>
      <style>{`
        .cyber-console::-webkit-scrollbar { width: 8px; }
        .cyber-console::-webkit-scrollbar-track { background: #001100; border-left: 1px solid #003300; }
        .cyber-console::-webkit-scrollbar-thumb { background: #004400; border: 1px solid ${HUD_COLORS.accentGreen}; }
        .cyber-console::-webkit-scrollbar-thumb:hover { background: ${HUD_COLORS.accentGreen}; cursor: pointer; }
        @keyframes blink-block { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-block { display: inline-block; width: 8px; height: 14px; background-color: ${HUD_COLORS.accentGreen}; animation: blink-block 1s step-end infinite; vertical-align: middle; margin-left: 2px; box-shadow: 0 0 5px ${HUD_COLORS.accentGreen}; }
      `}</style>

      <div 
        className="cyber-console"
        style={{
          background: HUD_COLORS.bgPanel, border: '1px solid #333', borderTop: `2px solid ${HUD_COLORS.accentGreen}`,
          boxShadow: 'inset 0 0 20px #000', height: '200px', overflowY: 'auto', 
          padding: '15px', fontSize: '0.85rem', color: HUD_COLORS.accentGreen, marginTop: '15px', 
          fontFamily: HUD_TYPO.mono, display: 'flex', flexDirection: 'column',
          textShadow: '0 0 4px rgba(0, 255, 0, 0.6)'
        }}
      >
        {logs.map((log, i) => {
          // CAS 1: Línies ja animades o històriques (anteriors a l'índex actual)
          // Aquestes es mostren INSTANTÀNIAMENT (sense Typewriter o amb instant=true)
          if (i < animatingLineIndex) {
             // Use key per evitar re-renders innecessaris
             return (
               <div key={i} style={{ marginBottom: '4px', opacity: 0.8 }}>
                 {'> '} {log}
               </div>
             );
          }
          
          // CAS 2: Línia actual que s'està animant
          if (i === animatingLineIndex) {
            return (
              <div key={i} style={{ marginBottom: '4px' }}>
                {'> '} 
                <TypewriterLine 
                    text={log} 
                    isActive={true} 
                    onComplete={() => setAnimatingLineIndex(p => p + 1)} 
                />
              </div>
            );
          }
          
          // CAS 3: Línies futures (encara no ha arribat el torn)
          return null;
        })}

        {/* Estat d'espera i Idle */}
        {animatingLineIndex >= logs.length && isBusy && (
           <div style={{ marginTop: '5px', color: '#adff2f' }}>{'>'} PROCESSING <LoadingDots /><span className="cursor-block">█</span></div>
        )}
        {animatingLineIndex >= logs.length && !isBusy && (
           <div style={{ marginTop: '5px' }}>{'>'} _ <span className="cursor-block">█</span></div>
        )}

        <div ref={logsEndRef} />
      </div>
    </>
  );
};
