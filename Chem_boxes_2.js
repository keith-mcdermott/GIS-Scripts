//Handle multiple contaminants
// Data format: Result - > 1, 1 U (evalutes number left of first space), or ND (1) (evaluates number in paranthesis) 
//Standard 1 indicated by *, 2 and 3 by shading


// ==============================================
// CONFIGURATION
// ==============================================
var FONT_NAME = "Consolas";
var FONT_SIZE = 8;

var contaminants = [
    { name: "BENZ", field: $feature.BENZ, standards: [1,2,5] },
    { name: "TCE",  field: $feature.TCE,  standards: [5,10] },
    { name: "PCB",  field: $feature.PCB,  standards: [0.5,1,2] },
    { name: "BAP",  field: $feature.BAP,  standards: [1.1,7,30] }
];

var location = $feature.Boring_ID;
var heading  = $feature.Sample_Depth;

// Adjust widths
var W_A = 6;
var W_R = 12;

var NBSP = "\u00A0";
var FIG  = "\u2007";

var lightYellow = [252,252,180,100];
var darkYellow  = [252,202,70,100];


// ==============================================
// UTILITY FUNCTIONS
// ==============================================
function ljust(val, width) {
    if (IsEmpty(val) || val == null) { val = ""; }

    var txt = Text(val);

    if (Count(txt) > width) {
        txt = Left(txt, width);
    }

    while (Count(txt) < width) {
        txt += NBSP;
    }

    return txt;
}

function fixedCell(val, width) {
    return FIG + ljust(val, width) + FIG;
}

function tableCell(val, bgColor) {
    var fnt = "<FNT NAME='" + FONT_NAME + "' SIZE='" + Text(FONT_SIZE) + "'>";

    return "<BGD red='" + bgColor[0] + "' green='" + bgColor[1] + "' blue='" + bgColor[2] + "' alpha='" + bgColor[3] + "' padding='1'>" +
           fnt + val + "</FNT></BGD>";
}


// ==============================================
// PARSING AND STYLING LOGIC
// ==============================================
function parseResult(rawVal) {

    if (IsEmpty(rawVal) || rawVal == null) {
        return { num: null, text: "NA" };
    }

    var txt = Trim(Text(rawVal));

    // Case: ND (0.2)
    if (Find("(", txt) > -1 && Find(")", txt) > -1) {
        var inner = Mid(txt, Find("(", txt)+1, Find(")", txt)-Find("(", txt)-1);
        var num = Number(inner);
        return { num: num, text: txt };
    }

    // Case: numeric first token like "0.15 U"
    var parts = Split(txt, " ");
    var n = Number(parts[0]);

    if (!IsNan(n)) {
        return { num: n, text: txt };
    }

    return { num: null, text: txt };
}


// ==============================================
// STYLE VALUE (ASTERISK LOGIC)
// ==============================================
function styleValue(rawVal, s) {

    var parsed = parseResult(rawVal);
    var n = parsed.num;
    var txt = parsed.text;

    var flag = "";

    // ==============================
    // FLAG LOGIC (IGNORE QUALIFIERS)
    // ==============================
    if (!(n == null)) {

        if (Count(s) >= 1 && n > s[0]) {
            flag = "*";
        }
    }

    // ==============================
    // DISPLAY (KEEP QUALIFIER AS IS)
    // ==============================
    var display = txt + flag;

    var padded = ljust(display, W_R);

    return fixedCell(padded, W_R);
}

// ==============================================
// BACKGROUND LOGIC
// ==============================================
function getBG(rawVal, s) {

    var parsed = parseResult(rawVal);
    var n = parsed.num;

    if (n == null) {
        return [0,0,0,0];
    }

    if (Count(s) >= 3 && n > s[2]) {
        return darkYellow;
    }

    if (Count(s) >= 2 && n > s[1]) {
        return lightYellow;
    }

    return [0,0,0,0];
}


// ==============================================
// TABLE CONSTRUCTION
// ==============================================
var tbl = "";

// Header
tbl += tableCell("<UND>" + fixedCell(location, W_A) + "</UND>", [0,0,0,0]) +
       tableCell("<UND>" + fixedCell(heading, W_R) + "</UND>", [0,0,0,0]);

// Rows
for (var i = 0; i < Count(contaminants); i++) {

    var c = contaminants[i];
    var rVal = c.field;

    var styled = styleValue(rVal, c.standards);
    var bg     = getBG(rVal, c.standards);

    tbl += TextFormatting.NewLine +
           tableCell(fixedCell(c.name, W_A), [0,0,0,0]) +
           tableCell(styled, bg);
}

return tbl;
