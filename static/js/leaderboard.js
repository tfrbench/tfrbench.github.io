// leaderboardData is loaded from data/leaderboardData.js
let currentView = 'overall'; // 'overall', 'domain', 'dataset', 'detailed'
let selectedDomain = 'Energy'; // Default
let selectedDataset = 'Solar Daily'; // Default

function setView(view) {
    currentView = view;
    console.log("Setting view to:", view);
    
    // Toggle active button style
    const views = ['overall', 'domain', 'dataset', 'detailed'];
    views.forEach(v => {
        const btn = document.getElementById(`btn-${v}`);
        if (btn) {
            btn.classList.remove('is-dark', 'is-light', 'is-active-gradient', 'is-white');
            btn.classList.add(v === view ? 'is-active-gradient' : 'is-white');
        }
    });

    // Toggle selectors container visibility
    const selectorsContainer = document.getElementById('selectors-container');
    const domainCtrl = document.getElementById('domain-selector-control');
    const datasetCtrl = document.getElementById('dataset-selector-control');

    if (selectorsContainer) {
        if (view === 'domain' || view === 'dataset') {
            selectorsContainer.style.display = 'flex';
            if (domainCtrl) domainCtrl.style.display = view === 'domain' ? 'block' : 'none';
            if (datasetCtrl) datasetCtrl.style.display = view === 'dataset' ? 'block' : 'none';
        } else {
            selectorsContainer.style.display = 'none';
        }
    }
    
    render();
}

// Define the domain mapping
const domainConfig = {
    "Energy": ["Solar Daily", "Electricity"],
    "Sales": ["Car Parts", "Hierarchical Sales"],
    "Web/CloudOps": ["Bitbrains Fast Storage", "Web Traffic"],
    "Transportation": ["Traffic", "NYC Taxi"],
    "Economics/Finance": ["Amazon Pricing", "Apple Pricing"]
};

function calculateMetricOverall(datasets) {
    const metrics = ['dom', 'fcst', 'evt', 'logic'];
    let totals = { dom: 0, fcst: 0, evt: 0, logic: 0 };
    let count = 0;

    console.log("calculateMetricOverall incoming datasets keys:", Object.keys(datasets));

    for (const ds in datasets) {
        count++;
        metrics.forEach(m => totals[m] += datasets[ds][m]);
    }

    let overall = {};
    metrics.forEach(m => overall[m] = count > 0 ? totals[m] / count : 0);
    console.log("calculated overall:", overall);
    return overall;
}

function calculateAllDynamicOveralls() {
    leaderboardData.forEach(modelData => {
        modelData.reasoning.overall = calculateMetricOverall(modelData.reasoning.datasets);
        modelData.event.overall = calculateMetricOverall(modelData.event.datasets);
    });
}

function populateSelectors() {
    const domainSelect = document.getElementById('domain-select');
    const datasetSelect = document.getElementById('dataset-select');

    if (domainSelect) {
        domainSelect.innerHTML = '';
        Object.keys(domainConfig).forEach(domain => {
            const opt = document.createElement('option');
            opt.value = domain;
            opt.textContent = domain;
            domainSelect.appendChild(opt);
        });
    }

    if (datasetSelect) {
        datasetSelect.innerHTML = '';
        // Extract all datasets from domainConfig
        Object.keys(domainConfig).forEach(domain => {
            domainConfig[domain].forEach(ds => {
                const opt = document.createElement('option');
                opt.value = ds;
                opt.textContent = ds; // Already Title Case in JS keys? Wait, JS keys are Title Case!
                datasetSelect.appendChild(opt);
            });
        });
    }
}

function onFilterChange() {
    const domainSelect = document.getElementById('domain-select');
    const datasetSelect = document.getElementById('dataset-select');

    if (currentView === 'domain' && domainSelect) {
        selectedDomain = domainSelect.value;
    } else if (currentView === 'dataset' && datasetSelect) {
        selectedDataset = datasetSelect.value;
    }

    console.log(`Filter changed: Domain=${selectedDomain}, Dataset=${selectedDataset}`);
    render();
}

function initLeaderboard() {
    calculateAllDynamicOveralls();
    populateSelectors();
    setView('overall');
}

// Calculates floating-point Average Rank across ALL 8 metrics for a specific dataset
function calculateDatasetRanks(ds) {
    let rankSums = {};
    leaderboardData.forEach(d => rankSums[d.model] = 0);
    
    const settings = ['event', 'reasoning'];
    const metrics = ['dom', 'fcst', 'evt', 'logic'];
    let numRankings = 0;

    settings.forEach(setting => {
        metrics.forEach(metric => {
            numRankings++;
            let metricScores = leaderboardData.map(d => {
                return { model: d.model, score: d[setting].datasets[ds][metric] };
            });
            
            // Sort descending by score for this specific metric
            metricScores.sort((a, b) => b.score - a.score);
            
            // Assign ranks (with tie-breaking logic)
            let currentRank = 1;
            for (let i = 0; i < metricScores.length; i++) {
                if (i > 0 && metricScores[i].score === metricScores[i-1].score) {
                    rankSums[metricScores[i].model] += currentRank; 
                } else {
                    currentRank = i + 1;
                    rankSums[metricScores[i].model] += currentRank;
                }
            }
        });
    });

    // Compute the final average rank (divided by 8 metrics total)
    let averageRanks = {};
    for (let model in rankSums) {
        averageRanks[model] = rankSums[model] / numRankings;
    }
    return averageRanks;
}

function getProcessedDatasetData(ds) {
    let avgRanks = calculateDatasetRanks(ds);
    
    let data = leaderboardData.map(d => {
        let e = d.event.datasets[ds];
        let r = d.reasoning.datasets[ds];
        
        return {
            model: d.model, 
            link: d.link, 
            avgRank: avgRanks[d.model],
            event: {
                dom: e.dom, fcst: e.fcst, evt: e.evt, logic: e.logic
            },
            reasoning: {
                dom: r.dom, fcst: r.fcst, evt: r.evt, logic: r.logic
            }
        };
    });
    
    // Sort by the newly calculated floating-point Average Rank (ascending)
    data.sort((a, b) => a.avgRank - b.avgRank);
    return data;
}

// Helper to capitalize first letter of each word
function titleCase(str) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Calculates Average Rank across ALL 8 metrics for the OVERALL view
function calculateOverallRanks() {
    let rankSums = {};
    leaderboardData.forEach(d => rankSums[d.model] = 0);
    
    const settings = ['event', 'reasoning'];
    const metrics = ['dom', 'fcst', 'evt', 'logic'];
    let numRankings = 0;

    settings.forEach(setting => {
        metrics.forEach(metric => {
            numRankings++;
            let metricScores = leaderboardData.map(d => {
                return { model: d.model, score: d[setting].overall[metric] };
            });
            
            metricScores.sort((a, b) => b.score - a.score);
            
            let currentRank = 1;
            for (let i = 0; i < metricScores.length; i++) {
                if (i > 0 && metricScores[i].score === metricScores[i-1].score) {
                    rankSums[metricScores[i].model] += currentRank; 
                } else {
                    currentRank = i + 1;
                    rankSums[metricScores[i].model] += currentRank;
                }
            }
        });
    });

    let averageRanks = {};
    for (let model in rankSums) {
        averageRanks[model] = rankSums[model] / numRankings;
    }
    return averageRanks;
}

function getProcessedOverallData() {
    let avgRanks = calculateOverallRanks();
    
    let data = leaderboardData.map(d => {
        return {
            model: d.model, 
            link: d.link, 
            avgRank: avgRanks[d.model],
            event: d.event.overall,
            reasoning: d.reasoning.overall
        };
    });
    
    data.sort((a, b) => a.avgRank - b.avgRank);
    return data;
}

function getProcessedDomainData() {
    // 1. Calculate domain-specific overall for each model
    let domainData = leaderboardData.map(d => {
        let domainDatasetsReasoning = {};
        let domainDatasetsEvent = {};
        
        domainConfig[selectedDomain].forEach(ds => {
            domainDatasetsReasoning[ds] = d.reasoning.datasets[ds];
            domainDatasetsEvent[ds] = d.event.datasets[ds];
        });

        return {
            model: d.model,
            link: d.link,
            event: calculateMetricOverall(domainDatasetsEvent),
            reasoning: calculateMetricOverall(domainDatasetsReasoning)
        };
    });

    // 2. Rank models based on these domain-specific overalls
    // We can reuse calculateOverallRanks logic if we make it accept data
    let avgRanks = calculateRanksForData(domainData); 
    
    domainData.forEach(d => {
        d.avgRank = avgRanks[d.model];
    });

    domainData.sort((a, b) => a.avgRank - b.avgRank);
    return domainData;
}

// Generic rank calculator for aggregated data structure [{model, event: {dom...}, reasoning: {dom...}}]
function calculateRanksForData(data) {
    let rankSums = {};
    data.forEach(d => rankSums[d.model] = 0);
    
    const settings = ['event', 'reasoning'];
    const metrics = ['dom', 'fcst', 'evt', 'logic'];
    let numRankings = 0;

    settings.forEach(setting => {
        metrics.forEach(metric => {
            numRankings++;
            let metricScores = data.map(d => {
                return { model: d.model, score: d[setting][metric] };
            });
            
            metricScores.sort((a, b) => b.score - a.score);
            
            let currentRank = 1;
            for (let i = 0; i < metricScores.length; i++) {
                if (i > 0 && metricScores[i].score === metricScores[i-1].score) {
                    rankSums[metricScores[i].model] += currentRank; 
                } else {
                    currentRank = i + 1;
                    rankSums[metricScores[i].model] += currentRank;
                }
            }
        });
    });

    let averageRanks = {};
    for (let model in rankSums) {
        averageRanks[model] = rankSums[model] / numRankings;
    }
    return averageRanks;
}


function getProcessedSingleDatasetData() {
    let data = leaderboardData.map(d => {
        return {
            model: d.model,
            link: d.link,
            event: d.event.datasets[selectedDataset],
            reasoning: d.reasoning.datasets[selectedDataset]
        };
    });

    let avgRanks = calculateDatasetRanks(selectedDataset);
    
    data.forEach(d => {
        d.avgRank = avgRanks[d.model];
    });

    data.sort((a, b) => a.avgRank - b.avgRank);
    return data;
}

function render() {
    if (currentView === 'overall') {
        renderAggregatedTable(getProcessedOverallData(), "Overall Ranking (All Datasets)");
    } else if (currentView === 'domain') {
        renderAggregatedTable(getProcessedDomainData(), `Domain Ranking: ${selectedDomain}`);
    } else if (currentView === 'dataset') {
        renderAggregatedTable(getProcessedSingleDatasetData(), `Dataset Ranking: ${selectedDataset}`);
    } else {
        renderTable(); // Original detailed
    }
}

function renderAggregatedTable(data, tableTitle) {
    const container = document.getElementById('leaderboard-tables-container');
    container.innerHTML = ''; 

    const table = document.createElement('table');
    table.className = 'table is-striped is-hoverable is-fullwidth';
    table.style.marginBottom = '0';
    table.style.width = '100%'; 

    let caption = `<caption style="font-weight: bold; font-size: 1.25rem; padding: 10px; color: #363636; text-align: center;">${tableTitle}</caption>`;

    let thead = `
        <thead>
            <tr style="background-color: #f4f4f4;">
                <th rowspan="2" class="has-text-centered is-vcentered" style="width: 80px; white-space: nowrap;">Average Rank</th>
                <th rowspan="2" class="has-text-left is-vcentered" style="border-right: 2px solid #dbdbdb; white-space: nowrap;">Model</th>
                
                <th colspan="4" class="has-text-centered is-vcentered" style="background-color: rgba(50, 0, 0, 0.05); border-right: 2px solid #dbdbdb;">Event Forecast + Reasoning</th>
                <th colspan="4" class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.05);">w/ Reasoning Only</th>
            </tr>
            <tr style="background-color: #fafafa;">
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Domain<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Forecast<br>Correctness</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Event<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); border-right: 2px solid #dbdbdb; white-space: nowrap;">Logic<br>Consistency</th>
                
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Domain<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Forecast<br>Correctness</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Event<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Logic<br>Consistency</th>
            </tr>
        </thead>
    `;

    let tbody = `<tbody>`;

    data.forEach((row, modelIdx) => {
        const rankDisplay = row.avgRank.toFixed(2);
        const modelDisplay = row.link && row.link !== "#" ? 
            `<a href="${row.link}" target="_blank" style="color: #3273dc; font-weight: 500;">${row.model}</a>` : 
            `<strong>${row.model}</strong>`;

        tbody += `<tr>
            <td class="has-text-centered is-vcentered" style="white-space: nowrap;"><strong>${rankDisplay}</strong></td>
            <td class="has-text-left is-vcentered" style="border-right: 2px solid #dbdbdb; white-space: nowrap;">${modelDisplay}</td>
            
            <td class="has-text-centered is-vcentered">${row.event.dom.toFixed(2)}</td>
            <td class="has-text-centered is-vcentered">${row.event.fcst.toFixed(2)}</td>
            <td class="has-text-centered is-vcentered">${row.event.evt.toFixed(2)}</td>
            <td class="has-text-centered is-vcentered" style="border-right: 2px solid #dbdbdb;">${row.event.logic.toFixed(2)}</td>

            <td class="has-text-centered is-vcentered">${row.reasoning.dom.toFixed(2)}</td>
            <td class="has-text-centered is-vcentered">${row.reasoning.fcst.toFixed(2)}</td>
            <td class="has-text-centered is-vcentered">${row.reasoning.evt.toFixed(2)}</td>
            <td class="has-text-centered is-vcentered">${row.reasoning.logic.toFixed(2)}</td>
        </tr>`;
    });

    tbody += `</tbody>`;
    table.innerHTML = caption + thead + tbody;
    container.appendChild(table);
}

function renderTable() {
    const container = document.getElementById('leaderboard-tables-container');
    container.innerHTML = ''; 

    const table = document.createElement('table');
    table.className = 'table is-striped is-hoverable is-fullwidth';
    table.style.marginBottom = '0';
    table.style.width = '100%'; 

    let thead = `
        <thead>
            <tr style="background-color: #f4f4f4;">
                <th rowspan="2" class="has-text-centered is-vcentered" style="width: 60px;">Domain</th>
                <th rowspan="2" class="has-text-centered is-vcentered" style="width: 60px;">Dataset</th>
                <th rowspan="2" class="has-text-centered is-vcentered" style="width: 80px; white-space: nowrap;">Average Rank</th>
                <th rowspan="2" class="has-text-left is-vcentered" style="border-right: 2px solid #dbdbdb; white-space: nowrap;">Model</th>
                
                <th colspan="4" class="has-text-centered is-vcentered" style="background-color: rgba(50, 0, 0, 0.05); border-right: 2px solid #dbdbdb;">Event Forecast + Reasoning</th>
                <th colspan="4" class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.05);">w/ Reasoning Only</th>
            </tr>
            <tr style="background-color: #fafafa;">
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Domain<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Forecast<br>Correctness</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Event<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); border-right: 2px solid #dbdbdb; white-space: nowrap;">Logic<br>Consistency</th>
                
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Domain<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Forecast<br>Correctness</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Event<br>Relevance</th>
                <th class="has-text-centered is-vcentered" style="background-color: rgba(0, 0, 0, 0.02); white-space: nowrap;">Logic<br>Consistency</th>
            </tr>
        </thead>
    `;

    let tbody = `<tbody>`;
    const numModels = leaderboardData.length;

    // Render by Domain, then by Dataset
    Object.keys(domainConfig).forEach((domain, domainIdx) => {
        const datasetsInDomain = domainConfig[domain];
        const domainRowSpan = datasetsInDomain.length * numModels;

        datasetsInDomain.forEach((ds, dsIdx) => {
            let dsData = getProcessedDatasetData(ds);
            let dsTitle = titleCase(ds);
            
            dsData.forEach((row, modelIdx) => {
                const rankDisplay = row.avgRank.toFixed(2);
                const modelDisplay = row.link && row.link !== "#" ? 
                    `<a href="${row.link}" target="_blank" style="color: #3273dc; font-weight: 500;">${row.model}</a>` : 
                    `<strong>${row.model}</strong>`;

                let rowStyle = '';
                if (modelIdx === 0) {
                    if (dsIdx === 0 && domainIdx !== 0) {
                        rowStyle = 'border-top: 3px solid #b5b5b5;'; // New Domain
                    } else if (dsIdx !== 0) {
                        rowStyle = 'border-top: 2px solid #dbdbdb;'; // New Dataset within same Domain
                    }
                }

                tbody += `<tr style="${rowStyle}">`;
                
                if (dsIdx === 0 && modelIdx === 0) {
                    tbody += `<td rowspan="${domainRowSpan}" class="has-text-centered is-vcentered" style="writing-mode: vertical-rl; transform: rotate(180deg); background-color: #f0f0f0; font-weight: bold; letter-spacing: 1px; width: 60px;">${domain}</td>`;
                }

                if (modelIdx === 0) {
                    tbody += `<td rowspan="${numModels}" class="has-text-centered is-vcentered" style="writing-mode: vertical-rl; transform: rotate(180deg); background-color: #fbfbfb; font-weight: 600; letter-spacing: 1px; width: 60px;">${dsTitle}</td>`;
                }

                tbody += `
                    <td class="has-text-centered is-vcentered" style="white-space: nowrap;"><strong>${rankDisplay}</strong></td>
                    <td class="has-text-left is-vcentered" style="border-right: 2px solid #dbdbdb; white-space: nowrap;">${modelDisplay}</td>
                    
                    <td class="has-text-centered is-vcentered">${row.event.dom.toFixed(2)}</td>
                    <td class="has-text-centered is-vcentered">${row.event.fcst.toFixed(2)}</td>
                    <td class="has-text-centered is-vcentered">${row.event.evt.toFixed(2)}</td>
                    <td class="has-text-centered is-vcentered" style="border-right: 2px solid #dbdbdb;">${row.event.logic.toFixed(2)}</td>

                    <td class="has-text-centered is-vcentered">${row.reasoning.dom.toFixed(2)}</td>
                    <td class="has-text-centered is-vcentered">${row.reasoning.fcst.toFixed(2)}</td>
                    <td class="has-text-centered is-vcentered">${row.reasoning.evt.toFixed(2)}</td>
                    <td class="has-text-centered is-vcentered">${row.reasoning.logic.toFixed(2)}</td>
                </tr>`;
            });
        });
    });

    tbody += `</tbody>`;
    table.innerHTML = thead + tbody;
    container.appendChild(table);
}