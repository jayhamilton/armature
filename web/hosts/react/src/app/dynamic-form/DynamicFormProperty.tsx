import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import type { IProperty, ITag } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import type { IPropertyOption } from './property.model';

/**
 * Ported from armature-ui's DynamicFormPropertyComponent — the
 * @switch (property.controlType) template that renders one form field.
 * Angular's ReactiveFormsModule [formControlName] binding is replaced with
 * a plain controlled value + onChange, owned by DynamicForm's `values`
 * state (see DynamicForm.tsx).
 *
 * dropdown-ms/upload/date/markdown/icon-picker/illustration-picker/
 * endpoint-picker render a functional but simplified control for now
 * (plain multi-select / file input / date input / textarea / text input)
 * rather than the original's dedicated picker components — those are
 * flagged for a follow-up pass rather than blocking the rest of the form.
 */
export function DynamicFormProperty({
  property,
  value,
  onChange,
  gadgetTags: _gadgetTags,
}: {
  property: IProperty;
  value: any;
  onChange: (value: any) => void;
  gadgetTags: ITag[];
}) {
  const options = (property.options as unknown as IPropertyOption[]) ?? [];

  switch (property.controlType) {
    case 'textbox':
      return (
        <TextField
          fullWidth
          size="small"
          label={property.label}
          required={property.required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'hidden':
      return <input type="hidden" value={value ?? ''} onChange={() => {}} />;

    case 'number':
      return (
        <TextField
          fullWidth
          size="small"
          type="number"
          label={property.label}
          required={property.required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );

    case 'dropdown':
      return (
        <TextField
          select
          fullWidth
          size="small"
          label={property.label}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <MenuItem key={opt.key} value={opt.key}>
              {opt.value}
            </MenuItem>
          ))}
        </TextField>
      );

    case 'dropdown-ms':
      return (
        <TextField
          select
          fullWidth
          size="small"
          label={property.label}
          slotProps={{ select: { multiple: true } }}
          value={Array.isArray(value) ? value : []}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <MenuItem key={opt.key} value={opt.key}>
              {opt.value}
            </MenuItem>
          ))}
        </TextField>
      );

    case 'upload':
      return (
        <div className="upload-field">
          <div className="upload-icon">
            <MatIcon>cloud_upload</MatIcon>
          </div>
          <div className="main-text">
            Drag Photos Here or
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                onChange(Array.from(files).map((f) => f.name).join(', '));
              }}
            />
          </div>
        </div>
      );

    case 'date':
      return (
        <TextField
          fullWidth
          size="small"
          type="date"
          label={property.label}
          required={property.required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );

    case 'textarea':
      return (
        <TextField
          fullWidth
          multiline
          minRows={6}
          label={property.label}
          required={property.required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'markdown':
      return (
        <div className="markdown-editor-container">
          <label>{property.label}</label>
          <TextField
            fullWidth
            multiline
            minRows={8}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Markdown"
          />
        </div>
      );

    case 'ace-editor':
      return (
        <div className="ace-editor-container">
          <label>{property.label}</label>
          <AceEditor
            mode="json"
            theme="github"
            width="100%"
            height="220px"
            value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
            onChange={(next) => onChange(next)}
            setOptions={{ useWorker: false }}
          />
        </div>
      );

    case 'json-forms':
      // The original wired @jsonforms/angular here; the React binding is
      // @jsonforms/react + @jsonforms/material-renderers (both already a
      // project dependency) — left as a raw JSON editor for now, same as
      // ace-editor above, pending a dedicated JsonFormsEditor port.
      return (
        <div className="json-forms-container">
          <label>{property.label}</label>
          <AceEditor
            mode="json"
            theme="github"
            width="100%"
            height="220px"
            value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
            onChange={(next) => onChange(next)}
            setOptions={{ useWorker: false }}
          />
        </div>
      );

    case 'section':
      return <div className="section-header">{property.label}</div>;

    case 'checkbox':
      return (
        <FormControlLabel
          control={<Checkbox checked={value === true || value === 'true'} onChange={(e) => onChange(e.target.checked)} />}
          label={property.label}
        />
      );

    case 'icon-picker':
    case 'illustration-picker':
    case 'endpoint-picker':
      return (
        <TextField
          fullWidth
          size="small"
          label={property.label}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return null;
  }
}
