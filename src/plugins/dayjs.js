// src/plugins/dayjs.js
import dayjs from 'dayjs/esm/index';
import localizedFormat from 'dayjs/esm/plugin/localizedFormat/index';
import relativeTime from 'dayjs/esm/plugin/relativeTime/index';

import 'dayjs/esm/locale/ar';
import 'dayjs/esm/locale/en';
import 'dayjs/esm/locale/fr';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export default dayjs;
