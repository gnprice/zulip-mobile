// @flow strict-local

// These polyfills are automatically conditional: they try to check if
// they're needed, and if not then they do nothing.
//
// TODO(hermes): Cut these if Hermes ever grows support for these APIs.  See:
//     https://github.com/facebook/hermes/issues/23
//     https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';

/* The following list is @generated like so:
   $ ls static/translations/messages_*.json \
       | perl -lpe 's/ .*messages_(.*?)[._-].* /$1/x' \
       | LC_ALL=C sort -u \
       | perl -lne '
           print "import '\''\@formatjs/intl-pluralrules/locale-data/$_'\'';"
         '
*/
import '@formatjs/intl-pluralrules/locale-data/ar';
import '@formatjs/intl-pluralrules/locale-data/bg';
import '@formatjs/intl-pluralrules/locale-data/bn';
import '@formatjs/intl-pluralrules/locale-data/ca';
import '@formatjs/intl-pluralrules/locale-data/cs';
import '@formatjs/intl-pluralrules/locale-data/cy';
import '@formatjs/intl-pluralrules/locale-data/da';
import '@formatjs/intl-pluralrules/locale-data/de';
import '@formatjs/intl-pluralrules/locale-data/el';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/eo';
import '@formatjs/intl-pluralrules/locale-data/es';
import '@formatjs/intl-pluralrules/locale-data/fa';
import '@formatjs/intl-pluralrules/locale-data/fi';
import '@formatjs/intl-pluralrules/locale-data/fr';
import '@formatjs/intl-pluralrules/locale-data/gl';
import '@formatjs/intl-pluralrules/locale-data/gu';
import '@formatjs/intl-pluralrules/locale-data/hi';
import '@formatjs/intl-pluralrules/locale-data/hr';
import '@formatjs/intl-pluralrules/locale-data/hu';
import '@formatjs/intl-pluralrules/locale-data/id';
import '@formatjs/intl-pluralrules/locale-data/it';
import '@formatjs/intl-pluralrules/locale-data/ja';
import '@formatjs/intl-pluralrules/locale-data/ko';
import '@formatjs/intl-pluralrules/locale-data/lt';
import '@formatjs/intl-pluralrules/locale-data/ml';
import '@formatjs/intl-pluralrules/locale-data/mn';
import '@formatjs/intl-pluralrules/locale-data/my';
import '@formatjs/intl-pluralrules/locale-data/nl';
import '@formatjs/intl-pluralrules/locale-data/no';
import '@formatjs/intl-pluralrules/locale-data/pa';
import '@formatjs/intl-pluralrules/locale-data/pcm';
import '@formatjs/intl-pluralrules/locale-data/pl';
import '@formatjs/intl-pluralrules/locale-data/pt';
import '@formatjs/intl-pluralrules/locale-data/ro';
import '@formatjs/intl-pluralrules/locale-data/ru';
import '@formatjs/intl-pluralrules/locale-data/si';
import '@formatjs/intl-pluralrules/locale-data/sk';
import '@formatjs/intl-pluralrules/locale-data/sr';
import '@formatjs/intl-pluralrules/locale-data/sv';
import '@formatjs/intl-pluralrules/locale-data/ta';
import '@formatjs/intl-pluralrules/locale-data/te';
import '@formatjs/intl-pluralrules/locale-data/tl';
import '@formatjs/intl-pluralrules/locale-data/tr';
import '@formatjs/intl-pluralrules/locale-data/uk';
import '@formatjs/intl-pluralrules/locale-data/ur';
import '@formatjs/intl-pluralrules/locale-data/uz';
import '@formatjs/intl-pluralrules/locale-data/vi';
import '@formatjs/intl-pluralrules/locale-data/zh';
