import { MigrationInterface, QueryRunner } from 'typeorm';

export class discord1672156969552 implements MigrationInterface {
  name = 'discord1672156969552';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_discord" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "discordId" character varying NOT NULL, "discordTag" character varying, "email" character varying, "avatar" character varying, "locale" character varying, "verified" boolean, "accessToken" character varying, "refreshToken" character varying, CONSTRAINT "UQ_e9d08b057c41f5d628d6ef884a7" UNIQUE ("discordId"), CONSTRAINT "REL_6f18997ddeed68c108f8e36882" UNIQUE ("userId"), CONSTRAINT "PK_a695038a038c00cf65735299628" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_6f18997ddeed68c108f8e36882" ON "user_discord" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9d08b057c41f5d628d6ef884a" ON "user_discord" ("discordId") `);
    await queryRunner.query(`ALTER TABLE "user_discord" ADD CONSTRAINT "FK_6f18997ddeed68c108f8e368829" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_discord" DROP CONSTRAINT "FK_6f18997ddeed68c108f8e368829"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e9d08b057c41f5d628d6ef884a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6f18997ddeed68c108f8e36882"`);
    await queryRunner.query(`DROP TABLE "user_discord"`);
  }
}
