builder.views.plugins = {};

builder.views.plugins.show = function () {
  jQuery('#plugins').show();
  builder.views.plugins.refresh();
};

builder.views.plugins.hide = function () {
  jQuery('#plugins').hide();
};

builder.registerPostLoadHook(function() {
  jQuery('#plugins-title').text(_t('plugins_title'));
  jQuery('#plugins-back').text(_t('plugins_back'));
  jQuery('#plugins-refresh').text(_t('plugins_refresh'));
  jQuery('#plugins-loading-msg').text(_t('plugins_loading'));
  jQuery('#plugins-downloading-msg').text(_t('plugins_downloading'));
  
  jQuery('#plugins-back').click(function() {
    builder.gui.switchView(builder.views.startup);
  });
  jQuery('#plugins-refresh').click(function() {
    builder.views.plugins.refresh();
  });
});

builder.views.plugins.getName = function(info) {
  if (info.installedInfo) {
    return info.installedInfo.name + " " + info.installedInfo.pluginVersion;
  } else {
    return info.repositoryInfo.name + " " + info.repositoryInfo.browsers[bridge.browserType()].pluginVersion;
  }
};

builder.views.plugins.getIcon = function(info) {
  if (info.installedInfo && info.installedInfo.icon) {
    return builder.plugins.getResourcePath(info.identifier, info.installedInfo.icon);
  } else {
    return info.repositoryInfo ? info.repositoryInfo.icon : "";
  }
};

builder.views.plugins.getStatus = function(info) {
  var state = "";
  if (info.installState == builder.plugins.INSTALLED) {
    state = {
      "DISABLED":   _t('plugin_disabled'),
      "ENABLED":    _t('plugin_installed'),
      "TO_ENABLE":  _t('plugin_installed_to_enable'),
      "TO_DISABLE": _t('plugin_installed_to_disable')
    }[info.enabledState];
  } else {
    state = {
      "NOT_INSTALLED" : _t('plugin_not_installed'),
      "TO_INSTALL"    : _t('plugin_to_install'),
      "TO_UNINSTALL"  : _t('plugin_to_uninstall'),
      "TO_UPDATE"     : _t('plugin_to_update')
    }[info.installState];
  }
  if (builder.plugins.isUpdateable(info)) {
    state += _t('plugin_update_available', info.repositoryInfo.browsers[bridge.browserType()].pluginVersion);
  }
  return state;
};

builder.views.plugins.getEntryClass = function(info) {
  if (info.installState == builder.plugins.INSTALLED) {
    return {
      "DISABLED":   "disabled",
      "ENABLED":    "installed",
      "TO_ENABLE":  "installed",
      "TO_DISABLE": "disabled"
    }[info.enabledState];
  }
  
  return {
    "NOT_INSTALLED" : "not_installed",
    "TO_INSTALL"    : "installed",
    "TO_UNINSTALL"  : "not_installed",
    "TO_UPDATE"     : "installed"
  }[info.installState];
};

builder.views.plugins.getDescription = function(info) {
  var i = info.installedInfo ? info.installedInfo : info.repositoryInfo;
  
  if (i["description_" + builder.translate.getLocaleName()]) {
    return i["description_" + builder.translate.getLocaleName()];
  } else {
    return i.description;
  }
};

builder.views.plugins.makePluginEntry = function(info) {
  var entry = newNode('li', {'class': builder.views.plugins.getEntryClass(info), 'id': info.identifier + '-entry'},
    newNode('img', {'src': builder.views.plugins.getIcon(info), 'class': 'pluginIcon'}),
    newNode('div', {'class': 'pluginInfo'},
      newNode('div', {'class': 'pluginHeader'},
        newNode('span', {'class': 'pluginName'}, builder.views.plugins.getName(info)),
        newNode('span', {'class': 'pluginStatus', 'id': info.identifier + '-status'}, builder.views.plugins.getStatus(info))
      ),
      newNode('div', {'class': 'pluginDescription'}, builder.views.plugins.getDescription(info)),
      newNode('span', {'id': info.identifier + '-s-install'}, newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-install'  }, _t('plugin_install'))),
      newNode('span', {'id': info.identifier + '-s-cancel-install'}, newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-cancel-install'  }, _t('plugin_cancel_install'))),
      newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-uninstall'}, _t('plugin_uninstall')),
      newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-cancel-uninstall'}, _t('plugin_cancel_uninstall')),
      newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-update'   }, _t('plugin_update')),
      newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-cancel-update' }, _t('plugin_cancel_update')),
      newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-enable' }, _t('plugin_enable')),
      newNode('a', {'href': '#', 'class': 'button', 'id': info.identifier + '-disable'  }, _t('plugin_disable'))
  ));
    
  return entry;
};

builder.views.plugins.updatePluginEntry = function(info) {
  jQuery('#' + info.identifier + '-entry').removeClass().addClass(builder.views.plugins.getEntryClass(info));
  jQuery('#' + info.identifier + '-status').text(builder.views.plugins.getStatus(info));
  
  jQuery('#' + info.identifier + '-install').toggle(info.installState == builder.plugins.NOT_INSTALLED);
  jQuery('#' + info.identifier + '-cancel-install').toggle(info.installState == builder.plugins.TO_INSTALL);
  jQuery('#' + info.identifier + '-uninstall').toggle(info.installState == builder.plugins.INSTALLED);
  jQuery('#' + info.identifier + '-cancel-uninstall').toggle(info.installState == builder.plugins.TO_UNINSTALL);
  jQuery('#' + info.identifier + '-update').toggle(info.installState == builder.plugins.INSTALLED && builder.plugins.isUpdateable(info));
  jQuery('#' + info.identifier + '-cancel-update').toggle(info.installState == builder.plugins.TO_UPDATE);
  jQuery('#' + info.identifier + '-enable').toggle(info.installState == builder.plugins.INSTALLED && (info.enabledState == builder.plugins.DISABLED || info.enabledState == builder.plugins.TO_DISABLE));
  jQuery('#' + info.identifier + '-disable').toggle(info.installState == builder.plugins.INSTALLED && (info.enabledState == builder.plugins.ENABLED || info.enabledState == builder.plugins.TO_ENABLE));
};

builder.views.plugins.wirePluginEntry = function(info) {
  jQuery('#' + info.identifier + '-install').click(function() {
    builder.plugins.setInstallState(info.identifier, builder.plugins.TO_INSTALL);
    info.installState = builder.plugins.TO_INSTALL;
    builder.views.plugins.updatePluginEntry(info);
    builder.plugins.performDownload(info.identifier, info.repositoryInfo.browsers[bridge.browserType()].downloadUrl);
  });  
  
  jQuery('#' + info.identifier + '-cancel-install').click(function() {
    builder.plugins.setInstallState(info.identifier, builder.plugins.NOT_INSTALLED);
    info.installState = builder.plugins.NOT_INSTALLED;
    builder.views.plugins.updatePluginEntry(info);
  });
  
  jQuery('#' + info.identifier + '-uninstall').click(function() {
    builder.plugins.setInstallState(info.identifier, builder.plugins.TO_UNINSTALL);
    info.installState = builder.plugins.TO_UNINSTALL;
    builder.views.plugins.updatePluginEntry(info);
  });
  
  jQuery('#' + info.identifier + '-cancel-uninstall').click(function() {
    builder.plugins.setInstallState(info.identifier, builder.plugins.INSTALLED);
    info.installState = builder.plugins.INSTALLED;
    builder.views.plugins.updatePluginEntry(info);
  });
  
  jQuery('#' + info.identifier + '-update').click(function() {
    builder.plugins.setInstallState(info.identifier, builder.plugins.TO_UPDATE);
    info.installState = builder.plugins.TO_UPDATE;
    builder.views.plugins.updatePluginEntry(info);
    builder.plugins.performDownload(info.identifier, info.repositoryInfo.browsers[bridge.browserType()].downloadUrl);
  });
  
  jQuery('#' + info.identifier + '-cancel-update').click(function() {
    builder.plugins.setInstallState(info.identifier, builder.plugins.INSTALLED);
    info.installState = builder.plugins.INSTALLED;
    builder.views.plugins.updatePluginEntry(info);
  });
  
  jQuery('#' + info.identifier + '-enable').click(function() {
    var newEnabled = info.enabledState == builder.plugins.DISABLED ? builder.plugins.TO_ENABLE : builder.plugins.ENABLED;
    builder.plugins.setEnabledState(info.identifier, newEnabled);
    info.enabledState = newEnabled;
    builder.views.plugins.updatePluginEntry(info);
  });
  
  jQuery('#' + info.identifier + '-disable').click(function() {
    var newEnabled = info.enabledState == builder.plugins.ENABLED ? builder.plugins.TO_DISABLE : builder.plugins.DISABLED;
    builder.plugins.setEnabledState(info.identifier, newEnabled);
    info.enabledState = newEnabled;
    builder.views.plugins.updatePluginEntry(info);
  });
}

builder.views.plugins.refresh = function() {
  jQuery('#plugins-loading').show();
  jQuery('#plugins-list').html('');
  builder.plugins.getListAsync(function(result, error) {
    jQuery('#plugins-loading').hide();
    for (var i = 0; i < result.length; i++) {
      jQuery('#plugins-list').append(builder.views.plugins.makePluginEntry(result[i]));
      builder.views.plugins.wirePluginEntry(result[i]);
      builder.views.plugins.updatePluginEntry(result[i]);
    }
  });
};