# Provider Logo Sources

Last updated: 2026-05-25

ModelRate stores provider logos locally under `public/logos/providers/` so public pages do not depend on remote favicon or logo loading at runtime.

| Provider            | Local file                           | Source                                                 |
| ------------------- | ------------------------------------ | ------------------------------------------------------ |
| OpenAI              | `/logos/providers/openai.png`        | Google favicon service snapshot for `openai.com`       |
| Anthropic           | `/logos/providers/anthropic.png`     | Google favicon service snapshot for `anthropic.com`    |
| Google Gemini       | `/logos/providers/google-gemini.svg` | Simple Icons `googlegemini`, package version `16.21.0` |
| DeepSeek            | `/logos/providers/deepseek.svg`      | Simple Icons `deepseek`, package version `16.21.0`     |
| Moonshot / Kimi     | `/logos/providers/moonshot-kimi.png` | Google favicon service snapshot for `kimi.com`         |
| Zhipu AI            | `/logos/providers/zhipu.png`         | Google favicon service snapshot for `bigmodel.cn`      |
| Volcengine / Doubao | `/logos/providers/bytedance.svg`     | Simple Icons `bytedance`, package version `16.21.0`    |
| xAI                 | `/logos/providers/xai.png`           | Google favicon service snapshot for `x.ai`             |
| OpenRouter          | `/logos/providers/openrouter.svg`    | Simple Icons `openrouter`, package version `16.21.0`   |

Notes:

- `OpenAI Codex` and `Codex` should map to the OpenAI logo.
- Doubao / Seed should map to the ByteDance logo unless a dedicated, licensed Doubao mark is added later.
- Unknown providers should use the neutral text fallback from `ProviderAvatar`, not a colored brand-like block.
