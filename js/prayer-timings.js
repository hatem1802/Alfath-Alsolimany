import { getAddress, latAndLong } from "./global.js";
import SunCalc from "./suncalc.js";

export async function fetchPrayerTime(date, location) {

  const dateForApi = new Date(date);
  const day = dateForApi.getDate().toString().padStart(2, "0");
  const month = (dateForApi.getMonth() + 1).toString().padStart(2, "0");
  const year = dateForApi.getFullYear();
  const address = await getAddress(location.latitude, location.longitude);
  const city = address.city || "Najran";
  const country = address.country || "Sauodi Arabia";
  const response = await fetch(
    // modify to use latitude & longitude 
    // `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${location.latitude}&longitude=${location.longitude}&method=7`
    `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${city}&country=${country}&method=7`
  )
    .then((res) => {
      if (!res.ok) {
        console.error("Failed to fetch prayer times from Aladhan API");
        return null;
      }
      return res.json();
    });
  return response?.data?.timings;
}

export async function fetchPrayerTimeForMonth(month, year, location) {
  const address = await getAddress(location.latitude, location.longitude);
  const city = address.city || "Najran";
  const country = address.country || "Sauodi Arabia";
  const response = await fetch(
    // `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=7`
    `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=${country}&method=7`
  )
    .then((res) => {
      if (!res.ok) {
        console.error("Failed to fetch prayer times for month from Aladhan API");
        return null;
      }
      return res.json();
    });
  return response?.data;
}

export function prayerTimings(selectedDate = new Date()) {
  let sunCalc = SunCalc.getTimes(
    new Date(selectedDate),
    latAndLong.latitude,
    latAndLong.longitude
  );

  let sunriseStr =
    sunCalc.sunrise.getHours() + ":" + sunCalc.sunrise.getMinutes();
  let sunsetStr = sunCalc.sunset.getHours() + ":" + sunCalc.sunset.getMinutes();

  let sunrise = sunriseStr.split(":");
  let sunset = sunsetStr.split(":");

  let dayLen = `${parseInt(sunsetStr.split(":")[0]) - parseInt(sunriseStr.split(":")[0])
    }:${parseInt(sunsetStr.split(":")[1]) - parseInt(sunriseStr.split(":")[1])
    }`.split(":");

  let dayLenLight = parseInt(dayLen[0]) * 60 + parseInt(dayLen[1]);
  let dayLenNight = 1440 - dayLenLight;
  let hourNight = dayLenNight / 12;

  let ashPlus = (hourNight / 60) * 4 * 15.5;

  let sunriseTime = resetTime(sunrise[0], sunrise[1]);

  let duherHours =
    parseInt(sunrise[0]) + parseInt(((dayLenLight / 12) * 6) / 60);
  let duherMinutes = parseInt(sunrise[1]) + (((dayLenLight / 12) * 6) % 60);
  let duherTime = resetTime(parseInt(duherHours), parseInt(duherMinutes));

  let aserHours =
    parseInt(sunrise[0]) + parseInt(((dayLenLight / 12) * 8) / 60);
  let aserMinutes = parseInt(sunrise[1]) + (((dayLenLight / 12) * 8) % 60);
  let aserTime = resetTime(parseInt(aserHours), parseInt(aserMinutes));

  let sunsetTime = resetTime(sunset[0], sunset[1]);
  let ishaCalc =
    parseInt(sunset[0]) * 60 + parseInt(sunset[1]) + Math.round(ashPlus);

  let ishaHours = parseInt(ishaCalc / 60);
  let ishaCalcMinutes = parseFloat(ishaCalc / 60)
    .toFixed(2)
    .split(".")[1];
  let ishaMinutes = Math.round(parseFloat(`.${ishaCalcMinutes}`) * 60);
  let ishaTime = resetTime(ishaHours, ishaMinutes);

  let midNightHours =
    parseInt(sunset[0]) + parseInt(((dayLenNight / 12) * 6) / 60);
  let midNightMinutes = parseInt(sunset[1]) + (((dayLenNight / 12) * 6) % 60);
  let midNightTime = resetTime(
    parseInt(midNightHours),
    parseInt(midNightMinutes)
  );
  return {
    Fajr: "00:00", // This will be replaced by the API call
    Sunrise: sunriseTime,
    Duher: duherTime,
    Asr: aserTime,
    Maghrib: sunsetTime,
    Isha: ishaTime,
    MidNight: midNightTime,
  };
}

function resetTime(hours, minutes) {
  if (minutes > 59) {
    hours += 1;
    minutes = minutes - 60;
  }
  if (minutes < 0) {
    hours -= 1;
    minutes = 60 - minutes;
  }
  hours = hours % 12;
  hours = hours == 0 ? 12 : hours;
  return `${hours.toString().padStart(2, 0)}:${minutes
    .toString()
    .padStart(2, 0)}`;
}

export function convertTime(timeString) {
  var timeArray = timeString.split(':');
  var hours = parseInt(timeArray[0]);
  var minutes = timeArray[1];

  if (hours > 12) {
    hours -= 12;
  }

  if (hours < 10) {
    hours = '0' + hours;
  }

  return hours + ':' + minutes;
}



// Asr - "15:28"
// Dhuhr - "12:15"
// Fajr - "05:15"
// Firstthird - "22:08"
// Imsak - "05:05"
// Isha - "19:23"
// Lastthird - "02:22"
// Maghrib - "17:53"
// Midnight - "00:15"
// Sunrise - "06:37"
// Sunset - "17:53"