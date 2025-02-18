import { defineWidget } from "@cpmplus/widget-support/vite";
import react from "@vitejs/plugin-react";

// Second parameter is a Vite config object, to extend default config for widgets.
export default defineWidget(__dirname, {
    plugins: [ react() ]
});
