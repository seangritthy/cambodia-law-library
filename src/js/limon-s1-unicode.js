/**
 * Limon S1 / Legacy Khmer Font to Khmer Unicode Converter
 * Specifically tailored for Cambodia Law Library (ក្រមព្រហ្មទណ្ឌ & Royal Gazette PDFs)
 */

(function (global) {
    // 1. Common Limon S1 structural mapping matrix
    const STRUCTURAL_MAP = [
        ["RbsinebI", "ប្រសិនបើ"],
        ["karpþnÞaeTas", "ការផ្តន្ទាទោស"],
        ["CasßaBr", "ជាស្ថាពរ"],
        ["RtUv)an", "ត្រូវបាន"],
        ["Rbkas", "ប្រកាស"],
        ["rYcmkehIy", "រួចមកហើយ"],
        ["eTasEdl", "ទោសដែល"],
        ["ecjGMBI", "ចេញអំពី"],
        ["eTasenH", "ទោសនេះ"],
        ["minRtUvGnuvtþeT", "មិនត្រូវអនុវត្តទេ"],
        ["b¤RtUvEtQb;Gnuvtþ", "ឬត្រូវតែឈប់អនុវត្ត"],
        ["maRta 10", "មាត្រា ១០"],
        ["karGnuvtþc,ab;RBhμTNÐEdlRsalCag", "ការអនុវត្តច្បាប់ព្រហ្មទណ្ឌដែលស្រាលជាង"],
        ["b¤F¶n;Cag", "ឬធ្ងន់ជាង"],
        ["bTb,BaØtþifμIEdlEcgGMBIeTasEdlRsalCagRtUvGnuvtþPøam", "បទប្បញ្ញត្តិថ្មីដែលចែងអំពីទោសដែលស្រាលជាងត្រូវអនុវត្តភ្លាម"],
        ["bu:Enþ", "ប៉ុន្តែ"],
        ["rehIyenaH", "ហើយនោះ"],
        ["RtUvGnuvtþ", "ត្រូវអនុវត្ត"],
        ["eTaHbIeTasEdlRbkasenaHF¶n;F¶r", "ទោះបីទោសដែលប្រកាសនោះធ្ងន់ធ្ងរ"],
        ["y:agNak¾eday", "យ៉ាងណាក៏ដោយ"],
        ["nwgRtUvGnuvtþEteTAelIGMeBIEdl", "នឹងត្រូវអនុវត្តតែទៅលើអំពើដែល"],
        [")anRbRBwtþeRkaykarcUlCaFrmanénbTb,BaØtþienaH", "បានប្រព្រឹត្តក្រោយការចូលជាធរមាននៃបទប្បញ្ញត្តិនេះ"],
        ["maRta 11", "មាត្រា ១១"],
        ["suBlPaBénkic©nItiviFI", "សុពលភាពនៃកិច្ចនីតិវិធី"],
        ["KμanGanuPaBeTAelI", "គ្មានអនុភាពទៅលើ"],
        ["Edl)anbMeBjRsbtambTb,BaØtþicas;eLIy", "ដែលបានបំពេញស្របតាមបទប្បញ្ញត្តិចាស់ឡើយ"],
        ["CMBUkTI 3", "ជំពូកទី ៣"],
        ["karGnuvtþc,ab;RBhμTNÐkm<úCaenAkñúglMh", "ការអនុវត្តច្បាប់ព្រហ្មទណ្ឌកម្ពុជានៅក្នុងលំហ"],
        ["EpñkTI 1", "ផ្នែកទី ១"],
        ["bTelμIsEdl)anRbRBwtþ", "បទល្មើសដែលបានប្រព្រឹត្ត"],
        ["b¤cat;fa)anRbRBwtþenAelIEdndI", "ឬចាត់ថាបានប្រព្រឹត្តនៅលើដែនដី"],
        ["énRBHraCaNacRkkm<úCa", "នៃព្រះរាជាណាចក្រកម្ពុជា"],
        ["maRta 12", "មាត្រា ១២"],
        ["eKalkarN_EdndIénkarGnuvtþc,ab;RBhμTNÐkm<úCa", "គោលការណ៍ដែនដីនៃការអនុវត្តច្បាប់ព្រហ្មទណ្ឌកម្ពុជា"],
        ["kñúgerOgRBhμTNÐ", "ក្នុងរឿងព្រហ្មទណ្ឌ"],
        ["c,ab;km<úCaRtUvGnuvtþeTAelIbTelμIsTaMgLayEdl", "ច្បាប់កម្ពុជាត្រូវអនុវត្តទៅលើបទល្មើសទាំងឡាយដែល"],
        [")anRbRBwtþenAelIEdndIénRBHraCaNacRkkm<úCa", "បានប្រព្រឹត្តនៅលើដែនដីនៃព្រះរាជាណាចក្រកម្ពុជា"],
        ["EdndIénRBHraCaNacRkkm<úCa", "ដែនដីនៃព្រះរាជាណាចក្រកម្ពុជា"],
        ["rYmbBa©ÚlTaMglMhGakas", "រួមបញ្ចូលទាំងលំហអាកាស"],
        ["nigsmuRT", "និងសមុទ្រ"],
        ["EdlmancMNgcgP¢ab;nwgEdndIénRBHraCaNacRkkm<úCa", "ដែលមានចំណងភ្ជាប់នឹងដែនដីនៃព្រះរាជាណាចក្រកម្ពុជា"],
        ["maRta 13", "មាត្រា ១៣"],
        ["TIkEnøgRbRBwtþbTelμIs", "ទីកន្លែងប្រព្រឹត្តបទល្មើស"],
        ["bTelμIsRtUv)ancat;faRbRBwtþenAelIEdndIénRBHraCaNacRkkm<úCaenA", "បទល្មើសត្រូវបានចាត់ថាប្រព្រឹត្តនៅលើដែនដីនៃព្រះរាជាណាចក្រកម្ពុជានៅ"],

        // Royal Gazette ABC Font Mapping
        ["ƶ្ឋ", "ថ្ងៃ"], ["ȭ", "ឆ្ន"], ["ŏ", "ា"], ["ŷ", "លេ"], ["Ȼ", "ប្ត"],
        ["ŋ", "ា"], ["ƶ", "ថ្ងៃ"], ["ƃ", "ខែ"], ["Ĝ", "ិ"], ["è", "្ឆ"],
        ["ȧ", "កា"], ["Ɂ", "រា"], ["ç", "្ច"], ["Ʒ", "ព្រ"], ["ƞ", "្ន"],
        ["Ɨ", "ត្រ"], ["ƚ", "ថ្ល"], ["Ɩ", "ក្រ"], ["ƴ", "ម្ភ"], ["Ƶ", "ធ្ន"],
        ["Ʊ", "ប្រ"], ["Ʋ", "ព្រ"], ["Ʈ", "ត្រ"], ["Ƴ", "គ្រ"], ["ƙ", "ក្ន"],
        ["ƥ", "ផ្ល"], ["ƨ", "ស្អ"], ["Ʃ", "ស្ម"], ["ƪ", "ស្យ"], ["ƫ", "ស្រ"],
        ["Ƭ", "ស្ល"], ["ƭ", "ស្វ"],

        // Compound cluster rules
        ["pþnÞ", "ផ្តន្ទ"], ["pþ", "ផ្ត"], ["nÞ", "ន្ទ"], ["ae", "ោ"], ["CasßaBr", "ជាស្ថាពរ"],
        ["F¶", "ធ្ង"], ["c,", "ច្ប"], ["BaØ", "ប្បញ្ញ"], ["ifμ", "ិថ្ម"], ["Pø", "ភ្ល"],
        ["km<úCa", "កម្ពុជា"], ["kñúg", "ក្នុង"], ["lMh", "លំហ"], ["Epñk", "ផ្នែក"],
        ["bTelμIs", "បទល្មើស"], ["EdndI", "ដែនដី"], ["RBHraCaNacRk", "ព្រះរាជាណាចក្រ"],
        ["eKal", "គោល"], ["cMNg", "ចំណង"], ["P¢ab;", "ភ្ជាប់"], ["TIkEnøg", "ទីកន្លែង"],
        ["Rb", "ប្រ"], ["Rt", "ត្រ"], ["Rc", "ជ្រ"], ["Rk", "ក្រ"], ["Rg", "គ្រ"], ["Rs", "ស្រ"], ["Rh", "ហ្រ"],
        ["ebI", "បើ"], ["eTa", "ទោ"], ["eKa", "គោ"], ["eLI", "ឡើ"], ["enaH", "នោះ"], ["eTaH", "ទោះ"], ["enH", "នេះ"]
    ];

    const LIMON_CONS = new Set([
        "ក","ខ","គ","ឃ","ង","ច","ឆ","ជ","ឈ","ញ","ដ","ឋ","ឌ","ឍ","ណ",
        "ត","ថ","ទ","ធ","ន","ប","ព","ម","យ","រ","ល","វ","ស","ហ","ឡ","អ"
    ]);

    const PRE_VOWELS = { "e": "េ", "E": "ែ", "o": "ោ", "O": "ៅ" };

    const LIMON_MAP = {
        "k": "ក", "x": "ខ", "g": "គ", "X": "ឃ", "c": "ង",
        "j": "ច", "q": "ឆ", "h": "ជ", "Q": "ឈ", "B": "ញ",
        "d": "ដ", "b": "ឋ", "D": "ឌ", "ß": "ឍ", "N": "ណ",
        "t": "ត", "f": "ថ", "T": "ទ", "F": "ធ", "n": "ន",
        "p": "ប", "P": "ព", "m": "ម", "y": "យ", "r": "រ",
        "l": "ល", "v": "វ", "s": "ស", "a": "អ", "L": "ឡ",
        "A": "ា", "i": "ិ", "I": "ី", "w": "ឹ", "W": "ឺ",
        "u": "ុ", "U": "ូ", "Y": "ួ",
        "K": "្ក", "C": "្ង", "J": "្ច", "H": "្ជ", "R": "្រ", "S": "្ស", "V": "្វ",
        "æ": "្ឋ", "μ": "្ម", "Ø": "ញ្ញ", "é": "នៃ", "<": "្ក",
        "M": "ំ", "H": "ះ", "¡": "៉", "¢": "៊", "£": "់",
        "0": "០", "1": "១", "2": "២", "3": "៣", "4": "៤",
        "5": "៥", "6": "៦", "7": "៧", "8": "៨", "9": "៩"
    };

    /**
     * Automatic detection of Limon S1 pattern
     */
    function looksLikeLimonS1(text) {
        if (!text) return false;
        const legacyPatterns = [
            'Rbs', 'kar', 'c,ab', 'RBh', 'maRta', 'Gnuvtþ',
            'b¤', ')an', 'Edl', 'pþnÞ', 'CasßaBr', 'eTas', 'bTb,BaØtþ'
        ];

        let matches = 0;
        for (const pattern of legacyPatterns) {
            if (text.includes(pattern)) {
                matches++;
            }
        }
        return matches >= 2;
    }

    /**
     * Limon S1 to Khmer Unicode Conversion
     */
    function limonS1ToUnicode(str) {
        if (!str) return '';

        let processed = str;
        for (const [k, v] of STRUCTURAL_MAP) {
            processed = processed.replaceAll(k, v);
        }

        let out = [];
        let pendingVowel = null;

        for (let i = 0; i < processed.length; i++) {
            const ch = processed[i];
            if (PRE_VOWELS[ch]) {
                pendingVowel = PRE_VOWELS[ch];
                continue;
            }

            const mapped = LIMON_MAP[ch] || ch;
            out.push(mapped);

            if (pendingVowel && LIMON_CONS.has(mapped)) {
                out.push(pendingVowel);
                pendingVowel = null;
            }
        }
        if (pendingVowel) out.push(pendingVowel);

        try { return out.join('').normalize('NFC'); } catch(e) { return out.join(''); }
    }

    /**
     * Main Smart PDF Text Converter
     */
    function convertPdfTextToKhmer(text, forceMode = null) {
        if (!text) return '';
        if (forceMode === 'unicode') return text.normalize('NFC');
        if (forceMode === 'limon' || looksLikeLimonS1(text)) {
            return limonS1ToUnicode(text);
        }
        return text;
    }

    // Expose to global window
    global.limonS1ToUnicode = limonS1ToUnicode;
    global.looksLikeLimonS1 = looksLikeLimonS1;
    global.convertPdfTextToKhmer = convertPdfTextToKhmer;

})(typeof window !== 'undefined' ? window : this);
