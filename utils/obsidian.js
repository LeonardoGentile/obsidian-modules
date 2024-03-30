/**
 * Retrieves all the folder paths from a given vault.
 * Yoinked from https://github.com/chhoumann/quickadd/blob/master/src/engine/TemplateEngine.ts
 * @param {object} tp - The templater tp object.
 * @return {Array<string>} - An array of strings representing the folder paths.
*/
function getAllFolderPathsInVault(tp) {
  return app.vault
      .getAllLoadedFiles()
      .filter(f => f instanceof tp.obsidian.TFolder)
      .filter(f => !f.path.startsWith("_"))
      .filter(f => !f.path.startsWith("node_modules"))
      .map(folder => folder.path);
}

/**
 * Gets or creates a folder based on the given folders array.
 * Yoinked from https://github.com/chhoumann/quickadd/blob/master/src/engine/TemplateEngine.ts
 * @param {object} tp - The templater tp object.
 * @param {Array<string>} folders - An array of strings representing the folders.
 * @throws Will throw an error if no folder is selected from suggester.
 * @return {Promise<string>} A promise that resolves to the path of the selected or created folder.
 */
async function getOrCreateFolder(tp, folders) {
  let folderPath;

  if (folders.length > 1) {
      folderPath = await tp.system.suggester(folders, folders, false, "Select (or create) folder");
      if (!folderPath) throw new Error("No folder selected.");
  } else {
      folderPath = folders[0];
  }
  await createFolderIfNotExists(folderPath);
  return folderPath;
}

/**
* Checks if a folder exists in the vault and creates it if not.
* Yoinked from https://github.com/chhoumann/quickadd/blob/master/src/engine/TemplateEngine.ts
* @param {string} folder - The path of the folder to create.
*/
async function createFolderIfNotExists(folder) {
  const folderExists = await app.vault.adapter.exists(folder);

  if (!folderExists)
      // await app.vault.adapter.mkdir(folder)
      await app.vault.createFolder(folder);
}

module.exports = {
  getAllFolderPathsInVault,
  getOrCreateFolder,
  createFolderIfNotExists
}