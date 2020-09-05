const { fetchGoogleSheet } = require("./fetch");

const PUBLISHED_SPREADSHEET_WARS_CASES_LOCATION_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6aoKk3iHmotqb5_iHggKc_3uAA901xVzwsllmNoOpGgRZ8VAA3TSxK6XreKzg_AUQXIkVX5rqb0Mo/pub?gid=0";
const PUBLISHED_SPREADSHEET_WARS_CASES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr2xYotDgnAq6bqm5Nkjq9voHBKzKNWH2zvTRx5LU0jnpccWykvEF8iB_0g7Tzo2pwzkTuM3ETlr_h/pub?gid=0";

module.exports = {
  checkCaseLocationByCaseNo: async (caseNo) => {
    try {
      console.log(`query case location by case no ${caseNo}`);
      const CaseLocationData = await fetchGoogleSheet({
        publishedURL: PUBLISHED_SPREADSHEET_WARS_CASES_LOCATION_URL,
        skipFirstLine: true,
      });

      return {
        locations: CaseLocationData.filter((c) => +c.case_no === +caseNo),
      };
    } catch (error) {
      console.error(error.stack);
      return {
        error: error.stack,
      };
    }
  },
};
