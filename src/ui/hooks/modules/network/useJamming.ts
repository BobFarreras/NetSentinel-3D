import { useCallback, useRef, useState } from 'react';
import { DeviceDTO } from '../../../../shared/dtos/NetworkDTOs';
import { invokeCommand } from '../../../../shared/tauri/bridge';
import { uiLogger } from '../../../utils/logger';

const JAM_COMMAND_TIMEOUT_MS = 5000;
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
const jamDebug = (...args: unknown[]) => console.log("[jammer]", ...args);

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, timeoutMsg: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs);
        });
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};

// Define contrato explicito del logger de nodo.
export const useJamming = (devices: DeviceDTO[], addLog: (ip: string, msg: string) => void) => {
    const [jammedDevices, setJammedDevices] = useState<string[]>([]);
    const [jamPendingDevices, setJamPendingDevices] = useState<string[]>([]);
    const jamPendingRef = useRef<Set<string>>(new Set());
    const jammedRef = useRef<string[]>([]);

    const markPending = useCallback((ip: string) => {
        jamPendingRef.current.add(ip);
        setJamPendingDevices((prev) => (prev.includes(ip) ? prev : [...prev, ip]));
    }, []);

    const clearPending = useCallback((ip: string) => {
        jamPendingRef.current.delete(ip);
        setJamPendingDevices((prev) => prev.filter((d) => d !== ip));
    }, []);

    const toggleJammer = useCallback(async (ip: string) => {
        uiLogger.info(`[jammer] toggle solicitado para ip=${ip}`);
        jamDebug("toggle solicitado", { ip });
        if (jamPendingRef.current.has(ip)) {
            addLog(ip, `⌛ JAMMER PENDING: ${ip}`);
            uiLogger.warn(`[jammer] solicitud ignorada por pending ip=${ip}`);
            return;
        }

        // 1. Buscar dispositivo objetivo.
        const target = devices.find((d) => d.ip === ip);
        if (!target) {
            uiLogger.error('No se encontro el objetivo en la lista de dispositivos');
            return;
        }

        // 2. Buscar gateway (router).
        const gateway = devices.find((d) => d.isGateway);
        if (!gateway) {
            addLog(ip, "❌ ERROR: No Gateway found! Cannot start Jammer.");
            uiLogger.error(`[jammer] no se encontro gateway en inventario para ip=${ip}`);
            return;
        }

        if (target.isGateway || target.ip === gateway.ip) {
            addLog(ip, "🚫 JAMMER BLOQUEADO: objetivo es gateway.");
            uiLogger.warn(`[jammer] bloqueo por gateway ip=${ip}`);
            return;
        }

        if (!MAC_REGEX.test(target.mac ?? "")) {
            addLog(ip, `❌ ERROR STARTING JAMMER: MAC invalida (${target.mac || "empty"})`);
            uiLogger.error(`[jammer] MAC invalida para ip=${ip}`, { mac: target.mac, target });
            jamDebug("MAC invalida", { ip, mac: target.mac, target });
            return;
        }

        markPending(ip);
        uiLogger.info(`[jammer] pending=true ip=${ip}`);

        if (jammedRef.current.includes(ip)) {
            try {
                const startedAt = Date.now();
                uiLogger.info(`[jammer] invocando stop_jamming ip=${ip}`);
                jamDebug("invoke stop_jamming", { ip });
                await withTimeout(
                    invokeCommand('stop_jamming', { ip }),
                    JAM_COMMAND_TIMEOUT_MS,
                    `Timeout stop_jamming (${ip})`
                );
                setJammedDevices((prev) => {
                    const next = prev.filter((d) => d !== ip);
                    jammedRef.current = next;
                    return next;
                });
                addLog(ip, `🏳️ JAMMER STOPPED: ${ip}`);
                uiLogger.info(`[jammer] stop_jamming OK ip=${ip} elapsedMs=${Date.now() - startedAt}`);
                jamDebug("stop_jamming OK", { ip, elapsedMs: Date.now() - startedAt });
            } catch (error) {
                addLog(ip, `❌ ERROR STOPPING JAMMER: ${error}`);
                uiLogger.error(`[jammer] stop_jamming ERROR ip=${ip}`, error);
                jamDebug("stop_jamming ERROR", { ip, error });
            } finally {
                clearPending(ip);
                uiLogger.info(`[jammer] pending=false ip=${ip}`);
            }
        } else {
            try {
                const payload = {
                    ip: target.ip,
                    mac: target.mac,
                    gatewayIp: gateway.ip,
                    // Fallback explicito para comandos Rust en snake_case.
                    gateway_ip: gateway.ip,
                };
                const startedAt = Date.now();
                uiLogger.info(`[jammer] invocando start_jamming`, payload);
                jamDebug("invoke start_jamming", payload);
                await withTimeout(
                    invokeCommand('start_jamming', payload),
                    JAM_COMMAND_TIMEOUT_MS,
                    `Timeout start_jamming (${ip})`
                );
                setJammedDevices((prev) => {
                    const next = prev.includes(ip) ? prev : [...prev, ip];
                    jammedRef.current = next;
                    return next;
                });
                addLog(ip, `💀 JAMMER ACTIVE: ${ip} (Spoofing ${gateway.ip})`);
                uiLogger.info(`[jammer] start_jamming OK ip=${ip} elapsedMs=${Date.now() - startedAt}`);
                jamDebug("start_jamming OK", { ip, elapsedMs: Date.now() - startedAt });
            } catch (error) {
                addLog(ip, `❌ ERROR STARTING JAMMER: ${error}`);
                uiLogger.error(`[jammer] start_jamming ERROR ip=${ip}`, error);
                jamDebug("start_jamming ERROR", { ip, error });
            } finally {
                clearPending(ip);
                uiLogger.info(`[jammer] pending=false ip=${ip}`);
            }
        }
    }, [addLog, clearPending, devices, markPending]);

    return {
        jammedDevices,
        jamPendingDevices,
        toggleJammer
    };
};
