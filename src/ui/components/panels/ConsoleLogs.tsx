import React, { useState } from 'react';
import { useTrafficMonitor } from '../../hooks/modules/useTrafficMonitor';
import { TrafficPanel } from './TrafficPanel';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

// 🎨 COLORS GLOBALS (Coherència amb DetailPanel)
const COLORS = {
    bg: '#020202',        // Fons molt fosc (com sidebar)
    border: '#004400',    // Vores verd fosc
    textMain: '#0dde0d',  // Verd terminal
    textDim: '#008800',   // Verd apagat
    textErr: '#ff3333',   // Vermell error
    glow: '0 0 5px rgba(0, 255, 0, 0.4)' // Brillantor CRT
};

interface ConsoleLogsProps {
    logs: string[];
    devices: DeviceDTO[];
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, devices }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'TRAFFIC'>('SYSTEM');
    const [isLoading, setIsLoading] = useState(false);
    const traffic = useTrafficMonitor();

    const handleToggle = async () => {
        setIsLoading(true);
        await traffic.toggleMonitoring();
        setTimeout(() => setIsLoading(false), 500);
    };

    const formatSpeed = (bytes: number) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
        if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
        return `${bytes} B/s`;
    };

    return (
        <div style={{
            height: '100%',
            background: COLORS.bg,
            borderTop: `2px solid ${COLORS.border}`, // Vora una mica més gruixuda
            display: 'flex',
            flexDirection: 'column',
            padding: '0 10px 5px 10px',
            boxSizing: 'border-box',
            fontFamily: "'Consolas', 'Courier New', monospace",
        }}>
            {/* SCROLLBAR PERSONALITZADA (Estil Matrix) */}
            <style>{`
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #001100; }
                ::-webkit-scrollbar-thumb { background: #005500; }
                ::-webkit-scrollbar-thumb:hover { background: #15d515e8; }
                .log-row { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            `}</style>

            {/* --- CAPÇALERA --- */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                height: '40px', borderBottom: `1px solid ${COLORS.border}`, marginBottom: '5px', flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '15px', height: '100%' }}>
                    <TabButton label="SYSTEM LOGS" active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} />
                    <TabButton label="LIVE TRAFFIC" active={activeTab === 'TRAFFIC'} onClick={() => setActiveTab('TRAFFIC')} />
                </div>

                {activeTab === 'TRAFFIC' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            color: traffic.isActive ? '#00ffff' : COLORS.textDim,
                            fontSize: '0.9rem',
                            textShadow: traffic.isActive ? '0 0 8px #00ffff' : 'none',
                            fontWeight: 'bold'
                        }}>
                            {traffic.isActive ? `NET: ${formatSpeed(traffic.speed)}` : 'OFFLINE'}
                        </div>

                        <button onClick={handleToggle} disabled={isLoading} style={{
                            background: isLoading ? '#333' : (traffic.isActive ? '#330000' : '#003300'),
                            color: isLoading ? '#888' : (traffic.isActive ? '#ff5555' : '#55ff55'),
                            border: `1px solid ${isLoading ? '#555' : (traffic.isActive ? '#ff0000' : '#00ff00')}`,
                            padding: '2px 12px', cursor: isLoading ? 'wait' : 'pointer',
                            fontSize: '0.75rem', fontWeight: 'bold', height: '24px',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            boxShadow: traffic.isActive ? '0 0 10px rgba(255,0,0,0.3)' : '0 0 10px rgba(0,255,0,0.3)'
                        }}>
                            {isLoading ? 'Wait...' : (traffic.isActive ? '⏹ STOP' : '▶ START')}
                        </button>
                    </div>
                )}
            </div>

            {/* --- CONTINGUT --- */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {activeTab === 'SYSTEM' ? (
                    <div style={{ height: '100%', overflowY: 'auto', paddingRight: '5px' }}>
                        {logs.map((log, i) => (
                            <div key={i} className="log-row" style={{
                                padding: '3px 0',
                                borderBottom: '1px solid #081108', // Separador molt subtil
                                fontSize: '0.75rem',
                                color: log.includes('ERROR') ? COLORS.textErr : COLORS.textMain,
                                textShadow: log.includes('ERROR') ? '0 0 5px #ff0000' : 'none',
                                opacity: 0.9
                            }}>
                                <span style={{ color: COLORS.textDim, marginRight: '10px', fontSize: '0.75rem' }}>
                                    {new Date().toLocaleTimeString()}
                                </span>
                                {log}
                            </div>
                        ))}
                        <div style={{ float: "left", clear: "both" }}></div>
                    </div>
                ) : (
                    <TrafficPanel
                        isActive={traffic.isActive}
                        speed={traffic.speed}
                        packets={traffic.packets}
                        devices={devices}
                        compactMode={true}
                        onToggle={() => { }}
                    // Passem els colors perquè el panell també els usi (opcional, o ho editem al fitxer del panell)
                    />
                )}
            </div>
        </div>
    );
};

const TabButton = ({ label, active, onClick }: any) => (
    <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', padding: '0 10px', cursor: 'pointer',
        color: active ? COLORS.textMain : COLORS.textDim,
        borderBottom: active ? `2px solid ${COLORS.textMain}` : '2px solid transparent',
        textShadow: active ? COLORS.glow : 'none',
        fontWeight: 'bold', fontSize: '0.8rem', height: '100%', transition: 'all 0.2s',
        background: active ? 'linear-gradient(to top, rgba(0,50,0,0.3), transparent)' : 'transparent'
    }}>
        {label}
    </div>
);