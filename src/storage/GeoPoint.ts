import { IGeoPoint } from '../types';

export class GeoPoint implements IGeoPoint {
  __type: 'GeoPoint' = 'GeoPoint';
  constructor(public latitude: number, public longitude: number) {}
}
