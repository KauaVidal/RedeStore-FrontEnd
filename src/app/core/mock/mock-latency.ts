export function mockLatency<T>(valor: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}
