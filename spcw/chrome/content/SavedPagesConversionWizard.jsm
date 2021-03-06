/**
 * Exports all the common JavaScript objects for the add-on.
 */

const { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");

let objectsByFolder = {
  general: [
    "AsyncEnumerator",
    "DataSourceWrapper",
    "Interface",
    "PersistBundle",
    "PersistFolder",
    "PersistResource",
    "SourceFragment",
    "CssSourceFragment",
    "HtmlSourceFragment",
    "TagSourceFragment",
    "UrlListSourceFragment",
    "UrlSourceFragment",
  ],
  convert: [
    "Candidate",
    "CandidateFinder",
    "CandidateLocation",
    "CandidatesDataSource",
  ],
  engine: [
    "Archive",
    "ArchiveCache",
    "ArchivePage",
    "MaffArchive",
    "MaffArchivePage",
    "MaffDataSource",
    "MhtmlArchive",
    "MhtmlArchivePage",
    "MimePart",
    "MimeSupport",
    "MultipartMimePart",
    "ZipCreator",
    "ZipDirectory",
  ],
  loading: [
    "ArchiveLoader",
    "ArchiveStreamConverter",
    "DocumentLoaderFactory",
  ],
  preferences: [
    "Prefs",
  ],
  saving: [
    "Job",
    "JobRunner",
    "ContentPolicy",
    "ExactPersistInitialJob",
    "ExactPersistJob",
    "ExactPersist",
    "ExactPersistParsedJob",
    "ExactPersistReference",
    "ExactPersistUnparsedJob",
    "MafArchivePersist",
    "SaveArchiveJob",
    "SaveContentJob",
    "SaveJob",
  ],
  startup: [
    "StartupEvents",
    "StartupInitializer",
  ],
};

let EXPORTED_SYMBOLS = [];
for (let folderName of Object.keys(objectsByFolder)) {
  for (let objectName of objectsByFolder[folderName]) {
    EXPORTED_SYMBOLS.push(objectName);
    Services.scriptloader.loadSubScript("chrome://spcw/content/" + folderName +
                                        "/" + objectName + ".js");
  }
}
