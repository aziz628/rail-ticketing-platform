export interface Trip {
  id: string;
  lineName: string;
  trainName: string;
  date: string;
  startStopName: string;
  endStopName: string;
}


export interface TripGenerationSettings {
  autoGenerateEnabled: boolean;
  generationSpanDays: number;
}

export interface TripQueryFilters {
  lineId?: string;
  date?: string;
  page?: number;
}
