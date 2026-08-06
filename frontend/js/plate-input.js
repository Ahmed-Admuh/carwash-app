// plate-input.js — renders a Saudi-style license plate widget: Arabic row on
// top, English row on the bottom, exactly like a real KSA plate.
//
// Interaction rules:
//  - Digits are always entered left-to-right (start at the leftmost box,
//    cursor moves right as you type) — true in both the Arabic and English
//    digit row.
//  - Letters are always entered right-to-left (start at the rightmost box,
//    cursor moves left as you type) — true in both the Arabic and English
//    letter row, since that's the natural reading direction for the
//    Arabic word, and the English row mirrors the same physical columns.
//  - Typing detects the script of the character itself: if you type an
//    English character while a box in the Arabic row has focus, it's
//    written into the matching English box instead (and mirrored back into
//    Arabic), and the cursor continues in the English row from there on —
//    and the same the other way around. Which row you started clicking in
//    doesn't matter; the keys you press decide where the cursor goes next.

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

  // Typing/focus traversal order for each group (as DOM indices, left to
  // right = 0,1,2,3...). Digits fill left→right; letters fill right→left.
  const DIGIT_ORDER = [0, 1, 2, 3];
  const LETTER_ORDER = [2, 1, 0];

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
        <div class="ksa-plate-strip"></div>
      </div>`;
  }

  function cellsOf(container, role) {
    return Array.from(container.querySelectorAll(`[data-role="${role}"] .ksa-cell`));
  }

  function firstEmptyInOrder(cells, order) {
    for (const idx of order) if (!cells[idx].value) return idx;
    return order[order.length - 1]; // all full — land on the last one typed
  }
  function nextInOrder(order, idx) {
    const pos = order.indexOf(idx);
    return (pos >= 0 && pos + 1 < order.length) ? order[pos + 1] : null;
  }
  function prevInOrder(order, idx) {
    const pos = order.indexOf(idx);
    return pos > 0 ? order[pos - 1] : null;
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

    // Wires one group (digits or letters), across both its Arabic and
    // English cell rows. `onGroupDone(isArabicInput)` fires once the last
    // cell in the group's order is filled — used to hand off focus into
    // the next group. `onBackAtStart(isArRow)` fires when Backspace is hit
    // on an already-empty cell at the very start of this group's order.
    function wireGroup(enCells, arCells, isDigitGroup, onGroupDone, onBackAtStart) {
      const order = isDigitGroup ? DIGIT_ORDER : LETTER_ORDER;

      [[enCells, false], [arCells, true]].forEach(([cells, isArRow]) => {
        cells.forEach((cell, idx) => {
          cell.addEventListener("focus", () => {
            // Clicking directly on a cell that already has a value means
            // the person wants to fix/retype that exact character — select
            // it so the next keystroke replaces it outright, instead of
            // getting silently blocked by maxlength or redirected away.
            if (cell.value) {
              cell.select();
              return;
            }
            const targetIdx = firstEmptyInOrder(cells, order);
            if (targetIdx !== idx) cells[targetIdx].focus();
          });

          cell.addEventListener("input", () => {
            const raw = cell.value;
            if (!raw) {
              enCells[idx].value = "";
              arCells[idx].value = "";
              emitChange();
              return;
            }

            let enValue, isArabicInput;
            if (isDigitGroup) {
              if (/^[0-9]$/.test(raw)) { enValue = raw; isArabicInput = false; }
              else if (AR_TO_EN_DIGIT[raw]) { enValue = AR_TO_EN_DIGIT[raw]; isArabicInput = true; }
              else { cell.value = ""; return; }
            } else {
              const up = raw.toUpperCase();
              if (VALID_EN_LETTERS.includes(up)) { enValue = up; isArabicInput = false; }
              else if (AR_TO_EN_LETTER[raw]) { enValue = AR_TO_EN_LETTER[raw]; isArabicInput = true; }
              else { cell.value = ""; return; }
            }

            enCells[idx].value = enValue;
            arCells[idx].value = isDigitGroup ? EN_TO_AR_DIGIT[enValue] : EN_TO_AR_LETTER[enValue];

            // The script just typed decides which row the cursor continues
            // in next — not which row was physically clicked.
            const activeCells = isArabicInput ? arCells : enCells;
            const next = nextInOrder(order, idx);
            if (next !== null) {
              activeCells[next].focus();
            } else if (onGroupDone) {
              onGroupDone(isArabicInput);
            }
            emitChange();
          });

          cell.addEventListener("keydown", (e) => {
            if (e.key !== "Backspace" || cell.value) return;
            const prev = prevInOrder(order, idx);
            if (prev !== null) {
              cells[prev].focus();
            } else if (onBackAtStart) {
              onBackAtStart(isArRow);
            }
          });
        });
      });
    }

    // Digits (left→right) hand off into letters (right→left) once full,
    // continuing in whichever script row was actually being typed.
    wireGroup(digitsEn, digitsAr, true, (isArabicInput) => {
      const firstLetterIdx = LETTER_ORDER[0];
      (isArabicInput ? lettersAr : lettersEn)[firstLetterIdx].focus();
    }, null);

    // Backspacing past the first-typed (rightmost) letter box steps back
    // into the last digit box of that same script row.
    wireGroup(lettersEn, lettersAr, false, null, (isArRow) => {
      const lastDigitIdx = DIGIT_ORDER[DIGIT_ORDER.length - 1];
      (isArRow ? digitsAr : digitsEn)[lastDigitIdx].focus();
    });

    // Optional pre-fill (e.g. editing an existing vehicle). Letters fill in
    // typing order (first character = rightmost box), digits left to right.
    if (config.initialLetters) {
      config.initialLetters.toUpperCase().split("").forEach((ch, i) => {
        const domIdx = LETTER_ORDER[i];
        if (domIdx !== undefined && VALID_EN_LETTERS.includes(ch)) {
          lettersEn[domIdx].value = ch;
          lettersAr[domIdx].value = EN_TO_AR_LETTER[ch];
        }
      });
    }
    if (config.initialDigits) {
      config.initialDigits.split("").forEach((ch, i) => {
        const domIdx = DIGIT_ORDER[i];
        if (domIdx !== undefined && /^[0-9]$/.test(ch)) {
          digitsEn[domIdx].value = ch;
          digitsAr[domIdx].value = EN_TO_AR_DIGIT[ch];
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
