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
        const schedule = safeTextContent(position.getElementsByTagName('schedule')); // Type
        const location = safeTextContent(position.getElementsByTagName('office')); // Standort

        // Skip adding job if mandatory fields are missing
        if (!id || !department || !title || !schedule || !location) {
            continue;
        }

        // Create category if it doesn't exist
        if (!categories[department]) {
            categories[department] = [];
        }

        // Add job to the category
        categories[department].push({ id, title, schedule, location });
    }

    return categories;
}

  
  // This function generates HTML for the categories
  function generateHTMLForCategories(categories) {
    let html = '';
  
    for (let category in categories) {
      html += `<div class="accordion-item-content">
        ${categories[category].map(job => `
          <a p_job-link href="https://twaice.jobs.personio.com/job/${job.id}?language=de&display=en" class="accordion_list w-inline-block">
            <div>
              <h4 p_job-title class="heading-small text-weight-normal">${job.title}</h4>
            </div>
            <div class="accordion_list-job">
              <div class="accordion_list-inner">
                <div p_themenbereich class="text-size-small">${category}</div>
                <div class="text-size-small">,</div>
                <div p_type-of-employment class="text-size-small is-fest">${job.schedule}</div>
                <div class="text-size-small">,</div>
                <div p_location class="text-size-small is-job">${job.location}</div>
              </div>
              <div class="icon-embed-xsmall w-embed">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 25" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M23.251 12.3826C23.251 6.16936 18.2142 1.13257 12.001 1.13257C5.78777 1.13257 0.750977 6.16936 0.750977 12.3826C0.750977 18.5958 5.78777 23.6326 12.001 23.6326C18.2142 23.6326 23.251 18.5958 23.251 12.3826Z" fill="#1562FC"></path>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M17.1941 12.0955C17.1575 12.007 17.1032 11.9241 17.0313 11.8522L13.2813 8.10224C12.9884 7.80935 12.5135 7.80935 12.2206 8.10224C11.9278 8.39513 11.9278 8.87001 12.2206 9.1629L14.6903 11.6326H7.50098C7.08676 11.6326 6.75098 11.9684 6.75098 12.3826C6.75098 12.7968 7.08676 13.1326 7.50098 13.1326H14.6903L12.2206 15.6022C11.9278 15.8951 11.9278 16.37 12.2206 16.6629C12.5135 16.9558 12.9884 16.9558 13.2813 16.6629L17.0313 12.9129C17.1778 12.7665 17.251 12.5745 17.251 12.3826C17.251 12.2809 17.2307 12.1839 17.1941 12.0955Z" fill="white"></path>
                </svg>
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
            types.add(job.schedule);
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
    const selectedType = document.querySelector('[p_type-of-employment]').value.trim();
    const selectedLocation = document.querySelector('[p_location-filter]').value.trim();

    let totalVisibleJobs = 0; // Track the total number of visible jobs after filtering

    const allAccordions = document.querySelectorAll('.accordion-item');
    allAccordions.forEach(accordion => {
        let visibleJobs = 0;

        const category = accordion.querySelector('[p_type-of-employment-text]').textContent.trim();
        const jobs = accordion.querySelectorAll('.accordion_list');

        jobs.forEach(job => {
            const jobLocation = job.querySelector('[p_location-filter-text]').textContent.trim();

            if ((selectedType === '' || category.toLowerCase() === selectedType.toLowerCase()) && 
                (selectedLocation === '' || jobLocation.toLowerCase().includes(selectedLocation.toLowerCase()))) {
                job.style.display = '';
                visibleJobs++;
            } else {
                job.style.display = 'none';
            }
        });

        // Update accordion visibility, job counts, and toggle is-open classes based on visibility
        accordion.style.display = visibleJobs > 0 ? '' : 'none';
        const jobCountDiv = accordion.querySelector('.quantity_wrapper div');
        jobCountDiv.textContent = `${visibleJobs} Jobs`;

        // Toggle is-open class based on if jobs are visible or not
        const trigger = accordion.querySelector('.accordion-item-trigger');
        const content = accordion.querySelector('.accordion-item-content');
        const icon = accordion.querySelector('.icon-embed-xsmall');

        if (visibleJobs > 0) {
            // Ensure accordion is marked as open
            if(trigger && !trigger.classList.contains('is-open')) trigger.classList.add('is-open');
            if(content && !content.classList.contains('is-open')) content.classList.add('is-open');
            if(icon && !icon.classList.contains('is-open')) icon.classList.add('is-open');
        } else {
            // Ensure accordion is marked as closed
            if(trigger && trigger.classList.contains('is-open')) trigger.classList.remove('is-open');
            if(content && content.classList.contains('is-open')) content.classList.remove('is-open');
            if(icon && icon.classList.contains('is-open')) icon.classList.remove('is-open');
        }

        totalVisibleJobs += visibleJobs; // Update the total count of visible jobs
    });

    // Display the "No results found" message if there are no visible jobs after filtering
    const noResultsDiv = document.querySelector('.no_reults-found');
    if (totalVisibleJobs === 0) {
        noResultsDiv.style.display = 'block';
    } else {
        noResultsDiv.style.display = 'none';
    }
}



  
  
  document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for both filters
    const typeSelectField = document.querySelector('[p_type-of-employment]');
    const locationSelectField = document.querySelector('[p_location-filter]');
  
    if (typeSelectField && locationSelectField) {
      typeSelectField.addEventListener('change', applyFilters);
      locationSelectField.addEventListener('change', applyFilters);
    }
  
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