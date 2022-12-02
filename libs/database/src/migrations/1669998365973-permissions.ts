import { MigrationInterface, QueryRunner } from 'typeorm';

export class permissions1669998365973 implements MigrationInterface {
  name = 'permissions1669998365973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "code" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_30e166e8c6359970755c5727a2" ON "permission" ("code") `);
    await queryRunner.query(`CREATE TABLE "permission_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "token" character varying(64) NOT NULL, "validUntil" TIMESTAMP, CONSTRAINT "UQ_df0016bca9c1ce7dd7c174aef16" UNIQUE ("token"), CONSTRAINT "PK_7082c806698e964cf775db85d80" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_a4ca2d9ba21b96036a0b030634" ON "permission_token" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_df0016bca9c1ce7dd7c174aef1" ON "permission_token" ("token") `);
    await queryRunner.query(`CREATE TABLE "user_permission_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "permissionTokenId" integer NOT NULL, CONSTRAINT "PK_74ef4d419c53e9747a4097cd00b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_dc2e142ec4763dc8d127bd6a74" ON "user_permission_token" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_daf41d1a1df01813969608ccb0" ON "user_permission_token" ("permissionTokenId") `);
    await queryRunner.query(`ALTER TABLE "permission_token" ADD CONSTRAINT "FK_a4ca2d9ba21b96036a0b0306347" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" ADD CONSTRAINT "FK_dc2e142ec4763dc8d127bd6a74a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" ADD CONSTRAINT "FK_daf41d1a1df01813969608ccb08" FOREIGN KEY ("permissionTokenId") REFERENCES "permission_token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_permission_token" DROP CONSTRAINT "FK_daf41d1a1df01813969608ccb08"`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" DROP CONSTRAINT "FK_dc2e142ec4763dc8d127bd6a74a"`);
    await queryRunner.query(`ALTER TABLE "permission_token" DROP CONSTRAINT "FK_a4ca2d9ba21b96036a0b0306347"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_daf41d1a1df01813969608ccb0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dc2e142ec4763dc8d127bd6a74"`);
    await queryRunner.query(`DROP TABLE "user_permission_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_df0016bca9c1ce7dd7c174aef1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4ca2d9ba21b96036a0b030634"`);
    await queryRunner.query(`DROP TABLE "permission_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_30e166e8c6359970755c5727a2"`);
    await queryRunner.query(`DROP TABLE "permission"`);
  }
}
