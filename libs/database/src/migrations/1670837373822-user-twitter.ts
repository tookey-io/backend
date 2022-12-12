import { MigrationInterface, QueryRunner } from 'typeorm';

export class userTwitter1670837373822 implements MigrationInterface {
  name = 'userTwitter1670837373822';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_twitter" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "twitterId" character varying NOT NULL, "name" character varying, "username" character varying, "accessToken" character varying, "refreshToken" character varying, "validUntil" TIMESTAMP, CONSTRAINT "UQ_a8374d89ce186a1e76c25cc9bc9" UNIQUE ("twitterId"), CONSTRAINT "REL_6854524b5356394fb1e88a20f0" UNIQUE ("userId"), CONSTRAINT "PK_55008adb3b4101af12f495c9c1d" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_6854524b5356394fb1e88a20f0" ON "user_twitter" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a8374d89ce186a1e76c25cc9bc" ON "user_twitter" ("twitterId") `);
    await queryRunner.query(`ALTER TABLE "user_twitter" ADD CONSTRAINT "FK_6854524b5356394fb1e88a20f0d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_twitter" DROP CONSTRAINT "FK_6854524b5356394fb1e88a20f0d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a8374d89ce186a1e76c25cc9bc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6854524b5356394fb1e88a20f0"`);
    await queryRunner.query(`DROP TABLE "user_twitter"`);
  }
}
