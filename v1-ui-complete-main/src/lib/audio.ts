// Thai pronunciation via the browser's built-in Web Speech API.
// Works offline and requires no external (VPN-blocked) service.

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
  loadVoices();
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakThai(text: string): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 0.8;

  const voices = loadVoices();
  const thaiVoice =
    voices.find((v) => v.lang?.toLowerCase().startsWith("th")) ?? null;
  if (thaiVoice) utterance.voice = thaiVoice;

  synth.speak(utterance);
}
