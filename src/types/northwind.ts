import type rawData from '@/data/northwind.json';
import type { FilterState } from '@/lib/types';

// Infer the bundled dataset's actual fields instead of asserting an unrelated schema.
// The current sample omits unitsOnOrder; unknown stock-on-order is not zero.
export type NorthwindDataset = Omit<typeof rawData, 'products'> & {
  products: Array<(typeof rawData.products)[number] & { unitsOnOrder?: number }>;
};

export type FilterParams = FilterState;
