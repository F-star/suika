import { type IPoint } from '@suika/geo';

export interface IUserItem {
  id: string;
  name: string;
  color: string;
  pos: IPoint | null;
  awarenessId: number;
}
