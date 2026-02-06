import React from 'react';
import { OpenPortDTO } from '../../../../shared/dtos/NetworkDTOs';

interface ResultProps {
    results: OpenPortDTO[];
    isAuditing: boolean;
    hasLogs: boolean;
}

export const PortResults: React.FC<ResultProps> = ({ results, isAuditing, hasLogs }) => {
    
    // Si estem auditant, no mostrem res encara
    if (isAuditing || !hasLogs) return null;

    // STEALTH MODE (Tot verd)
    if (results.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '15px', 
                border: '1px solid #0f0', background: 'rgba(0, 255, 0, 0.1)',
                marginTop: '10px'
            }}>
                <div style={{fontSize: '2rem', marginBottom: '5px'}}>🛡️</div>
                <div style={{color: '#0f0', fontWeight: 'bold'}}>STEALTH MODE ACTIVE</div>
                <div style={{color: '#8f8', fontSize: '0.8rem'}}>Device firewall is effective.</div>
            </div>
        );
    }

    // LLISTA DE PORTS
    return (
        <div style={{ marginTop: 15, maxHeight: '200px', overflowY: 'auto', borderTop: '2px solid #002200', paddingTop: 10 }}>
            {results.map((port) => {
                 const isDanger = port.riskLevel === 'DANGER' || !!port.vulnerability;
                 
                 return (
                    <div key={port.port} style={{
                        marginBottom: 8, padding: '8px', fontSize: '0.8rem',
                        borderLeft: isDanger ? '3px solid red' : '3px solid #0f0',
                        background: 'rgba(0, 20, 0, 0.4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: isDanger ? '#ff4444' : '#0f0', fontWeight: 'bold' }}>
                                PORT {port.port} <span style={{ opacity: 0.7 }}>({port.service})</span>
                            </span>
                            <span style={{
                                background: isDanger ? '#440000' : '#002200',
                                color: isDanger ? '#ffaa00' : '#0f0',
                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em'
                            }}>
                                [{isDanger ? 'WARNING' : port.riskLevel}]
                            </span>
                        </div>
                        
                        <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 4 }}>{port.description}</div>

                        {port.vulnerability && (
                            <div style={{ marginTop: '8px', border: '1px dashed #ff4444', padding: '8px', background: 'rgba(255, 0, 0, 0.05)' }}>
                                <div style={{ color: '#ff4444', fontWeight: 'bold' }}>⚠️ DETECTED: {port.vulnerability.id}</div>
                                <div style={{ color: '#ffaaaa', fontSize: '0.75rem' }}>{port.vulnerability.description}</div>
                                <div style={{ color: '#fff', fontStyle: 'italic', background: '#220000', padding: '2px 5px', marginTop: 4 }}>
                                    💡 FIX: {port.vulnerability.recommendation}
                                </div>
                            </div>
                        )}
                    </div>
                 );
            })}
            <div style={{color: '#444', textAlign: 'center', fontSize: '0.8rem', marginTop: 10}}>--- END OF REPORT ---</div>
        </div>
    );
};