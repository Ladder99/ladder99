// time fns

// constants
const secondsPerDay = 24 * 60 * 60
const secondsPerHour = 60 * 60
const millisecondsPerSecond = 1000
const secondsPerMillisecond = 0.001
const daysPerMillisecond = 1 / (secondsPerDay * 1000)
const hoursPerSecond = 1 / 3600

// get hours since 1970-01-01
export function getHours1970(date) {
  const date2 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours()
  )
  return date2.getTime() * secondsPerMillisecond * hoursPerSecond
}

// // get day of year, 1-366
// // from stackoverflow
// function getDayOfYear(date) {
//   const start = new Date(date.getFullYear(), 0, 0)
//   const diff =
//     date.getTime() -
//     start.getTime() +
//     (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
//   const day = Math.floor(diff * daysPerMillisecond)
//   return day
// }

// // get hour given year, dayOfYear, hour, and minute - in seconds since 1970
// // export function getHourInSeconds(dims) {
// //   const base = new Date(dims.year, 0, 1).getTime() * 0.001
// //   const seconds =
// //     base +
// //     (dims.dayOfYear - 1) * secondsPerDay +
// //     dims.hour * secondsPerHour +
// //     dims.minute * secondsPerMinute
// //   return seconds
// // }
// export function getHourInSeconds(dims) {
//   const base = new Date(dims.year, 0, 1).getTime() * 0.001
//   const seconds =
//     base + (dims.dayOfYear - 1) * secondsPerDay + dims.hour * secondsPerHour
//   return seconds
// }

// function getSeconds1970(date) {
//   return date.getTime() * secondsPerMillisecond // seconds
// }
