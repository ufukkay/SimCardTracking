const fs = require('fs');
let c = fs.readFileSync('public/js/i18n.js', 'utf8');

if (!c.includes("'voice_lines': 'Voice Lines'")) {
  c = c.replace(
    "'voice_list_title': 'Voice Line List',",
    "'voice_list_title': 'Voice Line List',\n      'voice_lines': 'Voice Lines',"
  );
}
if (!c.includes("'voice_lines': 'Ses Hatları'")) {
  c = c.replace(
    "'voice_list_title': 'Ses Hat Listesi',",
    "'voice_list_title': 'Ses Hat Listesi',\n      'voice_lines': 'Ses Hatları',"
  );
}

if (!c.includes("'filter_empty': '(Boş)'")) {
  c = c.replace(
    "'no_records': 'Henüz kayıt bulunmuyor.',",
    "'no_records': 'Henüz kayıt bulunmuyor.',\n      'filter_empty': '(Boş)',"
  );
}
if (!c.includes("'filter_empty': '(Empty)'")) {
  c = c.replace(
    "'no_records': 'No records found yet.',",
    "'no_records': 'No records found yet.',\n      'filter_empty': '(Empty)',"
  );
}

fs.writeFileSync('public/js/i18n.js', c);
console.log('✅ i18n updated safely');
