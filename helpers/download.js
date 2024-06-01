// Require node-fetch
const fetch = require('node-fetch');
const {get_wms} = require("./fetch_valid_download_api_data");


async function fetchAreaData(uuid) {
  // Construct the URL with the provided UUID
  const url = `https://nedlasting.geonorge.no/api/codelists/area/${uuid}`;

  try {
    // Send a GET request to the API
    const response = await fetch(url);

    // Aborts if the response was not valid
    if (!response.ok) {
        //return []; // TODO add some error-handling
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Checks is API response is html page for login (dataset requires login)
    if (response.url.includes('https://auth2.geoid.no')) {
        //console.log(`Dataset requires authentication, API response is HTML login page. Uuid: ${uuid})}`);
        return [];
    }

    // Return the parsed JSON response
    return await response.json();

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}


async function datasetHasDownload(uuid) {
    const apiJSON = await fetchAreaData(uuid);
    const areas = typeof apiJSON === 'string' ? JSON.parse(apiJSON) : apiJSON;
    // Dataset has download if formats list is not empty
    if (areas.length > 0) {
        return true;
    }

    // Otherwise returns status as false by default
    return false;
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



async function getDownloadUrl(metadataUuid, downloadFormats) {
    const email = ""; // Email address
    const softwareClient = "GeoGpt"; // Software client
    const softwareClientVersion = "0.1.0"; // Software client version

    // Output the download format values
    console.log(`The Area is set to: ${downloadFormats.areaName}`);
    console.log(`The Area is set to: ${downloadFormats.areaCode}`);
    console.log(`The Area is set to: ${downloadFormats.areaType}`);
    console.log(`The Projection is set to: ${downloadFormats.projectionName}`);
    console.log(`The Projection is set to: ${downloadFormats.projectionCode}`);
    console.log(`The Projection is set to: ${downloadFormats.projectionCodespace}`);
    console.log(`The Format is set to: ${downloadFormats.formatName}`);
    console.log(`The Format is set to: ${downloadFormats.formatCode}`); // TODO possibly optional and can be removed?
    console.log(`The Format is set to: ${downloadFormats.formatType}`); // TODO possibly optional and can be removed?
    console.log(`The UserGroup is set to: ${downloadFormats.userGroup}`);
    console.log(`The UsagePurpose is set to: ${downloadFormats.usagePurpose}`);


    // Download order body JSON structure
    const orderRequest = {
        email: email,
        usageGroup: downloadFormats.userGroup,
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


async function getDatasetDownloadAndWmsStatus(vdbSearchResponse) {
    // Parallel async API check of all datasets download ability, which is added to the objects
    const downloadPromises = vdbSearchResponse.map(dataset => {
        return fetchAreaData(dataset.uuid)
            .then(async formatsApiResponseList => {
                return {
                    ...dataset,
                    downloadFormats: formatsApiResponseList,
                    wmsUrl: await get_wms(dataset.uuid) // TODO this needs updating to use API check function at later date
                };
            });
    });

    // Waits for the promises to be resolved before continuing
    return await Promise.all(downloadPromises);
}


module.exports = { getStandardOrFirstFormat, getDownloadUrl, datasetHasDownload, getDatasetDownloadAndWmsStatus };