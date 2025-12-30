
export interface Property {
  id: string;
  name: string;
  area: string;
  type: string;
  price: number; // in Wan (10,000 TWD)
  households: number;
  floor: string;
  deed: number; // in Ping
  indoor: number; // in Ping
  balcony: number; // in Ping
  car: '無' | '平面' | '機械';
  bike: '無' | '戶外' | '室內';
  createdAt: number;
}

export type ViewType = 'list' | 'add' | 'charts' | 'ai';
