module.exports = {
  rollup(config, options) {
    // 1) Elimina el build de desarrollo y los sourcemaps
    config.output = config.output
      .filter(
        (o) =>
          // solo esm o cjs producción
          o.format === 'esm' ||
          (o.format === 'cjs' && o.file.includes('.production.min.js'))
      )
      .map((o) => ({
        ...o,
        // desactiva sourcemap
        sourcemap: false,
      }));

    return config;
  },
};
