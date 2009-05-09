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
 * Base class representing a page within a web archive. Derived objects must
 *  implement specific methods.
 *
 * This object allows the creation and extraction of individual pages within
 *  web archives, and handles the metadata associated with the page's contents.
 *
 * Instances of this object must be created using the methods in the Archive
 *  object.
 */
function ArchivePage(aArchive) {
  this.archive = aArchive;

  // Initialize other member variables explicitly for proper inheritance
  this.tempDir = null;
  this.indexLeafName = "";
  this.title = "";
  this.originalUrl = "";
  this.dateArchived = null;
  this.renderingCharacterSet = "";
  this._index = 0;
}

ArchivePage.prototype = {

  // --- Public methods and properties ---

  /**
   * The parent Archive object.
   */
  archive: null,

  /**
   * nsIFile representing the temporary directory holding the expanded contents
   *  of the page.
   */
  tempDir: null,

  /**
   * Name of the main file associated with the page. This is often "index.htm".
   */
  indexLeafName: "",

  /**
   * Document title or description explicitly associated with this page.
   */
  title: "",

  /**
   * String representing the original location this page was saved from.
   */
  originalUrl: "",

  /**
   * Date object representing the time the page was archived.
   */
  dateArchived: null,

  /**
   * String representing the character set selected by the user for rendering
   *  the page at the time it was archived. This information may be used when
   *  the archive is opened to override the default character set detected from
   *  the saved page.
   */
  renderingCharacterSet: "",

  /**
   * nsIURI representing the specific page inside the compressed or encoded
   *  archive.
   */
  get archiveUri() {
    var pageArchiveUri = this.archive.uri.clone();
    if (this._index) {
      // If this is not the first page in the archive, add the index of the page
      //  as the parameter part of the URI. The original archive URI does not
      //  contain query or hash parts.
      pageArchiveUri.QueryInterface(Ci.nsIURL).path += ";" + (this._index + 1);
    }
    return pageArchiveUri;
  },

  /**
   * nsIURI representing the local temporary copy of the main file associated
   *  with the page.
   */
  get tempUri() {
    // Locate the main temporary file associated with with the page
    var indexFile = this.tempDir.clone();
    indexFile.append(this.indexLeafName);
    // Return the associated URI object
    return Cc["@mozilla.org/network/io-service;1"].
     getService(Ci.nsIIOService).newFileURI(indexFile);
  },

  /**
   * nsIURI representing the local temporary folder associated with the page.
   */
  get tempFolderUri() {
    return Cc["@mozilla.org/network/io-service;1"].
     getService(Ci.nsIIOService).newFileURI(this.tempDir);
  },

  // --- Public methods and properties that can be overridden ---

  /**
   * Sets additional metadata about the page starting from the provided document
   *  and browser objects.
   */
  setMetadataFromDocumentAndBrowser: function(aDocument, aBrowser) {
    // Find the original metadata related to the page being saved, if present
    var documentUrlSpec = aDocument.location.href;
    var originalData = this._getOriginalMetadata(documentUrlSpec, aDocument);
    // Set the other properties of this page object appropriately
    this.title = aDocument.title || "Unknown";
    this.originalUrl = originalData.originalUrl || documentUrlSpec;
    this.dateArchived = originalData.dateArchived || new Date();
    this.renderingCharacterSet = aDocument.characterSet;
  },

  /**
   * Stores the page into the archive file.
   */
  save: function() {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  // --- Private methods and properties ---

  /**
   * Zero-based index of the page in the archive.
   */
  _index: 0,

  /**
   * Returns an object containing the original metadata for the page, obtained
   *  from the current archive cache or from the local file the page is being
   *  saved from.
   *
   * @param aSaveUrl    URL of the page being saved.
   * @param aDocument   Document that must be used to find the original URL the
   *                     local page was saved from, if necessary.
   */
  _getOriginalMetadata: function(aSaveUrl, aDocument) {
    // When saving a page that was extracted from an archive in this session,
    //  use the metadata from the original archive
    var originalPage = ArchiveCache.pageFromUriSpec(aSaveUrl);
    if (originalPage) {
      return originalPage;
    }

    // If the page is part of an archive but is not one of the main pages, use
    //  only the date from the original archive
    var parentPage = ArchiveCache.pageFromAnyTempUriSpec(aSaveUrl);
    if (parentPage) {
      return { dateArchived: parentPage.dateArchived };
    }

    // Check if the metadata from a locally saved page should be used
    try {
      // Get the file object associated with the page being saved
      var fileUri = Cc["@mozilla.org/network/io-service;1"].
       getService(Ci.nsIIOService).newURI(aSaveUrl, null, null);
      var file = fileUri.QueryInterface(Ci.nsIFileURL).file;
      // Ensure that the file being saved exists at this point
      if (file.exists()) {
        // Use the date and time from the local file
        return { dateArchived: new Date(file.lastModifiedTime) };
      }
    } catch (e if (e instanceof Ci.nsIException && (e.result ==
     Cr.NS_NOINTERFACE || e.result == Cr.NS_ERROR_MALFORMED_URI))) {
      // The original save URL is not a local file
    }

    // No additonal metadata is available
    return {};
  }
}