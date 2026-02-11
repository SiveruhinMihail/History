declare module "@formkit/themes/genesis" {
  const genesisTheme: string;
  export default genesisTheme;
}

declare module "@formkit/themes" {
  import type { FormKitClasses } from "@formkit/core";

  export function generateClasses(
    classes: Record<string, string | FormKitClasses>,
  ): Record<string, FormKitClasses>;
}

declare module "@formkit/i18n" {
  import type { FormKitLocale } from "@formkit/core";

  export function ru(): FormKitLocale;
}

declare module "@formkit/icons" {
  import type { FormKitIcon } from "@formkit/inputs";

  export const genesisIcons: Record<string, string | FormKitIcon>;
}
