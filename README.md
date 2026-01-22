# Minuto Kine

Trivia educativa de kinesiología en formato web estático.

## Requisitos

- Navegador moderno.
- Opcional: un servidor local para evitar restricciones de CORS al cargar `questions.json`.

## Correr local

```bash
python3 -m http.server 5173
```

Luego abrí `http://localhost:5173` en el navegador.

## Deploy en Netlify

1. Crear un nuevo sitio desde Git.
2. Seleccionar este repositorio.
3. Configurar:
   - **Build command:** (vacío)
   - **Publish directory:** `.`
4. Deploy.

> Si usás drag & drop, subí todos los archivos del proyecto (`index.html`, `styles.css`, `app.js`, `questions.json`, etc.).
