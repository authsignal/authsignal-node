import commonjs from "@rollup/plugin-commonjs";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: [
    {
      dir: "dist",
      format: "cjs",
    },
    {
      file: "dist/index.mjs",
      format: "esm",
    },
  ],
  plugins: [nodeResolve(), commonjs(), json(), typescript()],
};
