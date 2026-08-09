export interface IGadget {
  componentType: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  instanceId: number;
  tags: ITag[];
  propertyPages: IPropertyPage[];
  actions: IAction[];
}

export interface ITag {
  facet: string;
  name: string;
}

export interface IPropertyPage {
  displayName: string;
  groupId: string;
  position: number;
  properties:IProperty[];
}

export interface IPropertySchema {
  type: string;
  items?: { type: string };
}

export interface IProperty {
  value:any;
  key: string ;
  label: string;
  required: boolean;
  order: number;
  controlType: string;
  options:[];
  // Data-shape declaration, separate from controlType (which only picks the
  // form widget). Absent for controlType 'section' (a grouping header, not
  // real data) - that's how both sides know to skip it.
  schema?: IPropertySchema;
}

export interface IAction {
  name: string;
}



