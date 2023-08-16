import { MigrationInterface, QueryRunner } from "typeorm";

export class pieces1692121464935 implements MigrationInterface {
    name = 'pieces1692121464935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE COLLATION en_natural (LOCALE = \'en-US-u-kn-true\', PROVIDER = \'icu\')')
        await queryRunner.query(`CREATE TABLE "piece" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "revision" integer NOT NULL, "name" character varying NOT NULL, "displayName" character varying NOT NULL, "logoUrl" character varying NOT NULL, "description" character varying, "projectId" character varying, "version" character varying COLLATE "en_natural" NOT NULL, "minimumSupportedRelease" character varying COLLATE "en_natural" NOT NULL, "maximumSupportedRelease" character varying COLLATE "en_natural" NOT NULL, "auth" jsonb, "actions" jsonb NOT NULL, "triggers" jsonb NOT NULL, CONSTRAINT "unique_piece_name_version" UNIQUE ("name", "version"), CONSTRAINT "PK_c14fb7d64989cd50598e9ac9480" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_piece_name_version" ON "piece" ("name", "version") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP COLLATION en_natural')
        await queryRunner.query(`DROP INDEX "public"."idx_piece_name_version"`);
        await queryRunner.query(`DROP TABLE "piece"`);
    }

}
