import { describe, expect, it } from "../deps.ts";

import { normalize } from "../../src/util/normalize.ts";

describe("util/normalize", () => {
  describe("normalize()", () => {
    it("normalizes a path string", () => {
      expect(normalize("./project/../elsewhere/src")).to.equal("elsewhere/src");
      expect(normalize("./elsewhere/src")).to.equal("elsewhere/src");
      expect(normalize("elsewhere/src")).to.equal("elsewhere/src");
      expect(normalize("elsewhere//src")).to.equal("elsewhere/src");
      expect(normalize("../elsewhere/src")).to.equal("../elsewhere/src");
    });
    it("strips trailing separator from path", () => {
      expect(normalize("./project/src/")).to.equal("project/src");
      expect(normalize("../project/src/")).to.equal("../project/src");
    });
  });
});
