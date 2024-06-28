import {glob} from "glob";
import {readFileSync, unlinkSync, writeFileSync} from "node:fs";
(async () => {
  const mapFiles = await glob("dist/**/*.map");
  mapFiles.forEach((file) => unlinkSync(file));

  const files = await glob("dist/**/*.+(css|js)");
  files.forEach((file) => {
    const data = readFileSync(file, {encoding: "utf8"});
    const res = data.replace(/\/[*|\/]# sourceMappingURL=.+\n/, "");
    writeFileSync(file, res);
  });
})();
