import { map, type Observable } from 'rxjs';
import { libraryService } from '../../library/library.service';

/**
 * The distinct set of tag names already in use across the gadget library,
 * each with the titles of the gadgets that carry it: the vocabulary an
 * endpoint's own tags are picked from, so an endpoint's tags always match at
 * least one gadget.
 */
export interface GadgetTagOption {
  name: string;
  gadgetTitles: string[];
}

/** Ported from armature-ui's GadgetTagOptionsService. */
class GadgetTagOptionsServiceImpl {
  getTagOptions(): Observable<GadgetTagOption[]> {
    return libraryService.getLibrary().pipe(
      map((gadgets) => {
        const gadgetsByTag = new Map<string, Set<string>>();

        for (const gadget of gadgets) {
          for (const tag of gadget.tags ?? []) {
            const name = tag.name.trim().toLowerCase();
            if (!name) continue;
            if (!gadgetsByTag.has(name)) {
              gadgetsByTag.set(name, new Set());
            }
            gadgetsByTag.get(name)!.add(gadget.title);
          }
        }

        return Array.from(gadgetsByTag.entries())
          .map(([name, titles]) => ({ name, gadgetTitles: Array.from(titles).sort() }))
          .sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }
}

export const gadgetTagOptionsService = new GadgetTagOptionsServiceImpl();
