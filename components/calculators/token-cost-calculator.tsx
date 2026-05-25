import type { ModelWithPrice } from "@/lib/data-access/models";
import { UnifiedCostRateCalculator } from "@/components/calculators/unified-cost-rate-calculator";

type Props = {
  models: ModelWithPrice[];
  exchangeRate: number;
  compact?: boolean;
};

export function TokenCostCalculator({ models, exchangeRate }: Props) {
  return (
    <UnifiedCostRateCalculator models={models} exchangeRate={exchangeRate} />
  );
}
