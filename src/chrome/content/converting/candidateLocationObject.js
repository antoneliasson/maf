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
 * Represents a source, destination and bin location in the file system.
 */
function CandidateLocation() {

}

CandidateLocation.prototype = {

  // --- Public methods and properties ---

  /**
   * String representing the relative path with regard to the root location.
   */
  relativePath: "",

  /**
   * nsIFile representing the source file or folder. This may be null for
   *  support folders location representing a destination path only.
   */
  source: null,

  /**
   * nsIFile representing the destination file or folder. This may be the same
   *  path or object as the source file.
   */
  dest: null,

  /**
   * nsIFile representing the place where the source will be moved after a
   *  successful conversion. This must be the null if moving is not required.
   */
  bin: null,

  /**
   * Returns a new CandidateLocation object representing a subfolder or a file
   *  located under the current location.
   */
  getSubLocation: function(aLeafName) {
    var newLocation = new CandidateLocation();
    newLocation.relativePath = this.relativePath + aLeafName + "/";
    newLocation.source = this.source.clone();
    newLocation.source.append(aLeafName);
    newLocation.dest = this.dest.clone();
    newLocation.dest.append(aLeafName);
    if (this.bin) {
      newLocation.bin = this.bin.clone();
      newLocation.bin.append(aLeafName);
    }
    return newLocation;
  },
}
