const fs = require('fs');

const cssToAdd = `
/* ─── TABLE HEADER FILTER & SORT BUTTONS ─── */
.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  min-height: 20px;
}
.th-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.th-btn-group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.data-table th:hover .th-btn-group,
.data-table th.has-filter .th-btn-group {
  opacity: 1;
}
.th-sort-btn,
.th-filter-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 11px;
  line-height: 1;
  border-radius: 3px;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}
.th-sort-btn:hover,
.th-filter-btn:hover {
  background: #e8eaed;
  color: var(--text-primary);
}
.th-sort-btn.active {
  color: var(--accent);
}
.th-filter-btn.active {
  color: var(--accent);
  background: var(--accent-light);
}

/* ─── COLUMN FILTER MENU ─── */
.col-filter-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 200;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  min-width: 220px;
  max-width: 280px;
  padding: 8px 0;
}
.col-filter-menu.open {
  display: block;
}
.col-filter-search {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-light);
}
.col-filter-search input {
  width: 100%;
}
.col-filter-bulk {
  display: flex;
  gap: 10px;
  padding: 4px 10px;
  font-size: 12px;
}
.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  font-size: 12px;
  padding: 2px 0;
}
.col-filter-list {
  max-height: 180px;
  overflow-y: auto;
  padding: 4px 0;
}
.col-filter-list label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 0.1s;
}
.col-filter-list label:hover {
  background: var(--bg-hover);
}
.col-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 6px 10px;
  border-top: 1px solid var(--border-light);
}

/* Ensure TH is position:relative for absolute dropdown */
.data-table th {
  position: relative;
}
`;

let css = fs.readFileSync('public/css/style.css', 'utf8');
const marker = '/* ─── TABLE HEADER FILTER & SORT BUTTONS ─── */';
if (css.includes(marker)) {
  css = css.substring(0, css.indexOf(marker));
}
css = css.trimEnd() + '\n' + cssToAdd;
fs.writeFileSync('public/css/style.css', css);
console.log('✅ Table header filter/sort button CSS added');
