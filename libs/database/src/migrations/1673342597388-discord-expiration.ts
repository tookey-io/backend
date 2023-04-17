import { MigrationInterface, QueryRunner } from 'typeorm';

export class discordExpiration1673342597388 implements MigrationInterface {
  name = 'discordExpiration1673342597388';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_discord" ADD "validUntil" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_discord" DROP COLUMN "validUntil"`);
  }
}
