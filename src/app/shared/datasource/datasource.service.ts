import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// The single fetch call site for every gadget's REST-backed data - see
// .work/specs/SPEC-73.md §3/§5. A gadget never talks to a target API
// directly; it POSTs the id of an Endpoint it's allowed to use, and
// armature-ms resolves that id's address/credential server-side and
// performs the actual GET. One backend route serves every gadget type,
// so adding a new gadget that wants REST data needs no backend change.
export interface DataSourceFetchRequest {
  endpointId: string;
  queryParams?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  private readonly fetchUrl = `${environment.apihost}/api/datasource/fetch`;

  constructor(private http: HttpClient) {}

  fetch(endpointId: string, queryParams?: Record<string, string>): Observable<unknown> {
    const request: DataSourceFetchRequest = { endpointId, queryParams };
    return this.http.post<unknown>(this.fetchUrl, request);
  }
}
