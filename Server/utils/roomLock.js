/**
 * Room Concurrency Lock Utility
 * 
 * Architectural Context & Topology Note:
 * For a standalone MongoDB instance (where multi-document replica-set transactions are
 * unavailable without replica set configuration), this utility provides an asynchronous,
 * serialized queue per roomId for the running Node.js process.
 * 
 * Concurrent booking requests targeting the exact same room are queued and executed
 * serially. Within each serialized execution, real-time date-overlap queries are executed
 * against MongoDB to verify that active bookings do not exceed room inventory.
 * 
 * Multi-Instance Clustered Deployment Note:
 * In a distributed, multi-process or multi-server deployment, a distributed locking mechanism
 * (such as Redis Redlock or MongoDB replica-set native ACID transactions via rs.initiate())
 * must be configured. This in-memory lock is designed specifically for single-process Node.js environments.
 */

class RoomLock {
  constructor() {
    this.queues = new Map();
  }

  /**
   * Acquire lock for a specific room and execute the critical operation
   * @param {string} roomId - Room identifier to lock
   * @param {Function} task - Async function to execute inside the lock
   * @returns {Promise<any>}
   */
  async acquire(roomId, task) {
    const key = String(roomId);

    // Get current tail of the promise chain for this room, or start resolved
    const currentQueue = this.queues.get(key) || Promise.resolve();

    let releaseLock;
    const nextInQueue = new Promise((resolve) => {
      releaseLock = resolve;
    });

    // Append to queue
    this.queues.set(key, currentQueue.then(() => nextInQueue));

    try {
      // Wait for previous tasks on this room to finish
      await currentQueue;
      // Execute critical section
      return await task();
    } finally {
      // Release next task in queue
      releaseLock();

      // Clean up map entry if queue has drained
      if (this.queues.get(key) === nextInQueue) {
        this.queues.delete(key);
      }
    }
  }
}

const roomLock = new RoomLock();

module.exports = roomLock;
