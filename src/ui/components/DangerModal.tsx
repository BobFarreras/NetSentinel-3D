import React from 'react';
import { RouterAuditResult } from '../../shared/dtos/NetworkDTOs';

interface Props {
  result: RouterAuditResult | null;
  onClose: () => void;
}

export const DangerModal: React.FC<Props> = ({ result, onClose }) => {
  if (!result || !result.vulnerable) return null;

  const [user, pass] = result.credentials_found 
    ? result.credentials_found.split(':') 
    : ['UNKNOWN', 'UNKNOWN'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(20, 0, 0, 0.9)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      
      <div style={{
        background: '#000', border: '2px solid #ff0000', width: '500px',
        boxShadow: '0 0 50px rgba(255, 0, 0, 0.4)',
        padding: '30px', fontFamily: 'Consolas, monospace', position: 'relative',
        animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both'
      }}>
        
        <div style={{ 
          background: '#ff0000', color: '#000', padding: '10px', 
          textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '3px',
          marginBottom: '20px'
        }}>
          ⚠ CRITICAL VULNERABILITY
        </div>

        <p style={{ color: '#ff5555', fontSize: '1.1rem', textAlign: 'center' }}>
          ROUTER GATEWAY COMPROMISED.<br/>
          ADMIN ACCESS GRANTED.
        </p>

        <div style={{ 
          border: '1px dashed #ff0000', padding: '20px', margin: '20px 0',
          background: 'rgba(255, 0, 0, 0.1)', textAlign: 'center'
        }}>
          <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>CREDENTIALS EXPOSED:</div>
          <div style={{ fontSize: '1.8rem', color: '#fff', textShadow: '0 0 10px #ff0000' }}>
            {user} <span style={{color:'#666'}}>:</span> {pass}
          </div>
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: '15px', background: 'transparent', 
          border: '1px solid #ff0000', color: '#ff0000', fontWeight: 'bold',
          cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#ff0000'; e.currentTarget.style.color = '#000'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff0000'; }}
        >
          ACKNOWLEDGE THREAT
        </button>

      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};