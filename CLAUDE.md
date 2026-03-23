# OptimaPOS Mobile — Contexto para Claude Code

## Proyecto
App movil complementaria al SaaS OptimaPOS para restaurantes peruanos.
Directorio: `/var/www/html/optimapos-mobile/`

## Stack
- **Framework:** Expo SDK 54 + React Native 0.81
- **Routing:** Expo Router v6 (file-based)
- **State:** React Context + useReducer
- **Real-time:** socket.io-client
- **Storage:** expo-secure-store
- **Camera:** expo-camera (fotos + QR)
- **Language:** TypeScript
- **Build:** EAS Build (Expo Application Services)
- **OTA:** EAS Update (channel: production)

## Estructura principal
```
app/                    # File-based routes (Expo Router)
  index.tsx            # Splash/router
  setup.tsx            # Config servidor (slug)
  login.tsx            # Login staff/client
  register.tsx         # Registro cliente
  location-select.tsx  # Picker multi-location
  (tabs)/              # Tabs por rol
    _layout.tsx        # Tab config filtrada por rol
    index.tsx          # Dashboard (ADMIN/MANAGER)
    pos.tsx            # POS (ADMIN/MANAGER/VENDOR)
    orders.tsx         # Pedidos
    kitchen.tsx        # KDS (KITCHEN)
    deliveries.tsx     # Entregas (DELIVERY)
    history.tsx        # Historial entregas
    cash.tsx           # Caja
    reports.tsx        # Reportes
    tables.tsx         # Mesas
    menu.tsx           # Carta (CLIENT)
    profile.tsx        # Perfil (CLIENT)
    more.tsx           # Config/mas
components/            # UI reutilizable
context/               # AuthContext, CartContext, ServerContext, SocketContext
services/              # api.ts, storage.ts
hooks/                 # useClock, useSocket
utils/                 # roles.ts (TAB_CONFIG por rol)
types/                 # Interfaces TypeScript
constants/             # Theme, colors, spacing
```

## Backend
El mobile consume la API del backend principal en `/var/www/html/optimapos/backend/`.
- Base URL dinamica: `https://[slug].decatron.net/api`
- Header `X-Tenant-Id` extraido del subdominio
- Auth: Bearer token en Authorization header

## Roles y Tabs
Definidos en `utils/roles.ts`:
- **ADMIN/MANAGER:** Dashboard, POS, Pedidos, Reportes, Mas
- **VENDOR:** POS, Pedidos, Mesas, Caja, Mas
- **KITCHEN:** Cocina, Mas
- **DELIVERY:** Entregas, Historial, Mas
- **CLIENT:** Carta, Pedidos, Perfil

## Estado actual (Fases completadas)
- Phase 1: Auth + setup + multi-location
- Phase 2: Waiter/POS (catalogo, carrito, checkout, mesas)
- Phase 2.5: Kitchen KDS (real-time, timer, sin precios)
- Phase 3: Delivery (status flow, foto, claim, historial)
- Phase 3.5: Client parcial (catalogo, favoritos, direcciones, repetir pedido)
- Phase 4: Manager dashboard + reportes + caja + multi-location admin

## Pendiente
- Phase 5: Push notifications (FCM)
- Phase 5.5: QR scanner + deep links
- Phase 6: Offline (SQLite cache)
- Phase 7: Dark mode, biometrico, multi-idioma
- Client: delivery checkout, guest orders
- Backend: redirect por rol al login, validacion endpoints por rol

## Build y distribucion
```bash
# Build via EAS (NO local)
eas build --platform android --profile preview   # APK
eas build --platform android --profile production # AAB (Play Store)
eas update --channel production                   # OTA update
```
- Bundle ID: `net.decatron.optimapos`
- EAS Project ID: `4ec44244-119b-469c-8c0a-af7addcdaf59`
- Distribucion actual: APK directo (sin Play Store)

## Branding
- Sistema: **"OptimaPOS"** — SIEMPRE
- **Don Carlyn** = restaurante cliente (tenant slug: `doncarlyn`)

## Proyectos relacionados
- Backend + Frontend web: `/var/www/html/optimapos/`
- Desktop (Electron): `/var/www/html/optimapos-desktop/`
- Docs permisos: `/var/www/html/optimapos/docs/ROLES_AND_PERMISSIONS.md`
