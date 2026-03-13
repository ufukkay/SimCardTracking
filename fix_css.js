const fs = require('fs');

const cssToAdd = `
/* ─── TABLE CONTAINER ─── */
.table-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 220px);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

/* ─── DATA TABLE (Google Sheets Style) ─── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;
}
.data-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8f9fa;
}
.data-table thead tr {
  border-bottom: 2px solid #e0e0e0;
}
.data-table th {
  padding: 8px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  user-select: none;
  border-right: 1px solid #e0e0e0;
  background: #f8f9fa;
}
.data-table th:last-child {
  border-right: none;
}
.data-table tbody tr {
  border-bottom: 1px solid #f1f3f4;
  transition: background 0.1s;
}
.data-table tbody tr:hover {
  background: #e8f0fe;
}
.data-table tbody tr:nth-child(even) {
  background: #fafafa;
}
.data-table tbody tr:nth-child(even):hover {
  background: #e8f0fe;
}
.data-table td {
  padding: 8px 12px;
  color: var(--text-primary);
  border-right: 1px solid #f1f3f4;
  vertical-align: middle;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-table td:last-child {
  border-right: none;
}

/* ─── FILTERS ROW ─── */
.filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.filters .search-input {
  flex: 1;
  min-width: 220px;
  max-width: 340px;
  height: 32px;
  padding: 4px 12px;
  font-size: 13px;
}
.filter-select {
  width: 160px;
  height: 32px;
  padding: 4px 8px;
  font-size: 13px;
}
.filter-select-sm {
  width: 140px;
  height: 32px;
  padding: 4px 8px;
  font-size: 13px;
}
.filters .btn {
  height: 32px;
  flex-shrink: 0;
}
`;

let css = fs.readFileSync('public/css/style.css', 'utf8');
// Remove duplicate if already added
const marker = '/* ─── TABLE CONTAINER ─── */';
if (css.includes(marker)) {
  css = css.substring(0, css.indexOf(marker));
}
css += cssToAdd;
fs.writeFileSync('public/css/style.css', css);
console.log('✅ CSS updated with Google Sheets table styles');
