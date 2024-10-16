var folderId = '...'; // Your Folder ID

//Make CSV File
function getCSVData() {
  var folder = DriveApp.getFolderById(folderId);
  var allFiles = getAllFilesFromFolderAndSubfolders(folder, folder.getName());

  // Create CSV content
  var csvContent = "File Name,Full Path,Last Updated,Size\n";
  allFiles.forEach(function(file) {
    csvContent += [
      file.name,
      file.fullPath,
      new Date(file.lastUpdated).toLocaleString(),
      file.size
    ].join(",") + "\n";
  });

  return csvContent;
}

//Get all data
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Google Drive File Manager')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// get file function from google drive folder and subfolder
function getDriveUpdates(page = 1, itemsPerPage = 30, searchTerm = '') {
  //var folderId = '1mpqTcJNTbLOdaoyLjOTWrdS5lnJ7UvHJ';
  var folder = DriveApp.getFolderById(folderId);

  if (!folder) {
    Logger.log('Folder not found or inaccessible.');
    return ContentService.createTextOutput(JSON.stringify({ files: [] }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  var allFiles = getAllFilesFromFolderAndSubfolders(folder, folder.getName());
  var filteredFiles = allFiles;

  if (searchTerm) {
    filteredFiles = allFiles.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  var startIndex = (page - 1) * itemsPerPage;
  var paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  var result = {
    files: paginatedFiles,
    currentPage: page,
    totalPages: Math.ceil(filteredFiles.length / itemsPerPage),
    totalFiles: filteredFiles.length
  };

  Logger.log('Returning result: ' + JSON.stringify(result));
  return JSON.stringify(result);
}





// ฟังก์ชันช่วยในการดึงไฟล์จากโฟลเดอร์และโฟลเดอร์ย่อย
//pull file function from folder and subfolder
function getAllFilesFromFolderAndSubfolders(folder, parentPath) {
  if (!folder) {
    throw new Error("Folder is undefined or not accessible.");
  }

  var files = [];
  var fileIterator = folder.getFiles();

  while (fileIterator.hasNext()) {
    var file = fileIterator.next();
    files.push({
      name: file.getName(),
      //fullPath: parentPath + "/" + file.getName(), // Track full path
      fullPath: parentPath , // Track full path
      lastUpdated: file.getLastUpdated(),
      size: file.getSize(),
      webViewLink: file.getUrl()
    });
  }

  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var subfolder = subfolders.next();
    var subfolderPath = parentPath + "/" + subfolder.getName();
    var subfolderFiles = getAllFilesFromFolderAndSubfolders(subfolder, subfolderPath);
    files = files.concat(subfolderFiles);
  }

  return files;
}

//debug
function testGetFiles(folderId) {
  //--var folderId = '1mpqTcJNTbLOdaoyLjOTWrdS5lnJ7UvHJ'; // ใส่ Folder ID ของคุณ
  var folder = DriveApp.getFolderById(folderId);

  if (!folder) {
    throw new Error("Folder is undefined or not accessible.");
  }

  Logger.log("Folder found: " + folder.getName());

  var files = folder.getFiles();
  var fileData = [];

  while (files.hasNext()) {
    var file = files.next();
    fileData.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      lastUpdated: file.getLastUpdated(),
      fileSize: file.getSize()
    });
  }

  Logger.log("Files: " + JSON.stringify(fileData));
  return fileData;
}

function testGetDriveUpdates(page, itemsPerPage, searchTerm) {
  const files = DriveApp.getFiles();
  const fileList = [];

  while (files.hasNext()) {
    const file = files.next();
    fileList.push({
      name: file.getName(),
      id: file.getId(),
      mimeType: file.getMimeType(),
      lastUpdated: file.getLastUpdated(),
      size: file.getSize(),
    });
  }
  Logger.log("Files: " + JSON.stringify(fileList));
  return JSON.stringify({ files: fileList });
}
