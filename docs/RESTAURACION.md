# Restauración de Nubixor

Un respaldo que nunca se restauró no es un respaldo, es una intención. Este
documento describe el procedimiento real, con los comandos que se ejecutan, y
define cada cuánto hay que probarlo.

---

## 1. Qué contiene una copia

Cada archivo `.msbackup` es un contenedor cifrado con AES-256-GCM que guarda
tres piezas:

| Pieza | Qué es |
|---|---|
| `database.dump` | Volcado de PostgreSQL en formato `custom` (`pg_dump --format=custom`) |
| `storage.tar.gz` | El directorio de archivos privados: imágenes de productos, evidencias, documentos fiscales |
| `manifest.json` | Fecha de creación y SHA-256 de las dos piezas anteriores |

La clave de cifrado es `BACKUP_ENCRYPTION_KEY`. **Sin esa clave la copia no sirve
para nada.** Guárdala fuera del servidor que respalda; si el disco que tiene las
copias es el mismo que tiene la clave, un solo incidente se lleva las dos cosas.

El volcado se toma con `--enable-row-security` y con
`app.bypass_tenant_isolation=on` en la conexión. Sin ese ajuste, las políticas
por empresa se aplicarían al volcado y las tablas protegidas saldrían **vacías**,
sin ningún error visible.

---

## 2. Comprobar el estado

```bash
npm run backup:status
```

Responde, sin entrar a buscar en los registros del servidor: cuándo fue el
último respaldo correcto, cuánto pesó, cuánto tardó, cuándo se verificó por
última vez y cuándo se probó la restauración. Devuelve código de salida 1 si hay
algo que mirar, así que sirve tal cual en un chequeo automático.

Avisa cuando:

- no hay ningún respaldo correcto registrado;
- el último tiene más de dos días;
- el último intento falló;
- hay ejecuciones que empezaron y nunca terminaron (proceso muerto, disco
  lleno);
- nunca se probó una restauración, o la última fue hace más de 90 días.

---

## 3. Verificar una copia sin restaurarla

```bash
npm run backup:verify -- /ruta/megasuite-2026-08-22.msbackup
```

Descifra la copia, comprueba que contenga exactamente las tres piezas esperadas
y valida los SHA-256 contra el manifiesto. **No prueba que los datos sirvan**,
solo que el archivo está íntegro y se puede abrir. Es barato: conviene correrlo
sobre la copia más reciente todos los días.

---

## 4. Prueba de restauración (el simulacro)

Esto es lo que de verdad comprueba que hay respaldo. Restaura en una base
**aparte**, nunca sobre la de producción; el script se niega a continuar si el
almacenamiento de destino se solapa con el activo.

### 4.1 Preparar el destino

```bash
createdb nubixor_simulacro
```

### 4.2 Ejecutar el simulacro

```bash
BACKUP_ENCRYPTION_KEY=$BACKUP_ENCRYPTION_KEY \
BACKUP_RESTORE_DATABASE_URL=postgresql://usuario:clave@localhost:5432/nubixor_simulacro \
BACKUP_RESTORE_STORAGE_DIR=/var/tmp/nubixor-simulacro \
npm run backup:restore -- /ruta/megasuite-2026-08-22.msbackup --confirm=RESTORE_MEGASUITE
```

El script descifra, valida los hashes, ejecuta `pg_restore` sobre la base de
destino, extrae el almacenamiento en el directorio aislado y **cuenta las tablas
que no pueden estar vacías** en un sistema en uso. Que `pg_restore` termine sin
error no significa que haya datos: un volcado vacío se restaura perfectamente.
Por eso, si no aparecen empresas ni usuarios, la prueba falla.

Al terminar, la ejecución queda anotada en la base operativa como
`RESTORE_TEST`, y `npm run backup:status` deja de avisar.

### 4.3 Comprobaciones manuales que conviene añadir

Los conteos automáticos detectan una copia vacía, no una copia vieja o
incompleta. Después de un simulacro, mirar a mano:

```sql
-- ¿Llega hasta donde debería?
SELECT max(created_at) FROM sales;
SELECT max(created_at) FROM audit_events;

-- ¿La cadena de auditoría sigue entera?
SELECT count(*) FROM audit_events ae
WHERE ae.event_hash <> audit_event_hash(
  ae.tenant_id, ae.id, ae.created_at, ae.actor_user_id, ae.action,
  ae.entity_type, ae.entity_id, ae.before_data, ae.after_data,
  ae.reason, ae.metadata, ae.previous_hash
);
-- Debe devolver 0.

-- ¿El inventario cuadra con su kardex?
SELECT count(*) FROM inventory_balances b
LEFT JOIN LATERAL (
  SELECT balance_after FROM inventory_movements m
  WHERE m.tenant_id = b.tenant_id AND m.product_id = b.product_id
    AND m.warehouse_id = b.warehouse_id
  ORDER BY m.created_at DESC, m.id DESC LIMIT 1
) k ON TRUE
WHERE b.on_hand <> COALESCE(k.balance_after, 0);
```

### 4.4 Limpiar

```bash
dropdb nubixor_simulacro
rm -rf /var/tmp/nubixor-simulacro
```

---

## 5. Restauración real (incidente)

El mismo comando de §4.2, apuntando a la base y al almacenamiento de producción,
**con el servicio detenido**. Antes de empezar:

1. **Detén la aplicación.** Restaurar bajo tráfico deja el sistema a medio camino
   entre dos estados.
2. **Respalda lo que hay ahora**, aunque esté dañado. Es la única forma de
   recuperar lo ocurrido entre el último respaldo y el incidente.
3. **Elige la copia por fecha, no por ser la última.** Si el problema fue
   corrupción de datos y no pérdida, la copia más reciente ya la contiene.
4. **Verifícala antes** (§3). Descubrir que la copia no abre en mitad de una
   restauración es el peor momento posible.

Después de restaurar:

- Corre las comprobaciones de §4.3.
- Revisa `npm run backup:status`.
- Comprueba que las políticas por empresa siguen activas: al arrancar, el
  servidor registra `database.tenant_isolation_enforced`. Si en su lugar aparece
  `database.tenant_isolation_not_enforced`, la base quedó con un rol
  superusuario y **el aislamiento entre empresas no está aplicándose**.
- Anota qué se restauró y hasta qué momento llegan los datos. Lo que ocurrió
  después del corte hay que rehacerlo a mano, y alguien tiene que saber qué es.

---

## 6. Periodicidad

| Tarea | Cada cuánto | Comando |
|---|---|---|
| Respaldo | Diario (automático, `BACKUP_ENABLED=true`) | — |
| Estado | Diario | `npm run backup:status` |
| Verificación de integridad | Diario, sobre la copia más reciente | `npm run backup:verify` |
| Simulacro de restauración | **Trimestral** | §4 |
| Prueba de la clave de cifrado | Con cada simulacro | Implícita: sin clave no descifra |

El simulacro trimestral no es burocracia. Las tres formas en que un respaldo
falla —clave perdida, copia corrupta, copia vacía por un problema de
permisos— son invisibles hasta que se intenta restaurar.

---

## 7. Lo que este procedimiento todavía no cubre

Dicho explícitamente, para que nadie asuma de más:

- **Las copias viven en el mismo servidor.** `BACKUP_DIR` es local. Un incidente
  de disco o un borrado del servidor se lleva la aplicación y sus respaldos a la
  vez. Sacarlas a un almacenamiento externo es el siguiente paso pendiente.
- **No hay recuperación a un punto en el tiempo.** Solo se puede volver al
  momento de un respaldo; lo ocurrido después se pierde. Con archivado de WAL se
  podría volver a cualquier instante, y con un respaldo diario la ventana de
  pérdida es de hasta 24 horas.
- **El simulacro no está automatizado.** Hay que ejecutarlo a mano cada
  trimestre; `backup:status` avisa cuando toca, pero no lo hace por su cuenta.
