# PokeNext Gallery

PokeNext Gallery es una aplicación web interactiva que permite a los usuarios explorar una galería de Pokémon, ver detalles de cada uno, filtrar por tipo o generación, y buscar Pokémon por nombre, incluyendo la visualización de sus cadenas evolutivas.

## Características Principales

- **Galería de Pokémon:** Visualiza una lista de Pokémon con sus imágenes y tipos.
- **Página de Detalles:** Accede a información detallada de cada Pokémon, incluyendo estadísticas, habilidades, altura, peso y su cadena evolutiva.
- **Búsqueda Avanzada:**
  - Busca Pokémon por nombre.
  - Filtra la galería por tipo de Pokémon.
  - Filtra la galería por generación de Pokémon.
- **Visualización de Cadenas Evolutivas:** Al buscar por nombre, se muestran los Pokémon relacionados en la misma cadena evolutiva.
- **Diseño Responsivo:** Interfaz adaptable a diferentes tamaños de pantalla.
- **Navegación Persistente:** Los filtros y términos de búsqueda se reflejan en la URL, permitiendo compartir vistas específicas.

## Tecnologías Utilizadas

### Frontend

- **Next.js:** Framework de React para renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG).
- **React:** Biblioteca de JavaScript para construir interfaces de usuario.
- **TypeScript:** Superset de JavaScript que añade tipado estático.
- **Tailwind CSS:** Framework de CSS "utility-first" para un diseño rápido y personalizado.
- **Shadcn/ui:** Colección de componentes de UI reutilizables construidos con Radix UI y Tailwind CSS.
- **Lucide React:** Iconos SVG.

### API

- **PokeAPI (pokeapi.co):** API RESTful utilizada para obtener todos los datos de los Pokémon.

### Herramientas de Desarrollo y Asistencia IA

- **ESLint & Prettier:** Para el formateo y la calidad del código.
- **Gemini Code Assist (Google):** Utilizado como asistente de codificación IA para ayudar en el desarrollo, optimización y resolución de problemas del código.
- **Turbopack:** Integrado con Next.js para un desarrollo local más rápido (ejecutado por defecto con `npm run dev`).
- **Firebase Studio:** Utilizado para la creación y prototipado inicial de componentes de la interfaz de usuario.

## Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local:

1.  **Clonar el repositorio:**

    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd PokeNext
    cp .env-example .env
    ```

2.  **Instalar dependencias:**
    Asegúrate de tener Node.js (v18 o superior recomendado) y npm/yarn/pnpm instalado.

    ```bash
    npm install
    # o
    yarn install
    # o
    pnpm install
    ```

3.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    # o
    yarn dev
    # o
    pnpm dev
    ```
    La aplicación estará disponible en `http://localhost:9002`.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor, abre un "issue" para discutir los cambios o envía un "pull request".
