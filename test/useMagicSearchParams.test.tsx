import React from 'react';
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  MemoryRouter as TestMemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import { useMagicSearchParams } from "../src/useMagicSearchParams";
import { paramsUsers } from "../src/constants/defaultParamsPage";

// Componente Wrapper para proporcionar el contexto del Router
function Wrapper({
  children,
  initialEntries = ["/"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  return (
    <TestMemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={children} />
      </Routes>
    </TestMemoryRouter>
  );
}

describe("useMagicSearchParams Hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Debe retornar los parámetros obligatorios al inicio (getParams)", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 10 },
        }),
      { wrapper: Wrapper }
    );

    const { page, page_size } = result.current.getParams({ convert: true });
    expect(page).toBe(1);
    expect(page_size).toBe(10);
  });

  it("Debe actualizar parámetros (updateParams) y reflejarlos en getParams", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 2, search: "test" } });
    });

    const { page, search } = result.current.getParams({ convert: true });
    expect(page).toBe(2);
    expect(search).toBe("test");
  });

  it("Debe forzar un parámetro (forceParams) y no permitir su cambio manual", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 5 },
        }),
      { wrapper: Wrapper }
    );

    // Intentar cambiar page_size manualmente
    act(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result.current.updateParams({ newParams: { page_size: 99 } });
    });

    const { page_size } = result.current.getParams({ convert: true });
    // Debe prevalecer 5
    expect(page_size).toBe(5);
  });

  it("Debe omitir valores indicados (omitParamsByValues)", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          omitParamsByValues: ["all", "default"],
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { order: "all", page: 3 } });
    });

    const { page, order } = result.current.getParams({ convert: true });
    // 'all' se omite
    expect(page).toBe(3);
    expect(order).toBe(undefined); // 'all' se omite por lo que no debe existir
  });

  it("clearParams debe reiniciar a valores por defecto (manteniendo obligatorios)", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 8, order: "asc" } });
    });

    const { page, order } = result.current.getParams({ convert: true });
    expect(page).toBe(8);
    expect(order).toBe("asc");

    act(() => {
      result.current.clearParams();
    });

    const newParams = result.current.getParams({ convert: true });
    expect(newParams.page).toBe(8); // mandatory de paramsUsers
    expect(newParams.order).toBe(undefined); // optional ya no debe existir en la URL
  });
  it("Debe preservar parámetros existentes no actualizados al actualizar otros parámetros", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { search: "newSearch" } });
    });

    const { page, page_size, search, order } = result.current.getParams({
      convert: true,
    });
    expect(page).toBe(1); // default mandatory
    expect(page_size).toBe(10); // default mandatory
    expect(search).toBe("newSearch"); // updated
    expect(order).toBe(undefined); // unchanged optional
  });
  it("Debe mantener los parámetros forzados después de múltiples actualizaciones", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 10 },
          omitParamsByValues: ["all", "default"],
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 2, search: "test" } });
    });

    const { page, page_size, search } = result.current.getParams({
      convert: true,
    });
    expect(page).toBe(2);
    expect(page_size).toBe(10); // forced
    expect(search).toBe("test");

    act(() => {
      result.current.updateParams({
        newParams: { page: 3, search: "anotherTest" },
      });
    });

    const updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.page).toBe(3);
    expect(updatedParams.page_size).toBe(10); // still forced
    expect(updatedParams.search).toBe("anotherTest");
  });

  // Sección de pruebas para la serialización de arrays

  it("Debe agregar y eliminar un tag individual en modo repeat", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: "repeat",
        }),
      { wrapper: Wrapper }
    );

    // Se espera que los tags iniciales sean únicos: ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(["uno", "dos", "tres"]);

    // Agrega un tag 'nuevo'
    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: "nuevo" } });
    });
    let updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual(["uno", "dos", "tres", "nuevo"]);

    // Al volver a enviar el mismo tag 'nuevo', éste se elimina (toggle)
    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: "nuevo" } });
    });
    updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Debe permitir al desarrollador combinar arrays de tags, controlando qué se mantiene", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: "repeat",
        }),
      { wrapper: Wrapper }
    );

    // Verifica que los tags iniciales sean: ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(["uno", "dos", "tres"]);

    // El desarrollador decide combinar manualmente:
    // Toma los tags actuales y agrega los nuevos, filtrando duplicados.
    const newTags = ["react", "dos", "nuevo"];
    const combinedTags = [
      ...initialParams.tags,
      // @ts-ignore
      ...newTags.filter((tag) => !initialParams.tags.includes(tag)),
    ];

    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: combinedTags } });
    });

    const updatedParams = result.current.getParams({ convert: true });
    // Se espera la unión manual de ambos arrays sin duplicados
    expect(updatedParams.tags).toEqual([
      "uno",
      "dos",
      "tres",
      "react",
      "nuevo",
    ]);
  });
});

// TEST DE COMBINACIÓN DE ARRAYS ----------------------

describe("Test de serialización de arrays en getParams", () => {
  it("Debe convertir tags a array en modo CSV al usar convert:true", () => {
    const initialEntries = ["/?tags=uno,dos,tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "csv",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: true });
    expect(tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Debe devolver los tags como string en modo CSV al usar convert:false", () => {
    const initialEntries = ["/?tags=uno,dos,tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "csv",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: false });
    // Se espera que para CSV se retorne la cadena tal como viene en la URL
    expect(tags).toEqual("tags=uno,dos,tres");
  });

  it("Debe convertir tags a array en modo REPEAT al usar convert:true", () => {
    // En repeat cada tag se envía como un parámetro separado
    const initialEntries = ["/?tags=uno&tags=dos&tags=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "repeat",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: true });
    expect(tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Debe devolver los tags en modo REPEAT en formato raw al usar convert:false", () => {
    // En repeat, aunque el hook procesa internamente los valores, al no convertir se esperan los mismos valores
    // (Nota: dependiendo de la implementación, se podría retornar el primer valor; en este test asumimos que getParams usa getAll internamente si se requiere mantener arrays)
    const initialEntries = ["/?tags=uno&tags=dos&tags=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "repeat",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: false });
    // Suponiendo que en modo repeat se retorna el valor concatenado (tal como lo enviaría al backend)
    expect(tags).toEqual("tags=uno&tags=dos&tags=tres");
  });

  it("Debe convertir tags a array en modo BRACKETS al usar convert:true", () => {
    // En brackets se espera que la URL contenga tags[]=uno&tags[]=dos&tags[]=tres
    const initialEntries = ["/?tags[]=uno&tags[]=dos&tags[]=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "brackets",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: true });
    expect(tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Debe devolver los tags en modo BRACKETS en formato raw al usar convert:false", () => {
    const initialEntries = ["/?tags[]=uno&tags[]=dos&tags[]=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "brackets",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: false });
    // Se espera que para brackets se conserve la notación con corchetes en la llave,
    // probablemente como resultado procesado del getParamsObj.
    // Ajusta según la implementación; aquí se espera que se devuelva una cadena concatenada.
    expect(tags).toEqual("tags[]=uno&tags[]=dos&tags[]=tres");
  });
});
describe("Test de combinación de arrays en updateParams", () => {
  it("Permite combinar los tags actuales con nuevos de forma manual y sin duplicados", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: "repeat",
        }),
      { wrapper: Wrapper }
    );

    // Suponemos que los tags iniciales son ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(["uno", "dos", "tres"]);

    // El desarrollador decide combinar manteniendo los actuales y agregando nuevos sin duplicados
    const newTags = ["react", "dos", "nuevo"];
    const combinedTags = [
      ...initialParams.tags,
      // @ts-ignore
      ...newTags.filter((tag) => !initialParams.tags.includes(tag)),
    ];

    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: combinedTags } });
    });

    const updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual([
      "uno",
      "dos",
      "tres",
      "react",
      "nuevo",
    ]);
  });
});
