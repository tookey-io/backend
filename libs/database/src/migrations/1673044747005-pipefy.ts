import { MigrationInterface, QueryRunner } from 'typeorm';

export class pipefy1673044747005 implements MigrationInterface {
  name = 'pipefy1673044747005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "pipefy" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "pipeId" integer NOT NULL, "cardId" character varying NOT NULL, CONSTRAINT "UQ_3ad7579335d06f73aa8d0307a89" UNIQUE ("cardId"), CONSTRAINT "PK_ebf7f0b89106ed09d471f3a58ec" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_22ed46888aa3100d11540fd831" ON "pipefy" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_87af2b09f41aa0f080828f9ac4" ON "pipefy" ("pipeId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3ad7579335d06f73aa8d0307a8" ON "pipefy" ("cardId") `);
    await queryRunner.query(`ALTER TABLE "pipefy" ADD CONSTRAINT "FK_22ed46888aa3100d11540fd8316" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipefy" DROP CONSTRAINT "FK_22ed46888aa3100d11540fd8316"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3ad7579335d06f73aa8d0307a8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_87af2b09f41aa0f080828f9ac4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_22ed46888aa3100d11540fd831"`);
    await queryRunner.query(`DROP TABLE "pipefy"`);
  }
}
