import React, { useState } from 'react';
import { useTrafficMonitor } from '../../hooks/modules/useTrafficMonitor';
import { TrafficPanel } from './TrafficPanel';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

const COLORS = {
    bg: '#020202', border: '#004400', textMain: '#0dde0d', textDim: '#008800', textErr: '#ff3333'
};

interface ConsoleLogsProps {
    logs: string[];
    devices: DeviceDTO[];
    selectedDevice?: DeviceDTO | null; 
    onClearSystemLogs: () => void;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, devices, selectedDevice, onClearSystemLogs }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'TRAFFIC'>('SYSTEM');
    const [isLoading, setIsLoading] = useState(false);
    const traffic = useTrafficMonitor();

    const handleToggle = async () => {
        setIsLoading(true);
        await traffic.toggleMonitoring();
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleClear = () => {
        if (activeTab === 'SYSTEM') onClearSystemLogs();
        else traffic.clearPackets();
    };

    const formatSpeed = (bytes: number) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
        if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
        return `${bytes} B/s`;
    };

    return (
        <div style={{ height: '100%', minHeight: 0, background: COLORS.bg, borderTop: `2px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', padding: '0 5px', fontFamily: 'monospace' }}>
            
            {/* Estilos globales de scrollbar para panel de consola */}
            <style>{`
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #001100; }
                ::-webkit-scrollbar-thumb { background: #005500; }
                ::-webkit-scrollbar-thumb:hover { background: #00ff00; }
            `}</style>

            {/* Cabecera de pestañas y acciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '35px', borderBottom: `1px solid ${COLORS.border}`, marginBottom: '5px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <TabButton label="SYSTEM LOGS" active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} />
                    <TabButton label="LIVE TRAFFIC" active={activeTab === 'TRAFFIC'} onClick={() => setActiveTab('TRAFFIC')} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeTab === 'TRAFFIC' && (
                        <>
                            <span style={{ color: traffic.isActive ? '#0ff' : '#444', fontSize: '0.8rem', textShadow: traffic.isActive ? '0 0 5px #0ff' : 'none' }}>
                                {traffic.isActive ? formatSpeed(traffic.speed) : 'OFFLINE'}
                            </span>
                            <button onClick={handleToggle} disabled={isLoading} style={{
                                background: traffic.isActive ? '#300' : '#030', color: traffic.isActive ? '#f55' : '#5f5',
                                border: `1px solid ${traffic.isActive ? 'red' : 'lime'}`, fontSize: '0.7rem', cursor: 'pointer', padding: '2px 8px', fontWeight: 'bold'
                            }}>
                                {isLoading ? '...' : (traffic.isActive ? '⏹ STOP' : '▶ START')}
                            </button>
                        </>
                    )}
                    
                    {/* Boton de limpieza contextual segun pestaña activa */}
                    <button onClick={handleClear} style={{ background: 'transparent', border: '1px solid #444', color: '#666', cursor: 'pointer', fontSize: '0.7rem' }}>🗑️</button>
                </div>
            </div>

            {/* Contenido principal */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {activeTab === 'SYSTEM' ? (
                    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {/* Logs del sistema: se muestran del mas reciente al mas antiguo */}
                        {logs.slice(0).reverse().map((log, i) => (
                            <div key={i} style={{ borderBottom: '1px solid #111', fontSize: '0.8rem', color: log.includes('ERROR') ? '#f55' : '#0f0', padding: '2px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                <span style={{ color: '#006600', marginRight: '8px' }}>{new Date().toLocaleTimeString()}</span>{log}
                            </div>
                        ))}
                    </div>
                ) : (
                    <TrafficPanel 
                        isActive={traffic.isActive} 
                        speed={traffic.speed} 
                        packets={traffic.packets} 
                        jammedPackets={traffic.jammedPackets}
                        devices={devices} 
                        selectedDevice={selectedDevice} 
                        compactMode={true} 
                        onToggle={() => {}} 
                        onClear={traffic.clearPackets}
                    />
                )}
            </div>
        </div>
    );
};

const TabButton = ({ label, active, onClick }: any) => (
    <div onClick={onClick} style={{ 
        padding: '0 10px', cursor: 'pointer', 
        color: active ? '#0f0' : '#004400', 
        borderBottom: active ? '2px solid #0f0' : 'none', 
        fontSize: '0.8rem', fontWeight: 'bold',
        textShadow: active ? '0 0 5px #0f0' : 'none'
    }}>{label}</div>
);
