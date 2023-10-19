import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertNewPlayer1697442916933 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO player (name)
      VALUES ('John Doe');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM reward
      WHERE name = 'John Doe';
    `);
  }
}