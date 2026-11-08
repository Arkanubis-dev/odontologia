/**
 * Genera un enlace de reunión válido de Google Meet
 * Formato oficial: https://meet.google.com/xxx-yyyy-zzz
 */
export function generarEnlaceMeet(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const randomPart = (len: number) => {
    let res = "";
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  return `https://meet.google.com/${randomPart(3)}-${randomPart(4)}-${randomPart(3)}`;
}

