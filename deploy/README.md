# Running Castrapid

One Docker stack with its own containers and data. It does not touch the development stack in `docker-compose.dev.yaml`.

## Start or update

1. Copy `deploy/.env.example` to `deploy/.env` and fill it in (first time only).
2. Run `docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build` from the repository root.

The app is then at `http://localhost:8088`. It listens only on this machine until something public is connected, such as a tunnel or a server proxy.

## Before real use

Set `PUBLIC_URL` to the final address and remove `NOT_SECURED` before uploading anything. Uploaded media is saved with absolute links built from that address, so media uploaded under `localhost` keeps those links.

## Move to another server

Stop the old stack first. Otherwise both machines could publish the same scheduled posts. Moving every volume also keeps the scheduled jobs in Temporal.

1. On the old machine, stop everything: `docker compose -f deploy/docker-compose.yml --env-file deploy/.env stop`
2. Save each volume, running this once for every name in the list below: `docker run --rm -v castrapid_NAME:/v -v "$PWD":/b alpine tar czf /b/NAME.tgz -C /v .`
3. On the new machine, clone the whole repository, because the image builds from it, and copy over `deploy/.env` and the `.tgz` files.
4. Restore each volume: `docker volume create castrapid_NAME && docker run --rm -v castrapid_NAME:/v -v "$PWD":/b alpine tar xzf /b/NAME.tgz -C /v`
5. Start the stack with the command above, then point the domain at the new machine.

Volumes: `castrapid-postgres`, `castrapid-redis`, `castrapid-uploads`, `castrapid-caddy-data`, `castrapid-temporal-postgres`, `castrapid-temporal-elasticsearch`.

## While payments are off

`ALLOW_UNBILLED_LOCAL_DEV=true` lets the app start without Stripe keys, and every account then counts as fully paid. So keep `DISABLE_REGISTRATION=true`: only the first account can sign up. Remove the flag when Stripe keys are added.
