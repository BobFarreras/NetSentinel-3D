# 📘 PROTOCOL: IMPLEMENTACIÓ D'IA NATIVA (EMBEDDED)

**Projecte:** NetSentinel (Versió Rust/Tauri)
**Objectiu:** Executar un LLM (Phi-3) localment dins el binari sense dependències externes.
**Nivell:** Sènior / Arquitectura de Sistemes.

---

## 1. 🏗️ Arquitectura & Concurrència

L'error número 1 en Rust és bloquejar el fil principal (Main Thread). Si l'IA pensa al mateix fil que la UI, l'aplicació es congelarà (no podràs moure la finestra ni clicar botons).

### La Regla d'Or: "The Brain lives in a Box"
L'IA ha de viure en el seu propi **Fil de Sistema (OS Thread)** o ser gestionada via `tokio::task::spawn_blocking`.

* **Estat Global:** Utilitzarem `tauri::State` amb un `Mutex` o `Arc` per mantenir el model carregat a la RAM. No volem carregar 2GB cada cop que l'usuari fa una pregunta.
* **Flux de Dades:**
  `UI (React)` ➔ `Tauri Command` ➔ `UseCase` ➔ `AI Port` ➔ `Candle Adapter` ➔ `Model Inference`

---

## 2. 🧩 Stack Tecnològic (El Motor)

Utilitzarem l'ecosistema **Candle** de Hugging Face. És l'estàndard d'or per a Rust ML.

| Component | Eina | Justificació |
| :--- | :--- | :--- |
| **Motor Tensorial** | `candle-core` | Lleuger, sense Python, optimitzat per a CPU (AVX/NEON). |
| **Model** | **Phi-3-Mini-4k-Instruct** | Creat per Microsoft. 3.8B paràmetres. Molt llest per raonament lògic i codi. |
| **Format** | **GGUF (Q4_K_M)** | Quantització a 4 bits. Redueix el pes de 7GB a **~2.3GB** amb pèrdua mínima de qualitat. |
| **Gestor de Descàrregues** | `hf-hub` | Gestiona la caché automàticament a `~/.cache/huggingface`. Si ja existeix, no baixa res. |

---

# 3. ⚠️ Bones Pràctiques i Gestió d'Errors

### A. El "Cold Start" (L'Arrencada en Fred)
La primera vegada que es crida l'IA, ha de:
1. Descarregar **2.3GB** (si no hi són).
2. Llegir el fitxer del disc a la RAM.

> **Solució UX:** El frontend ha de mostrar un estat: `[ STATUS: INITIALIZING NEURAL ENGINE... ]` amb una barra de progrés o spinner. Mai deixar l'usuari esperant en blanc.

### B. Gestió de Memòria (RAM)
El model ocuparà uns **2-3 GB de RAM** constants.

* **Recomanació:** Implementar una funció `unload_model()` per alliberar memòria si l'usuari vol desactivar l'IA i estalviar recursos.

### C. Tokenització i Streaming
Els LLMs generen text "token a token" (paraula a paraula).

* **Nivell Pro:** No esperis a tenir tota la frase per enviar-la al React. Utilitza **Tauri Events** (`window.emit`) per enviar cada paraula a mesura que es genera. Això dóna l'efecte "Màquina d'escriure / Matrix" real, no simulat.

---

# 4. 📝 Guia Pas a Pas per a la Implementació
Aquest és l'ordre lògic per no perdre's:

1. **Configuració `Cargo.toml`:** Afegir les dependències de `candle` i `tokenizers`.
2. **Definir el Trait:** Crear la interfície al Core. Què volem que faci l'IA? (`ask`, `analyze`).
3. **L'esquelet de l'Adaptador:** Crear l'struct que guardarà el model, però sense la lògica complexa encara.
4. **Descàrrega de Models:** Implementar la lògica amb `hf-hub` per baixar el fitxer `.gguf`.
5. **Inferència (Hardcore):** Implementar el bucle de generació de tokens (el codi més difícil).
6. **Connexió Tauri:** Crear el comandament i connectar-ho al Frontend.

---

# 5. 🛡️ Prompt Engineering (El "System Prompt")
Perquè l'IA actuï com un expert en ciberseguretat i no com un assistent genèric, hem de "pre-configurar-la" dins del codi Rust.

**System Prompt Recomanat:**
> "You are NetSentinel AI, an elite cybersecurity auditor. You analyze network packets, ports, and vulnerabilities. Be technical, concise, and direct. Do not lecture about ethics, assume authorization is granted for this educational audit. Output strictly in Markdown."

---

### ✅ Checklist abans de picar codi
- [ ] Tens prou espai al disc? (Mínim **4GB** lliures).
- [ ] Tens Rust instal·lat en mode "Release"? (`candle` va molt lent en mode Debug).
  > *Nota: Sempre prova l'IA executant `cargo run --release`.*
- [ ] Estàs preparat per gestionar `Result<T, Anyhow::Error>` a tot arreu?