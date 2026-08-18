export interface ConflictResolution<T> {
  resolvedData: T;
  resolutionStrategy: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE';
}

export class ConflictResolver {
  resolve<T extends { updatedAt?: string }>(local: T, remote: T): ConflictResolution<T> {
    const localTime = new Date(local.updatedAt || 0).getTime();
    const remoteTime = new Date(remote.updatedAt || 0).getTime();

    if (localTime > remoteTime) {
      return {
        resolvedData: local,
        resolutionStrategy: 'CLIENT_WINS',
      };
    }

    return {
      resolvedData: remote,
      resolutionStrategy: 'SERVER_WINS',
    };
  }
}

export const conflictResolver = new ConflictResolver();
