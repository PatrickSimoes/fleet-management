import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1780625207242 implements MigrationInterface {
  name = 'Init1780625207242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a3ffb1c0c8416b9fc6f907b7433" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_c9b5b525a96ddc2c5647d7f7fa5" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_6d596d799f9cb9dac6f7bf7c23c" DEFAULT getdate(), "created_by" uniqueidentifier, "nickname" nvarchar(255) NOT NULL, "name" nvarchar(255) NOT NULL, "email" nvarchar(255) NOT NULL, "password" nvarchar(255) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_18d8646b59304dce4af3a9e35b6" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_5f657f45753e2ab552e6cf09c3e" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_894cae7674f3b507d73a585575c" DEFAULT getdate(), "created_by" uniqueidentifier, "license_plate" nvarchar(255) NOT NULL, "chassis" nvarchar(255) NOT NULL, "renavam" nvarchar(255) NOT NULL, "year" int NOT NULL, "color" nvarchar(255) NOT NULL, "model_id" uniqueidentifier NOT NULL, CONSTRAINT "UQ_7e9fab2e8625b63613f67bd706c" UNIQUE ("license_plate"), CONSTRAINT "UQ_7c6681b16862bd33fcf11984445" UNIQUE ("chassis"), CONSTRAINT "UQ_f20513b1dd64f0b2da6f91ef540" UNIQUE ("renavam"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4fe98a2147b08df1ab56df531" ON "vehicles" ("model_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "models" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_ef9ed7160ea69013636466bf2d5" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_2fa3da3e3ed8f1379f8e29ebf49" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_04615a558292d5f284fa7e73bfb" DEFAULT getdate(), "created_by" uniqueidentifier, "name" nvarchar(255) NOT NULL, "brand_id" uniqueidentifier NOT NULL, CONSTRAINT "PK_ef9ed7160ea69013636466bf2d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c53931a0f5f2135c9436c2f1c6" ON "models" ("brand_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_b0c437120b624da1034a81fc561" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_1f247307b5b1a85dd981ec8ffc8" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_367e19a7371f10544739c56d1a3" DEFAULT getdate(), "created_by" uniqueidentifier, "name" nvarchar(255) NOT NULL, CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a1fcdc1746e3b2fd4661ebecfbf" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c4fe98a2147b08df1ab56df5313" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "models" ADD CONSTRAINT "FK_5a409923fb0d009e750cfd74c82" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "models" ADD CONSTRAINT "FK_f2b1673c6665816ff753e81d1a0" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ADD CONSTRAINT "FK_43291261334c16b47ff227c09ff" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "brands" DROP CONSTRAINT "FK_43291261334c16b47ff227c09ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "models" DROP CONSTRAINT "FK_f2b1673c6665816ff753e81d1a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "models" DROP CONSTRAINT "FK_5a409923fb0d009e750cfd74c82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c4fe98a2147b08df1ab56df5313"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a1fcdc1746e3b2fd4661ebecfbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`,
    );
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(
      `DROP INDEX "IDX_c53931a0f5f2135c9436c2f1c6" ON "models"`,
    );
    await queryRunner.query(`DROP TABLE "models"`);
    await queryRunner.query(
      `DROP INDEX "IDX_c4fe98a2147b08df1ab56df531" ON "vehicles"`,
    );
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
