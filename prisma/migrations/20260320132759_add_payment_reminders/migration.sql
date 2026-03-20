-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'PAGO', 'PRESENCIAL', 'REEMBOLSADO');

-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN     "working_hours" JSONB;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "payment_external_id" TEXT,
ADD COLUMN     "payment_id" TEXT,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "reminder_24h_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder_2h_sent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ClientOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "barbershop_id" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSession" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "barbershop_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BarberServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BarberServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ClientOtp_phone_barbershop_id_idx" ON "ClientOtp"("phone", "barbershop_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSession_session_token_key" ON "ClientSession"("session_token");

-- CreateIndex
CREATE INDEX "ClientSession_session_token_idx" ON "ClientSession"("session_token");

-- CreateIndex
CREATE INDEX "_BarberServices_B_index" ON "_BarberServices"("B");

-- AddForeignKey
ALTER TABLE "ClientSession" ADD CONSTRAINT "ClientSession_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BarberServices" ADD CONSTRAINT "_BarberServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BarberServices" ADD CONSTRAINT "_BarberServices_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
