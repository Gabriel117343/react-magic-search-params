module.exports = {
  rollup(config, options) {
    // 1) Si es el build CJS de desarrollo, no tocamos nada
    if (!options.minify && config.output.format === 'cjs') {
      return config;
    }

    // 2) Asegurarnos de que siempre trabajamos con un array
    const outputs = Array.isArray(config.output)
      ? config.output
      : [config.output];

    // 3) Filtrar solo:
    //    • ESM (formato 'esm')
    //    • CJS pero solo en producción (options.minify)
    const filtered = outputs.filter(
      (o) => o.format === 'esm' || (o.format === 'cjs' && options.minify)
    );

    // 4) Desactivar sourcemaps en esos outputs
    const mapped = filtered.map((o) => ({
      ...o,
      sourcemap: false,
    }));

    // 5) Volver a asignar config.output como objeto (si solo hay uno) o array
    config.output = mapped.length === 1 ? mapped[0] : mapped;
    return config;
  },
};
