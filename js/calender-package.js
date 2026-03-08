import * as Calender from "./calender-setup.js";
import { calculateDate, latAndLong, storageLocation } from "./global.js";
import SunCalc from "./suncalc.js";
// Let storage

let events = storageLocation.fetchEvents();

window.addEventListener("DOMContentLoaded", () => {
  Object.keys(Calender.months).forEach((month) => {
    document.getElementById("listOfMonth").innerHTML += `
      <button data-month="${month}" class="${month == 1 ? "active" : ""}" >${
      Calender.months[month]
    }</button>
    `;
  });

  displayCalenderYear();
  displayCalenderGrid();
  getSunriseTime();

  document
    .querySelector(".tab-control-first")
    .addEventListener("click", (e) => {
      // Sync date year
      let dateHijri = returnHijriConfiguration(
        Calender.theCurrentDate.gregorianDate
      );
      displayCalenderYear(dateHijri.hijriYear);

      let theNewDate = new Date();

      if (dateHijri.hijriYear !== theNewDate.getFullYear())
        document.getElementById("thisYear").classList.remove("hide");
      else document.getElementById("thisYear").classList.add("hide");
      // Sync date year

      document.getElementById("calenderTabs").classList.remove("__month");
      document.getElementById("calenderTabs").classList.add("__year");
      let lastButton = document.querySelector(".tab-control-last");
      if (lastButton.classList.contains("active")) {
        lastButton.classList.remove("active");
      }

      e.target.classList.add("active");
    });
  document.querySelector(".tab-control-last").addEventListener("click", (e) => {
    document.getElementById("calenderTabs").classList.remove("__year");
    document.getElementById("calenderTabs").classList.add("__month");
    let firstButton = document.querySelector(".tab-control-first");
    if (firstButton.classList.contains("active")) {
      firstButton.classList.remove("active");
    }
    e.target.classList.add("active");
    // Sync date year
    displayCalenderGrid(Calender.theCurrentDate.gregorianDate);
    // Sync date year
  });

  document.getElementById("btnChangeByYear").addEventListener("click", () => {
    enterYear();
  }); // change by years

  // Events Actions
  document
    .getElementById("eventTitle")
    .addEventListener("blur", (e) => checkInputTitle(e.target));
  document
    .getElementById("eventTitle")
    .addEventListener("keyup", (e) => checkInputTitle(e.target));
  document.getElementById("btnSubmitEvent").addEventListener("click", addEvent);
  // Add Event
  Array.from(document.querySelectorAll("#listOfMonth button")).forEach(
    (btn) => {
      btn.addEventListener("click", (e) => {
        Array.from(document.querySelectorAll("#listOfMonth button")).forEach(
          (_) => _.classList.remove("active")
        );
        changeMonth(e);
        btn.classList.add("active");
      });
    }
  );

  document.getElementById("today").addEventListener("click", __today); // Back to today
  // invoke go next and go prev
  document.getElementById("goNext").addEventListener("click", goNext);
  document.getElementById("goPrev").addEventListener("click", goPrev);
  document.getElementById("goPrevYear").addEventListener("click", goPrevYear);
  document.getElementById("goNextYear").addEventListener("click", goNextYear);
  document
    .getElementById("goPrevYearArrow")
    .addEventListener("click", goPrevYear);
  document
    .getElementById("goNextYearArrow")
    .addEventListener("click", goNextYear);
  document
    .querySelector("span .gg-printer")
    .addEventListener("click", () => window.print());
  document.getElementById("thisYear").addEventListener("click", __thisYear);
});

const hashEvents = {};
function displayCalenderGrid(
  date = new Date(),
  display = ".calender-list-grid-body"
) {
  let events = storageLocation.fetchEvents();
  for (const event of events) {
    hashEvents[`${event?.repeated?.month}-${event.repeated?.day}`] = true;
  }
  generateMonths(date);
  // check events by this day
  let dateGer = new Date(date);
  let dateHijri = dateGer.toHijri();

  const yearNumber = dateHijri._year % 210 === 0 ? 210 : dateHijri._year % 210;
  displayYearInfo(dateHijri._year);
  let firstDayOfYear = Calender.daysFormat[Calender.century[yearNumber]];
  let currentYearHijri = Calender.theCurrentDate.getCurrentYearHijri();
  let currentMonthHijri = Calender.theCurrentDate.getCurrentMonthHijri();
  let currentDayNumHijri = Calender.theCurrentDate.getCurrentDateHijri();
  let firstDayNumOfMonth =
    (Calender.countOfMonthDays(dateHijri._month - 1, yearNumber) +
      parseInt(firstDayOfYear.count)) %
    7; // calculate the first weekDay of month
  // Display information about date
  if (document.getElementById("theDate")) {
    let yearNum = dateHijri._year % 210 === 0 ? 210 : dateHijri._year % 210;
    document.getElementById("theDate").innerHTML = `${
      Calender.months[dateHijri._month]
    } ${dateHijri._year} ${
      Calender.leapYears.includes(yearNum)
        ? "<small class='text-danger'>كبيسة</small>"
        : ""
    }`;
  }

  let yearNum = dateHijri._year % 210 === 0 ? 210 : dateHijri._year % 210;

  document.getElementById(
    "selected-date-hijri"
  ).innerHTML = `${Calender.getSelectedHijriDate(dateGer)} هـ ${
    Calender.leapYears.includes(yearNum)
      ? "<small class='text-danger mx-2'>كبيسة</small>"
      : ""
  }`;
  if (!document.querySelector(".mini-container").classList.contains("__year")) {
    document.getElementById("selected-date-gregorian").textContent =
      new Date(date).toLocaleDateString("ar-EG") + " م";
  }

  let setMonth = new Set();
  // Loop of month days
  let dyesGrid = document.querySelector(display);
  dyesGrid.innerHTML = "";
  for (let i = 1; i <= firstDayNumOfMonth; i++) {
    dyesGrid.innerHTML += `<span class="empty"></span>`;
  }
  for (
    let i = 1;
    i <= Calender.countDayOfMonth(dateHijri._month, yearNumber);
    i++
  ) {
    let _hijri = new HijriDate(dateHijri._year, dateHijri._month, i);
    let hijri_day = `${_hijri._date} ${Calender.months[_hijri._month]} ${
      _hijri._year
    }`;

    let gregorian = _hijri.toGregorian();
    let GregorianDateIncrement = new Date(gregorian);
    let hasEvent =
      checkIfDateHasEvents(GregorianDateIncrement) ||
      hashEvents[`${_hijri._month}-${i}`];

    setMonth.add(
      GregorianDateIncrement.toLocaleDateString("ar-EG", { month: "long" })
    );
    if (
      Calender.theCurrentDate.getCurrentDateHijri() === i &&
      dateHijri._month == currentMonthHijri
    ) {
      if (hasEvent) displayEvents(GregorianDateIncrement);
      dyesGrid.innerHTML += `<span role="button" data-current_date="${GregorianDateIncrement}" data-has_event="${hasEvent}" class="active">${i} <em class="text-danger"> ${GregorianDateIncrement.getDate()} </em>  </span>`;
    } else {
      if (
        dateHijri._year >= currentYearHijri &&
        dateHijri._month == currentMonthHijri &&
        i > currentDayNumHijri
      ) {
        dyesGrid.innerHTML += `<span role="button" data-display_hijri="${hijri_day}"  data-current_date="${GregorianDateIncrement}" data-has_event="${hasEvent}" data-event="${GregorianDateIncrement}"> ${i} <em  class="text-danger"> ${GregorianDateIncrement.getDate()} </em> <i class="icon-add">+</i> </span>`;
      } else if (
        dateHijri._year >= currentYearHijri &&
        dateHijri._month > currentMonthHijri
      ) {
        dyesGrid.innerHTML += `<span role="button" data-display_hijri="${hijri_day}"  data-current_date="${GregorianDateIncrement}" data-has_event="${hasEvent}" data-event="${GregorianDateIncrement}"> ${i}  <em  class="text-danger"> ${GregorianDateIncrement.getDate()} </em> <i class="icon-add">+</i> </span>`;
      } else
        dyesGrid.innerHTML += `<span role="button" data-current_date="${GregorianDateIncrement}" data-has_event="${hasEvent}" >${i} <em  class="text-danger"> ${GregorianDateIncrement.getDate()} </em></span>`;
    }
  }
  for (
    let i = 1;
    i <=
    35 -
      (firstDayNumOfMonth +
        Calender.countDayOfMonth(dateHijri._month, yearNumber));
    i++
  ) {
    dyesGrid.innerHTML += `<span class="empty"></span>`;
  }
  document.getElementById("theDateGer").textContent = `${Array(
    ...setMonth
  ).join(" - ")} ${new Date(date).getFullYear()}`;
}
function displayYearInfo(year) {
  let yearNum = year % 210 === 0 ? 210 : year % 210;
  // Info year
  document.getElementById("yearLeap").innerHTML = Calender.leapYears.includes(
    yearNum
  )
    ? "نعم"
    : "لا";
  document.getElementById("firstDayOfYear").innerHTML =
    Calender.daysFormat[Calender.century[yearNum]].count + 1;
  document.getElementById("smallCentury").innerHTML = Calender.getCentury(
    parseInt(yearNum)
  );
  document.getElementById("bigCentury").innerHTML = Math.ceil(year / 210);

  document.getElementById("yearSmallCentury").innerHTML = parseInt(year % 30);
  let smallCenturyYear = parseInt(year % 30);
  document.getElementById("yearSmallCentury").innerHTML =
    smallCenturyYear === 0 ? 30 : smallCenturyYear;
}

function changeMonthActive(currentMonth) {
  currentMonth = currentMonth == 0 ? 12 : currentMonth;
  Array.from(document.querySelectorAll("#listOfMonth button")).forEach(
    (month, index) => {
      if (currentMonth == index + 1) month.classList.add("active");
      else month.classList.remove("active");
    }
  );
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".modal-events").addEventListener("click", (e) => {
    e.target.classList.remove("close");
  });
  __today();
  window.addEventListener("click", (e) => {
    if (e.target.matches("#closeEventsBox")) {
      document.getElementById("eventsGrid").innerHTML = "";
    }
    if (e.target.matches(".delete-event")) {
      deleteEvent(e.target.dataset.title);
      e.target.parentElement.parentElement.remove();
    }

    if (e.target.matches("span[data-event] .icon-add")) {
      document.getElementById("datePicker").value =
        e.target.parentElement.dataset.display_hijri;
      document.getElementById("datePicker").dataset.date =
        e.target.parentElement.dataset.current_date;

      document.querySelector(".modal-events").classList.remove("close");
    }

    if (e.target.matches(".modal-events")) {
      e.target.classList.add("close");
    }
  });
});

// Go Prev [ Month - year - day]
function goPrev() {
  let date = new Date(Calender.theCurrentDate.gregorianDate);
  let hijri = date.toHijri();
  if (hijri._year === 1 && hijri._month === 1) {
    alert("لا يمكنك العودة اكثر من هذا");
    return;
  }

  let theNewDate = date;
  hijri._month -= 1;

  theNewDate = date.setDate(
    date.getDate() -
      Calender.countDayOfMonth(
        hijri._month + 1,
        Calender.theCurrentDate.getCurrentYearHijri()
      )
  );

  changeMonthActive(hijri._month % 12);
  displayCalenderGrid(theNewDate);
  Calender.theCurrentDate.gregorianDate = new Date(theNewDate);

  if (
    Calender.theCurrentDate.currentHijriDate ==
    new Date(theNewDate).toLocaleDateString("ar-SA")
  ) {
    document.getElementById("today").classList.add("hide");
  } else {
    document.getElementById("today").classList.remove("hide");
  }
}

function goNext() {
  let date = new Date(Calender.theCurrentDate.gregorianDate);
  let hijri = date.toHijri();
  let theNewDate = date;
  hijri._month += 1;
  theNewDate = date.setDate(
    date.getDate() +
      Calender.countDayOfMonth(
        hijri._month,
        Calender.theCurrentDate.getCurrentYearHijri()
      )
  );

  changeMonthActive(hijri._month % 12);

  displayCalenderGrid(theNewDate);

  if (
    Calender.theCurrentDate.currentHijriDate ==
    new Date(theNewDate).toLocaleDateString("ar-SA")
  ) {
    document.getElementById("today").classList.add("hide");
  } else {
    document.getElementById("today").classList.remove("hide");
  }

  Calender.theCurrentDate.gregorianDate = new Date(theNewDate);
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

function enterYear() {
  let year = document.getElementById("changeByYear");
  if (year.value < 1) {
    alert("لا يمكنك ادخال قيمة سنة اصغر من 1");
    year.value = "";
    year.focus();
    return;
  }
  let hijri = new HijriDate(+year.value, 1, 1);
  let gregorian = hijri.toGregorian();
  displayCalenderGrid(gregorian);
  changeMonthActive(1);
  Calender.theCurrentDate.gregorianDate = gregorian;
  document.getElementById("today").classList.remove("hide");
}

function changeMonth(e) {
  let dateHijri = returnHijriConfiguration(
    Calender.theCurrentDate.gregorianDate
  );
  let hijri = new HijriDate(
    dateHijri.hijriYear,
    +e.target.dataset.month,
    dateHijri.hijriDayNum
  );

  let theGerDate = new Date(hijri.toGregorian());
  displayCalenderGrid(theGerDate);
  Calender.theCurrentDate.gregorianDate = new Date(theGerDate);

  if (
    Calender.theCurrentDate.currentHijriDate ==
    new Date(theGerDate).toLocaleDateString("ar-SA")
  ) {
    document.getElementById("today").classList.add("hide");
  } else {
    document.getElementById("today").classList.remove("hide");
  }
}
function __today() {
  let gregorian = new Date();
  let year = gregorian.toHijri()._year;
  document.getElementById("today").classList.add("hide");
  let todayDate = Calender.theCurrentDate.currentHijriDate.toGregorian();
  Calender.theCurrentDate.gregorianDate = todayDate;

  displayCalenderGrid(todayDate);
  changeMonthActive(Calender.theCurrentDate.getCurrentMonthHijri());

  document.getElementById("changeByYear").value = "";
}

function checkInputTitle(inputTitle) {
  if (inputTitle.value == "") {
    inputTitle.classList.add("error");
    document.getElementById("titleError").style.display = "block";
  } else {
    inputTitle.classList.remove("error");
    document.getElementById("titleError").style.display = "none";
  }
}

function addEvent() {
  let title = document.getElementById("eventTitle");
  checkInputTitle(title);
  let color = document.getElementById("eventColor").value;
  let theDateEvent = document.getElementById("datePicker"); // 0000-00-00
  let event = {
    title: title.value,
    date: theDateEvent.dataset.date,
    color,
    deletable: true,
  };
  // Check If Event date > the current date
  let events = storageLocation.fetchEvents();

  events.push(event);
  storageLocation.saveEvents(events);
  if (title.value !== "")
    document.querySelector(".modal-events").classList.add("close");
  theDateEvent.value = "";
  title.value = "";
}
function createEventItem(event) {
  let gregorian = new Date(event.date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let hijri = new Date(event.date).toHijri();
  let div = document.createElement("div");
  div.className = "events-item";
  div.style.background = event.color;
  div.innerHTML = `
  ${
    event.deletable
      ? `<span data-title="${event.title}" class="delete-event"><i class="gg-close"></i></span>`
      : ""
  }
  <h4>${event.title}</h4>
  <p class="d-flex align-items justify-content-between">
    <span>${new Date(event.date).toLocaleDateString("ar-SA", {
      weekday: "long",
    })} ${hijri._date} ${Calender.months[hijri._month]} ${hijri._year}</span>
    <span>${gregorian}</span>
    </p>
  ${calculateDate(event.date)}
  `;
  return div;
}

function displayEvents(theEventDate) {
  if (document.querySelector(".calender-page")) {
    let events = storageLocation.fetchEvents();

    let containerEvent = document.getElementById("eventsGrid");
    containerEvent.innerHTML = "";
    let listOfEvents = events.filter(
      (event) => Date.parse(event.date) == Date.parse(theEventDate)
    );
    if (listOfEvents.length > 0) {
      listOfEvents.forEach((event) => {
        containerEvent.append(createEventItem(event));
      });
    } else {
      containerEvent.innerHTML = `
      <p class="m-0 text-danger">لا يوجد مناسبات لهذا اليوم <span id="closeEventsBox"><i class="gg-close"></i></span></p>
      `;
    }
  }
}
function checkIfDateHasEvents(theEventDate) {
  let events = storageLocation.fetchEvents();

  let listOfEvents = events.filter(
    (event) => Date.parse(event.date) == Date.parse(theEventDate)
  );
  return listOfEvents.length > 0;
}

function deleteEvent(title) {
  let events = storageLocation.fetchEvents();
  let newEvents = events.filter((event) => event.title !== title);
  storageLocation.saveEvents(newEvents);
}

function displayCalenderGridYear(date = new Date(), display, title) {
  let dateHijri = date.toHijri();

  const yearNumber = dateHijri._year % 210;
  displayYearInfo(dateHijri._year);
  let firstDayOfYear = Calender.daysFormat[Calender.century[yearNumber]];
  let currentMonthHijri = Calender.theCurrentDate.getCurrentMonthHijri();
  let firstDayNumOfMonth =
    (Calender.countOfMonthDays(dateHijri._month - 1, yearNumber) +
      parseInt(firstDayOfYear.count)) %
    7; // calculate the first weekDay of month
  // Display information about date
  let dyesGrid = display;
  let h4El = document.createElement("h4");
  dyesGrid.innerHTML = `<span class="text-primary">اح</span>`;
  dyesGrid.innerHTML += `<span class="text-primary">اث</span>`;
  dyesGrid.innerHTML += `<span class="text-primary">ث</span>`;
  dyesGrid.innerHTML += `<span class="text-primary">ار</span>`;
  dyesGrid.innerHTML += `<span class="text-primary">خ</span>`;
  dyesGrid.innerHTML += `<span class="text-primary">ج</span>`;
  dyesGrid.innerHTML += `<span class="text-primary">س</span>`;

  let uniqueMonth = [];
  for (let i = 1; i <= firstDayNumOfMonth; i++) {
    dyesGrid.innerHTML += `<span class="empty"></span>`;
  }
  for (
    let i = 1;
    i <= Calender.countDayOfMonth(dateHijri._month, yearNumber);
    i++
  ) {
    let _hijri = new HijriDate(dateHijri._year, dateHijri._month, i);
    let gregorian = _hijri.toGregorian();
    let GregorianDateIncrement = new Date(gregorian);
    let hasEvent =
      checkIfDateHasEvents(GregorianDateIncrement) ||
      hashEvents[`${dateHijri._month}-${i}`];
    uniqueMonth.push(gregorian.toLocaleDateString("ar-EG", { month: "long" }));
    if (
      Calender.theCurrentDate.getCurrentDateHijri() === i &&
      dateHijri._month == currentMonthHijri
    ) {
      dyesGrid.innerHTML += `<span role="button" data-current_date="${GregorianDateIncrement}" data-has_event="${hasEvent}" class="active">${i} <em  class="text-danger"> ${GregorianDateIncrement.getDate()} </em>  </span>`;
    } else {
      dyesGrid.innerHTML += `<span role="button" data-current_date="${GregorianDateIncrement}" data-has_event="${hasEvent}" >${i} <em  class="text-danger"> ${GregorianDateIncrement.getDate()} </em></span>`;
    }
  }
  for (
    let i = 1;
    i <=
    35 -
      (firstDayNumOfMonth +
        Calender.countDayOfMonth(dateHijri._month, yearNumber));
    i++
  ) {
    dyesGrid.innerHTML += `<span class="empty"></span>`;
  }
  let newSet = new Set(uniqueMonth);
  h4El.innerHTML = `
    ${Calender.months[dateHijri._month]} <span class="text-danger">  
    ${[...newSet].join(" - ")}</span>
  `;
  dyesGrid.prepend(h4El);
}
let item = "";

function displayCalenderYear(year) {
  let date = new Date(Calender.theCurrentDate.gregorianDate);
  let hijriDate = date.toHijri();
  let hijriYear = hijriDate._year;

  let theYear = year ? year : hijriYear;

  let uniqueYear = {};
  for (let i = 0; i < 12; i++) {
    let _hijri = new HijriDate(theYear, i + 1, 1);
    let gregorian = _hijri.toGregorian();
    uniqueYear[new Date(gregorian).getFullYear()] = new Date(
      gregorian
    ).getFullYear();
    item = document.getElementById(`month-box-${i + 1}`);
    // title = document.getElementById(`month-box-${i + 1}-title`);
    displayCalenderGridYear(gregorian, item);
  }

  let yearNum = hijriYear % 210 === 0 ? 210 : hijriYear % 210;
  let yearIsLeap = Calender.leapYears.includes(yearNum) ? true : false;
  let yearList = Object.keys(uniqueYear);

  generateSelectedDate(date, yearList);

  // media print page 1
  document.querySelector("#page1-title-year").innerHTML = `
  <span>${hijriYear} هـ  ${
    yearIsLeap ? `<small class="text-danger">كبيسة</small>` : ""
  }</span> <small class="text-danger">${yearList.join("-")} م</small>`;
  // media print page 2
  document.querySelector("#page2-title-year").innerHTML = `
  <span>${hijriYear} هـ  ${
    yearIsLeap ? `<small class="text-danger">كبيسة</small>` : ""
  }</span> <small class="text-danger">${yearList.join("-")} م</small>`;

  document.getElementById(
    "page1-title-months-count"
  ).textContent = `سنة ${hijriYear} للهجرة من شهر 1 الي شهر 6`;
  document.getElementById(
    "page2-title-months-count"
  ).textContent = `سنة ${hijriYear} للهجرة من شهر 7 الي شهر 12`;
}

function goNextYear() {
  let gregorian = Calender.theCurrentDate.gregorianDate;
  let year = gregorian.toHijri()._year;

  let thisYear = document.getElementById("thisYear");

  let newHijriYear = gregorian.toHijri()._year + 1;

  let hijriDate = new HijriDate(newHijriYear, 1, 1);

  if (newHijriYear !== year) {
    thisYear.classList.remove("hide");
    document.getElementById("today").classList.remove("hide");
  } else {
    thisYear.classList.add("hide");
    document.getElementById("today").classList.add("hide");
  }

  // displayCalenderGrid(gregorian);
  Calender.theCurrentDate.gregorianDate = new Date(hijriDate.toGregorian());
  displayCalenderYear(newHijriYear);
  generateMonths(Calender.theCurrentDate.gregorianDate);
  displayCalenderGrid(Calender.theCurrentDate.gregorianDate);
  changeMonthActive(1);
}

function goPrevYear() {
  let gregorian = Calender.theCurrentDate.gregorianDate;
  let year = gregorian.toHijri()._year;
  let thisYear = document.getElementById("thisYear");

  if (year === 1) {
    alert("لا يمكنك العودة اكثر من هذا");
    return;
  }

  let newHijriYear = gregorian.toHijri()._year - 1;

  let hijriDate = new HijriDate(newHijriYear, 1, 1);

  if (newHijriYear !== year) {
    thisYear.classList.remove("hide");
    document.getElementById("today").classList.remove("hide");
  } else {
    thisYear.classList.add("hide");
    document.getElementById("today").classList.add("hide");
  }

  if (newHijriYear !== year) thisYear.classList.remove("hide");
  else thisYear.classList.add("hide");
  // displayCalenderGrid(gregorian);
  Calender.theCurrentDate.gregorianDate = new Date(hijriDate.toGregorian());
  displayCalenderYear(newHijriYear);
  generateMonths(Calender.theCurrentDate.gregorianDate);
  displayCalenderGrid(Calender.theCurrentDate.gregorianDate);
  changeMonthActive(1);
}

function __thisYear(e) {
  let gregorian = new Date();
  let year = gregorian.toHijri()._year;
  displayCalenderYear(year);
  e.target.classList.add("hide");
  displayCalenderGrid(gregorian);
  document.getElementById("today").classList.remove("hide");
  __today();
}

function getSunriseTime() {
  let suncalc = SunCalc.getTimes(
    new Date(),
    latAndLong.latitude,
    latAndLong.longitude
  );
  let sunsetStr = suncalc.sunset.getHours() + ":" + suncalc.sunset.getMinutes();
  let sunset = sunsetStr.split(":");
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (
    `${hours.toString().padStart(2, 0)}${minutes.toString().padStart(2, 0)}` >
    parseInt(
      `${sunset[0].toString().padStart(2, 0)}${sunset[1]
        .toString()
        .padStart(2, 0)}`
    )
  ) {
    let currentDate = new Date();
    let hijri = currentDate.toHijri();
    hijri.addDay();
    let tomorrow = hijri.toGregorian();
    Calender.theCurrentDate.updateDate();
    displayCalenderGrid(tomorrow);
  }
}

function generateSelectedDate(date = new Date(), yearList) {
  document.getElementById("selected-date-hijri").innerHTML = `
  <span class="text-white">${Calender.getSelectedHijriDate(date)} هـ</span>
  `;

  const years = yearList
    ? `${Calender.convertEnglishToArabicNumber(
        +yearList?.at(0)
      )} - ${Calender.convertEnglishToArabicNumber(+yearList?.at(1))}`
    : yearList?.join("-");

  document.getElementById(
    "selected-date-gregorian"
  ).innerHTML = `<span class="text-danger">${
    years ? years : new Date(date).toLocaleDateString("ar-EG")
  } م</span>
  `;
}

function getUniqueMonths(theDate) {
  let hashUniqueMonths = {};
  let date = new Date(theDate);
  let hijriDate = date.toHijri();

  const yearNumber = hijriDate._year % 210;

  for (let i = 0; i <= 12; i++) {
    let start_hijri = new HijriDate(hijriDate._year, i, 1);
    let end_hijri = new HijriDate(
      hijriDate._year,
      i,
      Calender.countDayOfMonth(i, yearNumber)
    );

    let startGregorian = start_hijri.toGregorian();
    let startMonth = startGregorian.toLocaleDateString("ar-EG", {
      month: "long",
    });
    let endGregorian = end_hijri.toGregorian();
    let endMonth = endGregorian.toLocaleDateString("ar-EG", { month: "long" });
    hashUniqueMonths[i] = `${startMonth} ${endMonth ? `- ${endMonth}` : ""}`;
  }
  return hashUniqueMonths;
}

function generateMonths(date) {
  let currentMonth = Calender.theCurrentDate.getCurrentMonthHijri();
  let hashUniqueMonths = getUniqueMonths(date);
  Object.keys(Calender.months).forEach((month) => {
    document.querySelector(
      `#listOfMonth button:nth-child(${month})`
    ).innerHTML = `
      <span data-month="${month}" class="d-flex flex-column justify-content-center align-items-center ${
      month == currentMonth ? "active" : ""
    }" >
    <small>${Calender.months[month]}</small>
    <small  class="text-danger">${hashUniqueMonths?.[month]}</small>
    </span>
    `;
  });
}

window.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(".calender-list-grid-body")
    .addEventListener("click", (e) => {
      if (e.target.matches("span")) {
        if (e.target.dataset.has_event) {
          displayEvents(e.target.dataset.current_date);
          generateSelectedDate(e.target.dataset?.current_date);
        }
        Array.from(document.querySelectorAll("span")).forEach((_) =>
          _.classList.remove("visited")
        );
        e.target.classList.add("visited");
      }
    });
});
