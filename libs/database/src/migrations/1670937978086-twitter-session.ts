import { MigrationInterface, QueryRunner } from 'typeorm';

export class twitterSession1670937978086 implements MigrationInterface {
  name = 'twitterSession1670937978086';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "twitter_session" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "state" character varying NOT NULL, "codeVerifier" character varying NOT NULL, CONSTRAINT "PK_6b7499de858433e757327562048" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_1a232c7f14deb96da138fc8409" ON "twitter_session" ("state") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_1a232c7f14deb96da138fc8409"`);
    await queryRunner.query(`DROP TABLE "twitter_session"`);
  }
}
