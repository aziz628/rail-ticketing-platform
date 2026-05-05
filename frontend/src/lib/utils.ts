import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * SHADCN UI UTILITIES (Automatically Generated)
 * 
 * cn() : used for override tailwind utility classes in shadcn ui components.
 * 
 * Clsx: Safely joins multiple class strings together in React .
 * Tailwind-Merge: Recognizes that same properties values clash, and automatically deletes first occurance 
 *                 so your override works reliably instead of competing based on loading order.
 * 
 * Every Shadcn component automatically imports and uses this function to process its `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
