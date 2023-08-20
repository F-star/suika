import Stats from 'stats.js';

export class PerfMonitor {
  private stats: Stats = new Stats();
  private rafId = 0;

  start(container: HTMLElement) {
    const stats = this.stats;
    stats.showPanel(0);
    stats.dom.style.left = '300px';
    container.appendChild(stats.dom);

    const update = () => {
      stats.begin();
      stats.end();
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }
  destroy() {
    cancelAnimationFrame(this.rafId);
    this.stats.dom.remove();
  }
}
