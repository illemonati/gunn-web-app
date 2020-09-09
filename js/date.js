import { localize } from './l10n.js'
import { now } from './utils.js'
// Date format names:
// weird = the weird {d, m, y} object format that this uses for some reason
// js = JavaScript Date object
export class DatePicker {
    // 0 indexed months, but 1 indexed dates and years
    constructor (start, end, elem) {
        this._days = localize('ds').split('  ')
        this._months = localize('mos').split('  ')
        const [days, months] = [this._days, this._months]
        this.start = start
        this.end = end
        this.min = DatePicker.weirdToJS(start).getTime()
        this.max = DatePicker.weirdToJS(end).getTime()
        this.selected = null
        this.dates = {}
        this.weeks = []
        elem
            ? (this.wrapper = elem)
            : (this.wrapper = document.createElement('div'))
        this.wrapper.classList.add('datepicker-wrapper')
        this.wrapper.classList.add('hide')
        let genesis = DatePicker.weirdToJS(start)
        let weeknum = 0
        const apocalypse = DatePicker.weirdToJS(end).getTime()
        const startday = genesis.getDay()
        let today = new Date(start.y, start.m, start.d - startday)
        let monthalt = false
        let lastmonth = today.getMonth()
        genesis = genesis.getTime()
        while (today.getTime() < apocalypse) {
            const week = []
            for (let i = 0; i < days.length; i++) {
                today = new Date(
                    start.y,
                    start.m,
                    start.d - startday + weeknum * 7 + i
                )
                const todayId = DatePicker.weirdToString(
                    DatePicker.jsToWeird(today)
                )
                const entry = { today }
                this.dates[todayId] = entry
                week.push(todayId)
                if (
                    today.getTime() >= genesis &&
                    today.getTime() <= apocalypse
                ) {
                    entry.month = today.getMonth()
                    entry.year = today.getFullYear()
                    if ((entry.date = today.getDate()) === 1)
                        monthalt = !monthalt
                    entry.monthalt = monthalt
                } else entry.notinrange = true
                if (i === 0 && lastmonth !== today.getMonth()) {
                    lastmonth = today.getMonth()
                    entry.newMonth = `${months[lastmonth]} '${today
                        .getFullYear()
                        .toString()
                        .slice(-2)}`
                }
            }
            this.weeks.push(week)
            weeknum++
        }
    }

    open () {
        if (!this.created) this._createElements()
        if (this.wrapper.classList.contains('hide')) {
            this.wrapper.classList.remove('hide')
            const close = e => {
                if (!this.wrapper.contains(e.target)) {
                    this.wrapper.classList.add('hide')
                    document.removeEventListener('click', close, false)
                }
            }
            setTimeout(() => {
                document.addEventListener('click', close, false)
            }, 0)
            let t
            if (
                this.selected &&
                (t = this.dates[DatePicker.weirdToString(this.selected)])
            ) {
                if (t.elem.scrollIntoViewIfNeeded) {
                    t.elem.scrollIntoViewIfNeeded()
                } else {
                    t.elem.scrollIntoView()
                }
            }
            if (this.isSchoolDay) {
                const temp = DatePicker.weirdToJS(this.start)
                while (
                    this.compare(DatePicker.jsToWeird(temp), this.end) <= 0
                ) {
                    const entry = this.dates[
                        DatePicker.weirdToString(DatePicker.jsToWeird(temp))
                    ]
                    if (entry) {
                        if (this.isSchoolDay(temp)) {
                            entry.elem.classList.remove('there-is-no-school')
                        } else {
                            entry.elem.classList.add('there-is-no-school')
                        }
                    }
                    temp.setDate(temp.getDate() + 1)
                }
            }
        }
    }

    _createElements () {
        if (this.created) return
        this.created = true
        const days = this._days

        // header
        this.header = document.createElement('div')
        this.header.classList.add('datepicker-dayheadings')
        for (const d of days) {
            const t = document.createElement('span')
            t.classList.add('datepicker-dayheading')
            t.innerHTML = d
            this.header.appendChild(t)
        }
        this.wrapper.appendChild(this.header)

        // days
        const dates = document.createElement('div')
        dates.classList.add('datepicker-days')
        for (const weekDates of this.weeks) {
            const week = document.createElement('div')
            week.classList.add('datepicker-week')
            for (const date of weekDates) {
                const entry = this.dates[date]
                const day = document.createElement('span')
                entry.elem = day
                day.classList.add('datepicker-day')
                day.dataset.dateId = date
                if (!entry.notinrange) {
                    day.textContent = entry.date
                    if (entry.monthalt) day.classList.add('datepicker-monthalt')
                }
                week.appendChild(day)
                if (entry.newMonth !== undefined) {
                    const t = document.createElement('span')
                    t.classList.add('datepicker-month')
                    t.innerHTML = entry.newMonth
                    week.appendChild(t)
                }
            }
            dates.appendChild(week)
        }
        dates.addEventListener(
            'click',
            e => {
                if (e.target.classList.contains('datepicker-day')) {
                    const entry = this.dates[e.target.dataset.dateId]
                    if (entry && !entry.notinrange) {
                        this.day = {
                            d: entry.date,
                            m: entry.month,
                            y: entry.year
                        }
                    }
                }
            },
            false
        )
        this.wrapper.appendChild(dates)

        // Mark today
        let t = this.dates[
            DatePicker.weirdToString(DatePicker.jsToWeird(now()))
        ]
        if (t) t.elem.classList.add('datepicker-today')

        if (
            this.selected &&
            (t = this.dates[DatePicker.weirdToString(this.selected)])
        ) {
            t.elem.classList.add('datepicker-selected')
        }
    }

    get day () {
        return this.selected
    }

    set day (day) {
        let t
        if (
            this.created &&
            this.selected &&
            (t = this.dates[DatePicker.weirdToString(this.selected)])
        ) {
            t.elem.classList.remove('datepicker-selected')
        }
        if (day) {
            day = DatePicker.purify(day)
            if (
                this.created &&
                this.inrange(day) &&
                (t = this.dates[DatePicker.weirdToString(day)])
            ) {
                t.elem.classList.add('datepicker-selected')
            }
        }
        this.selected = day
        if (this.onchange) this.onchange(day)
    }

    inrange (day) {
        const d = DatePicker.weirdToJS(day).getTime()
        return !(d < this.min || d > this.max)
    }

    compare (d1, d2) {
        return (
            DatePicker.weirdToJS(d1).getTime() -
            DatePicker.weirdToJS(d2).getTime()
        )
    }

    static weirdToJS ({ y, m, d }) {
        return new Date(y, m, d)
    }

    static jsToWeird (d) {
        return { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() }
    }

    static weirdToString ({ y, m, d }) {
        // using dots bc some teachers use dots and since there's no leading zeroes
        // it wouldn't look like iso 8601 if i used hyphens
        return `${y}.${m}.${d}`
    }

    static purify (day) {
        const d = new Date(day.y, day.m, day.d)
        return { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() }
    }
}
