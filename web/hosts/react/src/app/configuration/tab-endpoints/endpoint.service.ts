import { from, type Observable } from 'rxjs';
import { apiFetch } from 'src/lib/apiFetch';
import type { IEndpoint, IEndpointWrite } from './endpoint.model';

/**
 * Ported from armature-ui's EndpointService: CRUD against armature-ms's
 * `/api/endpoints`, not localStorage (endpoint definitions carry credential
 * references, which do not belong in client side storage).
 */
class EndpointServiceImpl {
  private readonly basePath = '/api/endpoints';

  getEndpoints(): Observable<IEndpoint[]> {
    return from(apiFetch<IEndpoint[]>(this.basePath));
  }

  createEndpoint(endpoint: IEndpointWrite): Observable<IEndpoint> {
    return from(apiFetch<IEndpoint>(this.basePath, { method: 'POST', body: JSON.stringify(endpoint) }));
  }

  updateEndpoint(id: string, endpoint: IEndpointWrite): Observable<IEndpoint> {
    return from(apiFetch<IEndpoint>(`${this.basePath}/${id}`, { method: 'PUT', body: JSON.stringify(endpoint) }));
  }

  deleteEndpoint(id: string): Observable<void> {
    return from(apiFetch<void>(`${this.basePath}/${id}`, { method: 'DELETE' }));
  }
}

export const endpointService = new EndpointServiceImpl();
