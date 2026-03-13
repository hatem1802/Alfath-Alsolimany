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
<div class="table-style-grid d-flex flex-row justify-content-between align-items-center">

  <div class="d-flex flex-column text-end">
    <h4>${globalEvents[index].title}</h4>
    <span class="timer-style timer">
      ${calculateDate(globalEvents[index].date)}
    </span>
  </div>

    <i class="bi bi-arrow-left-circle"></i>

</div>
`;
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
// نحول كل الوقت إلى دقائق منذ بداية اليوم
  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }

  const nowMinutes = date.getHours() * 60 + date.getMinutes();

  const prayers = [
    { name: "Fajr", label: "الفجر" },
    { name: "Sunrise", label: "الشروق" },
    { name: "Duher", label: "وقت الزوال" },
    { name: "Asr", label: "العصر" },
    { name: "Maghrib", label: "الغروب" },
    { name: "Isha", label: "العشاء" },
    { name: "MidNight", label: "منتصف الليل" },
  ];

  // نحدد الصلاة الحالية
  let currentPrayer = "";
  for (let i = 0; i < prayers.length; i++) {
    const start = timeToMinutes(prayerTime[prayers[i].name]);
    const end =
      i + 1 < prayers.length
        ? timeToMinutes(prayerTime[prayers[i + 1].name])
        : 24 * 60;
    if (nowMinutes >= start && nowMinutes < end) {
      currentPrayer = prayers[i].name;
      break;
    }
  }

  const prayGrid = document.querySelector(".prayer-grid");
  prayGrid.innerHTML = prayers
    .map(
      (p) => `
    <div class="prayer-grid-item ${p.name} ${
        p.name === currentPrayer ? "current" : ""
      }">
      <span>${p.label}</span>
      <span>${prayerTime[p.name]}</span>
    </div>
  `
    )
    .join("");
}

window.addEventListener("DOMContentLoaded", () => {
function arabicNumberText(number) {
  const arabicNumbers = [
    "", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس",
    "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر",
    "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر",
    "الثامن عشر", "التاسع عشر", "العشرون", "الحادي والعشرون", "الثاني والعشرون",
    "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون",
    "السابع والعشرون", "الثامن والعشرون", "التاسع والعشرون", "الثلاثون"
  ];

  return arabicNumbers[number] || number;
}
  const hijriMonthsWithDescription = [
  { name: "محرم", description: "شهر الحرام" },
  { name: "صفر", description: "شهر السفر" },
  { name: "ربيع الأول", description: "شهر الفتوحات" },
  { name: "ربيع الآخر", description: "شهر البركات" },
  { name: "جمادى الأولى", description: "شهر الاستعداد" },
  { name: "جمادى الآخرة", description: "شهر الطاعة" },
  { name: "رجب", description: "شهر الله" },
  { name: "شعبان", description: "شهر الاستعداد لشهر رمضان" },
  { name: "رمضان", description: "شهر الرحمة" },
  { name: "شوال", description: "شهر الفرح" },
  { name: "ذو القعدة", description: "شهر الحاج" },
  { name: "ذو الحجة", description: "شهر الحج" },
];

let hijri = returnHijriConfiguration(new Date());
  const currentMonth = hijriMonthsWithDescription[hijri.hijriMonth -1];

document.getElementById("month-discription").textContent = currentMonth.description;
document.getElementById("month-number").textContent = hijri.hijriDayNum;
document.getElementById("month-text").textContent =
  `${arabicNumberText(hijri.hijriDayNum)} من ${months[hijri.hijriMonth]}`;
});