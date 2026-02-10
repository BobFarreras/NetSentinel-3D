import React, { useState } from 'react';
import { useTrafficMonitor } from '../../hooks/modules/useTrafficMonitor';
import { useRadarLogs } from '../../hooks/modules/useRadarLogs';
import { useWifiRadarSelection } from '../../hooks/modules/useWifiRadarSelection';
import { TrafficPanel } from './TrafficPanel';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

const COLORS = {
    bg: '#020202',
    border: '#0a3a2a',
    // Verde fosforo (menos "neon puro") para lectura prolongada.
    textMain: '#a9f5c9',
    textDim: '#4aa37a',
    textErr: '#ff5555',
    accent: '#00ff88',
    cyan: '#00e5ff'
};

interface ConsoleLogsProps {
    logs: string[];
    devices: DeviceDTO[];
    selectedDevice?: DeviceDTO | null; 
    onClearSystemLogs: () => void;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, devices, selectedDevice, onClearSystemLogs }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'TRAFFIC' | 'RADAR'>('SYSTEM');
    const [isLoading, setIsLoading] = useState(false);
    const traffic = useTrafficMonitor();
    const radar = useRadarLogs();
    const wifiSel = useWifiRadarSelection();

    const handleToggle = async () => {
        setIsLoading(true);
        await traffic.toggleMonitoring();
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleClear = () => {
        if (activeTab === 'SYSTEM') onClearSystemLogs();
        else if (activeTab === 'TRAFFIC') traffic.clearPackets();
        else radar.clear();
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
                ::-webkit-scrollbar-thumb { background: #0a3a2a; }
                ::-webkit-scrollbar-thumb:hover { background: #00ff88; }
            `}</style>

            {/* Cabecera de pestañas y acciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '35px', borderBottom: `1px solid ${COLORS.border}`, marginBottom: '5px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <TabButton label="SYSTEM LOGS" active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} />
                    <TabButton label="LIVE TRAFFIC" active={activeTab === 'TRAFFIC'} onClick={() => setActiveTab('TRAFFIC')} />
                    <TabButton label="RADAR LOGS" active={activeTab === 'RADAR'} onClick={() => setActiveTab('RADAR')} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeTab === 'TRAFFIC' && (
                        <>
                            <span style={{ color: traffic.isActive ? COLORS.cyan : '#444', fontSize: '0.8rem', textShadow: traffic.isActive ? `0 0 4px ${COLORS.cyan}` : 'none' }}>
                                {traffic.isActive ? formatSpeed(traffic.speed) : 'OFFLINE'}
                            </span>
                            <button onClick={handleToggle} disabled={isLoading} style={{
                                background: traffic.isActive ? '#2a0a0a' : '#062012',
                                color: traffic.isActive ? COLORS.textErr : COLORS.accent,
                                border: `1px solid ${traffic.isActive ? COLORS.textErr : COLORS.accent}`,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                padding: '2px 8px',
                                fontWeight: 'bold'
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
                            <div key={i} style={{ borderBottom: '1px solid #111', fontSize: '0.8rem', color: log.includes('ERROR') ? COLORS.textErr : COLORS.textMain, padding: '2px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                <span style={{ color: COLORS.textDim, marginRight: '8px' }}>{new Date().toLocaleTimeString()}</span>{log}
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'RADAR' ? (
                    <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Cabecera tipo tabla (similar a LIVE TRAFFIC) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '58px 1.2fr 1fr 1fr 60px 70px 90px 90px',
                            gap: '6px',
                            padding: '4px 6px',
                            borderBottom: '1px solid #222',
                            color: COLORS.textDim,
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                            background: '#070707',
                            flexShrink: 0
                        }}>
                            <span>TYPE</span>
                            <span>SSID</span>
                            <span>VENDOR</span>
                            <span>SEC</span>
                            <span>CH</span>
                            <span>RSSI</span>
                            <span>RISK</span>
                            <span>LINK</span>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                            {radar.logs.length === 0 && (
                                <div style={{ color: COLORS.textDim, fontSize: '0.8rem', padding: '10px 6px' }}>
                                    Sin actividad. Abre RADAR VIEW y pulsa SCAN AIRWAVES.
                                </div>
                            )}

                            {radar.logs.slice(0).reverse().map((entry, i) => {
                                const time = new Date(entry.ts).toLocaleTimeString();

                                if (entry.kind === 'scan') {
                                    return (
                                        <div key={i} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '58px 1.2fr 1fr 1fr 60px 70px 90px 90px',
                                            gap: '6px',
                                            padding: '3px 6px',
                                            borderBottom: '1px solid #111',
                                            fontFamily: "'Consolas', monospace",
                                            fontSize: '0.7rem',
                                            color: COLORS.accent,
                                            background: 'rgba(0,255,136,0.04)'
                                        }}>
                                            <span style={{ fontWeight: 'bold' }}>SCAN</span>
                                            <span style={{ gridColumn: '2 / span 7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                [{time}] {entry.message}
                                            </span>
                                        </div>
                                    );
                                }

                                if (entry.kind === 'error') {
                                    return (
                                        <div key={i} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '58px 1.2fr 1fr 1fr 60px 70px 90px 90px',
                                            gap: '6px',
                                            padding: '3px 6px',
                                            borderBottom: '1px solid #111',
                                            fontFamily: "'Consolas', monospace",
                                            fontSize: '0.7rem',
                                            color: COLORS.textErr,
                                            background: 'rgba(255,0,0,0.04)'
                                        }}>
                                            <span style={{ fontWeight: 'bold' }}>ERR</span>
                                            <span style={{ gridColumn: '2 / span 7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                [{time}] {entry.message}
                                            </span>
                                        </div>
                                    );
                                }

                                const n = entry.network;
                                const isSelected = wifiSel.selectedBssid === n.bssid;
                                return (
                                    <div
                                      key={i}
                                      onClick={() => wifiSel.setSelectedBssid(n.bssid)}
                                      title="Seleccionar nodo en Radar View"
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '58px 1.2fr 1fr 1fr 60px 70px 90px 90px',
                                        gap: '6px',
                                        padding: '3px 6px',
                                        borderBottom: '1px solid #111',
                                        fontFamily: "'Consolas', monospace",
                                        fontSize: '0.7rem',
                                        color: COLORS.textMain,
                                        cursor: 'pointer',
                                        background: isSelected ? 'rgba(0,229,255,0.08)' : 'transparent'
                                      }}
                                    >
                                        <span style={{ fontWeight: 'bold', color: n.isConnected ? COLORS.cyan : COLORS.textDim }}>
                                            NET
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={n.ssid}>
                                            {n.ssid}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={n.vendor}>
                                            {n.vendor}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={n.securityType}>
                                            {n.securityType}
                                        </span>
                                        <span>{typeof n.channel === 'number' ? n.channel : '?'}</span>
                                        <span>{n.signalLevel}</span>
                                        <span style={{ fontWeight: 'bold' }}>{String(n.riskLevel || '').toUpperCase()}</span>
                                        <span style={{ fontWeight: 800, color: n.isConnected ? COLORS.cyan : COLORS.textDim }}>
                                            {n.isConnected ? 'CONNECTED' : 'NEARBY'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
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

type TabButtonProps = { label: string; active: boolean; onClick: () => void };

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
    <div onClick={onClick} style={{ 
        padding: '0 10px', cursor: 'pointer', 
        color: active ? COLORS.accent : COLORS.border, 
        borderBottom: active ? `2px solid ${COLORS.accent}` : 'none', 
        fontSize: '0.8rem', fontWeight: 'bold',
        textShadow: active ? `0 0 4px ${COLORS.accent}` : 'none'
    }}>{label}</div>
);
