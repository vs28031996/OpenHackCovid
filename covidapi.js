/**
 *
 * main() will be run when you invoke this action
 *
 * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
 *
 * @return The output of this action, which must be a JSON object.
 *
 */
var request = require("request-promise");
const DiscoveryV1 = require("watson-developer-cloud/discovery/v1");


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const statesMap = {
  alaska: "99501:US",
  alabama: "35801:US",
  arkansas: "72201:US",
  american_samoa: "96799:US",
  arizona: "85001:US",
  california: "90001:US",
  colorado: "80201:US",
  connecticut: "06101:US",
  district_of_columbia: "20001:US",
  delaware: "19901:US",
  florida: "33124:US",
  georgia: "30301:US",
  guam: "GU:US",
  hawaii: "96801:US",
  iowa: "50301:US",
  idaho: "83254:US",
  illinois: "60601:US",
  indiana: "46201:US",
  kansas: "67201:US",
  kentucky: "41701:US",
  louisiana: "70112:US",
  massachusetts: "02101:US",
  maryland: "21201:US",
  maine: "04032:US",
  michigan: "49036:US",
  minnesota: "55801:US",
  missouri: "63101:US",
  mississippi: "39530:US",
  montana: "59044:US",
  north_carolina: "27565:US",
  north_dakota: "58282:US",
  nebraska: "68901:US",
  new_hampshire: "03217:US",
  new_jersey: "07450:US",
  new_mexico: "87500:US",
  nevada: "89501:US",
  new_york: "10001:US",
  ohio: "44101:US",
  oklahoma: "74101:US",
  oregon: "74101:US",
  pennsylvania: "15201:US",
  puerto_rico: "00600:US",
  rhode_island: "02840:US",
  south_carolina: "29020:US",
  south_dakota: "57401:US",
  tennessee: "37201:US",
  texas: "78701:US",
  utah: "84321:US",
  virginia: "24517:US",
  virgin_islands: "00801:US",
  vermont: "05751:US",
  washington: "98004:US",
  wisconsin: "53201:US",
  west_virginia: "25813:US",
  wyoming: "82941:US"
};

function formatStates(state) {
  state = state.toLowerCase();
  state = state.replace(" ", "_");
  
  return state;
}

function filterLocation(location) {
  location = location.toLowerCase();
  let loc = "";
  if(location == "u.s.a." || location == "u.s.a" || location == "u.s" || location == "usa"  || location == "states" || location == "america" || location == "united states of america") {
    loc = "us";  
  }
  else
   loc = location;
  return loc;
}


async function main(params) {
  if (params.type === "api") {
    try {
      const summary = await request({
        method: "GET",
        uri: "https://api.covid19api.com/summary",
        json: true,
      });

      if (params.location) {
        // country was the old param, could be states in us.
        state = formatStates(params.location);
        if (state in statesMap) {
          const uri = `https://api.weather.com/v3/wx/disease/tracker/state/60day?postalKey=${statesMap[state]}&format=json&apiKey=${params.twcApiKey}`;

          const data = await request({
            method: "GET",
            uri: uri,
            json: true,
          });

          return {
            result: `Total Cases: ${data.covid19.confirmed[0]}\nTotal Deaths: ${data.covid19.deaths[0]}\n\nSource: ${data.covid19.source[0]}`,
          };
        }
        const loc = filterLocation(params.location);
        
        for (var i = 0; i < summary.Countries.length; i++) {
          if (
            summary.Countries[i].Country.toLowerCase() ===
              loc.toLowerCase() ||
            summary.Countries[i].CountryCode.toLowerCase() ===
              loc.toLowerCase() ||
            summary.Countries[i].Slug.toLowerCase() ===
              loc.toLowerCase()
          ) {
              if (params.dailyIncreaseBool) {
                    
                    //Returns all cases by case type for a country from the first recorded case
                  const totalDayone = await request({
                    method: "GET",
                    uri: "https://api.covid19api.com/total/dayone/country/" + summary.Countries[i].Slug,
                    json: true,
                  });
                 
                  let confirmedCasesChange = totalDayone[totalDayone.length-1].Confirmed - totalDayone[totalDayone.length-2].Confirmed;
                  let deathCasesChange = totalDayone[totalDayone.length-1].Deaths - totalDayone[totalDayone.length-2].Deaths;
                  let recoveredCasesChange = totalDayone[totalDayone.length-1].Recovered - totalDayone[totalDayone.length-2].Recovered;
                  
                    return {
                      result: `Increase in number of Cases(past 24 hour)\nConfirmed Cases: ${confirmedCasesChange}\nDeaths: ${deathCasesChange}\nRecovered: ${recoveredCasesChange}`,
                    };
              }
            return {
              result: `Total Cases: ${summary.Countries[i].TotalConfirmed}\nTotal Deaths: ${summary.Countries[i].TotalDeaths}\nTotal Recovered: ${summary.Countries[i].TotalRecovered}\n\nSource: Johns Hopkins CSSE`,
            };
          }
        }
        return { error: "did not find location" };
      }
      let totalCases = summary.Global.TotalConfirmed;
      let totalDeaths = summary.Global.TotalDeaths;
      let totalRecovered = summary.Global.TotalRecovered;

      return {
        result: `Total Cases: ${totalCases}\nTotal Deaths: ${totalDeaths}\nTotal Recovered: ${totalRecovered}\n\nSource: Johns Hopkins CSSE`,
      };
    } catch (err) {
      return { error: "it failed : " + err };
    }
  } 
}
