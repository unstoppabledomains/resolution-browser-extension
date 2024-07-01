const {Reporter} = require("@parcel/plugin");
const fs = require("fs");
const path = require("path");

const reporter = new Reporter({
  renameIndexFile() {
    const directoryPath = path.join(__dirname, "../dist");

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.log("Error finding files: " + err);
        return;
      }

      files.forEach((file) => {
        if (
          file.startsWith("resolution-browser-extension.") &&
          file.endsWith(".html")
        ) {
          const oldPath = path.join(directoryPath, file);
          const newPath = path.join(directoryPath, "index.html");

          fs.copyFile(oldPath, newPath, (err) => {
            if (err) {
              console.log("Error renaming file: " + err);
            }
          });
        }
      });
    });
  },

  report({event}) {
    if (event.type === "buildSuccess") {
      this.renameIndexFile();
    }
  },
});

module.exports = reporter;
