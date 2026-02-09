import React, { useState } from 'react';
import { useTrafficMonitor } from '../../hooks/modules/useTrafficMonitor';
import { TrafficPanel } from './TrafficPanel';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs'; 
interface ConsoleLogsProps {
  logs: string[];
  devices: DeviceDTO[]; 
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, devices }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'TRAFFIC'>('SYSTEM');

    // Integrem el Hook del Sniffer aquí
    const traffic = useTrafficMonitor();

    return (
        <div style={{
            height: '200px', background: '#000', borderTop: '1px solid #004400',
            display: 'flex', flexDirection: 'column', padding: '10px'
        }}>
            {/* PESTANYES */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', borderBottom: '1px solid #222' }}>
                <TabButton label="SYSTEM LOGS" active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} />
                <TabButton label="LIVE TRAFFIC" active={activeTab === 'TRAFFIC'} onClick={() => setActiveTab('TRAFFIC')} />
            </div>

            {/* CONTINGUT */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'SYSTEM' ? (
                    // VISUALITZACIÓ DE LOGS CLÀSSICA
                    <div style={{ height: '100%', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {logs.length === 0 && <div style={{ color: '#444' }}>System ready. Waiting for events...</div>}
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px', color: log.includes('ERROR') ? '#ff5555' : '#88ff88' }}>
                                <span style={{ color: '#005500', marginRight: '10px' }}>{new Date().toLocaleTimeString()}</span>
                                {log}
                            </div>
                        ))}
                    </div>
                ) : (
                    // NOU PANELL DE TRÀNSIT
                    <TrafficPanel
                        isActive={traffic.isActive}
                        speed={traffic.speed}
                        packets={traffic.packets}
                        onToggle={traffic.toggleMonitoring}
                        devices={devices} // 👈 PASSEM ELS DISPOSITIUS AL PANELL
                    />
                )}
            </div>
        </div>
    );
};

// Petit component auxiliar per als botons de pestanya
const TabButton = ({ label, active, onClick }: any) => (
    <div
        onClick={onClick}
        style={{
            padding: '5px 10px', cursor: 'pointer',
            color: active ? '#fff' : '#666',
            borderBottom: active ? '2px solid #0f0' : '2px solid transparent',
            fontWeight: 'bold', fontSize: '0.8rem'
        }}
    >
        {label}
    </div>
);