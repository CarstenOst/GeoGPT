const socket = new WebSocket('ws://localhost:8080');


// Keeps track of the number of messages sendt, and current messageDiv to stream to
let chatMessageId = 0;
let currentSystemMessageDiv = null;
let currentUserMessageDiv = null;

socket.onopen = () => {
    // TODO remove this logging
    console.log('WebSocket connection established');
};


// Listen for messages
socket.onmessage = async function(event) {
    const message = JSON.parse(event.data);

    switch(message.action) {
        case "userMessage":
                // Creates new div for the incoming user message
                currentUserMessageDiv = document.createElement('div');

                // Adds id, class, and appends it to 'chatMessages' div
                currentUserMessageDiv.id = `message-${chatMessageId}`;
                currentUserMessageDiv.classList.add('user-message');
                currentUserMessageDiv.innerHTML += message.payload;
                document.getElementById('chatMessages').appendChild(currentUserMessageDiv);

                // Incremets message id right after response received
                chatMessageId += 1;
            break;

        case "chatStream":
            // Checks if a new message div should be created with unique id
            if (message.isNewMessage) {
                // Create a new div element for the incoming system message (also updates reference to the div the stream should be sendt to)
                currentSystemMessageDiv = document.createElement('div');

                // Adds id, class, and appends it to 'chatMessages' div
                currentSystemMessageDiv.id = `message-${chatMessageId}`;
                currentSystemMessageDiv.classList.add('system-message');
                document.getElementById('chatMessages').appendChild(currentSystemMessageDiv);

                // Incremets message id right after response received
                chatMessageId += 1;
            }

            // If the new systemMessage div has been created, stream is initialized
            if (currentSystemMessageDiv) {
                currentSystemMessageDiv.innerHTML += message.payload;
            }

            // Formats new message payload from markdown into html
            //customMarkdownConversion(currentSystemMessageDiv.id);
            break;

        case "streamComplete":
            // Reactivates the submit button
            document.getElementById('chatSubmitButton').disabled = false;
            document.getElementById('chatSubmitButton').className = 'message-button';
            break;

        case "insertImage":
            // Formats new message markdown contents into html
            customMarkdownImageConversion(currentSystemMessageDiv.id, message.payload.datasetImageUrl, message.payload.datasetDownloadUrl);
            break;
        
        case "formatMarkdown":
            // Formats new message markdown contents into html
            customMarkdownConversion(currentSystemMessageDiv.id);
            break;

        case "searchVdbResults":
            const results_div = document.getElementById('results');
            let results = message.payload;
             const view_results = results.map((result) => ({
                ...result,
                url: `https://kartkatalog.geonorge.no/metadata/${result.title}/${result.uuid}`,
            }));

            view_results.forEach((result) => {
                // Creates new result item with child elements
                const result_div = document.createElement('div');
                result_div.classList.add('result-item');


                // Adds title with dataset link
                const title_link = document.createElement('a');
                title_link.textContent = result.title;
                title_link.href = result.url;
                title_link.target = '_blank';
                result_div.appendChild(title_link);

                // Creates div containing
                const buttons_container = document.createElement('div');
                buttons_container.classList.add('result-buttons');

                // Creates the 'show dataset' button
                const show_button = document.createElement('div');
                show_button.classList.add('show-dataset');
                show_button.innerHTML = `<i class="fa-solid fa-map-location-dot show-dataset-icon"></i>
                    <span class="show-dataset-text">Vis</span>`;
                buttons_container.appendChild(show_button);

                // Creates the 'download dataset' button
                const download_button = document.createElement('div');
                download_button.classList.add('download-dataset');
                download_button.innerHTML = `<i class="fa-solid fa-cloud-arrow-down download-dataset-icon"></i>
                    <span class="download-dataset-text">Last ned</span>`;
                buttons_container.appendChild(download_button);

                // Appends the buttons container to the result div
                result_div.appendChild(buttons_container);

                results_div.appendChild(result_div);
            });
            break;

        default:
            console.log(`Invalid action.`)
      }

};

socket.onerror = (error) => {
    // TODO remove this logging
    console.error('WebSocket error:', error);
};

// Listen for chat form submit
document.getElementById('chatForm').addEventListener('submit', function(event) {
    // Prevent the default form submission and resubmission
    event.preventDefault(); 
    document.getElementById('chatSubmitButton').disabled = true;
    document.getElementById('chatSubmitButton').className = 'disabled-button';
    const message = {
        action : 'chatFormSubmit',
        payload : document.getElementById('chatInput').value,
    }
    
    // Send the message from the input field, and clears it
    socket.send(JSON.stringify(message)); 
    document.getElementById('chatInput').value = '';
});


// Listen for search form submit
document.getElementById('searchForm').addEventListener('submit', function(event) {
    // Prevent the default form submission and clears previous search results
    event.preventDefault(); 
    document.getElementById('results').innerHTML = '';
    const message = {
        action : 'searchFormSubmit',
        payload : document.getElementById('searchInput').value,
    }
    
    // Send the message from the input field, and clears it
    socket.send(JSON.stringify(message)); 
});



// Markdown formatting function
function customMarkdownImageConversion(elementId, imageUrl, downloadUrl) {
    var element = document.getElementById(elementId);
    if (!element) return;

    let htmlContent = element.innerHTML;

    // TODO replace the <a> download link to be when the button is clicked on the client side, to submit with uuid from icon, and selected formatting options
    // Html with image and formatting UI
    let replacementHtml = `
        <div class="card-image-container"> 
            <img src="${imageUrl}" alt="Bilde" width="100%"/> 
            <div class="show-card-button">
                <i class="fa-solid fa-map-location-dot card-icon"></i>Vis
            </div> 
            <a href="${downloadUrl}" target="_blank">
                <div class="download-card-button">
                    <i class="fa-solid fa-cloud-arrow-down card-icon"></i>Last ned
                </div> 
            </a>
        </div>
        `;
        /*
        Should be added above
        <div class="formats-dropdown">
            Format dropdown here
        </div>
        */
    htmlContent = htmlContent.replace(/\[bilde\]/g, replacementHtml);

    element.innerHTML = htmlContent;
}

// Formats the message markdown into html after stream is complete
function customMarkdownConversion(elementId) {
    var element = document.getElementById(elementId);
    if (element) {
        let htmlContent = element.innerHTML;

        // Headers
        //htmlContent = htmlContent.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        //htmlContent = htmlContent.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        //htmlContent = htmlContent.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        //htmlContent = htmlContent.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        //htmlContent = htmlContent.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        //htmlContent = htmlContent.replace(/^###### (.*$)/gim, '<h6>$1</h6>');

        htmlContent = htmlContent.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');

        // Bold
        htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Strikethrough
        htmlContent = htmlContent.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Blockquotes
        htmlContent = htmlContent.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

        // Inline Code
        htmlContent = htmlContent.replace(/`(.*?)`/g, '<code>$1</code>');

        // Links
        //htmlContent = htmlContent.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Horizontal Rules
        htmlContent = htmlContent.replace(/^(-{3,}|\*{3,}|_{3,})$/gim, '<hr />');

        // Unordered Lists (simple conversion, not handling nested lists)
        htmlContent = htmlContent.replace(/^\+ (.*$)/gim, '<ul>\n<li>$1</li>\n</ul>');
        htmlContent = htmlContent.replace(/^\* (.*$)/gim, '<ul>\n<li>$1</li>\n</ul>');
        htmlContent = htmlContent.replace(/^- (.*$)/gim, '<ul>\n<li>$1</li>\n</ul>');

        // Ordered Lists (simple conversion, not handling nested lists)
        htmlContent = htmlContent.replace(/^\d+\. (.*$)/gim, '<ol>\n<li>$1</li>\n</ol>');

        element.innerHTML = htmlContent;
    }
}



// Makes the chat and search containers dragable and resizable
$(document).ready(function() {
    $("#resizeChatDiv").draggable({
        handle: ".chat-drag-handle",
        containment: "window",

        // Makes the active card be on top
        start: function() {
            $(this).css("z-index", 2);
            $("#resizeSearchDiv").css("z-index", 1);
        }
    }).resizable();
});

$(document).ready(function() {
    $("#resizeSearchDiv").draggable({
        handle: ".search-drag-handle",
        containment: "window",

        // Makes the active card be on top
        start: function() {
            $(this).css("z-index", 2);
            $("#resizeChatDiv").css("z-index", 1);
        }
    }).resizable();
});





// Function for dynamically displaying filters on search
function filterFunction() {
    var input, filter, div, a, i;
    input = document.getElementById("searchFilter");
    filter = input.value.toUpperCase();
    div = document.getElementById("filterDropdown");
    a = div.getElementsByTagName("a");
    let isInputEmpty = input.value.trim() === '';
  
    // If there's no input, hide all links. Otherwise, follow the existing show/hide logic.
    for (i = 0; i < a.length; i++) {
      if (isInputEmpty) {
        a[i].style.display = "none";
      } else {
        let txtValue = a[i].textContent || a[i].innerText;
        a[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
      }
    }
  
    // Show the dropdown content when there's input, hide it when there's none.
    div.style.display = isInputEmpty ? "none" : "block";
  }







  //https://kartkatalog.geonorge.no/api/getdata/3de4ddf6-d6b8-4398-8222-f5c47791a757
    // Sjekk om "CanShowServiceMapUrl": true,
    // else ignore

    // Regex that replaces after pattern "&wms="
    // https://norgeskart.no/geoportal/#!?zoom=3&lon=36722&lat=719864&wms=https://nve.geodataonline.no/arcgis/services/SkredKvikkleire2/MapServer/WMSServer

    // replace everything after "&wms"
    // hent Distributions -> RelatedViewServices -> MapUrl (https://norgeskart.no/geoportal/#!?zoom=3&lon=306722&lat=7197864&wms=https://geo.ngu.no/mapserver/LosmasserWMS2)
    // insert new mapdata after &wms=




// Add function that sets standards, then checks with API if the dataset has those formats and projections.
// If it has them, set the UI standards to be our default values.
// If there are different area, projection, format, than the set standards. Modify the standards to be these.

// Add function for download, that takes uuid, area, format, projection etc
