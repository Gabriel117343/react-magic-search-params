import { useState, useEffect, useRef } from "react";

type Theme = "light" | "dark";
type OriginTheme = "system" | "user-defined";

export const useHandleTheme = () => {

  const originRef = useRef<OriginTheme | "none">("none");
  const actualSystemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  // solo se ejecutará una vez al montar el componente
  const defaultValue = () => {
    // Intenta obtener el tema del local storage
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    console.log(
      "🌒Búscando el tema del local storage...",
      `Tema: ${storedTheme ?? "No definido"}`
    );
    if (storedTheme === "dark" || storedTheme === "light") {
      originRef.current = "user-defined";
      return storedTheme;
    }
    const defaultTheme = actualSystemTheme.matches ? "dark" : "light";
    originRef.current = "system";
    return defaultTheme;
    // Nota: es mejor manejar el un evento de escucha para el cambio de tema del sistema, en caso el usuario lo cambié mientras esta en la página
  };
  const [theme, setTheme] = useState<Theme | "none">(defaultValue);

  actualSystemTheme.addEventListener("change", (e) => {
    // solo si el tema no ha sido definido por el usuario
    if (originRef.current === "user-defined") return;
    const sistemTheme: Theme = e.matches ? "dark" : "light";
    originRef.current = "system";
    setTheme(sistemTheme);
  });

  useEffect(() => {
    document.documentElement.setAttribute("origin-theme", originRef.current);
    document.documentElement.setAttribute("data-theme", theme);
    // una vez asegurado el tema establecido por el usuario, ya no se utilizará el tema del sistema
    localStorage.setItem("theme", theme);
    // Se limpia el evento de escucha al desmontar el componente
    return () => {
      actualSystemTheme.removeEventListener("change", () => {});
    };
  }, [theme, actualSystemTheme]);
  const handleChangeTheme = () => {
    originRef.current = "user-defined";
    setTheme(theme === "light" ? "dark" : "light");
  };

  return { theme, onChangeTheme: handleChangeTheme, origin: originRef.current };
};
