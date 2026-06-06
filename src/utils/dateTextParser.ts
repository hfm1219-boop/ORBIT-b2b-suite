export const dateTextParser = {
  parseRelativeDate: (text: string): string | null => {
    const lower = text.toLowerCase();
    const now = new Date();
    let resultDate = new Date();

    if (lower.includes("hoy")) {
      // already set
    } else if (lower.includes("mañana")) {
      resultDate.setDate(now.getDate() + 1);
    } else if (lower.includes("pasado mañana")) {
      resultDate.setDate(now.getDate() + 2);
    } else if (lower.includes("lunes")) {
      resultDate = getNextDay(1);
    } else if (lower.includes("martes")) {
      resultDate = getNextDay(2);
    } else if (lower.includes("miércoles") || lower.includes("miercoles")) {
      resultDate = getNextDay(3);
    } else if (lower.includes("jueves")) {
      resultDate = getNextDay(4);
    } else if (lower.includes("viernes")) {
      resultDate = getNextDay(5);
    } else if (lower.includes("sábado") || lower.includes("sabado")) {
      resultDate = getNextDay(6);
    } else if (lower.includes("domingo")) {
      resultDate = getNextDay(0);
    } else if (lower.includes("próxima semana") || lower.includes("proxima semana")) {
      resultDate.setDate(now.getDate() + 7);
    } else if (lower.includes("en 3 días") || lower.includes("en 3 dias")) {
      resultDate.setDate(now.getDate() + 3);
    } else if (lower.includes("en 8 días") || lower.includes("en 8 dias")) {
      resultDate.setDate(now.getDate() + 8);
    } else if (lower.includes("fin de mes")) {
      resultDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      return null;
    }

    return resultDate.toISOString().split('T')[0];
  }
};

function getNextDay(dayOfWeek: number): Date {
  const now = new Date();
  const resultDate = new Date();
  const currentDay = now.getDay();
  let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7;
  resultDate.setDate(now.getDate() + daysToAdd);
  return resultDate;
}
