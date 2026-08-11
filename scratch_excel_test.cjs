const XLSX = require('xlsx-js-style');

const wb = XLSX.utils.book_new();

const data = [
  [{ v: 13659600, t: 'n', s: { numFmt: '"$" #,##0.00;-"$" #,##0.00;"-";@' } }],
  [{ v: 13659600, t: 'n', s: { numFmt: '_-$* #,##0.00_-;-$* #,##0.00_-;_-$* "-"??_-;_-@_-' } }],
  [{ v: 13659600, t: 'n', z: '_-$* #,##0.00_-;-$* #,##0.00_-;_-$* "-"??_-;_-@_-' }],
  [{ v: 13659600, t: 'n', z: '"$" #,##0.00' }]
];

const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, 'test.xlsx');
console.log("Done");
