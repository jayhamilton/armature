import { ITag } from '../../gadgets/common/gadget-common/gadget-base/gadget.model';

// See .work/specs/SPEC-73.md §1. Deliberately no credential *value* field
// here - this is the read shape returned by the backend, which never
// round-trips a stored secret back to the browser.
export type EndpointAuthType = 'none' | 'header' | 'basic';

export interface IEndpoint {
  id: string;
  name: string;
  address: string;
  description: string;
  tags: ITag[];
  authType: EndpointAuthType;
  // Header name the credential is sent under when authType === 'header'
  // (e.g. "X-API-Key"). Unused for 'none'/'basic'.
  authHeaderName?: string;
  // Username when authType === 'basic'. Unused for 'none'/'header'.
  credentialUser?: string;
}

// Write-side shape for create/update requests only. `credentialValue`
// carries the secret (API key, or Basic auth password) once, on submit -
// the backend stores it and it's never present on IEndpoint as read back.
// Omitted (or blank) on an update leaves the previously stored credential
// unchanged, since IEndpoint never gives the form a value to prefill.
export interface IEndpointWrite extends Omit<IEndpoint, 'id'> {
  credentialValue?: string;
}

export const ENDPOINT_AUTH_TYPES: { value: EndpointAuthType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'header', label: 'API key header' },
  { value: 'basic', label: 'Basic auth' },
];
