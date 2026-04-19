// Operating hours: open 14:00 - 01:30 next day
export const OPEN_HOUR = 14; // 14:00
export const CLOSE_HOUR = 1;
export const CLOSE_MIN = 30; // 01:30

export type StoreStatus = {
  isOpen: boolean;
  label: string;
  nextChange: string;
};

export function getStoreStatus(now = new Date()): StoreStatus {
  const h = now.getHours();
  const m = now.getMinutes();
  const minutes = h * 60 + m;
  const open = OPEN_HOUR * 60;
  const close = CLOSE_HOUR * 60 + CLOSE_MIN; // 90

  // Open if after 14:00 OR before 01:30
  const isOpen = minutes >= open || minutes < close;

  if (isOpen) {
    return {
      isOpen: true,
      label: "Aberto agora",
      nextChange: `Fecha às 01:30`,
    };
  }
  return {
    isOpen: false,
    label: "Fechado",
    nextChange: `Abre às 14:00`,
  };
}

export const WEEK_HOURS = [
  { day: "Segunda", hours: "14:00 – 01:30" },
  { day: "Terça", hours: "14:00 – 01:30" },
  { day: "Quarta", hours: "14:00 – 01:30" },
  { day: "Quinta", hours: "14:00 – 01:30" },
  { day: "Sexta", hours: "14:00 – 02:00" },
  { day: "Sábado", hours: "14:00 – 02:00" },
  { day: "Domingo", hours: "14:00 – 01:30" },
];
