import { MigrationInterface, QueryRunner } from "typeorm";

export class SecretsRedirects1705086423012 implements MigrationInterface {
    name = 'SecretsRedirects1705086423012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secret_entity" ADD "redirectUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secret_entity" DROP COLUMN "redirectUrl"`);
    }

}
