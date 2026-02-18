; src-tauri/installer/npcap_hooks_interactive.nsh
; Descripcion: hook NSIS para reducir friccion ofreciendo instalar Npcap (modo interactivo).
;
; Nota:
; - Instalar Npcap es instalar un driver: requiere UAC/admin.
; - Este hook NO asume silent install (la version publica suele requerir aceptar licencia).

!macro NSIS_HOOK_POSTINSTALL
  ; Si ya existe Npcap/WinPcap, no hacemos nada.
  IfFileExists "$WINDIR\\System32\\Npcap\\Packet.dll" ns_done
  IfFileExists "$WINDIR\\System32\\Packet.dll" ns_done

  ; Si no hemos incluido el instalador como recurso, solo informamos.
  IfFileExists "$INSTDIR\\resources\\deps\\npcap-installer.exe" ns_has_installer

  MessageBox MB_OK|MB_ICONINFORMATION \
    "NetSentinel 3D: falta Npcap (Packet.dll / wpcap.dll).$\r$\n$\r$\nLive Traffic y Kill Net no funcionaran hasta instalarlo.$\r$\n$\r$\nInstalalo y vuelve a abrir la app."
  Goto ns_done

ns_has_installer:
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "NetSentinel 3D: falta Npcap.$\r$\n$\r$\nQuieres instalarlo ahora? (pedira permisos de Administrador)$\r$\n$\r$\nNota: la app puede abrir sin Npcap, pero Live Traffic/Kill Net lo necesitan." \
    IDNO ns_done

  ; Elevamos el instalador (UI interactiva del propio instalador).
  ExecShell "runas" "$INSTDIR\\resources\\deps\\npcap-installer.exe" ""

ns_done:
!macroend

