export interface Point {
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  createdAt: string;
  points: Point[];
}
