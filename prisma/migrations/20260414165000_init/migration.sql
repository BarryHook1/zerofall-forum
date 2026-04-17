-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('visitor', 'entry_pending', 'entry_confirmed', 'revoked');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('none', 'awaiting_activation', 'active', 'dormant', 'decayed', 'revoked');

-- CreateEnum
CREATE TYPE "RankCode" AS ENUM ('none', 'verified', 'elite', 'vanguard', 'genesis_founder');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('member', 'founder', 'admin', 'operations', 'billing', 'moderator', 'support');

-- CreateEnum
CREATE TYPE "BadgeStatus" AS ENUM ('disabled', 'enabled');

-- CreateEnum
CREATE TYPE "DecayState" AS ENUM ('none', 'dormant', 'decayed');

-- CreateEnum
CREATE TYPE "PurchaseProvider" AS ENUM ('stripe');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'canceled');

-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('core_membership');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'past_due', 'expired', 'canceled', 'revoked');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "discord_id" TEXT,
    "forum_uid" INTEGER,
    "account_role" "AccountRole" NOT NULL DEFAULT 'member',
    "entry_status" "EntryStatus" NOT NULL DEFAULT 'visitor',
    "membership_status" "MembershipStatus" NOT NULL DEFAULT 'none',
    "rank" "RankCode" NOT NULL DEFAULT 'none',
    "badge_status" "BadgeStatus" NOT NULL DEFAULT 'disabled',
    "activation_deadline" TIMESTAMP(3),
    "subscription_expires_at" TIMESTAMP(3),
    "decay_state" "DecayState" NOT NULL DEFAULT 'none',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "provider" "PurchaseProvider" NOT NULL,
    "provider_payment_id" TEXT,
    "provider_checkout_session_id" TEXT,
    "email" TEXT NOT NULL,
    "requested_username" TEXT NOT NULL,
    "requested_password_hash" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_windows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_code" "SubscriptionPlanCode" NOT NULL,
    "provider" "PurchaseProvider" NOT NULL,
    "provider_subscription_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rank_code" "RankCode" NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_code" "RankCode" NOT NULL,
    "status" "BadgeStatus" NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_sync_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_name" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "event_name" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "actor_id" UUID,
    "event_type" TEXT NOT NULL,
    "meta_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uid_sequence" (
    "name" TEXT NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "uid_sequence_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_forum_uid_key" ON "users"("forum_uid");

-- CreateIndex
CREATE UNIQUE INDEX "entry_purchases_provider_payment_id_key" ON "entry_purchases"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "entry_purchases_provider_checkout_session_id_key" ON "entry_purchases"("provider_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "activation_windows_user_id_key" ON "activation_windows"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_subscription_id_key" ON "subscriptions"("provider_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_delivery_id_key" ON "webhook_deliveries"("delivery_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_next_attempt_at_idx" ON "webhook_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "audit_logs_event_type_created_at_idx" ON "audit_logs"("event_type", "created_at");

-- AddForeignKey
ALTER TABLE "entry_purchases" ADD CONSTRAINT "entry_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_windows" ADD CONSTRAINT "activation_windows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_sync_logs" ADD CONSTRAINT "discord_sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
