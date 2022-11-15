import { MigrationInterface, QueryRunner } from 'typeorm';

export class indexes1668510330563 implements MigrationInterface {
  name = 'indexes1668510330563';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "key" DROP COLUMN "publicKey"`);
    await queryRunner.query(
      `ALTER TABLE "key" ADD "publicKey" character varying(66)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "lastInteraction" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "access_token" DROP CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "access_token" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" DROP CONSTRAINT "FK_fa585755ef3aac394647918548f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" ALTER COLUMN "keyId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" DROP CONSTRAINT "FK_0ef335d54b22816cd28285c9fdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63802aab34ca40e531797ae4bb" ON "key_participant" ("keyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ceda8e1e7312aef4c5d6e2b040" ON "key_participant" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69572a81a9c722651ca1b44651" ON "key" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ee4cc736db07729e084ccdf95" ON "key" ("publicKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9949557d0e1b2c19e5344c171e" ON "access_token" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa585755ef3aac394647918548" ON "sign" ("keyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ef335d54b22816cd28285c9fd" ON "user_telegram" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "access_token" ADD CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" ADD CONSTRAINT "FK_fa585755ef3aac394647918548f" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ADD CONSTRAINT "FK_0ef335d54b22816cd28285c9fdd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_telegram" DROP CONSTRAINT "FK_0ef335d54b22816cd28285c9fdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" DROP CONSTRAINT "FK_fa585755ef3aac394647918548f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "access_token" DROP CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ef335d54b22816cd28285c9fd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa585755ef3aac394647918548"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9949557d0e1b2c19e5344c171e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ee4cc736db07729e084ccdf95"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_69572a81a9c722651ca1b44651"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceda8e1e7312aef4c5d6e2b040"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63802aab34ca40e531797ae4bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ADD CONSTRAINT "FK_0ef335d54b22816cd28285c9fdd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" ALTER COLUMN "keyId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" ADD CONSTRAINT "FK_fa585755ef3aac394647918548f" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "access_token" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "access_token" ADD CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "lastInteraction" SET DEFAULT '2022-11-14 18:55:47.844'`,
    );
    await queryRunner.query(`ALTER TABLE "key" DROP COLUMN "publicKey"`);
    await queryRunner.query(
      `ALTER TABLE "key" ADD "publicKey" character varying`,
    );
  }
}
