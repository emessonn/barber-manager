-- CreateTable
CREATE TABLE "BarbershopException" (
    "id" TEXT NOT NULL,
    "barbershop_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarbershopException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarbershopException_barbershop_id_idx" ON "BarbershopException"("barbershop_id");

-- CreateIndex
CREATE INDEX "BarbershopException_date_idx" ON "BarbershopException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BarbershopException_barbershop_id_date_key" ON "BarbershopException"("barbershop_id", "date");

-- AddForeignKey
ALTER TABLE "BarbershopException" ADD CONSTRAINT "BarbershopException_barbershop_id_fkey" FOREIGN KEY ("barbershop_id") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
