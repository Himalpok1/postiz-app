#!/bin/sh
# Nightly copy of the databases and uploaded media. Keeps the last 7 days on this machine.
set -eu
DIR=/var/backups/castrapid
STAMP=$(date +%F)
umask 077
mkdir -p "$DIR"

docker exec castrapid-postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$DIR/$STAMP-app.sql.gz.tmp"
docker exec castrapid-temporal-postgres sh -c 'pg_dumpall -U "$POSTGRES_USER"' | gzip > "$DIR/$STAMP-temporal.sql.gz.tmp"
docker run --rm -v castrapid_castrapid-uploads:/v:ro alpine tar czf - -C /v . > "$DIR/$STAMP-uploads.tgz.tmp"

for f in app.sql.gz temporal.sql.gz uploads.tgz; do
  mv "$DIR/$STAMP-$f.tmp" "$DIR/$STAMP-$f"
done
find "$DIR" -type f -mtime +7 -delete
