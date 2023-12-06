import { MigrationInterface, QueryRunner } from "typeorm";

export class Pieces1701893634169 implements MigrationInterface {
    name = 'Pieces1701893634169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."piece_piecetype_enum" AS ENUM('OFFICIAL', 'COMMUNITY')`);
        await queryRunner.query(`ALTER TABLE "piece" ADD "pieceType" "public"."piece_piecetype_enum" NOT NULL DEFAULT 'OFFICIAL'`);
        await queryRunner.query(`CREATE TYPE "public"."piece_packagetype_enum" AS ENUM('REGISTRY', 'LOCAL')`);
        await queryRunner.query(`ALTER TABLE "piece" ADD "packageType" "public"."piece_packagetype_enum" NOT NULL DEFAULT 'REGISTRY'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "piece" DROP COLUMN "packageType"`);
        await queryRunner.query(`DROP TYPE "public"."piece_packagetype_enum"`);
        await queryRunner.query(`ALTER TABLE "piece" DROP COLUMN "pieceType"`);
        await queryRunner.query(`DROP TYPE "public"."piece_piecetype_enum"`);
    }

}
