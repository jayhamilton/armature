import type { IGadget, IProperty } from './gadget.model';

// Ported from armature-ui's GadgetBase abstract class. Angular gadget
// components extended GadgetBase to get these helpers on `this`; React
// gadget components instead call these as plain functions against the
// `gadget: IGadget` prop they're given by GadgetHost. Everything here is
// read-only (returns derived values) except mergePropertyValues, which
// returns a *new* IGadget rather than mutating in place — GadgetHost is the
// one place that owns gadget state, via useState.

export function findProperty(gadget: IGadget, key: string): IProperty | undefined {
  for (const page of gadget.propertyPages ?? []) {
    const found = page.properties?.find((property) => property.key === key);
    if (found) return found;
  }
  return undefined;
}

export function getBool(gadget: IGadget, key: string, fallback = false): boolean {
  const property = findProperty(gadget, key);
  if (!property || property.value == null) return fallback;
  return property.value === true || property.value === 'true';
}

export function getNumber(gadget: IGadget, key: string, fallback = 0): number {
  const property = findProperty(gadget, key);
  const parsed = property ? Number(property.value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getString(gadget: IGadget, key: string, fallback = ''): string {
  const property = findProperty(gadget, key);
  return typeof property?.value === 'string' && property.value !== '' ? property.value : fallback;
}

/**
 * For properties whose schema is a real array/object (e.g. chartData on the
 * chart-family gadgets), not a stringified-JSON string. No parsing —
 * mergePropertyValues is what turns a form-submitted string back into a real
 * array before it ever reaches here.
 */
export function getArray<T>(gadget: IGadget, key: string, fallback: T): T {
  const property = findProperty(gadget, key);
  return Array.isArray(property?.value) ? (property.value as T) : fallback;
}

export function getStringArray(gadget: IGadget, key: string, fallback: string[] = []): string[] {
  return getArray(gadget, key, fallback);
}

export function getJson<T>(gadget: IGadget, key: string, fallback: T): T {
  const property = findProperty(gadget, key);
  if (typeof property?.value !== 'string' || !property.value) return fallback;
  try {
    return JSON.parse(property.value) as T;
  } catch (error) {
    console.error(`Failed to parse JSON for property "${key}":`, error);
    return fallback;
  }
}

export function isMissingPropertyValue(gadget: IGadget): boolean {
  let missing = false;
  gadget.propertyPages.forEach((page) => {
    page.properties.forEach((property) => {
      if (property.value === '' && property.required === true) {
        missing = true;
      }
    });
  });
  return missing;
}

/**
 * Applies a flat key->value map (as emitted by the config form) onto a copy
 * of this gadget's propertyPages, plus the title/subtitle top-level mirror —
 * the same merge LocalStorageBoardRepository.applyProperties does for the
 * persisted copy, but for the live in-memory instance so the gadget
 * component can re-render from fresh derived properties immediately.
 */
export function mergePropertyValues(gadget: IGadget, values: Record<string, unknown>): IGadget {
  const next: IGadget = {
    ...gadget,
    title: typeof values['title'] === 'string' ? (values['title'] as string) : gadget.title,
    subtitle:
      typeof values['subtitle'] === 'string' ? (values['subtitle'] as string) : gadget.subtitle,
    propertyPages: gadget.propertyPages.map((page) => ({
      ...page,
      properties: page.properties.map((property) => {
        if (!Object.prototype.hasOwnProperty.call(values, property.key)) {
          return property;
        }
        let value = values[property.key];
        // The form always emits ace-editor content as a string, regardless
        // of what the property's schema actually declares. Parse it back to
        // real JSON when the schema says it should be something else.
        if (typeof value === 'string' && property.schema?.type && property.schema.type !== 'string') {
          try {
            value = JSON.parse(value);
          } catch (error) {
            console.error(`Failed to parse JSON for property "${property.key}":`, error);
            return property;
          }
        }
        return { ...property, value };
      }),
    })),
  };
  return next;
}
