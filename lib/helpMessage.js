
module.exports = function() {
  var txt = 'Usage: panini --layouts=[layoutdir] --root=[rootdir] --output=[destdir] [other options] \'pagesglob\'\n' +
            '\n' +
            'Options: \n' +
            '  --layouts  (required) path to a folder containing layouts\n' +
            '  --root     (required) path to the root folder all pages live in\n' +
            '  --output     (required) path to the folder compiled pages should get sent to\n' +
            '  --partials            path to root folder for partials \n' +
            '  --inlinelayout            prefix of inline partial to look for \n' +
            '  --helpers             path to folder for additional helpers \n' +
            '  --data                path to folder for additional data \n' +
            '\n' +
            'the argument pagesglob should be a glob describing what pages you want to apply panini to.\n' +
            '\n' +
            'Example: panini --root=src/pages --layouts=src/layouts --partials=src/partials --data=src/data --output=dist \'src/pages/**/*.html\'\n';


  process.stdout.write(txt);
}
