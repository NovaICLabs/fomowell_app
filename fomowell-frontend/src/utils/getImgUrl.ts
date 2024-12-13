export const getImgUrl = (reference: string) => {
  if (reference) {
    if (reference.startsWith("http")) {
      return 'https://image.fomowell.com/api/files/download/default';
    } else {
      return `https://image.fomowell.com/api/files/download/${reference}`;
    }
  }
  return 'https://image.fomowell.com/api/files/download/default';
};