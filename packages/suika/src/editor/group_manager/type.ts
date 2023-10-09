export interface IGroupAttrs {
  id: string;
  rotation?: number;
  objectName: string;
}

export interface IGroupsData {
  groups: IGroupAttrs[];
  graphToGroupMap: { [id: string]: string[] };
}
