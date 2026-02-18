<!-- docs/PROJECT_LINKS.md -->
<!-- Descripcion: enlaces del proyecto (repo, releases y presentacion si aplica). -->

# Enlaces del proyecto (Repo / Releases / Presentacion)

Este documento existe para que cualquiera pueda encontrar rapido los enlaces clave del proyecto.

## 1) Repositorio (codigo)

Enlace:
```text
PEGAR_AQUI_URL_DEL_REPO
```

## 2) Releases (builds publicados)
NetSentinel se publica via GitHub Actions con tags `v*`.

Enlace a Releases:
```text
PEGAR_AQUI_URL_DE_RELEASES
```

SOP (paso a paso):
- `docs/02_guides/RELEASE_SOP.md`

## 3) Presentacion (opcional)
Enlace a la presentacion (si existe):
```text
PEGAR_AQUI_URL_DE_SLIDES
```

## 4) Validacion rapida (para demo)
En Windows:
```bash
npm install
npm run tauri dev
```

Checklist demo:
- Abrir la app.
- Ejecutar `SCAN`.
- Seleccionar un nodo y abrir `Device Detail`.
- Ejecutar `DEEP AUDIT` (puertos).
- Abrir `LIVE TRAFFIC` y comprobar que llegan eventos (si el driver lo permite).
