// Require node-fetch
const fetch = require('node-fetch');

// API configuration
const API_URLS = {
    API_V1: "https://nedlasting.geonorge.no/api/codelists/area/",
    API_V2: "https://nedlasting.ngu.no/api/v2/codelists/area/"
};

const ERROR_MESSAGE = {
    USER_NOT_AUTHORIZED: "User not authorized.",
    NO_VALID_API: "No valid API url provided",
};


/**
 *
 * @param apiUrl
 * @param uuid
 * @returns {Promise<any|*[]>} if returned an empty array, it failed, and another API will likely solve this issue
 */
async function fetchValidDownloadData(apiUrl, uuid) {
    if (!apiUrl) {
        console.error(ERROR_MESSAGE.NO_VALID_API);
        return ERROR_MESSAGE.NO_VALID_API;
    }

    const url = `${apiUrl}${uuid}`;

    try {
        const response = await fetch(url);
        // Handle non-200 responses and possible redirection to login page
        if (response.status === 404) {
            return []; // Could mean that the API was not correct
        }
        if (response.url.includes('https://auth2.geoid.no')) {
            console.error(ERROR_MESSAGE.USER_NOT_AUTHORIZED);
            return ERROR_MESSAGE.USER_NOT_AUTHORIZED
        }
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // TODO make additional checks so this wont ever crash
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

/**
 * Tries multiple API versions, and returns the result of the one that works
 * Returns a string if something went wrong
 * @param uuid
 * @returns {Promise<*|*[]>}
 */
async function fetch_valid_download_data_auto(uuid) {
    for (let key in API_URLS) {
        const res = await fetchValidDownloadData(API_URLS[key], uuid);
        if (res.length > 0 && Array.isArray(res)) {
            res.push({ api_version: key }); // Adds the api version to the result
            return res;
        }
        if (res.length > 0)
            return res;

        console.log(`Warn: ${key} is not available for this uuid: ${uuid}`);
    }
}


// Example usage
// API_V1 uuid a29b905c-6aaa-4283-ae2c-d167624c08a8 ("kvikkleire")
// API_V2 uuid 3de4ddf6-d6b8-4398-8222-f5c47791a757 ("losmasser")
// user Required uuid 3165138f-1461-44fe-8b10-eac44e08a10a ("FKB Bane")
fetch_valid_download_data_auto("3de4ddf6-d6b8-4398-8222-f5c47791a757").then((x) => console.log(x));

// TODO Comment out or remove before flight ^^

module.exports = { fetch_valid_download_data_auto }
