import { MigrationInterface, QueryRunner } from 'typeorm';

export class auth1668692717886 implements MigrationInterface {
  name = 'auth1668692717886';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "refreshToken" character varying`);
    await queryRunner.query(`ALTER TABLE "access_token" DROP CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9"`);
    await queryRunner.query(`ALTER TABLE "access_token" ADD CONSTRAINT "UQ_9949557d0e1b2c19e5344c171e9" UNIQUE ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
    await queryRunner.query(`ALTER TABLE "access_token" DROP CONSTRAINT "UQ_9949557d0e1b2c19e5344c171e9"`);
    await queryRunner.query(`ALTER TABLE "access_token" ADD CONSTRAINT "FK_9949557d0e1b2c19e5344c171e9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }
}
