// This function fetches the XML data
function fetchXMLData(url) {
    return fetch(url)
      .then(response => response.text())
      .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"));
  }
  
  // This function processes the XML and returns job listings by category
  function processXML(xml) {
    const positions = xml.getElementsByTagName('position');
    const categories = {};

    for (let position of positions) {
        const safeTextContent = (elems) => elems.length > 0 ? elems[0].textContent : null;

        const id = safeTextContent(position.getElementsByTagName('id'));
        const department = safeTextContent(position.getElementsByTagName('department')); // Themenbereich
        const title = safeTextContent(position.getElementsByTagName('name'));
        const seniority = safeTextContent(position.getElementsByTagName('seniority')); // Type
        const location = safeTextContent(position.getElementsByTagName('office')); // Standort

        // Skip adding job if mandatory fields are missing
        if (!id || !department || !title || !seniority || !location) {
            continue;
        }

        // Create category if it doesn't exist
        if (!categories[department]) {
            categories[department] = [];
        }

        // Add job to the category
        categories[department].push({ id, title, seniority, location });
    }

    return categories;
}

  
  // This function generates HTML for the categories
  function generateHTMLForCategories(categories) {
    let html = '';
  
    for (let category in categories) {
      html += `<div class="accordion-item-content">
        ${categories[category].map(job => `
          <a p_job-link href="https://statworx.jobs.personio.de/job/${job.id}?language=de&display=de" class="accordion_list w-inline-block">
            <div>
              <h4 p_job-title class="heading-small text-weight-normal">${job.title}</h4>
            </div>
            <div class="accordion_list-job">
              <div class="accordion_list-inner">
                <div p_themenbereich class="case_tag">${category}</div>
                <div p_type-of-employment class="case_tag">${job.seniority}</div>
                <div p_location class="case_tag">${job.location}</div>
              </div>
              <div class="arrow_holder">
                <img src="https://cdn.prod.website-files.com/6708e2b8dd5532212a1db2ac/671cbab6bcd086626f9e4960_statworx-arrow_forward2.svg" loading="lazy" alt="">
              </div>
            </div>
          </a>
        `).join('')}
      </div>`;
    }
  
    // Add the "No results found" div at the end
    html += '<div class="no_reults-found hide"><div>No results found.</div></div>';
  
    return html;
  }
  
  
  // This function inserts the HTML into the DOM
  function insertHTMLIntoDOM(html) {
    const nestElement = document.querySelector('[p_nest]');
    nestElement.innerHTML = html;
  }

 // This function populates the select fields for both type of employment and location
function populateFilters(categories) {
    const themenbereichSelect = document.querySelector('[p_themenbereich-filter]');
    const typeSelect = document.querySelector('[p_type-of-employment-filter]');
    const locationSelect = document.querySelector('[p_location-filter]');
    
    const types = new Set();
    const locations = new Set();

    // Collect unique values and populate filters
    Object.entries(categories).forEach(([category, jobs]) => {
        // Add category to Themenbereich filter
        if (themenbereichSelect) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            themenbereichSelect.appendChild(option);
        }

        // Collect unique types and locations
        jobs.forEach(job => {
            types.add(job.seniority);
            locations.add(job.location);
        });
    });

    // Populate type filter
    if (typeSelect) {
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    }

    // Populate location filter
    if (locationSelect) {
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
    }
}
  
  function applyFilters() {
    const selectedThemenbereich = document.querySelector('[p_themenbereich-filter]').value.trim();
    const selectedType = document.querySelector('[p_type-of-employment-filter]').value.trim();
    const selectedLocation = document.querySelector('[p_location-filter]').value.trim();

    let totalVisibleJobs = 0;
    const jobListings = document.querySelectorAll('.accordion_list');

    jobListings.forEach(job => {
        const themenbereich = job.querySelector('[p_themenbereich]').textContent.trim();
        const type = job.querySelector('[p_type-of-employment]').textContent.trim();
        const location = job.querySelector('[p_location]').textContent.trim();

        if ((selectedThemenbereich === '' || themenbereich === selectedThemenbereich) &&
            (selectedType === '' || type === selectedType) &&
            (selectedLocation === '' || location === selectedLocation)) {
            job.style.display = '';
            totalVisibleJobs++;
        } else {
            job.style.display = 'none';
        }
    });

    // Show/hide the "No results found" message
    const noResultsDiv = document.querySelector('.no_reults-found');
    if (noResultsDiv) {
        if (totalVisibleJobs === 0) {
            noResultsDiv.classList.remove('hide');
        } else {
            noResultsDiv.classList.add('hide');
        }
    }
}



  
  
  document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for all filters
    const themenbereichSelect = document.querySelector('[p_themenbereich-filter]');
    const typeSelect = document.querySelector('[p_type-of-employment-filter]');
    const locationSelect = document.querySelector('[p_location-filter]');
  
    if (themenbereichSelect) themenbereichSelect.addEventListener('change', applyFilters);
    if (typeSelect) typeSelect.addEventListener('change', applyFilters);
    if (locationSelect) locationSelect.addEventListener('change', applyFilters);
  
    // Fetch and process the XML, then populate the select fields and insert HTML into the DOM
    fetchXMLData('https://statworx.jobs.personio.com/xml')
        .then(xml => {
            const categories = processXML(xml);
            populateFilters(categories); // Updated to handle both filters
            const html = generateHTMLForCategories(categories);
            insertHTMLIntoDOM(html);
         
            setupCityFilters();
        })
        .catch(error => console.error('Error fetching or processing XML:', error));
    });
  
  

  document.addEventListener('DOMContentLoaded', (event) => {
    // Listen for clicks on the document
    document.addEventListener('click', function(e) {
        // Check if the clicked element or its parent has the class 'accordion-item-trigger'
        let trigger = null;
        if (e.target.classList.contains('accordion-item-trigger')) {
            trigger = e.target;
        } else if (e.target.parentElement && e.target.parentElement.classList.contains('accordion-item-trigger')) {
            trigger = e.target.parentElement;
        }

        if (trigger) {
            // Toggle the 'is-open' class on the trigger itself
            trigger.classList.toggle('is-open');

            // Find the next sibling with the class 'accordion-item-content' and toggle 'is-open' on it
            const content = trigger.nextElementSibling;
            if (content) {
                content.classList.toggle('is-open');
            }

            // Find the icon within the trigger and toggle 'is-open' on it
            const icon = trigger.querySelector('.icon-embed-xsmall');
            if (icon) {
                icon.classList.toggle('is-open');
            }
        }
    });
});

function setupCityFilters() {
    // Get the location select field
    const locationSelectField = document.querySelector('[p_location-filter]');

    // Check if the location select field exists
    if (locationSelectField) {
        // Get the city filter elements
        const munichFilter = document.querySelector('[munich-filter]');
        const parisFilter = document.querySelector('[paris-filter]');
        const chicagoFilter = document.querySelector('[chicago-filter]');
        const remoteFilter = document.querySelector('[remote-filter]'); // New remote filter

        // Add click event listeners to the city filter elements
        if (munichFilter) {
            munichFilter.addEventListener('click', () => {
                if (document.querySelector('[munich-jobs]').textContent === '0 open Positions') {
                    return;
                }
                locationSelectField.value = 'München';
                applyFilters();
            });
        }

        if (parisFilter) {
            parisFilter.addEventListener('click', () => {
                if (document.querySelector('[paris-jobs]').textContent === '0 open Positions') {
                    return;
                }
                locationSelectField.value = 'Paris';
                applyFilters();
            });
        }

        if (chicagoFilter) {
            chicagoFilter.addEventListener('click', () => {
                if (document.querySelector('[chicago-jobs]').textContent === '0 open Positions') {
                    return;
                }
                locationSelectField.value = 'Chicago';
                applyFilters();
            });
        }

        // New remote filter event listener
        if (remoteFilter) {
            remoteFilter.addEventListener('click', () => {
                if (document.querySelector('[remote-jobs]').textContent === '0 open Positions') {
                    return;
                }
                locationSelectField.value = 'Remote';
                applyFilters();
            });
        }
    }
}