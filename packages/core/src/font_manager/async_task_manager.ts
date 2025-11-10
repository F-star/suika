export class AsyncTaskManager<T = any> {
  private concurrency: number;
  private running: number = 0;
  private queue: Array<{
    task: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(concurrency: number = 3) {
    if (concurrency < 1) {
      throw new Error('concurrency must be greater than 0');
    }
    this.concurrency = concurrency;
  }

  addTask(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async addTaskList(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map((task) => this.addTask(task)));
  }

  private process(): void {
    // 如果已达到最大并发数或队列为空，则不处理
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    // 从队列中取出一个任务
    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.running++;

    item
      .task()
      .then((result) => {
        this.running--;
        item.resolve(result);
        this.process();
      })
      .catch((error) => {
        this.running--;
        item.reject(error);
        this.process();
      });
  }

  getRunningCount(): number {
    return this.running;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getTotalCount(): number {
    return this.running + this.queue.length;
  }

  isEmpty(): boolean {
    return this.running === 0 && this.queue.length === 0;
  }

  async waitTasksFinished(): Promise<void> {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (this.isEmpty()) {
          resolve();
        } else {
          // prevent blocking, wait for the current task to complete
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  clear(): void {
    this.queue.forEach((item) => {
      item.reject(new Error('task queue is cleared'));
    });
    this.queue = [];
  }
}
