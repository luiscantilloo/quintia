export type PathServiceFreqBtn = {
  label: string;
  bd: string;
  bg: string;
  fg: string;
  pick: () => void;
};

export type PathServiceRowModel = {
  id: string;
  name: string;
  note: string;
  op: number;
  swBg: string;
  x: string;
  cur: string;
  locked?: boolean;
  lockHint?: string;
  toggle: () => void;
  freqs: PathServiceFreqBtn[];
  libBtn: { label: string; go: () => void } | null;
};
