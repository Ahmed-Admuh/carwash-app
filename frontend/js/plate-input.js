// plate-input.js — renders a Saudi-style license plate widget: Arabic row on
// top, English row on the bottom, exactly like a real KSA plate. Typing a
// digit or letter in EITHER script instantly fills in its counterpart in
// the other script, cell by cell, using the official Saudi plate
// letter/digit table. Two hidden inputs keep the final EN letters/digits so
// existing form-submit code doesn't need to change.

const KsaPlate = (function () {
  // Official Arabic → Latin letter table used on real Saudi plates
  // (source: General Directorate of Traffic plate spec / Wikipedia).
  const AR_TO_EN_LETTER = {
    "ا": "A", "أ": "A", "إ": "A", "آ": "A",
    "ب": "B",
    "ح": "J",
    "د": "D",
    "ر": "R",
    "س": "S",
    "ص": "X",
    "ط": "T",
    "ع": "E",
    "ق": "G",
    "ك": "K",
    "ل": "L",
    "م": "Z",
    "ن": "N",
    "ه": "H", "\u0647\u0640": "H",
    "و": "U",
    "ى": "V", "ي": "V"
  };
  const EN_TO_AR_LETTER = {
    A: "ا", B: "ب", J: "ح", D: "د", R: "ر", S: "س", X: "ص", T: "ط",
    E: "ع", G: "ق", K: "ك", L: "ل", Z: "م", N: "ن", H: "ه", U: "و", V: "ى"
  };
  const VALID_EN_LETTERS = Object.keys(EN_TO_AR_LETTER);

  const AR_TO_EN_DIGIT = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
  const EN_TO_AR_DIGIT = { "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤", "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩" };

  function cellRow(prefix, count, extraClass) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `<input type="text" maxlength="1" class="ksa-cell ${extraClass}" data-idx="${i}" autocomplete="off" inputmode="${extraClass.includes('digit') ? 'numeric' : 'text'}">`;
    }
    return html;
  }

  function render(container) {
    container.innerHTML = `
      <div class="ksa-plate-widget">
        <div class="ksa-plate-body">
          <div class="ksa-plate-row">
            <div class="ksa-cell-group" data-role="digits-ar">${cellRow("da", 4, "ksa-cell-digit ksa-cell-ar")}</div>
            <div class="ksa-cell-divider"></div>
            <div class="ksa-cell-group" data-role="letters-ar">${cellRow("la", 3, "ksa-cell-letter ksa-cell-ar")}</div>
          </div>
          <div class="ksa-plate-row-sep"></div>
          <div class="ksa-plate-row">
            <div class="ksa-cell-group" data-role="digits-en">${cellRow("de", 4, "ksa-cell-digit ksa-cell-en")}</div>
            <div class="ksa-cell-divider"></div>
            <div class="ksa-cell-group" data-role="letters-en">${cellRow("le", 3, "ksa-cell-letter ksa-cell-en")}</div>
          </div>
        </div>
        <div class="ksa-plate-strip">
          <div class="ksa-plate-emblem">&#x1F1F8;&#x1F1E6;</div>
          <div class="ksa-plate-ksa">KSA</div>
        </div>
      </div>`;
  }

  function cellsOf(container, role) {
    return Array.from(container.querySelectorAll(`[data-role="${role}"] .ksa-cell`));
  }

  function focusNext(cells, idx) {
    if (cells[idx + 1]) cells[idx + 1].focus();
  }
  function focusPrev(cells, idx) {
    if (cells[idx - 1]) cells[idx - 1].focus();
  }

  function init(config) {
    const container = document.getElementById(config.containerId);
    if (!container) return null;
    render(container);

    const lettersAr = cellsOf(container, "letters-ar");
    const lettersEn = cellsOf(container, "letters-en");
    const digitsAr = cellsOf(container, "digits-ar");
    const digitsEn = cellsOf(container, "digits-en");

    function emitChange() {
      const letters = lettersEn.map(c => c.value).join("");
      const digits = digitsEn.map(c => c.value).join("");
      const hiddenLetters = document.getElementById(config.hiddenLettersId);
      const hiddenDigits = document.getElementById(config.hiddenDigitsId);
      if (hiddenLetters) hiddenLetters.value = letters;
      if (hiddenDigits) hiddenDigits.value = digits;
      if (config.onChange) config.onChange(letters, digits);
    }

    function wireLetterPair(enCells, arCells) {
      enCells.forEach((enCell, i) => {
        enCell.addEventListener("input", () => {
          const ch = enCell.value.toUpperCase();
          if (ch && !VALID_EN_LETTERS.includes(ch)) { enCell.value = ""; return; }
          enCell.value = ch;
          arCells[i].value = ch ? EN_TO_AR_LETTER[ch] : "";
          if (ch) focusNext(enCells, i);
          emitChange();
        });
        enCell.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !enCell.value) focusPrev(enCells, i);
        });
      });
      arCells.forEach((arCell, i) => {
        arCell.addEventListener("input", () => {
          const ch = arCell.value;
          const mapped = AR_TO_EN_LETTER[ch];
          if (ch && !mapped) { arCell.value = ""; return; }
          enCells[i].value = mapped || "";
          if (mapped) focusNext(arCells, i);
          emitChange();
        });
        arCell.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !arCell.value) focusPrev(arCells, i);
        });
      });
    }

    function wireDigitPair(enCells, arCells) {
      enCells.forEach((enCell, i) => {
        enCell.addEventListener("input", () => {
          const ch = enCell.value;
          if (ch && !/^[0-9]$/.test(ch)) { enCell.value = ""; return; }
          arCells[i].value = ch ? EN_TO_AR_DIGIT[ch] : "";
          if (ch) focusNext(enCells, i);
          emitChange();
        });
        enCell.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !enCell.value) focusPrev(enCells, i);
        });
      });
      arCells.forEach((arCell, i) => {
        arCell.addEventListener("input", () => {
          const ch = arCell.value;
          const mapped = AR_TO_EN_DIGIT[ch];
          if (ch && !mapped) { arCell.value = ""; return; }
          enCells[i].value = mapped || "";
          if (mapped) focusNext(arCells, i);
          emitChange();
        });
        arCell.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !arCell.value) focusPrev(arCells, i);
        });
      });
    }

    wireLetterPair(lettersEn, lettersAr);
    wireDigitPair(digitsEn, digitsAr);

    // Optional pre-fill (e.g. editing an existing vehicle).
    if (config.initialLetters) {
      config.initialLetters.toUpperCase().split("").forEach((ch, i) => {
        if (lettersEn[i] && VALID_EN_LETTERS.includes(ch)) {
          lettersEn[i].value = ch;
          lettersAr[i].value = EN_TO_AR_LETTER[ch];
        }
      });
    }
    if (config.initialDigits) {
      config.initialDigits.split("").forEach((ch, i) => {
        if (digitsEn[i] && /^[0-9]$/.test(ch)) {
          digitsEn[i].value = ch;
          digitsAr[i].value = EN_TO_AR_DIGIT[ch];
        }
      });
    }
    emitChange();

    return {
      reset() {
        [...lettersEn, ...lettersAr, ...digitsEn, ...digitsAr].forEach(c => c.value = "");
        emitChange();
      },
      getValue() {
        return { letters: lettersEn.map(c => c.value).join(""), digits: digitsEn.map(c => c.value).join("") };
      },
      isValid() {
        const letters = lettersEn.map(c => c.value).join("");
        const digits = digitsEn.map(c => c.value).join("");
        return letters.length >= 1 && digits.length >= 1;
      }
    };
  }

  return { init };
})();
