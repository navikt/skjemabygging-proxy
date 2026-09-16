# Agent guidance

Respect `mise.toml`. This repository uses Node 24 and Yarn 1.22.

Run `mise install` before installing dependencies or running commands. Always
use Yarn, never npm:

```sh
mise exec node@24 yarn@1.22 -- yarn install --frozen-lockfile
mise exec node@24 yarn@1.22 -- yarn test --runInBand
```

Jest loads environment variables from `test/test.env`. The proxy routes are
defined in `src/proxyApi.js`, and deployment environment variables live in
`.nais/dev-vars.yaml` and `.nais/prod-vars.yaml`.
