import { IAction, IGadget, IProperty, IPropertyPage, ITag } from './gadget.model';

export abstract class GadgetBase implements IGadget {
  componentType: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  instanceId: number;
  tags: ITag[];
  propertyPages: IPropertyPage[];
  actions: IAction[];
  inConfig: boolean;

  constructor() {
    this.componentType = '';
    this.title = '';
    this.subtitle = '';
    this.description = '';
    this.icon = '';
    this.instanceId = -1;
    this.tags = [];
    this.propertyPages = [];
    this.actions = [];
    this.inConfig = false;
  }

  setConfiguration(gadgetData: IGadget) {
    this.title = gadgetData.title;
    this.subtitle = gadgetData.subtitle;
    this.instanceId = gadgetData.instanceId;
    this.actions = gadgetData.actions;
    this.description = gadgetData.description;
    this.propertyPages = [...gadgetData.propertyPages];
    this.tags = [...gadgetData.tags];
    this.icon = gadgetData.icon;
  }

  initializeConfiguration(gadgetData: IGadget) {
    this.title = gadgetData.title;
    this.subtitle = gadgetData.subtitle;
    this.instanceId = gadgetData.instanceId;
    this.actions = gadgetData.actions;
    this.description = gadgetData.description;
    this.propertyPages = gadgetData.propertyPages;
    this.tags = [...gadgetData.tags];
    this.icon = gadgetData.icon;
    this.inConfig = this.isMissingPropertyValue()
  }

  isMissingPropertyValue(){

    let isMissingPropertyValue = false;
    this.propertyPages.forEach((page)=>{
      page.properties.forEach((property)=>{

        if(property.value == "" && property.required == true){
          isMissingPropertyValue = true
        }

      });
    });

    return isMissingPropertyValue;
  }

  public toggleConfigMode() {
    this.inConfig = !this.inConfig;
  }

  protected findProperty(key: string): IProperty | undefined {
    for (const page of this.propertyPages ?? []) {
      const found = page.properties?.find((property) => property.key === key);
      if (found) return found;
    }
    return undefined;
  }

  protected getBool(key: string, fallback = false): boolean {
    const property = this.findProperty(key);
    if (!property || property.value == null) return fallback;
    return property.value === true || property.value === 'true';
  }

  protected getNumber(key: string, fallback = 0): number {
    const property = this.findProperty(key);
    const parsed = property ? Number(property.value) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  protected getString(key: string, fallback = ''): string {
    const property = this.findProperty(key);
    return typeof property?.value === 'string' && property.value !== '' ? property.value : fallback;
  }

  protected getStringArray(key: string, fallback: string[] = []): string[] {
    return this.getArray(key, fallback);
  }

  /**
   * For properties whose schema is a real array/object (e.g. chartData on
   * the chart-family gadgets), not a stringified-JSON string. No parsing -
   * mergePropertyValues is what turns a form-submitted string back into a
   * real array before it ever reaches here.
   */
  protected getArray<T>(key: string, fallback: T): T {
    const property = this.findProperty(key);
    return Array.isArray(property?.value) ? (property.value as T) : fallback;
  }

  protected getJson<T>(key: string, fallback: T): T {
    const property = this.findProperty(key);
    if (typeof property?.value !== 'string' || !property.value) return fallback;
    try {
      return JSON.parse(property.value) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for property "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Applies a flat key->value map (as emitted by the config form) onto this
   * gadget's propertyPages in place, plus the title/subtitle top-level
   * mirror - the same merge LocalStorageBoardRepository.applyProperties does
   * for the persisted copy, but for the live in-memory instance so
   * load()-driven rendering can just be re-run afterward instead of
   * duplicating per-property coercion in propertyChangeEvent.
   */
  protected mergePropertyValues(values: Record<string, unknown>) {
    if (typeof values['title'] === 'string') {
      this.title = values['title'];
    }
    if (typeof values['subtitle'] === 'string') {
      this.subtitle = values['subtitle'];
    }
    for (const page of this.propertyPages ?? []) {
      for (const property of page.properties ?? []) {
        if (!Object.prototype.hasOwnProperty.call(values, property.key)) {
          continue;
        }
        let value = values[property.key];
        // The form always emits ace-editor content as a string, regardless
        // of what the property's schema actually declares - AceEditorComponent
        // is a string-in/string-out ControlValueAccessor. Parse it back to
        // real JSON when the schema says it should be something else.
        if (typeof value === 'string' && property.schema?.type && property.schema.type !== 'string') {
          try {
            value = JSON.parse(value);
          } catch (error) {
            console.error(`Failed to parse JSON for property "${property.key}":`, error);
            continue;
          }
        }
        property.value = value;
      }
    }
  }

}
