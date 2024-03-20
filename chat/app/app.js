const socket = new WebSocket('ws://localhost:8080');

// Listen for messages
socket.onmessage = async function(event) {
    const message = JSON.parse(event.data);

    if (message.action === "chatStream") {
        // SHould actually be inserted into a new chat div
        document.getElementById('results').innerHTML += message.payload;
    }
    else if (message.action === "chatVdbResults") {
        let results = message.payload;

        const view_results = results.map((result) => ({
            ...result,
            url: `https://kartkatalog.geonorge.no/metadata/${result.title}/${result.uuid}`,
        }));

        const results_div = document.getElementById('results');

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
    }
};

socket.onopen = () => {
    // TODO remove this logging
    console.log('WebSocket connection established');
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Listen for form submit instead of button click
document.getElementById('searchform').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    //const message = document.getElementById('searchinput').value;
    const message = {
        action : 'formSubmit',
        payload : document.getElementById('searchinput').value,
    }
    socket.send(JSON.stringify(message)); // Send the message from the input field
});
