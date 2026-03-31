const fs = require('fs');
const csvPath = 'c:/Users/myfav/Desktop/subjects_unit_mapping.csv';
if (!fs.existsSync(csvPath)) {
  console.error('CSV not found:', csvPath);
  process.exit(1);
}
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.trim().split(/\r?\n/);
const header = lines.shift().split(',');
const keyIndex = header.indexOf('data_unit_key');
const nameIndex = header.indexOf('data_unit_name');
if (keyIndex === -1 || nameIndex === -1) {
  console.error('CSV headers not found:', header);
  process.exit(1);
}
const map = {};
for (const line of lines) {
  // split on commas not inside quotes
  const cols = line.split(/,(?=(?:[^']*'[^']*')*[^']*$)/g).map((v) => v.trim().replace(/^'|'$/g, ''));
  const k = cols[keyIndex];
  const n = cols[nameIndex];
  if (k && n) map[k] = n;
}
const out = `export const subjectUnitDisplayNameMap: Record<string, string> = ${JSON.stringify(map, null, 2)};

export const getSubjectUnitDisplayName = (unitKey: string): string => subjectUnitDisplayNameMap[unitKey] || unitKey;
`;
fs.writeFileSync('src/subjects/unit-display-name-map.ts', out, 'utf8');
console.log('generated src/subjects/unit-display-name-map.ts with', Object.keys(map).length, 'entries');
