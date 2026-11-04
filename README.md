# Castrapid

Castrapid is a social media scheduler. Add posts to a calendar and they go out at the right time across 28+ channels, with analytics, a media library and team management.

Hosted version: https://castrapid.com

## Develop

This is a pnpm monorepo:

- `apps/backend`: the API (NestJS)
- `apps/orchestrator`: background jobs (Temporal)
- `apps/frontend`: the web app
- `libraries`: code shared between them

```bash
pnpm install
pnpm run dev:docker
pnpm run dev
```

Copy `.env.example` to `.env` first and fill in the values. See `CONTRIBUTING.md` for the rules this code follows.

## License

Castrapid is a modified version of Postiz, created by Gitroom Limited and released under the GNU Affero General Public License v3.0. These modifications are released under the same license. See `LICENSE` for the full text. The complete source for what runs at castrapid.com is in this repository.
