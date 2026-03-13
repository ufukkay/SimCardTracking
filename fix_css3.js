const fs = require('fs');

const cssToAdd = `
/* ─── TABLE CELL HELPERS ─── */
.td-mono {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-muted);
}
.td-notes {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  font-size: 12.5px;
}
.td-actions {
  width: 96px;
  white-space: nowrap;
}
.td-muted {
  color: var(--text-muted);
  font-size: 13px;
}
.badge-package {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #f1f3f4;
  color: var(--text-secondary);
  border: 1px solid #e0e0e0;
}

/* ─── ACTION BUTTONS IN TABLE ─── */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: nowrap;
}
.btn-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 4px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
`;

let css = fs.readFileSync('public/css/style.css', 'utf8');
const marker = '/* ─── TABLE CELL HELPERS ─── */';
if (css.includes(marker)) {
  css = css.substring(0, css.indexOf(marker));
}
css = css.trimEnd() + '\n' + cssToAdd;
fs.writeFileSync('public/css/style.css', css);
console.log('✅ Table cell helper CSS added');
