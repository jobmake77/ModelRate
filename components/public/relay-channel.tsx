import { Badge } from "@/components/ui/badge";

export type RelayChannelType = "official_direct" | "third_party_relay";

export function ChannelBadge({
  channelType,
}: {
  channelType: RelayChannelType;
}) {
  return (
    <Badge tone={channelType === "official_direct" ? "green" : "slate"}>
      {formatChannelType(channelType)}
    </Badge>
  );
}

export function formatChannelType(channelType: RelayChannelType) {
  return channelType === "official_direct" ? "官方直连" : "二次中转";
}
