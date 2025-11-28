// Arcade for ArGIS Pro

// ==============================
// User-configurable settings
// ==============================
var FONT_NAME = "Consolas";
var FONT_SIZE = 8;

// Standards per test: [S1, S2, S3] 
// Can provide 1, 2, or 3 values per test. Add more tests as needed.
// Standard 1 for Test1 - Displays underline if exceeded 
// Standard 2 for Test1 - Highlights light yellow if exceeded
// Standard 3 for Test1 - Highlights dark yellow and displays bold if exceeded

var standards = [
    [1, 2, 5],     // Test1
    [5, 10],       // Test2 (only S1 and S2)
    [0.5, 1, 2],   // Test3
    [9999, 1, 2.3] // Test4 (effectively disables S1)
];

// Field names. Add or remove tests as needed.
var analytes = [ $feature.Test1, $feature.Test2, $feature.Test3, $feature.Test4 ];
var results  = [ $feature.Test1Result, $feature.Test2Result, $feature.Test3Result, $feature.Test4Result ];
var quals    = [ $feature.Test1Qual, $feature.Test2Qual, $feature.Test3Qual, $feature.Test4Qual ];

// Column widths
var W_A = 20;
var W_R = 10;
var W_Q = 6;

// Background colors
var lightYellow = [252, 252, 180, 100];
var darkYellow  = [252, 202, 70, 100];

// ==============================
// Left-justify helper
// ==============================
function ljust(strVal, width) {
    if (IsEmpty(strVal) || strVal == null) { strVal = ""; }
    strVal = Text(strVal);
    if (Count(strVal) > width) { strVal = Left(strVal, width); }
    while (Count(strVal) < width) { strVal += " "; }
    return strVal;
}

// ==============================
// Table cell formatting
// ==============================
function tableCell(val, bgColor, fontStyle) {
    var fnt = "<FNT NAME='" + FONT_NAME + "' SIZE='" + Text(FONT_SIZE) + "' STYLE='" + fontStyle + "'>";
    return "<BGD red='" + bgColor[0] + "' green='" + bgColor[1] + "' blue='" + bgColor[2] + "' alpha='" + bgColor[3] + "' padding='0'>" + fnt + val + "</FNT></BGD>";
}

// ==============================
// Style numeric/text value
// ==============================
function styleValue(rawVal, idx, qual) {
    if (IsEmpty(rawVal) || rawVal == null) { return "ND"; }
    var n = Number(rawVal);
    if (n == null || IsNan(n)) { return Text(rawVal); }
    var s = standards[idx];
    var txt = Text(Round(n,4));

    // Skip formatting if qualifier is "U"
    if (Upper(qual) != "U") {
        if (Count(s) >= 1 && n > s[0]) { txt = "<UND>" + txt + "</UND>"; } // S1 -> underline
        if (Count(s) >= 3 && n > s[2]) { txt = "<BOL>" + txt + "</BOL>"; } // S3 -> bold
    }
    return txt;
}

// ==============================
// Build each row
// ==============================
function buildRow(i) {
    var aVal = analytes[i];
    var rVal = results[i];
    var qVal = quals[i];

    var aText = ljust(IIf(IsEmpty(aVal), "", aVal), W_A);
    var qText = ljust(IIf(IsEmpty(qVal), "", qVal), W_Q);

    var nVal = null;
    if (!(IsEmpty(rVal) || rVal == null)) {
        nVal = Number(rVal);
        if (IsNan(nVal)) { nVal = null; }
    }

    var styledR = styleValue(rVal, i, qVal);

    // Background for S2 or S3 exceedances (only if qual != "U")
    var rBG = [0,0,0,0];
    var qBG = [0,0,0,0];
    if (nVal != null && Upper(qVal) != "U") {
        if (Count(standards[i]) >= 3 && nVal > standards[i][2]) { // S3 exceedance
            rBG = darkYellow;
            qBG = darkYellow;
        } else if (Count(standards[i]) >= 2 && nVal > standards[i][1]) { // S2 exceedance
            rBG = lightYellow;
            qBG = lightYellow;
        }
    }

    var cellA = tableCell(aText, [0,0,0,0], "Regular");
    var cellR = tableCell(styledR, rBG, "Regular");
    var cellQ = tableCell(qText, qBG, "Regular");

    return cellA + cellR + cellQ;
}

// ==============================
// Assemble table
// ==============================
var tbl = "";

// Top row: SampleID and Sample_depth across full width
var totalWidth = W_A + W_R + W_Q;
var headerText = ljust("<UND>" + $feature.SampleID + " (" + $feature.Sample_depth + ")" + "</UND>", totalWidth);
tbl += tableCell(headerText, [0,0,0,0], "Regular");

// Data rows
for (var i = 0; i < Count(analytes); i++) {
    tbl += TextFormatting.NewLine + buildRow(i);
}

// ==============================
// Return final label
// ==============================
return tbl;
