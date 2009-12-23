/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Archive Format.
 *
 * The Initial Developer of the Original Code is
 * Paolo Amadini <http://www.amadzone.org/>.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Represents a MAFF web archive.
 *
 * This class derives from Archive. See the Archive documentation for details.
 *
 * @param aFile   nsIFile representing the compressed archive. The file usually
 *                 ends with the ".maff" extension.
 */
function MaffArchive(aFile) {
  Archive.call(this);
  this.file = aFile;

  // Initialize other member variables explicitly for proper inheritance
  this._createNew = true;
  this._useDirectAccess = false;
}

MaffArchive.prototype = {
  // Derive from the Archive class in a Mozilla-specific way. See also
  //  <https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Inheritance>
  //  (retrieved 2009-02-01).
  __proto__: Archive.prototype,

  // --- Overridden Archive methods ---

  load: function() {
    // Indicate that the file contains other saved pages that must be preserved
    this._createNew = false;
  },

  extractAll: function() {
    // Initialize the converter required to call methods accepting entry names
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
     createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    // Determine if the data files should be extracted
    this._useDirectAccess = Prefs.openUseJarProtocol;
    // Prepare a list of all the page folders available in the archive
    var pageFolderNames = [];
    // Open the archive file for reading
    var zipReader = Cc["@mozilla.org/libjar/zip-reader;1"].
     createInstance(Ci.nsIZipReader);
    zipReader.open(this.file);
    try {
      // Enumerate all the entries in the archive. ZIP entries are ordinary
      //  strings representing the path of the file or directory, separated by
      //  a forward slash ("/"). Directory entries end with a forward slash.
      var zipEntries = zipReader.findEntries(null);
      while (zipEntries.hasMore()) {
        var zipEntry = zipEntries.getNext();

        // Store the name of every first-level folder contained in the archive.
        //  Since synthetic directory entries are created by the ZIP reader if
        //  they are not explicitly stored in the archive, all the pages in the
        //  archive will be detected.
        if (/^[^/]+\/$/.test(zipEntry)) {
          pageFolderNames.push(zipEntry.slice(0, -1));
        }

        // If the archive should be opened using direct access to the files
        var shouldExtract;
        if (this._useDirectAccess) {
          // Extract only the metadata files "index.rdf" and "history.rdf". The
          //  file names are compared case insensitively, even though their
          //  names in the archive should always be lowercase.
          shouldExtract = /^[^/]+\/(index|history)\.rdf$/i.test(zipEntry);
        } else {
          // Extract all the file entries that are present in the archive
          shouldExtract = zipEntry.slice(-1) != "/";
        }

        // If the current entry must be extracted
        if (shouldExtract) {
          // Find the file whose path corresponds to the ZIP entry
          var destFile = this._getFileForZipEntry(zipEntry);
          // Ensure that the ancestors exist
          if (!destFile.parent.exists()) {
            destFile.parent.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
          }
          // Extract the file in the temporary directory. The value of zipEntry,
          //  that was converted from UTF-8 to Unicode automatically during the
          //  enumeration of the "AUTF8String" type, must be converted to UTF-8
          //  again when calling the "extract" method, that accepts a "string"
          //  type. For more information on string data types and XPConnect, see
          //  <https://developer.mozilla.org/en/xpcom_string_guide#IDL_String_types>
          //  (retrieved 2009-12-23).
          zipReader.extract(converter.ConvertFromUnicode(zipEntry) +
           converter.Finish(), destFile);
        }
      }
    } finally {
      // Close the file when extraction is finished or in case of exception
      zipReader.close();
    }
    // Sort the page folder names alphabetically. This ensures that the pages
    //  will be displayed always in the same sequence regardless of the order in
    //  which their folder names are returned by the ZIP reader.
    pageFolderNames.sort();
    // For every page folder name in the correct order
    for (var [, pageFolderName] in Iterator(pageFolderNames)) {
      // Add a new page object to the archive and set its temporary directory
      var newPage = this.addPage();
      newPage.tempDir = this._tempDir.clone();
      newPage.tempDir.append(pageFolderName);
      // Load the metadata for the page
      try {
        newPage._loadMetadata();
      } catch (e) {
        Cu.reportError(e);
      }
    }
  },

  _newPage: function() {
    return new MaffArchivePage(this);
  },

  // --- Private methods and properties ---

  /**
   * Returns a new nsIFile pointing to the location indicated by the given ZIP
   *  entry, relative to the temporary directory for this archive.
   *
   * @param aZipEntry   Unicode ZIP entry after which the file must be named.
   */
  _getFileForZipEntry: function(aZipEntry) {
    var fileForEntry = this._tempDir.clone();
    for (var [, pathSegment] in Iterator(aZipEntry.split("/"))) {
      fileForEntry.append(pathSegment);
    }
    return fileForEntry;
  },

  /**
   * Indicates that the archive file should be created from scratch. If false,
   *  indicates that at least one of the listed pages has already been saved,
   *  or that the archive contains other unloaded pages and should not be
   *  overwritten.
   */
  _createNew: true,

  /**
   * Indicates that the saved pages in the archive should be opened directly
   *  from the archive itself, instead of being extracted and read from the
   *  temporary directory. Even when this property is true, metadata files are
   *  still extracted in the temporary directory.
   */
  _useDirectAccess: false
}