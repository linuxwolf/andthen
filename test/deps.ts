import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.161.0/testing/bdd.ts";

import chai from "https://cdn.skypack.dev/chai@4.3.4?dts";
import sinon from "https://cdn.skypack.dev/sinon@14.0.1?dts";
import sinonChai from "https://cdn.skypack.dev/sinon-chai@3.7.0?dts";
import chaiPromised from "https://cdn.skypack.dev/chai-as-promised@7.1.1?dts";

chai.use(sinonChai);
chai.use(chaiPromised);

const { expect } = chai;

export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  sinon,
};
