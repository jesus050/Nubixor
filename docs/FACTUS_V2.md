# Integración Factus API V2

Nubixor usa la documentación oficial de Factus V2 como contrato principal:
<https://developers.factus.com.co/>. La colección local
`api-factus-v2.json` sirve únicamente para pruebas y comparación.

## Alcance implementado

- Cuenta, credenciales cifradas, ambiente y estado de conexión separados por
  empresa.
- URLs canónicas: sandbox y producción se seleccionan en el servidor; no se
  aceptan URLs Factus arbitrarias enviadas por el navegador.
- OAuth con `password`, renovación con `refresh_token` y caducidad tomada de
  `expires_in`.
- Límite preventivo de 80 solicitudes por minuto y conservación de
  `Retry-After` cuando Factus responde 429.
- Consulta de rangos activos y rangos DIAN asociados al software.
- Cola idempotente. El `reference_code` permanece estable para el mismo
  documento aunque exista más de un intento de transmisión.
- Creación y validación mediante `POST /v2/bills/validate`.
- Registro de número asignado por Factus, CUFE, QR, respuesta, error HTTP y
  auditoría.
- Adaptadores para notas crédito y débito V2.

## Datos que nunca se presumen

Nubixor no incluye códigos tributarios de ejemplo ni valores predeterminados
para rangos, documentos, operaciones, formas o medios de pago, impuestos,
unidades, estándares, municipios o países.

Los rangos se consultan desde la cuenta Factus de la empresa. Los demás valores
se registran en `electronic_billing_reference_mappings`, indicando la página
oficial utilizada y el usuario que realizó la validación.

## Preparación de una empresa

1. Configurar `ELECTRONIC_BILLING_ENCRYPTION_KEY` con un secreto fuerte y
   exclusivo del ambiente.
2. En **Sistema → Conector de facturación electrónica**, seleccionar Factus,
   TEST o PRODUCTION y guardar `client_id`, `client_secret`, `username` y
   `password`.
3. Probar la conexión.
4. Consultar y seleccionar un rango real asociado a la cuenta.
5. Validar equivalencias de catálogos para la empresa y el ambiente.
6. Configurar los datos electrónicos de clientes y productos.
7. Ejecutar ventas controladas en TEST antes de habilitar PRODUCTION.

## Reglas operativas

- Una factura a crédito debe incluir fecha de vencimiento.
- El precio enviado por ítem es neto, sin impuesto.
- Un impuesto excluido se envía con `is_excluded: true`.
- Los pagos mixtos se envían como varios elementos en `payment_details`.
- 429, 500 y 503 quedan como reintentables. Los errores de autenticación,
  autorización, recurso, conflicto o validación exigen revisión.
- Un 409 por factura pendiente no se elimina ni recrea automáticamente: debe
  revisarse según el flujo oficial de Factus para evitar duplicados.

## Antes de producción

Se requieren credenciales reales, rangos vigentes, resolución y prefijo
validados, catálogos completos, perfil tributario revisado por el contador y
pruebas de aceptación en habilitación. La existencia del conector no equivale
por sí sola a habilitación DIAN.
