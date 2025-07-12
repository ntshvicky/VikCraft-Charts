document.addEventListener('DOMContentLoaded', () => {

    // --- Bar Charts ---
    const simpleBarData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{ label: 'Sales', data: [30, 45, 62, 25, 55] }]
    };
    new VikCraft(document.getElementById('barChart'), {
        type: 'bar',
        data: simpleBarData,
        options: {
            colors: ['#2a9d8f'],
            dataLabels: { show: true, color: '#c94040' },
            
            // --- ADD THIS onClick HANDLER ---
            onClick: (data) => {
                alert(`You clicked on dataset "${data.datasetLabel}", label "${data.label}", which has a value of ${data.value}.`);
                console.log('Click Event Data:', data);
            }
        }
    });

    const stackedBarData = {
        labels: ['Product A', 'Product B', 'Product C'],
        datasets: [
            { label: 'Online', data: [20, 30, 45] },
            { label: 'In-Store', data: [25, 20, 30] },
            { label: 'Wholesale', data: [10, 15, 12] }
        ]
    };
    new VikCraft(document.getElementById('stackedBarChart'), {
        type: 'stackedBar',
        data: stackedBarData,
        options: {
            colors: ['#4bc0c0', '#ffcd56', '#ff6384'],
            legend: { show: true } // Interactive legend enabled
        }
    });

    const multiSeriesBarData = {
        labels: ['2023', '2024', '2025'],
        datasets: [
            { label: 'Laptops', data: [300, 400, 350] },
            { label: 'Desktops', data: [250, 300, 280] },
            { label: 'Tablets', data: [450, 500, 600] }
        ]
    };
    new VikCraft(document.getElementById('multiSeriesBarChart'), {
        type: 'multiSeriesBar',
        data: multiSeriesBarData,
        options: {
            colors: ['#264653', '#2a9d8f', '#e9c46a'],
            legend: { show: true } // Interactive legend enabled
        }
    });

    new VikCraft(document.getElementById('stackedBar100Chart'), {
        type: 'stackedBar100',
        data: stackedBarData,
        options: {
            colors: ['#4bc0c0', '#ffcd56', '#ff6384'],
            legend: { show: true } // Interactive legend enabled
        }
    });


    // 1. The child data now needs a 'type' property
    const weeklyDataForJan = {
        type: 'bar', // The child chart is also a 'bar' chart
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ label: 'Weekly Sales for Jan', data: [20, 30, 15, 35] }]
        }
    };

    const weeklyDataForFeb = {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ label: 'Weekly Sales for Feb', data: [40, 45, 30, 35] }]
        }
    };

    // 2. The parent data structure remains the same
    const monthlySalesData = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
            label: 'Monthly Sales',
            data: [
                { value: 100, children: weeklyDataForJan },
                { value: 150, children: weeklyDataForFeb },
                { value: 120 }
            ]
        }]
    };

    // 3. Create the chart instance, updating the onClick handler
    const drilldownChart = new VikCraft(document.getElementById('drilldownChartContainer'), {
        type: 'bar',
        data: monthlySalesData,
        options: {
            colors: ['#5a189a'],
            
            onClick: function(data) {
                // `this` refers to the VikCraft instance
                if (data.children) {
                    // Use the new navigateTo() method instead of drillDown()
                    this.navigateTo(data.children);
                } else {
                    alert(`You clicked ${data.label}, but it has no further data.`);
                }
            }
        }
    });


    // --- Horizontal Bar Charts ---
    new VikCraft(document.getElementById('horizontalBarChart'), {
        type: 'bar',
        data: simpleBarData,
        options: {
            orient: 'horizontal', // The new option
            colors: ['#023e8a']
        }
    });

    new VikCraft(document.getElementById('horizontalStackedBarChart'), {
        type: 'stackedBar',
        data: stackedBarData,
        options: {
            orient: 'horizontal',
            colors: ['#4cc9f0', '#4895ef', '#4361ee']
        }
    });

    new VikCraft(document.getElementById('horizontalGroupedBarChart'), {
        type: 'multiSeriesBar',
        data: multiSeriesBarData,
        options: {
            orient: 'horizontal',
            colors: ['#f72585', '#7209b7', '#3a0ca3']
        }
    });

    // --- Line Charts ---
    const simpleLineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ label: 'Stock Price', data: [10, 25, 22, 40, 35] }]
    };
    new VikCraft(document.getElementById('lineChart'), {
        type: 'line',
        data: simpleLineData,
        options: { colors: ['#ff6384'] }
    });

    const multiSeriesLineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [
            { label: 'Product A', data: [12, 19, 10, 25] },
            { label: 'Product B', data: [8, 12, 20, 15] }
        ]
    };
    new VikCraft(document.getElementById('multiSeriesLineChart'), {
        type: 'multiSeriesLine',
        data: multiSeriesLineData,
        options: {
            colors: ['#36a2eb', '#4bc0c0'],
            legend: { show: true } // Interactive legend enabled
        }
    });

    new VikCraft(document.getElementById('dashedLineChart'), {
        type: 'line',
        data: {
            labels: multiSeriesLineData.labels,
            datasets: [multiSeriesLineData.datasets[0]]
        },
        options: { colors: ['#9b59b6'], lineStyle: 'dashed' }
    });
    
    const areaData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ label: 'Page Views', data: [30, 45, 40, 60, 75] }]
    };
    new VikCraft(document.getElementById('splineChart'), {
        type: 'line',
        data: areaData,
        options: { colors: ['#e67e22'], lineStyle: 'spline' }
    });

    // --- Combo Chart ---
    const comboData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
            {
                type: 'bar', // Type is now defined per-dataset
                label: 'Sales (Units)',
                data: [450, 580, 710, 800]
            },
            {
                type: 'line', // This dataset will be rendered as a line
                label: 'Profit Margin (%)',
                data: [12, 15, 11, 14]
            }
        ]
    };
    new VikCraft(document.getElementById('comboChart'), {
        type: 'combo', // The main type is 'combo'
        data: comboData,
        options: {
            colors: ['#4bc0c0', '#ef5350'], // Color for bars, color for line
            legend: { show: true }
        }
    });

    // --- Pie & Doughnut Charts ---
    const pieData = {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{ data: [55, 35, 10] }] // No labels in dataset needed if in main labels
    };
    new VikCraft(document.getElementById('pieChart'), {
        type: 'pie',
        data: pieData,
        options: {
            colors: ['#36a2eb', '#ffcd56', '#ff6384'],
            legend: { show: true } // Legend for pie is enabled
        }
    });

    const doughnutData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{ data: [40, 20, 30, 10] }]
    };
    new VikCraft(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: doughnutData,
        options: {
            isDoughnut: true, cutoutPercentage: 0.6,
            colors: ['#4bc0c0', '#9966ff', '#f9c74f', '#f94144'],
            legend: { show: true } // Legend for doughnut is enabled
        }
    });

    // --- Area Charts ---
    new VikCraft(document.getElementById('areaChart'), {
        type: 'area',
        data: areaData,
        options: { colors: ['rgba(75, 192, 192, 0.5)'] }
    });

    const stackedAreaData = {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [
            { label: 'Marketing', data: [10, 20, 30, 25] },
            { label: 'Sales', data: [15, 25, 35, 45] },
            { label: 'Development', data: [5, 15, 20, 25] }
        ]
    };
    new VikCraft(document.getElementById('stackedAreaChart'), {
        type: 'stackedArea',
        data: stackedAreaData,
        options: {
            colors: ['#84a98c', '#52796f', '#354f52'],
            legend: { show: true } // Interactive legend enabled
        }
    });

    new VikCraft(document.getElementById('stackedArea100Chart'), {
        type: 'stackedArea100', // Use the new type
        data: stackedAreaData,
        options: {
            colors: ['#84a98c', '#52796f', '#354f52'],
            legend: { show: true }
        }
    });


    // 10. Funnel Chart
    const funnelData = {
        labels: ['Website Visits', 'Downloads', 'Free Trials', 'Subscriptions'],
        datasets: [{ data: [10000, 4500, 1500, 500] }]
    };
    new VikCraft(document.getElementById('funnelChart'), {
        type: 'funnel',
        data: funnelData,
        options: {
            colors: ['#0077b6', '#0096c7', '#00b4d8', '#48cae4']
        }
    });

    // 11. Pyramid Chart
    const pyramidData = {
        labels: ['CEO', 'VPs', 'Directors', 'Managers', 'Employees'],
        datasets: [{ data: [1, 5, 20, 80, 400] }] // Data is smallest to largest
    };
    new VikCraft(document.getElementById('pyramidChart'), {
        type: 'funnel', // We can reuse the funnel chart logic
        data: pyramidData,
        options: {
            colors: ['#c1121f', '#d8572a', '#e98a38', '#f3b54f', '#faf0ca'],
            labelColor: '#000'
        }
    });

    // 12. Candlestick Chart
    const candlestickData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ 
            data: [
                { o: 100, h: 105, l: 98, c: 102 }, // Open, High, Low, Close
                { o: 102, h: 108, l: 101, c: 107 },
                { o: 107, h: 109, l: 100, c: 101 },
                { o: 101, h: 104, l: 99,  c: 103 },
                { o: 103, h: 112, l: 103, c: 110 },
            ]
        }]
    };
    new VikCraft(document.getElementById('candlestickChart'), {
        type: 'candlestick',
        data: candlestickData,
        options: {
            upColor: '#26a69a',   // Color for price increase
            downColor: '#ef5350' // Color for price decrease
        }
    });

    // 13. Scatter Chart
    const scatterData = {
        datasets: [{
            data: [
                { x: 10, y: 20 }, { x: 15, y: 35 }, { x: 25, y: 30 },
                { x: 30, y: 45 }, { x: 42, y: 40 }, { x: 50, y: 60 }
            ]
        }]
    };
    new VikCraft(document.getElementById('scatterChart'), {
        type: 'scatter',
        data: scatterData,
        options: {
            colors: ['#36a2eb']
        }
    });

    // 14. Bubble Chart
    const bubbleData = {
        datasets: [{
            data: [
                { x: 10, y: 30, r: 15 }, // x, y, radius
                { x: 20, y: 55, r: 25 },
                { x: 35, y: 40, r: 30 },
                { x: 50, y: 25, r: 10 },
                { x: 60, y: 70, r: 40 },
            ]
        }]
    };
    new VikCraft(document.getElementById('bubbleChart'), {
        type: 'bubble',
        data: bubbleData,
        options: {
            colors: ['rgba(255, 159, 64, 0.7)'],
            maxRadius: 40 // The pixel size of the largest bubble
        }
    });

    // 15. Waterfall Chart
    const waterfallData = {
        labels: ['Revenue', 'Cogs', 'Marketing', 'Profit', 'Taxes', 'Net'],
        datasets: [{
            data: [100, -30, -20, 50, -15, 35]
        }]
    };
    new VikCraft(document.getElementById('waterfallChart'), {
        type: 'waterfall',
        data: waterfallData,
        options: {
            upColor: '#26a69a',
            downColor: '#ef5350',
            totalColor: '#5880b9'
        }
    });

    // 16. Box and Whisker Chart
    const boxAndWhiskerData = {
        labels: ['Group A', 'Group B'],
        datasets: [{
            data: [
                { min: 10, q1: 25, median: 50, q3: 75, max: 90 },
                { min: 20, q1: 40, median: 60, q3: 80, max: 100 }
            ]
        }]
    };
    new VikCraft(document.getElementById('boxAndWhiskerChart'), {
        type: 'boxAndWhisker',
        data: boxAndWhiskerData,
        options: {
            colors: ['rgba(255, 159, 64, 0.6)']
        }
    });


    // --- Simple Radar Chart ---
    const radarData = {
        labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'],
        datasets: [{
            label: 'Car A',
            data: [90, 80, 65, 85, 70]
        }]
    };
    new VikCraft(document.getElementById('radarChart'), {
        type: 'radar',
        data: radarData,
        options: {
            colors: ['#2a9d8f'],
            legend: { show: true }
        }
    });


    // --- Filled Multi-Series Radar Chart ---
    const filledRadarData = {
        labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'],
        datasets: [{
                label: 'Person A',
                data: [65, 59, 90, 81, 56, 55, 40]
            },
            {
                label: 'Person B',
                data: [28, 48, 40, 19, 96, 27, 100]
            }
        ]
    };
    new VikCraft(document.getElementById('filledRadarChart'), {
        type: 'radar',
        data: filledRadarData,
        options: {
            fill: true, // This option enables the filled area
            colors: ['#e76f51', '#457b9d'],
            legend: { show: true }
        }
    });


    // --- OHLC Chart ---
    new VikCraft(document.getElementById('ohlcChart'), {
        type: 'ohlc', // Use the new type
        data: candlestickData, // We can reuse the same data
        options: {
            upColor: '#26a69a',
            downColor: '#ef5350'
        }
    });

    // --- Nightingale Rose Chart ---
    const nightingaleData = {
        labels: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E', 'Category F'],
        datasets: [
            {
                label: '2024',
                data: [10, 40, 25, 60, 35, 80]
            },
            {
                label: '2025',
                data: [20, 30, 45, 50, 55, 70]
            }
        ]
    };

    new VikCraft(document.getElementById('nightingaleChart'), {
        type: 'nightingale',
        data: nightingaleData,
        options: {
            colors: ['#4361ee', '#f72585'],
            legend: { show: true, position: 'right' },
            onClick: (data) => {
                console.log('Nightingale slice clicked:', data);
            }
        }
    });

    // --- Thermometer Chart ---
    const thermometerData = {
        // Labels are not used but the structure is maintained
        labels: ['Temperature'], 
        datasets: [{
            // Data is an array with a single object
            data: [{ value: 37.2, min: 34, max: 42 }] 
        }]
    };

    new VikCraft(document.getElementById('thermometerChart'), {
        type: 'thermometer',
        data: thermometerData,
        options: {
            colors: ['#d90429'], // Color of the liquid
            onClick: (data) => {
                alert(`Current temperature is: ${data.value}°C`);
            }
        }
    });

    // --- Linear Gauge Data ---
    const gaugeData = {
        labels: ['Progress'], 
        datasets: [{
            data: [{ value: 76, min: 0, max: 100 }] 
        }]
    };

    // --- Vertical Gauge ---
    new VikCraft(document.getElementById('verticalGaugeChart'), {
        type: 'linearGauge',
        data: gaugeData,
        options: {
            orient: 'vertical', // Specify orientation
            colors: ['#00b4d8']
        }
    });

    // --- Horizontal Gauge ---
    new VikCraft(document.getElementById('horizontalGaugeChart'), {
        type: 'linearGauge',
        data: gaugeData,
        options: {
            orient: 'horizontal', // Specify orientation
            colors: ['#f77f00']
        }
    });

    // --- Radial Gauge Chart ---
    const radialGaugeData = {
        labels: ['Speed'], 
        datasets: [{
            data: [{ value: 68, min: 0, max: 100 }] 
        }]
    };

    new VikCraft(document.getElementById('radialGaugeChart'), {
        type: 'radialGauge',
        data: radialGaugeData,
        options: {
            colors: ['#0077b6'],
            onClick: (data) => {
                alert(`Current gauge value is: ${data.value}`);
            }
        }
    });

    // --- Heatmap Chart ---
    const heatmapData = {
        xLabels: ['10am', '11am', '12pm', '1pm', '2pm', '3pm'],
        yLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
            { label: 'Mon', data: [10, 30, 45, 20, 15, 33] }, // Data for Monday
            { label: 'Tue', data: [12, 40, 42, 18, 25, 30] }, // Data for Tuesday
            { label: 'Wed', data: [5, 22, 50, 25, 20, 28] },  // etc.
            { label: 'Thu', data: [18, 33, 40, 15, 30, 45] },
            { label: 'Fri', data: [25, 20, 15, 10, 35, 50] }
        ]
    };

    new VikCraft(document.getElementById('heatmapChart'), {
        type: 'heatmap',
        data: heatmapData,
        options: {
            // A color scale from light yellow to dark red
            colorScale: ['#fffbe0', '#c40c0c'],
            legend: { show: true }, // This will show the color scale legend
            onClick: (data) => {
                alert(`Activity for ${data.yLabel} at ${data.xLabel} was ${data.value}`);
            }
        }
    });


    // --- Mixed Box Plot Chart ---
    const mixedBoxPlotData = {
        labels: ['Control Group', 'Test Group'],
        datasets: [{
            label: 'Response Times (ms)',
            data: [
                {
                    // Data for Control Group
                    box: { min: 42, q1: 55, median: 62, q3: 71, max: 85 },
                    outliers: [35, 95, 98]
                },
                {
                    // Data for Test Group
                    box: { min: 35, q1: 48, median: 55, q3: 64, max: 78 },
                    outliers: [22, 85, 91]
                }
            ]
        }]
    };

    new VikCraft(document.getElementById('mixedBoxPlotChart'), {
        type: 'mixedBoxPlot',
        data: mixedBoxPlotData,
        options: {
            // Provide an array of colors, one for each box
            colors: ['rgba(0, 119, 182, 0.6)', 'rgba(2, 62, 138, 0.6)'],
            outlierColor: 'rgba(217, 4, 41, 0.8)',
            onClick: (data) => {
                console.log('Box plot element clicked:', data);
            }
        }
    });

    // --- Hollow Candlestick Chart ---
    new VikCraft(document.getElementById('hollowCandlestickChart'), {
        type: 'hollowCandlestick', // Use the new type
        data: candlestickData, // We can reuse the same data
        options: {
            upColor: '#26a69a',
            downColor: '#ef5350'
        }
    });

    // --- Grouped Radial Bar Chart ---
    const radialBarData = {
        labels: ['Laptops', 'Desktops', 'Tablets', 'Phones', 'Monitors'],
        datasets: [
            {
                label: 'Stock',
                data: [80, 95, 60, 85, 75]
            },
            {
                label: 'Sold',
                data: [70, 65, 45, 80, 50]
            }
        ]
    };

    new VikCraft(document.getElementById('radialBarChart'), {
        type: 'radialBar',
        data: radialBarData,
        options: {
            colors: ['#00b4d8', '#fca311'],
            legend: { show: true, position: 'bottom' },
            onClick: (data) => {
                alert(`${data.datasetLabel} for ${data.label}: ${data.value}`);
            }
        }
    });

    // --- Treemap Chart ---
    const treemapData = {
        // Treemap data is a single root object
        root: {
            name: 'Global Sales',
            value: 1000, // Total value, usually sum of children
            children: [
                { 
                    name: 'North America', value: 400,
                    children: [
                        { name: 'USA', value: 250 },
                        { name: 'Canada', value: 150 }
                    ]
                },
                { 
                    name: 'Europe', value: 350,
                    children: [
                        { name: 'Germany', value: 120 },
                        { name: 'France', value: 100 },
                        { name: 'UK', value: 130 }
                    ]
                },
                { name: 'Asia', value: 250 } // No children
            ]
        }
    };

    new VikCraft(document.getElementById('treemapChart'), {
        type: 'treemap',
        data: treemapData,
        options: {
            // Color scale will be used to color nodes from low to high value
            colorScale: ['#ade8f4', '#0077b6'],
            labelColor: '#fff',
            onClick: (data) => {
                alert(`Clicked on ${data.name} with value ${data.value}`);
            }
        }
    });

    // --- Sunburst Chart ---
    // We can reuse the same hierarchical data from the Treemap
    new VikCraft(document.getElementById('sunburstChart'), {
        type: 'sunburst',
        data: { root: treemapData.root }, // Ensure data is nested under a 'root' property
        options: {
            // Define base colors for the first-level categories
            colors: ['#00b4d8', '#ef476f', '#ffc43d'],
            onClick: (data) => {
                alert(`You clicked on the ${data.name} segment.`);
            }
        }
    });

    // --- Organization Chart ---
    const orgData = {
        // The data is a single root object
        root: {
            name: 'CEO', title: 'Chief Executive Officer',
            children: [
                { 
                    name: 'CTO', title: 'Technology',
                    children: [
                        { name: 'VP of Engineering', title: 'Engineering' },
                        { name: 'VP of Product', title: 'Product' }
                    ]
                },
                { 
                    name: 'CFO', title: 'Finance',
                    children: [
                        { name: 'Director of Accounting', title: 'Accounting' }
                    ]
                },
                { name: 'COO', title: 'Operations' }
            ]
        }
    };

    new VikCraft(document.getElementById('orgChartContainer'), {
        type: 'org',
        data: orgData,
        options: {
            colors: ['#1d3557'], // A base color for the nodes
            onClick: (data) => {
                alert(`You clicked on ${data.name} (${data.title || ''})`);
            }
        }
    });

    // --- Flow Chart ---
    const flowData = {
        root: {
            name: 'Start', shape: 'terminator', color: '#2a9d8f',
            children: [
                { 
                    name: 'Is data valid?', shape: 'decision', color: '#f77f00',
                    children: [
                        { 
                            name: 'Process Data', shape: 'process', linkLabel: 'Yes', color: '#0077b6',
                            children: [
                                { name: 'End', shape: 'terminator', linkLabel: 'Success', color: '#2a9d8f'}
                            ]
                        },
                        { 
                            name: 'Request Correction', shape: 'process', linkLabel: 'No', color: '#e63946',
                            children: [
                                { name: 'End', shape: 'terminator', linkLabel: 'Failed', color: '#e63946'}
                            ]
                        }
                    ]
                }
            ]
        }
    };

    new VikCraft(document.getElementById('flowChartContainer'), {
        type: 'flow',
        data: flowData,
        options: {} // No special options needed; styling is in the data
    });

    // --- Stacked Bar + Area Combo Chart ---
    const stackedComboData = {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [
            {
                type: 'stackedBar',
                label: 'New Customers',
                data: [15, 20, 22, 25],
                color: '#ffb703'
            },
            {
                type: 'stackedBar',
                label: 'Returning Customers',
                data: [30, 35, 40, 42],
                color: '#fb8500'
            },
            {
                type: 'stackedArea',
                label: 'Website Traffic (M)',
                data: [50, 60, 65, 75],
                color: 'rgba(0, 119, 182, 0.4)'
            }
        ]
    };

    new VikCraft(document.getElementById('stackedComboChart'), {
        type: 'stackedCombo',
        data: stackedComboData,
        options: {
            legend: { show: true, position: 'top' }
        }
    });


    // --- Radar + Nightingale Combo Chart ---
    const radarNightingaleData = {
        labels: ['Support', 'Development', 'Sales', 'Marketing', 'Admin'],
        datasets: [
            {
                type: 'nightingale',
                label: 'Resources Allocated (%)',
                data: [25, 40, 15, 10, 10],
                color: 'rgba(247, 37, 133, 0.5)' // A semi-transparent color for the area
            },
            {
                type: 'radar',
                label: 'Department Efficiency (%)',
                data: [90, 75, 60, 80, 95],
                color: '#0077b6' // A solid color for the line
            }
        ]
    };

    new VikCraft(document.getElementById('radarNightingaleChart'), {
        type: 'radarNightingale',
        data: radarNightingaleData,
        options: {
            legend: { show: true, position: 'bottom' }
        }
    });


    // --- Advanced Combination Chart ---
    const advancedComboData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
            {
                type: 'stackedBar',
                label: 'Support Tickets',
                data: [20, 25, 30, 28],
                color: '#ffb703'
            },
            {
                type: 'stackedBar',
                label: 'Feature Requests',
                data: [10, 15, 12, 18],
                color: '#fb8500'
            },
            {
                type: 'area',
                label: 'Active Users (K)',
                data: [45, 55, 62, 70],
                color: 'rgba(131, 192, 192, 0.4)'
            },
            {
                type: 'line',
                label: 'Satisfaction Score',
                data: [85, 88, 82, 90],
                color: '#d90429'
            }
        ]
    };

    new VikCraft(document.getElementById('advancedComboChart'), {
        type: 'advancedCombo',
        data: advancedComboData,
        options: {
            legend: { show: true, position: 'top' }
        }
    });



    // --- Chart Transformation Example ---

    // Define the child data and type (a pie chart)
    const salesByRegionData = {
        type: 'pie',
        data: {
            labels: ['North', 'South', 'East', 'West'],
            datasets: [{
                label: 'Sales by Region',
                data: [1500, 750, 1250, 900]
            }]
        }
    };

    // Define the parent data (a bar chart)
    const salesByQuarterData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            label: 'Total Sales by Quarter',
            data: [
                { value: 4400, children: salesByRegionData }, // Q1 can be clicked to transform
                { value: 3200 },
                { value: 5100 },
                { value: 5800 }
            ]
        }]
    };

    // Create the chart instance
    const transformChart = new VikCraft(document.getElementById('transformChartContainer'), {
        type: 'bar', // The initial chart type
        data: salesByQuarterData,
        options: {
            colors: ['#3a86ff'],
            // The onClick handler triggers the transformation
            onClick: function(data) {
                // 'this' refers to the VikCraft instance
                if (data.children && data.children.type) {
                    // Navigate to the new chart state
                    this.navigateTo(data.children);
                } else {
                    alert(`No detailed view available for ${data.label}.`);
                }
            }
        }
    });


    // --- 3D Bar Chart ---
    new VikCraft(document.getElementById('bar3dChart'), {
        type: 'bar3d', // Use the new type
        data: simpleBarData, // We can reuse the simple bar chart data
        options: {
            colors: ['#3a86ff'], // A single color is fine, or provide one for each bar
            legend: { show: false }
        }
    });

    // --- 3D Multi-Series Bar Chart ---
    const multiBar3dData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'], // X-axis categories
        datasets: [
            // Each object is a row on the Z-axis, from back to front
            { 
                label: 'Product A (Back)', 
                data: [45, 65, 59, 81],
                color: '#03045e' // Back row
            },
            { 
                label: 'Product B (Middle)', 
                data: [25, 42, 38, 55],
                color: '#0077b6' // Middle row
            },
            { 
                label: 'Product C (Front)', 
                data: [15, 28, 19, 33],
                color: '#00b4d8' // Front row
            }
        ]
    };

    new VikCraft(document.getElementById('multiBar3dChart'), {
        type: 'multiBar3d',
        data: multiBar3dData,
        options: {
            legend: { show: true, position: 'right' },
            // Add the new perspective object
            perspective: {
                depthX: 6, // Increased horizontal distance between rows
                depthY: 8   // Decreased vertical skew for a flatter angle
            }
        }
    });

    new VikCraft(document.getElementById('horizontalBar3dChart'), {
        type: 'multiBar3d',
        data: multiBar3dData, // We can reuse the same data
        options: {
            orient: 'horizontal', // The new orientation option
            legend: { show: true, position: 'bottom' }
        }
    });
    
    // --- Mixed 3D Bar + 2D Line Chart ---
    const mixed3dData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
            // The 3D bar datasets
            { 
                label: 'Product A', 
                data: [45, 65, 59, 81],
                color: '#03045e'
            },
            { 
                label: 'Product B', 
                data: [25, 42, 38, 55],
                color: '#0077b6'
            },
            // The 2D line dataset
            {
                type: 'line',
                label: 'Sales Target',
                data: [50, 60, 65, 75],
                color: '#d00000'
            }
        ]
    };

    new VikCraft(document.getElementById('mixed3dChart'), {
        type: 'mixed3d',
        data: mixed3dData,
        options: {
            legend: { show: true, position: 'top' }
        }
    });

});