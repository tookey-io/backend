import { MigrationInterface, QueryRunner } from "typeorm";

export class aofgProfiles1673812120168 implements MigrationInterface {
    name = 'aofgProfiles1673812120168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "aofg_profile" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "name" character varying(20), "multisigAddress" character(40), "title" character varying, CONSTRAINT "UQ_229247900d51320ac4fa97dd354" UNIQUE ("userId"), CONSTRAINT "REL_229247900d51320ac4fa97dd35" UNIQUE ("userId"), CONSTRAINT "PK_a7e8a587348f4eea70de063c027" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_229247900d51320ac4fa97dd35" ON "aofg_profile" ("userId") `);
        await queryRunner.query(`ALTER TABLE "aofg_profile" ADD CONSTRAINT "FK_229247900d51320ac4fa97dd354" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "aofg_profile" DROP CONSTRAINT "FK_229247900d51320ac4fa97dd354"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_229247900d51320ac4fa97dd35"`);
        await queryRunner.query(`DROP TABLE "aofg_profile"`);
    }

}
