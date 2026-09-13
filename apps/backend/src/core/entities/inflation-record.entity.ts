export class InflationRecord {
  id: string;
  month: number;
  year: number;
  ipcMonthly: number;
  ipcAnnual: number;
  source: string;
  fetchedAt: Date;
}
