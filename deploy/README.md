# Running Castrapid

One Docker stack with its own containers and data. It does not touch the development stack in `docker-compose.dev.yaml`.

## Start or update

1. Copy `.env.example` to `.env` and fill it in (first time only).
2. Run `docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build` from the repository root.

The app is then at `http://localhost:8088`. It listens only on this machine until something public is connected, such as a tunnel or a server proxy.

## Move to another server

1. On the old machine, save the database: `docker exec castrapid-postgres pg_dump -U castrapid castrapid > castrapid.sql`
2. Save the uploads: `docker run --rm -v castrapid_castrapid-uploads:/u -v "$PWD":/b alpine tar czf /b/uploads.tgz -C /u .`
3. On the new machine, clone the repository and copy over `deploy/.env`, `castrapid.sql` and `uploads.tgz`.
4. Start only the database: `docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d castrapid-postgres`
5. Restore it: `docker exec -i castrapid-postgres psql -U castrapid castrapid < castrapid.sql`
6. Restore the uploads: `docker run --rm -v castrapid_castrapid-uploads:/u -v "$PWD":/b alpine tar xzf /b/uploads.tgz -C /u`
7. Start everything with the command above, then point the domain at the new machine.

## While payments are off

`ALLOW_UNBILLED_LOCAL_DEV=true` lets the app start without Stripe keys, and every account then counts as fully paid. So keep `DISABLE_REGISTRATION=true`: only the first account can sign up. Remove the flag when Stripe keys are added.
