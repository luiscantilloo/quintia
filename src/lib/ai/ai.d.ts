declare const AlientoAI: {
  complete: (prompt: string) => Promise<string>;
  interpretNote: (...args: any[]) => any;
  companion: (...args: any[]) => any;
  crisisText: (nombre?: string) => string;
};
export default AlientoAI;
