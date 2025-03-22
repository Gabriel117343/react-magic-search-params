# Documentation for the Hook `useHandleTheme` 🌙💡

This hook is a special adaptation designed to handle dark mode in projects using Tailwind CSS v4. Its goal is to ensure that the current theme is always applied—whether set by the user or automatically detected based on system preferences—and to separate responsibilities into two distinct attributes in the HTML element:

- **`data-theme`**: Represents the theme currently applied to the interface (for example, "light" or "dark").
- **`origin-theme`**: Indicates the origin of the theme selection, which can be:
  - `"user-defined"`: The theme was manually selected by the user.
  - `"system"`: The theme was determined based on the system’s preference (using the media query `prefers-color-scheme`).

## Why This Approach? 🤔

- **Clarity in Styling**:  
  Since the `data-theme` attribute always reflects the active theme, Tailwind CSS can apply styles without confusion. Separating the origin information (like `"system"`) avoids mixing it with the actual theme value.

- **Separation of Responsibilities**:  
  Storing the theme’s source in `origin-theme` maintains a clear distinction:
  - **`data-theme`**: Contains only the value that affects the UI (e.g., `data-theme="dark"`).
  - **`origin-theme`**: Informs developers (or aids in debugging) whether the theme was determined by the system or set manually.

- **Persistence and Adaptability**:  
  The hook first looks for a user preference in `localStorage`. If none is found, it falls back on the system preference via `window.matchMedia("(prefers-color-scheme: dark)")`. It also listens for system changes and updates dynamically—unless the user has manually set a theme.

- **Ease of Maintenance**:  
  Centralizing theme management in this hook ensures that the entire application behaves consistently, giving developers a single control point for all dark mode settings.

## How It Works 🛠️

1. **Initialization**

   - The hook checks for a previously stored theme in `localStorage`.
   - If a valid theme exists, it marks the origin as `user-defined`.
   - Otherwise, it uses the system’s preference (determined with `prefers-color-scheme: dark`) and marks the origin as `system`.

2. **Theme Update**

   - Event listeners are added to react to system preference changes, updating the state only if the user hasn’t manually set the theme.
   - When manually updating via the `handleChangeTheme` function, the state is updated and marked as `user-defined`.

3. **DOM Synchronization**

   - The hook updates the `<html>` element’s attributes:
     - `data-theme` is set with the current theme.
     - `origin-theme` is updated to indicate the source (system or user-defined).

This separation ensures the interface always displays the correct theme without confusing where the preference came from—a key aspect for integrations with Tailwind CSS and similar frameworks.

---

## How to Debug and Test Dark Mode 🐞

To facilitate debugging and testing of `prefers-color-scheme`, Chrome DevTools allows you to emulate the user’s preferred color scheme without affecting global system settings. This is particularly useful for validating the hook’s behavior.

### Steps to Emulate Dark Mode in Chrome DevTools

1. **Open Chrome DevTools**:  
   Right-click on the page and select **Inspect**, or press `F12`.

2. **Access the Command Menu**:  
   Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS) to open the command palette.

3. **Search for "Rendering"**:  
   Type "Rendering" and select **Show Rendering** to open the Rendering panel.

4. **Emulate `prefers-color-scheme`**:  
   In the Rendering panel, find the **Emulate CSS media feature prefers-color-scheme** option and set it to your desired value (light, dark, or leave unspecified). This change affects only the visible tab, allowing you to see how the interface reacts without modifying your system settings.

<div align="center">
  <img src="https://github.com/user-attachments/assets/1a5c6b01-b349-4f24-8824-a4774567e059" alt="Chrome DevTools - Rendering Panel" width="400px" />
</div>

This feature is very useful for developers who need to quickly validate theme adaptations in real time.

---

<details>
  <summary><strong>Español Version (Click to Expand) 🇪🇸</strong></summary>

```markdown
# Documentación del Hook `useHandleTheme` 🌙💡

Este hook es una adaptación especial para el manejo de dark mode en proyectos que utilizan Tailwind CSS v4. Su objetivo es asegurar que siempre se aplique el tema actual, ya sea definido por el usuario o detectado automáticamente a partir de la preferencia del sistema, y separar las responsabilidades en dos atributos distintos en el elemento HTML:

- **`data-theme`**: Representa el tema actualmente aplicado en la interfaz (por ejemplo, "light" o "dark").
- **`origin-theme`**: Indica el origen de la elección del tema, pudiendo ser:
  - `"user-defined"`: El tema fue seleccionado manualmente por el usuario.
  - `"system"`: El tema se determinó en base a la preferencia del sistema (mediante el media query `prefers-color-scheme`).

## ¿Por Qué Este Enfoque? 🤔

- **Claridad en la Aplicación de Estilos**:  
  Gracias a que el atributo `data-theme` siempre muestra el tema actual, Tailwind CSS puede aplicar los estilos correspondientes sin confusión. No se superpone la información de origen (como `"system"`) en `data-theme`, lo que podría resultar confuso.

- **Separación de Responsabilidades**:  
  Al almacenar el origen del tema en `origin-theme`, se mantiene una distinción clara:
  
  - **`data-theme`**: Solo contiene el valor real que afecta la UI (por ejemplo, `data-theme="dark"`).
  - **`origin-theme`**: Informa al desarrollador o para fines de debugging si el tema se estableció por el sistema o fue elegido por el usuario.
  
- **Persistencia y Adaptabilidad**:  
  El hook primero intenta obtener la preferencia del usuario desde `localStorage`. Si no existe, se utiliza la preferencia del sistema mediante `window.matchMedia("(prefers-color-scheme: dark)")`. Además, se suscribe a los cambios del sistema y actualiza el estado dinámicamente (si el usuario no ha definido manualmente un tema).

- **Facilidad de Mantenimiento**:  
  Al centralizar la lógica de gestión de temas en este hook, se garantiza que toda la aplicación se comporte de forma consistente. El desarrollador cuenta con un único punto de control para manejar y actualizar la configuración de dark mode.

## Resumen del Funcionamiento 🛠️

1. **Inicialización**

   - Se busca un tema previamente almacenado en `localStorage`.
   - Si existe y es válido, se marca el origen como `user-defined`.
   - Si no, se utiliza la preferencia del sistema (determinada con `prefers-color-scheme: dark`) y se marca el origen como `system`.

2. **Actualización del Tema**

   - Se añaden event listeners para reaccionar a los cambios en la preferencia del sistema, actualizando el estado _sólo_ si el usuario no ha definido manualmente el tema.
   - Al cambiar manualmente el tema mediante el método `handleChangeTheme`, se actualiza el estado y se define el origen como `user-defined`.

3. **Sincronización con el DOM**

   - El hook actualiza los atributos del elemento `<html>`:
     - `data-theme` se configura con el tema actual.
     - `origin-theme` se configura con el origen de la elección (system o user-defined).

Esta separación garantiza que la interfaz siempre muestre el tema correcto sin confundir la fuente de la preferencia, lo que es fundamental para integraciones con Tailwind CSS y otros frameworks que dependen del atributo `data-theme`.

---

## Cómo Depurar y Probar el Modo Oscuro 🐞

Para facilitar la depuración y pruebas relacionadas con `prefers-color-scheme`, Chrome DevTools permite emular el esquema de colores preferido por el usuario sin afectar la configuración global del sistema operativo. Esto es especialmente útil para validar el comportamiento del hook `useHandleTheme`.

### Pasos para Emular el Modo Oscuro en Chrome DevTools

1. **Abre Chrome DevTools**:  
   Puedes hacerlo haciendo clic derecho en la página y seleccionando **Inspeccionar** o usando la combinación `F12`.

2. **Accede al Menú Comandos**:  
   Pulsa `Ctrl + Shift + P` (o `Cmd + Shift + P` en macOS) para abrir la paleta de comandos.

3. **Escribe "Rendering" y Selecciona "Show Rendering"**:  
   Esto abrirá el panel de Rendering en DevTools.

4. **Configura la Emulación de `prefers-color-scheme`**:  
   En el panel Rendering, busca la opción **Emulate CSS media feature prefers-color-scheme** y cámbiala al valor deseado (light, dark o dejar sin especificar). Esto afectará únicamente a la pestaña visible, permitiéndote ver cómo reacciona la interfaz sin modificar la configuración global.

<div align="center">
  <img src="https://github.com/user-attachments/assets/1a5c6b01-b349-4f24-8824-a4774567e059" alt="Chrome DevTools - Panel Rendering" width="400px" />
</div>

Esta funcionalidad es muy útil para desarrolladores que necesitan validar la adaptación del tema en tiempo real de forma rápida.

---
```

</details>