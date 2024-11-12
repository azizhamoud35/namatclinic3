import { sleep } from '@/lib/utils';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0 || error.code === 'permission-denied') {
      throw error;
    }

    console.log(`Retrying operation. Attempts remaining: ${retries}`);
    await sleep(delay);
    
    return withRetry(
      operation,
      retries - 1,
      delay * 2 // Exponential backoff
    );
  }
}