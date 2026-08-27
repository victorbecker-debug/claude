// A transaction normalized to a common shape, regardless of which data
// source produced it (manual CSV/OFX import today; a future Open Finance
// aggregator like Pluggy/Belvo would produce the same shape).
export interface RawTransaction {
  date: Date;
  description: string;
  // Negative = money out (expense), positive = money in (income/refund).
  amount: number;
}

// Any way of getting transactions into the app implements this interface.
// `ManualImportSource` (CSV/OFX file upload) is the only implementation
// today; a Pluggy/Belvo-backed source can be added later without touching
// categorization, geocoding, or the dashboards.
export interface DataSource {
  name: string;
  fetchTransactions(input: unknown): Promise<RawTransaction[]>;
}
