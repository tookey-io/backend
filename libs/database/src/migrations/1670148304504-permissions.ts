import { MigrationInterface, QueryRunner } from 'typeorm';

export class permissions1670148304504 implements MigrationInterface {
  name = 'permissions1670148304504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "code" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_30e166e8c6359970755c5727a2" ON "permission" ("code") `);
    await queryRunner.query(`CREATE TABLE "permission_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "token" character varying(64) NOT NULL, "validUntil" TIMESTAMP, CONSTRAINT "UQ_df0016bca9c1ce7dd7c174aef16" UNIQUE ("token"), CONSTRAINT "PK_7082c806698e964cf775db85d80" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_a4ca2d9ba21b96036a0b030634" ON "permission_token" ("userId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_df0016bca9c1ce7dd7c174aef1" ON "permission_token" ("token") `);
    await queryRunner.query(`CREATE TABLE "user_permission_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "permissionTokenId" integer NOT NULL, CONSTRAINT "PK_74ef4d419c53e9747a4097cd00b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_dc2e142ec4763dc8d127bd6a74" ON "user_permission_token" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_daf41d1a1df01813969608ccb0" ON "user_permission_token" ("permissionTokenId") `);
    await queryRunner.query(`CREATE TABLE "permission_token_keys_key" ("permissionTokenId" integer NOT NULL, "keyId" integer NOT NULL, CONSTRAINT "PK_795a150fd7f92a86c425f67e053" PRIMARY KEY ("permissionTokenId", "keyId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_fd355acab53913ad947430f723" ON "permission_token_keys_key" ("permissionTokenId") `);
    await queryRunner.query(`CREATE INDEX "IDX_b10690bbd211084d6b8d577a1a" ON "permission_token_keys_key" ("keyId") `);
    await queryRunner.query(`CREATE TABLE "permission_token_permissions_permission" ("permissionTokenId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_8dfeb80d9b9f8d3756b919a1dfa" PRIMARY KEY ("permissionTokenId", "permissionId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_4bab149845166c664a5d7b14e4" ON "permission_token_permissions_permission" ("permissionTokenId") `);
    await queryRunner.query(`CREATE INDEX "IDX_a8b9d4cbecf28a682f46c6d7b4" ON "permission_token_permissions_permission" ("permissionId") `);
    await queryRunner.query(`ALTER TABLE "permission_token" ADD CONSTRAINT "FK_a4ca2d9ba21b96036a0b0306347" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" ADD CONSTRAINT "FK_dc2e142ec4763dc8d127bd6a74a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" ADD CONSTRAINT "FK_daf41d1a1df01813969608ccb08" FOREIGN KEY ("permissionTokenId") REFERENCES "permission_token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "permission_token_keys_key" ADD CONSTRAINT "FK_fd355acab53913ad947430f723e" FOREIGN KEY ("permissionTokenId") REFERENCES "permission_token"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "permission_token_keys_key" ADD CONSTRAINT "FK_b10690bbd211084d6b8d577a1a9" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "permission_token_permissions_permission" ADD CONSTRAINT "FK_4bab149845166c664a5d7b14e4a" FOREIGN KEY ("permissionTokenId") REFERENCES "permission_token"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "permission_token_permissions_permission" ADD CONSTRAINT "FK_a8b9d4cbecf28a682f46c6d7b49" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permission_token_permissions_permission" DROP CONSTRAINT "FK_a8b9d4cbecf28a682f46c6d7b49"`);
    await queryRunner.query(`ALTER TABLE "permission_token_permissions_permission" DROP CONSTRAINT "FK_4bab149845166c664a5d7b14e4a"`);
    await queryRunner.query(`ALTER TABLE "permission_token_keys_key" DROP CONSTRAINT "FK_b10690bbd211084d6b8d577a1a9"`);
    await queryRunner.query(`ALTER TABLE "permission_token_keys_key" DROP CONSTRAINT "FK_fd355acab53913ad947430f723e"`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" DROP CONSTRAINT "FK_daf41d1a1df01813969608ccb08"`);
    await queryRunner.query(`ALTER TABLE "user_permission_token" DROP CONSTRAINT "FK_dc2e142ec4763dc8d127bd6a74a"`);
    await queryRunner.query(`ALTER TABLE "permission_token" DROP CONSTRAINT "FK_a4ca2d9ba21b96036a0b0306347"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a8b9d4cbecf28a682f46c6d7b4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4bab149845166c664a5d7b14e4"`);
    await queryRunner.query(`DROP TABLE "permission_token_permissions_permission"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b10690bbd211084d6b8d577a1a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fd355acab53913ad947430f723"`);
    await queryRunner.query(`DROP TABLE "permission_token_keys_key"`);
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
