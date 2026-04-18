-- CreateEnum
CREATE TYPE "CheatProduct" AS ENUM ('valhalla');

-- CreateEnum
CREATE TYPE "CheatLicenseStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "CheatAuthOutcome" AS ENUM ('success', 'bad_password', 'no_license', 'license_revoked', 'license_expired', 'hwid_mismatch', 'hwid_limit_reached', 'rate_limited', 'invalid_session', 'signature_invalid', 'server_error');

-- CreateTable
CREATE TABLE "cheat_licenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product" "CheatProduct" NOT NULL,
    "license_key" TEXT NOT NULL,
    "status" "CheatLicenseStatus" NOT NULL DEFAULT 'active',
    "hwid_limit" INTEGER NOT NULL DEFAULT 2,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheat_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheat_hwid_bindings" (
    "id" UUID NOT NULL,
    "license_id" UUID NOT NULL,
    "hwid" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_ip" TEXT,

    CONSTRAINT "cheat_hwid_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheat_sessions" (
    "id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "license_id" UUID NOT NULL,
    "hwid" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_heartbeat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "cheat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheat_offsets" (
    "id" UUID NOT NULL,
    "product" "CheatProduct" NOT NULL,
    "version" INTEGER NOT NULL,
    "offsets_json" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "public_key_id" TEXT NOT NULL,
    "published_by_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "cheat_offsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheat_auth_logs" (
    "id" UUID NOT NULL,
    "license_id" UUID,
    "username" TEXT,
    "hwid" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "outcome" "CheatAuthOutcome" NOT NULL,
    "event" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cheat_auth_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cheat_licenses_license_key_key" ON "cheat_licenses"("license_key");

-- CreateIndex
CREATE INDEX "cheat_licenses_status_expires_at_idx" ON "cheat_licenses"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "cheat_licenses_user_id_product_key" ON "cheat_licenses"("user_id", "product");

-- CreateIndex
CREATE INDEX "cheat_hwid_bindings_hwid_idx" ON "cheat_hwid_bindings"("hwid");

-- CreateIndex
CREATE UNIQUE INDEX "cheat_hwid_bindings_license_id_hwid_key" ON "cheat_hwid_bindings"("license_id", "hwid");

-- CreateIndex
CREATE UNIQUE INDEX "cheat_sessions_session_token_key" ON "cheat_sessions"("session_token");

-- CreateIndex
CREATE INDEX "cheat_sessions_expires_at_idx" ON "cheat_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "cheat_sessions_license_id_created_at_idx" ON "cheat_sessions"("license_id", "created_at");

-- CreateIndex
CREATE INDEX "cheat_offsets_product_active_idx" ON "cheat_offsets"("product", "active");

-- CreateIndex
CREATE UNIQUE INDEX "cheat_offsets_product_version_key" ON "cheat_offsets"("product", "version");

-- CreateIndex
CREATE INDEX "cheat_auth_logs_outcome_created_at_idx" ON "cheat_auth_logs"("outcome", "created_at");

-- CreateIndex
CREATE INDEX "cheat_auth_logs_ip_address_created_at_idx" ON "cheat_auth_logs"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "cheat_auth_logs_license_id_created_at_idx" ON "cheat_auth_logs"("license_id", "created_at");

-- AddForeignKey
ALTER TABLE "cheat_licenses" ADD CONSTRAINT "cheat_licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_hwid_bindings" ADD CONSTRAINT "cheat_hwid_bindings_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "cheat_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_sessions" ADD CONSTRAINT "cheat_sessions_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "cheat_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_offsets" ADD CONSTRAINT "cheat_offsets_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheat_auth_logs" ADD CONSTRAINT "cheat_auth_logs_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "cheat_licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
