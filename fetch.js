const fetch = require("node-fetch");
const csv2json = require("csvtojson");
const { renameKeys } = require("./util");

exports.fetchGoogleSheet = async ({
  publishedURL,
  skipFirstLine = false,
  alwaysEnabled = false,
  subtype = null,
}) => {
  console.log(`start fetching google sheet --- start`);
  const result = await fetch(
    `${publishedURL}&single=true&output=csv&headers=0${
      skipFirstLine ? "&range=A2:ZZ" : ""
    }&q=${Math.floor(new Date().getTime(), 1000)}`
  );
  const data = await result.text();
  const records = await csv2json().fromString(data);
  console.log(`start fetching google sheet --- done`);
  return records.filter((r) => alwaysEnabled || r.enabled === "Y");
};

exports.fetchDataGovHK = async ({ url, fieldMapping }) => {
  console.log(`start fetching gov data --- start`);
  const response = await Promise.all(
    ["chi", "eng"].map((lang) => fetch(url(lang)).then((res) => res.json()))
  );
  console.log(`start fetching gov data --- done`);
  return response.flat().map((obj) => renameKeys(fieldMapping, obj));
};
