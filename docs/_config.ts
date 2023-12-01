import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import mdAttrs from "npm:markdown-it-attrs";

const markdown = {
  plugins: [ mdAttrs ],
  keepDefaultPlugins: true,
};

const site = lume({}, { markdown });

site.use(date());
site.copyRemainingFiles();

export default site;
