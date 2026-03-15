import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export function isTestEmail(email: string) {
  const testDomains = ['example.com', 'test.com', 'dummy.com', 'fake.com']
  const testPatterns = [/^test/, /^user\d+/, /guest/, /demo/]
  
  if (!email) return true
  
  const domain = email.split('@')[1]
  if (testDomains.includes(domain)) return true
  
  const localPart = email.split('@')[0]
  if (testPatterns.some(pattern => pattern.test(localPart))) return true
  
  return false
}
