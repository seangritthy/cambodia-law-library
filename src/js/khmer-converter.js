"use strict";
var KhmerConverter = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/khmer-unicode-converter/index.js
  var require_index = __commonJS({
    "node_modules/khmer-unicode-converter/index.js"(exports) {
      var len = (s) => typeof s === "string" ? s.length : "size" in s ? s.size : s.length;
      var unichr = String.fromCharCode;
      var ord = (c) => typeof c === "string" && c.length === 1 ? c.charCodeAt(0) : new Error("input must be a type of string and has 1 length");
      var SRAAA = unichr(6070);
      var SRAE = unichr(6081);
      var SRAOE = unichr(6078);
      var SRAOO = unichr(6084);
      var SRAYA = unichr(6079);
      var SRAIE = unichr(6080);
      var SRAAU = unichr(6085);
      var SRAII = unichr(6072);
      var SRAU = unichr(6075);
      var TRIISAP = unichr(6090);
      var MUUSIKATOAN = unichr(6089);
      var SAMYOKSANNYA = unichr(6096);
      var LA = unichr(6049);
      var NYO = unichr(6025);
      var BA = unichr(6036);
      var YO = unichr(6041);
      var SA = unichr(6047);
      var COENG = unichr(6098);
      var CORO = unichr(6098) + unichr(6042);
      var CONYO = unichr(6098) + unichr(6025);
      var SRAOM = unichr(6086);
      var MARK = unichr(6122);
      var DOTCIRCLE = "";
      var sraEcombining = {
        [SRAOE]: SRAII,
        [SRAYA]: SRAYA,
        [SRAIE]: SRAIE,
        [SRAOO]: SRAAA,
        [SRAAU]: SRAAU
      };
      var CC_RESERVED = 0;
      var CC_CONSONANT = 1;
      var CC_CONSONANT2 = 2;
      var CC_CONSONANT3 = 3;
      var CC_CONSONANT_SHIFTER = 5;
      var CC_ROBAT = 6;
      var CC_COENG = 7;
      var CC_DEPENDENT_VOWEL = 8;
      var CC_SIGN_ABOVE = 9;
      var CC_SIGN_AFTER = 10;
      var CF_CLASS_MASK = 65535;
      var CF_CONSONANT = 16777216;
      var CF_SPLIT_VOWEL = 33554432;
      var CF_DOTTED_CIRCLE = 67108864;
      var CF_COENG = 134217728;
      var CF_SHIFTER = 268435456;
      var CF_ABOVE_VOWEL = 536870912;
      var CF_POS_BEFORE = 524288;
      var CF_POS_BELOW = 262144;
      var CF_POS_ABOVE = 131072;
      var CF_POS_AFTER = 65536;
      var _xx = CC_RESERVED;
      var _sa = CC_SIGN_ABOVE | CF_DOTTED_CIRCLE | CF_POS_ABOVE;
      var _sp = CC_SIGN_AFTER | CF_DOTTED_CIRCLE | CF_POS_AFTER;
      var _c1 = CC_CONSONANT | CF_CONSONANT;
      var _c2 = CC_CONSONANT2 | CF_CONSONANT;
      var _c3 = CC_CONSONANT3 | CF_CONSONANT;
      var _rb = CC_ROBAT | CF_POS_ABOVE | CF_DOTTED_CIRCLE;
      var _cs = CC_CONSONANT_SHIFTER | CF_DOTTED_CIRCLE | CF_SHIFTER;
      var _dl = CC_DEPENDENT_VOWEL | CF_POS_BEFORE | CF_DOTTED_CIRCLE;
      var _db = CC_DEPENDENT_VOWEL | CF_POS_BELOW | CF_DOTTED_CIRCLE;
      var _da = CC_DEPENDENT_VOWEL | CF_POS_ABOVE | CF_DOTTED_CIRCLE | CF_ABOVE_VOWEL;
      var _dr = CC_DEPENDENT_VOWEL | CF_POS_AFTER | CF_DOTTED_CIRCLE;
      var _co = CC_COENG | CF_COENG | CF_DOTTED_CIRCLE;
      var _va = _da | CF_SPLIT_VOWEL;
      var _vr = _dr | CF_SPLIT_VOWEL;
      var khmerCharClasses = [
        _c1,
        _c1,
        _c1,
        _c3,
        _c1,
        _c1,
        _c1,
        _c1,
        _c3,
        _c1,
        _c1,
        _c1,
        _c1,
        _c3,
        _c1,
        _c1,
        // 1780 - 178F
        _c1,
        _c1,
        _c1,
        _c1,
        _c3,
        _c1,
        _c1,
        _c1,
        _c1,
        _c3,
        _c2,
        _c1,
        _c1,
        _c1,
        _c3,
        _c3,
        // 1790 - 179F
        _c1,
        _c3,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        _c1,
        // 17A0 - 17AF
        _c1,
        _c1,
        _c1,
        _c1,
        _dr,
        _dr,
        _dr,
        _da,
        _da,
        _da,
        _da,
        _db,
        _db,
        _db,
        _va,
        _vr,
        // 17B0 - 17BF
        _vr,
        _dl,
        _dl,
        _dl,
        _vr,
        _vr,
        _sa,
        _sp,
        _sp,
        _cs,
        _cs,
        _sa,
        _rb,
        _sa,
        _sa,
        _sa,
        // 17C0 - 17CF
        _sa,
        _sa,
        _co,
        _sa,
        _xx,
        _xx,
        _xx,
        _xx,
        _xx,
        _xx,
        _xx,
        _xx,
        _xx,
        _sa,
        _xx,
        _xx
        // 17D0 - 17DF
      ];
      var khmerStateTable = [
        // xx  c1  c2  c3 zwnj cs  rb  co  dv  sa  sp zwj
        [1, 2, 2, 2, 1, 1, 1, 6, 1, 1, 1, 2],
        //  0 - ground state
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        //  1 - exit state(or sign to the right of the
        //      syllable)
        [-1, -1, -1, -1, 3, 4, 5, 6, 16, 17, 1, -1],
        //  2 - Base consonant
        [-1, -1, -1, -1, -1, 4, -1, -1, 16, -1, -1, -1],
        //  3 - First ZWNJ before a register shifter
        //      It can only be followed by a shifter or a vowel
        [-1, -1, -1, -1, 15, -1, -1, 6, 16, 17, 1, 14],
        //  4 - First register shifter
        [-1, -1, -1, -1, -1, -1, -1, -1, 20, -1, 1, -1],
        //  5 - Robat
        [-1, 7, 8, 9, -1, -1, -1, -1, -1, -1, -1, -1],
        //  6 - First Coeng
        [-1, -1, -1, -1, 12, 13, -1, 10, 16, 17, 1, 14],
        //  7 - First consonant of type 1 after coeng
        [-1, -1, -1, -1, 12, 13, -1, -1, 16, 17, 1, 14],
        //  8 - First consonant of type 2 after coeng
        [-1, -1, -1, -1, 12, 13, -1, 10, 16, 17, 1, 14],
        //  9 - First consonant or type 3 after ceong
        [-1, 11, 11, 11, -1, -1, -1, -1, -1, -1, -1, -1],
        // 10 - Second Coeng(no register shifter before)
        [-1, -1, -1, -1, 15, -1, -1, -1, 16, 17, 1, 14],
        // 11 - Second coeng consonant(or ind.vowel) no
        //      register shifter before
        [-1, -1, -1, -1, -1, 13, -1, -1, 16, -1, -1, -1],
        // 12 - Second ZWNJ before a register shifter
        [-1, -1, -1, -1, 15, -1, -1, -1, 16, 17, 1, 14],
        // 13 - Second register shifter
        [-1, -1, -1, -1, -1, -1, -1, -1, 16, -1, -1, -1],
        // 14 - ZWJ before vowel
        [-1, -1, -1, -1, -1, -1, -1, -1, 16, -1, -1, -1],
        // 15 - ZWNJ before vowel
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, 17, 1, 18],
        // 16 - dependent vowel
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 18],
        // 17 - sign above
        [-1, -1, -1, -1, -1, -1, -1, 19, -1, -1, -1, -1],
        // 18 - ZWJ after vowel
        [-1, 1, -1, 1, -1, -1, -1, -1, -1, -1, -1, -1],
        // 19 - Third coeng
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1]
        // 20 - dependent vowel after a Robat
      ];
      function getCharClass(uniChar) {
        let ch = ord(uniChar[0]);
        if (ch >= 6016) {
          ch -= 6016;
          if (ch < len(khmerCharClasses)) {
            return khmerCharClasses[ch];
          }
        }
        return 0;
      }
      function reorder(sin) {
        let cursor = 0;
        let state = 0;
        let charCount = len(sin);
        let result = "";
        while (cursor < charCount) {
          let reserved = "";
          let signAbove = "";
          let signAfter = "";
          let base = "";
          let robat = "";
          let shifter = "";
          let vowelBefore = "";
          let vowelBelow = "";
          let vowelAbove = "";
          let vowelAfter = "";
          let coeng = false;
          let cluster = "";
          let coeng1 = "";
          let coeng2 = "";
          let shifterAfterCoeng = false;
          while (cursor < charCount) {
            const curChar = sin[cursor];
            const kChar = getCharClass(curChar);
            const charClass = kChar & CF_CLASS_MASK;
            state = khmerStateTable[state][charClass];
            if (state < 0) break;
            if (kChar === _xx) reserved = curChar;
            else if (kChar === _sa)
              signAbove = curChar;
            else if (kChar === _sp)
              signAfter = curChar;
            else if (kChar === _c1 || kChar === _c2 || kChar === _c3)
              if (coeng) {
                if (!coeng1) coeng1 = COENG + curChar;
                else coeng2 = COENG + curChar;
                coeng = false;
              } else base = curChar;
            else if (kChar === _rb)
              robat = curChar;
            else if (kChar === _cs) {
              if (coeng1) shifterAfterCoeng = true;
              shifter = curChar;
            } else if (kChar === _dl)
              vowelBefore = curChar;
            else if (kChar === _db)
              vowelBelow = curChar;
            else if (kChar === _da)
              vowelAbove = curChar;
            else if (kChar === _dr)
              vowelAfter = curChar;
            else if (kChar === _co)
              coeng = true;
            else if (kChar === _va) {
              vowelBefore = SRAE;
              vowelAbove = sraEcombining[curChar];
            } else if (kChar === _vr) {
              vowelBefore = SRAE;
              vowelAfter = sraEcombining[curChar];
            }
            cursor += 1;
          }
          if (coeng1 && vowelBelow) vowelBelow = MARK + vowelBelow;
          else if ((base === LA || base === NYO) && vowelBelow)
            vowelBelow = MARK + vowelBelow;
          else if (coeng1 && vowelBefore && vowelAfter)
            vowelAfter = MARK + vowelAfter;
          let coengBefore = "";
          if (coeng1 === CORO) {
            coengBefore = coeng1;
            coeng1 = "";
          } else if (coeng2 === CORO) {
            coengBefore = MARK + coeng2;
            coeng2 = "";
          }
          if (coeng1 || coeng2) {
            if (base === NYO) {
              base = MARK + base;
              if (coeng1 === CONYO) coeng1 = MARK + coeng1;
            }
            if (coeng1 && coeng2) coeng2 = MARK + coeng2;
          }
          if (base && shifter) {
            if (vowelAbove && base === BA && shifter === TRIISAP)
              vowelAbove = MARK + vowelAbove;
            else if (vowelAbove) shifter = MARK + shifter;
            else if (signAbove === SAMYOKSANNYA && shifter === MUUSIKATOAN)
              shifter = MARK + shifter;
            else if (signAbove && vowelAfter) shifter = MARK + shifter;
            else if (signAbove) signAbove = MARK + signAbove;
            if (coeng1 && (vowelAbove || signAbove)) shifter = MARK + shifter;
            if (base === LA || base === NYO) shifter = MARK + shifter;
          }
          if (coeng && !coeng1) coeng1 = COENG;
          else if (coeng && !coeng2) coeng2 = MARK + COENG;
          if (!base && (vowelBefore || coengBefore || robat || shifter || coeng1 || coeng2 || vowelAfter || vowelBelow || vowelAbove || signAbove || signAfter))
            base = DOTCIRCLE;
          let shifter1 = "";
          let shifter2 = "";
          if (shifterAfterCoeng) shifter2 = shifter;
          else shifter1 = shifter;
          let specialCaseBA = false;
          if (base === BA && (vowelAfter === SRAAA || vowelAfter === SRAAU || vowelAfter === MARK + SRAAA || vowelAfter === MARK + SRAAU)) {
            vowelAfter = vowelAfter[vowelAfter.length - 1];
            specialCaseBA = true;
            if (coeng1 && [BA, YO, SA].includes(coeng1[coeng1.length - 1]))
              specialCaseBA = false;
          }
          if (specialCaseBA)
            cluster = vowelBefore + coengBefore + base + vowelAfter + robat + shifter1 + coeng1 + coeng2 + shifter2 + vowelBelow + vowelAbove + signAbove + signAfter;
          else
            cluster = vowelBefore + coengBefore + base + robat + shifter1 + coeng1 + coeng2 + shifter2 + vowelBelow + vowelAbove + vowelAfter + signAbove + signAfter;
          result += cluster + reserved;
          state = 0;
        }
        return result;
      }
      var LIMON_REPLACERS = [
        [48, "\u17E0"],
        [49, "\u17E1"],
        [50, "\u17E2"],
        [51, "\u17E3"],
        [52, "\u17E4"],
        [53, "\u17E5"],
        [54, "\u17E6"],
        [55, "\u17E7"],
        [56, "\u17E8"],
        [57, "\u17E9"],
        //
        [43, "\u17CE"],
        [44, "\u17D2\u1794"],
        [60, "\u17D2\u1796"],
        [65, "\u17C5"],
        [66, "\u1796"],
        [67, "\u1787"],
        [68, "\u178C"],
        [69, "\u17C2"],
        [70, "\u1792"],
        [71, "\u17A2"],
        [73, "\u17B8"],
        [74, "\u17D2\u1789"],
        [75, "\u1782"],
        [77, "\u17C6"],
        [78, "\u178E"],
        [79, "\u17BF"],
        [80, "\u1797"],
        [81, "\u1788"],
        [82, "\u17D2\u179A"],
        [84, "\u1791"],
        [85, "\u17BC"],
        [86, "\u17D2\u179C"],
        [87, "\u17BA"],
        [88, "\u1783"],
        [89, "\u17BD"],
        [90, "\u178D"],
        [95, "\u17CD"],
        [97, "\u17B6"],
        [98, "\u1794"],
        [99, "\u1785"],
        [100, "\u178A"],
        [101, "\u17C1"],
        [102, "\u1790"],
        [103, "\u1784"],
        [104, "\u17A0"],
        [105, "\u17B7"],
        [106, "\u1789"],
        [107, "\u1780"],
        [108, "\u179B"],
        [109, "\u1798"],
        [110, "\u1793"],
        [111, "\u17C0"],
        [112, "\u1795"],
        [113, "\u1786"],
        [114, "\u179A"],
        [115, "\u179F"],
        [116, "\u178F"],
        [117, "\u17BB"],
        [118, "\u179C"],
        [119, "\u17B9"],
        [120, "\u1781"],
        [121, "\u1799"],
        [122, "\u178B"],
        [162, "\u17D2\u1787"],
        [167, "\u17D2\u1792"],
        [169, "\u17D2\u1785"],
        [181, "\u17D2\u1798"],
        [182, "\u17D2\u1784"],
        [190, "\u17CF"],
        [196, "\u17D2\u1788"],
        [198, "\u17D2\u178D"],
        [199, "\u17D2\u1783"],
        [201, "\u17AF"],
        [208, "\u17D2\u178C"],
        [209, "\u17D2\u178E"],
        [214, "\u17D2\u1797"],
        [222, "\u17D2\u1791"],
        [228, "\u17D2\u1786"],
        [230, "\u17D2\u178B"],
        [231, "\u17D2\u1781"],
        [233, "\u17C3"],
        [241, "\u17D2\u1793"],
        [246, "\u17D2\u1795"],
        [248, "\u17D2\u179B"],
        [252, "\u17D2\u1799"],
        [254, "\u17D2\u178F"],
        [[66, 167], "\u17B0"],
        [[71, 97], "\u17A2\u17B6"],
        [[46, 108, 46], "\u17D8"],
        //
        [174, "\u17EA\u17D2\u179A"],
        [197, "\u17EA\u17BA"],
        [205, "\u17EA\u17B8"],
        [211, "\u17EA\u17BF"],
        [216, "\u17EA\u17D2\u1789"],
        [218, "\u17EA\u17BC"],
        [220, "\u17EA\u17BD"],
        [229, "\u17EA\u17B9"],
        [237, "\u17EA\u17B7"],
        [243, "\u17EA\u17C0"],
        [250, "\u17EA\u17BB"],
        [71, "\u17A3"],
        [[66, 97], "\u17EA\u1789"],
        [117, "\u17EA\u17C9"],
        [117, "\u17EA\u17CA"],
        [250, "\u17EA\u17EA\u17CA"],
        [250, "\u17EA\u17EA\u17C9"],
        // limon parent
        [33, "1"],
        [35, "3"],
        [36, "4"],
        [37, "5"],
        [38, "7"],
        [40, "9"],
        [[41, 97], "\u1794\u17B6"],
        [[41, 65], "\u1794\u17C5"],
        [42, "8"],
        [46, "\u17D4"],
        [58, "\u17C9"],
        [61, "="],
        [62, "."],
        [64, "2"],
        [72, "\u17C7"],
        [76, "\u17A1"],
        [83, "\u17D2\u179F"],
        [92, "\u17A5"],
        [93, "\u17A7"],
        [94, "6"],
        [123, "\u201C"],
        [124, "\u17A6"],
        [125, "\u201D"],
        [8216, "\u17CA"],
        [8217, "\u17CC"],
        [161, "!"],
        [165, "\u17D2\u17A2"],
        [171, "\u17AA"],
        [178, "\u17D7"],
        [179, "\u17C8"],
        [185, "\u17DB"],
        [187, "\u17B1"],
        [189, "\u17D0"],
        [193, "\u17D2\u1782"],
        [215, "\u17B7\u17CD"],
        [223, "\u17D2\u1790"],
        [225, "\u17D2\u1780"],
        [240, "\u17D2\u17A0"],
        [247, "+"],
        [[93, 95], "\u17B3"],
        [[93, 117], "\u17A9"],
        [[66, 163], "\u17AD"],
        [[98, 163], "\u17AB"],
        [[66, 164], "\u17AE"],
        [[98, 164], "\u17AC"],
        [179, "\u17D6"],
        [191, "\u17EA\u17C6"],
        // limon s1
        [59, "\u17CB"],
        [91, "\u17B1\u17D2\u1799"],
        [166, ")"],
        [172, "("],
        [176, "%"],
        [180, "\u1781\u17D2\u1789\u17BB\u17C6"],
        [188, "/"],
        [[93, 8216], "\u17A8"],
        [46, "\u17D5"],
        [91, "\u17B2\u17D2\u1799"],
        [180, "\u1781\u17D2\u1789\u17EA\u17BB\u17C6"],
        [187, "\u17B2"],
        [254, "\u17D2\u178A"]
      ];
      LIMON_REPLACERS.reverse();
      LIMON_REPLACERS = LIMON_REPLACERS.map(([replacement, replacer]) => {
        if (Array.isArray(replacement)) return [unichr(...replacement), replacer];
        return [unichr(replacement), replacer];
      });
      var LIMON_TO_UNI_MAP = LIMON_REPLACERS.map(([replacement, replacer]) => {
        return [replacement, replacer];
      });
      LIMON_TO_UNI_MAP.push(["<ú", "ពុ"]);
      LIMON_TO_UNI_MAP.push(["<", "ព"]);
      LIMON_TO_UNI_MAP.push(["μ", "្ម"]);
      LIMON_TO_UNI_MAP.push(["ø", "្ល"]);
      LIMON_TO_UNI_MAP.push(["Pø", "ផ្ល"]);
      LIMON_TO_UNI_MAP.push(["BaØ", "បញ្ញ"]);
      LIMON_TO_UNI_MAP.push(["Ba៪", "បញ្ញ"]);
      LIMON_TO_UNI_MAP.push(["bBaØ", "ប្បញ្ញ"]);
      LIMON_TO_UNI_MAP.sort((a, b) => b[0].length - a[0].length);

      function limonToUnicode(text) {
        if (!text) return '';
        let result = text;
        result = result.replace(/eR([a-zA-Z\u0080-\u00ff])/g, '$1Re');
        result = result.replace(/ER([a-zA-Z\u0080-\u00ff])/g, '$1RE');
        result = result.replace(/R([a-zA-Z\u0080-\u00ff])/g, '$1R');
        result = result.replace(/e([a-zA-Z\u0080-\u00ff])/g, '$1e');
        result = result.replace(/E([a-zA-Z\u0080-\u00ff])/g, '$1E');

        for (let [asciiStr, uniStr] of LIMON_TO_UNI_MAP) {
          if (asciiStr && asciiStr !== ' ') {
            result = result.replaceAll(asciiStr, uniStr);
          }
        }

        result = result.replace(/\u17c1\u17b8/g, '\u17be');
        result = result.replace(/\u17c1\u17b6/g, '\u17c4');
        result = result.replace(/\u17c1\u17c3/g, '\u17c3');
        result = result.replace(/\u17c1\u17be/g, '\u17be');
        result = result.replace(/\u17c1\u17c4/g, '\u17c4');
        result = result.replace(/\u17d2\u17d2/g, '\u17d2');
        return result;
      }

      function limon(text) {
        text = reorder(text);
        text = text.replace(/[\u1780-\u17ff]\u17ca\u17b7/gm, "ui");
        text = text.replace(/[\u1780-\u17ff]\u17ca\u17b8/gm, "uI");
        text = text.replace(/[\u1780-\u17ff]\u17ca\u17b9/gm, "uw");
        text = text.replace(/[\u1780-\u17ff]\u17ca\u17ba/gm, "uW");
        text = text.replace(/[\u1780-\u17ff]\u17c9\u17b7/gm, "ui");
        text = text.replace(/[\u1780-\u17ff]\u17c9\u17b8/gm, "uI");
        text = text.replace(/[\u1780-\u17ff]\u17c9\u17b9/gm, "uw");
        text = text.replace(/[\u1780-\u17ff]\u17c9\u17ba/gm, "uW");
        for (let [replacement, replacer] of LIMON_REPLACERS) {
          if (replacer.includes("\u17D2")) {
            text = text.replaceAll(replacer, replacement);
          }
        }
        for (let [replacement, replacer] of LIMON_REPLACERS) {
          if (!replacer.includes("\u17D2")) {
            text = text.replaceAll(replacer, replacement);
          }
        }
        return text.replace(/\u17ea/g, "");
      }
      exports.limon = limon;
      exports.limonToUnicode = limonToUnicode;
    }
  });
  return require_index();
})();
if (typeof module !== "undefined" && module.exports) {
  module.exports = KhmerConverter;
}
