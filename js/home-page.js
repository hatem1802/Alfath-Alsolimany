import {
  century,
  countOfMonthDays,
  daysFormat,
  getCentury,
  leapYears,
  months,
} from "./calender-setup.js";

import { calculateDate, globalEvents, storageLocation } from "./global.js";
import {
  convertTime,
  fetchPrayerTime,
  prayerTimings,
} from "./prayer-timings.js";
import SunCalc from "./suncalc.js";
let days = [
  "الاحد",
  "الاتنين",
  "الثلاثاء",
  "الاربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const PrayerTimeDefault = {
  month: 0, //current month
  year: 0, //current year
  latitude: "17.5065",
  longitude: "44.1316",
};
let LOCATION = storageLocation.fetchLocation() || PrayerTimeDefault;

function resetDate(theNewDate) {
  let sunCalc = SunCalc.getTimes(
    new Date(),
    LOCATION.latitude,
    LOCATION.longitude
  );
  if (
    parseInt(
      `${new Date().getHours().toString().padStart(2, 0)}${new Date()
        .getMinutes()
        .toString()
        .padStart(2, 0)}`
    ) >
    parseInt(
      `${sunCalc.sunset.getHours().toString().padStart(2, 0)}${sunCalc.sunset
        .getMinutes()
        .toString()
        .padStart(2, 0)}`
    )
  ) {
    let currentDate = new Date(theNewDate);
    let hijri = currentDate.toHijri();
    hijri.addDay();
    let tomorrow = hijri.toGregorian();
    return new Date(tomorrow);
  } else {
    return theNewDate;
  }
}

function resetDateHijri() {
  let sunCalc = SunCalc.getTimes(
    new Date(),
    LOCATION.latitude,
    LOCATION.longitude
  );
  if (
    parseInt(
      `${new Date().getHours().toString().padStart(2, 0)}${new Date()
        .getMinutes()
        .toString()
        .padStart(2, 0)}`
    ) >
    parseInt(
      `${sunCalc.sunset.getHours().toString().padStart(2, 0)}${sunCalc.sunset
        .getMinutes()
        .toString()
        .padStart(2, 0)}`
    )
  ) {
    let currentDate = new Date();
    let hijri = currentDate.toHijri();
    hijri.addDay();
    return `${hijri._date} ${months[hijri._month]} ${hijri._year}`;
  } else {
    let currentDate = new Date();
    let hijri = currentDate.toHijri();
    return `${hijri._date} ${months[hijri._month]} ${hijri._year}`;
  }
}

function displayLocation() {
  const location = storageLocation.fetchLocation();
  console.log('called', location);

  document.getElementById('locationsInfo').textContent = `${location.country} | ${location.city}`
}

window.addEventListener("DOMContentLoaded", () => {
  displayLocation()
  let date = new Date();
  let hijri = returnHijriConfiguration(date);
  let yearCalc = date.toHijri()._year;
  let theCurrentYearHijri = hijri.hijriYear;
  let sunCalc = SunCalc.getTimes(
    new Date(),
    LOCATION.latitude,
    LOCATION.longitude
  );
  let theTime = `${new Date().getHours().toString().padStart(2, 0)}${new Date()
    .getMinutes()
    .toString()
    .padStart(2, 0)}`;
  let HijriConfiguration = returnHijriConfiguration(new Date());

  document.getElementById(
    "date"
  ).innerHTML = `<div class="main-date"><span>${resetDateHijri()}</span>
  <span>${new Date().toLocaleDateString("ar-EG")}</span>
  </div>`;
  let yearNum =
    HijriConfiguration?.hijriYear % 210 === 0
      ? 210
      : HijriConfiguration?.hijriYear % 210;
  document.getElementById("yearLeap").innerHTML = leapYears.includes(yearNum)
    ? "نعم"
    : "لا";
  let yearCalcNum = yearCalc % 210 === 0 ? 210 : yearCalc % 210;
  document.getElementById("firstDayOfYear").innerHTML =
    daysFormat[century[yearCalcNum]].count + 1;
  if (
    theTime >
    parseInt(
      `${sunCalc.sunrise
        .getHours()
        .toString()
        .padStart(2, 0)}${sunCalc.sunrise
          .getMinutes()
          .toString()
          .padStart(2, 0)}`
    ) &&
    theTime <
    parseInt(
      `${sunCalc.sunset.getHours().toString().padStart(2, 0)}${sunCalc.sunset
        .getMinutes()
        .toString()
        .padStart(2, 0)}`
    )
  ) {
    document.getElementById("dayWeek").innerHTML = `يوم ${resetDate(
      new Date()
    ).toLocaleDateString("ar-SA", {
      weekday: "long",
    })}`;
  } else {
    document.getElementById("dayWeek").innerHTML = `ليلة ${resetDate(
      new Date()
    ).toLocaleDateString("ar-SA", {
      weekday: "long",
    })}`;
  }
  document.getElementById("smallCentury").innerHTML = getCentury(
    parseInt(yearCalc % 210)
  );
  document.getElementById("bigCentury").innerHTML = Math.ceil(yearCalc / 210);
  let smallCenturyYear = parseInt(yearCalc % 30)
  document.getElementById("yearSmallCentury").innerHTML = smallCenturyYear === 0 ? 30 : smallCenturyYear;

  prayerTimingDay();
  starterMonthOfYear(theCurrentYearHijri);
  document.getElementById("goPrevYear").addEventListener("click", () => {
    if (theCurrentYearHijri == 1) return;
    theCurrentYearHijri -= 1;
    starterMonthOfYear(theCurrentYearHijri);
  });
  document.getElementById("goNextYear").addEventListener("click", () => {
    theCurrentYearHijri += 1;
    starterMonthOfYear(theCurrentYearHijri);
  });
  // display the closest events
  let eventsContainer = document.querySelector("#closestEvent .table-grid");
  let MAX_STEPS = 0;
  for (let index = 0; index < globalEvents.length; index++) {
    if (
      !(Date.parse(new Date()) > Date.parse(globalEvents[index].date)) &&
      MAX_STEPS < 3
    ) {
      MAX_STEPS++;
      eventsContainer.innerHTML += `
      <div class="table-style-grid">
        <h4>${globalEvents[index].title}</h4>
        <span class="timer-style timer">${calculateDate(
        globalEvents[index].date
      )}</span>
      </div>`;
    }
  }
  const appLoader = document.getElementById("app-loader");
  if (appLoader) {
    appLoader.classList.add("hide");
  }
});

function starterMonthOfYear(yearCalc) {
  // Display first day in every month
  let yearNum = yearCalc % 210 === 0 ? 210 : yearCalc % 210;
  let date = new Date();
  let hijri = returnHijriConfiguration(date);
  let theCurrentYear = hijri.hijriYear;
  let firstDayOfYear = daysFormat[century[yearNum]];

  if (yearCalc === theCurrentYear) {
    document.getElementById("backToStarterYear").classList.add("hide");
  } else {
    document.getElementById("backToStarterYear").classList.remove("hide");
  }
  document.querySelector(".row-first-days").innerHTML = "";

  document.querySelector(
    "._modal-days ._modal-title span"
  ).innerHTML = `بداية شهور سنة (${yearCalc}) ${leapYears.includes(yearNum)
    ? "<small class='text-danger'>كبيسة</small>"
    : ""
  } `;

  for (let i = 1; i <= 12; i++) {
    let _hijri = new HijriDate(yearCalc, i, 1);
    let gregorian = _hijri.toGregorian();
    let GregorianDateIncrement = new Date(gregorian);
    let firstDayNumOfMonth =
      (countOfMonthDays(_hijri._month - 1, yearCalc) +
        parseInt(firstDayOfYear.count)) %
      7; // calculate the first weekDay of month

    document.querySelector(".row-first-days").innerHTML += `
      <div>
        <p>الاول من ${months[_hijri._month]}</p>
        <p>${days[firstDayNumOfMonth]}</p>
        <p>${GregorianDateIncrement.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
    })}</p>
      </div>
    `;
  }
}
function returnHijriConfiguration(date) {
  let gregorianDate = new Date(date);
  let hijri = gregorianDate.toHijri();
  return {
    hijriMonth: hijri._month,
    hijriDayNum: hijri._date,
    hijriYear: hijri._year,
  };
}

window.addEventListener("click", (e) => {
  if (e.target.matches(".backdrop-modal")) {
    e.target.classList.add("hide");
  }
  if (e.target.matches("._modal-nowdays")) {
    e.target.classList.add("hide");
  }
  if (e.target.matches("._modal-days ._modal-title .btn")) {
    let date = new Date();
    let yearCalc = date.toHijri()._year;
    starterMonthOfYear(yearCalc);
  }
  if (e.target.matches(".main-date") || e.target.matches("#dayWeek")) {
    let date = new Date();
    let yearCalc = date.toHijri()._year;
    starterMonthOfYear(yearCalc);
    document.querySelector("._modal-days").classList.remove("hide");
  }

  if (
    e.target.matches("._modal-fasting") ||
    e.target.matches("._modal")
  ) {
    e.target.classList.add("hide");
  }

  if (e.target.matches(".table-style .table-style-item#closestFasting a")) {
    document.querySelector("._modal-fasting").classList.remove("hide");
  }
  if (e.target.matches(".open-nowdays-modal")) {
    document.querySelector("._modal-nowdays").classList.remove("hide");
  }
});

async function prayerTimingDay() {
  // let prayerTime = await getPrayTimeByDate(date);
  const date = new Date();
  const location = storageLocation.fetchLocation();
  const prayerTime = prayerTimings();
  const timings = await fetchPrayerTime(date, location);

  if (!prayerTime) return;

  if (timings && timings.Fajr) {
    prayerTime.Fajr = convertTime(timings.Fajr);
  }

  let prayGrid = document.querySelector(".prayer-grid");
  prayGrid.innerHTML = `
  <div class="prayer-grid-item Sunrise">
      <span>الشروق</span>
      <span>${prayerTime.Sunrise}</span>
  </div>
  <div class="prayer-grid-item Duher">
      <span>وقت الزوال</span>
      <span>${prayerTime.Duher}</span>
  </div>

  <div class="prayer-grid-item Asr">
      <span>العصر</span>
      <span>${prayerTime.Asr}</span>
  </div>
 
  <div class="prayer-grid-item Maghrib">
      <span>الغروب</span>
      <span>${prayerTime.Maghrib}</span>
  </div>

  <div class="prayer-grid-item Isha">
      <span>العشاء</span>
      <span>${prayerTime.Isha}</span>
  </div>

  <div class="prayer-grid-item MidNight">
      <span>منتصف الليل</span>
      <span>${prayerTime.MidNight}</span>
  </div>

  <div class="prayer-grid-item Fajr">
      <span>الفجر</span>
      <span>${prayerTime.Fajr}</span>
  </div>
  `;
}
/**

 <div class="prayer-grid-item Asr">
      <span>العصر</span>
      <span>${prayerTime.Asr}</span>
  </div>

    <div class="prayer-grid-item Isha">
      <span>العشاء</span>
      <span>${prayerTime.Isha}</span>
  </div>
 */
