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
        let data = await fetchValidDownloadData(API_URLS[key], uuid);
        if (data.length > 0 && Array.isArray(data)) {
            if (key === "API_V1") {
                data = convertV1toV2(data);
            }
            data.unshift({api_version: key}); // Adds the api version to the result
            return data;
        }
        if (data.length > 0)
            return data;

        console.log(`Warn: ${key} is not available for this uuid: ${uuid}`);
    }
    return [];
}


// Example usage
// API_V1 uuid a29b905c-6aaa-4283-ae2c-d167624c08a8 ("kvikkleire")
// API_V2 uuid 3de4ddf6-d6b8-4398-8222-f5c47791a757 ("losmasser")
// user Required uuid 3165138f-1461-44fe-8b10-eac44e08a10a ("FKB Bane")
//fetch_valid_download_data_auto("a29b905c-6aaa-4283-ae2c-d167624c08a8").then((x) => console.log(x))  // V1
//fetch_valid_download_data_auto("3de4ddf6-d6b8-4398-8222-f5c47791a757").then((x) => console.log(x)); // V2

// TODO Comment out or remove before flight ^^




/**
 * This returns json in API_V2 format, however 0000 kode is ignored, and sendt as V1 format
 * because the formats and projections does not match here :/
 * @param jsonData json input of V1 format
 * @returns {*} API_V2 format
 */
function convertV1toV2(jsonData) {
    return jsonData.reduce((acc, item) => {
        if (item.code === "0000") {
            // For code "0000", return the item as it is
            acc.push({...item});
            return acc;
        }

        const uniqueProjections = new Set();
        const formatNames = new Set();

        if (Array.isArray(item.projections)) {
            item.projections.forEach(projection => {
                uniqueProjections.add({
                    code: projection.code,
                    name: projection.name,
                    codespace: projection.codespace
                });
                if (Array.isArray(projection.formats)) {
                    projection.formats.forEach(format => {
                        formatNames.add(format.name);
                    });
                }
            });
        }

        const result = {
            code: item.code,
            type: item.type,
            name: item.name,
            projections: [...uniqueProjections],
            formats: Array.from(formatNames).map(name => ({ name }))
        };

        // Only add result to accumulator if either projections or formats are non-empty
        if (result.projections.length > 0 || result.formats.length > 0) {
            acc.push(result);
        }

        return acc;
    }, []);
}


module.exports = {fetch_valid_download_data_auto}