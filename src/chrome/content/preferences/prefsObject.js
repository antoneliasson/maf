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

/**
 * Defines the Prefs global object, that can be used to retrieve the values
 *  of all the MAF user customizable options. The values are managed by
 *  the standard preferences system, and can be modified using the hosting
 *  application's interface or the extension's preferences dialog.
 *
 * When adding a preference here, also update "prefsDialog.xul" and
 *  "prefsDefaults.js" accordingly.
 */
var Prefs = {
  /*
   * Public properties to read preferences
   */

  /**
   * True if MAFF files should be associated with the host application.
   */
  get associateMaff() {
    return this.prefBranchForMaf.getBoolPref("associate.maff");
  },
  set associateMaff(value) {
    this.prefBranchForMaf.setBoolPref("associate.maff", value);
  },

  /**
   * True if MHTML files should be associated with the host application.
   */
  get associateMhtml() {
    return this.prefBranchForMaf.getBoolPref("associate.mhtml");
  },
  set associateMhtml(value) {
    this.prefBranchForMaf.setBoolPref("associate.mhtml", value);
  },

  /** Enumeration for interfaceIconLocation */
  ICONLOCATION_URLBAR:          "urlbar",
  ICONLOCATION_URLBAR_AUTOHIDE: "urlbar-autohide",
  ICONLOCATION_STATUS:          "status",
  ICONLOCATION_NONE:            "none",

  /**
   * Determines where the archive information icon should be displayed.
   *
   * Possible values:
   *   ICONLOCATION_URLBAR          - Display in the address bar.
   *   ICONLOCATION_URLBAR_AUTOHIDE - (default) Display in the address bar, but
   *                                   only when the current page is archived.
   *   ICONLOCATION_STATUS          - Display in the status bar.
   *   ICONLOCATION_NONE            - Do not display.
   *   (other)                      - If the user has customized the preference.
   */
  get interfaceIconLocation() {
    return this.prefBranchForMaf.getCharPref("interface.icon.location");
  },

  /**
   * Returns true if MAF menu items should be shown in the application menu.
   */
  get interfaceMenuApp() {
    return this.prefBranchForMaf.getBoolPref("interface.menu.app");
  },

  /**
   * Returns true if MAF menu items should be shown in the File menu.
   */
  get interfaceMenuFile() {
    return this.prefBranchForMaf.getBoolPref("interface.menu.file");
  },

  /**
   * Returns true if MAF menu items should be shown in the Tools menu.
   */
  get interfaceMenuTools() {
    return this.prefBranchForMaf.getBoolPref("interface.menu.tools");
  },

  /**
   * Returns true if MAF menu items should be shown in the page context menu.
   */
  get interfaceMenuPageContext() {
    return this.prefBranchForMaf.getBoolPref("interface.menu.pagecontext");
  },

  /**
   * Returns true if MAF menu items related to tab saving should be shown in the
   *  page context menu.
   */
  get interfaceMenuPageContextForTabs() {
    return this.prefBranchForMaf.getBoolPref("interface.menu.pagecontext.tabs");
  },

  /**
   * Returns true if MAF menu items should be shown in the tab bar context menu.
   */
  get interfaceMenuTabsContext() {
    return this.prefBranchForMaf.getBoolPref("interface.menu.tabscontext");
  },

  /**
   * Returns false only if a previous version of the extension was installed on
   *  the same profile, indicating that the header of the welcome page should be
   *  changed accordingly.
   */
  get otherDisplayWelcome() {
    return this.prefBranchForMaf.getBoolPref("other.displaywelcome");
  },
  set otherDisplayWelcome(aValue) {
    this.prefBranchForMaf.setBoolPref("other.displaywelcome", aValue);
  },

  /**
   * Returns true if the welcome dialog should be displayed on startup.
   */
  get otherDisplayWelcomePage() {
    return this.prefBranchForMaf.getBoolPref("other.displaywelcomepage");
  },
  set otherDisplayWelcomePage(aValue) {
    this.prefBranchForMaf.setBoolPref("other.displaywelcomepage", aValue);
  },

  /** Enumeration for saveComponent */
  SAVECOMPONENT_STANDARD: "standard",
  SAVECOMPONENT_SAVECOMPLETE: "completesave",
  SAVECOMPONENT_EXACTPERSIST: "exactpersist",

  /**
   * Returns the component MAF will use when saving pages from the web to a
   *  local folder, before archiving the saved elements.
   *
   * Possible values:
   *   SAVECOMPONENT_STANDARD     - (default) Use the browser's native "save
   *                                 complete web page" functionality.
   *   SAVECOMPONENT_SAVECOMPLETE - Use the integrated "Save Complete" code.
   *   SAVECOMPONENT_EXACTPERSIST - Use the ExactPersist snapshot save mode.
   *   (other)                    - If the user has customized the preference.
   */
  get saveComponent() {
    var prefValue = this.prefBranchForMaf.getCharPref("save.component");
    // The "maf" value represented the internal save component, that is not
    //  available anymore, while "savecomplete" represented the Save Complete
    //  component up to MAF version 0.17. If one of those values is specified in
    //  the preference, the ExactPersist component is used instead.
    return (prefValue == "maf" ? this.SAVECOMPONENT_EXACTPERSIST :
            prefValue == "savecomplete" ? this.SAVECOMPONENT_EXACTPERSIST :
            prefValue);
  },

  /**
   * Returns true if extended metadata, like the browser's current text zoom
   *  and scroll position, must be saved in new archives.
   */
  get saveMetadataExtended() {
    return this.prefBranchForMaf.getBoolPref("save.metadata.extended");
  },

  /**
   * Returns true if MHTML files should be created to be compatible with other
   *  browsers. If false, a special kind of MHTML file with the "X-MAF" header
   *  will be created.
   *
   * This preference is effective only if Save Complete is enabled.
   */
  get saveMhtmlCompatible() {
    return this.prefBranchForMaf.getBoolPref("save.mhtml.compatible");
  },

  /** Enumeration for saveMaffCompression */
  MAFFCOMPRESSION_DYNAMIC: "dynamic",
  MAFFCOMPRESSION_BEST:    "best",
  MAFFCOMPRESSION_NONE:    "none",

  /**
   * Returns the compression level to use when saving files in a MAFF archive.
   *
   * Possible values:
   *   MAFFCOMPRESSION_DYNAMIC  - (default) Use maximum compression for all
   *                               files, but do not re-compress media files.
   *   MAFFCOMPRESSION_BEST     - Use maximum compression for all files.
   *   MAFFCOMPRESSION_NONE     - Store all the files uncompressed.
   *   (other)                  - If the user has customized the preference.
   *
   * This preference is not displayed in the preferences dialog.
   */
  get saveMaffCompression() {
    return this.prefBranchForMaf.getCharPref("save.maff.compression");
  },

  /** Enumeration for saveNamingStrategy */
  NAMINGSTRATEGY_STANDARD:  "standard",
  NAMINGSTRATEGY_PAGETITLE: "pagetitle",

  /**
   * Determines how the default file name in the "Save As" dialogs is chosen.
   *
   * Possible values:
   *   NAMINGSTRATEGY_STANDARD  - (default) Use the browser's default behavior.
   *   NAMINGSTRATEGY_PAGETITLE - Use the title of the document instead of the
   *                               source file name when possible.
   *   (other)                  - If the user has customized the preference.
   */
  get saveNamingStrategy() {
    return this.prefBranchForMaf.getCharPref("save.namingstrategy");
  },

  /**
   * Returns true if the ".mhtml" file extension should be preferred over
   *  ".mht" in the file filters for the "Save As" dialogs.
   */
  get saveUseMhtmlExtension() {
    return this.prefBranchForMaf.getBoolPref("save.usemhtmlextension");
  },

  /**
   * Returns true if the character set specified in MAFF files should be ignored
   *  instead of being enforced when the page is displayed.
   */
  get openMaffIgnoreCharacterSet() {
    return this.prefBranchForMaf.getBoolPref("open.maff.ignorecharacterset");
  },

  /**
   * Returns true if the contents of MAFF archives should be accessed directly
   *  using the "jar:" protocol instead of extracting the archive to a
   *  temporary folder and using the "file:" protocol.
   *
   * The "jar:" protocol may be faster but using it may lock the archive file.
   */
  get openUseJarProtocol() {
    return this.prefBranchForMaf.getBoolPref("open.usejarprotocol");
  },

  /**
   * Returns the absolute path of the temporary folder.
   */
  get tempFolder() {
    // Get the value as an Unicode string
    var tempFolderPath = this.prefBranchForMaf.getComplexValue(
     "temp.folder", Ci.nsISupportsString).data;
    // If the string is empty, use the default path, that is a subdirectory
    //  of the system temporary directory
    if (!tempFolderPath) {
      tempFolderPath = this._defaultTempFolderPath;
    }
    // Return the absolute file path
    return tempFolderPath;
  },

  /**
   * Returns true if the temporary folder must be cleaned up on exit.
   */
  get tempClearOnExit() {
    return this.prefBranchForMaf.getBoolPref("temp.clearonexit");
  },

  /*
   * Other public properties
   */

  /**
   * Returns a reference to the MAF preferences branch, that can be used to add
   * and remove preference observers. For more information, see
   * <https://developer.mozilla.org/en/Code_snippets/Preferences#Using_preference_observers>
   * (retrieved 2009-08-30).
   */
  prefBranchForMaf: Cc["@mozilla.org/preferences-service;1"].
   getService(Ci.nsIPrefService).getBranch("extensions.maf.").
   QueryInterface(Ci.nsIPrefBranch2),

  /*
   * Private methods and properties
   */

  /**
   * Returns the default temporary folder path, located in the system temporary
   *  directory and different for each user profile.
   */
  get _defaultTempFolderPath() {
    // Since the temporary folder is cleared when the browser exits, we need to
    //  return a path that is different for each concurrent user. We also want
    //  the temporary path to be the same for every browsing session of the same
    //  user, but located in the default temporary directory, thus different if
    //  the same user profile is accessed from different computers. To ensure
    //  this, we calculate a path based on the temporary folder, but that
    //  includes the hash of the user profile path. This is required because on
    //  some platforms the temporary folder is the same for all users.
    var profilePath = this._dirService.get("ProfD", Ci.nsIFile).path;
    var tempDir = this._dirService.get("TmpD", Ci.nsIFile);
    tempDir.append("maftemp-" + this._getHexHashMD5(profilePath).slice(0, 8));
    // Do not recalculate the value the second time this property is read
    delete this._defaultTempFolderPath;
    return (this._defaultTempFolderPath = tempDir.path);
  },

  /**
   * Returns a string with the MD5 hash of the specified Unicode string.
   */
  _getHexHashMD5: function(aString) {
    // Convert the characters to UTF-8 octets
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
     createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var octets = converter.convertToByteArray(aString, {});
    // Calculate the hash of the octets
    var cryptoHash = Cc["@mozilla.org/security/hash;1"].
     createInstance(Ci.nsICryptoHash);
    cryptoHash.init(Ci.nsICryptoHash.MD5);
    cryptoHash.update(octets, octets.length);
    var hashOctets = cryptoHash.finish(false);
    // Return the hash as a hexadecimal string
    return [("0" + hashOctets.charCodeAt(i).toString(16)).slice(-2) for
     (i in hashOctets)].join("");
  },

  _dirService: Cc["@mozilla.org/file/directory_service;1"]
   .getService(Ci.nsIProperties)
}