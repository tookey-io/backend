import { MigrationInterface, QueryRunner } from "typeorm";

export class verificationHook1686821195288 implements MigrationInterface {
    name = 'verificationHook1686821195288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "key" ADD "verificationHook" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "key" DROP COLUMN "verificationHook"`);
    }

}
