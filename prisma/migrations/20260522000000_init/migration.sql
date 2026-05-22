-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('active', 'deprecated', 'hidden');

-- CreateEnum
CREATE TYPE "PriceSourceType" AS ENUM ('official', 'openrouter', 'litellm', 'portkey', 'manual', 'relay');

-- CreateEnum
CREATE TYPE "RelayStatus" AS ENUM ('draft', 'published', 'hidden', 'archived');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('unknown', 'low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "GuideStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('relay_submission', 'price_correction', 'model_correction', 'general_feedback');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website_url" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "status" "ProviderStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "canonical_model_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "family" TEXT,
    "description" TEXT,
    "context_window" INTEGER,
    "max_output_tokens" INTEGER,
    "supports_text" BOOLEAN NOT NULL DEFAULT true,
    "supports_vision" BOOLEAN NOT NULL DEFAULT false,
    "supports_audio" BOOLEAN NOT NULL DEFAULT false,
    "supports_image_generation" BOOLEAN NOT NULL DEFAULT false,
    "supports_embedding" BOOLEAN NOT NULL DEFAULT false,
    "supports_function_calling" BOOLEAN NOT NULL DEFAULT false,
    "supports_reasoning" BOOLEAN NOT NULL DEFAULT false,
    "status" "ModelStatus" NOT NULL DEFAULT 'active',
    "source_url" TEXT,
    "last_checked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_prices" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "source_type" "PriceSourceType" NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "input_price_per_1m" DECIMAL(18,8) NOT NULL,
    "output_price_per_1m" DECIMAL(18,8) NOT NULL,
    "cached_input_price_per_1m" DECIMAL(18,8),
    "cached_output_price_per_1m" DECIMAL(18,8),
    "reasoning_price_per_1m" DECIMAL(18,8),
    "image_price_per_unit" DECIMAL(18,8),
    "audio_input_price_per_1m" DECIMAL(18,8),
    "audio_output_price_per_1m" DECIMAL(18,8),
    "effective_from" DATE,
    "last_checked_at" TIMESTAMPTZ(6) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "model_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_stations" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "billing_modes" TEXT[],
    "payment_methods" TEXT[],
    "minimum_top_up_amount" DECIMAL(18,4),
    "minimum_top_up_currency" TEXT,
    "support_channels" TEXT[],
    "has_public_pricing" BOOLEAN NOT NULL DEFAULT false,
    "has_trial_credit" BOOLEAN NOT NULL DEFAULT false,
    "has_referral_program" BOOLEAN NOT NULL DEFAULT false,
    "referral_url" TEXT,
    "coupon_code" TEXT,
    "is_sponsored" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "RelayStatus" NOT NULL DEFAULT 'draft',
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'unknown',
    "last_checked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "relay_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_model_prices" (
    "id" UUID NOT NULL,
    "relay_station_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "route_name" TEXT,
    "billing_type" TEXT NOT NULL DEFAULT 'token',
    "model_multiplier" DECIMAL(12,6),
    "completion_multiplier" DECIMAL(12,6),
    "group_multiplier" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "route_multiplier" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "input_price_per_1m" DECIMAL(18,8),
    "output_price_per_1m" DECIMAL(18,8),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "source_url" TEXT,
    "last_checked_at" TIMESTAMPTZ(6),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "relay_model_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_tags" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "risk_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_station_risk_tags" (
    "relay_station_id" UUID NOT NULL,
    "risk_tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relay_station_risk_tags_pkey" PRIMARY KEY ("relay_station_id","risk_tag_id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content_md" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "GuideStatus" NOT NULL DEFAULT 'draft',
    "seo_title" TEXT NOT NULL,
    "seo_description" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer_md" TEXT NOT NULL,
    "category" TEXT,
    "target_type" TEXT,
    "target_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "base_currency" TEXT NOT NULL,
    "quote_currency" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source_name" TEXT,
    "source_url" TEXT,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "submitter_name" TEXT,
    "submitter_email" TEXT,
    "payload" JSONB NOT NULL,
    "review_notes" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_clicks" (
    "id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "url" TEXT NOT NULL,
    "source_path" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_placements" (
    "id" UUID NOT NULL,
    "slot_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "page_type" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ad_code" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "auth_user_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'editor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "models_slug_key" ON "models"("slug");

-- CreateIndex
CREATE INDEX "models_provider_id_idx" ON "models"("provider_id");

-- CreateIndex
CREATE INDEX "models_status_idx" ON "models"("status");

-- CreateIndex
CREATE UNIQUE INDEX "models_provider_id_canonical_model_id_key" ON "models"("provider_id", "canonical_model_id");

-- CreateIndex
CREATE INDEX "model_prices_model_id_idx" ON "model_prices"("model_id");

-- CreateIndex
CREATE INDEX "model_prices_source_type_idx" ON "model_prices"("source_type");

-- CreateIndex
CREATE INDEX "model_prices_is_current_idx" ON "model_prices"("is_current");

-- CreateIndex
CREATE UNIQUE INDEX "relay_stations_slug_key" ON "relay_stations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "relay_stations_domain_key" ON "relay_stations"("domain");

-- CreateIndex
CREATE INDEX "relay_stations_status_idx" ON "relay_stations"("status");

-- CreateIndex
CREATE INDEX "relay_stations_is_sponsored_idx" ON "relay_stations"("is_sponsored");

-- CreateIndex
CREATE INDEX "relay_model_prices_relay_station_id_idx" ON "relay_model_prices"("relay_station_id");

-- CreateIndex
CREATE INDEX "relay_model_prices_model_id_idx" ON "relay_model_prices"("model_id");

-- CreateIndex
CREATE INDEX "relay_model_prices_is_current_idx" ON "relay_model_prices"("is_current");

-- CreateIndex
CREATE UNIQUE INDEX "risk_tags_slug_key" ON "risk_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "guides_slug_key" ON "guides"("slug");

-- CreateIndex
CREATE INDEX "guides_status_idx" ON "guides"("status");

-- CreateIndex
CREATE INDEX "exchange_rates_base_currency_quote_currency_idx" ON "exchange_rates"("base_currency", "quote_currency");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "outbound_clicks_target_type_target_id_idx" ON "outbound_clicks"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_placements_slot_key_key" ON "ad_placements"("slot_key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_auth_user_id_key" ON "admin_users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_prices" ADD CONSTRAINT "model_prices_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_model_prices" ADD CONSTRAINT "relay_model_prices_relay_station_id_fkey" FOREIGN KEY ("relay_station_id") REFERENCES "relay_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_model_prices" ADD CONSTRAINT "relay_model_prices_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_station_risk_tags" ADD CONSTRAINT "relay_station_risk_tags_relay_station_id_fkey" FOREIGN KEY ("relay_station_id") REFERENCES "relay_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_station_risk_tags" ADD CONSTRAINT "relay_station_risk_tags_risk_tag_id_fkey" FOREIGN KEY ("risk_tag_id") REFERENCES "risk_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
