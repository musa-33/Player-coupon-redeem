import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertEidRewardCampaignData1697442916933 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() + 6);

    const formattedStartDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    const formattedEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');

    await queryRunner.query(`
      INSERT INTO reward (name, startDate, endDate, perDayLimit, totalLimit)
      VALUES ('Eid Reward campaign', '${formattedStartDate}', '${formattedEndDate}', 3, 21);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM reward
      WHERE name = 'Eid Reward campaign';
    `);
  }
}