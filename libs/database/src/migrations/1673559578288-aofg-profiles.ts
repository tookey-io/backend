import { MigrationInterface, QueryRunner } from "typeorm";

export class aofgProfiles1673559578288 implements MigrationInterface {
    name = 'aofgProfiles1673559578288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "aofg_profile" ADD "title" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "aofg_profile" DROP COLUMN "title"`);
    }

}
