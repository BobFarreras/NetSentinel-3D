# 💀 GUIA MESTRA: BOOTCAMP DE CIBERSEGURETAT (0xRed Edition)

Aquesta guia condensa els coneixements tècnics del bootcamp, des dels fonaments fins a l'ús d'eines ofensives i defensives.

---

## 📂 MÒDUL 1: CONCEPTES FONAMENTALS

### 1.1 Diferències de Seguretat
* **Seguretat de la Informació:** El concepte més ampli. Protegeix les dades en qualsevol format (paper, disc dur, jeroglífic).
* **Seguretat Informàtica:** Protecció de la informació dins de l'àmbit informàtic (Hardware i Software).
* **Ciberseguretat:** Protecció exclusiva d'actius digitals (Software i dades lògiques).

### 1.2 La Triada CIA (Els Pilars)
1.  **Confidencialitat:** La informació només és accessible per a persones autoritzades.
2.  **Integritat:** La informació no ha de ser modificada ni alterada sense permís.
3.  **Disponibilitat (Availability):** La informació ha d'estar disponible quan es requereixi.
    * *Extra:* **No Repudi** (demostrar l'autoria d'una acció) i **Autenticació** (verificar la identitat).

### 1.3 Terminologia Ofensiva
* **Vulnerabilitat:** Fallada de disseny, configuració o codi (el forat de seguretat).
* **Exploit:** Codi dissenyat per aprofitar una vulnerabilitat (la clau per obrir el forat).
* **Payload:** L'acció que s'executa després de l'explotació (el que fas un cop dins).
* **Zero Day (0-Day):** Vulnerabilitat desconeguda pel fabricant i sense pedaç (patch) disponible.

### 1.4 Hacker vs. Ciberdelinqüent
* **Hacker:** Professional que utilitza els seus coneixements per millorar la seguretat (Ètic per definició).
* **Ciberdelinqüent:** Persona que utilitza els coneixements per causar dany o benefici propi il·legalment.
* *Nota:* No existeixen "colors" de barrets (Black/White/Grey) en la definició purista; o ets ètic o ets un criminal.

---

## 📂 MÒDUL 2: MALWARE I AMENACES

### 2.1 Tipus de Malware
* **Virus:** Necessita un hoste (fitxer) i acció humana per executar-se.
* **Cuc (Worm):** Es replica sol per la xarxa sense interacció humana.
* **Troia (Trojan):** Es fa passar per programari legítim per enganyar l'usuari.
* **Ransomware:** Xifra les dades i demana un rescat (el rei actual).
* **Spyware:** Recopila informació de l'usuari sense permís.
* **Adware:** Mostra publicitat intrusiva (sovint porta altres malwares).
* **Rogue:** Falsos antivirus que enganyen l'usuari dient que està infectat.

### 2.2 Enginyeria Social
L'art de manipular les persones perquè revelin informació.
* **Phishing:** Suplantació d'identitat via correu massiu.
* **Spear Phishing:** Phishing dirigit a una persona específica.
* **Whaling:** Phishing dirigit a alts directius (CEOs, CFOs).
* **Vishing:** Phishing per veu (trucades).
* **Smishing:** Phishing per SMS.
* **Qrishing:** Phishing a través de codis QR maliciosos.

---

## 📂 MÒDUL 3: XARXES (NETWORKING)

### 3.1 Conceptes Bàsics
* **IP (Internet Protocol):** Identifica un dispositiu a la xarxa.
    * **IPv4:** 32 bits (ex: `192.168.1.1`). S'estan esgotant.
    * **IPv6:** 128 bits (hexadecimal). El futur.
    * **IP Pública:** La que et dona el proveïdor (ISP) per sortir a Internet.
    * **IP Privada:** La de la teva xarxa local (LAN). No surt a Internet directament.
    * **CGNAT:** Tècnica dels ISP per compartir una mateixa IP pública entre molts clients.
* **MAC Address:** Identificador físic i únic de la targeta de xarxa (48 bits).

### 3.2 Protocols
* **TCP:** Connexió fiable. Fa el *Three-Way Handshake* (SYN -> SYN-ACK -> ACK). Garanteix l'entrega.
* **UDP:** Connexió ràpida però no fiable (streaming, jocs). No garanteix l'entrega.
* **ICMP:** Protocol de diagnòstic (usat pel `ping`).
* **ARP:** Tradueix IP a MAC en la xarxa local. Vulnerable a *ARP Spoofing*.
* **DHCP:** Assigna IPs automàticament (Procés DORA: Discover, Offer, Request, Acknowledge).
* **DNS:** Tradueix noms de domini (`google.com`) a IPs.

### 📂 CARPETA: PORTS (PORTS I SERVEIS)
Els ports són finestres de comunicació per a serveis específics. Hi ha 65.536 ports.

| Port | Protocol | Servei / Descripció |
| :--- | :--- | :--- |
| **20/21** | FTP | Transferència de fitxers (text clar). |
| **22** | SSH | Connexió remota segura (xifrada). |
| **23** | Telnet | Connexió remota insegura (text clar). |
| **25** | SMTP | Enviament de correu electrònic. |
| **53** | DNS | Resolució de noms de domini. |
| **80** | HTTP | Web no segura. |
| **443** | HTTPS | Web segura (xifrada amb TLS). |
| **110** | POP3 | Recepció de correu (descarrega). |
| **143** | IMAP | Recepció de correu (sincronitza). |
| **445** | SMB | Compartició de fitxers en Windows (Objectiu de EternalBlue). |
| **3389** | RDP | Escriptori Remot de Windows. |
| **3306** | MySQL | Base de dades. |

---

## 📂 MÒDUL 4: ANONIMAT I EINES

### 4.1 Navegació Segura
* **Navegador recomanat:** Mullvad Browser (basat en Firefox, enfocat a privadesa) o Librewolf.
* **Tor Browser:** Accés a la xarxa Onion. Encamina el tràfic per 3 nodes (Guardià, Intermedi, Sortida). Lent però anònim.
* **User Agent:** La "matrícula" del teu navegador. Canviar-lo ajuda a reduir la petjada digital.

### 4.2 Eines de Xarxa
* **VPN:** Xifra el tràfic entre tu i el servidor VPN. Canvia la teva IP pública. No garanteix anonimat total (depèn dels logs del proveïdor).
* **Proxy:** Intermediari. Canvia la IP però no sol xifrar el tràfic.
* **ProxyChains:** Eina de Linux per encadenar múltiples proxys.

### 4.3 Sistema Operatiu: TAILS
* Sistema "amnèsic" basat en Debian.
* Tot el tràfic passa per Tor obligatòriament.
* S'executa en memòria RAM: en apagar-lo, s'esborra tot rastre.

---

## 📂 MÒDUL 5: LABORATORI (VIRTUALITZACIÓ)

### 5.1 VirtualBox
* **Hipervisor de Tipus 2:** Corre sobre un sistema operatiu (Windows/Linux).
* **Snapshots (Instantànies):** Punts de restauració de la màquina virtual (vital abans d'executar malware).
* **Tipus de Xarxa:**
    * *NAT:* Accés a internet, però aïllada de la xarxa local.
    * *Adaptador Pont (Bridged):* La màquina és un dispositiu més de la teva xarxa física.
    * *Xarxa Interna:* Només es veuen les màquines virtuals entre elles (sense internet).

### 5.2 Sistemes Operatius del Lab
* **Kali Linux:** Distro ofensiva per excel·lència (basada en Debian).
* **Windows 10/11:** Com a víctima o per anàlisi.

---

## 📂 MÒDUL 6: COMANDES ESSENCIALS (LINUX & WINDOWS)

### 🐧 Linux (Bash)
* `cd [ruta]`: Canviar de directori. (`cd ..` per anar enrere).
* `ls`: Llistar contingut. (`ls -la` per veure ocults i detalls).
* `pwd`: Mostra la ruta actual.
* `cat [fitxer]`: Llegir contingut d'un fitxer.
* `touch [fitxer]`: Crear fitxer buit.
* `mkdir [nom]`: Crear directori.
* `rm [fitxer]`: Esborrar. (`rm -rf` per directoris, perillós).
* `cp [origen] [destí]`: Copiar.
* `mv [origen] [destí]`: Moure o renombrar.
* `chmod`: Canviar permisos (Ex: `chmod +x` per fer executable).
* `chown`: Canviar propietari.
* `grep`: Cercar text dins de fitxers o outputs.
* `sudo`: Executar com a administrador (Root).
* `apt update && apt upgrade`: Actualitzar repositoris i paquets.

### 🪟 Windows (PowerShell / CMD)
* `ipconfig`: Veure configuració de xarxa (IP, Gateway).
* `ping [destí]`: Comprovar connectivitat (protocol ICMP).
* `tracert [destí]`: Veure la ruta (salts) fins a un servidor.
* `netstat -ano`: Veure connexions actives i ports oberts.
* `whoami`: Veure l'usuari actual.
* `systeminfo`: Informació detallada del sistema.
* `cd`, `dir`, `mkdir`: Equivalents bàsics de navegació.

---

## 📂 MÒDUL 7: EINES D'ANÀLISI

* **VirusTotal:** Escaneig de fitxers i URLs amb múltiples motors antivirus.
* **HaveIBeenPwned:** Comprovar si el teu correu ha estat filtrat en bretxes de dades.
* **Wireshark:** Analitzador de paquets de xarxa (Sniffer). Permet veure tot el tràfic (capes OSI).
* **Process Explorer:** Eina avançada de Windows per veure processos (millor que el Task Manager).