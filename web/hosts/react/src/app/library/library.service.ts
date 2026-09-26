import { from, type Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';

class LibraryServiceImpl {
  getLibrary(): Observable<IGadget[]> {
    const libraryJson = environment.production ? 'library-prod.json' : 'library.json';
    return from(fetch(`/assets/api/${libraryJson}`).then((res) => res.json() as Promise<IGadget[]>));
  }
}

export const libraryService = new LibraryServiceImpl();
