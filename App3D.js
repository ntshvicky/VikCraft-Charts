// App3D.js
import VikCraft3D from './vikcraft-chart-3d.js';

// --- 1. 3D Scatter Plot ---
const scatter3dData = {
    datasets: [{
        label: 'Cosmic Anomalies',
        data: [
            { x: 1, y: 2, z: 5 }, { x: 3, y: 4, z: 2 }, { x: -2, y: 1, z: -3 },
            { x: -4, y: -2, z: 1 }, { x: 5, y: 0, z: 0 }, { x: 0, y: 6, z: -1 },
            { x: 2, y: -3, z: 3 }, { x: -1, y: -1, z: -2 }, { x: 4, y: 5, z: 6 },
        ]
    }]
};
const scatterChartEl = document.getElementById('scatter3dChart');
new VikCraft3D(scatterChartEl, {
    type: 'scatter3d',
    data: scatter3dData,
    options: {
        colors: [0xef476f]
    }
});

// --- 2. 3D Bar Chart ---
const bar3dData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
        { label: 'Product A', data: [22, 35, 30, 42] },
        { label: 'Product B', data: [31, 28, 45, 38] }
    ]
};
const barChartEl = document.getElementById('bar3dChartContainer');
new VikCraft3D(barChartEl, {
    type: 'bar3d',
    data: bar3dData,
    options: {
        colors: [0x0077b6, 0xfca311]
    }
});

// --- 3. 3D Line/Spline Chart ---
const line3dData = {
    datasets: [
        {
            label: 'Trajectory A (Straight)',
            data: [
                { x: 0, y: 0, z: 8 }, { x: 2, y: 2, z: 6 }, { x: 4, y: 0, z: 4 },
                { x: 6, y: 4, z: 2 }, { x: 8, y: 2, z: 0 }
            ]
        },
        {
            label: 'Trajectory B (Spline)',
            data: [
                { x: 0, y: 1, z: 8 }, { x: 2, y: 3, z: 6 }, { x: 4, y: 1, z: 4 },
                { x: 6, y: 5, z: 2 }, { x: 8, y: 3, z: 0 }
            ]
        }
    ]
};
const lineChartEl = document.getElementById('line3dChartContainer');
new VikCraft3D(lineChartEl, {
    type: 'line3d',
    data: line3dData,
    options: {
        spline: true,
        colors: [0xd90429, 0x00b4d8]
    }
});

// --- 4. 3D Pie Chart ---
const pie3dData = {
    labels: ['Marketing', 'Sales', 'Development', 'Support'],
    datasets: [{
        data: [20, 35, 30, 15]
    }]
};
const pieChartEl = document.getElementById('pie3dChartContainer');
new VikCraft3D(pieChartEl, {
    type: 'pie3d',
    data: pie3dData,
    options: {
        colors: [0x4361ee, 0x4cc9f0, 0xf72585, 0x7209b7],
        pie: {
            depth: 1.5
        }
    }
});


// --- Event Listener for Clicks ---
document.querySelector('.vc-chart-grid').addEventListener('viz-click', (event) => {
    console.log('Chart Element Clicked!', event.detail);
    
    const infoBox = document.getElementById('click-info');
    infoBox.innerHTML = `<h3>Clicked Element Data:</h3><pre>${JSON.stringify(event.detail, null, 2)}</pre>`;
    infoBox.style.display = 'block';
});