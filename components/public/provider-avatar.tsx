import Image from "next/image";

type Props = {
  className?: string;
  label: string;
  size?: "sm" | "md" | "lg";
};

type ProviderLogo = {
  alt: string;
  path: string;
};

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const imageSizes = {
  sm: 20,
  md: 26,
  lg: 32,
};

export function ProviderAvatar({ className = "", label, size = "md" }: Props) {
  const logo = getProviderLogo(label);

  if (!logo) {
    return (
      <span
        aria-label={`${label} provider`}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-card font-display text-[10px] font-semibold text-muted-foreground shadow-sm ${sizeClasses[size]} ${className}`}
        title={label}
      >
        {providerInitials(label)}
      </span>
    );
  }

  return (
    <span
      aria-label={`${label} provider`}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm ${sizeClasses[size]} ${className}`}
      title={label}
    >
      <Image
        alt={logo.alt}
        className="h-[70%] w-[70%] object-contain"
        height={imageSizes[size]}
        src={logo.path}
        width={imageSizes[size]}
      />
    </span>
  );
}

export function getProviderLogo(label: string): ProviderLogo | null {
  const normalized = label.toLowerCase();

  if (normalized.includes("openai") || normalized.includes("codex")) {
    return {
      alt: "OpenAI logo",
      path: "/logos/providers/openai.png",
    };
  }

  if (normalized.includes("anthropic") || normalized.includes("claude")) {
    return {
      alt: "Anthropic logo",
      path: "/logos/providers/anthropic.png",
    };
  }

  if (normalized.includes("google") || normalized.includes("gemini")) {
    return {
      alt: "Google Gemini logo",
      path: "/logos/providers/google-gemini.svg",
    };
  }

  if (normalized.includes("deepseek")) {
    return {
      alt: "DeepSeek logo",
      path: "/logos/providers/deepseek.svg",
    };
  }

  if (normalized.includes("moonshot") || normalized.includes("kimi")) {
    return {
      alt: "Kimi logo",
      path: "/logos/providers/moonshot-kimi.png",
    };
  }

  if (normalized.includes("zhipu") || normalized.includes("bigmodel")) {
    return {
      alt: "Zhipu AI logo",
      path: "/logos/providers/zhipu.png",
    };
  }

  if (
    normalized.includes("volcengine") ||
    normalized.includes("doubao") ||
    normalized.includes("bytedance") ||
    normalized.includes("seed")
  ) {
    return {
      alt: "ByteDance logo",
      path: "/logos/providers/bytedance.svg",
    };
  }

  if (normalized.includes("openrouter")) {
    return {
      alt: "OpenRouter logo",
      path: "/logos/providers/openrouter.svg",
    };
  }

  if (normalized.includes("xai") || normalized.includes("grok")) {
    return {
      alt: "xAI logo",
      path: "/logos/providers/xai.png",
    };
  }

  return null;
}

function providerInitials(label: string) {
  const words = label
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  return (words[0]?.slice(0, 2) ?? "?").toUpperCase();
}
