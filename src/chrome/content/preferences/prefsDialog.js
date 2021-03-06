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
 * Portions created by the Initial Developer are Copyright (C) 2008
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

const { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

Cu.import("chrome://maf/content/MozillaArchiveFormat.jsm");
Cu.import("resource://gre/modules/Services.jsm");

/**
 * Handles the MAF preferences dialog.
 */
var PrefsDialog = {
  /**
   * Initializes the controls when the dialog is displayed.
   */
  onLoadDialog: function() {
    // Show the legacy add-on warning on Firefox 55 and above.
    if (Services.appinfo.ID == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}" &&
        Services.vc.compare(Services.appinfo.version, "55") > 0) {
      Interface.applyBranding(document.getElementById("descLegacy"));
    } else {
      document.getElementById("boxLegacy").hidden = true;
    }
    // Determines if we should handle file associations.
    if (this._isOnWindows()) {
      Interface.applyBranding(document.getElementById("lblAssociate"));
    } else {
      document.getElementById("boxAssociate").hidden = true;
    }
    Promise.resolve().then(() => this.sizeToContent());
  },

  /**
   * Applies the file association options on Windows.
   */
  onDialogAccept: function() {
    if (!this._isOnWindows()) {
      return;
    }

    try {
      if (Prefs.associateMaff) {
        FileAssociations.createAssociationsForMAFF();
      }
      if (Prefs.associateMhtml) {
        FileAssociations.createAssociationsForMHTML();
      }
    } catch (e) {
      Cu.reportError(e);
    }
  },

  /**
   * Updates the window size after some elements may have been added or removed.
   */
  sizeToContent: function() {
    // At this point, we must ensure that the height of the visible description
    // elements is taken into account when calculating the window height.
    for (let [, d] in Iterator(document.getElementsByTagName("description"))) {
      d.style.height = window.getComputedStyle(d).height;
    }
    // We must also override the explicit height that was set by the preferences
    // window machinery, then recalculate the window height automatically.
    for (let [, p] in Iterator(document.getElementsByTagName("prefpane"))) {
      p = document.getAnonymousElementByAttribute(p, "class", "content-box");
      p.style.height = "auto";
    }
    window.sizeToContent();
  },

  /* --- Interactive dialog functions and events --- */

  /**
   * Displays the "Convert saved pages" window.
   */
  onActionConvertSavedPagesClick: function() {
    // If the convert window is already opened
    var convertDialog = Cc["@mozilla.org/appshell/window-mediator;1"].
     getService(Ci.nsIWindowMediator).getMostRecentWindow("Maf:Convert");
    if (convertDialog) {
      // Bring the window to the foreground.
      convertDialog.focus();
    } else {
      // Open a new window to allow the conversion.
      Services.ww.openWindow(null,
       "chrome://maf/content/convert/convertDialog.xul",
       "maf-convertDialog",
       "chrome,centerscreen,dialog,minimizable,resizable,alwaysRaised", null);
    }
  },

  /* --- Dialog support functions --- */

  /**
   * Returns true if the application is executing on Windows.
   */
  _isOnWindows: function() {
    // For more information, see
    // <https://developer.mozilla.org/en/nsIXULRuntime> and
    // <https://developer.mozilla.org/en/OS_TARGET> (retrieved 2008-11-19).
    var xulRuntimeOs = Cc["@mozilla.org/xre/app-info;1"]
     .getService(Ci.nsIXULRuntime).OS;
    return (xulRuntimeOs == "WINNT");
  },
}
