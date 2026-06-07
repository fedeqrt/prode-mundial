# Prode Mundial 2026 — Guía de Setup

## Pasos para tenerlo andando antes del 10 de junio

---

### 1. Crear el Google Sheet

1. Ir a [sheets.google.com](https://sheets.google.com) → crear nuevo spreadsheet
2. Abrir **Extensions → Apps Script**
3. Borrar el código que viene por default
4. Pegar el contenido de `google-apps-script/setup.js`
5. **Editar la lista `PLAYER_NAMES`** con los nombres reales de los jugadores
6. Click en **Run → `setupProde`**
7. Aceptar los permisos
8. Copiar el ID del Sheet de la URL (la parte entre `/d/` y `/edit`)

---

### 2. Configurar Google Cloud (Service Account)

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo (ej: "prode-mundial")
3. Habilitar **Google Sheets API** (APIs & Services → Enable APIs)
4. Ir a **IAM & Admin → Service Accounts → Create Service Account**
5. Nombre: `prode-mundial-reader`, Role: Viewer
6. Click en la service account creada → Keys → Add Key → JSON
7. Descargar el archivo JSON
8. Abrir el JSON, copiarlo todo en **una sola línea** y pegarlo en `.env.local` como `GOOGLE_SERVICE_ACCOUNT_KEY`
9. **Compartir el Google Sheet** con el email de la service account (aparece en el JSON como `client_email`)

---

### 3. API de Football Data

1. Registrarse gratis en [football-data.org](https://www.football-data.org/client/register)
2. Copiar la API Key del dashboard
3. Pegarla en `.env.local` como `FOOTBALL_DATA_API_KEY`

> El plan gratuito tiene 10 requests/min — suficiente para nuestro uso.

---

### 4. Configurar variables en `.env.local`

```
GOOGLE_SHEETS_ID=1abc...xyz
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"prode-mundial",...}
FOOTBALL_DATA_API_KEY=abc123...
COMPETITION_CODE=WC
```

---

### 5. Correr localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

### 6. Deploy en Vercel (gratis)

1. Ir a [vercel.com](https://vercel.com) → Import Git Repository
2. Conectar el repo de GitHub con este código
3. En **Environment Variables**, agregar las 4 variables del `.env.local`
4. Deploy → ¡listo!

Vercel genera una URL pública que podés compartir con todos.

---

### 7. Cómo cargan los jugadores

Cada jugador recibe el link al Google Sheet.
Va a su pestaña con su nombre y completa:

- **Columnas B y C**: goles del local y visitante que predice (números)
- **Columna A**: el ID del partido (se llena con el script, ver abajo)
- **Columnas D, E**: goleadores separados por coma (ej: `Messi, Di María`)
- **Columnas F-I**: tarjetas — escribir el nombre del jugador, o `EQUIPO` si solo apostás al equipo
- **Columnas J-S**: S para Sí, N para No (o dejarlo vacío)
- **Sección TORNEO** (al final de la pestaña): campeón, subcampeón, etc.
- **Sección LESIONES**: jugadores que creés que se van a lesionar

### 8. Llenar los IDs de partidos

Los IDs vienen de football-data.org. Para obtenerlos todos de una vez, corrér esto en la terminal:

```bash
curl -H "X-Auth-Token: TU_API_KEY" https://api.football-data.org/v4/competitions/WC/matches | python3 -m json.tool | grep '"id"'
```

O simplemente abrir [http://localhost:3000/partidos](http://localhost:3000/partidos) — la web app los muestra.

---

### 9. Bloquear el Sheet el 10 de junio

1. Abrir el Apps Script del Sheet
2. Ejecutar la función `lockPlayerTabs`
3. Las pestañas quedan protegidas — solo vos podés editarlas

---

### Cómo cargar resultados (post-partido)

Los resultados (marcador) se toman **automáticamente** de football-data.org.

Los **eventos** (goleadores, tarjetas, penales, etc.) hay que cargarlos manualmente en la pestaña **RESULTADOS**:
- 1 fila por partido
- Columna A: ID del partido
- El resto: goleadores, tarjetas, etc. separados por coma

> Esto es porque football-data.org no da eventos en el plan gratuito.
> Si querés automatizar esto también, podés suscribirte al plan de pago (~12 USD/mes) o usar otra API.

---

## Tabla de puntaje

| Apuesta | Puntos |
|---|---|
| Resultado correcto (ganador/empate) | +1 |
| Marcador exacto | +2 (total +3) |
| Goleador | +1 c/u |
| Todos los goleadores de un equipo | +3 bonus |
| Tarjeta (equipo) | +1 |
| Tarjeta (equipo + jugador) | +2 |
| Penal (equipo) | +1 |
| Penal atajado (equipo) | +1 |
| Alargue | +1 |
| Penales en tanda | +1 |
| Gol en alargue (jugador) | +2 (1 gol + 1 ET bonus) |
| Invasión de cancha | +2 |
| Amenaza de bomba | +2 |
| Lesionado (fuera de partidos) | +1 c/u |
| 3er puesto | +10 |
| Subcampeón | +12 |
| Campeón | +15 |
| Mejor jugador | +10 |
| Mejor jugador joven | +5 |
| Goleador del torneo | +10 |
