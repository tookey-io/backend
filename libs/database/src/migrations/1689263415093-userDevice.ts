import { MigrationInterface, QueryRunner } from "typeorm";

export class userDevice1689263415093 implements MigrationInterface {
    name = 'userDevice1689263415093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_device_devicetype_enum" AS ENUM('listener', 'firebase-messaging')`);
        await queryRunner.query(`CREATE TABLE "user_device" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "token" character varying NOT NULL, "name" character varying, "description" character varying, "deviceType" "public"."user_device_devicetype_enum" NOT NULL DEFAULT 'firebase-messaging', "userId" integer, CONSTRAINT "UQ_f3688bf7f92e04124fa06e3c180" UNIQUE ("token"), CONSTRAINT "PK_0232591a0b48e1eb92f3ec5d0d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f3688bf7f92e04124fa06e3c18" ON "user_device" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_52fcbc398d604398f09ce225ad" ON "user_device" ("deviceType") `);
        await queryRunner.query(`CREATE TABLE "user_device_keys_key" ("userDeviceId" integer NOT NULL, "keyId" integer NOT NULL, CONSTRAINT "PK_a25b49e3b027e5d0a69c8a10e6d" PRIMARY KEY ("userDeviceId", "keyId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_61520ad80c7dda31e332632aac" ON "user_device_keys_key" ("userDeviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a888153c3600157596c6a5557e" ON "user_device_keys_key" ("keyId") `);
        await queryRunner.query(`ALTER TABLE "user_device" ADD CONSTRAINT "FK_bda1afb30d9e3e8fb30b1e90af7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_device_keys_key" ADD CONSTRAINT "FK_61520ad80c7dda31e332632aaca" FOREIGN KEY ("userDeviceId") REFERENCES "user_device"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_device_keys_key" ADD CONSTRAINT "FK_a888153c3600157596c6a5557ea" FOREIGN KEY ("keyId") REFERENCES "key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_device_keys_key" DROP CONSTRAINT "FK_a888153c3600157596c6a5557ea"`);
        await queryRunner.query(`ALTER TABLE "user_device_keys_key" DROP CONSTRAINT "FK_61520ad80c7dda31e332632aaca"`);
        await queryRunner.query(`ALTER TABLE "user_device" DROP CONSTRAINT "FK_bda1afb30d9e3e8fb30b1e90af7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a888153c3600157596c6a5557e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_61520ad80c7dda31e332632aac"`);
        await queryRunner.query(`DROP TABLE "user_device_keys_key"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52fcbc398d604398f09ce225ad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3688bf7f92e04124fa06e3c18"`);
        await queryRunner.query(`DROP TABLE "user_device"`);
        await queryRunner.query(`DROP TYPE "public"."user_device_devicetype_enum"`);
    }

}
