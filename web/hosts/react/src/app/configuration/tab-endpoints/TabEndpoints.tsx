import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { ApiError } from 'src/lib/apiFetch';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { MatIcon } from '../../shared/mat-icon/MatIcon';
import { gadgetTagOptionsService, type GadgetTagOption } from '../../shared/gadget-tags/gadget-tag-options.service';
import type { ITag } from '../../gadgets/common/gadget-common/gadget-base/gadget.model';
import { endpointService } from './endpoint.service';
import { ENDPOINT_AUTH_TYPES, type EndpointAuthType, type IEndpoint, type IEndpointWrite } from './endpoint.model';
import '../Configuration.css';

interface EndpointForm {
  name: string;
  address: string;
  description: string;
  authType: EndpointAuthType;
  authHeaderName: string;
  credentialUser: string;
  credentialValue: string;
}

const EMPTY_FORM: EndpointForm = {
  name: '',
  address: '',
  description: '',
  authType: 'none',
  authHeaderName: '',
  credentialUser: '',
  credentialValue: '',
};

/** Ported from armature-ui's TabEndpointsComponent: endpoint CRUD backing the endpoint-picker control. */
export function TabEndpoints() {
  const [endpoints, setEndpoints] = useState<IEndpoint[]>([]);
  const [form, setForm] = useState<EndpointForm>(EMPTY_FORM);
  // Tags are picked from the library's existing vocabulary only (no free
  // typing), so an endpoint's tags can never fail to match a gadget through
  // a typo.
  const [tags, setTags] = useState<ITag[]>([]);
  const [tagOptions, setTagOptions] = useState<GadgetTagOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IEndpoint | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function loadData() {
    endpointService.getEndpoints().subscribe({
      next: setEndpoints,
      // No backend, or the route errors: show an empty list rather than an
      // error on every open of this tab.
      error: () => setEndpoints([]),
    });
  }

  useEffect(() => {
    loadData();
    const subscription = gadgetTagOptionsService.getTagOptions().subscribe(setTagOptions);
    return () => subscription.unsubscribe();
  }, []);

  function setField<K extends keyof EndpointForm>(key: K, value: EndpointForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  const isHeaderAuth = form.authType === 'header';
  const isBasicAuth = form.authType === 'basic';
  const requiresCredential = form.authType !== 'none';
  const formValid = form.name.trim() !== '' && form.address.trim() !== '';

  function resetForm() {
    setForm(EMPTY_FORM);
    setTags([]);
    setDirty(false);
  }

  function buildWritePayload(): IEndpointWrite {
    const payload: IEndpointWrite = {
      name: form.name,
      address: form.address,
      description: form.description,
      tags,
      authType: form.authType,
    };
    if (isHeaderAuth) payload.authHeaderName = form.authHeaderName;
    if (isBasicAuth) payload.credentialUser = form.credentialUser;
    if (requiresCredential && form.credentialValue) payload.credentialValue = form.credentialValue;
    return payload;
  }

  function showSaveError(err: unknown) {
    setMessage(
      err instanceof ApiError && err.status === 404
        ? 'Could not save endpoint (the backend route is not available yet).'
        : 'Could not save endpoint. Please try again.'
    );
  }

  function save() {
    const payload = buildWritePayload();
    const request =
      editMode && selectedId
        ? endpointService.updateEndpoint(selectedId, payload)
        : endpointService.createEndpoint(payload);
    request.subscribe({
      next: () => {
        setEditMode(false);
        setSelectedId(undefined);
        resetForm();
        loadData();
      },
      error: showSaveError,
    });
  }

  function edit(item: IEndpoint) {
    setForm({
      name: item.name,
      address: item.address,
      description: item.description,
      authType: item.authType,
      authHeaderName: item.authHeaderName || '',
      credentialUser: item.credentialUser || '',
      // Never prefilled: the backend does not return a stored credential, so
      // leaving this blank on edit means "keep the existing one".
      credentialValue: '',
    });
    setTags(item.tags.map((t) => ({ ...t })));
    setSelectedId(item.id);
    setEditMode(true);
    setDirty(true);
  }

  function resetEditMode() {
    setEditMode(false);
    setSelectedId(undefined);
    resetForm();
  }

  function confirmDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    endpointService.deleteEndpoint(target.id).subscribe({
      next: loadData,
      error: () => setMessage('Could not delete endpoint. Please try again.'),
    });
  }

  const selectedTagNames = new Set(tags.map((t) => t.name.toLowerCase()));
  const availableTagOptions = tagOptions.filter((option) => !selectedTagNames.has(option.name));

  return (
    <div>
      <div className="endpoints-form-section">
        <h3 className="section-label">Define a new endpoint</h3>
        <div className="endpoints-form">
          <TextField
            size="small"
            required
            label="Name"
            placeholder="Enter a name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            className="form-field-name"
          />

          <TextField
            size="small"
            required
            label="Address"
            placeholder="https://api.example.com/data"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            className="form-field-address"
          />

          <TextField
            size="small"
            label="Description"
            placeholder="Enter description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="form-field-desc"
          />

          <Autocomplete
            multiple
            size="small"
            className="form-field-tags"
            options={availableTagOptions}
            value={[]}
            getOptionLabel={(option) => option.name}
            noOptionsText="No matching tags"
            onChange={(_, picked) => {
              const option = picked[picked.length - 1];
              if (!option) return;
              setTags((current) => [...current, { facet: '', name: option.name }]);
              setDirty(true);
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.name}>
                <span>
                  <span className="tag-option-name">{option.name}</span>
                  <span className="tag-option-gadgets">{option.gadgetTitles.join(', ')}</span>
                </span>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Pick a tag…"
                helperText="Pick from tags already used by gadgets in the library."
              />
            )}
          />
          {tags.length > 0 && (
            <div className="endpoint-tag-chips" aria-label="Endpoint tags">
              {tags.map((tag) => (
                <Chip
                  key={tag.name}
                  size="small"
                  label={tag.name}
                  onDelete={() => {
                    setTags((current) => current.filter((t) => t !== tag));
                    setDirty(true);
                  }}
                />
              ))}
            </div>
          )}

          <TextField
            select
            size="small"
            label="Authentication"
            value={form.authType}
            onChange={(e) => setField('authType', e.target.value as EndpointAuthType)}
            className="form-field-auth"
          >
            {ENDPOINT_AUTH_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {isHeaderAuth && (
            <TextField
              size="small"
              label="Header name"
              placeholder="X-API-Key"
              value={form.authHeaderName}
              onChange={(e) => setField('authHeaderName', e.target.value)}
              className="form-field-auth"
            />
          )}

          {isBasicAuth && (
            <TextField
              size="small"
              label="Username"
              value={form.credentialUser}
              onChange={(e) => setField('credentialUser', e.target.value)}
              className="form-field-auth"
            />
          )}

          {requiresCredential && (
            <TextField
              size="small"
              type="password"
              label={isBasicAuth ? 'Password' : 'API key'}
              placeholder={editMode ? 'Leave blank to keep existing' : ''}
              value={form.credentialValue}
              onChange={(e) => setField('credentialValue', e.target.value)}
              className="form-field-auth"
            />
          )}

          <div className="form-actions">
            <Button variant="contained" color="primary" onClick={save} disabled={!formValid || !dirty}>
              <MatIcon>{editMode ? 'check' : 'add'}</MatIcon>
              {editMode ? 'Update' : 'Add'}
            </Button>
            {editMode && (
              <Button variant="outlined" color="primary" onClick={resetEditMode}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="boards-table-section">
        <h3 className="section-label">Endpoints</h3>
        <Table size="small" className="boards-table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {endpoints.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell>{endpoint.name}</TableCell>
                <TableCell className="address-cell">{endpoint.address}</TableCell>
                <TableCell>
                  {endpoint.tags.map((tag) => (
                    <span key={tag.name} className="tag-pill">
                      {tag.name}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <div className="action-buttons">
                    <Tooltip title="Edit">
                      <IconButton color="primary" size="small" aria-label={`Edit ${endpoint.name}`} onClick={() => edit(endpoint)}>
                        <MatIcon>edit</MatIcon>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        size="small"
                        aria-label={`Delete ${endpoint.name}`}
                        onClick={() => setDeleteTarget(endpoint)}
                      >
                        <MatIcon>delete</MatIcon>
                      </IconButton>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {endpoints.length === 0 && <p className="endpoints-empty">No endpoints defined yet.</p>}
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        data={{
          title: 'Delete Endpoint',
          message: `Delete endpoint "${deleteTarget?.name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
        }}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={message != null}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        message={message}
        action={
          <Button color="inherit" size="small" onClick={() => setMessage(null)}>
            Dismiss
          </Button>
        }
      />
    </div>
  );
}
