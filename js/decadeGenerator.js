/**
 * Generates decade codes for a given date range
 * @param {Date} startDate - Start date for decade generation
 * @param {Date} endDate - End date for decade generation
 * @returns {Array} Array of decade objects with code and label
 */
function generateDecadeCodes(startDate = new Date(), endDate = null) {
    // If no end date is provided, default to the end of the current month
    if (!endDate) {
        const now = new Date();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const decades = [];
    const currentDate = new Date(startDate);
    
    // Set to the first day of the start month
    currentDate.setDate(1);
    
    // Generate decades for each month in the range
    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Months are 0-indexed
        
        // Generate 3 decades per month
        for (let d = 1; d <= 3; d++) {
            const startDay = (d - 1) * 10 + 1;
            let endDay;
            
            // Handle the last decade which might be shorter
            if (d === 3) {
                // Last day of the month
                const lastDay = new Date(year, month, 0).getDate();
                endDay = lastDay;
            } else {
                endDay = d * 10;
            }
            
            // Format the decade code as D + M + YYYY (D=decade, M=month, YYYY=year)
            // Example: Primera decena de Mayo 2025 = 1 + 5 + 2025 = 152025
            const decadeCode = `${d}${month}${year}`;
            
            // Create a human-readable label
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const decadeNames = ['Primera', 'Segunda', 'Tercera'];
            const label = `${decadeNames[d-1]} Decena de ${monthNames[month - 1]} ${year} (${startDay}-${endDay})`;
            
            decades.push({
                code: decadeCode,
                label: label,
                startDate: new Date(year, month - 1, startDay),
                endDate: new Date(year, month - 1, endDay)
            });
        }
        
        // Move to the first day of the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return decades;
}

/**
 * Gets the current decade based on today's date
 * @returns {Object} Current decade object or null if not found
 */
function getCurrentDecade() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();
    
    // Determine which decade the current day falls into (1, 2, or 3)
    let decade;
    if (currentDay <= 10) {
        decade = 1;
    } else if (currentDay <= 20) {
        decade = 2;
    } else {
        decade = 3;
    }
    
    // Format the decade code
    const decadeCode = `${decade}${currentMonth}${currentYear}`;
    
    // Generate all decades for the current month and find the matching one
    const currentMonthDecades = generateDecadeCodes(
        new Date(currentYear, currentMonth - 1, 1),
        new Date(currentYear, currentMonth, 0)
    );
    
    return currentMonthDecades.find(d => d.code === decadeCode) || null;
}

/**
 * Populates a select element with decade options
 * @param {string} selectId - ID of the select element
 * @param {Date} startDate - Start date for decades
 * @param {Date} endDate - End date for decades
 * @param {boolean} includeCurrent - Whether to include the current decade
 */
function populateDecadeSelect(selectId, startDate, endDate, includeCurrent = true) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
        console.error(`Element with ID '${selectId}' not found`);
        return;
    }
    
    // Clear existing options except the first one (usually the default/placeholder)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    // Generate decades
    const decades = generateDecadeCodes(startDate, endDate);
    
    // Add decades to the select
    decades.forEach(decade => {
        const option = document.createElement('option');
        option.value = decade.code;
        option.textContent = decade.label;
        selectElement.appendChild(option);
    });
    
    // If includeCurrent is true, select the current decade
    if (includeCurrent) {
        const currentDecade = getCurrentDecade();
        if (currentDecade) {
            selectElement.value = currentDecade.code;
        }
    }
}

// Example usage and testing:
console.log("=== EJEMPLOS DE CÓDIGOS DE DECENAS ===");

// Generate decades from May to June 2025
const startDate = new Date(2025, 4, 1); // May 1, 2025 (months are 0-indexed)
const endDate = new Date(2025, 5, 30); // June 30, 2025
const decades = generateDecadeCodes(startDate, endDate);

console.log("Decenas de Mayo y Junio 2025:");
decades.forEach(decade => {
    console.log(`Código: ${decade.code} - ${decade.label}`);
});

console.log("\n=== DECENA ACTUAL ===");
const currentDecade = getCurrentDecade();
if (currentDecade) {
    console.log(`Código actual: ${currentDecade.code} - ${currentDecade.label}`);
} else {
    console.log("No se pudo determinar la decena actual");
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateDecadeCodes,
        getCurrentDecade,
        populateDecadeSelect
    };
}