# TOMS Frontend

This app is built with [Vite](https://vite.dev/) and React.

## Available Scripts

In the project directory, you can run:

### `npm start` (alias: `npm run dev`)

Runs the app in development mode on [http://localhost:3000](http://localhost:3000), with hot module replacement.

### `npm test`

Runs the test suite once via [Vitest](https://vitest.dev/). Use `npx vitest` for interactive watch mode.

### `npm run build`

Builds the app for production to the `dist` folder, minified with hashed filenames.

### `npm run preview`

Serves the built `dist` folder locally, to sanity-check a production build.

## Environment Variables

Vite only exposes environment variables prefixed with `VITE_` to client code, read via `import.meta.env.VITE_*` (see `.env.development`). See the [Vite env docs](https://vite.dev/guide/env-and-mode) for more.
