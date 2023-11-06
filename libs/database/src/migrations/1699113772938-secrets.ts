import { MigrationInterface, QueryRunner } from "typeorm";

export class Secrets1699113772938 implements MigrationInterface {
    name = 'Secrets1699113772938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "secret_entity" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "pieceName" character varying NOT NULL, "clientSecret" character varying NOT NULL, "clientId" character varying NOT NULL, CONSTRAINT "unique_piece_name_client_id" UNIQUE ("pieceName", "clientId"), CONSTRAINT "PK_82a73302205435aee4c0336e763" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f0f3eb47cc815edc701bb14974" ON "secret_entity" ("pieceName") `);
        await queryRunner.query(`CREATE INDEX "IDX_88b7b6998dff84b1567696f7ca" ON "secret_entity" ("clientId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_piece_name_client_id" ON "secret_entity" ("pieceName", "clientId") `);
        await queryRunner.query(`ALTER TABLE "user_discord" ALTER COLUMN "accessToken" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_discord" ALTER COLUMN "refreshToken" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_discord" ALTER COLUMN "validUntil" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_discord" ALTER COLUMN "validUntil" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_discord" ALTER COLUMN "refreshToken" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_discord" ALTER COLUMN "accessToken" DROP NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."idx_piece_name_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88b7b6998dff84b1567696f7ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0f3eb47cc815edc701bb14974"`);
        await queryRunner.query(`DROP TABLE "secret_entity"`);
    }

}
