import { type Config } from "./scripts/build/ts/config-types";
import { resolve as path } from "path";

const BuildConfig: Config = {
  devPort: 5174,
  projectPath: path("./frontend/dist"),
  outDir: path("./dist"),
  appName: "AutoR1",
  description: "Custom views for d&b audiotechnik's R1",
  appBundleName: "AutoR1",
  mac: {
    architecture: ["universal", "arm64", "x64"],
    appIcon: path("./build/assets/mac.icns"),
    minimumOS: "10.13.0",
  },
  win: {
    architecture: ["x64"],
    appIcon: path("./build/assets/win.ico"),
    // embedResources currently doesn't work and takes more space. See https://github.com/neutralinojs/neutralinojs/issues/1120
    embedResources: false,
  },
  linux: {
    architecture: ["x64", "arm64", "armhf"],
    appIcon: path("./build/assets/linux.png"),
    appPath: "/usr/share/AutoR1",
    appIconPath: "/usr/share/AutoR1/icon.png",
  },
};

export default BuildConfig;
