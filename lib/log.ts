export const log = (category: string, ...message: unknown[]): void =>
  console.log(`${new Date()} [${category}]`, ...message);
