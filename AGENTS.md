# Agent guidance

Respect `mise.toml`. This repository uses Node 24 and Yarn 1.22.

Run `mise install` before installing dependencies or running commands. Always
use Yarn, never npm:

```sh
mise exec node@24 yarn@1.22 -- yarn install --frozen-lockfile
mise exec node@24 yarn@1.22 -- yarn test
```

`node:test` loads `test/test.env` through the test script. The HTTP tests
assign loopback fixture URLs before loading modules that capture configuration.
Import `src/server.js` dynamically after setting fixture URLs; ESM static imports
run before test hooks. Use `createConfig(env)` to test config parsing without
module-cache manipulation. `src/loadEnv.js` remains a `--import` preload.
The proxy routes are defined in `src/proxyApi.js`, and deployment environment
variables live in `.nais/dev-vars.yaml` and `.nais/prod-vars.yaml`.
