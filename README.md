# VikCraft.js - Custom Lightweight Charting Library

VikCraft.js is a custom-built, lightweight JavaScript charting library designed to provide a wide array of data visualization options with a simple and intuitive API. From standard bar and line charts to more complex 3D visualizations and organizational diagrams, VikCraft.js aims to make data representation straightforward and efficient.

[VikCraft]: https://vikcraftchart.nitishsrivastava.com/
For a demonstration, visit the [VikCraft Interactive Charts demo][VikCraft].
You can also find the full documentation on their [website][VikCraft].

## ✨ Features

* **Diverse Chart Types**: Supports a comprehensive range of 2D, 3D, and specialized charts.
* **Lightweight**: Built with performance in mind, minimizing overhead.
* **Customizable**: Flexible options for colors, legends, data labels, and more.
* **Interactive**: Includes click event handlers and interactive legends (where applicable).
* **Drill-Down & Transformation**: Seamless navigation between related chart views.
* **Modular 3D Support**: Dedicated module for advanced 3D visualizations using Three.js.

---

## 🚀 Getting Started

To use VikCraft.js, you'll need to include its CSS and JavaScript files in your HTML. For 3D charts, an additional JavaScript module (`VikCraft3D.js`) and a `type="importmap"` script are required.

### 1. HTML Structure

Your HTML page should include `div` elements with unique `id` attributes where you want your charts to be rendered.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VikCraft.js - Custom Chart Library</title>
    
    <link rel="stylesheet" href="vikcraft-chart.css">
</head>
<body>
    <header class="vc-main-header">
        <h1>VikCraft.js Chart Examples</h1>
        <p>A custom, lightweight charting library.</p>
    </header>

    <main class="vc-chart-grid">
        <div class="vc-chart-card">
            <h3>Bar Chart</h3>
            <div id="barChart"></div>
        </div>
        <hr/> <div class="vc-chart-card">
            <h3>3D Scatter Plot</h3>
            <div id="scatter3dChart"></div>
        </div>
        </main>

    <script src="vikcraft-chart.js"></script>
    <script src="App.js"></script> 

    <script type="importmap">
        {
            "imports": {
                "three": "[https://unpkg.com/three@0.165.0/build/three.module.js](https://unpkg.com/three@0.165.0/build/three.module.js)",
                "three/addons/": "[https://unpkg.com/three@0.165.0/examples/jsm/](https://unpkg.com/three@0.165.0/examples/jsm/)"
            }
        }
    </script>
    <script type="module" src="vikcraft-chart-3d.js"></script>
    <script type="module" src="App3D.js"></script>
</body>
</html>
```

---

### 2. Basic Usage (JavaScript)
Charts are initialized using the `VikCraft` (for 2D charts) or `VikCraft3D` (for 3D charts) constructor, passing the target DOM element and a configuration object.

```javascript
// App.js (for 2D charts)
document.addEventListener('DOMContentLoaded', () => {
    const simpleBarData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{ label: 'Sales', data: [30, 45, 62, 25, 55] }]
    };

    new VikCraft(document.getElementById('barChart'), {
        type: 'bar', // Specify chart type
        data: simpleBarData,
        options: {
            colors: ['#2a9d8f'],
            dataLabels: { show: true, color: '#c94040' },
            onClick: (data) => {
                alert(`You clicked on dataset "${data.datasetLabel}", label "${data.label}", which has a value of ${data.value}.`);
            }
        }
    });
});

// App3D.js (for 3D charts - requires 'type="module"' script and import map)
import VikCraft3D from './vikcraft-chart-3d.js';

document.addEventListener('DOMContentLoaded', () => {
    const scatter3dData = {
        datasets: [{
            label: 'Cosmic Anomalies',
            data: [
                { x: 1, y: 2, z: 5 }, { x: 3, y: 4, z: 2 },
            ]
        }]
    };
    new VikCraft3D(document.getElementById('scatter3dChart'), {
        type: 'scatter3d',
        data: scatter3dData,
        options: {
            colors: [0xef476f]
        }
    });
});
```

## 📊 Chart Types
VikCraft.js supports a wide variety of chart types, categorized below:

### Bar Charts
**Bar Chart:** Standard vertical bars.

```javascript
// Example: Simple Bar Chart
new VikCraft(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels: ['Jan', 'Feb'], datasets: [{ label: 'Sales', data: [30, 45] }] },
    options: { colors: ['#2a9d8f'] }
});
```

**Stacked Bar Chart:** Bars stacked to show composition.

**Multi-Series Bar Chart:** Grouped bars for comparing multiple datasets.

**100% Stacked Bar Chart:** Stacked bars scaled to 100% to show proportions.

**Drill-Down Bar Chart:** Interactive bars that reveal more detailed child charts on click.

**Horizontal Bar Chart:** Bars rendered horizontally.

**Horizontal Stacked Bar Chart:** Horizontal stacked bars.

**Horizontal Grouped Bar Chart:** Horizontal grouped bars.

---

### Line & Area Charts
**Line Chart:** Basic line graph.

```JavaScript
// Example: Line Chart
new VikCraft(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels: ['Mon', 'Tue'], datasets: [{ label: 'Stock Price', data: [10, 25] }] },
    options: { colors: ['#ff6384'] }
});
```

**Dashed Line Chart:** Line graph with a dashed line style.

**Spline (Curved) Chart:** Line graph with curved segments.

**Multi-Series Line Chart:** Multiple lines for comparing trends.

**Area Chart:** Line chart with the area below the line filled.

**Stacked Area Chart:** Multiple area charts stacked.

**100% Stacked Area Chart:** Stacked area charts scaled to 100%.

---

### Pie & Doughnut Charts
**Pie Chart:** Circular chart divided into sectors.

```JavaScript

// Example: Pie Chart
new VikCraft(document.getElementById('pieChart'), {
    type: 'pie',
    data: { labels: ['Desktop', 'Mobile'], datasets: [{ data: [55, 35] }] },
    options: { colors: ['#36a2eb', '#ffcd56'], legend: { show: true } }
});
```

**Doughnut Chart:** A pie chart with a hollow center.

---

### Specialized Charts
**Funnel Chart:** Represents stages in a process.

**Pyramid Chart:** Similar to a funnel, often used for hierarchical data.

**Candlestick Chart:** Used for financial data, showing open, high, low, and close prices.

**Scatter Chart:** Displays individual data points on a two-dimensional plane.

**Bubble Chart:** A scatter chart where the size of the bubble represents a third data dimension.

**Waterfall Chart:** Shows how an initial value is affected by a series of positive or negative changes.

**Box & Whisker Chart:** Displays the distribution of data based on a five-number summary.

**Radar Chart:** Displays multivariate data as a two-dimensional chart of three or more quantitative variables represented on axes starting from the same point.

**Filled Multi-Series Radar:** Radar chart with filled areas for multiple datasets.

**OHLC Chart:** Open-High-Low-Close chart, a simplified version of a candlestick.

**Nightingale Rose Chart:** A variation of the radar chart, useful for cyclical data.

**Thermometer Chart:** Visualizes a single value against a range, like a thermometer.

**Vertical Gauge:** Linear gauge for vertical progress display.

**Horizontal Gauge:** Linear gauge for horizontal progress display.

**Radial Gauge:** A circular gauge for displaying progress.

**Heatmap:** Represents data in a matrix where values are shown as colors.

**Mixed Box Plot (with Outliers):** Box plot that can display individual outlier points.

**Hollow Candlestick Chart:** A candlestick chart where increasing values have a hollow body.

**Grouped Radial Bar Chart:** Multiple radial bars grouped by category.

**Treemap:** Displays hierarchical data as a set of nested rectangles.


```JavaScript
// Example: Treemap Chart
new VikCraft(document.getElementById('treemapChart'), {
    type: 'treemap',
    data: {
        root: { name: 'Global Sales', children: [{ name: 'North America', value: 400 }] }
    },
    options: { colorScale: ['#ade8f4', '#0077b6'] }
});
```

**Sunburst Chart:** Displays hierarchical data using a radial layout.

---

### Combo Charts
**Combo (Bar & Line) Chart:** Combines bar and line series on a single chart.

**Stacked Bar + Area Combo:** Combines stacked bars with an area chart.

***Stacked Bar + Area + Line Combo:*** Combines stacked bars, an area chart, and a line chart.

***Radar + Nightingale Combo:*** Combines a radar chart with a Nightingale rose chart.

---

### Transformable Charts
**Chart Transformation (Bar to Pie):** Allows for dynamic transformation of one chart type to another on interaction.

---

### Organization & Flow Charts
**Organization Chart:** Visualizes hierarchical structures like company org charts.

```JavaScript
// Example: Organization Chart
new VikCraft(document.getElementById('orgChartContainer'), {
    type: 'org',
    data: { root: { name: 'CEO', title: 'Chief Executive Officer', children: [] } },
    options: { colors: ['#1d3557'] }
});
```

**Flow Chart:** Represents a workflow or process with various shapes and connectors.

---

## 3D Charts (Requires VikCraft3D.js and Three.js)
3D Bar Chart: Bars rendered in a three-dimensional space.

```JavaScript
// Example: 3D Bar Chart
import VikCraft3D from './VikCraft3D.js';
new VikCraft3D(document.getElementById('bar3dChartContainer'), {
    type: 'bar3d',
    data: { labels: ['Q1', 'Q2'], datasets: [{ label: 'Product A', data: [22, 35] }] },
    options: { colors: [0x0077b6] }
});
```

**3D Multi-Series Bar Chart:** Multiple series of bars in 3D, often grouped along a third axis.

**3D Horizontal Bar Chart:** Horizontal bars in 3D.

**3D Bar + 2D Line Combo:** Combines 3D bars with a 2D line overlay.

**3D Scatter Plot:** Scatter plot in three dimensions.

**3D Line / Spline Chart:** Lines or curved splines in 3D space.

**3D Pie Chart:** Pie chart rendered with a 3D perspective.

---

## 🤝 Contributing
Contributions are welcome! If you have suggestions for new chart types, features, or improvements, please feel free to open an issue or submit a pull request.