import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

// 👇 CORRECCIÓ 1: Definim que addLog necessita (ip, msg)
export const useJamming = (devices: DeviceDTO[], addLog: (ip: string, msg: string) => void) => {
    
    const [jammedDevices, setJammedDevices] = useState<string[]>([]);

    const toggleJammer = async (ip: string) => {
        // 1. Busquem el dispositiu objectiu
        const target = devices.find(d => d.ip === ip);
        if (!target) {
            console.error("Target not found in device list.");
            return;
        }

        // 2. Busquem el Gateway (Router)
        const gateway = devices.find(d => d.isGateway);
        if (!gateway) {
            // 👇 CORRECCIÓ 2: Passem la IP al log d'error també
            addLog(ip, "❌ ERROR: No Gateway found! Cannot start Jammer.");
            return;
        }

        if (jammedDevices.includes(ip)) {
            // ATURAR JAMMER
            try {
                await invoke('stop_jamming', { ip });
                setJammedDevices(prev => prev.filter(d => d !== ip));
                // 👇 CORRECCIÓ 3: Passem la IP
                addLog(ip, `🏳️ JAMMER STOPPED: ${ip}`);
            } catch (error) {
                addLog(ip, `❌ ERROR STOPPING JAMMER: ${error}`);
            }
        } else {
            // INICIAR JAMMER
            try {
                await invoke('start_jamming', { 
                    ip: target.ip, 
                    mac: target.mac, 
                    gatewayIp: gateway.ip 
                });
                setJammedDevices(prev => [...prev, ip]);
                // 👇 CORRECCIÓ 4: Passem la IP
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