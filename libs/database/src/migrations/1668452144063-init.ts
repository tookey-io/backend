import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1668452144063 implements MigrationInterface {
  name = 'init1668452144063';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "migrations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_telegram" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sign" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "telegram_session" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "access_token" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "key_participant" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "key" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."key_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sign_status_enum" CASCADE`);
    await queryRunner.query(`CREATE TABLE "migrations" ("id" SERIAL NOT NULL, "timestamp" bigint NOT NULL, "name" character varying NOT NULL)`);
    await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "fresh" boolean NOT NULL DEFAULT true, "lastInteraction" TIMESTAMP NOT NULL DEFAULT '"2022-11-14T18:55:47.844Z"', "keyLimit" integer NOT NULL DEFAULT '2', "nsleft" integer NOT NULL DEFAULT '1', "nsright" integer NOT NULL DEFAULT '2', "parentId" integer, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_8aee4a9c192e1a35e2bddb32ab" ON "user" ("fresh") `);
    await queryRunner.query(`CREATE TABLE "key_participant" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "keyId" integer NOT NULL, "userId" integer NOT NULL, "index" integer NOT NULL, CONSTRAINT "PK_3c327de75428ee6e18b09ffabff" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "public"."key_status_enum" AS ENUM('created', 'started', 'finished', 'error', 'timeout')`);
    await queryRunner.query(`CREATE TABLE "key" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "userId" integer NOT NULL, "roomId" character varying NOT NULL, "participantsCount" integer NOT NULL DEFAULT '3', "participantsThreshold" integer NOT NULL DEFAULT '2', "participantIndex" integer NOT NULL DEFAULT '1', "timeoutSeconds" integer, "publicKey" character varying, "name" character varying, "description" character varying, "tags" character varying array, "status" "public"."key_status_enum" NOT NULL DEFAULT 'created', "participantsActive" integer array NOT NULL DEFAULT '{}', CONSTRAINT "PK_5bd67cf28791e02bf07b0367ace" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_82db6e778bbb7509afefe1b5b9" ON "key" ("roomId") `);
    await queryRunner.query(`CREATE INDEX "IDX_678d1e7a4fdc304db6a8d5600f" ON "key" ("status") `);
    await queryRunner.query(`CREATE TABLE "access_token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "token" character varying(64) NOT NULL, "validUntil" TIMESTAMP NOT NULL, "userId" integer, CONSTRAINT "UQ_70ba8f6af34bc924fc9e12adb8f" UNIQUE ("token"), CONSTRAINT "PK_f20f028607b2603deabd8182d12" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_70ba8f6af34bc924fc9e12adb8" ON "access_token" ("token") `);
    await queryRunner.query(`CREATE TABLE "telegram_session" ("id" character varying NOT NULL, "session" jsonb NOT NULL DEFAULT '{"__scenes":{}}', CONSTRAINT "PK_98529d9b393826ebf660d7e39f7" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "public"."sign_status_enum" AS ENUM('created', 'started', 'finished', 'error', 'timeout')`);
    await queryRunner.query(`CREATE TABLE "sign" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "roomId" character varying NOT NULL, "participantsConfirmations" integer array NOT NULL, "timeoutAt" TIMESTAMP WITH TIME ZONE NOT NULL, "data" character varying NOT NULL, "metadata" jsonb NOT NULL, "status" "public"."sign_status_enum" NOT NULL DEFAULT 'created', "result" character varying, "keyId" integer, CONSTRAINT "PK_e3de9d3ec946837ec087cf0f54a" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_7c0e903c97e0ac0bff390fee68" ON "sign" ("roomId") `);
    await queryRunner.query(`CREATE INDEX "IDX_265009d6131bd819b2e0230e4c" ON "sign" ("status") `);
    await queryRunner.query(`CREATE TABLE "user_telegram" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "telegramId" bigint NOT NULL, "chatId" bigint, "userId" integer, CONSTRAINT "UQ_e23e294a123c172552da320a005" UNIQUE ("telegramId"), CONSTRAINT "UQ_6b7c6c2d044c44a9f107f561b41" UNIQUE ("chatId"), CONSTRAINT "REL_0ef335d54b22816cd28285c9fd" UNIQUE ("userId"), CONSTRAINT "PK_c1ed111fba8a34b812d11f42352" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e23e294a123c172552da320a00" ON "user_telegram" ("telegramId") `);
    await queryRunner.query(`CREATE INDEX "IDX_6b7c6c2d044c44a9f107f561b4" ON "user_telegram" ("chatId") `);
    await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c86f56da7bb30c073e3cbed4e50" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "key_participant" ADD CONSTRAINT "FK_63802aab34ca40e531797ae4bb3" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "key_participant" ADD CONSTRAINT "FK_ceda8e1e7312aef4c5d6e2b0408" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "key" ADD CONSTRAINT "FK_69572a81a9c722651ca1b44651b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "access_token" ADD CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "sign" ADD CONSTRAINT "FK_fa585755ef3aac394647918548f" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_telegram" ADD CONSTRAINT "FK_0ef335d54b22816cd28285c9fdd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //
  }
}
