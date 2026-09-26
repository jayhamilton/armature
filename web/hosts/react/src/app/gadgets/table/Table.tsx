import { useMemo } from 'react';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getBool, getJson, getNumber, getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';
import './Table.css';

const DEFAULT_ROWS = [
  { Line: 'Line A', Output: 1240, Defects: 12, Status: 'Running' },
  { Line: 'Line B', Output: 980, Defects: 31, Status: 'Running' },
  { Line: 'Line C', Output: 0, Defects: 0, Status: 'Stopped' },
  { Line: 'Line D', Output: 1515, Defects: 4, Status: 'Running' },
];

/** Ported from armature-ui's TableComponent. */
export function Table({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const data = getJson<any[] | undefined>(gadget, 'tableData', undefined);
  const rows = Array.isArray(data) ? data : DEFAULT_ROWS;
  if (data !== undefined && !Array.isArray(data)) {
    console.error('Table gadget expects a JSON array of row objects.');
  }

  const configuredColumns = getString(gadget, 'tableColumns', '');
  const showStriped = getBool(gadget, 'showStriped', true);
  const showDense = getBool(gadget, 'showDense');
  const showRowNumbers = getBool(gadget, 'showRowNumbers');
  const maxRows = getNumber(gadget, 'maxRows', 0);

  const columns = useMemo(() => {
    const explicit = configuredColumns
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (explicit.length > 0) return explicit;

    // Union of keys across all rows rather than just the first, so rows
    // with extra fields don't silently lose columns.
    const keys: string[] = [];
    rows.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => {
          if (!keys.includes(k)) keys.push(k);
        });
      }
    });
    return keys;
  }, [configuredColumns, rows]);

  const visibleRows = maxRows > 0 ? rows.slice(0, maxRows) : rows;

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="table"
    >
      <TableContainer style={{ height: '100%', overflow: 'auto' }}>
        <MuiTable size={showDense ? 'small' : 'medium'} className={showStriped ? 'striped-table' : ''}>
          <TableHead>
            <TableRow>
              {showRowNumbers && <TableCell>#</TableCell>}
              {columns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, index) => (
              <TableRow key={index} className={showStriped && index % 2 === 1 ? 'striped-row' : ''}>
                {showRowNumbers && <TableCell>{index + 1}</TableCell>}
                {columns.map((column) => (
                  <TableCell key={column}>{String(row?.[column] ?? '')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </GadgetCard>
  );
}
