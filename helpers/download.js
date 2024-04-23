// Require node-fetch
const fetch = require('node-fetch');

async function fetchAreaData(uuid) {
  // Construct the URL with the provided UUID
  const url = `https://nedlasting.geonorge.no/api/codelists/area/${uuid}`;

  try {
    // Send a GET request to the API
    const response = await fetch(url);

    // Aborts if the response was not valid
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Return the parsed JSON response
    return await response.json();

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}


// NB! this function would be ideal if the user preferences for area, projection, format, etc could be fetched and used as standards here
async function getStandardOrFirstFormat(uuid) {
    // Initial standard values we want to set as standard for downloads
    let areaName = "Hele landet";
    let areaCode = "0000";
    let areaType = "landsdekkende";

    let projectionName = "EUREF89 UTM sone 33, 2d";
    let projectionCode = "25833";
    let projectionCodespace = "";

    let formatName = "FGDB";
    // TODO these are possibly optional
    let formatCode = "";
    let formatType = "";

    let userGroup = "GeoGPT";
    let usagePurpose = "GeoGPT";

    console.log(`getStandardOrFirst is sending API request...`)
 
    // Convert the input JSON to an object if it's a string
    const apiJSON = await fetchAreaData(uuid);
    const areas = typeof apiJSON === 'string' ? JSON.parse(apiJSON) : apiJSON;

    // Checks if "Hele Norge" does not exist, set the standard area to the first element
    let areaObject = areas.find(area => area.name === areaName) || areas[0];
    areaName = areaObject.name;
    areaCode = areaObject.code;
    areaType = areaObject.type;

    // Checks if the standard projection "EUREF89 UTM sone 33, 2d" does not exist, set the standard projection to the first list element
    let projectionObject = areaObject.projections.find(projection => projection.name === projectionName) || areaObject.projections[0];
    projectionName = projectionObject.name;
    projectionCode = projectionObject.code;
    projectionCodespace = projectionObject.codespace;

    // Checks if the standard format "FGDB" does not exist, set the standard format to the first list element
    let formatObject = projectionObject.formats.find(format => format.name === formatName) || projectionObject.formats[0];
    formatName = formatObject.name;

    // Checks if the dataset is missing essential information for download
    let noAreas = areas.length === 0;
    let noProjections = areaObject.projections.length === 0;
    let noFormats = projectionObject.formats.length === 0;
    if (noAreas || noProjections || noFormats) {
        console.log('No valid area, projection, or format available for dataset download.');
    }

    console.log(`getStandardOrFirst successfully sendt API request!`)

    // Output the final standard values
    console.log(`The standard Area is set to: ${areaName}`);
    console.log(`The standard Area is set to: ${areaCode}`);
    console.log(`The standard Area is set to: ${areaType}`);
    console.log(`The standard Projection is set to: ${projectionName}`);
    console.log(`The standard Projection is set to: ${projectionCode}`);
    console.log(`The standard Projection is set to: ${projectionCodespace}`);
    console.log(`The standard Format is set to: ${formatName}`);
    console.log(`The standard Format is set to: ${formatCode}`); // TODO possibly optional and can be removed?
    console.log(`The standard Format is set to: ${formatType}`); // TODO possibly optional and can be removed?
    console.log(`The standard UserGroup is set to: ${userGroup}`);
    console.log(`The standard UsagePurpose is set to: ${usagePurpose}`);

    return {
        areaName,
        areaCode,
        areaType,
        projectionName,
        projectionCode,
        projectionCodespace,
        formatName,
        formatCode, // TODO possibly optional and can be removed?
        formatType, // TODO possibly optional and can be removed?
        userGroup,
        usagePurpose
      };
}



/*
const result = (async () => {
    try {
        return await getStandardOrFirstFormat("a29b905c-6aaa-4283-ae2c-d167624c08a8");
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
})();


result.then((data) => {
    if (data) {
        console.log(data);
    } else {
        console.log("No API response.");
    }
});
*/



async function getDownloadUrl(metadataUuid, downloadFormats) {
    const email = ""; // Email address
    const softwareClient = "GeoGpt"; // Software client
    const softwareClientVersion = "15.7.2602"; // Software client version

    // Download order body JSON structure
    const orderRequest = {
        email: email,
        usageGroup: downloadFormats.usageGroup,
        softwareClient: softwareClient,
        softwareClientVersion: softwareClientVersion,
        orderLines: [
            {
                metadataUuid: metadataUuid,
                areas: [
                    {
                        code: downloadFormats.areaCode,
                        name: downloadFormats.areaName,
                        type: downloadFormats.areaType,
                    },
                ],
                projections: [
                    {
                        code: downloadFormats.projectionCode,
                        name: downloadFormats.projectionName,
                        codespace: downloadFormats.projectionCodespace,
                    },
                ],
                formats: [
                    {
                        code: downloadFormats.formatCode,
                        name: downloadFormats.formatName,
                        type: downloadFormats.formatType,
                    },
                ],
                usagePurpose: downloadFormats.usagePurpose,
            },
        ],
    };

    console.log(`Sendt the request with body: ${orderRequest}`);

    let response = await fetch(`https://nedlasting.geonorge.no/api/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest)
    })

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Network response failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    let data = await response.json()
    if (data.files && data.files.length > 0) {
        return data.files[0].downloadUrl; // Return the first downloadUrl found
    } else {
        return null; // Return null if no downloadUrl is found
    }

}



module.exports = { getStandardOrFirstFormat, getDownloadUrl };