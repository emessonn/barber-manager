-- AlterEnum: Add RECEPCAO to UserRole
ALTER TYPE "UserRole" ADD VALUE 'RECEPCAO';

-- AlterTable: Make email optional and add login/password_hash
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "login" TEXT;
ALTER TABLE "User" ADD COLUMN "password_hash" TEXT;

-- CreateIndex: Unique login per barbershop
CREATE UNIQUE INDEX "User_login_barbershop_id_key" ON "User"("login", "barbershop_id");
