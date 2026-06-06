export const moneyTextParser = {
  parseMoney: (text: string): number | null => {
    const lower = text.toLowerCase();
    
    // Pattern for "X mil" or "X.Y millones"
    const milMatch = lower.match(/(\d+[\.\,]?\d*)\s*mil/);
    if (milMatch) {
      const val = parseFloat(milMatch[1].replace(',', '.'));
      return val * 1000;
    }

    const millonMatch = lower.match(/(\d+[\.\,]?\d*)\s*millones/);
    if (millonMatch) {
      const val = parseFloat(millonMatch[1].replace(',', '.'));
      return val * 1000000;
    }

    const millonSingularMatch = lower.match(/(\d+[\.\,]?\d*)\s*millón/);
    if (millonSingularMatch) {
      const val = parseFloat(millonSingularMatch[1].replace(',', '.'));
      return val * 1000000;
    }

    // Pattern for $ followed by numbers or just numbers
    const moneyMatch = lower.match(/\$?\s*(\d+(\.\d{3})*(,\d+)?)/);
    if (moneyMatch) {
      // Clean periods used as thousands separators and commas as decimals if any
      const cleaned = moneyMatch[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(cleaned);
      if (!isNaN(val)) return val;
    }

    return null;
  }
};
