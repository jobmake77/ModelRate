CREATE TYPE "RelayChannelType" AS ENUM ('official_direct', 'third_party_relay');

ALTER TABLE "relay_stations"
ADD COLUMN "channel_type" "RelayChannelType" NOT NULL DEFAULT 'third_party_relay';

CREATE INDEX "relay_stations_channel_type_idx" ON "relay_stations"("channel_type");
