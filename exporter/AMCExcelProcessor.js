var XLSX = require("xlsx");

const MAX_COLS = 2;

var sheetToArray = (sheet) => {
    var result = [];
    var row;
    var rowNum;
    var colNum;
    var range = XLSX.utils.decode_range(sheet['!ref']);
    for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++)
    {
        row = [];
        for(colNum=range.s.c; colNum<=range.e.c; colNum++)
        {
            var nextCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: colNum})];
            if(typeof nextCell === "undefined")
                row.push(void 0);
            else 
                row.push(nextCell.w);
       }
       result.push(row);
   }
   return result;
};

exports.initAgencyMap = () => {
    const workingDir = `${require("path").dirname(require.main.filename)}`;
    var workbook;
    try {
        workbook = XLSX.readFile(`${workingDir}/exporter/AMC Master List.xlsx`);
    }
    catch(err) {
        workbook = XLSX.readFile(`${workingDir}/AMC Master List.xlsx`);
    }
    const agencies = sheetToArray(workbook.Sheets["Agency"]);
    const agencyIdMap = {};
    agencies.forEach((agency) => {
        var agencyName;
        var agencyExternalId;
        for(let col = 0; col < MAX_COLS; col++)
        {
            if(col == 0)
                agencyName = agency[col];
            else if(col == 1)
                agencyExternalId = agency[col];
        }
        agencyIdMap[agencyName] = agencyExternalId;
    });

    return agencyIdMap;
};
