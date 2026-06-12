export const getRandomCharacters = (length: number, prefix?: string) => {
  if (!prefix) {
    prefix = '';
  }
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
};

export const getRandomInts = (length: number, prefix?: string) => {
  if (!prefix) {
    prefix = '';
  }
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
};
