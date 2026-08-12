import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LibraryService } from '../../library/library.service';

// The distinct set of tag names already in use across the gadget library,
// each with the titles of the gadgets that carry it - the "already
// available" vocabulary an Endpoint's own tags are picked from, so an
// endpoint's tags can only ever be values that actually match at least one
// gadget (see .work/specs/SPEC-73.md §2's tag-intersection matching).
export interface GadgetTagOption {
  name: string;
  gadgetTitles: string[];
}

@Injectable({ providedIn: 'root' })
export class GadgetTagOptionsService {
  constructor(private libraryService: LibraryService) {}

  getTagOptions(): Observable<GadgetTagOption[]> {
    return this.libraryService.getLibrary().pipe(
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
