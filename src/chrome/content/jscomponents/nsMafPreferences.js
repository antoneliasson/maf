/**
 * Mozilla Archive Format
 * ======================
 *
 * Version: 0.6.3
 *
 * Author: Christopher Ottley
 *
 * Description: The MAF extension for Firefox and Mozilla integrates page archive functionality in the browser
 *
 *  Copyright (c) 2005 Christopher Ottley.
 *
 *  This file is part of MAF.
 *
 *  MAF is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  MAF is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.

 *  You should have received a copy of the GNU General Public License
 *  along with MAF; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

// Provides MAF Preferences management services

const OPENMODE_NOTHING = 0;
const OPENMODE_ALLTABS = 1;
const OPENMODE_SHOWDIALOG = 2;
const OPENMODE_FIRSTPAGE = 3;

function GetMafPreferencesServiceClass() {
  if (!sharedData.MafPreferencesService) {
    sharedData.MafPreferencesService = new MafPreferencesServiceClass();
  }

  try {
    if (!sharedData.MafPreferencesService.isLoaded) { sharedData.MafPreferencesService.load(); }
  } catch(e) { mafdebug(e); }

  return sharedData.MafPreferencesService;
}

/**
 * The MAF preferences.
 */
function MafPreferencesServiceClass() {

}

MafPreferencesServiceClass.prototype = {

  /** The temp folder. */
  temp: "",

  /** Structured array with information on supported file formats.
   *
   * [i] = (Array) A file format definition
   * [i][0] = (String) File format display name
   * [i][1] = (String) "Program" used when saving archives.
   * [i][2] = (String) "Program" used when opening archives.
   * [i][3] = (Array) List of file patterns associated with the file format.
   *
   * The basic "MAF" file format is not part of this array.
   *
   **/
  programExtensions: [
   ["Zip",
    "MAF",
    "MAF",
    ["*.maff.zip"]
   ],
   ["MHT",
    new MafMhtEncoderClass().PROGID,
    new MafMhtDecoderClass().PROGID,
    ["*.mht"]
   ]
  ],

  /** The extension that handles *.maf by default. */
  defaultMAFExtensionIndex: 0,

  archiveOpenMode: 1,
     /** 0 - Do nothing. */
     /** 1 - Open all in new tabs. */
     /** 2 - Dialog box showing all archived files, select to open. */
     /** 3 - The first page in a tab. Used if the first page is known to be a TOC, index or main page. */

  OPENMODE_NOTHING: 0,

  OPENMODE_ALLTABS: 1,

  OPENMODE_SHOWDIALOG: 2,

  OPENMODE_FIRSTPAGE: 3,

  /** URL Rewrite enabled. */
  urlRewrite: true,

  /** Save extended metadata. */
  saveExtendedMetadata: false,

  isLoaded: false,

  clearTempOnClose: true,

  enableMafProtocol: false,

  addDocumentWriteOverride: false,

  alertOnArchiveComplete: true,

  alternative_save_component: false,

  win_associate_maff: false,

  win_associate_mht: false,

  getOpenFiltersLength: function() {
    return (this.programExtensions.length + 1);
  },


  getOpenFilterAt: function(index, count, result) {
   try {
    if (index >= 0) {
      if (index == 0) {
        var outarray = new Array();
        outarray.push("MAF " + MafStrBundle.GetStringFromName("archives"));
        outarray.push("*.maff; *.maf");
        outarray.push("" + this.defaultMAFExtensionIndex);

        result.value = outarray;
        count.value = result.value.length;

      } else {
        if (index <= this.programExtensions.length) {
          var i = index - 1;

          var outarray = new Array();
          outarray.push("MAF " + this.programExtensions[i][0] + " " + MafStrBundle.GetStringFromName("archives"));

          // Construct a string like "*.zip.maf; *.maf.zip"
          var additionalExts = "";
          for (var j=0; j<this.programExtensions[i][3].length; j++) {
            if (additionalExts == "") {
              additionalExts = this.programExtensions[i][3][j];
            } else {
              additionalExts += "; " + this.programExtensions[i][3][j];
            }
          }

          outarray.push(additionalExts);

          // Add associated program extension index
          outarray.push("" + i);

          result.value = outarray;
          count.value = result.value.length;

        } else {
          // Error index out of bounds
        }
      }
    } else {
      // Error index out of bounds
    }
   } catch(e) {
     mafdebug(e);
   }
  },

  /**
   * Creates a multi-dimensional array holding info on each registered program
   */
  getOpenFilters: function() {
    var result = [ ["MAF " + MafStrBundle.GetStringFromName("archives"), "*.maff; *.maf", this.defaultMAFExtensionIndex] ];
    for (var i=0; i<this.programExtensions.length; i++) {
      var entry = ["MAF " + this.programExtensions[i][0] + " " + MafStrBundle.GetStringFromName("archives")];

      // Construct a string like "*.zip.maf; *.maf.zip"
      var additionalExts = "";
      for (var j=0; j<this.programExtensions[i][3].length; j++) {
        if (additionalExts == "") {
          additionalExts = this.programExtensions[i][3][j];
        } else {
          additionalExts += "; " + this.programExtensions[i][3][j];
        }
      }
      entry[entry.length] = additionalExts;
      // Add associated program extension index
      entry[entry.length] = i;
      result[result.length] = entry;
    }
    return result;
  },

  getSaveFiltersLength: function() {
    var result = 1; // *.maff
    for (var i=0; i<this.programExtensions.length; i++) {
      result += this.programExtensions[i][3].length;
    }

    return result;
  },


  getSaveFilterAt: function(index, count, result) {
    try {

    if (index >= 0) {
      if (index == 0) {
        var outarray = new Array();
        outarray.push("MAF " + MafStrBundle.GetStringFromName("archives"));
        outarray.push("*.maff");
        outarray.push("" + this.defaultMAFExtensionIndex);

        result.value = outarray;
        count.value = result.value.length;

      } else {

        var total = 0;
        for (var i=0; i<this.programExtensions.length; i++) {
          for (var j=0; j<this.programExtensions[i][3].length; j++) {
            total += 1;
            if (index == total) {
              var outarray = new Array();
              outarray.push("MAF " + this.programExtensions[i][0] + " " + MafStrBundle.GetStringFromName("archives"));
              outarray.push(this.programExtensions[i][3][j]);
              outarray.push("" + i);

              result.value = outarray;
              count.value = result.value.length;

              break; break;
            }
          }
        }

      }
    } else {

    }
    } catch(e) { }
  },


  /**
   * Creates a multi-dimensional array holding info on each registered program
   */
  getSaveFilters: function() {
    var result = [ ["MAF " + MafStrBundle.GetStringFromName("archives"), "*.maff", this.defaultMAFExtensionIndex] ];

    // Each unique extension has its own entry
    for (var i=0; i<this.programExtensions.length; i++) {
      for (var j=0; j<this.programExtensions[i][3].length; j++) {
        var entry = ["MAF " + this.programExtensions[i][0] + " " + MafStrBundle.GetStringFromName("archives"), this.programExtensions[i][3][j], i];
        result[result.length] = entry;
      }
    }
    return result;
  },

  /**
   * Gets the program to use from the selected index.
   */
  programFromSaveIndex: function(index) {
    var filters = this.getSaveFilters();
    var selProgExt = this.programExtensions[filters[index][2]];
    return selProgExt[1];
  },

  /**
   * Gets the program to use from the selected index.
   */
  programFromOpenIndex: function(index) {
    var filters = this.getOpenFilters();
    var result = null;
    try {
      var selProgExt = this.programExtensions[filters[index][2]];
      result = selProgExt[2];
    } catch(e) {

    }
    return result;
  },

  /**
   * Looks for a match in the filters based on the filename
   * @return -1 if no open filter was found, index of the filter otherwise
   */
  getOpenFilterIndexFromFilename: function(filename) {
    var result = -1;
    var lcFilename = filename.toLowerCase();

    // Do a simple string comparison search
    // TODO: Maybe, make this a bit more robust using regular expressions
    //       Convert the open filter string into a regex dynamically and check
    //       for a match on the filename.
    var filters = this.getOpenFilters();

    for (var i=0; i<filters.length; i++) {
      var mask = filters[i][1].toLowerCase();
      if (mask.indexOf(";") > 0) {
        // We have a complex mask
        var submasks = mask.split(";");

        for (var j=0; j<submasks.length; j++) {
          var currSubMask = submasks[j].trim();
          var suffix = currSubMask.substring(1, currSubMask.length);
          if (suffix == lcFilename.substring(lcFilename.length - suffix.length, lcFilename.length)) {
            result = i;
            break;
          }
        }

        if (result != -1) { break; }

      } else {
        // Simple mask
        // Assume that first character is a *
        var suffix = mask.substring(1, mask.length);
        if (suffix == lcFilename.substring(lcFilename.length - suffix.length, lcFilename.length)) {
          result = i;
          break;
        }
      }
    }

    return result;
  },

  /**
   * Returns a structure holding the default values of the prefs.
   */
  defaultValues: function() {
    var result;
    result = new MafPreferencesServiceClass();

    result.archiveOpenMode = 1;
    result.urlRewrite = true;
    result.saveExtendedMetadata = false;

    result.clearTempOnClose = true;
    result.enableMafProtocol = false;
    result.addDocumentWriteOverride = false;
    result.alertOnArchiveComplete = true;

    result.alternative_save_component = false;
    result.win_associate_maff = false;
    result.win_associate_mht = false;

      var mafParentDir = this._getProfileDir();
      // Default if there's no stored prefs

      result.defaultMAFExtensionIndex = 0;

      try {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefService).getBranch("maf.");

        var navigatorUserAgent = prefs.getCharPref("general.useragent");
      } catch(e) {
        navigatorUserAgent = " Windows ";
      }

      // If not on windows
      if (navigatorUserAgent.indexOf("Windows") == -1) {
        result.temp = mafParentDir + "/maf/maftemp/";
      } else {
        result.temp = mafParentDir + "\\maf\\maftemp\\";
      };

    return result;
  },

  /**
   * Load the preferences from the user prefs.
   */
  load: function() {
    // if (!this.isLoaded) {

      var mafParentDir = this._getProfileDir();
      // Default if there's no stored prefs

      this.defaultMAFExtensionIndex = 0;


    // Load the temp path
    // Load the defaultMAFExtensionIndex
    // Load the program extensions array
      // For each extension
        // Load the extension's id
        // Load the archive program path + filename
        // Load the extract program path + filename
        // Load each of the extensions wildcard file matches
      // end-for

      try {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefService).getBranch("maf.");

        var navigatorUserAgent = prefs.getCharPref("general.useragent");
      } catch(e) {
        navigatorUserAgent = " Windows ";
      }

      try {

      // If not on windows
      if (navigatorUserAgent.indexOf("Windows") == -1) {
        this.temp = mafParentDir + "/maf/maftemp/";
      } else {
        this.temp = mafParentDir + "\\maf\\maftemp\\";
      };

        this.temp = prefs.getCharPref("temp");
        this.urlRewrite = prefs.getBoolPref("urlrewrite");
        this.saveExtendedMetadata = prefs.getBoolPref("saveextendedmetadata");
        this.defaultMAFExtensionIndex = prefs.getIntPref("defaultmafhandler");
        this.archiveOpenMode = prefs.getIntPref("archiveopenmode");

        this.clearTempOnClose = prefs.getBoolPref("clearTempOnClose");
        this.enableMafProtocol = prefs.getBoolPref("enableMafProtocol");
        this.addDocumentWriteOverride = prefs.getBoolPref("addDocumentWriteOverride");
        this.alertOnArchiveComplete = prefs.getBoolPref("alertOnArchiveComplete");

        this.alternative_save_component = prefs.getBoolPref("useAlternativeSaveComponent");

        this.win_associate_maff = prefs.getBoolPref("winassociatemaff");
        this.win_associate_mht = prefs.getBoolPref("winassociatemht");

      } catch(e) {
        // mafdebug(e);
      }

    //  this.isLoaded = true;
    //}
  },

  /**
   * Save the preferences to the user prefs.
   */
  save: function() {
    // Save the temp path
    // Save the defaultMAFExtensionIndex
    // Save the program extensions array
      // For each extension
        // Save the extension's 3 letter id
        // Save the archive program path + filename
        // Save the extract program path + filename
        // Save each of the extensions wildcard file matches
      // end-for
    try {

      var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService).getBranch("maf.");

      prefs.setCharPref("temp", this.temp);
      prefs.setBoolPref("urlrewrite", this.urlRewrite);
      prefs.setBoolPref("saveextendedmetadata", this.saveExtendedMetadata);
      prefs.setIntPref("defaultmafhandler", this.defaultMAFExtensionIndex);
      prefs.setIntPref("archiveopenmode", this.archiveOpenMode);

      prefs.setBoolPref("clearTempOnClose", this.clearTempOnClose);
      prefs.setBoolPref("enableMafProtocol", this.enableMafProtocol);
      prefs.setBoolPref("addDocumentWriteOverride", this.addDocumentWriteOverride);
      prefs.setBoolPref("alertOnArchiveComplete", this.alertOnArchiveComplete);

      prefs.setBoolPref("useAlternativeSaveComponent", this.alternative_save_component);

      prefs.setBoolPref("winassociatemaff", this.win_associate_maff);
      prefs.setBoolPref("winassociatemht", this.win_associate_mht);

    } catch(e) {
      mafdebug(e);
    }
  },

  /**
   * Creates file associations, if required by the current preferences.
   * This function never removes already created file associations.
   */
  createFileAssociationsNow: function() {
    if (this.win_associate_maff || this.win_associate_mht) {
      // Create the file type associations for Windows. If a problem occurs,
      //  it is silently ignored.
      try {
        this._createWindowsFileType(
         "MozillaMAF",
         "Mozilla Archive Format",
         this._getFirefoxExecutablePath());

        if (MafPreferences.win_associate_maff) {
          this._createWindowsFileExtensionAssociation(
           ".maff",
           "MozillaMAF");
        }

        if (MafPreferences.win_associate_mht) {
          this._createWindowsFileExtensionAssociation(
           ".mht",
           "MozillaMAF");
        }
      } catch (e) {
        // Do not show any error. 
      }
    }
  },

  /* Returns the probable path of "firefox.exe" on Windows. */
  _getFirefoxExecutablePath: function() {
    // To find the installation directory, try "XCurProcD" first, then
    //  "CurProcD". See "nsAppFileLocationProvider::CloneMozBinDirectory" in
    //  the Mozilla source code.
    try {
      var installDir =
       Components.classes["@mozilla.org/file/directory_service;1"]
       .getService(Components.interfaces.nsIProperties)
       .get("XCurProcD", Components.interfaces.nsIFile);
    } catch (e) {
      installDir =
       Components.classes["@mozilla.org/file/directory_service;1"]
       .getService(Components.interfaces.nsIProperties)
       .get("CurProcD", Components.interfaces.nsIFile);
    }

    // Assume the executable name is "firefox.exe"
    installDir.append("firefox.exe");

    // Return the required path as a string
    return installDir.path;
  },

  /*
   * Creates a global Windows file type, under HKEY_CLASSES_ROOT, associating
   *  the given ProgID with the given executable file, and assigning the
   *  second icon of the executable to the file type.
   *
   * If the ProgID already exists, its settings are overwritten.
   */
  _createWindowsFileType: function(aProgID, aDisplayName, aExecutablePath) {
    // Create or open the key of the given ProgID
    var keyProgID = Components.classes["@mozilla.org/windows-registry-key;1"]
     .createInstance(Components.interfaces.nsIWindowsRegKey);
    keyProgID.create(
     keyProgID.ROOT_KEY_CLASSES_ROOT,
     aProgID,
     keyProgID.ACCESS_WRITE);
    try {
      // Set the display name shown in the Windows file association GUI
      keyProgID.writeStringValue("", aDisplayName);
  
      // Associate a default icon
      var keyDefaultIcon = keyProgID.createChild(
       "DefaultIcon", keyProgID.ACCESS_WRITE);
      try {
        // Use the second icon of the specified executable
        keyDefaultIcon.writeStringValue("", '"' + aExecutablePath + '",1');
      } finally {
        keyDefaultIcon.close();
      }
  
      // Create a default "open" verb that passes the quoted file name to
      //  the specified executable
      var keyShell = keyProgID.createChild("shell", keyProgID.ACCESS_WRITE);
      try {
        var keyOpen = keyShell.createChild("open", keyShell.ACCESS_WRITE);
        try {
          var keyCommand = keyOpen.createChild("command", keyOpen.ACCESS_WRITE);
          try {
            keyCommand.writeStringValue("", '"' + aExecutablePath + '" "%1"');
          } finally {
            keyCommand.close();
          }
        } finally {
          keyOpen.close();
        }
      } finally {
        keyShell.close();
      }
    } finally {
      keyProgID.close();
    }
  },

  /*
   * Creates a global Windows file type association, under HKEY_CLASSES_ROOT,
   *  associating the given extension with the given ProgID.
   *
   * If the extension is already associated to another file type, the
   *  association is modified.
   */
  _createWindowsFileExtensionAssociation: function(aFileExtension, aProgID) {
    // Create or open the key of the given file extension
    var keyExtension = Components.classes["@mozilla.org/windows-registry-key;1"]
     .createInstance(Components.interfaces.nsIWindowsRegKey);
    keyExtension.create(
     keyExtension.ROOT_KEY_CLASSES_ROOT,
     aFileExtension,
     keyExtension.ACCESS_WRITE);
    try {
      // Set the file type association
      keyExtension.writeStringValue("", aProgID);
    } finally {
      keyExtension.close();
    }
  },

  _getProfileDir: function() {
    const DIR_SERVICE = new Components.Constructor("@mozilla.org/file/directory_service;1","nsIProperties");
    try {
      var result = (new DIR_SERVICE()).get("ProfD", Components.interfaces.nsIFile).path;
    } catch (e) {
      result = "";
      mafdebug(e);
    }
    return result;
  }
};