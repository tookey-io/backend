import { MigrationInterface, QueryRunner } from 'typeorm';

export class wallet1673116508305 implements MigrationInterface {
  name = 'wallet1673116508305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "wallet" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "salt" character varying NOT NULL, "iv" character varying NOT NULL, "encryptedData" character varying NOT NULL, "tag" character varying NOT NULL, "address" character varying NOT NULL, CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_35472b1fe48b6330cd34970956" ON "wallet" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_1dcc9f5fd49e3dc52c6d2393c5" ON "wallet" ("address") `);
    await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "FK_35472b1fe48b6330cd349709564" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_35472b1fe48b6330cd349709564"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1dcc9f5fd49e3dc52c6d2393c5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_35472b1fe48b6330cd34970956"`);
    await queryRunner.query(`DROP TABLE "wallet"`);
  }
}
