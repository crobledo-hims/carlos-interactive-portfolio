# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Asset credits

Third-party 3D assets in `public/models/`. Attribution is a licence condition,
not a courtesy — keep these entries with the files.

| Asset | File | Author | Licence | Source |
| --- | --- | --- | --- | --- |
| Ergonomic mesh office chair (the Aeron in the scene) | `public/models/aeron-chair.glb` | [guillaumecrz](https://sketchfab.com/guillaumecrz) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Sketchfab](https://sketchfab.com/3d-models/ergonomic-mesh-office-chair-cd5ef0305d8545dd8cd934ebb99cf7d5) |

The chair is modified from the original: cameras and lights stripped, the star
base narrowed from a 1.0 m to a 0.71 m span, the white mechanism parts repainted
graphite, and the mesh decimated from 181k to 44.5k triangles for the web.

Everything else in the scene — desk, monitors, keyboard, mouse, MacBook, plant,
trinkets — is modelled procedurally or built in Blender for this project.
