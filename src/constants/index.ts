// Application constants - separated from types for tree-shaking and HMR compatibility

// German month names
export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
] as const;

// Duty codes and their meanings
export const DUTY_CODES = {
  A: 'Fahrt zur Arbeit',
  E: 'Fahrt von Arbeit',
  ME: 'Medizinische Untersuchung',
  FL: 'Auslandstag',
  EM: 'Einsatzmeeting',
  RE: 'Reserve',
  DP: 'Dispatch',
  DT: 'Duty Time',
  SI: 'Simulator',
  TK: 'Technikkurs',
  SB: 'Standby'
} as const;

export const GROUND_DUTY_CODES = ['EM', 'RE', 'DP', 'DT', 'SI', 'TK', 'SB'] as const;
export type GroundDutyCode = typeof GROUND_DUTY_CODES[number];
