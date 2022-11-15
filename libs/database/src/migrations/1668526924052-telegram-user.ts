import { MigrationInterface, QueryRunner } from 'typeorm';

export class telegramUser1668526924052 implements MigrationInterface {
  name = 'telegramUser1668526924052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ADD "firstName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ADD "lastName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ADD "username" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" ADD "languageCode" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_telegram" DROP COLUMN "languageCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" DROP COLUMN "username"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" DROP COLUMN "lastName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_telegram" DROP COLUMN "firstName"`,
    );
  }
}
