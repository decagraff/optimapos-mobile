# OptimaPOS Mobile — Roadmap Completo

> App móvil para todo el ecosistema del restaurante: personal interno + clientes.
> Conecta al mismo backend OptimaPOS (API REST + Socket.io).
> Distribución: APK directo (sin Play Store por ahora).

---

## Perfiles de Usuario

### Mesero / Personal de sala
- Tomar pedidos desde la mesa
- Ver estado de pedidos en tiempo real
- Notificaciones cuando el pedido está listo
- Cambiar mesa, agregar notas

### Cocina
- Ver pedidos entrantes en tiempo real (pantalla tipo Kitchen Display)
- Marcar items/pedidos como "Preparando" y "Listo"
- Filtro por categoría (bebidas, platos, postres)
- Sonido/vibración al llegar nuevo pedido
- Vista optimizada para tablet o celular en horizontal
- Timer por pedido (tiempo desde que entró)

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

### Admin (multi-local)
- Todo lo del Manager
- Selector de local (cambiar entre locales del tenant)
- Dashboard comparativo entre locales
- Reportes consolidados de todos los locales
- Gestión rápida: activar/desactivar productos por local
- Ver usuarios y su actividad por local
- Notificaciones de todos los locales

### Cliente (consumidor final)
- Ver menú del restaurante (por local)
- Hacer pedidos: delivery, para recoger, o desde la mesa
- Repetir último pedido con 1 tap
- Guardar productos favoritos
- Direcciones guardadas (casa, trabajo, etc.)
- Historial de pedidos completo
- Tracking en tiempo real de su pedido
- Pedir como invitado (sin registro, solo nombre + teléfono)
- Registro completo para funciones extra (favoritos, historial, repetir)

---

## Sistema de QR

### Tipos de QR

#### QR de Mesa
- Cada mesa del restaurante tiene un QR único
- Contiene: `https://[slug].decatron.net/m/[mesaId]?l=[locationId]`
- Al escanear:
  - Si tiene la app → deep link, abre la app en ese local + mesa preseleccionada
  - Si no tiene la app → abre el navegador con el menú web de esa mesa
- El tipo de pedido se auto-selecciona como "En mesa"
- La mesa se auto-asigna del QR

#### QR del Restaurante / Local
- Un QR general por local (para puerta, flyers, redes sociales)
- Contiene: `https://[slug].decatron.net/menu?l=[locationId]`
- Muestra el menú completo del local
- Permite pedir delivery o para recoger
- Banner para descargar la app

### Generación de QR (Admin Web)
- Configuración → Mesas → cada mesa tiene botón "Descargar QR"
- Botón "Descargar todos los QR" → genera PDF con todos
- QR branded: logo del restaurante al centro
- PDF imprimible con formato por mesa:
  - Logo + nombre del restaurante
  - QR grande
  - "Mesa X"
  - "Escanea para ver el menú"
  - WiFi del local (opcional)
  - Dirección del local
- QR del restaurante desde Configuración → Local → "QR del menú"

### Menú Web (sin app — acceso por QR)
- Página web responsive que funciona sin instalar nada
- Ruta: `https://[slug].decatron.net/m/[mesaId]` o `/menu`
- Muestra la carta del local correcto (por locationId)
- Permite agregar items al carrito
- Checkout:
  - En mesa: mesa auto-asignada del QR
  - Delivery: pide dirección
  - Para recoger: solo confirma
- Pedir como invitado: solo nombre + teléfono (sin password)
- Registro opcional para guardar historial y favoritos
- Banner fijo: "Descarga la app para pedir más rápido"
- El pedido llega al POS igual que cualquier otro pedido
- Estado del pedido visible en la misma web después de confirmar

---

## Fases de Desarrollo

### Fase 1 — Base + Autenticación ✅
- [x] Splash screen con logo OptimaPOS
- [x] Pantalla de configuración inicial (código del restaurante)
- [x] Validación de servidor (`/api/health`)
- [x] Login con email/password (staff)
- [x] Registro de cliente (nombre + teléfono + password)
- [x] Persistencia de token (SecureStore)
- [x] Selección de local (si el tenant tiene varios)
  - Si solo 1 local → skip automático
  - Local actual visible en header y pantalla "Más"
- [x] Navegación por tabs según rol del usuario
- [x] Conexión Socket.io para eventos real-time
- [x] Componentes base del design system (Button, Card, Input, Badge, EmptyState, LoadingScreen, ErrorBoundary)
- [x] Manejo de errores global (ErrorBoundary)
- [x] Dashboard por rol (Admin, Waiter, Kitchen, Cashier, Delivery, Client)

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

### Fase 2.5 — Módulo Cocina
- [ ] Lista de pedidos entrantes en tiempo real (Socket.io)
- [ ] Card de pedido: items con cantidad, notas, variantes, addons
- [ ] Botón "Preparando" y "Listo" por pedido
- [ ] Filtro por categoría (todo / bebidas / platos / postres)
- [ ] Timer visible por pedido (minutos desde que entró)
- [ ] Sonido + vibración al llegar nuevo pedido
- [ ] Auto-scroll al nuevo pedido
- [ ] Vista adaptable: vertical (celular) y horizontal (tablet)
- [ ] Indicador visual de pedidos urgentes (> X minutos)

### Fase 3 — Módulo Delivery
- [ ] Lista de pedidos asignados (cards grandes)
- [ ] Detalle de pedido: items + dirección + teléfono cliente
- [ ] Botón "Abrir en Maps / Waze" con dirección
- [ ] Cambio de estado con botón principal grande
- [ ] Foto de entrega (cámara del dispositivo)
- [ ] Historial de entregas del día
- [ ] Notificación push de nuevo pedido asignado
- [ ] Badge de pedidos pendientes en tab

### Fase 3.5 — Módulo Cliente
- [ ] Home del cliente:
  - Banners de promos activas
  - Botón "Repetir último pedido" (1 tap, muestra resumen + precio)
  - Sección "Tus favoritos" (productos con corazón)
  - Categorías con imagen
- [ ] Catálogo: mismos componentes que mesero pero sin opciones de staff
- [ ] Carrito + Checkout:
  - Tipo de pedido: Delivery / Para recoger / En mesa
  - Delivery: selector de dirección guardada o nueva + zona con recargo
  - Para recoger: solo confirma local y hora estimada
  - En mesa: número de mesa o escaneo de QR
  - Campo código de descuento
  - Método de pago: Efectivo, Yape, Transferencia
  - Confirmar pedido
- [ ] Tracking del pedido en tiempo real (Socket.io):
  - Timeline visual: Confirmado → Preparando → Listo → En camino → Entregado
  - Tiempo estimado
- [ ] Mis pedidos (historial):
  - Lista de pedidos anteriores
  - Botón "Repetir" en cada pedido
  - Detalle expandible con items
- [ ] Favoritos:
  - Corazón en cada producto para agregar/quitar
  - Sección dedicada con acceso rápido
- [ ] Perfil del cliente:
  - Datos personales (nombre, teléfono)
  - Direcciones guardadas (CRUD: casa, trabajo, otras)
  - Cambiar contraseña
- [ ] Pedir como invitado (sin cuenta):
  - Solo pide nombre + teléfono en checkout
  - No tiene historial, favoritos ni repetir pedido
  - Banner: "Crea una cuenta para guardar tus pedidos"

### Fase 4 — Módulo Manager / Dashboard
- [ ] Card de ventas del día (total, cantidad, ticket promedio)
- [ ] Gráfico de ventas por hora (barras)
- [ ] Top 5 productos más vendidos
- [ ] Estado de mesas en vivo (grid con colores)
- [ ] Lista de pedidos activos con filtros
- [ ] Toggle rápido de productos (activar/desactivar)
- [ ] Pull-to-refresh + auto-refresh cada 30s

### Fase 4.5 — Módulo Admin (multi-local)
- [ ] Selector de local en header (dropdown o modal)
- [ ] Cambio de contexto: al seleccionar local, todo se filtra por ese local
- [ ] Dashboard comparativo: ventas de todos los locales en cards
- [ ] Reportes consolidados (total de todos los locales)
- [ ] Reportes por local individual
- [ ] Gestión rápida de productos por local (activar/desactivar)
- [ ] Lista de usuarios con último acceso por local
- [ ] Notificaciones agregadas de todos los locales
- [ ] Vista "Todos los locales" como opción del selector

### Fase 5 — Push Notifications (FCM)
- [ ] Integración Firebase Cloud Messaging
- [ ] Registro de device token por usuario en backend
- [ ] Backend envía push en eventos:
  - Nuevo pedido en cocina (para cocina)
  - Pedido listo (para mesero)
  - Nuevo pedido delivery asignado (para motorizado)
  - Estado del pedido actualizado (para cliente)
  - "Tu pedido está listo para recoger" (para cliente)
  - "El motorizado está en camino" (para cliente)
  - Stock agotado (para manager/admin)
  - Caja cerrada (para manager/admin)
  - Pedido cancelado (para todos)
  - Resumen diario de ventas (para admin, al cierre)
- [ ] Pantalla de historial de notificaciones
- [ ] Badge en ícono de la app

### Fase 5.5 — Sistema QR + Menú Web
- [ ] **Backend:**
  - Endpoint para generar QR por mesa (devuelve PNG/SVG)
  - Endpoint para generar PDF con todos los QR de un local
  - Endpoint para pedido como invitado (sin auth, solo nombre+teléfono)
  - QR branded con logo del tenant
- [ ] **Admin Web (frontend OptimaPOS):**
  - Botón "Descargar QR" en cada mesa (Configuración → Mesas)
  - Botón "Descargar todos los QR" → PDF imprimible
  - QR del menú general del local (Configuración → Local)
  - Preview del QR antes de descargar
- [ ] **Menú Web público:**
  - Ruta `/m/:mesaId` — menú con mesa preseleccionada
  - Ruta `/menu` — menú general (delivery/pickup)
  - Catálogo completo del local (categorías, productos, variantes, addons)
  - Carrito + checkout (invitado o registrado)
  - Vista de estado del pedido post-compra
  - Responsive: optimizado para celular
  - Banner "Descarga la app"
- [ ] **App móvil:**
  - Escáner QR integrado (cámara)
  - Deep links: la app intercepta URLs del restaurante
  - Auto-selección de mesa y local desde el QR

### Fase 6 — Offline Básico
- [ ] Cache del catálogo en SQLite local (expo-sqlite)
- [ ] Tomar pedidos sin conexión (cola local) — solo staff
- [ ] Sync automático al recuperar conexión
- [ ] Indicador visual de estado de conexión
- [ ] Cache de datos del usuario para login offline

### Fase 7 — Extras Pro
- [ ] Firma digital del cliente en entrega
- [ ] Modo oscuro completo
- [ ] Multi-idioma (español / inglés)
- [ ] Auto-update OTA (expo-updates o CodePush)
- [ ] Login biométrico (huella / Face ID)
- [ ] Haptic feedback en acciones importantes
- [ ] Animaciones de transición pulidas
- [ ] Programa de fidelidad: cada X pedidos → descuento automático
- [ ] Valoración de pedido (estrellas + comentario) post-entrega

---

## Flujo del Cliente — Detalle

### Primera vez (sin app)
```
Escanea QR de mesa 5
  → Abre navegador web
  → Ve menú del local (Sede Principal)
  → Agrega items al carrito
  → Checkout: "Pedir como invitado"
  → Ingresa: nombre + teléfono
  → Tipo: "En mesa" (auto del QR), Mesa: 5 (auto)
  → Confirma pedido
  → Ve estado en tiempo real en la misma web
  → Banner: "Descarga la app para pedir más rápido"
```

### Cliente con app (frecuente)
```
Abre la app
  → Ya logueado, local recordado
  → Home: "Repetir último pedido: 2x Lomo + 1 Chicha — S/ 45"
  → Tap "Pedir" → Checkout pre-llenado
  → Confirma → Listo (2 taps total)
```

### Cliente con app + QR de mesa
```
Escanea QR de mesa 5
  → Deep link abre la app
  → Local: Sede Principal (del QR)
  → Mesa: 5 (del QR)
  → Ve el menú, agrega items
  → Checkout: tipo "En mesa", mesa 5 (auto)
  → Confirma → Pedido llega al POS
  → Push notification: "Tu pedido está siendo preparado"
  → Push notification: "Tu pedido está listo"
```

### Selección de local (multi-local)
```
Abre la app (o escanea QR del restaurante general)
  → "¿Desde dónde quieres pedir?"
  → Lista de locales:
    - Sede Principal — Av. La Marina 2450 — Abierto
    - Sucursal San Miguel — Jr. Los Olivos 180 — Abierto
    - Sucursal Callao — Av. Sáenz Peña 320 — Cerrado
  → Selecciona local
  → ☑ Recordar mi selección
  → Ve el menú de ESE local (catálogo independiente)

  Si solo hay 1 local → salta directo al menú
```

---

## Fuera de Alcance (se queda en Desktop / Web Admin)

- Caja / Arqueo (requiere impresora)
- Impresión de tickets
- CRUD completo de productos / categorías / addons / combos
- Configuración de impresoras
- Panel Super Admin
- Gestión de usuarios (CRUD)
- Suscripción / pagos PayPal
- Editor de tickets

---

## Guía de Diseño

### Paleta de Colores — Slate + Amber (profesional)

| Uso              | Color             | Hex       | Tailwind     |
|------------------|-------------------|-----------|--------------|
| Primario         | Slate oscuro      | `#1E293B` | slate-800    |
| Primario dark    | Slate muy oscuro  | `#0F172A` | slate-900    |
| Acento / CTAs    | Amber             | `#F59E0B` | amber-500    |
| Acento dark      | Amber oscuro      | `#D97706` | amber-600    |
| Éxito            | Esmeralda         | `#059669` | emerald-600  |
| Peligro          | Rojo              | `#DC2626` | red-600      |
| Advertencia      | Amber oscuro      | `#D97706` | amber-600    |
| Info             | Azul              | `#2563EB` | blue-600     |
| Fondo app        | Slate muy claro   | `#F8FAFC` | slate-50     |
| Fondo cards      | Blanco            | `#FFFFFF` | white        |
| Texto principal  | Slate muy oscuro  | `#0F172A` | slate-900    |
| Texto secundario | Slate medio       | `#475569` | slate-600    |
| Texto terciario  | Slate claro       | `#94A3B8` | slate-400    |
| Bordes           | Slate suave       | `#E2E8F0` | slate-200    |

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
- Inputs: `borderRadius: 8`, borde `gray-200`, focus borde `slate-800`
- Chips/badges: `borderRadius: 20` (pill)

### Iconos

- Librería: **Lucide React Native** (consistente con web OptimaPOS)
- Tamaño en tabs: 24px
- Tamaño en botones: 20px
- Tamaño inline: 16px
- Color: hereda del texto o del estado

### Bottom Tabs

- Ícono + label siempre visible
- Tab activo: slate (`#1E293B`), inactivo: slate-400 (`#94A3B8`)
- Fondo blanco, borde superior sutil

Tabs por rol:
- **Cliente:** Inicio | Carta | Mis Pedidos | Perfil
- **Mesero:** Carta | Mis Pedidos | Mesas | Perfil
- **Cocina:** Pedidos | Historial | Perfil
- **Delivery:** Pendientes | En Curso | Historial | Perfil
- **Manager:** Dashboard | Pedidos | Mesas | Productos | Perfil
- **Admin:** Dashboard | Pedidos | Locales | Productos | Perfil

### Headers / Navigation

- Fondo blanco
- Título centrado, bold
- Sin borde inferior, solo sombra sutil
- Botón back: flecha izquierda
- Cliente: nombre del local + selector de local en header

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
│   ├── Avatar.tsx          — iniciales o foto de usuario
│   └── QRScanner.tsx       — escáner de QR con cámara
├── product/
│   ├── ProductCard.tsx     — imagen + nombre + precio (grid)
│   ├── ProductDetail.tsx   — variantes + addons + notas
│   ├── CategoryChips.tsx   — scroll horizontal de categorías
│   └── FavoriteButton.tsx  — corazón toggle (cliente)
├── order/
│   ├── OrderCard.tsx       — resumen compacto de pedido
│   ├── OrderDetail.tsx     — items + totales + estado
│   ├── OrderTimeline.tsx   — timeline visual de estados (cliente)
│   ├── CartSheet.tsx       — bottom sheet del carrito
│   └── RepeatOrderCard.tsx — card "Repetir último pedido" (cliente)
├── client/
│   ├── HomeBanner.tsx      — banners de promos (carousel)
│   ├── AddressPicker.tsx   — selector de dirección guardada + nueva
│   ├── LocationSelector.tsx— selección de local (multi-local)
│   └── GuestCheckout.tsx   — formulario invitado (nombre + teléfono)
├── kitchen/
│   ├── KitchenCard.tsx     — pedido con items, timer, botones estado
│   └── KitchenFilters.tsx  — chips de filtro por categoría
├── delivery/
│   ├── DeliveryCard.tsx    — pedido con dirección destacada
│   └── DeliveryMap.tsx     — mapa embebido pequeño
├── admin/
│   ├── LocationPicker.tsx  — selector de local (dropdown/modal)
│   └── CompareCards.tsx    — cards comparativas entre locales
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

**Cliente** — Estilo app de delivery (tipo PedidosYa/Rappi)
- Home con promos, repetir pedido, favoritos
- Catálogo visual con imágenes grandes
- Carrito como bottom sheet
- Checkout limpio con pasos claros
- Tracking del pedido con timeline animada
- Colores cálidos, experiencia amigable

**Mesero** — Estilo e-commerce
- Grid 2 columnas de productos con imagen
- Categorías como chips scrollables arriba
- Carrito como bottom sheet desde abajo
- Botón flotante "Enviar Pedido" naranja, grande, esquina inferior

**Cocina** — Estilo Kitchen Display System (KDS)
- Cards anchas, una por pedido, apiladas verticalmente
- Items en lista con cantidad destacada en negrita
- Timer en esquina superior (verde < 5min, amarillo 5–10min, rojo > 10min)
- Botones grandes "Preparando" (azul) y "Listo" (verde)
- Fondo oscuro opcional para mejor visibilidad en cocina
- Vibración + sonido al llegar pedido nuevo

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

**Admin** — Estilo manager + multi-local
- Selector de local prominente en header (nombre del local actual)
- Dashboard con cards por local cuando está en "Todos"
- Mismo layout que Manager al seleccionar un local específico
- Badge con alertas pendientes por local

---

## Stack Técnico

- **Framework:** Expo SDK 54 + React Native 0.81
- **Routing:** Expo Router v6 (file-based)
- **Estado:** React Context + useReducer (misma estrategia que desktop)
- **HTTP:** fetch nativo
- **Real-time:** socket.io-client
- **Storage seguro:** expo-secure-store (tokens)
- **SQLite offline:** expo-sqlite
- **Cámara:** expo-camera (foto de entrega + escáner QR)
- **Mapas:** react-native-maps o deep link a Google Maps
- **Push:** expo-notifications + Firebase FCM
- **Iconos:** lucide-react-native
- **Gráficos:** react-native-chart-kit o victory-native
- **QR Scanner:** expo-camera (barcode scanning integrado)

---

## Distribución y Actualizaciones

### Canales de distribución

- **Android:**
  - Fase inicial: APK directo (build: `eas build --platform android --profile preview`)
  - Producción: Google Play Store (requiere cuenta $25 una vez)
  - Build local: `npx expo run:android` → genera APK
- **iOS:** TestFlight → App Store (requiere Apple Developer $99/año — futuro)

### Estrategia de Versionamiento

La app usa **semver** (`MAJOR.MINOR.PATCH`):
- **MAJOR** — cambios incompatibles (nueva arquitectura, breaking changes en API)
- **MINOR** — nuevas funcionalidades (nuevo perfil, nuevo módulo)
- **PATCH** — bugfixes y mejoras menores

### Estrategia de Actualización

A diferencia de web (donde el usuario siempre ve la versión más reciente), en móvil el usuario controla cuándo actualizar. Para manejar esto:

#### 1. Thin Client — lógica en el backend
- La app es principalmente interfaz visual
- Menú, precios, configuración, flujos de pedido vienen del API
- Minimiza la necesidad de actualizar la app para cambios de negocio
- Regla: si un cambio puede vivir en el backend, NO va en la app

#### 2. Control de versión mínima (Force Update)
- Backend expone `GET /api/app/version` con:
  - `minVersion` — versión mínima requerida (cambios críticos/seguridad)
  - `latestVersion` — última versión disponible
  - `updateUrl` — link a Play Store / APK
- Al abrir la app, compara su versión con `minVersion`
- Si `appVersion < minVersion` → pantalla bloqueante "Actualiza tu app" (no puede continuar)
- Si `appVersion < latestVersion` pero `>= minVersion` → banner suave "Hay una actualización disponible" (puede ignorar)

#### 3. OTA Updates (sin pasar por la tienda)
- **EAS Update** (Expo) permite enviar cambios de JS/assets sin publicar nueva versión en la tienda
- Funciona para: cambios de UI, textos, lógica JS, estilos, nuevas pantallas
- NO funciona para: nuevos permisos nativos, nuevos plugins nativos, cambios en app.json
- Ideal para hotfixes urgentes — el usuario ve el cambio al abrir la app
- Configurar en `app.json`: `"updates": { "url": "...", "fallbackToCacheTimeout": 0 }`

#### 4. Cadencia de releases
- **Release mayor (tienda):** cada 2-4 semanas — features nuevas, cambios nativos
- **OTA hotfix:** inmediato cuando sea necesario — bugfixes de UI/lógica
- **Force update:** solo para cambios críticos de seguridad o API breaking changes

#### 5. Flujo de actualización del usuario
```
App abre → Fetch /api/app/version
  ├─ appVersion < minVersion → Pantalla "Actualiza" (bloqueante)
  ├─ appVersion < latestVersion → Banner "Nueva versión disponible" (dismissable)
  └─ Al día → Check OTA update silencioso → Aplicar en próximo reinicio
```

---

## Cambios Requeridos en Backend / Web

Estos cambios se hacen en el repo principal `optimapos` (backend + frontend web):

### Backend
- [x] Endpoint: generar QR por mesa (`GET /api/tables/:id/qr`) — devuelve data URL PNG
- [x] Endpoint: generar todos los QR de mesas (`GET /api/tables/qr-all`)
- [x] Endpoint: QR del menú por local (`GET /api/locations/:id/qr`)
- [x] Endpoints públicos de mesas (`GET /api/tables/public`, `GET /api/tables/public/:id`)
- [ ] Endpoint: pedido como invitado (`POST /api/orders/guest`) — sin auth, solo nombre+teléfono
- [ ] Endpoint: generar PDF con todos los QR de un local
- [ ] Modelo: `UserAddress` — direcciones guardadas del cliente
- [ ] Modelo: `UserFavorite` — productos favoritos del cliente
- [ ] Endpoint: CRUD direcciones del cliente (`/api/user/addresses`)
- [ ] Endpoint: CRUD favoritos del cliente (`/api/user/favorites`)
- [ ] Endpoint: historial de pedidos del cliente (`/api/user/orders`)
- [ ] Endpoint: repetir pedido (`POST /api/orders/repeat/:orderId`)
- [ ] Endpoint: registro de device token para push (`POST /api/user/device-token`)
- [ ] Endpoint: `GET /api/app/version` — control de versión mínima y force update
- [ ] Firebase Admin SDK para enviar push notifications
- [ ] Deep link universal: configurar `.well-known/assetlinks.json` (Android)

### Frontend Web (Admin)
- [x] Mesas → botón "Ver QR" por mesa + modal con preview
- [x] Mesas → botón "QR de todas" → página imprimible con todos los QR
- [x] Locales → botón "QR del menú" por local + modal con preview + descarga PNG + copiar URL
- [ ] QR de descarga de app (cuando la app esté lista)

### Frontend Web (Menú público)
- [x] Ruta `/m/:mesaId` — menú con mesa preseleccionada (DINE_IN)
- [x] Ruta `/menu?l={locationId}` — menú del local específico
- [x] Checkout DINE_IN: sin pago, sin WhatsApp, confirma directo a cocina
- [x] Página de confirmación contextual (DINE_IN vs delivery/pickup)
- [ ] Catálogo completo responsive (categorías, productos, variantes, addons)
- [ ] Vista de estado del pedido post-compra (tracking)
- [ ] Banner "Descarga la app para pedir más rápido"
- [ ] PWA-ready: se puede agregar a home screen
