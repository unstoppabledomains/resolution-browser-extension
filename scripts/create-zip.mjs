import filenamify from "filenamify";
import fs from "fs-extra";
import path from "node:path";
import zl from "zip-lib";

const DIST_DIR = "./dist";
const RELEASE_DIR = "./releases";

if (!fs.pathExistsSync(DIST_DIR)) throw new Error("Dist dir does not exist");

const {name, version} = fs.readJsonSync("./package.json");
const args = process.argv.slice(2);
const tag = `-${args[0]}-${process.env.NODE_ENV}`;

const extName = filenamify(name, {replacement: "_"});
const zipName = `${extName}-v${version}${tag}.zip`;
const zipPath = path.join(RELEASE_DIR, zipName);

// include markdown files in zip
["CHANGELOG.md", "LICENSE.md", "README.md"].map(md => fs.copySync(md, `${DIST_DIR}/${md}`));

// create the release archive
zl.archiveFolder(DIST_DIR, zipPath)
  .then(() => console.log(`Release zip created - ${zipPath}`))
  .catch(console.log);
