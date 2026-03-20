# OptimaPOS Mobile — Roadmap Completo

> App móvil para personal de restaurante: meseros, delivery y managers.
> Conecta al mismo backend OptimaPOS (API REST + Socket.io).
> Distribución: APK directo (sin Play Store por ahora).

---

## Perfiles de Usuario

### Mesero / Personal de sala
- Tomar pedidos desde la mesa
- Ver estado de pedidos en tiempo real
- Notificaciones cuando el pedido está listo
- Cambiar mesa, agregar notas

### Delivery / Motorizado
- Lista de pedidos asignados con prioridad
- Navegación GPS (Google Maps / Waze)
- Cambio de estados: Recogido → En camino → Entregado
- Foto de entrega como comprobante
- Historial de entregas del día

### Dueño / Manager
- Dashboard de ventas en tiempo real
- Reportes básicos (día/semana/mes, productos top)
- Notificaciones de eventos importantes
- Estado de mesas en vivo
- Activar/desactivar productos rápidamente

---

## Fases de Desarrollo

### Fase 1 — Base + Autenticación
- [ ] Splash screen con logo OptimaPOS
- [ ] Pantalla de configuración inicial (URL del servidor)
- [ ] Login con email/password
- [ ] Validación de servidor (`/api/health`)
- [ ] Persistencia de token (SecureStore)
- [ ] Navegación por tabs según rol del usuario
- [ ] Conexión Socket.io para eventos real-time
- [ ] Componentes base del design system
- [ ] Manejo de errores global (red de seguridad)

### Fase 2 — Módulo Mesero
- [ ] Catálogo: categorías como chips horizontales scrollables
- [ ] Grid de productos (2 columnas con imagen)
- [ ] Detalle de producto: variantes + addons + notas
- [ ] Carrito como bottom sheet deslizable
- [ ] Selección de mesa (grid visual o lista)
- [ ] Selección de tipo: Mesa / Para llevar
- [ ] Envío de pedido al backend
- [ ] Lista "Mis pedidos" con estado en vivo (Socket.io)
- [ ] Pull-to-refresh en listas
- [ ] Skeleton loaders durante carga

### Fase 3 — Módulo Delivery
- [ ] Lista de pedidos asignados (cards grandes)
- [ ] Detalle de pedido: items + dirección + teléfono cliente
- [ ] Botón "Abrir en Maps / Waze" con dirección
- [ ] Cambio de estado con botón principal grande
- [ ] Foto de entrega (cámara del dispositivo)
- [ ] Historial de entregas del día
- [ ] Notificación push de nuevo pedido asignado
- [ ] Badge de pedidos pendientes en tab

### Fase 4 — Módulo Manager / Dashboard
- [ ] Card de ventas del día (total, cantidad, ticket promedio)
- [ ] Gráfico de ventas por hora (barras)
- [ ] Top 5 productos más vendidos
- [ ] Estado de mesas en vivo (grid con colores)
- [ ] Lista de pedidos activos con filtros
- [ ] Toggle rápido de productos (activar/desactivar)
- [ ] Pull-to-refresh + auto-refresh cada 30s

### Fase 5 — Push Notifications (FCM)
- [ ] Integración Firebase Cloud Messaging
- [ ] Registro de device token por usuario en backend
- [ ] Backend envía push en eventos:
  - Pedido listo (para mesero)
  - Nuevo pedido delivery asignado (para motorizado)
  - Stock agotado (para manager)
  - Caja cerrada (para manager)
  - Pedido cancelado (para todos)
- [ ] Pantalla de historial de notificaciones
- [ ] Badge en ícono de la app

### Fase 6 — Offline Básico
- [ ] Cache del catálogo en SQLite local (expo-sqlite)
- [ ] Tomar pedidos sin conexión (cola local)
- [ ] Sync automático al recuperar conexión
- [ ] Indicador visual de estado de conexión
- [ ] Cache de datos del usuario para login offline

### Fase 7 — Extras Pro
- [ ] Escáner QR para identificar mesa
- [ ] Firma digital del cliente en entrega
- [ ] Modo oscuro completo
- [ ] Multi-idioma (español / inglés)
- [ ] Auto-update OTA (expo-updates o CodePush)
- [ ] Login biométrico (huella / Face ID)
- [ ] Haptic feedback en acciones importantes
- [ ] Animaciones de transición pulidas

---

## Fuera de Alcance (se queda en Desktop / Web)

- Caja / Arqueo (requiere impresora)
- Impresión de tickets
- CRUD completo de productos / categorías / addons / combos
- Configuración de impresoras
- Panel Super Admin
- Gestión de usuarios
- Suscripción / pagos PayPal
- Editor de tickets

---

## Guía de Diseño

### Paleta de Colores

| Uso              | Color             | Hex       | Tailwind     |
|------------------|-------------------|-----------|--------------|
| Primario         | Naranja OptimaPOS | `#F97316` | orange-500   |
| Primario dark    | Naranja oscuro    | `#EA580C` | orange-600   |
| Acento / Éxito   | Verde             | `#22C55E` | green-500    |
| Peligro          | Rojo              | `#EF4444` | red-500      |
| Advertencia      | Amarillo          | `#F59E0B` | amber-500    |
| Info             | Azul              | `#3B82F6` | blue-500     |
| Fondo app        | Gris muy claro    | `#F9FAFB` | gray-50      |
| Fondo cards      | Blanco            | `#FFFFFF` | white        |
| Texto principal  | Gris oscuro       | `#111827` | gray-900     |
| Texto secundario | Gris medio        | `#6B7280` | gray-500     |
| Bordes           | Gris suave        | `#E5E7EB` | gray-200     |

#### Modo Oscuro (Fase 7)

| Uso              | Hex       |
|------------------|-----------|
| Fondo app        | `#111827` |
| Fondo cards      | `#1F2937` |
| Texto principal  | `#F9FAFB` |
| Texto secundario | `#9CA3AF` |
| Bordes           | `#374151` |

### Tipografía

- **Fuente:** System default (San Francisco iOS, Roboto Android)
- Títulos: Bold, 18–24px
- Body: Regular, 14–16px
- Labels/secciones: Medium, 12px, uppercase
- Números grandes (dashboard): Bold, 28–36px

### Espaciado

Sistema de 4px: `4, 8, 12, 16, 20, 24, 32, 40, 48`

### Bordes y Sombras

- Cards: `borderRadius: 12`, sombra suave (`elevation: 2` Android, `shadowOpacity: 0.08` iOS)
- Botones: `borderRadius: 8`
- Inputs: `borderRadius: 8`, borde `gray-200`, focus borde `orange-500`
- Chips/badges: `borderRadius: 20` (pill)

### Iconos

- Librería: **Lucide React Native** (consistente con web OptimaPOS)
- Tamaño en tabs: 24px
- Tamaño en botones: 20px
- Tamaño inline: 16px
- Color: hereda del texto o del estado

### Bottom Tabs

- 3–4 tabs según rol
- Ícono + label siempre visible
- Tab activo: naranja (`#F97316`), inactivo: gris (`#6B7280`)
- Fondo blanco, borde superior sutil

### Headers / Navigation

- Fondo blanco
- Título centrado, bold
- Sin borde inferior, solo sombra sutil
- Botón back: flecha izquierda

### Componentes Reutilizables

```
components/
├── ui/
│   ├── Button.tsx          — primary, secondary, danger, outline, ghost
│   ├── Card.tsx            — sombra + bordes redondeados
│   ├── Badge.tsx           — estado con color (PENDIENTE, LISTO, etc.)
│   ├── Chip.tsx            — categorías, filtros (pill shape)
│   ├── Input.tsx           — text input con label y error
│   ├── BottomSheet.tsx     — carrito, filtros, detalles
│   ├── EmptyState.tsx      — ilustración + mensaje
│   ├── LoadingSkeleton.tsx — placeholder animado
│   ├── StatusChip.tsx      — estados de pedido con colores
│   └── Avatar.tsx          — iniciales o foto de usuario
├── product/
│   ├── ProductCard.tsx     — imagen + nombre + precio (grid)
│   ├── ProductDetail.tsx   — variantes + addons + notas
│   └── CategoryChips.tsx   — scroll horizontal de categorías
├── order/
│   ├── OrderCard.tsx       — resumen compacto de pedido
│   ├── OrderDetail.tsx     — items + totales + estado
│   └── CartSheet.tsx       — bottom sheet del carrito
├── delivery/
│   ├── DeliveryCard.tsx    — pedido con dirección destacada
│   └── DeliveryMap.tsx     — mapa embebido pequeño
└── dashboard/
    ├── StatCard.tsx         — número grande + label + icono
    ├── SalesChart.tsx       — gráfico de barras por hora
    └── TableGrid.tsx        — grid de mesas con colores
```

### Colores por Estado de Pedido

| Estado      | Color     | Hex       |
|-------------|-----------|-----------|
| PENDING     | Amarillo  | `#F59E0B` |
| CONFIRMED   | Azul      | `#3B82F6` |
| PREPARING   | Naranja   | `#F97316` |
| READY       | Verde     | `#22C55E` |
| ON_THE_WAY  | Púrpura   | `#8B5CF6` |
| DELIVERED   | Gris      | `#6B7280` |
| CANCELLED   | Rojo      | `#EF4444` |

### Colores por Estado de Mesa

| Estado   | Color  | Hex       |
|----------|--------|-----------|
| FREE     | Verde  | `#22C55E` |
| OCCUPIED | Rojo   | `#EF4444` |
| RESERVED | Azul   | `#3B82F6` |

### Animaciones

- Transiciones entre pantallas: slide horizontal (stack), fade (tabs)
- Skeleton loaders con shimmer effect durante carga
- Haptic feedback en: enviar pedido, cambiar estado, agregar al carrito
- Pull-to-refresh con indicador naranja
- Bottom sheet con gesto de drag

### Diseño por Rol

**Mesero** — Estilo e-commerce
- Grid 2 columnas de productos con imagen
- Categorías como chips scrollables arriba
- Carrito como bottom sheet desde abajo
- Botón flotante "Enviar Pedido" naranja, grande, esquina inferior

**Delivery** — Estilo lista de tareas
- Cards grandes con dirección en negrita
- Botón de acción principal ocupa todo el ancho
- Mini mapa en detalle del pedido
- Timeline vertical de estados

**Manager** — Estilo dashboard
- Cards con números grandes arriba
- Gráfico de barras debajo
- Lista compacta de pedidos activos
- Grid de mesas con indicador de color

---

## Stack Técnico

- **Framework:** Expo SDK 54 + React Native 0.81
- **Routing:** Expo Router v6 (file-based)
- **Estado:** React Context + useReducer (misma estrategia que desktop)
- **HTTP:** fetch nativo
- **Real-time:** socket.io-client
- **Storage seguro:** expo-secure-store (tokens)
- **SQLite offline:** expo-sqlite
- **Cámara:** expo-camera (foto de entrega)
- **Mapas:** react-native-maps o deep link a Google Maps
- **Push:** expo-notifications + Firebase FCM
- **Iconos:** lucide-react-native
- **Gráficos:** react-native-chart-kit o victory-native

---

## Distribución

- **Android:** APK directo (sin Play Store)
  - Build: `eas build --platform android --profile preview`
  - O local: `npx expo run:android` → genera APK
- **iOS:** TestFlight o ad-hoc (requiere Apple Developer $99/año — futuro)
- **Updates OTA:** expo-updates (Fase 7) para parches sin reinstalar
