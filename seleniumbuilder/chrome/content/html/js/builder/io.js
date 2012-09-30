builder.io = {};

builder.io.loadFile = function(path) {
  var file = null;
  if (!path) {
    file = showFilePicker(window, _t('select_a_file'), 
                          Components.interfaces.nsIFilePicker.modeOpen,
                          Format.TEST_CASE_DIRECTORY_PREF,
                          function(fp) { return fp.file; });
  } else {
    file = FileUtils.getFile(path);
  }
  return file;
};

builder.io.readFile = function(file) {
  var sis = FileUtils.openFileInputStream(file);
  var data = FileUtils.getUnicodeConverter('UTF-8').ConvertToUnicode(sis.read(sis.available()));
  sis.close();
  return data;
};

/** Displays a dialog to load a script and add it to the current suite. */
builder.io.loadNewScriptForSuite = function(path) {
  var file = builder.io.loadFile(path);
  if (!file) { return null; }
  
  for (var i = 0; i < builder.seleniumVersions.length; i++) {
    var seleniumVersion = builder.seleniumVersions[i];
    try {
      var script = seleniumVersion.io.parseScript(file);
      if (script) {
        return script;
      }
    } catch (e) {
      // Ignore!
    }
  }
  
  alert(_t('unable_to_read_file'));
  return null;
};

/** Displays a dialog to load a file (a script or suite) and attempts to interpret it and load it in. */
builder.io.loadUnknownFile = function(path) {
  var file = builder.io.loadFile(path);
  if (!file) { return; }
  
  var errors = "";
  
  for (var i = 0; i < builder.seleniumVersions.length; i++) {
    var seleniumVersion = builder.seleniumVersions[i];
    
    try {
      var script = seleniumVersion.io.parseScript(file);
      if (script.steps.length == 0) {
        throw _t('script_is_empty');
      }
      if (script) {
        builder.gui.switchView(builder.views.script);
        builder.setScript(script);
        builder.stepdisplay.update();
        builder.suite.setCurrentScriptSaveRequired(false);
        builder.gui.suite.update();
        return;
      }
    } catch (e) {
      errors += "\n" + seleniumVersion.name + ": " + e;
    }
    try {
      if (!seleniumVersion.io.parseSuite) { continue; }
      var suite = seleniumVersion.io.parseSuite(file);
      if (suite.scripts.length == 0) {
        throw _t('suite_is_empty');
      }
      if (suite) {
        builder.gui.switchView(builder.views.script);
        builder.suite.setSuite(suite.scripts, suite.path);
        builder.stepdisplay.update();
        builder.suite.setCurrentScriptSaveRequired(false);
        builder.gui.suite.update();
        return;
      }
    } catch (e) {
      errors += "\n" + seleniumVersion.name + " " + _t('suite') + ": " + e;
    }
  }
  
  builder.gui.switchView(builder.views.startup);
  
  alert(_t('unable_to_read_file') + errors);
};