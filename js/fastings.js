import { countDayOfMonth, months, theCurrentDate } from "./calender-setup.js";
import { calculateDate } from "./global.js";

let storageFasting = {
  fetchFastings() {
    let fastings = JSON.parse(localStorage.getItem("fastings"));
    return fastings && fastings.length ? fastings : [];
  },
  saveFastings(fastings) {
    localStorage.setItem("fastings", JSON.stringify(fastings));
  },
};

function insertFasting() {
  let fastings = storageFasting.fetchFastings();
  let date = new Date();
  let hijri = date.toHijri();
  if (hijri._month === 1 && hijri._date === 1) {
    fastings = [];
  } else if (fastings.length > 0) {
    return; // Skip recalculation if fastings exist and not Muharram 1st
  }

  let theYear = theCurrentDate.getCurrentYearHijri();

  // Loop through 5 years
  for (let idx = 0; idx < 5; idx++) {
    let yearNumber = +theYear + idx; // Increment Hijri year

    // Loop through months (1 to 12)
    for (let index = 1; index <= 12; index++) {
      if (index === 9) continue; // Skip Ramadan (month 9) due to obligatory fasting

      let monthCount = countDayOfMonth(index, yearNumber);
      // Validate month length
      if (monthCount < 29 || monthCount > 30) {
        console.warn(
          `Unexpected month length: ${monthCount} for month ${index}, year ${yearNumber}`
        );
        continue;
      }

      // Loop through days of the month
      for (let i = 1; i <= monthCount; i++) {
        let startLastThr = monthCount > 29 ? 24 : 23; // Last Thursday threshold
        let _hijri = new HijriDate(yearNumber, index, i);
        let gregorian = _hijri.toGregorian();

        // Validate Gregorian date
        if (!(gregorian instanceof Date) || isNaN(gregorian)) {
          console.error(
            `Invalid Gregorian date for Hijri ${yearNumber}/${index}/${i}`
          );
          continue;
        }

        let gregorianDate = new Date(gregorian);
        let weekDay = gregorianDate.getDay(); // 0=Sunday, 3=Wednesday, 4=Thursday

        // White Days (13th, 14th, 15th) except 12th and 13th of Dhu al-Hijjah
        if (i > 12 && i < 16) {
          if (index === 12 && (i === 12 || i === 13)) continue; // Skip Tashriq days
          fastings.push({
            title: "صيام الايام البيض",
            date: gregorianDate,
            month: months[index],
          });
        }

        // First Thursday (days 1–7)
        if (weekDay === 4 && i <= 7) {
          fastings.push({
            title: "اول خميس",
            date: gregorianDate,
            month: months[index],
          });
        }

        // Middle Wednesday (days 12–18, excluding Dhu al-Hijjah and Muharram)
        if (weekDay === 3 && i >= 12 && i <= 18) {
          if (index === 12 || index === 13) continue; // Skip Dhu al-Hijjah and Muharram
          fastings.push({
            title: "اوسط أربعاء",
            date: gregorianDate,
            month: months[index],
          });
        }

        // Last Thursday (days >= startLastThr)
        if (weekDay === 4 && i >= startLastThr && i <= monthCount) {
          fastings.push({
            title: "أخر خميس",
            date: gregorianDate,
            month: months[index],
          });
        }
      }
    }
  }

  // Save fastings with error handling
  try {
    storageFasting.saveFastings(fastings);
  } catch (error) {
    console.error("Failed to save fastings:", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  insertFasting();
  let fastings = storageFasting.fetchFastings();
  // Fastings
  let fastGrid = document.getElementById("fastingGrid");
  let count = 0;
  let date = new Date();
  let minusDay = date.setDate(date.getDate() - 1);
  let id = "";
  for (let fasting of fastings) {
    if (
      Date.parse(fasting.date) >= Date.parse(new Date(minusDay)) &&
      count < 1
    ) {
      count++;
      id = "closestFastingItem";
    }

    let gregorianDate = new Date(fasting?.date);
    let hijri = gregorianDate.toHijri();

    fastGrid.innerHTML += `
    <div class="fasting-item" id="${id}">
      <span>${calculateDate(fasting.date)}</span>
      <p>${fasting.title}</p>
      <div class="d-flex align-items-center justify-content-between">
        <span>${hijri?._date} ${months?.[hijri?._month]} ${hijri?._year
      } هـ</span>
        <span class="text-danger" style="font-size:14px">${new Date(
        gregorianDate
      ).toLocaleDateString("ar-EG")}</span>
      </div>
    </div>
    
  `;
  }

  let stepOfCondition = 0;
  let fastingContainer = document.getElementById("closestFastingGrid");
  if (fastings.length > 0) {
    for (let index = 0; index < fastings.length; index++) {
      // three closest fasting days
      if (
        Date.parse(fastings[index].date) > Date.parse(new Date()) &&
        stepOfCondition < 3
      ) {
        stepOfCondition++;
        fastingContainer.innerHTML += `
        
        <div class= "table-style-grid d-flex justify-content-between flex-row  ">
        <div class="d-flex flex-column">
      <h4>${fastings[index].title} <small>${fastings[index].month}</small> </h4>
      <span class="timer-style timer ${Date.parse(fastings[index].date) > Date.parse(new Date())
            ? ""
            : "completed"
          } ">${calculateDate(fastings[index].date)}</span>
    </div>
    <i class="bi bi-arrow-left-circle"></i>

    </div>




    `;
      }
    }
  } else {
    document.getElementById("closestFasting").style.background = "#fff022";
  }
});
