export const toLocalTime = (hour, minute = 0) => {
    const today = new Date()
    const referenceDate = new Date(
        `${today.toDateString()} ${hour}:${minute}:00 GMT-07:00`
    )
    const lhour = referenceDate.getHours()
    const lminute = referenceDate.getMinutes()
    return [lhour, lminute]
}
