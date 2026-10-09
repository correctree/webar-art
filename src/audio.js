export class TapAudio {
  constructor() { this.enabled = false; this.context = null; }
  async unlock() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error('このブラウザーでは音を再生できません。');
    this.context ||= new Context(); await this.context.resume(); this.enabled = true;
  }
  tone() {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const osc = this.context.createOscillator(); const gain = this.context.createGain();
    const now = this.context.currentTime;
    osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(660, now + .12);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.12, now + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .25);
    osc.connect(gain).connect(this.context.destination); osc.start(now); osc.stop(now + .26);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  mute() { this.enabled = false; this.context?.suspend(); }
}
