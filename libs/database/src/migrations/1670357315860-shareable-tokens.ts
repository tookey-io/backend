import { MigrationInterface, QueryRunner } from 'typeorm';

export class shareableTokens1670357315860 implements MigrationInterface {
  name = 'shareableTokens1670357315860';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "code" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_30e166e8c6359970755c5727a2" ON "permission" ("code") `);
    await queryRunner.query(`CREATE TABLE "shareable_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "name" character varying, "description" character varying, "token" character varying(64) NOT NULL, "validUntil" TIMESTAMP, CONSTRAINT "UQ_7e8ac60ac8ec1b08676cb1afbce" UNIQUE ("token"), CONSTRAINT "PK_e8edb50c15c517633765d759952" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_82068b0b89558a3c99cfb07adc" ON "shareable_token" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7e8ac60ac8ec1b08676cb1afbc" ON "shareable_token" ("token") `);
    await queryRunner.query(`CREATE TABLE "shareable_token_keys_key" ("shareableTokenId" integer NOT NULL, "keyId" integer NOT NULL, CONSTRAINT "PK_6ab07092ce11339a676134f7f32" PRIMARY KEY ("shareableTokenId", "keyId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_75306383a0662b5d49a6bb274d" ON "shareable_token_keys_key" ("shareableTokenId") `);
    await queryRunner.query(`CREATE INDEX "IDX_693c47abc102f6962dbf2ed2f6" ON "shareable_token_keys_key" ("keyId") `);
    await queryRunner.query(`CREATE TABLE "shareable_token_permissions_permission" ("shareableTokenId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_16f0b2e7bc2c891db630e8f8797" PRIMARY KEY ("shareableTokenId", "permissionId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_98cf8c174f09b8b5af919f77ad" ON "shareable_token_permissions_permission" ("shareableTokenId") `);
    await queryRunner.query(`CREATE INDEX "IDX_774f1649e0c5a60d581f0682ec" ON "shareable_token_permissions_permission" ("permissionId") `);
    await queryRunner.query(`ALTER TABLE "shareable_token" ADD CONSTRAINT "FK_82068b0b89558a3c99cfb07adc3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "shareable_token_keys_key" ADD CONSTRAINT "FK_75306383a0662b5d49a6bb274d5" FOREIGN KEY ("shareableTokenId") REFERENCES "shareable_token"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "shareable_token_keys_key" ADD CONSTRAINT "FK_693c47abc102f6962dbf2ed2f60" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "shareable_token_permissions_permission" ADD CONSTRAINT "FK_98cf8c174f09b8b5af919f77ad3" FOREIGN KEY ("shareableTokenId") REFERENCES "shareable_token"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "shareable_token_permissions_permission" ADD CONSTRAINT "FK_774f1649e0c5a60d581f0682ec8" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shareable_token_permissions_permission" DROP CONSTRAINT "FK_774f1649e0c5a60d581f0682ec8"`);
    await queryRunner.query(`ALTER TABLE "shareable_token_permissions_permission" DROP CONSTRAINT "FK_98cf8c174f09b8b5af919f77ad3"`);
    await queryRunner.query(`ALTER TABLE "shareable_token_keys_key" DROP CONSTRAINT "FK_693c47abc102f6962dbf2ed2f60"`);
    await queryRunner.query(`ALTER TABLE "shareable_token_keys_key" DROP CONSTRAINT "FK_75306383a0662b5d49a6bb274d5"`);
    await queryRunner.query(`ALTER TABLE "shareable_token" DROP CONSTRAINT "FK_82068b0b89558a3c99cfb07adc3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_774f1649e0c5a60d581f0682ec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_98cf8c174f09b8b5af919f77ad"`);
    await queryRunner.query(`DROP TABLE "shareable_token_permissions_permission"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_693c47abc102f6962dbf2ed2f6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_75306383a0662b5d49a6bb274d"`);
    await queryRunner.query(`DROP TABLE "shareable_token_keys_key"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7e8ac60ac8ec1b08676cb1afbc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_82068b0b89558a3c99cfb07adc"`);
    await queryRunner.query(`DROP TABLE "shareable_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_30e166e8c6359970755c5727a2"`);
    await queryRunner.query(`DROP TABLE "permission"`);
  }
}
