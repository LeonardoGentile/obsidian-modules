const { template } = self.require("_modules/template.js");

const config = {
  "journal": {
    "period": 0,
    "files_paths": ["journal"],
    "ignore_fields": ["tags"],
    "default_values": [{
      "name": "includeFile",
      "value": "[[${'INCLUDE_TEMPLATE_DIR'}/${'type'}]]"
    }]
  },
  "resource": {
    "files_paths": ["library"],
    "ignore_fields": ["status"],
    "default_values": [{
      "name": "includeFile",
      "value": "[[${'INCLUDE_TEMPLATE_DIR'}/${'type'}]]"
    }]
  },
  // "reference" {
  //   "extends": "resources"
  // }
}

module.exports = {
  config
}

"_templates/include/resource"