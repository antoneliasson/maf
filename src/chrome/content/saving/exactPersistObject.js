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
function ExactPersist() {

}

ExactPersist.prototype = {

  // --- nsISupports interface functions ---

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIWebBrowserPersist]),

  // --- nsICancelable interface functions ---

  cancel: function(aReason) {
    this.result = aReason;
    if (this._persistJob) {
      this._persistJob.cancel(aReason);
    }
  },

  // --- nsIWebBrowserPersist interface functions ---

  persistFlags: 0,

  currentState: Ci.nsIWebBrowserPersist.PERSIST_STATE_READY,

  result: Cr.NS_OK,

  progressListener: null,

  saveURI: function(aURI, aCacheKey, aReferrer, aPostData, aExtraHeaders,
   aFile, aPrivacyContext) {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  saveChannel: function(aChannel, aFile) {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  saveDocument: function(aDocument, aFile, aDataPath, aOutputContentType,
   aEncodingFlags, aWrapColumn) {
    // Pass exceptions to the progress listener
    try {
      // Operation in progress
      this.currentState = Ci.nsIWebBrowserPersist.PERSIST_STATE_SAVING;
      if (this.progressListener) {
        this.progressListener.onStateChange(null, null,
         Ci.nsIWebProgressListener.STATE_START |
         Ci.nsIWebProgressListener.STATE_IS_NETWORK, Cr.NS_OK);
      }

      // Find the local file to save to
      var targetFile = aFile.QueryInterface(Ci.nsIFileURL).file;

      // Create a job to save the given document, and listen to its events
      var persistJob = new ExactPersistJob(this, aDocument, targetFile,
       aDataPath, this.saveWithMedia, this.saveWithContentLocation);

      // Store a reference to the PersistBundle object for the save operation
      this.persistBundle = persistJob.bundle;

      // When saving a page that was extracted from an archive, use the
      //  information from the original archive to save the page correctly
      var originalPage = ArchiveCache.pageFromUri(aDocument.documentURIObject);

      // Before the job is started, change the content location of the main
      //  document to reflect the desired location. This ensures that references
      //  to the main document in saved files are handled correctly.
      persistJob.setResourceLocation(this.persistBundle.resources[0],
       (originalPage && originalPage.originalUrl) || aDocument.documentURI);

      // Save the given document
      persistJob.start();

      // If the start succeeded, keep a reference to the save job to allow
      //  stopping it
      this._persistJob = persistJob;
    } catch(e) {
      Cu.reportError(e);
      // Preserve the result code of XPCOM exceptions
      if (e instanceof Ci.nsIXPCException) {
        this.result = e.result;
      } else {
        this.result = Cr.NS_ERROR_FAILURE;
      }
      // Report that the download is finished to the listener
      this._onComplete();
    }
  },

  cancelSave: function() {
    this.cancel(Cr.NS_BINDING_ABORTED);
  },

  // --- Additional public methods and properties ---

  /**
   * If set to true, objects and media files will be included when saving.
   */
  saveWithMedia: false,

  /**
   * If set to true, the page will be saved for inclusion in an MHTML file.
   */
  saveWithContentLocation: false,

  /**
   * PersistBundle object referencing the resources that have been saved.
   */
  persistBundle: null,

  // --- Callback functions for the worker object ---

  onJobProgressChange: function(aJob, aWebProgress, aRequest, aCurSelfProgress,
   aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
    // Simply propagate the event to our listener
    if (this.progressListener) {
      this.progressListener.onProgressChange(aWebProgress, aRequest,
       aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress,
       aMaxTotalProgress);
    }
  },

  onJobComplete: function(aJob, aResult) {
    this.result = aResult;
    this._onComplete();
  },

  onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {
    // Propagate this download event unaltered
    if (this.progressListener) {
      this.progressListener.onStatusChange(aWebProgress, aRequest, aStatus,
       aMessage);
    }
  },

  // --- Private methods and properties ---

  _onComplete: function() {
    // Never report the finished condition more than once
    if (this.currentState != Ci.nsIWebBrowserPersist.PERSIST_STATE_FINISHED) {
      // Operation completed
      this.currentState = Ci.nsIWebBrowserPersist.PERSIST_STATE_FINISHED;
      // Signal success or failure in the archiving process
      if (this.progressListener) {
        this.progressListener.onStateChange(null, null,
         Ci.nsIWebProgressListener.STATE_STOP |
         Ci.nsIWebProgressListener.STATE_IS_NETWORK, this.result);
      }
    }
  },

  _persistJob: null,
}
