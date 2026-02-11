import type { FormKitClasses } from "@formkit/core";

export function rootClasses(sectionKey: string): FormKitClasses {
  return {
    outer: `${sectionKey}-outer mb-4`,
    label: `${sectionKey}-label block mb-2 font-medium text-gray-900 text-sm dark:text-gray-100`,
    inner: `${sectionKey}-inner`,
    input: `${sectionKey}-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400`,
    help: `${sectionKey}-help text-xs text-gray-500 dark:text-gray-400 mt-1`,
    message: `${sectionKey}-message text-red-500 dark:text-red-400 text-sm mt-1`,
  };
}
