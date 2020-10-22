/* @flow strict-local */

import { addLocaleData } from 'react-intl';
import ar from 'react-intl/locale-data/ar';
import bg from 'react-intl/locale-data/bg';
import ca from 'react-intl/locale-data/ca';
import cs from 'react-intl/locale-data/cs';
import da from 'react-intl/locale-data/da';
import de from 'react-intl/locale-data/de';
import el from 'react-intl/locale-data/el';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import fa from 'react-intl/locale-data/fa';
import fi from 'react-intl/locale-data/fi';
import fr from 'react-intl/locale-data/fr';
import gl from 'react-intl/locale-data/gl';
import hi from 'react-intl/locale-data/hi';
import hr from 'react-intl/locale-data/hr';
import hu from 'react-intl/locale-data/hu';
import id from 'react-intl/locale-data/id';
import it from 'react-intl/locale-data/it';
import ja from 'react-intl/locale-data/ja';
import ko from 'react-intl/locale-data/ko';
import lt from 'react-intl/locale-data/lt';
import ml from 'react-intl/locale-data/ml';
import nb from 'react-intl/locale-data/nb';
import nl from 'react-intl/locale-data/nl';
import pa from 'react-intl/locale-data/pa';
import pl from 'react-intl/locale-data/pl';
import pt from 'react-intl/locale-data/pt';
import ro from 'react-intl/locale-data/ro';
import ru from 'react-intl/locale-data/ru';
import sk from 'react-intl/locale-data/sk';
import sr from 'react-intl/locale-data/sr';
import sv from 'react-intl/locale-data/sv';
import ta from 'react-intl/locale-data/ta';
import te from 'react-intl/locale-data/te';
import tr from 'react-intl/locale-data/tr';
import uk from 'react-intl/locale-data/uk';
import uz from 'react-intl/locale-data/uz';
import vi from 'react-intl/locale-data/vi';
import zh from 'react-intl/locale-data/zh';

[
  ar,
  bg,
  ca,
  cs,
  da,
  de,
  el,
  en,
  es,
  fa,
  fi,
  fr,
  gl,
  hi,
  hr,
  hu,
  id,
  it,
  ja,
  ko,
  lt,
  ml,
  nb,
  nl,
  pa,
  pl,
  pt,
  ro,
  ru,
  sk,
  sr,
  sv,
  ta,
  te,
  tr,
  uk,
  uz,
  vi,
  zh,

  // react-intl has zh-Hant and zh-Hant-HK, but no zh_TW or zh-Hant-TW.
  // Presumably the idea is that zh-Hant serves as zh-Hant-TW aka zh_TW.
  // We call it zh_TW because that's what Transifex calls it; so effectively
  // make an alias with that name.  (Upstream does the exact same thing to
  // make zh-Hans an alias of simply zh.)
  [{ locale: 'zh_TW', parentLocale: 'zh-Hant' }],

].forEach(locale => addLocaleData(locale));
