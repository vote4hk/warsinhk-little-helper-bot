const { fetchGoogleSheet, fetchDataGovHK } = require("./fetch");
const { CHARACTER_MAPPING } = require("./const");

const PUBLISHED_SPREADSHEET_WARS_CASES_LOCATION_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6aoKk3iHmotqb5_iHggKc_3uAA901xVzwsllmNoOpGgRZ8VAA3TSxK6XreKzg_AUQXIkVX5rqb0Mo/pub?gid=0";
const PUBLISHED_SPREADSHEET_WARS_CASES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr2xYotDgnAq6bqm5Nkjq9voHBKzKNWH2zvTRx5LU0jnpccWykvEF8iB_0g7Tzo2pwzkTuM3ETlr_h/pub?gid=0";
const DATA_GOV_HK_BUILDING_LIST = (lang) =>
  `https://api.data.gov.hk/v2/filter?q=%7B%22resource%22%3A%22http%3A%2F%2Fwww.chp.gov.hk%2Ffiles%2Fmisc%2Fbuilding_list_${lang}.csv%22%2C%22section%22%3A1%2C%22format%22%3A%22json%22%7D`;

const groupByCase = (arr) => {
  const uniqueCaseArray = new Set();
  const processedGovLocationData = arr
    .reduce((acc, cur) => {
      return [
        ...acc,
        ...cur.cases.split(",").map((c) => {
          const obj = {
            ...cur,
            case: +c.trim(),
          };

          delete obj.cases;
          uniqueCaseArray.add(obj.case);
          return obj;
        }),
      ];
    }, [])
    .sort((a, b) => {
      if (a.case > b.case) return 1;
      if (a.case < b.case) return -1;
    });
  return {
    processedGovLocationData,
    uniqueCaseArray,
  };
};

const checkMatch = (caseDat, govDat) => {
  const language = (govDat.location_zh && "zh") || "en";
  let caseLocationText = replaceAll(
    caseDat[`location_${language}`],
    CHARACTER_MAPPING
  )
    .trim()
    .toLowerCase();
  let govLocationText = replaceAll(
    govDat[`location_${language}`],
    CHARACTER_MAPPING
  )
    .trim()
    .toLowerCase();
  if (language === "zh") {
    caseLocationText = caseLocationText.replace(/\s/g, "");
    govLocationText = govLocationText.replace(/\s/g, "");
  }
  return caseLocationText.localeCompare(govLocationText) === 0;
};

const replaceAll = (str, mapObj) => {
  const re = new RegExp(Object.keys(mapObj).join("|"), "gi");

  return str
    .replace("(非住宅)", "")
    .replace("(non-residential)", "")
    .replace(re, function (matched) {
      return mapObj[matched.toLowerCase()];
    });
};

module.exports = {
  checkMissingGovLocation: async () => {
    try {
      const CaseLocationData = await fetchGoogleSheet({
        publishedURL: PUBLISHED_SPREADSHEET_WARS_CASES_LOCATION_URL,
        skipFirstLine: true,
      });

      // console.log(CaseLocation[0])
      const govLocationData = await fetchDataGovHK({
        url: DATA_GOV_HK_BUILDING_LIST,
        fieldMapping: {
          地區: "district_zh",
          District: "district_en",
          大廈名單: "location_zh",
          "Building name": "location_en",
          最後個案居住日期: "date_zh",
          "Last date of residence of the case(s)": "date_en",
          "相關疑似/確診個案": "cases",
          "Related probable/confirmed cases": "cases",
        },
      });

      console.log(`process goverment location data --- start`);
      const { processedGovLocationData, uniqueCaseArray } = groupByCase(
        govLocationData
      );
      console.log(`process goverment location data ----- end`);

      console.log(`compare location data --- start`);
      const CaseLocationDataWarsAndGov = CaseLocationData.filter((dat) =>
        uniqueCaseArray.has(+dat.case_no)
      );
      const result = processedGovLocationData.map((govDat) => {
        const matched = CaseLocationDataWarsAndGov.find((caseDat) =>
          checkMatch(caseDat, govDat)
        );
        if (matched) {
          return;
        } else {
          return govDat;
        }
      });
      console.log(`compare location data ----- end`);
      const notMatchArray = result.filter((c) => !!c);

      // for (const [i, notMatch] of notMatchArray.entries()) {
      //     console.log(`${notMatch.case} ${notMatch.location_zh || notMatch.location_en}`)
      // }

      // console.log(`total: ${CaseLocationData.length} || unmatched: ${notMatchArray.length}`)
      return {
        CaseLocationData,
        notMatchArray,
      };
    } catch (error) {
      console.error(error.stack);
      return {
        error: error.stack,
      };
    }
  },
};
