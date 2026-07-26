export { generateInstallmentDates } from "@/lib/dates";

export function installmentAmount(rentAmount: number, installmentCount: number) {
  if (installmentCount <= 0) return 0;
  return Math.round((rentAmount / installmentCount) * 100) / 100;
}

export function annualizeServices(amount: number, period: string) {
  return period === "annual" ? amount : amount * 12;
}
