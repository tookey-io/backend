import { MigrationInterface, QueryRunner } from "typeorm";

export class UserGoogle1697435937767 implements MigrationInterface {
    name = 'UserGoogle1697435937767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_google" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "googleId" character varying NOT NULL, "email" character varying, "firstName" character varying, "lastName" character varying, "accessToken" character varying, CONSTRAINT "UQ_6bb9caab726569c586c4048b4ef" UNIQUE ("googleId"), CONSTRAINT "REL_9e61556f04934336e8335e6b36" UNIQUE ("userId"), CONSTRAINT "PK_7adac5c0b28492eb292d4a93871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e61556f04934336e8335e6b36" ON "user_google" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6bb9caab726569c586c4048b4e" ON "user_google" ("googleId") `);
        await queryRunner.query(`ALTER TABLE "user_google" ADD CONSTRAINT "FK_9e61556f04934336e8335e6b368" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_google" DROP CONSTRAINT "FK_9e61556f04934336e8335e6b368"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bb9caab726569c586c4048b4e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e61556f04934336e8335e6b36"`);
        await queryRunner.query(`DROP TABLE "user_google"`);
    }

}
