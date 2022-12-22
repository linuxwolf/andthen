import { describe, it } from "../deps.ts";

import * as workspace from "../../src/core/workspace.ts";
import log, { verbose } from "../../src/log.ts";
import { path } from "../../src/deps.ts";

describe("core/workspace", () => {
  /*
  it("basics", async () => {
    verbose();
    const ctx = await workspace.ResolverContext.create(
      path.join(Deno.cwd(), "test"),
    );
    log.warning("initialized");

    const result = await workspace.resolve(ctx, "clean", "build", "doc");
    log.warning(result);
  });
  //*/
});
