//var folderId = '....'; // Your Folder ID

// Function to get available folders for the dropdown
function getAvailableFolders() {
  var rootFolder = DriveApp.getFolderById('root'); // You can customize this to get any folder
  var folders = [];

  var folderIterator = rootFolder.getFolders();
  while (folderIterator.hasNext()) {
    var folder = folderIterator.next();
    folders.push({
      id: folder.getId(),
      name: folder.getName()
    });
  }

  return folders;
}

//Make CSV File
function getCSVData(folderId) {
  var folder = DriveApp.getFolderById(folderId); // Use the folderId passed from the frontend
  var allFiles = getAllFilesFromFolderAndSubfolders(folder, folder.getName());

  // Create CSV content
  var csvContent = "File Name,Full Path,Owner Name,Owner Email,Last Updated,Size\n";
  allFiles.forEach(function(file) {
    csvContent += [
      file.name,
      file.fullPath,
      file.ownername,
      file.owner,
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

// Update getDriveUpdates to accept folderId parameter
function getDriveUpdates(page = 1, itemsPerPage = 30, searchTerm = '', folderId = '') {
  var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getFolderById('......'); // Use default folder if none is provided

//Make CSV File
function getCSVData(folderId) {
  var folder = DriveApp.getFolderById(folderId); // Use the folderId passed from the frontend
  var allFiles = getAllFilesFromFolderAndSu
  if (!folder) {
    Logger.log('Folder not found or inaccessible.');
    return ContentService.createTextOutput(JSON.stringify({ files: [], folderName: '' }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  var folderName = folder.getName();  // Get folder name
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
    totalFiles: filteredFiles.length,
    folderName: folderName  // Return the folder name to the frontend
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
      ownername: file.getOwner().getName(),
      owner: file.getOwner().getEmail(),
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
      fileSize: file.getSize(),
    });
  }

  Logger.log("Files: " + JSON.stringify(fileData));
  return fileData;
}

// ฟังก์ชันเพื่อเช็คการเปลี่ยนแปลงใน Drive และส่งอีเมลแจ้งเตือน (ฟังก์ชันเดิม)
function checkDriveChanges() {
  var folder = DriveApp.getFolderById(folderId);
  
  // ดึงข้อมูลไฟล์ทั้งหมดจากโฟลเดอร์หลักและโฟลเดอร์ย่อยทั้งหมด
  var fileData = getAllFilesFromFolderAndSubfolders(folder, folder.getName());
  
  // แปลงชื่อไฟล์และโฟลเดอร์เป็น array ของชื่อไฟล์ทั้งหมดเพื่อใช้งานในการเปรียบเทียบ
  var fileNames = fileData.map(function(file) {
    return file.name;
  });

  // เก็บข้อมูลไฟล์ก่อนหน้านี้ใน User Properties
  var userProperties = PropertiesService.getUserProperties();
  var previousFiles = userProperties.getProperty('fileNames');

  // ถ้ายังไม่มีการเก็บข้อมูลไฟล์ ให้เก็บข้อมูลปัจจุบัน
  if (!previousFiles) {
    userProperties.setProperty('fileNames', fileNames.join(','));
    return;
  }

  var previousFileArray = previousFiles.split(',');

  // ตรวจสอบว่ามีการเพิ่มหรือลบไฟล์หรือไม่
  var newFiles = fileData.filter(file => !previousFileArray.includes(file.name));
  var removedFiles = previousFileArray.filter(fileName => !fileNames.includes(fileName));

  // สร้างข้อความแจ้งเตือน
  var message = '';

  if (newFiles.length > 0) {
    message += 'New files added:\n';
    newFiles.forEach(function(file) {
      message += 'Folder: ' + file.fullPath + ' - File: ' + file.name + '\n'+ 'File owner:' + file.ownername + '\n' + file.owner ;
    });
    message += '\n';
  }

  if (removedFiles.length > 0) {
    message += 'Files removed:\n' + removedFiles.join('\n');
  }

  // ถ้ามีการเพิ่มหรือลบไฟล์ ส่งอีเมลแจ้งเตือน
  if (message !== '') {
    MailApp.sendEmail('email1@gmail.com, email2@gmail.com', 'Google Drive Update', message);
  }

  // อัปเดตข้อมูลไฟล์ใน User Properties
  userProperties.setProperty('fileNames', fileNames.join(','));
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
