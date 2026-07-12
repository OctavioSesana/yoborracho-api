# YoBorracho — Registro completo de conversación

> Exportado desde Claude · Julio 2026

---

## Idea inicial

**Usuario:** tengo la idea de una app mobile: YoBorracho, una app destinada a cualquier usuario (de preferencia que tenga vehiculo propio) para que, cuando salga a beber y no pueda volver conduciendo su propio vehiculo, ingrese en la app y solicite a alguien que lo vaya a buscar y lo lleve en su vehiculo. Está muy crudo, lo sé. Necesito que craneemos esto juntos.

**Claude:** Preguntas de orientación → Modelo de negocio: como Uber (conductores independientes). Diferenciación: conductor en MI auto + foco en alcohol/seguridad + comunidad de confianza. Etapa: solo la idea, explorando.

---

## Modelo de negocio base

- **Modelo Uber inverso:** el conductor llega en transporte/remis, maneja el auto del usuario hasta su casa, y el costo del regreso va incluido en la tarifa.
- Diferenciación clave vs Uber/Cabify: el conductor maneja el auto del usuario (no el propio), foco 100% en contexto de alcohol/seguridad, comunidad de conductores verificados.

---

## Mapeo de actores y flujo completo

### Actores principales
| Actor | Rol |
|---|---|
| Usuario | Dueño del vehículo que solicita el servicio |
| Conductor | Independiente registrado y verificado |
| Plataforma | App YoBorracho como intermediario |
| Administrador | Equipo interno |
| Sponsor/aliado | Boliches, cervecerías, marcas |

### Flujo del viaje (9 pasos)
1. **Solicitud** — Usuario abre app y pide
2. **Matching** — Plataforma busca conductor
3. **Aceptación** — Conductor confirma
4. **Traslado al punto** — Conductor en Uber/remis
5. **Verificación** — ID + foto estado del auto
6. **Viaje** — GPS en tiempo real
7. **Llegada + pago** — App cobra al usuario
8. **Regreso del conductor** — Pide Uber/remis (costo incluido en tarifa)
9. **Calificación mutua** — Modelo doble ciego, diferida para el usuario

---

## Sistema de calificaciones

### Principios clave
- **Calificación diferida del usuario:** notificación al día siguiente (usuario sobrio)
- **Modelo doble ciego:** ninguna parte ve la calificación de la otra hasta que ambas calificaron
- Anonimato bidireccional: elimina presión de represalias

### El usuario evalúa al conductor
- Manejo defensivo del auto
- Puntualidad al punto de recogida
- Trato respetuoso en situación de vulnerabilidad
- Estado del auto al llegar al destino

### El conductor evalúa al usuario
- Comportamiento y trato
- Estado interior del auto al retirar
- Disponibilidad al llegar
- Información correcta (dirección, llaves)

### Protecciones
- Calificaciones 1-2 estrellas disparan revisión manual
- Derecho a réplica para ambas partes
- Umbral de suspensión: < 4.0 → revisión manual
- Registro fotográfico guardado 48hs

---

## Onboarding y verificación de conductores

### Etapa 1 — Registro básico (autónomo, ~5 min)
- Nombre, celular, verificación SMS
- Selfie en tiempo real
- Zona de operación

### Etapa 2 — Verificación de identidad (automática, < 24hs)
- DNI ambas caras con OCR (RENAPER/Veritran)
- Licencia de conducir vigente
- Antecedentes penales (Registro Nacional)

### Etapa 3 — Capacitación obligatoria (~30 min)
| Módulo | Contenido |
|---|---|
| Manejo responsable | Conducción defensiva con auto ajeno |
| Protocolo de conflictos | Usuario agresivo o en crisis |
| Emergencias | Accidente, desmayo, robo |

### Etapa 4 — Viaje de prueba supervisado
- Viaje simulado con auto propio
- Revisor monitorea GPS en vivo
- Aprobado o reintenta en 7 días

### Estados del conductor
`Pendiente → En capacitación → Activo → Suspendido`

### Renovación periódica
- Cada 6 meses: re-verificar licencia + docs
- Si baja de 4.2★: módulo de recapacitación
- Selfie de acceso en cada conexión

---

## Modelo de negocio

### Formación del precio
```
Tarifa total = Base del viaje + Regreso del conductor + Seguro por viaje
```

### Distribución por viaje
| Destino | % |
|---|---|
| Conductor | 65% |
| Plataforma YoBorracho | 20% |
| Fondo de seguro | 10% |
| Fondo de daños | 5% |

**Ejemplo:** viaje de $8.000 → conductor $5.200 · plataforma $1.600 · seguro $800 · fondo $400

### Precio dinámico
- Precio fijo como regla general
- Multiplicador máximo 1.5x en horarios de alta demanda
- Siempre visible antes de confirmar

### Fuentes de ingreso adicionales
- **Suscripción conductor:** plan mensual, menor comisión
- **Suscripción usuario:** tarifa reducida + prioridad
- **Viajes patrocinados:** boliches/cervecerías subsidian el precio

### Estrategia de expansión
- Lanzamiento hiperlocal (zona de boliches, Rosario)
- Reclutamiento de conductores previo al lanzamiento
- Expansión a ciudad 2 cuando ciudad 1 sea rentable
- Playbook replicable por ciudad

---

## Seguridad distribuida (sin admin 24/7)

En lugar de un humano mirando un dashboard, tres capas distribuidas:

### Capa 1 — Red de confianza del usuario
- Compartir viaje en tiempo real con contactos
- Link sin necesidad de la app
- Botón de alerta si algo parece raro

### Capa 2 — Botón SOS del conductor
- Escala automáticamente
- Sin respuesta en 60s → llama al 911
- Notifica a contactos del usuario

### Capa 3 — Alertas automáticas por GPS
- Auto detenido >10 min fuera del destino → alerta
- Ruta completamente diferente → alerta
- Velocidad excesiva → registro + alerta
- Viaje con el doble del tiempo estimado → notificación

### Número de emergencias
- IVR simple: emergencia de seguridad → conecta con 911 y notifica plataforma
- Soporte por WhatsApp en horario razonable (no 24/7)

### Lo que sí necesita ser humano
- Verificación de conductores: backoffice 1 vez/día
- Resolución de disputas de daños: 24-48hs via WhatsApp

---

## Documentos generados

### Modelo de dominio (.docx)
Documento Word con 8 secciones:
1. Descripción general y propuesta de valor
2. Actores del sistema
3. Flujo completo del viaje
4. Onboarding y verificación de conductores
5. Sistema de calificaciones
6. Modelo de negocio
7. Reglas de negocio críticas
8. Riesgos y mitigaciones

---

## Prototipo

### Herramientas exploradas
- **Lovable:** generado con prompts detallados, limitado por cantidad de prompts
- **Figma:** descartado (no acepta prompts de texto como generador)
- **Artefacto React local (elegido):** 38 pantallas navegables, sin límite de prompts

### Pantallas implementadas

#### Auth
- `/splash` — Pantalla de inicio
- `/login` — Login con acceso rápido por rol (usuario/conductor)
- `/register-select` — Elección de rol
- `/register-user` — Registro de usuario
- `/register-driver` — Registro de conductor

#### Verificación (role-aware)
- `/verify-1` a `/verify-4` — Pasos de verificación
- `/verify-pending` — Esperando verificación
- `/verify-approved` — Verificado exitosamente

> **Lógica de roles:** usuarios saltan el paso 4 (licencia). Solo conductores ven ese paso.

#### Flujo usuario
- `/user-home` — Home con mapa, CTA, pasos y viajes recientes
- `/user-request-1,2,3` — Solicitud de viaje (ubicación → destino → confirmación + precio)
- `/user-waiting` — Búsqueda de conductor (auto-transiciona a match en 3s)
- `/user-tracking-arrive` — Conductor en camino
- `/user-tracking-ride` — Conductor manejando el auto
- `/user-arrived` — Llegada exitosa
- `/user-rate` — Calificación diferida (simula "mañana")
- `/user-history` — Historial con filtros
- `/user-history-detail` — Detalle con desglose de tarifa
- `/user-notifications` — Centro de notificaciones in-app
- `/user-profile` — Perfil completo
- `/user-profile-edit` — Edición de datos
- `/user-settings` — Configuración con toggles

#### Flujo conductor
- `/driver-home` — Dashboard con toggle disponibilidad + botón simular pedido
- `/driver-request` — Pedido entrante con countdown 15s
- `/driver-approach` — Yendo al punto de recogida (ETA en vivo)
- `/driver-checkin` — Verificación: fotos + PIN de 4 dígitos
- `/driver-ride` — Viaje activo con SOS y tracking
- `/driver-dropoff` — Llegada al destino + fotos finales + earnings reveal
- `/driver-rate` — Calificación del usuario
- `/driver-history` — Historial con ganancias netas
- `/driver-history-detail` — Desglose completo (comisiones, ganancia neta)
- `/driver-notifications` — Notificaciones del conductor
- `/driver-profile` — Perfil con badges de verificación
- `/driver-profile-edit` — Edición de datos
- `/driver-earnings` — Gráfico de ganancias + stats
- `/driver-settings` — Configuración operacional

#### Compartido
- `/logout-confirm` — Confirmación de cierre de sesión

### Usuarios de prueba
| Email | Contraseña | Rol |
|---|---|---|
| sofia@test.com | 123 | Usuario |
| martin@test.com | 123 | Conductor |

### Cómo ejecutar
```bash
npm create vite@latest yoborracho -- --template react
cd yoborracho
npm install
# Reemplazar src/App.jsx con el archivo generado
npm run dev
# Abrir http://localhost:5173
```

---

## Decisiones de diseño clave

| Decisión | Elección | Razón |
|---|---|---|
| Modo | Dark mode | App nocturna, contexto de salidas |
| Fuente | DM Sans | Moderna, legible, no genérica |
| Color primario | #2E75B6 (navy blue) | Confianza, sobriedad |
| Precio | Fijo (no dinámico) | Usuario borracho no debe sorprenderse |
| Calificación | Diferida + doble ciego | Usuario en estado alterado al momento del viaje |
| Seguridad | Distribuida (GPS + contactos) | Sin necesidad de admin 24/7 |
| Expansión | Ciudad por ciudad | Resolver problema del huevo y la gallina |

---

*Conversación con Claude Sonnet 4.6 · YoBorracho v1.0 · Julio 2026*
