import { ru } from "@formkit/i18n";
import { defaultConfig } from "@formkit/vue";
import { genesisIcons } from "@formkit/icons";
import "@formkit/themes/genesis";

export default defaultConfig({
  locales: { ru },
  locale: "ru",
  icons: genesisIcons,
});
