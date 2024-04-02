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
            break;

        case "streamComplete":
            // Reactivates the submit button
            document.getElementById('chatSubmitButton').disabled = false;
            document.getElementById('chatSubmitButton').className = 'message-button';
            break;

        case "searchVdbResults":
            const results_div = document.getElementById('results');
            let results = message.payload;
             const view_results = results.map((result) => ({
                ...result,
                url: `https://kartkatalog.geonorge.no/metadata/${result.title}/${result.uuid}`,
            }));

            view_results.forEach((result) => {
                const result_div = document.createElement('div');
                result_div.classList.add('result-item'); // Add class 'result-item' to the div

                const title_h3 = document.createElement('h3');
                title_h3.textContent = result.title; // Set the title text
                result_div.appendChild(title_h3); // Append the title to the result div

                const distance_p = document.createElement('p');
                distance_p.textContent = `Distance: ${result.distance}`; // Set the distance text
                result_div.appendChild(distance_p); // Append the distance to the result div

                const metadata_a = document.createElement('a');
                metadata_a.href = result.url; // Set the URL for the metadata link
                metadata_a.target = '_blank'; // Open in a new tab
                metadata_a.textContent = 'View Metadata'; // Set the text for the metadata link
                result_div.appendChild(metadata_a); // Append the metadata link to the result div

                results_div.appendChild(result_div); // Append the result div to the results container
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



// Makes the chat and search containers dragable and resizable
$(document).ready(function() {
    $("#resizeChatDiv").draggable({
        handle: ".chat-drag-handle",
        containment: "window"
    }).resizable();
});

$(document).ready(function() {
    $("#resizeSearchDiv").draggable({
        handle: ".search-drag-handle",
        containment: "window"
    }).resizable();
});