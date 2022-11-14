import { MigrationInterface, QueryRunner } from 'typeorm';

export class Session1668371371666 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "postgress_sessions" (id varchar PRIMARY KEY, session varchar)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "postgress_sessions"');
  }
}
