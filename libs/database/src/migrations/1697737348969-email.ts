import { MigrationInterface, QueryRunner } from "typeorm";

export class Email1697737348969 implements MigrationInterface {
    name = 'Email1697737348969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_email" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying, "lastName" character varying, "verified" boolean NOT NULL DEFAULT false, "hash" character varying, CONSTRAINT "UQ_f2bff75d7c18f08db06f81934b6" UNIQUE ("email"), CONSTRAINT "REL_9ada349d19d368d20fbf613eef" UNIQUE ("userId"), CONSTRAINT "PK_95c07c16136adcfdcb8221c1fc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9ada349d19d368d20fbf613eef" ON "user_email" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f2bff75d7c18f08db06f81934b" ON "user_email" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_4fb0405baa294a1726c4622819" ON "user_email" ("password") `);
        await queryRunner.query(`CREATE INDEX "IDX_ccfb95f77d4a0f791c0a289939" ON "user_email" ("hash") `);
        await queryRunner.query(`ALTER TABLE "user_email" ADD CONSTRAINT "FK_9ada349d19d368d20fbf613eef9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_email" DROP CONSTRAINT "FK_9ada349d19d368d20fbf613eef9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ccfb95f77d4a0f791c0a289939"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4fb0405baa294a1726c4622819"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2bff75d7c18f08db06f81934b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ada349d19d368d20fbf613eef"`);
        await queryRunner.query(`DROP TABLE "user_email"`);
    }

}
