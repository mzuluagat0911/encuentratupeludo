# Ubica tu Peludo

Plataforma de emergencia (mobile-first) para reunir mascotas en Colombia tras un sismo.  
**Sin registro ni login.** Dos flujos: *perdido* y *encontrado/visto*, con contacto directo por WhatsApp.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS + Lucide + Supabase** (DB + fotos).  
Sin Supabase configurado, corre en **modo local** (JSON + `/public/uploads`) para probar al instante.

---

## Probar en local (2 minutos)

```bash
cd Ubicatupeludo
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

1. Verás reportes de ejemplo en el feed.
2. Usa pestañas **Todas / Perdidos / Encontrados** y filtros de ciudad/animal.
3. Pulsa **Publicar** → elige tipo → completa el formulario → publica.
4. En una tarjeta, abre el botón de WhatsApp (abre `wa.me` con mensaje listo).

> El banner “Modo local” indica que aún no hay Supabase. Los datos viven en `.data/reports.json`.

---

## Configurar Supabase (producción)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta todo el contenido de `supabase/schema.sql`.
3. En **Project Settings → API**, copia:
   - Project URL
   - `anon` `public` key
4. Crea `.env.local`:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

5. Reinicia `npm run dev`.

El schema crea:
- Tabla `pet_reports` con RLS de lectura/escritura pública (sin auth, a propósito).
- Bucket `pet-photos` público para las fotos.

---

## Desplegar en Vercel (gratis)

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. En **Environment Variables** agrega las mismas que en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Listo.

En producción **necesitas Supabase**: el filesystem de Vercel no persiste el modo local.

Comando útil desde CLI:

```bash
npx vercel
```

---

## Estructura

```
src/
  app/
    page.tsx              # Feed + filtros
    publicar/page.tsx     # Formulario
    actions/reports.ts    # Server Action (publicar + subir foto)
  components/             # UI (hero, cards, filtros, form)
  lib/
    reports.ts            # Capa de datos (Supabase o local)
    cities.ts             # Ciudades de Colombia
    whatsapp.ts           # Links y mensajes wa.me
supabase/schema.sql       # SQL listo para pegar
```

---

## Flujos cubiertos

| Requisito | Implementación |
|-----------|----------------|
| Sin auth | Publicar y buscar sin cuenta |
| Selector perdido / encontrado | Primer paso del formulario |
| Perro / Gato, foto, ciudad, barrio, +57, descripción | Formulario único |
| Pestañas + filtros | URL search params |
| Cards con badge, foto, ubicación, fecha | `PetCard` |
| WhatsApp contextual | Textos distintos según tipo de reporte |

---

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # servir build
npm run lint     # eslint
```
