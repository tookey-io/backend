import { MigrationInterface, QueryRunner } from "typeorm";

export class SecretsContentType1705089802726 implements MigrationInterface {
    name = 'SecretsContentType1705089802726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secret_entity" ADD "contentType" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secret_entity" DROP COLUMN "contentType"`);
    }

}
