'use strict';
(() => {
  function Ue() {
    let t = document.querySelector('.cc_pro_session-tab-menu'),
      e = document.querySelector('.cc_pro_session-tabs');
    if (!t || !e) return;
    let n = 1200,
      r = () => {
        if (t.offsetWidth < n) {
          let i = document.querySelector('.cc_pro_tabs_button.prev'),
            a = document.querySelector('.cc_pro_tabs_button.next');
          if (i && a) {
            (e.contains(i) || e.appendChild(i), e.contains(a) || e.appendChild(a));
            let o = t.querySelector('.cc_pro_session-tab'),
              u = o ? o.offsetWidth : 200,
              { overflowX: l } = getComputedStyle(t);
            l !== 'auto' && l !== 'scroll' && (t.style.overflowX = 'auto');
            let f = () => {
              let { scrollLeft: h } = t,
                { scrollWidth: g } = t,
                { clientWidth: d } = t,
                w = h <= 1,
                S = h + d >= g - 1;
              w && S
                ? ((i.style.display = 'none'), (a.style.display = 'none'))
                : w
                  ? ((i.style.display = 'none'), (a.style.display = ''))
                  : S
                    ? ((i.style.display = ''), (a.style.display = 'none'))
                    : ((i.style.display = ''), (a.style.display = ''));
            };
            (t.dataset.scrollListenerAttached ||
              (t.addEventListener('scroll', f), (t.dataset.scrollListenerAttached = 'true')),
              f(),
              i.dataset.scrollHandlerAttached ||
                (i.addEventListener('click', () => {
                  (t.scrollBy({ left: -u, behavior: 'smooth' }),
                    setTimeout(() => {
                      f();
                    }, 300));
                }),
                (i.dataset.scrollHandlerAttached = 'true')),
              a.dataset.scrollHandlerAttached ||
                (a.addEventListener('click', () => {
                  (t.scrollBy({ left: u, behavior: 'smooth' }),
                    setTimeout(() => {
                      f();
                    }, 300));
                }),
                (a.dataset.scrollHandlerAttached = 'true')));
          }
        }
      };
    (r(), window.addEventListener('resize', r));
  }
  var z = class extends Error {},
    Ke = class extends z {
      constructor(e) {
        super(`Invalid DateTime: ${e.toMessage()}`);
      }
    },
    Xe = class extends z {
      constructor(e) {
        super(`Invalid Interval: ${e.toMessage()}`);
      }
    },
    et = class extends z {
      constructor(e) {
        super(`Invalid Duration: ${e.toMessage()}`);
      }
    },
    Y = class extends z {},
    Ie = class extends z {
      constructor(e) {
        super(`Invalid unit ${e}`);
      }
    },
    M = class extends z {},
    H = class extends z {
      constructor() {
        super('Zone is an abstract class');
      }
    },
    c = 'numeric',
    A = 'short',
    b = 'long',
    be = { year: c, month: c, day: c },
    en = { year: c, month: A, day: c },
    or = { year: c, month: A, day: c, weekday: A },
    tn = { year: c, month: b, day: c },
    nn = { year: c, month: b, day: c, weekday: b },
    rn = { hour: c, minute: c },
    sn = { hour: c, minute: c, second: c },
    an = { hour: c, minute: c, second: c, timeZoneName: A },
    on = { hour: c, minute: c, second: c, timeZoneName: b },
    un = { hour: c, minute: c, hourCycle: 'h23' },
    ln = { hour: c, minute: c, second: c, hourCycle: 'h23' },
    cn = { hour: c, minute: c, second: c, hourCycle: 'h23', timeZoneName: A },
    fn = { hour: c, minute: c, second: c, hourCycle: 'h23', timeZoneName: b },
    dn = { year: c, month: c, day: c, hour: c, minute: c },
    hn = { year: c, month: c, day: c, hour: c, minute: c, second: c },
    mn = { year: c, month: A, day: c, hour: c, minute: c },
    yn = { year: c, month: A, day: c, hour: c, minute: c, second: c },
    ur = { year: c, month: A, day: c, weekday: A, hour: c, minute: c },
    gn = { year: c, month: b, day: c, hour: c, minute: c, timeZoneName: A },
    wn = { year: c, month: b, day: c, hour: c, minute: c, second: c, timeZoneName: A },
    Tn = { year: c, month: b, day: c, weekday: b, hour: c, minute: c, timeZoneName: b },
    pn = { year: c, month: b, day: c, weekday: b, hour: c, minute: c, second: c, timeZoneName: b },
    j = class {
      get type() {
        throw new H();
      }
      get name() {
        throw new H();
      }
      get ianaName() {
        return this.name;
      }
      get isUniversal() {
        throw new H();
      }
      offsetName(e, n) {
        throw new H();
      }
      formatOffset(e, n) {
        throw new H();
      }
      offset(e) {
        throw new H();
      }
      equals(e) {
        throw new H();
      }
      get isValid() {
        throw new H();
      }
    },
    qe = null,
    xe = class t extends j {
      static get instance() {
        return (qe === null && (qe = new t()), qe);
      }
      get type() {
        return 'system';
      }
      get name() {
        return new Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
      get isUniversal() {
        return !1;
      }
      offsetName(e, { format: n, locale: r }) {
        return xn(e, n, r);
      }
      formatOffset(e, n) {
        return ge(this.offset(e), n);
      }
      offset(e) {
        return -new Date(e).getTimezoneOffset();
      }
      equals(e) {
        return e.type === 'system';
      }
      get isValid() {
        return !0;
      }
    },
    tt = new Map();
  function lr(t) {
    let e = tt.get(t);
    return (
      e === void 0 &&
        ((e = new Intl.DateTimeFormat('en-US', {
          hour12: !1,
          timeZone: t,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          era: 'short',
        })),
        tt.set(t, e)),
      e
    );
  }
  var cr = { year: 0, month: 1, day: 2, era: 3, hour: 4, minute: 5, second: 6 };
  function fr(t, e) {
    let n = t.format(e).replace(/\u200E/g, ''),
      r = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(n),
      [, s, i, a, o, u, l, f] = r;
    return [a, s, i, o, u, l, f];
  }
  function dr(t, e) {
    let n = t.formatToParts(e),
      r = [];
    for (let s = 0; s < n.length; s++) {
      let { type: i, value: a } = n[s],
        o = cr[i];
      i === 'era' ? (r[o] = a) : m(o) || (r[o] = parseInt(a, 10));
    }
    return r;
  }
  var Ye = new Map(),
    _ = class t extends j {
      static create(e) {
        let n = Ye.get(e);
        return (n === void 0 && Ye.set(e, (n = new t(e))), n);
      }
      static resetCache() {
        (Ye.clear(), tt.clear());
      }
      static isValidSpecifier(e) {
        return this.isValidZone(e);
      }
      static isValidZone(e) {
        if (!e) return !1;
        try {
          return (new Intl.DateTimeFormat('en-US', { timeZone: e }).format(), !0);
        } catch {
          return !1;
        }
      }
      constructor(e) {
        (super(), (this.zoneName = e), (this.valid = t.isValidZone(e)));
      }
      get type() {
        return 'iana';
      }
      get name() {
        return this.zoneName;
      }
      get isUniversal() {
        return !1;
      }
      offsetName(e, { format: n, locale: r }) {
        return xn(e, n, r, this.name);
      }
      formatOffset(e, n) {
        return ge(this.offset(e), n);
      }
      offset(e) {
        if (!this.valid) return NaN;
        let n = new Date(e);
        if (isNaN(n)) return NaN;
        let r = lr(this.name),
          [s, i, a, o, u, l, f] = r.formatToParts ? dr(r, n) : fr(r, n);
        o === 'BC' && (s = -Math.abs(s) + 1);
        let g = $e({
            year: s,
            month: i,
            day: a,
            hour: u === 24 ? 0 : u,
            minute: l,
            second: f,
            millisecond: 0,
          }),
          d = +n,
          w = d % 1e3;
        return ((d -= w >= 0 ? w : 1e3 + w), (g - d) / (60 * 1e3));
      }
      equals(e) {
        return e.type === 'iana' && e.name === this.name;
      }
      get isValid() {
        return this.valid;
      }
    },
    Dt = {};
  function hr(t, e = {}) {
    let n = JSON.stringify([t, e]),
      r = Dt[n];
    return (r || ((r = new Intl.ListFormat(t, e)), (Dt[n] = r)), r);
  }
  var nt = new Map();
  function rt(t, e = {}) {
    let n = JSON.stringify([t, e]),
      r = nt.get(n);
    return (r === void 0 && ((r = new Intl.DateTimeFormat(t, e)), nt.set(n, r)), r);
  }
  var st = new Map();
  function mr(t, e = {}) {
    let n = JSON.stringify([t, e]),
      r = st.get(n);
    return (r === void 0 && ((r = new Intl.NumberFormat(t, e)), st.set(n, r)), r);
  }
  var it = new Map();
  function yr(t, e = {}) {
    let { base: n, ...r } = e,
      s = JSON.stringify([t, r]),
      i = it.get(s);
    return (i === void 0 && ((i = new Intl.RelativeTimeFormat(t, e)), it.set(s, i)), i);
  }
  var he = null;
  function gr() {
    return he || ((he = new Intl.DateTimeFormat().resolvedOptions().locale), he);
  }
  var at = new Map();
  function kn(t) {
    let e = at.get(t);
    return (e === void 0 && ((e = new Intl.DateTimeFormat(t).resolvedOptions()), at.set(t, e)), e);
  }
  var ot = new Map();
  function wr(t) {
    let e = ot.get(t);
    if (!e) {
      let n = new Intl.Locale(t);
      ((e = 'getWeekInfo' in n ? n.getWeekInfo() : n.weekInfo),
        'minimalDays' in e || (e = { ...Sn, ...e }),
        ot.set(t, e));
    }
    return e;
  }
  function Tr(t) {
    let e = t.indexOf('-x-');
    e !== -1 && (t = t.substring(0, e));
    let n = t.indexOf('-u-');
    if (n === -1) return [t];
    {
      let r, s;
      try {
        ((r = rt(t).resolvedOptions()), (s = t));
      } catch {
        let u = t.substring(0, n);
        ((r = rt(u).resolvedOptions()), (s = u));
      }
      let { numberingSystem: i, calendar: a } = r;
      return [s, i, a];
    }
  }
  function pr(t, e, n) {
    return (
      (n || e) &&
        (t.includes('-u-') || (t += '-u'), n && (t += `-ca-${n}`), e && (t += `-nu-${e}`)),
      t
    );
  }
  function kr(t) {
    let e = [];
    for (let n = 1; n <= 12; n++) {
      let r = y.utc(2009, n, 1);
      e.push(t(r));
    }
    return e;
  }
  function Sr(t) {
    let e = [];
    for (let n = 1; n <= 7; n++) {
      let r = y.utc(2016, 11, 13 + n);
      e.push(t(r));
    }
    return e;
  }
  function Se(t, e, n, r) {
    let s = t.listingMode();
    return s === 'error' ? null : s === 'en' ? n(e) : r(e);
  }
  function Or(t) {
    return t.numberingSystem && t.numberingSystem !== 'latn'
      ? !1
      : t.numberingSystem === 'latn' ||
          !t.locale ||
          t.locale.startsWith('en') ||
          kn(t.locale).numberingSystem === 'latn';
  }
  var ut = class {
      constructor(e, n, r) {
        ((this.padTo = r.padTo || 0), (this.floor = r.floor || !1));
        let { padTo: s, floor: i, ...a } = r;
        if (!n || Object.keys(a).length > 0) {
          let o = { useGrouping: !1, ...r };
          (r.padTo > 0 && (o.minimumIntegerDigits = r.padTo), (this.inf = mr(e, o)));
        }
      }
      format(e) {
        if (this.inf) {
          let n = this.floor ? Math.floor(e) : e;
          return this.inf.format(n);
        } else {
          let n = this.floor ? Math.floor(e) : kt(e, 3);
          return O(n, this.padTo);
        }
      }
    },
    lt = class {
      constructor(e, n, r) {
        ((this.opts = r), (this.originalZone = void 0));
        let s;
        if (this.opts.timeZone) this.dt = e;
        else if (e.zone.type === 'fixed') {
          let a = -1 * (e.offset / 60),
            o = a >= 0 ? `Etc/GMT+${a}` : `Etc/GMT${a}`;
          e.offset !== 0 && _.create(o).valid
            ? ((s = o), (this.dt = e))
            : ((s = 'UTC'),
              (this.dt = e.offset === 0 ? e : e.setZone('UTC').plus({ minutes: e.offset })),
              (this.originalZone = e.zone));
        } else
          e.zone.type === 'system'
            ? (this.dt = e)
            : e.zone.type === 'iana'
              ? ((this.dt = e), (s = e.zone.name))
              : ((s = 'UTC'),
                (this.dt = e.setZone('UTC').plus({ minutes: e.offset })),
                (this.originalZone = e.zone));
        let i = { ...this.opts };
        ((i.timeZone = i.timeZone || s), (this.dtf = rt(n, i)));
      }
      format() {
        return this.originalZone
          ? this.formatToParts()
              .map(({ value: e }) => e)
              .join('')
          : this.dtf.format(this.dt.toJSDate());
      }
      formatToParts() {
        let e = this.dtf.formatToParts(this.dt.toJSDate());
        return this.originalZone
          ? e.map((n) => {
              if (n.type === 'timeZoneName') {
                let r = this.originalZone.offsetName(this.dt.ts, {
                  locale: this.dt.locale,
                  format: this.opts.timeZoneName,
                });
                return { ...n, value: r };
              } else return n;
            })
          : e;
      }
      resolvedOptions() {
        return this.dtf.resolvedOptions();
      }
    },
    ct = class {
      constructor(e, n, r) {
        ((this.opts = { style: 'long', ...r }), !n && In() && (this.rtf = yr(e, r)));
      }
      format(e, n) {
        return this.rtf
          ? this.rtf.format(e, n)
          : qr(n, e, this.opts.numeric, this.opts.style !== 'long');
      }
      formatToParts(e, n) {
        return this.rtf ? this.rtf.formatToParts(e, n) : [];
      }
    },
    Sn = { firstDay: 1, minimalDays: 4, weekend: [6, 7] },
    p = class t {
      static fromOpts(e) {
        return t.create(
          e.locale,
          e.numberingSystem,
          e.outputCalendar,
          e.weekSettings,
          e.defaultToEN
        );
      }
      static create(e, n, r, s, i = !1) {
        let a = e || k.defaultLocale,
          o = a || (i ? 'en-US' : gr()),
          u = n || k.defaultNumberingSystem,
          l = r || k.defaultOutputCalendar,
          f = ht(s) || k.defaultWeekSettings;
        return new t(o, u, l, f, a);
      }
      static resetCache() {
        ((he = null), nt.clear(), st.clear(), it.clear(), at.clear(), ot.clear());
      }
      static fromObject({
        locale: e,
        numberingSystem: n,
        outputCalendar: r,
        weekSettings: s,
      } = {}) {
        return t.create(e, n, r, s);
      }
      constructor(e, n, r, s, i) {
        let [a, o, u] = Tr(e);
        ((this.locale = a),
          (this.numberingSystem = n || o || null),
          (this.outputCalendar = r || u || null),
          (this.weekSettings = s),
          (this.intl = pr(this.locale, this.numberingSystem, this.outputCalendar)),
          (this.weekdaysCache = { format: {}, standalone: {} }),
          (this.monthsCache = { format: {}, standalone: {} }),
          (this.meridiemCache = null),
          (this.eraCache = {}),
          (this.specifiedLocale = i),
          (this.fastNumbersCached = null));
      }
      get fastNumbers() {
        return (
          this.fastNumbersCached == null && (this.fastNumbersCached = Or(this)),
          this.fastNumbersCached
        );
      }
      listingMode() {
        let e = this.isEnglish(),
          n =
            (this.numberingSystem === null || this.numberingSystem === 'latn') &&
            (this.outputCalendar === null || this.outputCalendar === 'gregory');
        return e && n ? 'en' : 'intl';
      }
      clone(e) {
        return !e || Object.getOwnPropertyNames(e).length === 0
          ? this
          : t.create(
              e.locale || this.specifiedLocale,
              e.numberingSystem || this.numberingSystem,
              e.outputCalendar || this.outputCalendar,
              ht(e.weekSettings) || this.weekSettings,
              e.defaultToEN || !1
            );
      }
      redefaultToEN(e = {}) {
        return this.clone({ ...e, defaultToEN: !0 });
      }
      redefaultToSystem(e = {}) {
        return this.clone({ ...e, defaultToEN: !1 });
      }
      months(e, n = !1) {
        return Se(this, e, Cn, () => {
          let r = this.intl === 'ja' || this.intl.startsWith('ja-');
          n &= !r;
          let s = n ? { month: e, day: 'numeric' } : { month: e },
            i = n ? 'format' : 'standalone';
          if (!this.monthsCache[i][e]) {
            let a = r ? (o) => this.dtFormatter(o, s).format() : (o) => this.extract(o, s, 'month');
            this.monthsCache[i][e] = kr(a);
          }
          return this.monthsCache[i][e];
        });
      }
      weekdays(e, n = !1) {
        return Se(this, e, $n, () => {
          let r = n
              ? { weekday: e, year: 'numeric', month: 'long', day: 'numeric' }
              : { weekday: e },
            s = n ? 'format' : 'standalone';
          return (
            this.weekdaysCache[s][e] ||
              (this.weekdaysCache[s][e] = Sr((i) => this.extract(i, r, 'weekday'))),
            this.weekdaysCache[s][e]
          );
        });
      }
      meridiems() {
        return Se(
          this,
          void 0,
          () => Zn,
          () => {
            if (!this.meridiemCache) {
              let e = { hour: 'numeric', hourCycle: 'h12' };
              this.meridiemCache = [y.utc(2016, 11, 13, 9), y.utc(2016, 11, 13, 19)].map((n) =>
                this.extract(n, e, 'dayperiod')
              );
            }
            return this.meridiemCache;
          }
        );
      }
      eras(e) {
        return Se(this, e, An, () => {
          let n = { era: e };
          return (
            this.eraCache[e] ||
              (this.eraCache[e] = [y.utc(-40, 1, 1), y.utc(2017, 1, 1)].map((r) =>
                this.extract(r, n, 'era')
              )),
            this.eraCache[e]
          );
        });
      }
      extract(e, n, r) {
        let s = this.dtFormatter(e, n),
          i = s.formatToParts(),
          a = i.find((o) => o.type.toLowerCase() === r);
        return a ? a.value : null;
      }
      numberFormatter(e = {}) {
        return new ut(this.intl, e.forceSimple || this.fastNumbers, e);
      }
      dtFormatter(e, n = {}) {
        return new lt(e, this.intl, n);
      }
      relFormatter(e = {}) {
        return new ct(this.intl, this.isEnglish(), e);
      }
      listFormatter(e = {}) {
        return hr(this.intl, e);
      }
      isEnglish() {
        return (
          this.locale === 'en' ||
          this.locale.toLowerCase() === 'en-us' ||
          kn(this.intl).locale.startsWith('en-us')
        );
      }
      getWeekSettings() {
        return this.weekSettings ? this.weekSettings : bn() ? wr(this.locale) : Sn;
      }
      getStartOfWeek() {
        return this.getWeekSettings().firstDay;
      }
      getMinDaysInFirstWeek() {
        return this.getWeekSettings().minimalDays;
      }
      getWeekendDays() {
        return this.getWeekSettings().weekend;
      }
      equals(e) {
        return (
          this.locale === e.locale &&
          this.numberingSystem === e.numberingSystem &&
          this.outputCalendar === e.outputCalendar
        );
      }
      toString() {
        return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
      }
    },
    Pe = null,
    L = class t extends j {
      static get utcInstance() {
        return (Pe === null && (Pe = new t(0)), Pe);
      }
      static instance(e) {
        return e === 0 ? t.utcInstance : new t(e);
      }
      static parseSpecifier(e) {
        if (e) {
          let n = e.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
          if (n) return new t(Ze(n[1], n[2]));
        }
        return null;
      }
      constructor(e) {
        (super(), (this.fixed = e));
      }
      get type() {
        return 'fixed';
      }
      get name() {
        return this.fixed === 0 ? 'UTC' : `UTC${ge(this.fixed, 'narrow')}`;
      }
      get ianaName() {
        return this.fixed === 0 ? 'Etc/UTC' : `Etc/GMT${ge(-this.fixed, 'narrow')}`;
      }
      offsetName() {
        return this.name;
      }
      formatOffset(e, n) {
        return ge(this.fixed, n);
      }
      get isUniversal() {
        return !0;
      }
      offset() {
        return this.fixed;
      }
      equals(e) {
        return e.type === 'fixed' && e.fixed === this.fixed;
      }
      get isValid() {
        return !0;
      }
    },
    ft = class extends j {
      constructor(e) {
        (super(), (this.zoneName = e));
      }
      get type() {
        return 'invalid';
      }
      get name() {
        return this.zoneName;
      }
      get isUniversal() {
        return !1;
      }
      offsetName() {
        return null;
      }
      formatOffset() {
        return '';
      }
      offset() {
        return NaN;
      }
      equals() {
        return !1;
      }
      get isValid() {
        return !1;
      }
    };
  function q(t, e) {
    if (m(t) || t === null) return e;
    if (t instanceof j) return t;
    if (Ir(t)) {
      let n = t.toLowerCase();
      return n === 'default'
        ? e
        : n === 'local' || n === 'system'
          ? xe.instance
          : n === 'utc' || n === 'gmt'
            ? L.utcInstance
            : L.parseSpecifier(n) || _.create(t);
    } else
      return P(t)
        ? L.instance(t)
        : typeof t == 'object' && 'offset' in t && typeof t.offset == 'function'
          ? t
          : new ft(t);
  }
  var gt = {
      arab: '[\u0660-\u0669]',
      arabext: '[\u06F0-\u06F9]',
      bali: '[\u1B50-\u1B59]',
      beng: '[\u09E6-\u09EF]',
      deva: '[\u0966-\u096F]',
      fullwide: '[\uFF10-\uFF19]',
      gujr: '[\u0AE6-\u0AEF]',
      hanidec: '[\u3007|\u4E00|\u4E8C|\u4E09|\u56DB|\u4E94|\u516D|\u4E03|\u516B|\u4E5D]',
      khmr: '[\u17E0-\u17E9]',
      knda: '[\u0CE6-\u0CEF]',
      laoo: '[\u0ED0-\u0ED9]',
      limb: '[\u1946-\u194F]',
      mlym: '[\u0D66-\u0D6F]',
      mong: '[\u1810-\u1819]',
      mymr: '[\u1040-\u1049]',
      orya: '[\u0B66-\u0B6F]',
      tamldec: '[\u0BE6-\u0BEF]',
      telu: '[\u0C66-\u0C6F]',
      thai: '[\u0E50-\u0E59]',
      tibt: '[\u0F20-\u0F29]',
      latn: '\\d',
    },
    vt = {
      arab: [1632, 1641],
      arabext: [1776, 1785],
      bali: [6992, 7001],
      beng: [2534, 2543],
      deva: [2406, 2415],
      fullwide: [65296, 65303],
      gujr: [2790, 2799],
      khmr: [6112, 6121],
      knda: [3302, 3311],
      laoo: [3792, 3801],
      limb: [6470, 6479],
      mlym: [3430, 3439],
      mong: [6160, 6169],
      mymr: [4160, 4169],
      orya: [2918, 2927],
      tamldec: [3046, 3055],
      telu: [3174, 3183],
      thai: [3664, 3673],
      tibt: [3872, 3881],
    },
    Mr = gt.hanidec.replace(/[\[|\]]/g, '').split('');
  function Dr(t) {
    let e = parseInt(t, 10);
    if (isNaN(e)) {
      e = '';
      for (let n = 0; n < t.length; n++) {
        let r = t.charCodeAt(n);
        if (t[n].search(gt.hanidec) !== -1) e += Mr.indexOf(t[n]);
        else
          for (let s in vt) {
            let [i, a] = vt[s];
            r >= i && r <= a && (e += r - i);
          }
      }
      return parseInt(e, 10);
    } else return e;
  }
  var dt = new Map();
  function vr() {
    dt.clear();
  }
  function $({ numberingSystem: t }, e = '') {
    let n = t || 'latn',
      r = dt.get(n);
    r === void 0 && ((r = new Map()), dt.set(n, r));
    let s = r.get(e);
    return (s === void 0 && ((s = new RegExp(`${gt[n]}${e}`)), r.set(e, s)), s);
  }
  var Et = () => Date.now(),
    Nt = 'system',
    It = null,
    bt = null,
    xt = null,
    Ft = 60,
    Vt,
    Ct = null,
    k = class {
      static get now() {
        return Et;
      }
      static set now(e) {
        Et = e;
      }
      static set defaultZone(e) {
        Nt = e;
      }
      static get defaultZone() {
        return q(Nt, xe.instance);
      }
      static get defaultLocale() {
        return It;
      }
      static set defaultLocale(e) {
        It = e;
      }
      static get defaultNumberingSystem() {
        return bt;
      }
      static set defaultNumberingSystem(e) {
        bt = e;
      }
      static get defaultOutputCalendar() {
        return xt;
      }
      static set defaultOutputCalendar(e) {
        xt = e;
      }
      static get defaultWeekSettings() {
        return Ct;
      }
      static set defaultWeekSettings(e) {
        Ct = ht(e);
      }
      static get twoDigitCutoffYear() {
        return Ft;
      }
      static set twoDigitCutoffYear(e) {
        Ft = e % 100;
      }
      static get throwOnInvalid() {
        return Vt;
      }
      static set throwOnInvalid(e) {
        Vt = e;
      }
      static resetCaches() {
        (p.resetCache(), _.resetCache(), y.resetCache(), vr());
      }
    },
    I = class {
      constructor(e, n) {
        ((this.reason = e), (this.explanation = n));
      }
      toMessage() {
        return this.explanation ? `${this.reason}: ${this.explanation}` : this.reason;
      }
    },
    On = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    Mn = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  function V(t, e) {
    return new I(
      'unit out of range',
      `you specified ${e} (of type ${typeof e}) as a ${t}, which is invalid`
    );
  }
  function wt(t, e, n) {
    let r = new Date(Date.UTC(t, e - 1, n));
    t < 100 && t >= 0 && r.setUTCFullYear(r.getUTCFullYear() - 1900);
    let s = r.getUTCDay();
    return s === 0 ? 7 : s;
  }
  function Dn(t, e, n) {
    return n + (Te(t) ? Mn : On)[e - 1];
  }
  function vn(t, e) {
    let n = Te(t) ? Mn : On,
      r = n.findIndex((i) => i < e),
      s = e - n[r];
    return { month: r + 1, day: s };
  }
  function Tt(t, e) {
    return ((t - e + 7) % 7) + 1;
  }
  function Fe(t, e = 4, n = 1) {
    let { year: r, month: s, day: i } = t,
      a = Dn(r, s, i),
      o = Tt(wt(r, s, i), n),
      u = Math.floor((a - o + 14 - e) / 7),
      l;
    return (
      u < 1 ? ((l = r - 1), (u = we(l, e, n))) : u > we(r, e, n) ? ((l = r + 1), (u = 1)) : (l = r),
      { weekYear: l, weekNumber: u, weekday: o, ...Ae(t) }
    );
  }
  function Lt(t, e = 4, n = 1) {
    let { weekYear: r, weekNumber: s, weekday: i } = t,
      a = Tt(wt(r, 1, e), n),
      o = te(r),
      u = s * 7 + i - a - 7 + e,
      l;
    u < 1 ? ((l = r - 1), (u += te(l))) : u > o ? ((l = r + 1), (u -= te(r))) : (l = r);
    let { month: f, day: h } = vn(l, u);
    return { year: l, month: f, day: h, ...Ae(t) };
  }
  function _e(t) {
    let { year: e, month: n, day: r } = t,
      s = Dn(e, n, r);
    return { year: e, ordinal: s, ...Ae(t) };
  }
  function Wt(t) {
    let { year: e, ordinal: n } = t,
      { month: r, day: s } = vn(e, n);
    return { year: e, month: r, day: s, ...Ae(t) };
  }
  function $t(t, e) {
    if (!m(t.localWeekday) || !m(t.localWeekNumber) || !m(t.localWeekYear)) {
      if (!m(t.weekday) || !m(t.weekNumber) || !m(t.weekYear))
        throw new Y('Cannot mix locale-based week fields with ISO-based week fields');
      return (
        m(t.localWeekday) || (t.weekday = t.localWeekday),
        m(t.localWeekNumber) || (t.weekNumber = t.localWeekNumber),
        m(t.localWeekYear) || (t.weekYear = t.localWeekYear),
        delete t.localWeekday,
        delete t.localWeekNumber,
        delete t.localWeekYear,
        { minDaysInFirstWeek: e.getMinDaysInFirstWeek(), startOfWeek: e.getStartOfWeek() }
      );
    } else return { minDaysInFirstWeek: 4, startOfWeek: 1 };
  }
  function Er(t, e = 4, n = 1) {
    let r = We(t.weekYear),
      s = C(t.weekNumber, 1, we(t.weekYear, e, n)),
      i = C(t.weekday, 1, 7);
    return r
      ? s
        ? i
          ? !1
          : V('weekday', t.weekday)
        : V('week', t.weekNumber)
      : V('weekYear', t.weekYear);
  }
  function Nr(t) {
    let e = We(t.year),
      n = C(t.ordinal, 1, te(t.year));
    return e ? (n ? !1 : V('ordinal', t.ordinal)) : V('year', t.year);
  }
  function En(t) {
    let e = We(t.year),
      n = C(t.month, 1, 12),
      r = C(t.day, 1, Ve(t.year, t.month));
    return e ? (n ? (r ? !1 : V('day', t.day)) : V('month', t.month)) : V('year', t.year);
  }
  function Nn(t) {
    let { hour: e, minute: n, second: r, millisecond: s } = t,
      i = C(e, 0, 23) || (e === 24 && n === 0 && r === 0 && s === 0),
      a = C(n, 0, 59),
      o = C(r, 0, 59),
      u = C(s, 0, 999);
    return i
      ? a
        ? o
          ? u
            ? !1
            : V('millisecond', s)
          : V('second', r)
        : V('minute', n)
      : V('hour', e);
  }
  function m(t) {
    return typeof t > 'u';
  }
  function P(t) {
    return typeof t == 'number';
  }
  function We(t) {
    return typeof t == 'number' && t % 1 === 0;
  }
  function Ir(t) {
    return typeof t == 'string';
  }
  function br(t) {
    return Object.prototype.toString.call(t) === '[object Date]';
  }
  function In() {
    try {
      return typeof Intl < 'u' && !!Intl.RelativeTimeFormat;
    } catch {
      return !1;
    }
  }
  function bn() {
    try {
      return (
        typeof Intl < 'u' &&
        !!Intl.Locale &&
        ('weekInfo' in Intl.Locale.prototype || 'getWeekInfo' in Intl.Locale.prototype)
      );
    } catch {
      return !1;
    }
  }
  function xr(t) {
    return Array.isArray(t) ? t : [t];
  }
  function Zt(t, e, n) {
    if (t.length !== 0)
      return t.reduce((r, s) => {
        let i = [e(s), s];
        return r && n(r[0], i[0]) === r[0] ? r : i;
      }, null)[1];
  }
  function Fr(t, e) {
    return e.reduce((n, r) => ((n[r] = t[r]), n), {});
  }
  function se(t, e) {
    return Object.prototype.hasOwnProperty.call(t, e);
  }
  function ht(t) {
    if (t == null) return null;
    if (typeof t != 'object') throw new M('Week settings must be an object');
    if (
      !C(t.firstDay, 1, 7) ||
      !C(t.minimalDays, 1, 7) ||
      !Array.isArray(t.weekend) ||
      t.weekend.some((e) => !C(e, 1, 7))
    )
      throw new M('Invalid week settings');
    return { firstDay: t.firstDay, minimalDays: t.minimalDays, weekend: Array.from(t.weekend) };
  }
  function C(t, e, n) {
    return We(t) && t >= e && t <= n;
  }
  function Vr(t, e) {
    return t - e * Math.floor(t / e);
  }
  function O(t, e = 2) {
    let n = t < 0,
      r;
    return (n ? (r = '-' + ('' + -t).padStart(e, '0')) : (r = ('' + t).padStart(e, '0')), r);
  }
  function U(t) {
    if (!(m(t) || t === null || t === '')) return parseInt(t, 10);
  }
  function G(t) {
    if (!(m(t) || t === null || t === '')) return parseFloat(t);
  }
  function pt(t) {
    if (!(m(t) || t === null || t === '')) {
      let e = parseFloat('0.' + t) * 1e3;
      return Math.floor(e);
    }
  }
  function kt(t, e, n = 'round') {
    let r = 10 ** e;
    switch (n) {
      case 'expand':
        return t > 0 ? Math.ceil(t * r) / r : Math.floor(t * r) / r;
      case 'trunc':
        return Math.trunc(t * r) / r;
      case 'round':
        return Math.round(t * r) / r;
      case 'floor':
        return Math.floor(t * r) / r;
      case 'ceil':
        return Math.ceil(t * r) / r;
      default:
        throw new RangeError(`Value rounding ${n} is out of range`);
    }
  }
  function Te(t) {
    return t % 4 === 0 && (t % 100 !== 0 || t % 400 === 0);
  }
  function te(t) {
    return Te(t) ? 366 : 365;
  }
  function Ve(t, e) {
    let n = Vr(e - 1, 12) + 1,
      r = t + (e - n) / 12;
    return n === 2 ? (Te(r) ? 29 : 28) : [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][n - 1];
  }
  function $e(t) {
    let e = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second, t.millisecond);
    return (
      t.year < 100 &&
        t.year >= 0 &&
        ((e = new Date(e)), e.setUTCFullYear(t.year, t.month - 1, t.day)),
      +e
    );
  }
  function At(t, e, n) {
    return -Tt(wt(t, 1, e), n) + e - 1;
  }
  function we(t, e = 4, n = 1) {
    let r = At(t, e, n),
      s = At(t + 1, e, n);
    return (te(t) - r + s) / 7;
  }
  function mt(t) {
    return t > 99 ? t : t > k.twoDigitCutoffYear ? 1900 + t : 2e3 + t;
  }
  function xn(t, e, n, r = null) {
    let s = new Date(t),
      i = {
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      };
    r && (i.timeZone = r);
    let a = { timeZoneName: e, ...i },
      o = new Intl.DateTimeFormat(n, a)
        .formatToParts(s)
        .find((u) => u.type.toLowerCase() === 'timezonename');
    return o ? o.value : null;
  }
  function Ze(t, e) {
    let n = parseInt(t, 10);
    Number.isNaN(n) && (n = 0);
    let r = parseInt(e, 10) || 0,
      s = n < 0 || Object.is(n, -0) ? -r : r;
    return n * 60 + s;
  }
  function Fn(t) {
    let e = Number(t);
    if (typeof t == 'boolean' || t === '' || !Number.isFinite(e))
      throw new M(`Invalid unit value ${t}`);
    return e;
  }
  function Ce(t, e) {
    let n = {};
    for (let r in t)
      if (se(t, r)) {
        let s = t[r];
        if (s == null) continue;
        n[e(r)] = Fn(s);
      }
    return n;
  }
  function ge(t, e) {
    let n = Math.trunc(Math.abs(t / 60)),
      r = Math.trunc(Math.abs(t % 60)),
      s = t >= 0 ? '+' : '-';
    switch (e) {
      case 'short':
        return `${s}${O(n, 2)}:${O(r, 2)}`;
      case 'narrow':
        return `${s}${n}${r > 0 ? `:${r}` : ''}`;
      case 'techie':
        return `${s}${O(n, 2)}${O(r, 2)}`;
      default:
        throw new RangeError(`Value format ${e} is out of range for property format`);
    }
  }
  function Ae(t) {
    return Fr(t, ['hour', 'minute', 'second', 'millisecond']);
  }
  var Cr = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    Vn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    Lr = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  function Cn(t) {
    switch (t) {
      case 'narrow':
        return [...Lr];
      case 'short':
        return [...Vn];
      case 'long':
        return [...Cr];
      case 'numeric':
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      case '2-digit':
        return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      default:
        return null;
    }
  }
  var Ln = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    Wn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    Wr = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  function $n(t) {
    switch (t) {
      case 'narrow':
        return [...Wr];
      case 'short':
        return [...Wn];
      case 'long':
        return [...Ln];
      case 'numeric':
        return ['1', '2', '3', '4', '5', '6', '7'];
      default:
        return null;
    }
  }
  var Zn = ['AM', 'PM'],
    $r = ['Before Christ', 'Anno Domini'],
    Zr = ['BC', 'AD'],
    Ar = ['B', 'A'];
  function An(t) {
    switch (t) {
      case 'narrow':
        return [...Ar];
      case 'short':
        return [...Zr];
      case 'long':
        return [...$r];
      default:
        return null;
    }
  }
  function Hr(t) {
    return Zn[t.hour < 12 ? 0 : 1];
  }
  function Rr(t, e) {
    return $n(e)[t.weekday - 1];
  }
  function zr(t, e) {
    return Cn(e)[t.month - 1];
  }
  function Ur(t, e) {
    return An(e)[t.year < 0 ? 0 : 1];
  }
  function qr(t, e, n = 'always', r = !1) {
    let s = {
        years: ['year', 'yr.'],
        quarters: ['quarter', 'qtr.'],
        months: ['month', 'mo.'],
        weeks: ['week', 'wk.'],
        days: ['day', 'day', 'days'],
        hours: ['hour', 'hr.'],
        minutes: ['minute', 'min.'],
        seconds: ['second', 'sec.'],
      },
      i = ['hours', 'minutes', 'seconds'].indexOf(t) === -1;
    if (n === 'auto' && i) {
      let h = t === 'days';
      switch (e) {
        case 1:
          return h ? 'tomorrow' : `next ${s[t][0]}`;
        case -1:
          return h ? 'yesterday' : `last ${s[t][0]}`;
        case 0:
          return h ? 'today' : `this ${s[t][0]}`;
      }
    }
    let a = Object.is(e, -0) || e < 0,
      o = Math.abs(e),
      u = o === 1,
      l = s[t],
      f = r ? (u ? l[1] : l[2] || l[1]) : u ? s[t][0] : t;
    return a ? `${o} ${f} ago` : `in ${o} ${f}`;
  }
  function Ht(t, e) {
    let n = '';
    for (let r of t) r.literal ? (n += r.val) : (n += e(r.val));
    return n;
  }
  var Yr = {
      D: be,
      DD: en,
      DDD: tn,
      DDDD: nn,
      t: rn,
      tt: sn,
      ttt: an,
      tttt: on,
      T: un,
      TT: ln,
      TTT: cn,
      TTTT: fn,
      f: dn,
      ff: mn,
      fff: gn,
      ffff: Tn,
      F: hn,
      FF: yn,
      FFF: wn,
      FFFF: pn,
    },
    N = class t {
      static create(e, n = {}) {
        return new t(e, n);
      }
      static parseFormat(e) {
        let n = null,
          r = '',
          s = !1,
          i = [];
        for (let a = 0; a < e.length; a++) {
          let o = e.charAt(a);
          o === "'"
            ? ((r.length > 0 || s) &&
                i.push({ literal: s || /^\s+$/.test(r), val: r === '' ? "'" : r }),
              (n = null),
              (r = ''),
              (s = !s))
            : s || o === n
              ? (r += o)
              : (r.length > 0 && i.push({ literal: /^\s+$/.test(r), val: r }), (r = o), (n = o));
        }
        return (r.length > 0 && i.push({ literal: s || /^\s+$/.test(r), val: r }), i);
      }
      static macroTokenToFormatOpts(e) {
        return Yr[e];
      }
      constructor(e, n) {
        ((this.opts = n), (this.loc = e), (this.systemLoc = null));
      }
      formatWithSystemDefault(e, n) {
        return (
          this.systemLoc === null && (this.systemLoc = this.loc.redefaultToSystem()),
          this.systemLoc.dtFormatter(e, { ...this.opts, ...n }).format()
        );
      }
      dtFormatter(e, n = {}) {
        return this.loc.dtFormatter(e, { ...this.opts, ...n });
      }
      formatDateTime(e, n) {
        return this.dtFormatter(e, n).format();
      }
      formatDateTimeParts(e, n) {
        return this.dtFormatter(e, n).formatToParts();
      }
      formatInterval(e, n) {
        return this.dtFormatter(e.start, n).dtf.formatRange(e.start.toJSDate(), e.end.toJSDate());
      }
      resolvedOptions(e, n) {
        return this.dtFormatter(e, n).resolvedOptions();
      }
      num(e, n = 0, r = void 0) {
        if (this.opts.forceSimple) return O(e, n);
        let s = { ...this.opts };
        return (
          n > 0 && (s.padTo = n),
          r && (s.signDisplay = r),
          this.loc.numberFormatter(s).format(e)
        );
      }
      formatDateTimeFromString(e, n) {
        let r = this.loc.listingMode() === 'en',
          s = this.loc.outputCalendar && this.loc.outputCalendar !== 'gregory',
          i = (d, w) => this.loc.extract(e, d, w),
          a = (d) =>
            e.isOffsetFixed && e.offset === 0 && d.allowZ
              ? 'Z'
              : e.isValid
                ? e.zone.formatOffset(e.ts, d.format)
                : '',
          o = () => (r ? Hr(e) : i({ hour: 'numeric', hourCycle: 'h12' }, 'dayperiod')),
          u = (d, w) =>
            r ? zr(e, d) : i(w ? { month: d } : { month: d, day: 'numeric' }, 'month'),
          l = (d, w) =>
            r
              ? Rr(e, d)
              : i(w ? { weekday: d } : { weekday: d, month: 'long', day: 'numeric' }, 'weekday'),
          f = (d) => {
            let w = t.macroTokenToFormatOpts(d);
            return w ? this.formatWithSystemDefault(e, w) : d;
          },
          h = (d) => (r ? Ur(e, d) : i({ era: d }, 'era')),
          g = (d) => {
            switch (d) {
              case 'S':
                return this.num(e.millisecond);
              case 'u':
              case 'SSS':
                return this.num(e.millisecond, 3);
              case 's':
                return this.num(e.second);
              case 'ss':
                return this.num(e.second, 2);
              case 'uu':
                return this.num(Math.floor(e.millisecond / 10), 2);
              case 'uuu':
                return this.num(Math.floor(e.millisecond / 100));
              case 'm':
                return this.num(e.minute);
              case 'mm':
                return this.num(e.minute, 2);
              case 'h':
                return this.num(e.hour % 12 === 0 ? 12 : e.hour % 12);
              case 'hh':
                return this.num(e.hour % 12 === 0 ? 12 : e.hour % 12, 2);
              case 'H':
                return this.num(e.hour);
              case 'HH':
                return this.num(e.hour, 2);
              case 'Z':
                return a({ format: 'narrow', allowZ: this.opts.allowZ });
              case 'ZZ':
                return a({ format: 'short', allowZ: this.opts.allowZ });
              case 'ZZZ':
                return a({ format: 'techie', allowZ: this.opts.allowZ });
              case 'ZZZZ':
                return e.zone.offsetName(e.ts, { format: 'short', locale: this.loc.locale });
              case 'ZZZZZ':
                return e.zone.offsetName(e.ts, { format: 'long', locale: this.loc.locale });
              case 'z':
                return e.zoneName;
              case 'a':
                return o();
              case 'd':
                return s ? i({ day: 'numeric' }, 'day') : this.num(e.day);
              case 'dd':
                return s ? i({ day: '2-digit' }, 'day') : this.num(e.day, 2);
              case 'c':
                return this.num(e.weekday);
              case 'ccc':
                return l('short', !0);
              case 'cccc':
                return l('long', !0);
              case 'ccccc':
                return l('narrow', !0);
              case 'E':
                return this.num(e.weekday);
              case 'EEE':
                return l('short', !1);
              case 'EEEE':
                return l('long', !1);
              case 'EEEEE':
                return l('narrow', !1);
              case 'L':
                return s ? i({ month: 'numeric', day: 'numeric' }, 'month') : this.num(e.month);
              case 'LL':
                return s ? i({ month: '2-digit', day: 'numeric' }, 'month') : this.num(e.month, 2);
              case 'LLL':
                return u('short', !0);
              case 'LLLL':
                return u('long', !0);
              case 'LLLLL':
                return u('narrow', !0);
              case 'M':
                return s ? i({ month: 'numeric' }, 'month') : this.num(e.month);
              case 'MM':
                return s ? i({ month: '2-digit' }, 'month') : this.num(e.month, 2);
              case 'MMM':
                return u('short', !1);
              case 'MMMM':
                return u('long', !1);
              case 'MMMMM':
                return u('narrow', !1);
              case 'y':
                return s ? i({ year: 'numeric' }, 'year') : this.num(e.year);
              case 'yy':
                return s
                  ? i({ year: '2-digit' }, 'year')
                  : this.num(e.year.toString().slice(-2), 2);
              case 'yyyy':
                return s ? i({ year: 'numeric' }, 'year') : this.num(e.year, 4);
              case 'yyyyyy':
                return s ? i({ year: 'numeric' }, 'year') : this.num(e.year, 6);
              case 'G':
                return h('short');
              case 'GG':
                return h('long');
              case 'GGGGG':
                return h('narrow');
              case 'kk':
                return this.num(e.weekYear.toString().slice(-2), 2);
              case 'kkkk':
                return this.num(e.weekYear, 4);
              case 'W':
                return this.num(e.weekNumber);
              case 'WW':
                return this.num(e.weekNumber, 2);
              case 'n':
                return this.num(e.localWeekNumber);
              case 'nn':
                return this.num(e.localWeekNumber, 2);
              case 'ii':
                return this.num(e.localWeekYear.toString().slice(-2), 2);
              case 'iiii':
                return this.num(e.localWeekYear, 4);
              case 'o':
                return this.num(e.ordinal);
              case 'ooo':
                return this.num(e.ordinal, 3);
              case 'q':
                return this.num(e.quarter);
              case 'qq':
                return this.num(e.quarter, 2);
              case 'X':
                return this.num(Math.floor(e.ts / 1e3));
              case 'x':
                return this.num(e.ts);
              default:
                return f(d);
            }
          };
        return Ht(t.parseFormat(n), g);
      }
      formatDurationFromString(e, n) {
        let r = this.opts.signMode === 'negativeLargestOnly' ? -1 : 1,
          s = (f) => {
            switch (f[0]) {
              case 'S':
                return 'milliseconds';
              case 's':
                return 'seconds';
              case 'm':
                return 'minutes';
              case 'h':
                return 'hours';
              case 'd':
                return 'days';
              case 'w':
                return 'weeks';
              case 'M':
                return 'months';
              case 'y':
                return 'years';
              default:
                return null;
            }
          },
          i = (f, h) => (g) => {
            let d = s(g);
            if (d) {
              let w = h.isNegativeDuration && d !== h.largestUnit ? r : 1,
                S;
              return (
                this.opts.signMode === 'negativeLargestOnly' && d !== h.largestUnit
                  ? (S = 'never')
                  : this.opts.signMode === 'all'
                    ? (S = 'always')
                    : (S = 'auto'),
                this.num(f.get(d) * w, g.length, S)
              );
            } else return g;
          },
          a = t.parseFormat(n),
          o = a.reduce((f, { literal: h, val: g }) => (h ? f : f.concat(g)), []),
          u = e.shiftTo(...o.map(s).filter((f) => f)),
          l = { isNegativeDuration: u < 0, largestUnit: Object.keys(u.values)[0] };
        return Ht(a, i(u, l));
      }
    },
    Hn = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
  function ie(...t) {
    let e = t.reduce((n, r) => n + r.source, '');
    return RegExp(`^${e}$`);
  }
  function ae(...t) {
    return (e) =>
      t
        .reduce(
          ([n, r, s], i) => {
            let [a, o, u] = i(e, s);
            return [{ ...n, ...a }, o || r, u];
          },
          [{}, null, 1]
        )
        .slice(0, 2);
  }
  function oe(t, ...e) {
    if (t == null) return [null, null];
    for (let [n, r] of e) {
      let s = n.exec(t);
      if (s) return r(s);
    }
    return [null, null];
  }
  function Rn(...t) {
    return (e, n) => {
      let r = {},
        s;
      for (s = 0; s < t.length; s++) r[t[s]] = U(e[n + s]);
      return [r, null, n + s];
    };
  }
  var zn = /(?:([Zz])|([+-]\d\d)(?::?(\d\d))?)/,
    Pr = `(?:${zn.source}?(?:\\[(${Hn.source})\\])?)?`,
    St = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/,
    Un = RegExp(`${St.source}${Pr}`),
    Ot = RegExp(`(?:[Tt]${Un.source})?`),
    _r = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/,
    Gr = /(\d{4})-?W(\d\d)(?:-?(\d))?/,
    Jr = /(\d{4})-?(\d{3})/,
    Br = Rn('weekYear', 'weekNumber', 'weekDay'),
    jr = Rn('year', 'ordinal'),
    Qr = /(\d{4})-(\d\d)-(\d\d)/,
    qn = RegExp(`${St.source} ?(?:${zn.source}|(${Hn.source}))?`),
    Kr = RegExp(`(?: ${qn.source})?`);
  function ne(t, e, n) {
    let r = t[e];
    return m(r) ? n : U(r);
  }
  function Xr(t, e) {
    return [{ year: ne(t, e), month: ne(t, e + 1, 1), day: ne(t, e + 2, 1) }, null, e + 3];
  }
  function ue(t, e) {
    return [
      {
        hours: ne(t, e, 0),
        minutes: ne(t, e + 1, 0),
        seconds: ne(t, e + 2, 0),
        milliseconds: pt(t[e + 3]),
      },
      null,
      e + 4,
    ];
  }
  function pe(t, e) {
    let n = !t[e] && !t[e + 1],
      r = Ze(t[e + 1], t[e + 2]),
      s = n ? null : L.instance(r);
    return [{}, s, e + 3];
  }
  function ke(t, e) {
    let n = t[e] ? _.create(t[e]) : null;
    return [{}, n, e + 1];
  }
  var es = RegExp(`^T?${St.source}$`),
    ts =
      /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
  function ns(t) {
    let [e, n, r, s, i, a, o, u, l] = t,
      f = e[0] === '-',
      h = u && u[0] === '-',
      g = (d, w = !1) => (d !== void 0 && (w || (d && f)) ? -d : d);
    return [
      {
        years: g(G(n)),
        months: g(G(r)),
        weeks: g(G(s)),
        days: g(G(i)),
        hours: g(G(a)),
        minutes: g(G(o)),
        seconds: g(G(u), u === '-0'),
        milliseconds: g(pt(l), h),
      },
    ];
  }
  var rs = {
    GMT: 0,
    EDT: -240,
    EST: -300,
    CDT: -300,
    CST: -360,
    MDT: -360,
    MST: -420,
    PDT: -420,
    PST: -480,
  };
  function Mt(t, e, n, r, s, i, a) {
    let o = {
      year: e.length === 2 ? mt(U(e)) : U(e),
      month: Vn.indexOf(n) + 1,
      day: U(r),
      hour: U(s),
      minute: U(i),
    };
    return (
      a && (o.second = U(a)),
      t && (o.weekday = t.length > 3 ? Ln.indexOf(t) + 1 : Wn.indexOf(t) + 1),
      o
    );
  }
  var ss =
    /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
  function is(t) {
    let [, e, n, r, s, i, a, o, u, l, f, h] = t,
      g = Mt(e, s, r, n, i, a, o),
      d;
    return (u ? (d = rs[u]) : l ? (d = 0) : (d = Ze(f, h)), [g, new L(d)]);
  }
  function as(t) {
    return t
      .replace(/\([^()]*\)|[\n\t]/g, ' ')
      .replace(/(\s\s+)/g, ' ')
      .trim();
  }
  var os =
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,
    us =
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,
    ls =
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
  function Rt(t) {
    let [, e, n, r, s, i, a, o] = t;
    return [Mt(e, s, r, n, i, a, o), L.utcInstance];
  }
  function cs(t) {
    let [, e, n, r, s, i, a, o] = t;
    return [Mt(e, o, n, r, s, i, a), L.utcInstance];
  }
  var fs = ie(_r, Ot),
    ds = ie(Gr, Ot),
    hs = ie(Jr, Ot),
    ms = ie(Un),
    Yn = ae(Xr, ue, pe, ke),
    ys = ae(Br, ue, pe, ke),
    gs = ae(jr, ue, pe, ke),
    ws = ae(ue, pe, ke);
  function Ts(t) {
    return oe(t, [fs, Yn], [ds, ys], [hs, gs], [ms, ws]);
  }
  function ps(t) {
    return oe(as(t), [ss, is]);
  }
  function ks(t) {
    return oe(t, [os, Rt], [us, Rt], [ls, cs]);
  }
  function Ss(t) {
    return oe(t, [ts, ns]);
  }
  var Os = ae(ue);
  function Ms(t) {
    return oe(t, [es, Os]);
  }
  var Ds = ie(Qr, Kr),
    vs = ie(qn),
    Es = ae(ue, pe, ke);
  function Ns(t) {
    return oe(t, [Ds, Yn], [vs, Es]);
  }
  var zt = 'Invalid Duration',
    Pn = {
      weeks: {
        days: 7,
        hours: 168,
        minutes: 10080,
        seconds: 10080 * 60,
        milliseconds: 10080 * 60 * 1e3,
      },
      days: { hours: 24, minutes: 1440, seconds: 1440 * 60, milliseconds: 1440 * 60 * 1e3 },
      hours: { minutes: 60, seconds: 3600, milliseconds: 3600 * 1e3 },
      minutes: { seconds: 60, milliseconds: 60 * 1e3 },
      seconds: { milliseconds: 1e3 },
    },
    Is = {
      years: {
        quarters: 4,
        months: 12,
        weeks: 52,
        days: 365,
        hours: 365 * 24,
        minutes: 365 * 24 * 60,
        seconds: 365 * 24 * 60 * 60,
        milliseconds: 365 * 24 * 60 * 60 * 1e3,
      },
      quarters: {
        months: 3,
        weeks: 13,
        days: 91,
        hours: 2184,
        minutes: 2184 * 60,
        seconds: 2184 * 60 * 60,
        milliseconds: 2184 * 60 * 60 * 1e3,
      },
      months: {
        weeks: 4,
        days: 30,
        hours: 720,
        minutes: 720 * 60,
        seconds: 720 * 60 * 60,
        milliseconds: 720 * 60 * 60 * 1e3,
      },
      ...Pn,
    },
    F = 146097 / 400,
    Q = 146097 / 4800,
    bs = {
      years: {
        quarters: 4,
        months: 12,
        weeks: F / 7,
        days: F,
        hours: F * 24,
        minutes: F * 24 * 60,
        seconds: F * 24 * 60 * 60,
        milliseconds: F * 24 * 60 * 60 * 1e3,
      },
      quarters: {
        months: 3,
        weeks: F / 28,
        days: F / 4,
        hours: (F * 24) / 4,
        minutes: (F * 24 * 60) / 4,
        seconds: (F * 24 * 60 * 60) / 4,
        milliseconds: (F * 24 * 60 * 60 * 1e3) / 4,
      },
      months: {
        weeks: Q / 7,
        days: Q,
        hours: Q * 24,
        minutes: Q * 24 * 60,
        seconds: Q * 24 * 60 * 60,
        milliseconds: Q * 24 * 60 * 60 * 1e3,
      },
      ...Pn,
    },
    B = [
      'years',
      'quarters',
      'months',
      'weeks',
      'days',
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ],
    xs = B.slice(0).reverse();
  function R(t, e, n = !1) {
    let r = {
      values: n ? e.values : { ...t.values, ...(e.values || {}) },
      loc: t.loc.clone(e.loc),
      conversionAccuracy: e.conversionAccuracy || t.conversionAccuracy,
      matrix: e.matrix || t.matrix,
    };
    return new D(r);
  }
  function _n(t, e) {
    let n = e.milliseconds ?? 0;
    for (let r of xs.slice(1)) e[r] && (n += e[r] * t[r].milliseconds);
    return n;
  }
  function Ut(t, e) {
    let n = _n(t, e) < 0 ? -1 : 1;
    (B.reduceRight((r, s) => {
      if (m(e[s])) return r;
      if (r) {
        let i = e[r] * n,
          a = t[s][r],
          o = Math.floor(i / a);
        ((e[s] += o * n), (e[r] -= o * a * n));
      }
      return s;
    }, null),
      B.reduce((r, s) => {
        if (m(e[s])) return r;
        if (r) {
          let i = e[r] % 1;
          ((e[r] -= i), (e[s] += i * t[r][s]));
        }
        return s;
      }, null));
  }
  function qt(t) {
    let e = {};
    for (let [n, r] of Object.entries(t)) r !== 0 && (e[n] = r);
    return e;
  }
  var D = class t {
      constructor(e) {
        let n = e.conversionAccuracy === 'longterm' || !1,
          r = n ? bs : Is;
        (e.matrix && (r = e.matrix),
          (this.values = e.values),
          (this.loc = e.loc || p.create()),
          (this.conversionAccuracy = n ? 'longterm' : 'casual'),
          (this.invalid = e.invalid || null),
          (this.matrix = r),
          (this.isLuxonDuration = !0));
      }
      static fromMillis(e, n) {
        return t.fromObject({ milliseconds: e }, n);
      }
      static fromObject(e, n = {}) {
        if (e == null || typeof e != 'object')
          throw new M(
            `Duration.fromObject: argument expected to be an object, got ${e === null ? 'null' : typeof e}`
          );
        return new t({
          values: Ce(e, t.normalizeUnit),
          loc: p.fromObject(n),
          conversionAccuracy: n.conversionAccuracy,
          matrix: n.matrix,
        });
      }
      static fromDurationLike(e) {
        if (P(e)) return t.fromMillis(e);
        if (t.isDuration(e)) return e;
        if (typeof e == 'object') return t.fromObject(e);
        throw new M(`Unknown duration argument ${e} of type ${typeof e}`);
      }
      static fromISO(e, n) {
        let [r] = Ss(e);
        return r
          ? t.fromObject(r, n)
          : t.invalid('unparsable', `the input "${e}" can't be parsed as ISO 8601`);
      }
      static fromISOTime(e, n) {
        let [r] = Ms(e);
        return r
          ? t.fromObject(r, n)
          : t.invalid('unparsable', `the input "${e}" can't be parsed as ISO 8601`);
      }
      static invalid(e, n = null) {
        if (!e) throw new M('need to specify a reason the Duration is invalid');
        let r = e instanceof I ? e : new I(e, n);
        if (k.throwOnInvalid) throw new et(r);
        return new t({ invalid: r });
      }
      static normalizeUnit(e) {
        let n = {
          year: 'years',
          years: 'years',
          quarter: 'quarters',
          quarters: 'quarters',
          month: 'months',
          months: 'months',
          week: 'weeks',
          weeks: 'weeks',
          day: 'days',
          days: 'days',
          hour: 'hours',
          hours: 'hours',
          minute: 'minutes',
          minutes: 'minutes',
          second: 'seconds',
          seconds: 'seconds',
          millisecond: 'milliseconds',
          milliseconds: 'milliseconds',
        }[e && e.toLowerCase()];
        if (!n) throw new Ie(e);
        return n;
      }
      static isDuration(e) {
        return (e && e.isLuxonDuration) || !1;
      }
      get locale() {
        return this.isValid ? this.loc.locale : null;
      }
      get numberingSystem() {
        return this.isValid ? this.loc.numberingSystem : null;
      }
      toFormat(e, n = {}) {
        let r = { ...n, floor: n.round !== !1 && n.floor !== !1 };
        return this.isValid ? N.create(this.loc, r).formatDurationFromString(this, e) : zt;
      }
      toHuman(e = {}) {
        if (!this.isValid) return zt;
        let n = e.showZeros !== !1,
          r = B.map((s) => {
            let i = this.values[s];
            return m(i) || (i === 0 && !n)
              ? null
              : this.loc
                  .numberFormatter({
                    style: 'unit',
                    unitDisplay: 'long',
                    ...e,
                    unit: s.slice(0, -1),
                  })
                  .format(i);
          }).filter((s) => s);
        return this.loc
          .listFormatter({ type: 'conjunction', style: e.listStyle || 'narrow', ...e })
          .format(r);
      }
      toObject() {
        return this.isValid ? { ...this.values } : {};
      }
      toISO() {
        if (!this.isValid) return null;
        let e = 'P';
        return (
          this.years !== 0 && (e += this.years + 'Y'),
          (this.months !== 0 || this.quarters !== 0) &&
            (e += this.months + this.quarters * 3 + 'M'),
          this.weeks !== 0 && (e += this.weeks + 'W'),
          this.days !== 0 && (e += this.days + 'D'),
          (this.hours !== 0 ||
            this.minutes !== 0 ||
            this.seconds !== 0 ||
            this.milliseconds !== 0) &&
            (e += 'T'),
          this.hours !== 0 && (e += this.hours + 'H'),
          this.minutes !== 0 && (e += this.minutes + 'M'),
          (this.seconds !== 0 || this.milliseconds !== 0) &&
            (e += kt(this.seconds + this.milliseconds / 1e3, 3) + 'S'),
          e === 'P' && (e += 'T0S'),
          e
        );
      }
      toISOTime(e = {}) {
        if (!this.isValid) return null;
        let n = this.toMillis();
        return n < 0 || n >= 864e5
          ? null
          : ((e = {
              suppressMilliseconds: !1,
              suppressSeconds: !1,
              includePrefix: !1,
              format: 'extended',
              ...e,
              includeOffset: !1,
            }),
            y.fromMillis(n, { zone: 'UTC' }).toISOTime(e));
      }
      toJSON() {
        return this.toISO();
      }
      toString() {
        return this.toISO();
      }
      [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.isValid
          ? `Duration { values: ${JSON.stringify(this.values)} }`
          : `Duration { Invalid, reason: ${this.invalidReason} }`;
      }
      toMillis() {
        return this.isValid ? _n(this.matrix, this.values) : NaN;
      }
      valueOf() {
        return this.toMillis();
      }
      plus(e) {
        if (!this.isValid) return this;
        let n = t.fromDurationLike(e),
          r = {};
        for (let s of B) (se(n.values, s) || se(this.values, s)) && (r[s] = n.get(s) + this.get(s));
        return R(this, { values: r }, !0);
      }
      minus(e) {
        if (!this.isValid) return this;
        let n = t.fromDurationLike(e);
        return this.plus(n.negate());
      }
      mapUnits(e) {
        if (!this.isValid) return this;
        let n = {};
        for (let r of Object.keys(this.values)) n[r] = Fn(e(this.values[r], r));
        return R(this, { values: n }, !0);
      }
      get(e) {
        return this[t.normalizeUnit(e)];
      }
      set(e) {
        if (!this.isValid) return this;
        let n = { ...this.values, ...Ce(e, t.normalizeUnit) };
        return R(this, { values: n });
      }
      reconfigure({ locale: e, numberingSystem: n, conversionAccuracy: r, matrix: s } = {}) {
        let a = {
          loc: this.loc.clone({ locale: e, numberingSystem: n }),
          matrix: s,
          conversionAccuracy: r,
        };
        return R(this, a);
      }
      as(e) {
        return this.isValid ? this.shiftTo(e).get(e) : NaN;
      }
      normalize() {
        if (!this.isValid) return this;
        let e = this.toObject();
        return (Ut(this.matrix, e), R(this, { values: e }, !0));
      }
      rescale() {
        if (!this.isValid) return this;
        let e = qt(this.normalize().shiftToAll().toObject());
        return R(this, { values: e }, !0);
      }
      shiftTo(...e) {
        if (!this.isValid) return this;
        if (e.length === 0) return this;
        e = e.map((a) => t.normalizeUnit(a));
        let n = {},
          r = {},
          s = this.toObject(),
          i;
        for (let a of B)
          if (e.indexOf(a) >= 0) {
            i = a;
            let o = 0;
            for (let l in r) ((o += this.matrix[l][a] * r[l]), (r[l] = 0));
            P(s[a]) && (o += s[a]);
            let u = Math.trunc(o);
            ((n[a] = u), (r[a] = (o * 1e3 - u * 1e3) / 1e3));
          } else P(s[a]) && (r[a] = s[a]);
        for (let a in r) r[a] !== 0 && (n[i] += a === i ? r[a] : r[a] / this.matrix[i][a]);
        return (Ut(this.matrix, n), R(this, { values: n }, !0));
      }
      shiftToAll() {
        return this.isValid
          ? this.shiftTo(
              'years',
              'months',
              'weeks',
              'days',
              'hours',
              'minutes',
              'seconds',
              'milliseconds'
            )
          : this;
      }
      negate() {
        if (!this.isValid) return this;
        let e = {};
        for (let n of Object.keys(this.values)) e[n] = this.values[n] === 0 ? 0 : -this.values[n];
        return R(this, { values: e }, !0);
      }
      removeZeros() {
        if (!this.isValid) return this;
        let e = qt(this.values);
        return R(this, { values: e }, !0);
      }
      get years() {
        return this.isValid ? this.values.years || 0 : NaN;
      }
      get quarters() {
        return this.isValid ? this.values.quarters || 0 : NaN;
      }
      get months() {
        return this.isValid ? this.values.months || 0 : NaN;
      }
      get weeks() {
        return this.isValid ? this.values.weeks || 0 : NaN;
      }
      get days() {
        return this.isValid ? this.values.days || 0 : NaN;
      }
      get hours() {
        return this.isValid ? this.values.hours || 0 : NaN;
      }
      get minutes() {
        return this.isValid ? this.values.minutes || 0 : NaN;
      }
      get seconds() {
        return this.isValid ? this.values.seconds || 0 : NaN;
      }
      get milliseconds() {
        return this.isValid ? this.values.milliseconds || 0 : NaN;
      }
      get isValid() {
        return this.invalid === null;
      }
      get invalidReason() {
        return this.invalid ? this.invalid.reason : null;
      }
      get invalidExplanation() {
        return this.invalid ? this.invalid.explanation : null;
      }
      equals(e) {
        if (!this.isValid || !e.isValid || !this.loc.equals(e.loc)) return !1;
        function n(r, s) {
          return r === void 0 || r === 0 ? s === void 0 || s === 0 : r === s;
        }
        for (let r of B) if (!n(this.values[r], e.values[r])) return !1;
        return !0;
      }
    },
    K = 'Invalid Interval';
  function Fs(t, e) {
    return !t || !t.isValid
      ? re.invalid('missing or invalid start')
      : !e || !e.isValid
        ? re.invalid('missing or invalid end')
        : e < t
          ? re.invalid(
              'end before start',
              `The end of an interval must be after its start, but you had start=${t.toISO()} and end=${e.toISO()}`
            )
          : null;
  }
  var re = class t {
      constructor(e) {
        ((this.s = e.start),
          (this.e = e.end),
          (this.invalid = e.invalid || null),
          (this.isLuxonInterval = !0));
      }
      static invalid(e, n = null) {
        if (!e) throw new M('need to specify a reason the Interval is invalid');
        let r = e instanceof I ? e : new I(e, n);
        if (k.throwOnInvalid) throw new Xe(r);
        return new t({ invalid: r });
      }
      static fromDateTimes(e, n) {
        let r = de(e),
          s = de(n),
          i = Fs(r, s);
        return i ?? new t({ start: r, end: s });
      }
      static after(e, n) {
        let r = D.fromDurationLike(n),
          s = de(e);
        return t.fromDateTimes(s, s.plus(r));
      }
      static before(e, n) {
        let r = D.fromDurationLike(n),
          s = de(e);
        return t.fromDateTimes(s.minus(r), s);
      }
      static fromISO(e, n) {
        let [r, s] = (e || '').split('/', 2);
        if (r && s) {
          let i, a;
          try {
            ((i = y.fromISO(r, n)), (a = i.isValid));
          } catch {
            a = !1;
          }
          let o, u;
          try {
            ((o = y.fromISO(s, n)), (u = o.isValid));
          } catch {
            u = !1;
          }
          if (a && u) return t.fromDateTimes(i, o);
          if (a) {
            let l = D.fromISO(s, n);
            if (l.isValid) return t.after(i, l);
          } else if (u) {
            let l = D.fromISO(r, n);
            if (l.isValid) return t.before(o, l);
          }
        }
        return t.invalid('unparsable', `the input "${e}" can't be parsed as ISO 8601`);
      }
      static isInterval(e) {
        return (e && e.isLuxonInterval) || !1;
      }
      get start() {
        return this.isValid ? this.s : null;
      }
      get end() {
        return this.isValid ? this.e : null;
      }
      get lastDateTime() {
        return this.isValid && this.e ? this.e.minus(1) : null;
      }
      get isValid() {
        return this.invalidReason === null;
      }
      get invalidReason() {
        return this.invalid ? this.invalid.reason : null;
      }
      get invalidExplanation() {
        return this.invalid ? this.invalid.explanation : null;
      }
      length(e = 'milliseconds') {
        return this.isValid ? this.toDuration(e).get(e) : NaN;
      }
      count(e = 'milliseconds', n) {
        if (!this.isValid) return NaN;
        let r = this.start.startOf(e, n),
          s;
        return (
          n?.useLocaleWeeks ? (s = this.end.reconfigure({ locale: r.locale })) : (s = this.end),
          (s = s.startOf(e, n)),
          Math.floor(s.diff(r, e).get(e)) + (s.valueOf() !== this.end.valueOf())
        );
      }
      hasSame(e) {
        return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, e) : !1;
      }
      isEmpty() {
        return this.s.valueOf() === this.e.valueOf();
      }
      isAfter(e) {
        return this.isValid ? this.s > e : !1;
      }
      isBefore(e) {
        return this.isValid ? this.e <= e : !1;
      }
      contains(e) {
        return this.isValid ? this.s <= e && this.e > e : !1;
      }
      set({ start: e, end: n } = {}) {
        return this.isValid ? t.fromDateTimes(e || this.s, n || this.e) : this;
      }
      splitAt(...e) {
        if (!this.isValid) return [];
        let n = e
            .map(de)
            .filter((a) => this.contains(a))
            .sort((a, o) => a.toMillis() - o.toMillis()),
          r = [],
          { s } = this,
          i = 0;
        for (; s < this.e; ) {
          let a = n[i] || this.e,
            o = +a > +this.e ? this.e : a;
          (r.push(t.fromDateTimes(s, o)), (s = o), (i += 1));
        }
        return r;
      }
      splitBy(e) {
        let n = D.fromDurationLike(e);
        if (!this.isValid || !n.isValid || n.as('milliseconds') === 0) return [];
        let { s: r } = this,
          s = 1,
          i,
          a = [];
        for (; r < this.e; ) {
          let o = this.start.plus(n.mapUnits((u) => u * s));
          ((i = +o > +this.e ? this.e : o), a.push(t.fromDateTimes(r, i)), (r = i), (s += 1));
        }
        return a;
      }
      divideEqually(e) {
        return this.isValid ? this.splitBy(this.length() / e).slice(0, e) : [];
      }
      overlaps(e) {
        return this.e > e.s && this.s < e.e;
      }
      abutsStart(e) {
        return this.isValid ? +this.e == +e.s : !1;
      }
      abutsEnd(e) {
        return this.isValid ? +e.e == +this.s : !1;
      }
      engulfs(e) {
        return this.isValid ? this.s <= e.s && this.e >= e.e : !1;
      }
      equals(e) {
        return !this.isValid || !e.isValid ? !1 : this.s.equals(e.s) && this.e.equals(e.e);
      }
      intersection(e) {
        if (!this.isValid) return this;
        let n = this.s > e.s ? this.s : e.s,
          r = this.e < e.e ? this.e : e.e;
        return n >= r ? null : t.fromDateTimes(n, r);
      }
      union(e) {
        if (!this.isValid) return this;
        let n = this.s < e.s ? this.s : e.s,
          r = this.e > e.e ? this.e : e.e;
        return t.fromDateTimes(n, r);
      }
      static merge(e) {
        let [n, r] = e
          .sort((s, i) => s.s - i.s)
          .reduce(
            ([s, i], a) =>
              i
                ? i.overlaps(a) || i.abutsStart(a)
                  ? [s, i.union(a)]
                  : [s.concat([i]), a]
                : [s, a],
            [[], null]
          );
        return (r && n.push(r), n);
      }
      static xor(e) {
        let n = null,
          r = 0,
          s = [],
          i = e.map((u) => [
            { time: u.s, type: 's' },
            { time: u.e, type: 'e' },
          ]),
          a = Array.prototype.concat(...i),
          o = a.sort((u, l) => u.time - l.time);
        for (let u of o)
          ((r += u.type === 's' ? 1 : -1),
            r === 1
              ? (n = u.time)
              : (n && +n != +u.time && s.push(t.fromDateTimes(n, u.time)), (n = null)));
        return t.merge(s);
      }
      difference(...e) {
        return t
          .xor([this].concat(e))
          .map((n) => this.intersection(n))
          .filter((n) => n && !n.isEmpty());
      }
      toString() {
        return this.isValid ? `[${this.s.toISO()} \u2013 ${this.e.toISO()})` : K;
      }
      [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.isValid
          ? `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`
          : `Interval { Invalid, reason: ${this.invalidReason} }`;
      }
      toLocaleString(e = be, n = {}) {
        return this.isValid ? N.create(this.s.loc.clone(n), e).formatInterval(this) : K;
      }
      toISO(e) {
        return this.isValid ? `${this.s.toISO(e)}/${this.e.toISO(e)}` : K;
      }
      toISODate() {
        return this.isValid ? `${this.s.toISODate()}/${this.e.toISODate()}` : K;
      }
      toISOTime(e) {
        return this.isValid ? `${this.s.toISOTime(e)}/${this.e.toISOTime(e)}` : K;
      }
      toFormat(e, { separator: n = ' \u2013 ' } = {}) {
        return this.isValid ? `${this.s.toFormat(e)}${n}${this.e.toFormat(e)}` : K;
      }
      toDuration(e, n) {
        return this.isValid ? this.e.diff(this.s, e, n) : D.invalid(this.invalidReason);
      }
      mapEndpoints(e) {
        return t.fromDateTimes(e(this.s), e(this.e));
      }
    },
    ee = class {
      static hasDST(e = k.defaultZone) {
        let n = y.now().setZone(e).set({ month: 12 });
        return !e.isUniversal && n.offset !== n.set({ month: 6 }).offset;
      }
      static isValidIANAZone(e) {
        return _.isValidZone(e);
      }
      static normalizeZone(e) {
        return q(e, k.defaultZone);
      }
      static getStartOfWeek({ locale: e = null, locObj: n = null } = {}) {
        return (n || p.create(e)).getStartOfWeek();
      }
      static getMinimumDaysInFirstWeek({ locale: e = null, locObj: n = null } = {}) {
        return (n || p.create(e)).getMinDaysInFirstWeek();
      }
      static getWeekendWeekdays({ locale: e = null, locObj: n = null } = {}) {
        return (n || p.create(e)).getWeekendDays().slice();
      }
      static months(
        e = 'long',
        {
          locale: n = null,
          numberingSystem: r = null,
          locObj: s = null,
          outputCalendar: i = 'gregory',
        } = {}
      ) {
        return (s || p.create(n, r, i)).months(e);
      }
      static monthsFormat(
        e = 'long',
        {
          locale: n = null,
          numberingSystem: r = null,
          locObj: s = null,
          outputCalendar: i = 'gregory',
        } = {}
      ) {
        return (s || p.create(n, r, i)).months(e, !0);
      }
      static weekdays(
        e = 'long',
        { locale: n = null, numberingSystem: r = null, locObj: s = null } = {}
      ) {
        return (s || p.create(n, r, null)).weekdays(e);
      }
      static weekdaysFormat(
        e = 'long',
        { locale: n = null, numberingSystem: r = null, locObj: s = null } = {}
      ) {
        return (s || p.create(n, r, null)).weekdays(e, !0);
      }
      static meridiems({ locale: e = null } = {}) {
        return p.create(e).meridiems();
      }
      static eras(e = 'short', { locale: n = null } = {}) {
        return p.create(n, null, 'gregory').eras(e);
      }
      static features() {
        return { relative: In(), localeWeek: bn() };
      }
    };
  function Yt(t, e) {
    let n = (s) => s.toUTC(0, { keepLocalTime: !0 }).startOf('day').valueOf(),
      r = n(e) - n(t);
    return Math.floor(D.fromMillis(r).as('days'));
  }
  function Vs(t, e, n) {
    let r = [
        ['years', (u, l) => l.year - u.year],
        ['quarters', (u, l) => l.quarter - u.quarter + (l.year - u.year) * 4],
        ['months', (u, l) => l.month - u.month + (l.year - u.year) * 12],
        [
          'weeks',
          (u, l) => {
            let f = Yt(u, l);
            return (f - (f % 7)) / 7;
          },
        ],
        ['days', Yt],
      ],
      s = {},
      i = t,
      a,
      o;
    for (let [u, l] of r)
      n.indexOf(u) >= 0 &&
        ((a = u),
        (s[u] = l(t, e)),
        (o = i.plus(s)),
        o > e ? (s[u]--, (t = i.plus(s)), t > e && ((o = t), s[u]--, (t = i.plus(s)))) : (t = o));
    return [t, s, o, a];
  }
  function Cs(t, e, n, r) {
    let [s, i, a, o] = Vs(t, e, n),
      u = e - s,
      l = n.filter((h) => ['hours', 'minutes', 'seconds', 'milliseconds'].indexOf(h) >= 0);
    l.length === 0 &&
      (a < e && (a = s.plus({ [o]: 1 })), a !== s && (i[o] = (i[o] || 0) + u / (a - s)));
    let f = D.fromObject(i, r);
    return l.length > 0
      ? D.fromMillis(u, r)
          .shiftTo(...l)
          .plus(f)
      : f;
  }
  var Ls = 'missing Intl.DateTimeFormat.formatToParts support';
  function T(t, e = (n) => n) {
    return { regex: t, deser: ([n]) => e(Dr(n)) };
  }
  var Ws = '\xA0',
    Gn = `[ ${Ws}]`,
    Jn = new RegExp(Gn, 'g');
  function $s(t) {
    return t.replace(/\./g, '\\.?').replace(Jn, Gn);
  }
  function Pt(t) {
    return t.replace(/\./g, '').replace(Jn, ' ').toLowerCase();
  }
  function Z(t, e) {
    return t === null
      ? null
      : {
          regex: RegExp(t.map($s).join('|')),
          deser: ([n]) => t.findIndex((r) => Pt(n) === Pt(r)) + e,
        };
  }
  function _t(t, e) {
    return { regex: t, deser: ([, n, r]) => Ze(n, r), groups: e };
  }
  function Oe(t) {
    return { regex: t, deser: ([e]) => e };
  }
  function Zs(t) {
    return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }
  function As(t, e) {
    let n = $(e),
      r = $(e, '{2}'),
      s = $(e, '{3}'),
      i = $(e, '{4}'),
      a = $(e, '{6}'),
      o = $(e, '{1,2}'),
      u = $(e, '{1,3}'),
      l = $(e, '{1,6}'),
      f = $(e, '{1,9}'),
      h = $(e, '{2,4}'),
      g = $(e, '{4,6}'),
      d = (v) => ({ regex: RegExp(Zs(v.val)), deser: ([x]) => x, literal: !0 }),
      S = ((v) => {
        if (t.literal) return d(v);
        switch (v.val) {
          case 'G':
            return Z(e.eras('short'), 0);
          case 'GG':
            return Z(e.eras('long'), 0);
          case 'y':
            return T(l);
          case 'yy':
            return T(h, mt);
          case 'yyyy':
            return T(i);
          case 'yyyyy':
            return T(g);
          case 'yyyyyy':
            return T(a);
          case 'M':
            return T(o);
          case 'MM':
            return T(r);
          case 'MMM':
            return Z(e.months('short', !0), 1);
          case 'MMMM':
            return Z(e.months('long', !0), 1);
          case 'L':
            return T(o);
          case 'LL':
            return T(r);
          case 'LLL':
            return Z(e.months('short', !1), 1);
          case 'LLLL':
            return Z(e.months('long', !1), 1);
          case 'd':
            return T(o);
          case 'dd':
            return T(r);
          case 'o':
            return T(u);
          case 'ooo':
            return T(s);
          case 'HH':
            return T(r);
          case 'H':
            return T(o);
          case 'hh':
            return T(r);
          case 'h':
            return T(o);
          case 'mm':
            return T(r);
          case 'm':
            return T(o);
          case 'q':
            return T(o);
          case 'qq':
            return T(r);
          case 's':
            return T(o);
          case 'ss':
            return T(r);
          case 'S':
            return T(u);
          case 'SSS':
            return T(s);
          case 'u':
            return Oe(f);
          case 'uu':
            return Oe(o);
          case 'uuu':
            return T(n);
          case 'a':
            return Z(e.meridiems(), 0);
          case 'kkkk':
            return T(i);
          case 'kk':
            return T(h, mt);
          case 'W':
            return T(o);
          case 'WW':
            return T(r);
          case 'E':
          case 'c':
            return T(n);
          case 'EEE':
            return Z(e.weekdays('short', !1), 1);
          case 'EEEE':
            return Z(e.weekdays('long', !1), 1);
          case 'ccc':
            return Z(e.weekdays('short', !0), 1);
          case 'cccc':
            return Z(e.weekdays('long', !0), 1);
          case 'Z':
          case 'ZZ':
            return _t(new RegExp(`([+-]${o.source})(?::(${r.source}))?`), 2);
          case 'ZZZ':
            return _t(new RegExp(`([+-]${o.source})(${r.source})?`), 2);
          case 'z':
            return Oe(/[a-z_+-/]{1,256}?/i);
          case ' ':
            return Oe(/[^\S\n\r]/);
          default:
            return d(v);
        }
      })(t) || { invalidReason: Ls };
    return ((S.token = t), S);
  }
  var Hs = {
    year: { '2-digit': 'yy', numeric: 'yyyyy' },
    month: { numeric: 'M', '2-digit': 'MM', short: 'MMM', long: 'MMMM' },
    day: { numeric: 'd', '2-digit': 'dd' },
    weekday: { short: 'EEE', long: 'EEEE' },
    dayperiod: 'a',
    dayPeriod: 'a',
    hour12: { numeric: 'h', '2-digit': 'hh' },
    hour24: { numeric: 'H', '2-digit': 'HH' },
    minute: { numeric: 'm', '2-digit': 'mm' },
    second: { numeric: 's', '2-digit': 'ss' },
    timeZoneName: { long: 'ZZZZZ', short: 'ZZZ' },
  };
  function Rs(t, e, n) {
    let { type: r, value: s } = t;
    if (r === 'literal') {
      let u = /^\s+$/.test(s);
      return { literal: !u, val: u ? ' ' : s };
    }
    let i = e[r],
      a = r;
    r === 'hour' &&
      (e.hour12 != null
        ? (a = e.hour12 ? 'hour12' : 'hour24')
        : e.hourCycle != null
          ? e.hourCycle === 'h11' || e.hourCycle === 'h12'
            ? (a = 'hour12')
            : (a = 'hour24')
          : (a = n.hour12 ? 'hour12' : 'hour24'));
    let o = Hs[a];
    if ((typeof o == 'object' && (o = o[i]), o)) return { literal: !1, val: o };
  }
  function zs(t) {
    return [`^${t.map((n) => n.regex).reduce((n, r) => `${n}(${r.source})`, '')}$`, t];
  }
  function Us(t, e, n) {
    let r = t.match(e);
    if (r) {
      let s = {},
        i = 1;
      for (let a in n)
        if (se(n, a)) {
          let o = n[a],
            u = o.groups ? o.groups + 1 : 1;
          (!o.literal && o.token && (s[o.token.val[0]] = o.deser(r.slice(i, i + u))), (i += u));
        }
      return [r, s];
    } else return [r, {}];
  }
  function qs(t) {
    let e = (i) => {
        switch (i) {
          case 'S':
            return 'millisecond';
          case 's':
            return 'second';
          case 'm':
            return 'minute';
          case 'h':
          case 'H':
            return 'hour';
          case 'd':
            return 'day';
          case 'o':
            return 'ordinal';
          case 'L':
          case 'M':
            return 'month';
          case 'y':
            return 'year';
          case 'E':
          case 'c':
            return 'weekday';
          case 'W':
            return 'weekNumber';
          case 'k':
            return 'weekYear';
          case 'q':
            return 'quarter';
          default:
            return null;
        }
      },
      n = null,
      r;
    return (
      m(t.z) || (n = _.create(t.z)),
      m(t.Z) || (n || (n = new L(t.Z)), (r = t.Z)),
      m(t.q) || (t.M = (t.q - 1) * 3 + 1),
      m(t.h) || (t.h < 12 && t.a === 1 ? (t.h += 12) : t.h === 12 && t.a === 0 && (t.h = 0)),
      t.G === 0 && t.y && (t.y = -t.y),
      m(t.u) || (t.S = pt(t.u)),
      [
        Object.keys(t).reduce((i, a) => {
          let o = e(a);
          return (o && (i[o] = t[a]), i);
        }, {}),
        n,
        r,
      ]
    );
  }
  var Ge = null;
  function Ys() {
    return (Ge || (Ge = y.fromMillis(1555555555555)), Ge);
  }
  function Ps(t, e) {
    if (t.literal) return t;
    let n = N.macroTokenToFormatOpts(t.val),
      r = Qn(n, e);
    return r == null || r.includes(void 0) ? t : r;
  }
  function Bn(t, e) {
    return Array.prototype.concat(...t.map((n) => Ps(n, e)));
  }
  var Le = class {
    constructor(e, n) {
      if (
        ((this.locale = e),
        (this.format = n),
        (this.tokens = Bn(N.parseFormat(n), e)),
        (this.units = this.tokens.map((r) => As(r, e))),
        (this.disqualifyingUnit = this.units.find((r) => r.invalidReason)),
        !this.disqualifyingUnit)
      ) {
        let [r, s] = zs(this.units);
        ((this.regex = RegExp(r, 'i')), (this.handlers = s));
      }
    }
    explainFromTokens(e) {
      if (this.isValid) {
        let [n, r] = Us(e, this.regex, this.handlers),
          [s, i, a] = r ? qs(r) : [null, null, void 0];
        if (se(r, 'a') && se(r, 'H'))
          throw new Y("Can't include meridiem when specifying 24-hour format");
        return {
          input: e,
          tokens: this.tokens,
          regex: this.regex,
          rawMatches: n,
          matches: r,
          result: s,
          zone: i,
          specificOffset: a,
        };
      } else return { input: e, tokens: this.tokens, invalidReason: this.invalidReason };
    }
    get isValid() {
      return !this.disqualifyingUnit;
    }
    get invalidReason() {
      return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
    }
  };
  function jn(t, e, n) {
    return new Le(t, n).explainFromTokens(e);
  }
  function _s(t, e, n) {
    let { result: r, zone: s, specificOffset: i, invalidReason: a } = jn(t, e, n);
    return [r, s, i, a];
  }
  function Qn(t, e) {
    if (!t) return null;
    let r = N.create(e, t).dtFormatter(Ys()),
      s = r.formatToParts(),
      i = r.resolvedOptions();
    return s.map((a) => Rs(a, t, i));
  }
  var Je = 'Invalid DateTime',
    Gt = 864e13;
  function me(t) {
    return new I('unsupported zone', `the zone "${t.name}" is not supported`);
  }
  function Be(t) {
    return (t.weekData === null && (t.weekData = Fe(t.c)), t.weekData);
  }
  function je(t) {
    return (
      t.localWeekData === null &&
        (t.localWeekData = Fe(t.c, t.loc.getMinDaysInFirstWeek(), t.loc.getStartOfWeek())),
      t.localWeekData
    );
  }
  function J(t, e) {
    let n = { ts: t.ts, zone: t.zone, c: t.c, o: t.o, loc: t.loc, invalid: t.invalid };
    return new y({ ...n, ...e, old: n });
  }
  function Kn(t, e, n) {
    let r = t - e * 60 * 1e3,
      s = n.offset(r);
    if (e === s) return [r, e];
    r -= (s - e) * 60 * 1e3;
    let i = n.offset(r);
    return s === i ? [r, s] : [t - Math.min(s, i) * 60 * 1e3, Math.max(s, i)];
  }
  function Me(t, e) {
    t += e * 60 * 1e3;
    let n = new Date(t);
    return {
      year: n.getUTCFullYear(),
      month: n.getUTCMonth() + 1,
      day: n.getUTCDate(),
      hour: n.getUTCHours(),
      minute: n.getUTCMinutes(),
      second: n.getUTCSeconds(),
      millisecond: n.getUTCMilliseconds(),
    };
  }
  function ve(t, e, n) {
    return Kn($e(t), e, n);
  }
  function Jt(t, e) {
    let n = t.o,
      r = t.c.year + Math.trunc(e.years),
      s = t.c.month + Math.trunc(e.months) + Math.trunc(e.quarters) * 3,
      i = {
        ...t.c,
        year: r,
        month: s,
        day: Math.min(t.c.day, Ve(r, s)) + Math.trunc(e.days) + Math.trunc(e.weeks) * 7,
      },
      a = D.fromObject({
        years: e.years - Math.trunc(e.years),
        quarters: e.quarters - Math.trunc(e.quarters),
        months: e.months - Math.trunc(e.months),
        weeks: e.weeks - Math.trunc(e.weeks),
        days: e.days - Math.trunc(e.days),
        hours: e.hours,
        minutes: e.minutes,
        seconds: e.seconds,
        milliseconds: e.milliseconds,
      }).as('milliseconds'),
      o = $e(i),
      [u, l] = Kn(o, n, t.zone);
    return (a !== 0 && ((u += a), (l = t.zone.offset(u))), { ts: u, o: l });
  }
  function X(t, e, n, r, s, i) {
    let { setZone: a, zone: o } = n;
    if ((t && Object.keys(t).length !== 0) || e) {
      let u = e || o,
        l = y.fromObject(t, { ...n, zone: u, specificOffset: i });
      return a ? l : l.setZone(o);
    } else return y.invalid(new I('unparsable', `the input "${s}" can't be parsed as ${r}`));
  }
  function De(t, e, n = !0) {
    return t.isValid
      ? N.create(p.create('en-US'), { allowZ: n, forceSimple: !0 }).formatDateTimeFromString(t, e)
      : null;
  }
  function Qe(t, e, n) {
    let r = t.c.year > 9999 || t.c.year < 0,
      s = '';
    if ((r && t.c.year >= 0 && (s += '+'), (s += O(t.c.year, r ? 6 : 4)), n === 'year')) return s;
    if (e) {
      if (((s += '-'), (s += O(t.c.month)), n === 'month')) return s;
      s += '-';
    } else if (((s += O(t.c.month)), n === 'month')) return s;
    return ((s += O(t.c.day)), s);
  }
  function Bt(t, e, n, r, s, i, a) {
    let o = !n || t.c.millisecond !== 0 || t.c.second !== 0,
      u = '';
    switch (a) {
      case 'day':
      case 'month':
      case 'year':
        break;
      default:
        if (((u += O(t.c.hour)), a === 'hour')) break;
        if (e) {
          if (((u += ':'), (u += O(t.c.minute)), a === 'minute')) break;
          o && ((u += ':'), (u += O(t.c.second)));
        } else {
          if (((u += O(t.c.minute)), a === 'minute')) break;
          o && (u += O(t.c.second));
        }
        if (a === 'second') break;
        o && (!r || t.c.millisecond !== 0) && ((u += '.'), (u += O(t.c.millisecond, 3)));
    }
    return (
      s &&
        (t.isOffsetFixed && t.offset === 0 && !i
          ? (u += 'Z')
          : t.o < 0
            ? ((u += '-'),
              (u += O(Math.trunc(-t.o / 60))),
              (u += ':'),
              (u += O(Math.trunc(-t.o % 60))))
            : ((u += '+'),
              (u += O(Math.trunc(t.o / 60))),
              (u += ':'),
              (u += O(Math.trunc(t.o % 60))))),
      i && (u += '[' + t.zone.ianaName + ']'),
      u
    );
  }
  var Xn = { month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    Gs = { weekNumber: 1, weekday: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    Js = { ordinal: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    Ee = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'],
    Bs = ['weekYear', 'weekNumber', 'weekday', 'hour', 'minute', 'second', 'millisecond'],
    js = ['year', 'ordinal', 'hour', 'minute', 'second', 'millisecond'];
  function Ne(t) {
    let e = {
      year: 'year',
      years: 'year',
      month: 'month',
      months: 'month',
      day: 'day',
      days: 'day',
      hour: 'hour',
      hours: 'hour',
      minute: 'minute',
      minutes: 'minute',
      quarter: 'quarter',
      quarters: 'quarter',
      second: 'second',
      seconds: 'second',
      millisecond: 'millisecond',
      milliseconds: 'millisecond',
      weekday: 'weekday',
      weekdays: 'weekday',
      weeknumber: 'weekNumber',
      weeksnumber: 'weekNumber',
      weeknumbers: 'weekNumber',
      weekyear: 'weekYear',
      weekyears: 'weekYear',
      ordinal: 'ordinal',
    }[t.toLowerCase()];
    if (!e) throw new Ie(t);
    return e;
  }
  function jt(t) {
    switch (t.toLowerCase()) {
      case 'localweekday':
      case 'localweekdays':
        return 'localWeekday';
      case 'localweeknumber':
      case 'localweeknumbers':
        return 'localWeekNumber';
      case 'localweekyear':
      case 'localweekyears':
        return 'localWeekYear';
      default:
        return Ne(t);
    }
  }
  function Qs(t) {
    if ((ye === void 0 && (ye = k.now()), t.type !== 'iana')) return t.offset(ye);
    let e = t.name,
      n = yt.get(e);
    return (n === void 0 && ((n = t.offset(ye)), yt.set(e, n)), n);
  }
  function Qt(t, e) {
    let n = q(e.zone, k.defaultZone);
    if (!n.isValid) return y.invalid(me(n));
    let r = p.fromObject(e),
      s,
      i;
    if (m(t.year)) s = k.now();
    else {
      for (let u of Ee) m(t[u]) && (t[u] = Xn[u]);
      let a = En(t) || Nn(t);
      if (a) return y.invalid(a);
      let o = Qs(n);
      [s, i] = ve(t, o, n);
    }
    return new y({ ts: s, zone: n, loc: r, o: i });
  }
  function Kt(t, e, n) {
    let r = m(n.round) ? !0 : n.round,
      s = m(n.rounding) ? 'trunc' : n.rounding,
      i = (o, u) => (
        (o = kt(o, r || n.calendary ? 0 : 2, n.calendary ? 'round' : s)),
        e.loc.clone(n).relFormatter(n).format(o, u)
      ),
      a = (o) =>
        n.calendary
          ? e.hasSame(t, o)
            ? 0
            : e.startOf(o).diff(t.startOf(o), o).get(o)
          : e.diff(t, o).get(o);
    if (n.unit) return i(a(n.unit), n.unit);
    for (let o of n.units) {
      let u = a(o);
      if (Math.abs(u) >= 1) return i(u, o);
    }
    return i(t > e ? -0 : 0, n.units[n.units.length - 1]);
  }
  function Xt(t) {
    let e = {},
      n;
    return (
      t.length > 0 && typeof t[t.length - 1] == 'object'
        ? ((e = t[t.length - 1]), (n = Array.from(t).slice(0, t.length - 1)))
        : (n = Array.from(t)),
      [e, n]
    );
  }
  var ye,
    yt = new Map(),
    y = class t {
      constructor(e) {
        let n = e.zone || k.defaultZone,
          r =
            e.invalid ||
            (Number.isNaN(e.ts) ? new I('invalid input') : null) ||
            (n.isValid ? null : me(n));
        this.ts = m(e.ts) ? k.now() : e.ts;
        let s = null,
          i = null;
        if (!r)
          if (e.old && e.old.ts === this.ts && e.old.zone.equals(n)) [s, i] = [e.old.c, e.old.o];
          else {
            let o = P(e.o) && !e.old ? e.o : n.offset(this.ts);
            ((s = Me(this.ts, o)),
              (r = Number.isNaN(s.year) ? new I('invalid input') : null),
              (s = r ? null : s),
              (i = r ? null : o));
          }
        ((this._zone = n),
          (this.loc = e.loc || p.create()),
          (this.invalid = r),
          (this.weekData = null),
          (this.localWeekData = null),
          (this.c = s),
          (this.o = i),
          (this.isLuxonDateTime = !0));
      }
      static now() {
        return new t({});
      }
      static local() {
        let [e, n] = Xt(arguments),
          [r, s, i, a, o, u, l] = n;
        return Qt({ year: r, month: s, day: i, hour: a, minute: o, second: u, millisecond: l }, e);
      }
      static utc() {
        let [e, n] = Xt(arguments),
          [r, s, i, a, o, u, l] = n;
        return (
          (e.zone = L.utcInstance),
          Qt({ year: r, month: s, day: i, hour: a, minute: o, second: u, millisecond: l }, e)
        );
      }
      static fromJSDate(e, n = {}) {
        let r = br(e) ? e.valueOf() : NaN;
        if (Number.isNaN(r)) return t.invalid('invalid input');
        let s = q(n.zone, k.defaultZone);
        return s.isValid ? new t({ ts: r, zone: s, loc: p.fromObject(n) }) : t.invalid(me(s));
      }
      static fromMillis(e, n = {}) {
        if (P(e))
          return e < -Gt || e > Gt
            ? t.invalid('Timestamp out of range')
            : new t({ ts: e, zone: q(n.zone, k.defaultZone), loc: p.fromObject(n) });
        throw new M(
          `fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`
        );
      }
      static fromSeconds(e, n = {}) {
        if (P(e))
          return new t({ ts: e * 1e3, zone: q(n.zone, k.defaultZone), loc: p.fromObject(n) });
        throw new M('fromSeconds requires a numerical input');
      }
      static fromObject(e, n = {}) {
        e = e || {};
        let r = q(n.zone, k.defaultZone);
        if (!r.isValid) return t.invalid(me(r));
        let s = p.fromObject(n),
          i = Ce(e, jt),
          { minDaysInFirstWeek: a, startOfWeek: o } = $t(i, s),
          u = k.now(),
          l = m(n.specificOffset) ? r.offset(u) : n.specificOffset,
          f = !m(i.ordinal),
          h = !m(i.year),
          g = !m(i.month) || !m(i.day),
          d = h || g,
          w = i.weekYear || i.weekNumber;
        if ((d || f) && w)
          throw new Y("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
        if (g && f) throw new Y("Can't mix ordinal dates with month/day");
        let S = w || (i.weekday && !d),
          v,
          x,
          E = Me(u, l);
        S
          ? ((v = Bs), (x = Gs), (E = Fe(E, a, o)))
          : f
            ? ((v = js), (x = Js), (E = _e(E)))
            : ((v = Ee), (x = Xn));
        let W = !1;
        for (let fe of v) {
          let ar = i[fe];
          m(ar) ? (W ? (i[fe] = x[fe]) : (i[fe] = E[fe])) : (W = !0);
        }
        let ze = S ? Er(i, a, o) : f ? Nr(i) : En(i),
          le = ze || Nn(i);
        if (le) return t.invalid(le);
        let rr = S ? Lt(i, a, o) : f ? Wt(i) : i,
          [sr, ir] = ve(rr, l, r),
          ce = new t({ ts: sr, zone: r, o: ir, loc: s });
        return i.weekday && d && e.weekday !== ce.weekday
          ? t.invalid(
              'mismatched weekday',
              `you can't specify both a weekday of ${i.weekday} and a date of ${ce.toISO()}`
            )
          : ce.isValid
            ? ce
            : t.invalid(ce.invalid);
      }
      static fromISO(e, n = {}) {
        let [r, s] = Ts(e);
        return X(r, s, n, 'ISO 8601', e);
      }
      static fromRFC2822(e, n = {}) {
        let [r, s] = ps(e);
        return X(r, s, n, 'RFC 2822', e);
      }
      static fromHTTP(e, n = {}) {
        let [r, s] = ks(e);
        return X(r, s, n, 'HTTP', n);
      }
      static fromFormat(e, n, r = {}) {
        if (m(e) || m(n)) throw new M('fromFormat requires an input string and a format');
        let { locale: s = null, numberingSystem: i = null } = r,
          a = p.fromOpts({ locale: s, numberingSystem: i, defaultToEN: !0 }),
          [o, u, l, f] = _s(a, e, n);
        return f ? t.invalid(f) : X(o, u, r, `format ${n}`, e, l);
      }
      static fromString(e, n, r = {}) {
        return t.fromFormat(e, n, r);
      }
      static fromSQL(e, n = {}) {
        let [r, s] = Ns(e);
        return X(r, s, n, 'SQL', e);
      }
      static invalid(e, n = null) {
        if (!e) throw new M('need to specify a reason the DateTime is invalid');
        let r = e instanceof I ? e : new I(e, n);
        if (k.throwOnInvalid) throw new Ke(r);
        return new t({ invalid: r });
      }
      static isDateTime(e) {
        return (e && e.isLuxonDateTime) || !1;
      }
      static parseFormatForOpts(e, n = {}) {
        let r = Qn(e, p.fromObject(n));
        return r ? r.map((s) => (s ? s.val : null)).join('') : null;
      }
      static expandFormat(e, n = {}) {
        return Bn(N.parseFormat(e), p.fromObject(n))
          .map((s) => s.val)
          .join('');
      }
      static resetCache() {
        ((ye = void 0), yt.clear());
      }
      get(e) {
        return this[e];
      }
      get isValid() {
        return this.invalid === null;
      }
      get invalidReason() {
        return this.invalid ? this.invalid.reason : null;
      }
      get invalidExplanation() {
        return this.invalid ? this.invalid.explanation : null;
      }
      get locale() {
        return this.isValid ? this.loc.locale : null;
      }
      get numberingSystem() {
        return this.isValid ? this.loc.numberingSystem : null;
      }
      get outputCalendar() {
        return this.isValid ? this.loc.outputCalendar : null;
      }
      get zone() {
        return this._zone;
      }
      get zoneName() {
        return this.isValid ? this.zone.name : null;
      }
      get year() {
        return this.isValid ? this.c.year : NaN;
      }
      get quarter() {
        return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
      }
      get month() {
        return this.isValid ? this.c.month : NaN;
      }
      get day() {
        return this.isValid ? this.c.day : NaN;
      }
      get hour() {
        return this.isValid ? this.c.hour : NaN;
      }
      get minute() {
        return this.isValid ? this.c.minute : NaN;
      }
      get second() {
        return this.isValid ? this.c.second : NaN;
      }
      get millisecond() {
        return this.isValid ? this.c.millisecond : NaN;
      }
      get weekYear() {
        return this.isValid ? Be(this).weekYear : NaN;
      }
      get weekNumber() {
        return this.isValid ? Be(this).weekNumber : NaN;
      }
      get weekday() {
        return this.isValid ? Be(this).weekday : NaN;
      }
      get isWeekend() {
        return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
      }
      get localWeekday() {
        return this.isValid ? je(this).weekday : NaN;
      }
      get localWeekNumber() {
        return this.isValid ? je(this).weekNumber : NaN;
      }
      get localWeekYear() {
        return this.isValid ? je(this).weekYear : NaN;
      }
      get ordinal() {
        return this.isValid ? _e(this.c).ordinal : NaN;
      }
      get monthShort() {
        return this.isValid ? ee.months('short', { locObj: this.loc })[this.month - 1] : null;
      }
      get monthLong() {
        return this.isValid ? ee.months('long', { locObj: this.loc })[this.month - 1] : null;
      }
      get weekdayShort() {
        return this.isValid ? ee.weekdays('short', { locObj: this.loc })[this.weekday - 1] : null;
      }
      get weekdayLong() {
        return this.isValid ? ee.weekdays('long', { locObj: this.loc })[this.weekday - 1] : null;
      }
      get offset() {
        return this.isValid ? +this.o : NaN;
      }
      get offsetNameShort() {
        return this.isValid
          ? this.zone.offsetName(this.ts, { format: 'short', locale: this.locale })
          : null;
      }
      get offsetNameLong() {
        return this.isValid
          ? this.zone.offsetName(this.ts, { format: 'long', locale: this.locale })
          : null;
      }
      get isOffsetFixed() {
        return this.isValid ? this.zone.isUniversal : null;
      }
      get isInDST() {
        return this.isOffsetFixed
          ? !1
          : this.offset > this.set({ month: 1, day: 1 }).offset ||
              this.offset > this.set({ month: 5 }).offset;
      }
      getPossibleOffsets() {
        if (!this.isValid || this.isOffsetFixed) return [this];
        let e = 864e5,
          n = 6e4,
          r = $e(this.c),
          s = this.zone.offset(r - e),
          i = this.zone.offset(r + e),
          a = this.zone.offset(r - s * n),
          o = this.zone.offset(r - i * n);
        if (a === o) return [this];
        let u = r - a * n,
          l = r - o * n,
          f = Me(u, a),
          h = Me(l, o);
        return f.hour === h.hour &&
          f.minute === h.minute &&
          f.second === h.second &&
          f.millisecond === h.millisecond
          ? [J(this, { ts: u }), J(this, { ts: l })]
          : [this];
      }
      get isInLeapYear() {
        return Te(this.year);
      }
      get daysInMonth() {
        return Ve(this.year, this.month);
      }
      get daysInYear() {
        return this.isValid ? te(this.year) : NaN;
      }
      get weeksInWeekYear() {
        return this.isValid ? we(this.weekYear) : NaN;
      }
      get weeksInLocalWeekYear() {
        return this.isValid
          ? we(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek())
          : NaN;
      }
      resolvedLocaleOptions(e = {}) {
        let {
          locale: n,
          numberingSystem: r,
          calendar: s,
        } = N.create(this.loc.clone(e), e).resolvedOptions(this);
        return { locale: n, numberingSystem: r, outputCalendar: s };
      }
      toUTC(e = 0, n = {}) {
        return this.setZone(L.instance(e), n);
      }
      toLocal() {
        return this.setZone(k.defaultZone);
      }
      setZone(e, { keepLocalTime: n = !1, keepCalendarTime: r = !1 } = {}) {
        if (((e = q(e, k.defaultZone)), e.equals(this.zone))) return this;
        if (e.isValid) {
          let s = this.ts;
          if (n || r) {
            let i = e.offset(this.ts),
              a = this.toObject();
            [s] = ve(a, i, e);
          }
          return J(this, { ts: s, zone: e });
        } else return t.invalid(me(e));
      }
      reconfigure({ locale: e, numberingSystem: n, outputCalendar: r } = {}) {
        let s = this.loc.clone({ locale: e, numberingSystem: n, outputCalendar: r });
        return J(this, { loc: s });
      }
      setLocale(e) {
        return this.reconfigure({ locale: e });
      }
      set(e) {
        if (!this.isValid) return this;
        let n = Ce(e, jt),
          { minDaysInFirstWeek: r, startOfWeek: s } = $t(n, this.loc),
          i = !m(n.weekYear) || !m(n.weekNumber) || !m(n.weekday),
          a = !m(n.ordinal),
          o = !m(n.year),
          u = !m(n.month) || !m(n.day),
          l = o || u,
          f = n.weekYear || n.weekNumber;
        if ((l || a) && f)
          throw new Y("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
        if (u && a) throw new Y("Can't mix ordinal dates with month/day");
        let h;
        i
          ? (h = Lt({ ...Fe(this.c, r, s), ...n }, r, s))
          : m(n.ordinal)
            ? ((h = { ...this.toObject(), ...n }),
              m(n.day) && (h.day = Math.min(Ve(h.year, h.month), h.day)))
            : (h = Wt({ ..._e(this.c), ...n }));
        let [g, d] = ve(h, this.o, this.zone);
        return J(this, { ts: g, o: d });
      }
      plus(e) {
        if (!this.isValid) return this;
        let n = D.fromDurationLike(e);
        return J(this, Jt(this, n));
      }
      minus(e) {
        if (!this.isValid) return this;
        let n = D.fromDurationLike(e).negate();
        return J(this, Jt(this, n));
      }
      startOf(e, { useLocaleWeeks: n = !1 } = {}) {
        if (!this.isValid) return this;
        let r = {},
          s = D.normalizeUnit(e);
        switch (s) {
          case 'years':
            r.month = 1;
          case 'quarters':
          case 'months':
            r.day = 1;
          case 'weeks':
          case 'days':
            r.hour = 0;
          case 'hours':
            r.minute = 0;
          case 'minutes':
            r.second = 0;
          case 'seconds':
            r.millisecond = 0;
            break;
        }
        if (s === 'weeks')
          if (n) {
            let i = this.loc.getStartOfWeek(),
              { weekday: a } = this;
            (a < i && (r.weekNumber = this.weekNumber - 1), (r.weekday = i));
          } else r.weekday = 1;
        if (s === 'quarters') {
          let i = Math.ceil(this.month / 3);
          r.month = (i - 1) * 3 + 1;
        }
        return this.set(r);
      }
      endOf(e, n) {
        return this.isValid
          ? this.plus({ [e]: 1 })
              .startOf(e, n)
              .minus(1)
          : this;
      }
      toFormat(e, n = {}) {
        return this.isValid
          ? N.create(this.loc.redefaultToEN(n)).formatDateTimeFromString(this, e)
          : Je;
      }
      toLocaleString(e = be, n = {}) {
        return this.isValid ? N.create(this.loc.clone(n), e).formatDateTime(this) : Je;
      }
      toLocaleParts(e = {}) {
        return this.isValid ? N.create(this.loc.clone(e), e).formatDateTimeParts(this) : [];
      }
      toISO({
        format: e = 'extended',
        suppressSeconds: n = !1,
        suppressMilliseconds: r = !1,
        includeOffset: s = !0,
        extendedZone: i = !1,
        precision: a = 'milliseconds',
      } = {}) {
        if (!this.isValid) return null;
        a = Ne(a);
        let o = e === 'extended',
          u = Qe(this, o, a);
        return (Ee.indexOf(a) >= 3 && (u += 'T'), (u += Bt(this, o, n, r, s, i, a)), u);
      }
      toISODate({ format: e = 'extended', precision: n = 'day' } = {}) {
        return this.isValid ? Qe(this, e === 'extended', Ne(n)) : null;
      }
      toISOWeekDate() {
        return De(this, "kkkk-'W'WW-c");
      }
      toISOTime({
        suppressMilliseconds: e = !1,
        suppressSeconds: n = !1,
        includeOffset: r = !0,
        includePrefix: s = !1,
        extendedZone: i = !1,
        format: a = 'extended',
        precision: o = 'milliseconds',
      } = {}) {
        return this.isValid
          ? ((o = Ne(o)),
            (s && Ee.indexOf(o) >= 3 ? 'T' : '') + Bt(this, a === 'extended', n, e, r, i, o))
          : null;
      }
      toRFC2822() {
        return De(this, 'EEE, dd LLL yyyy HH:mm:ss ZZZ', !1);
      }
      toHTTP() {
        return De(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
      }
      toSQLDate() {
        return this.isValid ? Qe(this, !0) : null;
      }
      toSQLTime({ includeOffset: e = !0, includeZone: n = !1, includeOffsetSpace: r = !0 } = {}) {
        let s = 'HH:mm:ss.SSS';
        return ((n || e) && (r && (s += ' '), n ? (s += 'z') : e && (s += 'ZZ')), De(this, s, !0));
      }
      toSQL(e = {}) {
        return this.isValid ? `${this.toSQLDate()} ${this.toSQLTime(e)}` : null;
      }
      toString() {
        return this.isValid ? this.toISO() : Je;
      }
      [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.isValid
          ? `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`
          : `DateTime { Invalid, reason: ${this.invalidReason} }`;
      }
      valueOf() {
        return this.toMillis();
      }
      toMillis() {
        return this.isValid ? this.ts : NaN;
      }
      toSeconds() {
        return this.isValid ? this.ts / 1e3 : NaN;
      }
      toUnixInteger() {
        return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
      }
      toJSON() {
        return this.toISO();
      }
      toBSON() {
        return this.toJSDate();
      }
      toObject(e = {}) {
        if (!this.isValid) return {};
        let n = { ...this.c };
        return (
          e.includeConfig &&
            ((n.outputCalendar = this.outputCalendar),
            (n.numberingSystem = this.loc.numberingSystem),
            (n.locale = this.loc.locale)),
          n
        );
      }
      toJSDate() {
        return new Date(this.isValid ? this.ts : NaN);
      }
      diff(e, n = 'milliseconds', r = {}) {
        if (!this.isValid || !e.isValid) return D.invalid('created by diffing an invalid DateTime');
        let s = { locale: this.locale, numberingSystem: this.numberingSystem, ...r },
          i = xr(n).map(D.normalizeUnit),
          a = e.valueOf() > this.valueOf(),
          o = a ? this : e,
          u = a ? e : this,
          l = Cs(o, u, i, s);
        return a ? l.negate() : l;
      }
      diffNow(e = 'milliseconds', n = {}) {
        return this.diff(t.now(), e, n);
      }
      until(e) {
        return this.isValid ? re.fromDateTimes(this, e) : this;
      }
      hasSame(e, n, r) {
        if (!this.isValid) return !1;
        let s = e.valueOf(),
          i = this.setZone(e.zone, { keepLocalTime: !0 });
        return i.startOf(n, r) <= s && s <= i.endOf(n, r);
      }
      equals(e) {
        return (
          this.isValid &&
          e.isValid &&
          this.valueOf() === e.valueOf() &&
          this.zone.equals(e.zone) &&
          this.loc.equals(e.loc)
        );
      }
      toRelative(e = {}) {
        if (!this.isValid) return null;
        let n = e.base || t.fromObject({}, { zone: this.zone }),
          r = e.padding ? (this < n ? -e.padding : e.padding) : 0,
          s = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
          i = e.unit;
        return (
          Array.isArray(e.unit) && ((s = e.unit), (i = void 0)),
          Kt(n, this.plus(r), { ...e, numeric: 'always', units: s, unit: i })
        );
      }
      toRelativeCalendar(e = {}) {
        return this.isValid
          ? Kt(e.base || t.fromObject({}, { zone: this.zone }), this, {
              ...e,
              numeric: 'auto',
              units: ['years', 'months', 'days'],
              calendary: !0,
            })
          : null;
      }
      static min(...e) {
        if (!e.every(t.isDateTime)) throw new M('min requires all arguments be DateTimes');
        return Zt(e, (n) => n.valueOf(), Math.min);
      }
      static max(...e) {
        if (!e.every(t.isDateTime)) throw new M('max requires all arguments be DateTimes');
        return Zt(e, (n) => n.valueOf(), Math.max);
      }
      static fromFormatExplain(e, n, r = {}) {
        let { locale: s = null, numberingSystem: i = null } = r,
          a = p.fromOpts({ locale: s, numberingSystem: i, defaultToEN: !0 });
        return jn(a, e, n);
      }
      static fromStringExplain(e, n, r = {}) {
        return t.fromFormatExplain(e, n, r);
      }
      static buildFormatParser(e, n = {}) {
        let { locale: r = null, numberingSystem: s = null } = n,
          i = p.fromOpts({ locale: r, numberingSystem: s, defaultToEN: !0 });
        return new Le(i, e);
      }
      static fromFormatParser(e, n, r = {}) {
        if (m(e) || m(n))
          throw new M('fromFormatParser requires an input string and a format parser');
        let { locale: s = null, numberingSystem: i = null } = r,
          a = p.fromOpts({ locale: s, numberingSystem: i, defaultToEN: !0 });
        if (!a.equals(n.locale))
          throw new M(
            `fromFormatParser called with a locale of ${a}, but the format parser was created for ${n.locale}`
          );
        let { result: o, zone: u, specificOffset: l, invalidReason: f } = n.explainFromTokens(e);
        return f ? t.invalid(f) : X(o, u, r, `format ${n.format}`, e, l);
      }
      static get DATE_SHORT() {
        return be;
      }
      static get DATE_MED() {
        return en;
      }
      static get DATE_MED_WITH_WEEKDAY() {
        return or;
      }
      static get DATE_FULL() {
        return tn;
      }
      static get DATE_HUGE() {
        return nn;
      }
      static get TIME_SIMPLE() {
        return rn;
      }
      static get TIME_WITH_SECONDS() {
        return sn;
      }
      static get TIME_WITH_SHORT_OFFSET() {
        return an;
      }
      static get TIME_WITH_LONG_OFFSET() {
        return on;
      }
      static get TIME_24_SIMPLE() {
        return un;
      }
      static get TIME_24_WITH_SECONDS() {
        return ln;
      }
      static get TIME_24_WITH_SHORT_OFFSET() {
        return cn;
      }
      static get TIME_24_WITH_LONG_OFFSET() {
        return fn;
      }
      static get DATETIME_SHORT() {
        return dn;
      }
      static get DATETIME_SHORT_WITH_SECONDS() {
        return hn;
      }
      static get DATETIME_MED() {
        return mn;
      }
      static get DATETIME_MED_WITH_SECONDS() {
        return yn;
      }
      static get DATETIME_MED_WITH_WEEKDAY() {
        return ur;
      }
      static get DATETIME_FULL() {
        return gn;
      }
      static get DATETIME_FULL_WITH_SECONDS() {
        return wn;
      }
      static get DATETIME_HUGE() {
        return Tn;
      }
      static get DATETIME_HUGE_WITH_SECONDS() {
        return pn;
      }
    };
  function de(t) {
    if (y.isDateTime(t)) return t;
    if (t && t.valueOf && P(t.valueOf())) return y.fromJSDate(t);
    if (t && typeof t == 'object') return y.fromObject(t);
    throw new M(`Unknown datetime argument: ${t}, of type ${typeof t}`);
  }
  var Ks = !1,
    Xs = (...t) => {
      Ks && console.log(...t);
    };
  function ei(t, e) {
    let n = t.toFormat('yyyy-MM-dd');
    return e.some((r) => r.toFormat('yyyy-MM-dd') === n);
  }
  function er(t, e, n, r, s) {
    let i = [],
      a = t,
      o = 500,
      u = 0,
      l = (() => {
        switch (e.toLowerCase()) {
          case 'daily':
            return { days: 1 };
          case 'weekly':
            return { weeks: 1 };
          case 'biweekly':
            return { weeks: 2 };
          case 'monthly':
            return { months: 1 };
          default:
            return null;
        }
      })();
    if (!l) return i;
    let f = y.now();
    for (; a <= f && u < o; ) ((a = a.plus(l)), (u += 1));
    for (u = 0; i.length < r && u < o && !(s && a > s); ) {
      if (ei(a, n)) {
        ((a = a.plus(l)), (u += 1));
        continue;
      }
      (i.push(a), (a = a.plus(l)), (u += 1));
    }
    return i;
  }
  function He(t, e) {
    let n = t.trim(),
      r = null;
    return (
      (r = y.fromFormat(n, 'yyyy-MM-dd HH:mm', { zone: 'utc' })),
      r.isValid
        ? r.setZone(e, { keepLocalTime: !0 })
        : ((r = y.fromFormat(n, 'yyyy-MM-dd H:mm', { zone: 'utc' })),
          r.isValid
            ? r.setZone(e, { keepLocalTime: !0 })
            : ((r = y.fromFormat(n, 'yyyy-MM-dd HH:m', { zone: 'utc' })),
              r.isValid
                ? r.setZone(e, { keepLocalTime: !0 })
                : ((r = y.fromFormat(n, 'yyyy-MM-dd H:m', { zone: 'utc' })),
                  r.isValid
                    ? r.setZone(e, { keepLocalTime: !0 })
                    : ((r = y.fromFormat(n, 'yyyy-MM-dd', { zone: 'utc' })),
                      r.isValid
                        ? r.setZone(e, { keepLocalTime: !0 }).startOf('day')
                        : (r.isValid || (r = y.fromISO(t, { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'MMMM d, yyyy h:mm a', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'M/d/yyyy h:mm a', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'MM/dd/yyyy h:mm a', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'MM/dd/yyyy HH:mm a', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'yyyy-MM-dd h:mm a', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'MMMM d, yyyy', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'M/d/yyyy', { zone: e })),
                          r.isValid || (r = y.fromFormat(t, 'MM/dd/yyyy', { zone: e })),
                          r.isValid ? r : null)))))
    );
  }
  function tr(t, e) {
    let n = [];
    return (
      !t ||
        !t.trim() ||
        t
          .split(',')
          .map((s) => s.trim())
          .forEach((s, i) => {
            if (!s) {
              console.error(`[Blackout Dates] Empty date at position ${i + 1} in: "${t}"`);
              return;
            }
            let a = y.fromFormat(s, 'M/d/yyyy', { zone: e });
            if ((a.isValid || (a = y.fromFormat(s, 'MM/dd/yyyy', { zone: e })), !a.isValid)) {
              let o = He(s, e);
              o &&
                ((a = o),
                console.error(
                  `[Blackout Dates] Date "${s}" was parsed but uses non-standard format. Please use MM/DD/YYYY format (e.g., "10/21/2025" or "1/5/2025")`
                ));
            }
            a && a.isValid
              ? (n.push(a), Xs(`  \u2713 Parsed: "${s}" \u2192 ${a.toFormat('MMM d, yyyy')}`))
              : console.error(
                  `[Blackout Dates] Failed to parse date "${s}" at position ${i + 1}. Expected format: MM/DD/YYYY (e.g., "10/21/2025" or "1/5/2025"). Full string: "${t}"`
                );
          }),
      n
    );
  }
  function Re(t, e) {
    let n = t > 12 ? t - 12 : t === 0 ? 12 : t,
      r = t >= 12 ? 'PM' : 'AM';
    return e === 0 ? `${n}${r}` : `${n}:${e.toString().padStart(2, '0')}${r}`;
  }
  var ti = 3;
  function ni(t) {
    let e = 'America/New_York',
      n = [],
      r = [];
    for (let u = 1; u <= 2; u++) {
      let l = t.getAttribute(`data-start-${u}`),
        f = t.getAttribute(`data-frequency-${u}`),
        h = t.getAttribute(`data-duration-${u}`),
        g = t.getAttribute(`data-end-${u}`),
        d = t.getAttribute(`data-link-${u}`);
      if (!l || !l.trim()) continue;
      if (!f || !h) {
        console.error(`Missing frequency or duration for recurrence ${u}`, t);
        continue;
      }
      let w = He(l, e);
      if (!w) {
        console.error(`Invalid start date for recurrence ${u}:`, l);
        continue;
      }
      if (w.hour === 0 && w.minute === 0) {
        let x = t.getAttribute(`data-time-${u}`);
        if (x && x.trim()) {
          let E = x.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (E) {
            let W = parseInt(E[1], 10),
              ze = parseInt(E[2], 10),
              le = E[3]?.toUpperCase();
            (le === 'PM' && W !== 12 ? (W += 12) : le === 'AM' && W === 12 && (W = 0),
              (w = w.set({ hour: W, minute: ze })));
          }
        } else {
          let E = u === 1 ? 11 : 15;
          w = w.set({ hour: E, minute: 0 });
        }
      }
      let S = parseInt(h, 10),
        v;
      (g && g.trim() && (v = He(g, e) || void 0),
        n.push({ startDate: w, frequency: f, duration: S, until: v }),
        r.push(d || ''));
    }
    if (n.length === 0) return (console.error('No valid recurrence patterns found', t), null);
    let s = t.getAttribute('data-blackout-date-string') || '',
      i = tr(s, e),
      a = t.getAttribute('data-type')?.toLowerCase(),
      o = null;
    return (
      a === 'workshop' ? (o = 'workshop') : a === 'live-training' && (o = 'live-training'),
      { recurrences: n, blackoutDates: i, registrationLinks: r, timezone: e, sessionType: o }
    );
  }
  function ri(t, e, n, r, s) {
    let i = document.querySelector(`#datetimes-${t}`);
    if (!i) {
      console.error(`[updateRecurrenceUI] Container #datetimes-${t} not found`);
      return;
    }
    let a = er(e.startDate, e.frequency, n, ti, e.until);
    if (a.length === 0) {
      i.style.display = 'none';
      return;
    }
    if (((i.style.display = ''), s === 'workshop')) {
      let l =
        document.getElementById(`datetimes-tab-${t}-workshop-text`) ||
        document.querySelector(`#datetimes-tab-${t}-workshop-text`);
      if (l) {
        let f = e.startDate.setZone('local'),
          h = Re(f.hour, f.minute),
          g = f.toFormat('ZZZZ'),
          d = `${h} ${g}`;
        ((l.textContent = d), (l.innerText = d), (l.innerHTML = d));
      } else
        console.error(
          `[updateRecurrenceUI] Tab text element #datetimes-tab-${t}-workshop-text not found`
        );
    }
    let o = i.querySelector('ul.cc_pro-session_tab-list');
    if (!o) {
      console.error(`[updateRecurrenceUI] List element not found in container ${t}`);
      return;
    }
    ((o.innerHTML = ''),
      a.forEach((l) => {
        let f = l.setZone('local'),
          h = document.createElement('li');
        h.className = 'pro-session_list-item';
        let g = document.createElement('div');
        g.textContent = f.toFormat('MMM d');
        let d = document.createElement('div');
        d.className = 'dotted-line';
        let w;
        if (s === 'workshop') {
          w = document.createElement('div');
          let S = f.toFormat('EEEE');
          w.textContent = S;
        } else {
          let S = f.plus({ minutes: e.duration }),
            v = Re(f.hour, f.minute),
            x = Re(S.hour, S.minute),
            E = f.toFormat('ZZZZ'),
            W = `${v} - ${x} ${E}`;
          ((w = document.createElement('div')), (w.innerHTML = W));
        }
        (h.appendChild(g), h.appendChild(d), h.appendChild(w), o.appendChild(h));
      }));
    let u = i.querySelector('a.button');
    u && r
      ? (u.setAttribute('href', r), (u.style.display = 'inline-block'))
      : u && (u.style.display = 'none');
  }
  function nr() {
    let t = document.querySelector('#data-saver');
    if (!t) {
      console.error('[initTemplatePage] #data-saver element not found');
      return;
    }
    let e = ni(t);
    if (!e) {
      console.error('[initTemplatePage] Failed to parse session data');
      return;
    }
    e.recurrences.forEach((n, r) => {
      ri(r + 1, n, e.blackoutDates, e.registrationLinks[r], e.sessionType);
    });
  }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', () => {
        (nr(), Ue());
      })
    : (nr(), Ue());
})();
