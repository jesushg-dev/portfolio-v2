export const convertMsToMmSs = (milliseconds: number): string => {
  const totalSeconds: number = Math.floor(milliseconds / 1000);
  const minutes: number = Math.floor(totalSeconds / 60);
  const seconds: number = totalSeconds % 60;

  const formattedMinutes: string = String(minutes).padStart(2, "0");
  const formattedSeconds: string = String(seconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
};
