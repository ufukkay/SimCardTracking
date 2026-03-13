const fs = require('fs');

// ─── 1. Fix i18n.js ─────────────────────────────────────────────────────────
{
  let c = fs.readFileSync('public/js/i18n.js', 'utf8');
  // Add voice_lines to EN if missing
  if (!c.includes("'voice_lines': 'Voice Lines'")) {
    c = c.replace(
      "'voice_list_title': 'Voice Line List'",
      "'voice_list_title': 'Voice Line List',\n      'voice_lines': 'Voice Lines'"
    );
  }
  // Add voice_lines TR if missing  
  if (!c.includes("'voice_lines': 'Ses Hatları'")) {
    c = c.replace(
      "'voice_list_title': 'Ses Hat Listesi'",
      "'voice_list_title': 'Ses Hat Listesi',\n      'voice_lines': 'Ses Hatları'"
    );
  }
  fs.writeFileSync('public/js/i18n.js', c);
  console.log('✅ i18n.js fixed');
}

// ─── 2. Fix m2m.js — pageTitle + table class ─────────────────────────────────
{
  let c = fs.readFileSync('public/js/pages/m2m.js', 'utf8');
  // pageTitle
  c = c.replace(
    "document.getElementById('pageTitle').textContent = 'M2M Hatları'",
    "document.getElementById('pageTitle').textContent = i18n.t('nav_m2m')"
  );
  // table class
  c = c.replace(/<table>(\s*\r?\n\s*<thead>)/g, '<table class="data-table">$1');
  fs.writeFileSync('public/js/pages/m2m.js', c);
  console.log('✅ m2m.js fixed');
}

// ─── 3. Fix data.js — pageTitle + table class + inline style ─────────────────
{
  let c = fs.readFileSync('public/js/pages/data.js', 'utf8');
  // pageTitle
  c = c.replace(
    "document.getElementById('pageTitle').textContent = 'Data Hatları'",
    "document.getElementById('pageTitle').textContent = i18n.t('nav_data')"
  );
  // table class
  c = c.replace(/<table>(\s*\r?\n\s*<thead>)/g, '<table class="data-table">$1');
  // inline style on filter selects
  c = c.replace(/class="form-control" style="width:160px"/g, 'class="form-control filter-select"');
  c = c.replace(/class="form-control" style="width:140px"/g, 'class="form-control filter-select-sm"');
  fs.writeFileSync('public/js/pages/data.js', c);
  console.log('✅ data.js fixed');
}

// ─── 4. Fix voice.js — table class + inline style ────────────────────────────
{
  let c = fs.readFileSync('public/js/pages/voice.js', 'utf8');
  // table class
  c = c.replace(/<table>(\s*\r?\n\s*<thead>)/g, '<table class="data-table">$1');
  // inline style on filter selects
  c = c.replace(/class="form-control" style="width:160px"/g, 'class="form-control filter-select"');
  c = c.replace(/class="form-control" style="width:140px"/g, 'class="form-control filter-select-sm"');
  fs.writeFileSync('public/js/pages/voice.js', c);
  console.log('✅ voice.js fixed');
}

console.log('All fixes applied!');
