; src-tauri/installer/npcap_hooks_oem_silent.nsh
; Descripcion: hook NSIS para instalar Npcap en modo silent (solo si usas el instalador OEM/silent).
;
; IMPORTANTE:
; - Este modo asume que el instalador soporta /S y que tienes derechos de redistribucion.
; - Sigue requiriendo UAC/admin porque instala un driver.

!macro NSIS_HOOK_POSTINSTALL
  IfFileExists "$WINDIR\\System32\\Npcap\\Packet.dll" ns_done
  IfFileExists "$WINDIR\\System32\\Packet.dll" ns_done

  IfFileExists "$INSTDIR\\resources\\deps\\npcap-installer.exe" ns_has_installer
  Goto ns_done

ns_has_installer:
  ; Elevamos y pedimos install silent.
  ; Si quieres forzar WinPcap compatibility mode y tu instalador lo soporta,
  ; anade sus flags aqui.
  ExecShell "runas" "$INSTDIR\\resources\\deps\\npcap-installer.exe" "/S"

ns_done:
!macroend

