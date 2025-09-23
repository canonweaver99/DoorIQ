export type Speaker = 'rep' | 'homeowner';

export type Turn = {
  id: string;
  speaker: Speaker;
  text: string;
  ts: number;
};

export type Status = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';


