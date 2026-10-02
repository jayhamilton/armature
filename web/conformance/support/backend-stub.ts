import type { Page, Route } from '@playwright/test';

/** The backend origin both hosts call (`environment.apihost`). */
export const API_ORIGIN = 'http://localhost:8080';

export interface StubEndpoint {
  id: string;
  name: string;
  address: string;
  description: string;
  tags: { facet: string; name: string }[];
  authType: 'none' | 'header' | 'basic';
  authHeaderName?: string;
  credentialUser?: string;
}

/**
 * An in memory stand in for armature-ms's `/api/endpoints`, so the suite
 * checks host behavior without a running backend. Any other backend call
 * answers 404, which both hosts already treat as "no backend yet".
 */
export async function stubBackend(page: Page, seed: StubEndpoint[] = []): Promise<StubEndpoint[]> {
  const endpoints = [...seed];
  let nextId = 1;

  const json = (route: Route, status: number, body?: unknown) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: body === undefined ? '' : JSON.stringify(body),
    });

  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (path === '/api/endpoints') {
      if (method === 'GET') return json(route, 200, endpoints);
      if (method === 'POST') {
        const { credentialValue: _secret, ...created } = request.postDataJSON();
        const endpoint = { ...created, id: `ep-${nextId++}` } as StubEndpoint;
        endpoints.push(endpoint);
        return json(route, 201, endpoint);
      }
    }

    const match = path.match(/^\/api\/endpoints\/([^/]+)$/);
    if (match) {
      const index = endpoints.findIndex((e) => e.id === match[1]);
      if (index === -1) return json(route, 404);
      if (method === 'PUT') {
        const { credentialValue: _secret, ...updated } = request.postDataJSON();
        endpoints[index] = { ...updated, id: match[1] };
        return json(route, 200, endpoints[index]);
      }
      if (method === 'DELETE') {
        endpoints.splice(index, 1);
        return route.fulfill({ status: 204 });
      }
    }

    return json(route, 404);
  });

  return endpoints;
}
