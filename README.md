# `@herman/i18n`

Módulo de internacionalización (i18n) **agnóstico de framework**, construido con TypeScript puro. Provee una API tipada y segura para manejar diccionarios de traducción, con un patrón Factory que permite inyectar la lógica de lectura del locale desde cualquier framework (Next.js, Remix, Vite+React, React Native, etc.).

---

## 📁 Estructura del paquete

```
packages/i18n/
├── src/
│   ├── core.ts      # Lógica agnóstica (sin dependencias de React ni de ningún framework)
│   ├── react.tsx    # Factory de hooks y componentes para React
│   └── index.ts     # Barrel export
├── dist/            # ⚠️ Generado automáticamente. NO editar. Ignorar en Git.
├── package.json
└── tsconfig.json
```

---

## 🧠 Conceptos clave

### Patrón Factory con inyección de locale

Este paquete **no sabe** cómo leer la URL, las cookies o el estado de la aplicación. En cambio, expone una función `createI18nHooks` a la que tú le dices cómo obtener el locale en tiempo de ejecución, a través de un hook de React que defines tú. Esto es lo que lo hace reutilizable en cualquier framework.

```
Framework             packages/i18n
──────────────────    ──────────────────────────────
useParams() de   →    createI18nHooks(useLocaleHook, ...)
Next.js          →    devuelve { useT, T, getDictionary, ... }
```

---

## 🚀 Instalación y uso

### 1. Añadir la dependencia

En proyectos del mismo monorepo, usa una referencia local en el `package.json` del proyecto:

```json
{
  "dependencies": {
    "@herman/i18n": "file:../packages/i18n"
  }
}
```

Si en el futuro lo publicas en npm, la referencia será simplemente:
```json
{
  "dependencies": {
    "@herman/i18n": "^1.0.0"
  }
}
```

### 2. Compilar el paquete

El paquete necesita ser compilado de TypeScript a JavaScript antes de poder ser consumido. Desde la carpeta `packages/i18n`:

```bash
npm run build
# que equivale a: npx tsc
```

> **Importante:** Siempre recompila el paquete (`npm run build`) después de modificar cualquier archivo en `src/`. Los proyectos consumidores importan desde `dist/`, no desde `src/`.

---

## 📖 API Reference

### `core.ts` — Funciones agnósticas

Estas funciones no tienen dependencias de React. Son seguras para usar en el servidor (Server Components, scripts, APIs, generadores de RSS, etc.).

---

#### `getNestedValue(obj, path)`

Extrae de forma segura un valor de tipo `string` desde un objeto anidado usando una ruta de punto (dot-notation).

```typescript
import { getNestedValue } from '@herman/i18n';

const dict = { ui: { btn: { submit: 'Enviar' } } };

getNestedValue(dict, 'ui.btn.submit'); // → 'Enviar'
getNestedValue(dict, 'ui.btn.cancel'); // → undefined
getNestedValue(dict, 'ui.btn');        // → undefined (no es string)
```

| Parámetro | Tipo      | Descripción                                     |
|-----------|-----------|-------------------------------------------------|
| `obj`     | `unknown` | El objeto donde buscar.                         |
| `path`    | `string`  | Ruta separada por puntos: `'nivel1.nivel2.clave'` |

**Retorna:** `string | undefined`. Retorna `undefined` si la clave no existe o el valor no es un `string`.

---

#### `resolveKey(dict, value)`

Resuelve una clave de traducción en un diccionario. Si la clave no existe, devuelve la propia clave como texto de fallback (útil para mostrar la clave como placeholder en desarrollo).

```typescript
import { resolveKey } from '@herman/i18n';

const dict = { ui: { btn: 'Enviar' } };

resolveKey(dict, 'ui.btn');          // → 'Enviar'
resolveKey(dict, 'ui.inexistente');  // → 'ui.inexistente' (la clave como fallback)
resolveKey(dict, 'Texto plano');     // → 'Texto plano'   (texto como fallback)
```

| Parámetro | Tipo     | Descripción                                           |
|-----------|----------|-------------------------------------------------------|
| `dict`    | `Dict`   | El diccionario (objeto con traducciones).             |
| `value`   | `string` | La clave dot-notation o un texto plano a resolver.   |

**Retorna:** `string`. Nunca retorna `undefined`.

---

#### `createI18nCore(dictionaries, defaultLocale)`

La función de fábrica principal para el **servidor o entornos sin React**. Genera las funciones `getDictionary` y re-exporta las utilidades, todas fuertemente tipadas según el objeto de diccionarios que le pases.

```typescript
import { createI18nCore } from '@herman/i18n';

// Tus diccionarios (objetos planos con las traducciones por idioma)
const dictionaries = {
  es: { saludo: 'Hola', despedida: 'Adiós' },
  en: { saludo: 'Hello', despedida: 'Goodbye' },
} as const;

const { getDictionary, resolveKey } = createI18nCore(dictionaries, 'es');

const dict = getDictionary('en');
dict.saludo; // → 'Hello'

getDictionary('fr'); // → fallback: diccionario de 'es'
```

| Parámetro       | Tipo                              | Descripción                                              |
|-----------------|-----------------------------------|----------------------------------------------------------|
| `dictionaries`  | `Record<string, any>`             | Objeto con los idiomas como claves y los textos como valores. |
| `defaultLocale` | `keyof typeof dictionaries`       | El idioma de fallback cuando el locale solicitado no existe. |

**Retorna un objeto con:**
| Propiedad        | Tipo                            | Descripción                        |
|------------------|---------------------------------|------------------------------------|
| `getDictionary`  | `(locale: string) => Dictionary`| Obtiene el dict para un locale.    |
| `resolveKey`     | `(dict, key) => string`         | Re-exportada del core.             |
| `getNestedValue` | `(obj, path) => string\|undefined` | Re-exportada del core.          |
| `dictionaries`   | El objeto original              | Referencia al objeto de entrada.   |
| `defaultLocale`  | El locale por defecto           | El locale de fallback.             |

---

### `react.tsx` — Factory para React

---

#### `createI18nHooks(useLocaleHook, dictionaries, defaultLocale)`

La función de fábrica principal para **React**. Recibe el hook que sabe leer el locale en tu framework concreto y devuelve el hook `useT` y el componente `<T>` ya configurados.

```typescript
import { createI18nHooks } from '@herman/i18n';

// Ejemplo genérico con un estado de React:
const { useT, T } = createI18nHooks(
  () => useMyFrameworkLocaleHook(), // ← aquí inyectas la lógica del framework
  myDictionaries,
  'es'
);
```

| Parámetro       | Tipo                              | Descripción                                                           |
|-----------------|-----------------------------------|-----------------------------------------------------------------------|
| `useLocaleHook` | `() => string`                    | Un React Hook que retorna el locale actual como string (e.g. `'es'`). |
| `dictionaries`  | `Record<string, any>`             | Objeto con los idiomas.                                               |
| `defaultLocale` | `keyof typeof dictionaries`       | El idioma de fallback.                                                |

**Retorna:** Todo lo de `createI18nCore` más:

| Propiedad | Tipo                  | Descripción                                     |
|-----------|-----------------------|-------------------------------------------------|
| `useT`    | `() => { t, locale }` | Hook para obtener la función de traducción.     |
| `T`       | `React.FC<TProps>`    | Componente de traducción para usar en JSX.      |

---

#### Hook `useT()`

Hook de React que devuelve `{ t, locale }`. Debe usarse solo en Client Components.

```typescript
const { t, locale } = useT();

// Traducción por ID de clave (dot-notation)
t({ id: 'ui.btn' })  // → 'Enviar' (en locale 'es')

// Traducción inline (contenido por locale)
t({ es: 'Enviar', en: 'Submit' }) // → 'Enviar' (si locale es 'es')
```

El objeto retornado por `useT()`:

| Propiedad | Tipo                        | Descripción                                |
|-----------|-----------------------------|--------------------------------------------|
| `t`       | `(props: TProps) => any`    | Función de traducción.                     |
| `locale`  | `string`                    | El locale activo en este momento.          |

---

#### Componente `<T />`

Componente de React para traducciones directamente en JSX. Acepta dos modos de uso:

**Modo ID** — busca la traducción en el diccionario:
```tsx
<T id="ui.btn" />
// → Renderiza 'Enviar' (si locale es 'es') o 'Submit' (si locale es 'en')
```

**Modo inline** — el texto está directamente en las props:
```tsx
<T es="Bienvenido" en="Welcome" />
// → Renderiza 'Bienvenido' (si locale es 'es')
```

La interfaz `TProps`:
```typescript
interface TProps {
  id?: string;           // Clave dot-notation del diccionario
  [locale: string]: React.ReactNode; // Contenido inline por locale
}
```

**Prioridad de resolución** (cuando se usa `id`):
1. Clave en el diccionario del locale actual.
2. Clave en el diccionario del `defaultLocale`.
3. Prop con el nombre del `defaultLocale` (ej. `props.es`).
4. Prop `en` o `es` (hardcoded como fallback secundario).
5. `props.children`.
6. `[ui.btn]` — la propia clave entre corchetes como último recurso.

---

## 🔌 Guía de integración por framework

### Next.js App Router

**1. Crea tu archivo de diccionarios** (`src/shared/i18n/dictionaries.ts`):

```typescript
import { createI18nCore } from '@herman/i18n';

// Importa tus JSON de traducción
import esUi from './lang/es/ui.json';
import enUi from './lang/en/ui.json';
// ...más imports

export const dictionaries = {
  es: { ...esUi /*, ...esOtros */ },
  en: { ...enUi /*, ...enOtros */ },
} as const;

// Genera las funciones tipadas para uso en el servidor
export const { getDictionary, resolveKey } = createI18nCore(dictionaries, 'es');

// Tipos exportados para uso en el resto del proyecto
export type Locale = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)[Locale];
```

**2. Crea el adaptador de Next.js** (`src/shared/i18n/hooks.tsx`):

```tsx
'use client'; // ← Obligatorio, useParams solo funciona en Client Components

import { useParams } from 'next/navigation';
import { createI18nHooks } from '@herman/i18n';
import { dictionaries } from './dictionaries';

// Inyectamos useParams de Next.js como la fuente de verdad del locale
export const { useT, T, getDictionary, resolveKey } = createI18nHooks(
  () => {
    const params = useParams();
    return (params?.locale as string) || 'es'; // fallback explícito
  },
  dictionaries,
  'es'
);
```

**3. Uso en Server Components** (sin React, solo el core):

```tsx
// app/[locale]/page.tsx (Server Component)
import { getDictionary } from '@/shared/i18n/dictionaries'; // del core, no del hook

export default async function Page({ params }) {
  const dict = getDictionary(params.locale);
  
  return <h1>{dict.home.title}</h1>;
}
```

**4. Uso en Client Components** (con el hook `useT`):

```tsx
'use client';
import { useT } from '@/shared/i18n/hooks'; // del adaptador de Next.js

export function MyButton() {
  const { t, locale } = useT();
  
  return (
    <button aria-label={t({ id: 'ui.btn' })}>
      <T id="ui.btn" />
    </button>
  );
}
```

**5. Uso en JSX** (con el componente `<T />`):

```tsx
'use client';
import { T } from '@/shared/i18n/hooks'; // del adaptador de Next.js

export function MyComponent() {
  return (
    <div>
      {/* Modo ID */}
      <h1><T id="home.headline" /></h1>
      
      {/* Modo inline */}
      <p><T es="Texto en español" en="Text in English" /></p>
    </div>
  );
}
```

---

### Vite + React (Ejemplo)

Para Vite con React Router, el adaptador sería:

```tsx
// src/i18n/hooks.tsx
import { useParams } from 'react-router-dom'; // ← diferente import
import { createI18nHooks } from '@herman/i18n';
import { dictionaries } from './dictionaries';

export const { useT, T } = createI18nHooks(
  () => useParams().lang ?? 'es', // ← diferente hook
  dictionaries,
  'es'
);
```

### React Native + Expo Router (Ejemplo)

```tsx
// src/i18n/hooks.tsx
import { useLocalSearchParams } from 'expo-router'; // ← hook de Expo
import { createI18nHooks } from '@herman/i18n';
import { dictionaries } from './dictionaries';

export const { useT, T } = createI18nHooks(
  () => {
    const { locale } = useLocalSearchParams<{ locale: string }>();
    return locale ?? 'es';
  },
  dictionaries,
  'es'
);
```

---

## 📁 Estructura de archivos de idioma recomendada

Organiza tus ficheros JSON por idioma y por sección/módulo. El paquete funciona con cualquier estructura de objeto plana o anidada.

```
src/shared/i18n/lang/
├── es/                      # Idioma: Español
│   ├── ui.json              # Textos de interfaz comunes
│   ├── page.json            # Metadatos de página principal
│   ├── person.json          # Datos de persona/perfil
│   ├── about/
│   │   └── page.json        # Textos de la sección About
│   ├── blog/
│   │   └── page.json        # Textos de la sección Blog
│   └── work/
│       └── page.json        # Textos de la sección Work
└── en/                      # Idioma: Inglés (misma estructura)
    ├── ui.json
    └── ...
```

Ejemplo de `ui.json`:
```json
{
  "ui": {
    "backToHome": "Volver al inicio",
    "pageNotFound": "404",
    "pageNotFoundTitle": "Página no encontrada"
  }
}
```

---

## 🔧 Scripts disponibles

Desde la carpeta `packages/i18n`:

```bash
npm run build   # Compila TypeScript → JavaScript en dist/
```

---

## 📝 Notas de mantenimiento

- **La carpeta `dist/` NO se debe subir a Git.** Agrégala a tu `.gitignore`.
- **Siempre recompila** (`npm run build`) después de cambiar archivos en `src/`.
- Los **tipos TypeScript** son derivados automáticamente del objeto `dictionaries`. Si añades una nueva clave en tus JSON, el tipo `Dictionary` se actualizará en la próxima compilación.
- El hook **`useT`** y el componente **`<T>`** son Client Components de React. Para Server Components, usa siempre `getDictionary()` directamente desde el core/dictionaries.
