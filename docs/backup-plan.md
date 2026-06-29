# Plan de Backup para Supabase (Plan Gratuito)

**Proyecto:** `lqjvxhionrodlhtkvywy.supabase.co`
**Problema:** El plan gratuito de Supabase NO incluye backups automáticos ni point-in-time recovery.
**Solución:** Backup con Supabase CLI + automatización con GitHub Actions.

---

## Opciones de Backup

| Opción | Requisitos | Automatizable |
|---|---|---|
| **A — Supabase CLI** (recomendada) | `npm install -g supabase` + login | ✅ GitHub Actions |
| **B — Script Node.js** (fallback) | Cliente Supabase (ya incluido en el proyecto) | ✅ GitHub Actions |
| **C — pg_dump** | Instalar PostgreSQL Tools | ✅ GitHub Actions |

**Recomendación:** Usar **Opción A (Supabase CLI)** como método principal y **Opción B (Script Node.js)** como respaldo ligero sin dependencias externas.

---

## Opción A: Supabase CLI

### Instalación

```bash
npm install -g supabase
supabase --version
```

### Configuración (una vez)

```bash
supabase login
supabase link --project-ref lqjvxhionrodlhtkvywy
```

Te pedirá la DB password (Dashboard > Project Settings > Database > Password).

### Backup manual

```bash
mkdir -p backups

# Backup completo (schema + datos)
supabase db dump > backups/full_$(date +%Y-%m-%d).sql

# Solo datos
supabase db dump --data-only > backups/data_$(date +%Y-%m-%d).sql

# Solo schema
supabase db dump --schema-only > backups/schema_$(date +%Y-%m-%d).sql
```

### Restaurar

```bash
supabase db restore backups/full_2026-06-28.sql
```

---

## Opción B: Script Node.js (Backup a JSON)

Sin instalar nada extra — usa el cliente Supabase que ya tiene el proyecto.

### Crear `scripts/backup.mjs`

```javascript
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const TABLES = [
  'perfiles', 'categorias', 'productos', 'mesas',
  'pedidos', 'pedido_detalles', 'pagos',
  'movimientos_caja', 'configuraciones'
];

const date = new Date().toISOString().split('T')[0];
const BACKUP_DIR = join(__dirname, '..', 'backups', date);

async function backup() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const summary = {};

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*').order('id');
    if (error) {
      console.error(`Error en ${table}:`, error.message);
      continue;
    }
    writeFileSync(join(BACKUP_DIR, `${table}.json`), JSON.stringify(data, null, 2));
    summary[table] = data.length;
    console.log(`✓ ${table}: ${data.length} registros`);
  }

  writeFileSync(join(BACKUP_DIR, '_summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nBackup completado: ${BACKUP_DIR}`);
}

backup();
```

### Crear `scripts/restore.mjs`

```javascript
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const BACKUP_DIR = join(__dirname, '..', 'backups', process.argv[2]);

async function restore() {
  const files = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json') && f !== '_summary.json');

  for (const file of files) {
    const table = file.replace('.json', '');
    const data = JSON.parse(readFileSync(join(BACKUP_DIR, file), 'utf-8'));
    if (data.length === 0) continue;

    const { error } = await supabase.from(table).upsert(data);
    if (error) console.error(`Error en ${table}:`, error.message);
    else console.log(`✓ ${table}: ${data.length} registros restaurados`);
  }
}

restore();
```

### Ejecutar

```bash
# Backup
node scripts/backup.mjs

# Restaurar (usando el backup más reciente)
node scripts/restore.mjs backups/2026-06-28
```

---

## Opción C: GitHub Actions (Backup Automático Semanal)

Crear `.github/workflows/backup.yml`:

```yaml
name: Backup BD

on:
  schedule:
    - cron: '0 6 * * 0'   # Domingo 6:00 AM
  workflow_dispatch:        # También manual

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Instalar Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Vincular proyecto
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: supabase link --project-ref lqjvxhionrodlhtkvywy

      - name: Generar backup SQL
        run: |
          mkdir -p backups
          supabase db dump > backups/full_$(date +'%Y-%m-%d').sql

      - name: Backup de Storage (imágenes)
        run: |
          mkdir -p backups/storage_$(date +'%Y-%m-%d')
          supabase storage download productos --output backups/storage_$(date +'%Y-%m-%d')/ || echo "Sin storage"

      - name: Subir artifact
        uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_id }}
          path: backups/

      - name: Commit al repositorio
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add backups/
          git commit -m "backup: $(date +'%Y-%m-%d')" || echo "Sin cambios"
          git push
```

### Secrets necesarios en GitHub:

| Secret | Dónde obtenerlo |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Settings → API → Access Token (generar uno nuevo) |
| `SUPABASE_DB_PASSWORD` | Project Settings → Database → Password |

---

## Archivos a Crear

| Archivo | Propósito |
|---|---|
| `scripts/backup.mjs` | Backup a JSON con cliente Supabase |
| `scripts/restore.mjs` | Restaurar desde JSON |
| `.github/workflows/backup.yml` | Backup automático semanal |

### Agregar a `.gitignore`

```gitignore
backups/*.sql
backups/*.json
!backups/.gitkeep
```

---

## Buenas Prácticas

1. **Frecuencia:** Backup semanal (domingo) + manual antes de cambios grandes
2. **Retención:** Mantener últimos 3 meses en el repo
3. **Prueba de restauración:** Cada mes, probar el backup en un proyecto temporal de Supabase
4. **Migraciones versionadas:** Los archivos `importacion_final.sql`, `fase2_*.sql`, etc. ya están en el repo — eso cubre el schema. El backup cubre los DATOS.
5. **Storage:** Las imágenes en Supabase Storage se respaldan por separado (incluido en el workflow)

---

## Costo / Esfuerzo

| Método | Setup | Mantenimiento |
|---|---|---|
| Supabase CLI | 15 min | Bajo |
| Script Node.js | 20 min | Bajo |
| GitHub Actions | 20 min | Casi nulo |

**Recomendación final:** Configurar **Supabase CLI + GitHub Actions** para backups automáticos, y usar el **Script Node.js** como plan de contingencia (0 dependencias externas).
