export type Station = {
  id: string;
  name: string;
  canDelete?: boolean;
};

export type StationRequest = {
  name: string;
};



export type SeatClassType = 'FIRST' | 'SECOND' | 'COMFORT';

export type SeatClass = {
  id: string;
  type: SeatClassType;
  capacity: number;
  priceIncreasePercentage: number;
};

export type SeatClassRequest = {
  type: SeatClassType;
  capacity: number;
  priceIncreasePercentage: number;
};

export type SeatClassPatchRequest = {
  priceIncreasePercentage: number;
};

export type Train = {
  id: string;
  name: string;
  basePriceIncreasePercentage: number;
  seatClasses: SeatClass[];
  canDelete?: boolean;
};

export type TrainRequest = {
  name: string;
  basePriceIncreasePercentage: number;
  seatClasses: SeatClassRequest[];
};

export type TrainPatchRequest = {
  name?: string;
  basePriceIncreasePercentage?: number;
};

export type LineNode = {
  id: string;
  stationName: string;
  kmFromSource: number;
  orderIndex: number;
};

export type LineNodeRequest = {
  stationId: string;
  kmFromSource: number;
};

export type Line = {
  id: string;
  name: string;
  nodes: LineNode[];
  canDelete?: boolean;
};

export type LineRequest = {
  name: string;
  nodes: LineNodeRequest[];
  createReverse: boolean;
};
