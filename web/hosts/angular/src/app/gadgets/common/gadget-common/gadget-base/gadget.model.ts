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

// A JSON Schema fragment. Only `type` is read at runtime (by GadgetBase's
// mergePropertyValues and PropertyControlService, to know whether an
// ace-editor's string needs parsing back to real JSON) - everything else
// (items/properties/required/...) passes through untyped for the backend's
// benefit, which is the actual consumer of the full nested shape.
export interface IPropertySchema {
  type: string;
  [key: string]: unknown;
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



