import { useState } from 'react';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';
import { invokeCommand } from '../../../shared/tauri/bridge';
import { uiLogger } from '../../utils/logger';

// Define contrato explicito del logger de nodo.
export const useJamming = (devices: DeviceDTO[], addLog: (ip: string, msg: string) => void) => {
    
    const [jammedDevices, setJammedDevices] = useState<string[]>([]);

    const toggleJammer = async (ip: string) => {
        // 1. Buscar dispositivo objetivo.
        const target = devices.find(d => d.ip === ip);
        if (!target) {
            uiLogger.error('No se encontro el objetivo en la lista de dispositivos');
            return;
        }

        // 2. Buscar gateway (router).
        const gateway = devices.find(d => d.isGateway);
        if (!gateway) {
            addLog(ip, "❌ ERROR: No Gateway found! Cannot start Jammer.");
            return;
        }

        if (jammedDevices.includes(ip)) {
            // Detener jammer.
            try {
                await invokeCommand('stop_jamming', { ip });
                setJammedDevices(prev => prev.filter(d => d !== ip));
                addLog(ip, `🏳️ JAMMER STOPPED: ${ip}`);
            } catch (error) {
                addLog(ip, `❌ ERROR STOPPING JAMMER: ${error}`);
            }
        } else {
            // Iniciar jammer.
            try {
                await invokeCommand('start_jamming', { 
                    ip: target.ip, 
                    mac: target.mac, 
                    gatewayIp: gateway.ip 
                });
                setJammedDevices(prev => [...prev, ip]);
                addLog(ip, `💀 JAMMER ACTIVE: ${ip} (Spoofing ${gateway.ip})`);
            } catch (error) {
                addLog(ip, `❌ ERROR STARTING JAMMER: ${error}`);
            }
        }
    };

    return {
        jammedDevices,
        toggleJammer
    };
};
