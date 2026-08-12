import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IEndpoint, IEndpointWrite } from './endpoint.model';

// CRUD against armature-ms, not localStorage - see .work/specs/SPEC-73.md §1
// for why endpoint definitions (and especially their credential references)
// don't belong in client-side storage the way boards currently do.
@Injectable({ providedIn: 'root' })
export class EndpointService {
  private readonly baseUrl = `${environment.apihost}/api/endpoints`;

  constructor(private http: HttpClient) {}

  getEndpoints(): Observable<IEndpoint[]> {
    return this.http.get<IEndpoint[]>(this.baseUrl);
  }

  createEndpoint(endpoint: IEndpointWrite): Observable<IEndpoint> {
    return this.http.post<IEndpoint>(this.baseUrl, endpoint);
  }

  updateEndpoint(id: string, endpoint: IEndpointWrite): Observable<IEndpoint> {
    return this.http.put<IEndpoint>(`${this.baseUrl}/${id}`, endpoint);
  }

  deleteEndpoint(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
