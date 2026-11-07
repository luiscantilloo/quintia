# QUINTIA · Datos de prueba (prototipo consciente-data.js)

Fuente: `Consciente-entrega/consciente-data.js`, portada a:

- `nucleo-api/programs/quintia/prototype-data.mjs`
- `consiente-web/src/lib/quintia/prototype-data.mjs`

## Qué incluye

- **4 juegos:** Frutas, Simón dice, Duelo de cartas, Sudoku (+ medidas, gameCfg)
- **Analizador:** estados (base / estable / mejorando / cambio), series, bandas, lecturas, aviso abierto de Ernesto (Simón dice) — **sin crisis**
- **Historias:** Hernán Quintero, Rosa Elena Pardo, Ernesto Villamil, Elvia Rendón + 9 clínicas extra + Luis/Marta
- **Territorios:** Valle Alto (~50), Río Claro (~10), Sierra Norte (~10) → 70 personas
- **Matriz de rutas** por territorio × P01–P15 (juegos + analizador)
- Snapshot en Mongo: `program_settings.app_state.quintiaDemo`

## Comandos

```bash
cd /Users/daniiel/Movies/nucleo-api
export SEED_QUINTIA_DEMO_PASSWORD='…'   # ≥12 caracteres
npm run db:init:quintia
npm run db:seed:quintia
# limpio:
node scripts/seed-quintia-demo.mjs --purge && npm run db:seed:quintia
```

## Cuentas `{rol}+prueba@quintia.com`

| Rol | Correo | Persona del prototipo |
| --- | --- | --- |
| Admin | `admin+prueba@quintia.com` | Marcela Ríos |
| Experto | `experto+prueba@quintia.com` | Andrés Molina |
| Clínico | `clinico+prueba@quintia.com` | Dra. Lucía Paredes |
| Cuidador | `cuidador+prueba@quintia.com` | Gloria Pardo → Rosa |
| Observador | `observador+prueba@quintia.com` | Tomás Vega |
| Paciente | `paciente+prueba@quintia.com` | Hernán Quintero |
| Paciente 2 | `paciente2+prueba@quintia.com` | Ernesto Villamil |
| Paciente 3 | `paciente3+prueba@quintia.com` | Rosa Elena Pardo |
| Paciente 4 | `paciente4+prueba@quintia.com` | Elvia Rendón |

Contraseña: `SEED_QUINTIA_DEMO_PASSWORD` o `SEED_ADMIN_PASSWORD` (no va en el repo).
