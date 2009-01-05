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

// Import XPCOMUtils to generate the QueryInterface functions
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/**
 * This object implements nsIWebBrowserPersist, and allows displaying the
 *  current download progress and status in the browser's download window.
 */
function MafArchivePersist(aSaveBrowser, aSaveTabs, aArchiveType) {
  this._saveBrowser = aSaveBrowser;
  this._saveTabs = aSaveTabs;
  this._archiveType = aArchiveType;
}

MafArchivePersist.prototype = {

  // --- nsISupports interface functions ---

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIWebBrowserPersist]),

  // --- nsICancelable interface functions ---

  cancel: function(aReason) {
    this.result = aReason;
  },

  // --- nsIWebBrowserPersist interface functions ---

  persistFlags: 0,

  currentState: Ci.nsIWebBrowserPersist.PERSIST_STATE_READY,

  result: Cr.NS_OK,

  progressListener: null,

  saveURI: function(aURI, aCacheKey, aReferrer, aPostData, aExtraHeaders,
   aFile) {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  saveChannel: function(aChannel, aFile) {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  saveDocument: function(aDocument, aFile, aDataPath, aOutputContentType,
   aEncodingFlags, aWrapColumn) {
    // Operation in progress
    this.currentState = Ci.nsIWebBrowserPersist.PERSIST_STATE_SAVING;

    // Pass exceptions to the progress listener
    try {
      // Find the path of the file to save to
      filePath = aFile.QueryInterface(Ci.nsIFileURL).file.path;

      // Save the selected page or tabs in the web archive
      var mafArchiver;
      if (this._saveTabs) {
        mafArchiver = new MafTabArchiverClass();
        mafArchiver.init(this._saveTabs, this._archiveType, filePath, this);
      } else {
        mafArchiver = new MafArchiverClass();
        mafArchiver.init(this._saveBrowser, this._archiveType, filePath, this);
      }
      mafArchiver.start(false); // Do not append to existing archive
    } catch(e) {
      // Preserve the result code of XPCOM exceptions
      if (e instanceof Ci.nsIXPCException) {
        this.result = e.result;
      } else {
        this.result = Cr.NS_ERROR_FAILURE;
      }
    }

    // Assume the operation is completed
    this.currentState = Ci.nsIWebBrowserPersist.PERSIST_STATE_FINISHED;
    // Signal success or failure in the archiving process
    if (this.progressListener) {
      this.progressListener.onStateChange(null, null,
       Ci.nsIWebProgressListener.STATE_START |
       Ci.nsIWebProgressListener.STATE_IS_NETWORK, Cr.NS_OK);
      this.progressListener.onStateChange(null, null,
       Ci.nsIWebProgressListener.STATE_STOP |
       Ci.nsIWebProgressListener.STATE_IS_NETWORK, this.result);
    }
  },

  cancelSave: function() {
    this.cancel(Cr.NS_BINDING_ABORTED);
  },

  progressUpdater: function(aProgress, aCode) {

  },

  // --- Private methods and properties ---

  _saveBrowser: null,
  _saveTabs: null,
  _archiveType: null
}