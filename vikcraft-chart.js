/**
 * =============================================================================
 * vikcraft-chart.js - A Custom 2D Charting Library
 *
 * This file contains the main VikCraft class, the BaseChart class that all
 * chart types extend, and the implementations for all specific chart types.
 * =============================================================================
 */


/**
 * @class VikCraft
 * The main entry point for creating and managing a chart instance.
 */
class VikCraft {
    static chartTypes = {};

    constructor(element, config) {
        this.element = element;
        this.config = config;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.element.innerHTML = ''; 
        this.element.appendChild(this.canvas);
        
        this.tooltip = this.createTooltip();
        this.element.appendChild(this.tooltip);

        this.stateStack = [];
        this.backButton = this.createBackButton();
        this.element.appendChild(this.backButton);
        
        this.createChart(this.config.type, this.config.data);
        this.addInteractivityListeners();

        this.resizeObserver = new ResizeObserver(() => this.draw());
        this.resizeObserver.observe(this.element);
    }

    createChart(type, data) {
        const ChartClass = VikCraft.chartTypes[type];
        if (ChartClass) {
            this.chart = new ChartClass(this.ctx, data, this.config.options);
            this.config.type = type; 
            this.config.data = data;
        } else {
            console.error(`Chart type "${type}" is not registered.`);
        }
    }

    draw() {
        if (!this.chart) return;
        this.canvas.width = this.element.clientWidth;
        this.canvas.height = this.element.clientHeight;
        this.chart.render();
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'vc-tooltip';
        return tooltip;
    }

    createBackButton() {
        const button = document.createElement('button');
        button.className = 'vc-back-button';
        button.innerHTML = '&larr; Back';
        button.addEventListener('click', () => this.goBack());
        return button;
    }
    
    navigateTo(targetState) {
        if (!targetState || !targetState.type || !targetState.data) return;
        this.stateStack.push({ data: this.config.data, type: this.config.type });
        this.createChart(targetState.type, targetState.data);
        this.draw();
        this.backButton.style.display = 'block';
    }
    
    goBack() {
        if (this.stateStack.length === 0) return;
        const prevState = this.stateStack.pop();
        this.createChart(prevState.type, prevState.data);
        this.draw();
        if (this.stateStack.length === 0) {
            this.backButton.style.display = 'none';
        }
    }

    addInteractivityListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.chart) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const activeElement = this.chart.getElementAt(mouseX, mouseY);

            if (activeElement && activeElement.tooltip) {
                this.canvas.style.cursor = 'pointer';
                this.tooltip.style.opacity = '1';
                this.tooltip.style.left = `${activeElement.x}px`;
                this.tooltip.style.top = `${activeElement.y}px`;
                this.tooltip.innerHTML = activeElement.tooltip;
            } else {
                this.canvas.style.cursor = 'default';
                this.tooltip.style.opacity = '0';
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (!this.chart) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.chart.legendElements && Array.isArray(this.chart.legendElements)) {
                for (const el of this.chart.legendElements) {
                    if (mouseX >= el.x && mouseX <= el.x + el.width && mouseY >= el.y && mouseY <= el.y + el.height) {
                        const dataset = this.config.data.datasets[el.index];
                        if(dataset) dataset._hidden = !dataset._hidden;
                        this.draw();
                        return;
                    }
                }
            }
            
            const activeElement = this.chart.getElementAt(mouseX, mouseY);
            if (activeElement && activeElement.eventData && this.config.options.onClick) {
                this.config.options.onClick.call(this, activeElement.eventData);
            }
        });
    }

    static registerChartType(typeName, chartClass) {
        this.chartTypes[typeName] = chartClass;
    }
}

//==============================================================================
// 2. BASE CHART CLASS
//==============================================================================
class BaseChart {
    constructor(ctx, data, options) {
        this.ctx = ctx;
        this.data = data;
        this.options = options || {};
        this.padding = { top: 20, right: 20, bottom: 50, left: 60 };
        this.chartElements = [];
        this.legendElements = [];
        this.chartArea = {};
    }

    layoutLegend(shouldDraw = false) {
        const legendOptions = this.options.legend || {};
        if (!legendOptions.show || !this.data.datasets) return { width: 0, height: 0 };
        const position = legendOptions.position || 'top';
        const isVertical = position === 'left' || position === 'right';
        this.ctx.font = '12px Arial';
        const itemHeight = 20;
        const colorBoxWidth = 15;
        const labelPadding = 5;
        const itemSpacing = 20;
        let x, y, maxWidth = 0, currentWidth = 0, currentHeight = itemHeight;

        if (position === 'top') { x = this.padding.left; y = this.padding.top; }
        if (position === 'bottom') { x = this.padding.left; y = this.chartArea.y + this.chartArea.height + 30; }
        if (position === 'left') { x = this.padding.left / 2; y = this.chartArea.y; }
        if (position === 'right') { x = this.chartArea.x + this.chartArea.width + 20; y = this.chartArea.y; }
        let initialX = x;

        this.data.datasets.forEach((dataset, i) => {
            if (!dataset.label) return;
            const textWidth = this.ctx.measureText(dataset.label).width;
            const itemWidth = colorBoxWidth + labelPadding + textWidth;
            if (isVertical) {
                maxWidth = Math.max(maxWidth, itemWidth);
                if (shouldDraw) this.drawLegendItem(dataset, x, y, i);
                y += itemHeight;
                currentHeight += itemHeight;
            } else {
                if (x + itemWidth > this.ctx.canvas.width - this.padding.right) {
                    x = initialX;
                    y += itemHeight;
                    currentHeight += itemHeight;
                    currentWidth = 0;
                }
                if (shouldDraw) this.drawLegendItem(dataset, x, y, i);
                x += itemWidth + itemSpacing;
                currentWidth = x - initialX;
                maxWidth = Math.max(maxWidth, currentWidth);
            }
        });
        return { width: isVertical ? maxWidth : this.ctx.canvas.width, height: currentHeight };
    }

    drawLegendItem(dataset, x, y, index) {
        const itemHeight = 20;
        const colorBoxWidth = 15;
        const labelPadding = 5;
        const textWidth = this.ctx.measureText(dataset.label).width;
        const isHidden = dataset._hidden === true;
        const color = this.options.colors?.[index] || dataset.color || '#ccc';
        this.ctx.fillStyle = isHidden ? '#ccc' : color;
        this.ctx.fillRect(x, y, colorBoxWidth, 10);
        this.ctx.fillStyle = isHidden ? '#ccc' : '#333';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(dataset.label, x + colorBoxWidth + labelPadding, y + 5);
        const itemWidth = colorBoxWidth + labelPadding + textWidth;
        this.legendElements.push({ x: x, y: y, width: itemWidth, height: itemHeight, index: index });
    }

    render() {
        this.clearCanvas();
        this.resetElements();
        const legendOptions = this.options.legend || {};
        const position = legendOptions.position || 'top';
        const legendDims = this.layoutLegend(false);
        const dynamicPadding = { ...this.padding };
        const spacing = 20;
        if (position === 'top') dynamicPadding.top = legendDims.height + spacing;
        if (position === 'bottom') dynamicPadding.bottom = legendDims.height + spacing;
        if (position === 'left') dynamicPadding.left = legendDims.width + spacing;
        if (position === 'right') dynamicPadding.right = legendDims.width + spacing;
        this.calculateChartArea(dynamicPadding);
        this.drawGridAndAxes();
        this.drawChart();
        this.layoutLegend(true);
    }

    calculateChartArea(padding) {
        const { canvas } = this.ctx;
        this.chartArea = {
            x: padding.left,
            y: padding.top,
            width: canvas.width - padding.left - padding.right,
            height: canvas.height - padding.top - padding.bottom
        };
    }
    
    clearCanvas() { this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height); }
    resetElements() { this.chartElements = []; this.legendElements = []; }
    drawChart() { throw new Error("drawChart() must be implemented by the subclass."); }
    
    getElementAt(mouseX, mouseY) {
        for (let i = this.chartElements.length - 1; i >= 0; i--) {
            const el = this.chartElements[i];
            if (mouseX >= el.x && mouseX <= el.x + el.width && mouseY >= el.y && mouseY <= el.y + el.height) {
                return { x: el.tooltipX, y: el.tooltipY, tooltip: el.tooltip, eventData: el.eventData };
            }
        }
        return null;
    }
    
    getVisibleDatasets() { return this.data.datasets.filter(ds => !ds._hidden); }

    drawGridAndAxes() {
        const orient = this.options.orient || 'vertical';
        const { width, height, x, y } = this.chartArea;
        const { labels, datasets } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0 || !labels) return;
        
        const allData = visibleDatasets.flatMap(d => Array.isArray(d.data) ? d.data.map(item => (typeof item === 'object' && item.value !== undefined ? item.value : item)) : []);
        const numericData = allData.filter(v => typeof v === 'number');
        if (numericData.length === 0) return;
        const maxValue = Math.max(0, ...numericData);
        
        if (orient === 'vertical') {
            const numTicks = 5;
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.lineWidth = 1;
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#666';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            for (let i = 0; i <= numTicks; i++) {
                const value = Math.round((maxValue / numTicks) * i);
                const tickY = y + height - (maxValue > 0 ? ((value / maxValue) * height) : 0);
                this.ctx.moveTo(x, tickY);
                this.ctx.lineTo(x + width, tickY);
                this.ctx.fillText(value, x - 8, tickY);
            }
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ccc';
            this.ctx.moveTo(x, y + height);
            this.ctx.lineTo(x + width, y + height);
            this.ctx.stroke();
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillStyle = '#333';
            const categoryWidth = width / labels.length;
            labels.forEach((label, i) => {
                const labelX = x + (i * categoryWidth) + (categoryWidth / 2);
                this.ctx.fillText(label, labelX, y + height + 10);
            });
        } else { // Horizontal orientation
            const numTicks = 5;
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.lineWidth = 1;
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#666';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            for (let i = 0; i <= numTicks; i++) {
                const value = Math.round((maxValue / numTicks) * i);
                const tickX = x + (maxValue > 0 ? (value / maxValue) * width : 0);
                this.ctx.moveTo(tickX, y);
                this.ctx.lineTo(tickX, y + height);
                this.ctx.fillText(value, tickX, y + height + 5);
            }
            this.ctx.stroke();
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#333';
            const categoryHeight = height / labels.length;
            labels.forEach((label, i) => {
                const labelY = y + (i * categoryHeight) + (categoryHeight / 2);
                this.ctx.fillText(label, x - 8, labelY);
            });
        }
    }
}


//==============================================================================
// 3. CHART IMPLEMENTATIONS
//==============================================================================

class BarChart extends BaseChart {
    drawChart() {
        const orient = this.options.orient || 'vertical';
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const visibleDataset = this.getVisibleDatasets()[0];
        if (!visibleDataset) return;
        
        const dataValues = visibleDataset.data.map(item => (typeof item === 'object' ? item.value : item));
        const maxValue = Math.max(0, ...dataValues);
        if (maxValue === 0) return;

        if (orient === 'vertical') {
            const categoryWidth = width / labels.length;
            const barWidth = categoryWidth * 0.7;
            dataValues.forEach((value, i) => {
                const barHeight = (value / maxValue) * height;
                const x = chartX + i * categoryWidth + (categoryWidth * 0.15);
                const y = chartY + height - barHeight;
                this.ctx.fillStyle = this.options.colors?.[0] || 'rgba(54, 162, 235, 0.6)';
                this.ctx.fillRect(x, y, barWidth, barHeight);
                this.chartElements.push({
                    x, y, width: barWidth, height: barHeight,
                    tooltipX: x + barWidth / 2, tooltipY: y, tooltip: `${labels[i]}: ${value}`,
                    eventData: { label: labels[i], value, datasetLabel: visibleDataset.label, index: i, datasetIndex: 0, children: visibleDataset.data[i].children }
                });
            });
        } else { // Horizontal
            const categoryHeight = height / labels.length;
            const barHeight = categoryHeight * 0.7;
            dataValues.forEach((value, i) => {
                const barWidth = (value / maxValue) * width;
                const y = chartY + i * categoryHeight + (categoryHeight * 0.15);
                this.ctx.fillStyle = this.options.colors?.[0] || 'rgba(54, 162, 235, 0.6)';
                this.ctx.fillRect(chartX, y, barWidth, barHeight);
                this.chartElements.push({
                    x: chartX, y, width: barWidth, height: barHeight,
                    tooltipX: chartX + barWidth, tooltipY: y + barHeight / 2, tooltip: `${labels[i]}: ${value}`,
                    eventData: { label: labels[i], value, datasetLabel: visibleDataset.label, index: i, datasetIndex: 0, children: visibleDataset.data[i].children }
                });
            });
        }
    }
}
VikCraft.registerChartType('bar', BarChart);

class StackedBarChart extends BaseChart {
    drawChart() {
        const orient = this.options.orient || 'vertical';
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const totals = labels.map((_, i) => visibleDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const maxValue = Math.max(0, ...totals);
        if (maxValue === 0) return;

        if (orient === 'vertical') {
            const categoryWidth = width / labels.length;
            const barWidth = categoryWidth * 0.7;
            labels.forEach((label, i) => {
                let currentY = chartY + height;
                const x = chartX + i * categoryWidth + (categoryWidth * 0.15);
                visibleDatasets.forEach((dataset, j) => {
                    const value = dataset.data[i];
                    if (value > 0) {
                        const barHeight = (value / maxValue) * height;
                        currentY -= barHeight;
                        this.ctx.fillStyle = this.options.colors?.[j] || 'grey';
                        this.ctx.fillRect(x, currentY, barWidth, barHeight);
                        this.chartElements.push({
                            x, y: currentY, width: barWidth, height: barHeight,
                            tooltipX: x + barWidth / 2, tooltipY: currentY, tooltip: `${dataset.label}: ${value}`,
                            eventData: { label, value, datasetLabel: dataset.label, index: i, datasetIndex: j }
                        });
                    }
                });
            });
        } else { // Horizontal
            const categoryHeight = height / labels.length;
            const barHeight = categoryHeight * 0.7;
            labels.forEach((label, i) => {
                let currentX = chartX;
                const y = chartY + i * categoryHeight + (categoryHeight * 0.15);
                visibleDatasets.forEach((dataset, j) => {
                    const value = dataset.data[i];
                    if (value > 0) {
                        const barWidth = (value / maxValue) * width;
                        this.ctx.fillStyle = this.options.colors?.[j] || 'grey';
                        this.ctx.fillRect(currentX, y, barWidth, barHeight);
                        this.chartElements.push({
                            x: currentX, y, width: barWidth, height: barHeight,
                            tooltipX: currentX + barWidth / 2, tooltipY: y, tooltip: `${dataset.label}: ${value}`,
                            eventData: { label, value, datasetLabel: dataset.label, index: i, datasetIndex: j }
                        });
                        currentX += barWidth;
                    }
                });
            });
        }
    }
}
VikCraft.registerChartType('stackedBar', StackedBarChart);

class MultiSeriesBarChart extends BaseChart {
    drawChart() {
        const orient = this.options.orient || 'vertical';
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;

        const allData = visibleDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;

        const numCategories = labels.length;
        const numSeries = visibleDatasets.length;
        
        const paddingOpts = this.options.padding || {};
        const groupPadding = paddingOpts.group ?? 0.2;
        const barPadding = paddingOpts.bar ?? 0.1;

        if (orient === 'vertical') {
            const categoryWidth = width / numCategories;
            const groupWidth = categoryWidth * (1 - groupPadding);
            const barSlotWidth = groupWidth / numSeries;
            const barWidth = barSlotWidth * (1 - barPadding);
            const barMargin = barSlotWidth * barPadding / 2;
            labels.forEach((label, i) => {
                const categoryStartX = chartX + i * categoryWidth + (categoryWidth * groupPadding / 2);
                visibleDatasets.forEach((dataset, j) => {
                    const value = dataset.data[i];
                    const barHeight = (value / maxValue) * height;
                    const x = categoryStartX + j * barSlotWidth + barMargin;
                    const y = chartY + height - barHeight;
                    this.ctx.fillStyle = this.options.colors?.[j] || 'grey';
                    this.ctx.fillRect(x, y, barWidth, barHeight);
                    this.chartElements.push({
                        x, y, width: barWidth, height: barHeight,
                        tooltipX: x + barWidth / 2, tooltipY: y, tooltip: `${dataset.label} (${label}): ${value}`,
                        eventData: { label, value, datasetLabel: dataset.label, index: i, datasetIndex: j }
                    });
                });
            });
        } else { // Horizontal
            const categoryHeight = height / numCategories;
            const groupHeight = categoryHeight * (1 - groupPadding);
            const barSlotHeight = groupHeight / numSeries;
            const barHeight = barSlotHeight * (1 - barPadding);
            const barMargin = barSlotHeight * barPadding / 2;
            labels.forEach((label, i) => {
                const categoryStartY = chartY + i * categoryHeight + (categoryHeight * groupPadding / 2);
                visibleDatasets.forEach((dataset, j) => {
                    const value = dataset.data[i];
                    const barWidth = (value / maxValue) * width;
                    const x = chartX;
                    const y = categoryStartY + j * barSlotHeight + barMargin;
                    this.ctx.fillStyle = this.options.colors?.[j] || 'grey';
                    this.ctx.fillRect(x, y, barWidth, barHeight);
                     this.chartElements.push({
                        x, y, width: barWidth, height: barHeight,
                        tooltipX: x + barWidth, tooltipY: y + barHeight / 2, tooltip: `${dataset.label} (${label}): ${value}`,
                        eventData: { label, value, datasetLabel: dataset.label, index: i, datasetIndex: j }
                    });
                });
            });
        }
    }
}
VikCraft.registerChartType('multiSeriesBar', MultiSeriesBarChart);

class StackedBar100Chart extends StackedBarChart {
    drawGridAndAxes() {
        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= numTicks; i++) {
            const value = (100 / numTicks) * i;
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(`${value}%`, x - 8, tickY);
        }
        this.ctx.stroke();
    }
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const categoryTotals = labels.map((_, i) => visibleDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const categoryWidth = width / labels.length;
        const barWidth = categoryWidth * 0.7;
        labels.forEach((label, i) => {
            let currentY = chartY + height;
            const x = chartX + i * categoryWidth + (categoryWidth * 0.3) / 2;
            const total = categoryTotals[i];
            if (total === 0) return;
            visibleDatasets.forEach((dataset, j) => {
                const value = dataset.data[i];
                const percentage = value / total;
                const barHeight = percentage * height;
                currentY -= barHeight;
                this.ctx.fillStyle = this.options.colors?.[j] || 'grey';
                this.ctx.fillRect(x, currentY, barWidth, barHeight);
                const percentString = (percentage * 100).toFixed(1);
                this.chartElements.push({
                    x, y: currentY, width: barWidth, height: barHeight,
                    tooltipX: x + barWidth / 2, tooltipY: currentY, tooltip: `${dataset.label}: ${value} (${percentString}%)`,
                    eventData: { label, value, datasetLabel: dataset.label, index: i, datasetIndex: j }
                });
            });
        });
    }
}
VikCraft.registerChartType('stackedBar100', StackedBar100Chart);

class LineChart extends BaseChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDataset = this.getVisibleDatasets()[0];
        if (!visibleDataset) return;
        const data = visibleDataset.data;
        const maxValue = Math.max(0, ...data);
        if (maxValue === 0) return;
        const getCoords = (value, i) => ({ x: chartX + (i / (labels.length - 1)) * width, y: chartY + height - (value / maxValue) * height });
        const points = data.map((value, i) => getCoords(value, i));
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.options.colors?.[0] || '#ff6384';
        this.ctx.lineWidth = this.options.lineWidth || 2;
        if (this.options.lineStyle === 'dashed') this.ctx.setLineDash([5, 5]);
        if (this.options.lineStyle === 'spline' && points.length > 1) {
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        } else {
            points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        points.forEach((p, i) => {
            this.ctx.fillStyle = this.options.colors?.[0] || '#ff6384';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
            this.chartElements.push({
                x: p.x - 8, y: p.y - 8, width: 16, height: 16,
                tooltipX: p.x, tooltipY: p.y, tooltip: `${labels[i]}: ${data[i]}`,
                eventData: { label: labels[i], value: data[i], datasetLabel: visibleDataset.label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('line', LineChart);

class MultiSeriesLineChart extends BaseChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const allData = visibleDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;
        const getCoords = (value, i) => ({ x: chartX + (i / (labels.length - 1)) * width, y: chartY + height - (value / maxValue) * height });
        visibleDatasets.forEach((dataset, seriesIndex) => {
            const points = dataset.data.map((value, i) => getCoords(value, i));
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.options.colors?.[seriesIndex] || 'grey';
            this.ctx.lineWidth = 2;
            points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
            this.ctx.stroke();
            this.ctx.fillStyle = this.options.colors?.[seriesIndex] || 'grey';
            points.forEach((p, i) => {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
                this.chartElements.push({
                    x: p.x - 8, y: p.y - 8, width: 16, height: 16,
                    tooltipX: p.x, tooltipY: p.y, tooltip: `${dataset.label} (${labels[i]}): ${dataset.data[i]}`,
                    eventData: { label: labels[i], value: dataset.data[i], datasetLabel: dataset.label, index: i, datasetIndex: seriesIndex }
                });
            });
        });
    }
}
VikCraft.registerChartType('multiSeriesLine', MultiSeriesLineChart);

class ComboChart extends BaseChart {
    drawChart() {
        const visibleDatasets = this.getVisibleDatasets();
        const drawOrder = ['bar', 'line'];
        drawOrder.forEach(typeToDraw => {
            visibleDatasets.forEach((dataset, index) => {
                if (dataset.type !== typeToDraw) return;
                const ChartClass = VikCraft.chartTypes[dataset.type];
                if (ChartClass) {
                    const renderer = new ChartClass(this.ctx, { labels: this.data.labels, datasets: [dataset] }, { ...this.options, colors: [this.options.colors[index]] });
                    renderer.chartArea = this.chartArea;
                    renderer.chartElements = this.chartElements;
                    renderer.drawChart();
                }
            });
        });
    }
}
VikCraft.registerChartType('combo', ComboChart);

class AreaChart extends LineChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDataset = this.getVisibleDatasets()[0];
        if (!visibleDataset) return;
        const data = visibleDataset.data;
        const maxValue = Math.max(0, ...data);
        if (maxValue === 0) return;
        const getCoords = (value, i) => ({ x: chartX + (i / (labels.length - 1)) * width, y: chartY + height - (value / maxValue) * height });
        const points = data.map((value, i) => getCoords(value, i));
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.lineTo(chartX + width, chartY + height);
        this.ctx.lineTo(chartX, chartY + height);
        this.ctx.closePath();
        this.ctx.fillStyle = this.options.colors?.[0] || 'rgba(54, 162, 235, 0.4)';
        this.ctx.fill();
        super.drawChart();
    }
}
VikCraft.registerChartType('area', AreaChart);

class StackedAreaChart extends BaseChart {
    drawGridAndAxes() {
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0 || !this.data.labels) return;
        const totals = this.data.labels.map((_, i) => visibleDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const maxValue = Math.max(0, ...totals);
        if (maxValue === 0) return;
        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= numTicks; i++) {
            const value = Math.round((maxValue / numTicks) * i);
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(value, x - 8, tickY);
        }
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ccc';
        this.ctx.moveTo(x, y + height);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.stroke();
    }
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const totals = labels.map((_, i) => visibleDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const maxValue = Math.max(0, ...totals);
        if (maxValue === 0) return;
        const getY = (value) => chartY + height - (value / maxValue) * height;
        const getX = (i) => chartX + (i / (labels.length - 1)) * width;
        const cumulativeData = [];
        visibleDatasets.forEach((dataset, i) => {
            if (i === 0) {
                cumulativeData.push([...dataset.data]);
            } else {
                const lastCumulative = cumulativeData[i - 1];
                const newCumulative = dataset.data.map((val, j) => val + lastCumulative[j]);
                cumulativeData.push(newCumulative);
            }
        });
        for (let i = visibleDatasets.length - 1; i >= 0; i--) {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.options.colors[i] || 'grey';
            const topLineData = cumulativeData[i];
            const bottomLineData = (i === 0) ? labels.map(() => 0) : cumulativeData[i - 1];
            this.ctx.moveTo(getX(0), getY(topLineData[0]));
            for (let j = 1; j < labels.length; j++) this.ctx.lineTo(getX(j), getY(topLineData[j]));
            for (let j = labels.length - 1; j >= 0; j--) this.ctx.lineTo(getX(j), getY(bottomLineData[j]));
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
}
VikCraft.registerChartType('stackedArea', StackedAreaChart);

class StackedArea100Chart extends StackedAreaChart {
    drawGridAndAxes() {
        const { width, height, x, y } = this.chartArea;
        const numTicks = 4;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= numTicks; i++) {
            const value = (100 / numTicks) * i;
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(`${value}%`, x - 8, tickY);
        }
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ccc';
        this.ctx.moveTo(x, y + height);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.stroke();
    }
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const categoryTotals = labels.map((_, i) => visibleDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const getY = (percentage) => chartY + height - (percentage / 100) * height;
        const getX = (i) => chartX + (i / (labels.length - 1)) * width;
        const cumulativePercentageData = [];
        visibleDatasets.forEach((dataset, i) => {
            const percentages = dataset.data.map((val, j) => categoryTotals[j] === 0 ? 0 : (val / categoryTotals[j]) * 100);
            if (i === 0) {
                cumulativePercentageData.push(percentages);
            } else {
                const lastCumulative = cumulativePercentageData[i - 1];
                const newCumulative = percentages.map((p, j) => p + lastCumulative[j]);
                cumulativePercentageData.push(newCumulative);
            }
        });
        for (let i = visibleDatasets.length - 1; i >= 0; i--) {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.options.colors[i] || 'grey';
            const topLineData = cumulativePercentageData[i];
            const bottomLineData = (i === 0) ? labels.map(() => 0) : cumulativePercentageData[i - 1];
            this.ctx.moveTo(getX(0), getY(topLineData[0]));
            for (let j = 1; j < labels.length; j++) this.ctx.lineTo(getX(j), getY(topLineData[j]));
            for (let j = labels.length - 1; j >= 0; j--) this.ctx.lineTo(getX(j), getY(bottomLineData[j]));
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
}
VikCraft.registerChartType('stackedArea100', StackedArea100Chart);

class PieChart extends BaseChart {
    render() { this.clearCanvas(); this.resetElements(); this.drawChart(); this.layoutLegend(true); }
    drawChart() {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDataset = this.getVisibleDatasets()[0];
        if (!visibleDataset) return;
        const data = visibleDataset.data;
        const total = data.reduce((a, b) => a + b, 0);
        if (total === 0) return;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        let startAngle = -0.5 * Math.PI;
        data.forEach((value, i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.options.colors?.[i] || 'grey';
            this.ctx.fill();
            this.chartElements.push({
                type: 'slice', centerX, centerY, radius, startAngle, endAngle,
                eventData: { label: labels[i], value, datasetLabel: visibleDataset.label, index: i, datasetIndex: 0 }
            });
            startAngle = endAngle;
        });
        if (this.options.isDoughnut) {
            const cutoutRadius = radius * (this.options.cutoutPercentage || 0.5);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, cutoutRadius, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
        }
    }
    getElementAt(mouseX, mouseY) {
        for (const el of this.chartElements) {
            const distance = Math.sqrt((mouseX - el.centerX) ** 2 + (mouseY - el.centerY) ** 2);
            if (distance > el.radius) continue;
            if (this.options.isDoughnut && distance < el.radius * (this.options.cutoutPercentage || 0.5)) continue;
            let angle = Math.atan2(mouseY - el.centerY, mouseX - el.centerX);
            if (angle < -Math.PI / 2) { angle += 2 * Math.PI; }
            if (angle >= el.startAngle && angle <= el.endAngle) {
                const midAngle = (el.startAngle + el.endAngle) / 2;
                return {
                    x: el.centerX + Math.cos(midAngle) * el.radius * 0.7,
                    y: el.centerY + Math.sin(midAngle) * el.radius * 0.7,
                    tooltip: `${el.eventData.label}: ${el.eventData.value}`,
                    eventData: el.eventData
                };
            }
        }
        return null;
    }
}
VikCraft.registerChartType('pie', PieChart);
VikCraft.registerChartType('doughnut', PieChart);

class FunnelChart extends BaseChart {
    render() { this.clearCanvas(); this.resetElements(); this.drawChart(); }
    drawChart() {
        const { canvas } = this.ctx;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        const padding = 20;
        const chartAreaHeight = canvas.height - 2 * padding;
        const segmentHeight = chartAreaHeight / dataset.length;
        const maxWidth = canvas.width - 2 * padding;
        const maxValue = Math.max(...dataset);
        let lastY = padding;
        dataset.forEach((value, i) => {
            const lastValue = (i === 0) ? maxValue : dataset[i - 1];
            const lastWidth = (lastValue / maxValue) * maxWidth;
            const currentWidth = (value / maxValue) * maxWidth;
            const x1 = (canvas.width - lastWidth) / 2;
            const x2 = (canvas.width + lastWidth) / 2;
            const x3 = (canvas.width + currentWidth) / 2;
            const x4 = (canvas.width - currentWidth) / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, lastY);
            this.ctx.lineTo(x2, lastY);
            this.ctx.lineTo(x3, lastY + segmentHeight);
            this.ctx.lineTo(x4, lastY + segmentHeight);
            this.ctx.closePath();
            this.ctx.fillStyle = this.options.colors?.[i] || 'grey';
            this.ctx.fill();
            const y = lastY + segmentHeight / 2;
            this.chartElements.push({
                x: x4, y: lastY, width: currentWidth, height: segmentHeight,
                tooltipX: canvas.width / 2, tooltipY: y, tooltip: `${labels[i]}: ${value}`,
                eventData: { label: labels[i], value, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
            this.ctx.fillStyle = this.options.labelColor || '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${labels[i]}: ${value}`, canvas.width / 2, y);
            lastY += segmentHeight;
        });
    }
}
VikCraft.registerChartType('funnel', FunnelChart);
VikCraft.registerChartType('pyramid', FunnelChart);

class CandlestickChart extends BaseChart {
    drawGridAndAxes() {
        const dataset = this.data.datasets[0].data;
        if (!dataset) return;
        const allValues = dataset.flatMap(d => [d.h, d.l]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;
        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        for (let i = 0; i <= numTicks; i++) {
            const val = minValue + (i / numTicks) * valueRange;
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(val.toFixed(2), x - 8, tickY);
        }
        this.ctx.stroke();
    }
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;
        const allValues = dataset.flatMap(d => [d.h, d.l]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;
        const getY = (value) => chartY + height - ((value - minValue) / valueRange) * height;
        const categoryWidth = width / dataset.length;
        const barWidth = categoryWidth * 0.7;
        dataset.forEach((d, i) => {
            const x = chartX + i * categoryWidth + categoryWidth * 0.15;
            const centerX = x + barWidth / 2;
            const isUp = d.c >= d.o;
            const color = isUp ? (this.options.upColor || 'green') : (this.options.downColor || 'red');
            this.ctx.strokeStyle = color;
            this.ctx.fillStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, getY(d.h));
            this.ctx.lineTo(centerX, getY(d.l));
            this.ctx.stroke();
            const bodyTop = getY(Math.max(d.o, d.c));
            const bodyBottom = getY(Math.min(d.o, d.c));
            this.ctx.fillRect(x, bodyTop, barWidth, bodyBottom - bodyTop);
            const tooltip = `O: ${d.o}, H: ${d.h}, L: ${d.l}, C: ${d.c}`;
            this.chartElements.push({
                x, y: getY(d.h), width: barWidth, height: getY(d.l) - getY(d.h),
                tooltipX: centerX, tooltipY: bodyTop, tooltip,
                eventData: { label: labels[i], value: d, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('candlestick', CandlestickChart);

class BubbleChart extends BaseChart {
    render() {
        this.clearCanvas();
        this.resetElements();
        const legendOptions = this.options.legend || {};
        const position = legendOptions.position || 'top';
        const legendDims = this.layoutLegend(false);
        const dynamicPadding = { ...this.padding };
        const spacing = 20;
        if (position === 'top') dynamicPadding.top = legendDims.height + spacing;
        if (position === 'bottom') dynamicPadding.bottom = legendDims.height + spacing;
        if (position === 'left') dynamicPadding.left = legendDims.width + spacing;
        if (position === 'right') dynamicPadding.right = legendDims.width + spacing;
        this.calculateChartArea(dynamicPadding);
        this.drawBubbleGrid();
        this.drawChart();
        this.layoutLegend(true);
    }
    drawBubbleGrid() {
        const { datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;
        const maxX = Math.max(0, ...dataset.map(p => p.x));
        const maxY = Math.max(0, ...dataset.map(p => p.y));
        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.font = '12px Arial';
        for (let i = 0; i <= numTicks; i++) {
            this.ctx.fillStyle = '#666';
            this.ctx.textAlign = 'right';
            const value = Math.round((maxY / numTicks) * i);
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(value, x - 8, tickY);
        }
        for (let i = 0; i <= numTicks; i++) {
            this.ctx.fillStyle = '#333';
            this.ctx.textAlign = 'center';
            const value = Math.round((maxX / numTicks) * i);
            const tickX = x + (i / numTicks) * width;
            this.ctx.moveTo(tickX, y);
            this.ctx.lineTo(tickX, y + height);
            this.ctx.fillText(value, tickX, y + height + 10);
        }
        this.ctx.stroke();
    }
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;
        const maxX = Math.max(0, ...dataset.map(p => p.x));
        const maxY = Math.max(0, ...dataset.map(p => p.y));
        const maxR = dataset[0].r ? Math.max(0, ...dataset.map(p => p.r)) : 0;
        const maxRadiusPixels = this.options.maxRadius || 30;
        if (maxX === 0 || maxY === 0) return;
        this.ctx.fillStyle = this.options.colors?.[0] || 'rgba(75, 192, 192, 0.6)';
        dataset.forEach((point, i) => {
            const x = chartX + (point.x / maxX) * width;
            const y = chartY + height - (point.y / maxY) * height;
            let radius = this.options.pointRadius || 5;
            if (point.r && maxR > 0) {
                radius = (point.r / maxR) * maxRadiusPixels;
            }
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            const tooltip = `(${point.x}, ${point.y})` + (point.r ? `, R: ${point.r}` : '');
            this.chartElements.push({
                x: x - radius, y: y - radius, width: radius * 2, height: radius * 2,
                tooltipX: x, tooltipY: y, tooltip,
                eventData: { value: point, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('bubble', BubbleChart);
VikCraft.registerChartType('scatter', BubbleChart);

class BoxAndWhiskerChart extends CandlestickChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;

        // This logic is now corrected to handle the simple data structure
        const allValues = dataset.flatMap(d => [d.min, d.max]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;

        const getY = (value) => chartY + height - ((value - minValue) / valueRange) * height;
        const categoryWidth = width / dataset.length;
        const boxWidth = categoryWidth * 0.5;

        dataset.forEach((item, i) => {
            const x = chartX + i * categoryWidth + (categoryWidth - boxWidth) / 2;
            const centerX = x + boxWidth / 2;
            const yMin = getY(item.min), yQ1 = getY(item.q1), yMedian = getY(item.median), yQ3 = getY(item.q3), yMax = getY(item.max);

            // Draw Whiskers
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, yMax); this.ctx.lineTo(centerX, yQ3);
            this.ctx.moveTo(x, yMax); this.ctx.lineTo(x + boxWidth, yMax);
            this.ctx.moveTo(centerX, yMin); this.ctx.lineTo(centerX, yQ1);
            this.ctx.moveTo(x, yMin); this.ctx.lineTo(x + boxWidth, yMin);
            this.ctx.stroke();

            // Use the color from the array that matches the index of the box
            this.ctx.fillStyle = this.options.colors?.[i] || 'rgba(54, 162, 235, 0.6)';
            this.ctx.fillRect(x, yQ3, boxWidth, yQ1 - yQ3);
            this.ctx.strokeRect(x, yQ3, boxWidth, yQ1 - yQ3);
            
            // Draw Median line
            this.ctx.beginPath();
            this.ctx.moveTo(x, yMedian);
            this.ctx.lineTo(x + boxWidth, yMedian);
            this.ctx.stroke();
            
            const tooltip = `Max: ${item.max}, Q3: ${item.q3}, Med: ${item.median}, Q1: ${item.q1}, Min: ${item.min}`;
            this.chartElements.push({
                x, y: yMax, width: boxWidth, height: yMin - yMax,
                tooltipX: centerX, tooltipY: yMedian, tooltip,
                eventData: { label: labels[i], value: item, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('boxAndWhisker', BoxAndWhiskerChart);

class WaterfallChart extends CandlestickChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        let runningTotal = 0;
        const runningTotals = [0, ...dataset.map(d => runningTotal += d)];
        const minValue = Math.min(0, ...runningTotals);
        const maxValue = Math.max(0, ...runningTotals);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;
        const getY = (value) => chartY + height - ((value - minValue) / valueRange) * height;
        const categoryWidth = width / (dataset.length + 1);
        const barWidth = categoryWidth * 0.7;
        let currentTotal = 0;
        dataset.forEach((value, i) => {
            const x = chartX + i * categoryWidth + (categoryWidth - barWidth) / 2;
            const yStart = getY(currentTotal);
            const yEnd = getY(currentTotal + value);
            if (labels[i].toLowerCase() === 'total' || labels[i].toLowerCase() === 'net') {
                this.ctx.fillStyle = this.options.totalColor || '#5880b9';
            } else {
                this.ctx.fillStyle = value >= 0 ? this.options.upColor || '#26a69a' : this.options.downColor || '#ef5350';
            }
            this.ctx.fillRect(x, yEnd, barWidth, yStart - yEnd);
            this.chartElements.push({
                x, y: yEnd, width: barWidth, height: yStart - yEnd,
                tooltipX: x + barWidth / 2, tooltipY: yEnd, tooltip: `${labels[i]}: ${value}`,
                eventData: { label: labels[i], value, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
            if (i < dataset.length - 1) {
                this.ctx.strokeStyle = '#999';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([2, 3]);
                this.ctx.beginPath();
                this.ctx.moveTo(x + barWidth, yEnd);
                this.ctx.lineTo(x + categoryWidth, yEnd);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            currentTotal += value;
        });
    }
}
VikCraft.registerChartType('waterfall', WaterfallChart);

class RadarChart extends BaseChart {
    render() {
        this.clearCanvas();
        this.resetElements();
        const legendOptions = this.options.legend || {};
        const position = legendOptions.position || 'top';
        const legendDims = this.layoutLegend(false);
        const dynamicPadding = { ...this.padding };
        const spacing = 20;
        if (position === 'top') dynamicPadding.top = legendDims.height + spacing;
        if (position === 'bottom') dynamicPadding.bottom = legendDims.height + spacing;
        if (position === 'left') dynamicPadding.left = legendDims.width + spacing;
        if (position === 'right') dynamicPadding.right = legendDims.width + spacing;
        this.drawRadarGrid(dynamicPadding);
        this.drawChart(dynamicPadding);
        this.layoutLegend(true);
    }
    drawRadarGrid(padding) {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const centerX = canvas.width / 2;
        const availableHeight = canvas.height - padding.top - padding.bottom;
        const centerY = padding.top + (availableHeight / 2);
        const radius = Math.min(canvas.width / 2 - padding.left, availableHeight / 2) * 0.75;
        const numLabels = labels.length;
        const angleSlice = (2 * Math.PI) / numLabels;
        const allData = visibleDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        const numTicks = 5;
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        for (let i = 1; i <= numTicks; i++) {
            const tickRadius = (i / numTicks) * radius;
            this.ctx.beginPath();
            for (let j = 0; j < numLabels; j++) {
                const x = centerX + tickRadius * Math.cos(angleSlice * j - Math.PI / 2);
                const y = centerY + tickRadius * Math.sin(angleSlice * j - Math.PI / 2);
                if (j === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
        this.ctx.strokeStyle = '#ccc';
        this.ctx.font = '12px Arial';
        labels.forEach((label, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            this.ctx.fillStyle = '#333';
            const labelX = centerX + (radius * 1.1) * Math.cos(angle);
            const labelY = centerY + (radius * 1.1) * Math.sin(angle);
            if (Math.abs(labelX - centerX) < 0.1) this.ctx.textAlign = 'center';
            else if (labelX < centerX) this.ctx.textAlign = 'right';
            else this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, labelX, labelY);
        });
    }
    drawChart(padding) {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;
        const centerX = canvas.width / 2;
        const availableHeight = canvas.height - padding.top - padding.bottom;
        const centerY = padding.top + (availableHeight / 2);
        const radius = Math.min(canvas.width / 2 - padding.left, availableHeight / 2) * 0.75;
        const numLabels = labels.length;
        const angleSlice = (2 * Math.PI) / numLabels;
        const allData = visibleDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;
        visibleDatasets.forEach((dataset, seriesIndex) => {
            const points = dataset.data.map((value, i) => {
                const distance = (value / maxValue) * radius;
                const angle = angleSlice * i - Math.PI / 2;
                return { x: centerX + distance * Math.cos(angle), y: centerY + distance * Math.sin(angle) };
            });
            this.ctx.beginPath();
            points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
            this.ctx.closePath();
            const color = this.options.colors[seriesIndex] || 'grey';
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            if (this.options.fill) {
                this.ctx.fillStyle = hexToRgba(color, 0.2);
                this.ctx.fill();
            }
            this.ctx.stroke();
            points.forEach((p, i) => {
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
                this.chartElements.push({
                    x: p.x, y: p.y, radius: 10,
                    tooltip: `${dataset.label} (${labels[i]}): ${dataset.data[i]}`,
                    eventData: { label: labels[i], value: dataset.data[i], datasetLabel: dataset.label, index: i, datasetIndex: seriesIndex }
                });
            });
        });
    }
    getElementAt(mouseX, mouseY) {
        for (const el of this.chartElements) {
            const distance = Math.sqrt((mouseX - el.x) ** 2 + (mouseY - el.y) ** 2);
            if (distance < el.radius) {
                return { x: el.x, y: el.y, tooltip: el.tooltip, eventData: el.eventData };
            }
        }
        return null;
    }
}
VikCraft.registerChartType('radar', RadarChart);

function hexToRgba(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length == 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}


class OhlcChart extends CandlestickChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;

        const allValues = dataset.flatMap(d => [d.h, d.l]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;

        const getY = (value) => chartY + height - ((value - minValue) / valueRange) * height;
        const categoryWidth = width / dataset.length;
        const barWidth = categoryWidth * 0.7;

        dataset.forEach((d, i) => {
            const x = chartX + i * categoryWidth + categoryWidth * 0.15;
            const centerX = x + barWidth / 2;

            const isUp = d.c >= d.o;
            const color = isUp ? (this.options.upColor || 'green') : (this.options.downColor || 'red');
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2; // Make lines a bit thicker

            // Draw high-low wick (the vertical line)
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, getY(d.h));
            this.ctx.lineTo(centerX, getY(d.l));
            this.ctx.stroke();

            // --- THIS IS THE ONLY CHANGE FROM CANDLESTICK ---
            // Draw open tick (short horizontal line to the left)
            this.ctx.beginPath();
            this.ctx.moveTo(x, getY(d.o));
            this.ctx.lineTo(centerX, getY(d.o));
            this.ctx.stroke();

            // Draw close tick (short horizontal line to the right)
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, getY(d.c));
            this.ctx.lineTo(x + barWidth, getY(d.c));
            this.ctx.stroke();
            // --- END OF CHANGE ---

            const tooltip = `O: ${d.o}, H: ${d.h}, L: ${d.l}, C: ${d.c}`;
            this.chartElements.push({
                x, y: getY(d.h), width: barWidth, height: getY(d.l) - getY(d.h),
                tooltipX: centerX, tooltipY: getY(d.c), tooltip,
                eventData: { label: labels[i], value: d, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('ohlc', OhlcChart);

class NightingaleChart extends BaseChart {
    // Nightingale charts have a custom render flow
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawNightingaleGrid();
        this.drawChart();
        this.layoutLegend(true);
    }

    drawNightingaleGrid() {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.75;
        const numLabels = labels.length;
        const angleSlice = (2 * Math.PI) / numLabels;
        const numTicks = 4;

        // Draw concentric circle grid lines
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        for (let i = 1; i <= numTicks; i++) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, (i / numTicks) * maxRadius, 0, 2 * Math.PI);
            this.ctx.stroke();
        }

        // Draw spokes and labels
        this.ctx.strokeStyle = '#ccc';
        this.ctx.font = '12px Arial';
        labels.forEach((label, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x2 = centerX + maxRadius * Math.cos(angle);
            const y2 = centerY + maxRadius * Math.sin(angle);
            
            this.ctx.fillStyle = '#333';
            const labelX = centerX + (maxRadius * 1.1) * Math.cos(angle);
            const labelY = centerY + (maxRadius * 1.1) * Math.sin(angle);
            
            this.ctx.save();
            this.ctx.translate(labelX, labelY);
            this.ctx.rotate(angle + Math.PI / 2); // Rotate labels to be perpendicular
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, 0, 0);
            this.ctx.restore();
        });
    }

    drawChart() {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.75;
        const numLabels = labels.length;
        const angleSlice = (2 * Math.PI) / numLabels;
        
        const allData = visibleDatasets.flatMap(d => d.data.map(item => (typeof item === 'object' ? item.value : item)));
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;

        // Draw from back to front for proper layering
        for (let i = visibleDatasets.length - 1; i >= 0; i--) {
            const dataset = visibleDatasets[i];
            const color = this.options.colors[i] || 'grey';
            
            dataset.data.forEach((item, j) => {
                const value = typeof item === 'object' ? item.value : item;
                const sliceRadius = (value / maxValue) * maxRadius;
                
                const startAngle = angleSlice * j - Math.PI / 2;
                const endAngle = angleSlice * (j + 1) - Math.PI / 2;

                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.arc(centerX, centerY, sliceRadius, startAngle, endAngle);
                this.ctx.closePath();
                
                this.ctx.fillStyle = hexToRgba(color, 0.5); // Use transparency for overlaps
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.fill();
                this.ctx.stroke();
                
                this.chartElements.push({
                    type: 'slice', centerX, centerY, radius: sliceRadius, startAngle, endAngle,
                    tooltip: `${dataset.label} (${labels[j]}): ${value}`,
                    eventData: { label: labels[j], value, datasetLabel: dataset.label, index: j, datasetIndex: i, children: item.children }
                });
            });
        }
    }

    getElementAt(mouseX, mouseY) {
        // This logic is similar to PieChart but checks against each slice's individual radius
        for (let i = this.chartElements.length - 1; i >= 0; i--) {
            const el = this.chartElements[i];
            const distance = Math.sqrt((mouseX - el.centerX) ** 2 + (mouseY - el.centerY) ** 2);
            
            // Check if mouse is within this slice's radius
            if (distance > el.radius) continue;

            let angle = Math.atan2(mouseY - el.centerY, mouseX - el.centerX);
            if (angle < -Math.PI / 2) { angle += 2 * Math.PI; } // Normalize

            if (angle >= el.startAngle && angle <= el.endAngle) {
                const midAngle = (el.startAngle + el.endAngle) / 2;
                return {
                    x: el.centerX + Math.cos(midAngle) * el.radius * 0.7,
                    y: el.centerY + Math.sin(midAngle) * el.radius * 0.7,
                    tooltip: el.tooltip,
                    eventData: el.eventData
                };
            }
        }
        return null;
    }
}
VikCraft.registerChartType('nightingale', NightingaleChart);

class ThermometerChart extends BaseChart {
    // This chart has a very simple render loop
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawChart();
    }

    drawChart() {
        const { canvas } = this.ctx;
        const data = this.data.datasets[0].data[0];
        const options = this.options;

        // --- NEW: Customizable options with defaults ---
        const thermoOpts = options.thermometer || {};
        const stemWidth = thermoOpts.stemWidth || 30;
        const glassColor = thermoOpts.glassColor || '#f0f0f0';
        const liquidColor = thermoOpts.liquidColor || options.colors?.[0] || '#e5383b';
        // ---

        const centerX = canvas.width / 2;
        const chartHeight = canvas.height * 0.8;
        const chartTop = canvas.height * 0.1;
        const bulbRadius = stemWidth * 1.5;
        const stemTop = chartTop;
        const stemBottom = chartTop + chartHeight - bulbRadius * 2;
        const stemHeight = stemBottom - stemTop;
        const bulbCenterX = centerX;
        const bulbCenterY = stemBottom + bulbRadius;
        const valueRange = data.max - data.min;
        if (valueRange <= 0) return;

        // Draw the outer glass shape
        this.ctx.strokeStyle = '#aaa';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = glassColor;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - stemWidth, stemTop);
        this.ctx.lineTo(centerX - stemWidth, stemBottom);
        this.ctx.moveTo(centerX + stemWidth, stemTop);
        this.ctx.lineTo(centerX + stemWidth, stemBottom);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(bulbCenterX, bulbCenterY, bulbRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw the colored liquid
        const valuePercentage = (data.value - data.min) / valueRange;
        const liquidHeight = valuePercentage * stemHeight;
        this.ctx.fillStyle = liquidColor;
        this.ctx.beginPath();
        this.ctx.arc(bulbCenterX, bulbCenterY, bulbRadius - 5, 0, 2 * Math.PI);
        this.ctx.fill();
        if (liquidHeight > 0) {
            this.ctx.fillRect(centerX - stemWidth + 5, stemBottom - liquidHeight, (stemWidth - 5) * 2, liquidHeight);
        }

        // Draw Scale/Ticks
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.lineWidth = 1;
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const tickValue = data.min + (i / numTicks) * valueRange;
            const tickY = stemBottom - ((tickValue - data.min) / valueRange) * stemHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + stemWidth, tickY);
            this.ctx.lineTo(centerX + stemWidth + 10, tickY);
            this.ctx.stroke();
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tickValue.toFixed(1), centerX + stemWidth + 15, tickY);
        }
        
        this.chartElements.push({
            x: 0, y: 0, width: canvas.width, height: canvas.height,
            tooltip: `Value: ${data.value}`, tooltipX: centerX, tooltipY: chartTop,
            eventData: { value: data.value, min: data.min, max: data.max }
        });
    }
}
VikCraft.registerChartType('thermometer', ThermometerChart);

class LinearGaugeChart extends BaseChart {
    // This chart has a simple render loop
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawChart();
    }

    drawChart() {
        const { canvas } = this.ctx;
        const data = this.data.datasets[0].data[0];
        const options = this.options;

        // --- NEW: Customizable options with defaults ---
        const gaugeOpts = options.gauge || {};
        const labelOpts = options.label || {};
        
        const orient = gaugeOpts.orient || 'vertical';
        const thickness = gaugeOpts.thickness || 40;
        const trackColor = gaugeOpts.trackColor || '#f0f0f0';
        const valueColor = gaugeOpts.valueColor || options.colors?.[0] || '#2a9d8f';
        const labelFont = labelOpts.font || 'bold 14px Arial';
        const labelColor = labelOpts.color || '#fff';
        // ---

        const valueRange = data.max - data.min;
        if (valueRange <= 0) return;
        const valuePercentage = (data.value - data.min) / valueRange;

        let gaugeX, gaugeY, gaugeWidth, gaugeHeight, valueWidth, valueHeight;

        if (orient === 'vertical') {
            gaugeWidth = thickness;
            gaugeHeight = canvas.height * 0.7;
            gaugeX = (canvas.width - gaugeWidth) / 2;
            gaugeY = canvas.height * 0.15;
            valueHeight = valuePercentage * gaugeHeight;
            valueWidth = gaugeWidth;
        } else { // Horizontal
            gaugeWidth = canvas.width * 0.8;
            gaugeHeight = thickness;
            gaugeX = canvas.width * 0.1;
            gaugeY = (canvas.height - gaugeHeight) / 2;
            valueWidth = valuePercentage * gaugeWidth;
            valueHeight = gaugeHeight;
        }

        // Draw the gauge track
        this.ctx.fillStyle = trackColor;
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.rect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw the value bar
        this.ctx.fillStyle = valueColor;
        if (orient === 'vertical') {
            this.ctx.fillRect(gaugeX, gaugeY + gaugeHeight - valueHeight, valueWidth, valueHeight);
        } else {
            this.ctx.fillRect(gaugeX, gaugeY, valueWidth, valueHeight);
        }

        // Draw Value Label
        this.ctx.fillStyle = labelColor;
        this.ctx.font = labelFont;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        if (orient === 'vertical') {
            this.ctx.fillText(data.value, gaugeX + gaugeWidth / 2, gaugeY + gaugeHeight - 20);
        } else {
            this.ctx.fillText(data.value, gaugeX + 25, gaugeY + gaugeHeight / 2);
        }
        
        this.chartElements.push({
            x: 0, y: 0, width: canvas.width, height: canvas.height,
            tooltip: `Value: ${data.value} (Min: ${data.min}, Max: ${data.max})`,
            tooltipX: gaugeX + gaugeWidth / 2, tooltipY: gaugeY,
            eventData: { value: data.value, min: data.min, max: data.max }
        });
    }
}
VikCraft.registerChartType('linearGauge', LinearGaugeChart);

class RadialGaugeChart extends BaseChart {
    // This chart has a very simple render loop
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawChart();
    }

    drawChart() {
        const { canvas } = this.ctx;
        const data = this.data.datasets[0].data[0];
        const options = this.options;

        // --- NEW: Customizable options with defaults ---
        const gaugeOpts = options.gauge || {};
        const arcOpts = options.arc || {};
        const needleOpts = options.needle || {};
        const labelOpts = options.label || {};

        const arcWidth = arcOpts.width || 30;
        const trackColor = arcOpts.trackColor || '#f0f0f0';
        const valueColor = arcOpts.valueColor || options.colors?.[0] || '#06d6a0';
        const needleColor = needleOpts.color || '#333';
        const pivotColor = needleOpts.pivotColor || '#333';
        const labelFont = labelOpts.font || 'bold 32px Arial';
        const labelColor = labelOpts.color || '#333';
        // ---

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 1.5;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        const startAngle = Math.PI * (5/6);
        const endAngle = Math.PI * (13/6);
        const angleRange = endAngle - startAngle;

        const valueRange = data.max - data.min;
        if (valueRange <= 0) return;

        // Draw the background arc/track
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.strokeStyle = trackColor;
        this.ctx.lineWidth = arcWidth;
        this.ctx.stroke();

        // Draw the value arc
        const valuePercentage = (data.value - data.min) / valueRange;
        const valueEndAngle = startAngle + (valuePercentage * angleRange);
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, startAngle, valueEndAngle);
        this.ctx.strokeStyle = valueColor;
        this.ctx.lineWidth = arcWidth;
        this.ctx.stroke();

        // Draw the Pointer/Needle
        const needleAngle = valueEndAngle;
        const needleLength = radius * 0.9;
        const needleX = centerX + needleLength * Math.cos(needleAngle);
        const needleY = centerY + needleLength * Math.sin(needleAngle);

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(needleX, needleY);
        this.ctx.strokeStyle = needleColor;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw the pivot circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        this.ctx.fillStyle = pivotColor;
        this.ctx.fill();

        // Draw Labels
        this.ctx.fillStyle = labelColor;
        this.ctx.font = labelFont;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(data.value, centerX, centerY + 40);

        this.ctx.font = '14px Arial';
        this.ctx.fillText(data.min, centerX - radius, centerY + 20);
        this.ctx.fillText(data.max, centerX + radius, centerY + 20);
        
        this.chartElements.push({
            x: 0, y: 0, width: canvas.width, height: canvas.height,
            tooltip: `Value: ${data.value}`, tooltipX: centerX, tooltipY: centerY - radius,
            eventData: { value: data.value, min: data.min, max: data.max }
        });
    }
}
VikCraft.registerChartType('radialGauge', RadialGaugeChart);

class HeatmapChart extends BaseChart {
    // Heatmaps have a completely custom render flow
    render() {
        this.clearCanvas();
        this.resetElements();
        
        // The legend for a heatmap is a color scale, which we handle manually
        const legendOptions = this.options.legend || {};
        if (legendOptions.show) {
            this.drawColorScaleLegend();
        }

        this.calculateChartArea(this.padding);
        this.drawHeatmapGridAndAxes();
        this.drawChart();
    }

    drawHeatmapGridAndAxes() {
        if (!this.data.xLabels || !this.data.yLabels) return;
        const { width, height, x, y } = this.chartArea;
        const cellWidth = width / this.data.xLabels.length;
        const cellHeight = height / this.data.yLabels.length;
        
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textBaseline = 'middle';

        // Draw Y-axis labels
        this.ctx.textAlign = 'right';
        this.data.yLabels.forEach((label, i) => {
            const labelY = y + i * cellHeight + cellHeight / 2;
            this.ctx.fillText(label, x - 10, labelY);
        });

        // Draw X-axis labels
        this.ctx.textAlign = 'center';
        this.data.xLabels.forEach((label, i) => {
            const labelX = x + i * cellWidth + cellWidth / 2;
            this.ctx.fillText(label, labelX, y + height + 20);
        });
    }

    // Helper function to interpolate between two colors
    getColorForValue(value, min, max, colorScale) {
        const percentage = (value - min) / (max - min);
        const startColor = colorScale[0];
        const endColor = colorScale[1];
        
        const r1 = parseInt(startColor.slice(1, 3), 16);
        const g1 = parseInt(startColor.slice(3, 5), 16);
        const b1 = parseInt(startColor.slice(5, 7), 16);

        const r2 = parseInt(endColor.slice(1, 3), 16);
        const g2 = parseInt(endColor.slice(3, 5), 16);
        const b2 = parseInt(endColor.slice(5, 7), 16);
        
        const r = Math.round(r1 + percentage * (r2 - r1));
        const g = Math.round(g1 + percentage * (g2 - g1));
        const b = Math.round(b1 + percentage * (b2 - b1));

        return `rgb(${r},${g},${b})`;
    }

    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const allData = this.data.datasets.flatMap(d => d.data);
        const minValue = Math.min(...allData);
        const maxValue = Math.max(...allData);
        
        const colorScale = this.options.colorScale || ['#e0f7fa', '#006064']; // Default: light to dark teal
        const cellWidth = width / this.data.xLabels.length;
        const cellHeight = height / this.data.yLabels.length;

        this.data.datasets.forEach((row, rowIndex) => {
            row.data.forEach((value, colIndex) => {
                const x = chartX + colIndex * cellWidth;
                const y = chartY + rowIndex * cellHeight;
                
                this.ctx.fillStyle = this.getColorForValue(value, minValue, maxValue, colorScale);
                this.ctx.fillRect(x, y, cellWidth, cellHeight);
                
                this.chartElements.push({
                    x, y, width: cellWidth, height: cellHeight,
                    tooltipX: x + cellWidth / 2, tooltipY: y + cellHeight / 2,
                    tooltip: `${this.data.yLabels[rowIndex]} - ${this.data.xLabels[colIndex]}: ${value}`,
                    eventData: { xLabel: this.data.xLabels[colIndex], yLabel: this.data.yLabels[rowIndex], value }
                });
            });
        });
    }
    
    drawColorScaleLegend() {
        const { canvas } = this.ctx;
        const allData = this.data.datasets.flatMap(d => d.data);
        const minValue = Math.min(...allData);
        const maxValue = Math.max(...allData);
        const colorScale = this.options.colorScale || ['#e0f7fa', '#006064'];

        const legendX = this.padding.left;
        const legendY = 10;
        const legendWidth = canvas.width - this.padding.left - this.padding.right;
        const legendHeight = 15;
        
        const gradient = this.ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
        gradient.addColorStop(0, colorScale[0]);
        gradient.addColorStop(1, colorScale[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(minValue, legendX, legendY + legendHeight + 15);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(maxValue, legendX + legendWidth, legendY + legendHeight + 15);
    }
}
VikCraft.registerChartType('heatmap', HeatmapChart);

class MixedBoxPlotChart extends BoxAndWhiskerChart {
    // Override axis drawing to include outliers in the scale
    drawGridAndAxes() {
        const dataset = this.data.datasets[0].data;
        if (!dataset) return;

        // Find the min/max from BOTH the box values and the outliers
        const boxValues = dataset.flatMap(d => [d.box.min, d.box.max]);
        const outlierValues = dataset.flatMap(d => d.outliers || []);
        const allValues = [...boxValues, ...outlierValues];

        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;

        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        
        for (let i = 0; i <= numTicks; i++) {
            const val = minValue + (i / numTicks) * valueRange;
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(val.toFixed(2), x - 8, tickY);
        }
        this.ctx.stroke();
    }
    
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;

        // --- 1. Calculate the correct scale ONCE, including outliers ---
        const allValues = dataset.flatMap(d => [d.box.min, d.box.max, ...(d.outliers || [])]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;
        const getY = (value) => chartY + height - ((value - minValue) / valueRange) * height;

        const categoryWidth = width / dataset.length;
        const boxWidth = categoryWidth * 0.5;

        // --- 2. Draw the boxes using the correct scale ---
        dataset.forEach((d, i) => {
            const item = d.box;
            const x = chartX + i * categoryWidth + (categoryWidth - boxWidth) / 2;
            const centerX = x + boxWidth / 2;
            const yMin = getY(item.min), yQ1 = getY(item.q1), yMedian = getY(item.median), yQ3 = getY(item.q3), yMax = getY(item.max);
            
            // This drawing logic is copied from the parent
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, yMax); this.ctx.lineTo(centerX, yQ3);
            this.ctx.moveTo(x, yMax); this.ctx.lineTo(x + boxWidth, yMax);
            this.ctx.moveTo(centerX, yMin); this.ctx.lineTo(centerX, yQ1);
            this.ctx.moveTo(x, yMin); this.ctx.lineTo(x + boxWidth, yMin);
            this.ctx.stroke();
            this.ctx.fillStyle = this.options.colors?.[i] || 'rgba(54, 162, 235, 0.6)';
            this.ctx.fillRect(x, yQ3, boxWidth, yQ1 - yQ3);
            this.ctx.strokeRect(x, yQ3, boxWidth, yQ1 - yQ3);
            this.ctx.beginPath();
            this.ctx.moveTo(x, yMedian);
            this.ctx.lineTo(x + boxWidth, yMedian);
            this.ctx.stroke();
            const tooltip = `Max: ${item.max}, Q3: ${item.q3}, Med: ${item.median}, Q1: ${item.q1}, Min: ${item.min}`;
            this.chartElements.push({
                x, y: yMax, width: boxWidth, height: yMin - yMax,
                tooltipX: centerX, tooltipY: yMedian, tooltip,
                eventData: { label: labels[i], value: item, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
        });

        // --- 3. Draw the outliers using the same correct scale ---
        this.ctx.fillStyle = this.options.outlierColor || '#ef5350';
        dataset.forEach((d, i) => {
            if (d.outliers && d.outliers.length > 0) {
                const centerX = chartX + i * categoryWidth + categoryWidth / 2;
                d.outliers.forEach(outlierValue => {
                    const jitter = (Math.random() - 0.5) * categoryWidth * 0.2;
                    const pointX = centerX + jitter;
                    const pointY = getY(outlierValue);
                    this.ctx.beginPath();
                    this.ctx.arc(pointX, pointY, 3, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.chartElements.push({
                        x: pointX - 6, y: pointY - 6, width: 12, height: 12,
                        tooltipX: pointX, tooltipY: pointY, tooltip: `Outlier: ${outlierValue}`,
                        eventData: { label: labels[i], value: outlierValue, type: 'outlier' }
                    });
                });
            }
        });
    }
}
VikCraft.registerChartType('mixedBoxPlot', MixedBoxPlotChart);

class HollowCandlestickChart extends CandlestickChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels, datasets } = this.data;
        const dataset = datasets[0].data;
        if (!dataset) return;

        const allValues = dataset.flatMap(d => [d.h, d.l]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        if (valueRange === 0) return;

        const getY = (value) => chartY + height - ((value - minValue) / valueRange) * height;
        const categoryWidth = width / dataset.length;
        const barWidth = categoryWidth * 0.7;

        dataset.forEach((d, i) => {
            const x = chartX + i * categoryWidth + categoryWidth * 0.15;
            const centerX = x + barWidth / 2;
            const isUp = d.c >= d.o;
            const upColor = this.options.upColor || 'green';
            const downColor = this.options.downColor || 'red';

            // --- Draw Wick (same for both types) ---
            this.ctx.strokeStyle = isUp ? upColor : downColor;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, getY(d.h));
            this.ctx.lineTo(centerX, getY(d.l));
            this.ctx.stroke();
            
            // --- Draw Body (DIFFERENT logic) ---
            const bodyTop = getY(Math.max(d.o, d.c));
            const bodyHeight = Math.abs(getY(d.o) - getY(d.c));

            if (isUp) {
                // For "up" candles, draw a hollow rectangle
                this.ctx.strokeStyle = upColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, bodyTop, barWidth, bodyHeight);
            } else {
                // For "down" candles, draw a filled rectangle
                this.ctx.fillStyle = downColor;
                this.ctx.fillRect(x, bodyTop, barWidth, bodyHeight);
            }
            
            const tooltip = `O: ${d.o}, H: ${d.h}, L: ${d.l}, C: ${d.c}`;
            this.chartElements.push({
                x, y: getY(d.h), width: barWidth, height: getY(d.l) - getY(d.h),
                tooltipX: centerX, tooltipY: bodyTop, tooltip,
                eventData: { label: labels[i], value: d, datasetLabel: datasets[0].label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('hollowCandlestick', HollowCandlestickChart);

class RadialBarChart extends BaseChart {
    // This chart has a custom render flow
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawRadialBarGrid();
        this.drawChart();
        this.layoutLegend(true);
    }

    drawRadialBarGrid() {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.7;
        
        const allData = visibleDatasets.flatMap(d => d.data.map(item => (typeof item === 'object' ? item.value : item)));
        const maxValue = Math.max(0, ...allData);
        const numTicks = 4;

        // Draw concentric circle grid lines and labels
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        
        for (let i = 1; i <= numTicks; i++) {
            const tickRadius = (i / numTicks) * maxRadius;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, tickRadius, 0, 2 * Math.PI);
            this.ctx.stroke();
            // Add scale labels
            this.ctx.fillText((maxValue * i / numTicks).toFixed(0), centerX, centerY - tickRadius - 5);
        }
        
        // Draw category labels
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#333';
        const angleSlice = (2 * Math.PI) / labels.length;
        labels.forEach((label, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const labelX = centerX + (maxRadius + 30) * Math.cos(angle);
            const labelY = centerY + (maxRadius + 30) * Math.sin(angle);
            this.ctx.fillText(label, labelX, labelY);
        });
    }

    drawChart() {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        const numSeries = visibleDatasets.length;
        if (numSeries === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.7;
        
        const allData = visibleDatasets.flatMap(d => d.data.map(item => (typeof item === 'object' ? item.value : item)));
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;
        
        const categoryAngle = (2 * Math.PI) / labels.length;
        const barAngle = (categoryAngle * 0.7) / numSeries; // 70% of space for bars
        const paddingAngle = categoryAngle * 0.15; // 15% padding on each side

        labels.forEach((label, i) => {
            visibleDatasets.forEach((dataset, j) => {
                const item = dataset.data[i];
                const value = typeof item === 'object' ? item.value : item;
                const barRadius = (value / maxValue) * maxRadius;

                // Calculate angles for each grouped bar
                const categoryStartAngle = i * categoryAngle - Math.PI / 2;
                const startAngle = categoryStartAngle + paddingAngle + j * barAngle;
                const endAngle = startAngle + barAngle;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, barRadius, startAngle, endAngle);
                this.ctx.strokeStyle = this.options.colors[j] || 'grey';
                this.ctx.lineWidth = 15; // Use lineWidth to create the bar thickness
                this.ctx.stroke();

                this.chartElements.push({
                    type: 'arc', centerX, centerY,
                    innerRadius: barRadius - 7.5,
                    outerRadius: barRadius + 7.5,
                    startAngle, endAngle,
                    tooltip: `${dataset.label} (${label}): ${value}`,
                    eventData: { label, value, datasetLabel: dataset.label, index: i, datasetIndex: j, children: item.children }
                });
            });
        });
    }

    getElementAt(mouseX, mouseY) {
        for (let i = this.chartElements.length - 1; i >= 0; i--) {
            const el = this.chartElements[i];
            if (el.type !== 'arc') continue;

            const distance = Math.sqrt((mouseX - el.centerX)**2 + (mouseY - el.centerY)**2);
            
            // Check if mouse is within this bar's radial bounds
            if (distance < el.innerRadius || distance > el.outerRadius) continue;

            let angle = Math.atan2(mouseY - el.centerY, mouseX - el.centerX);
            
            // Normalize angle to be positive
            if (angle < el.startAngle) { angle += 2 * Math.PI; }

            if (angle >= el.startAngle && angle <= el.endAngle) {
                const midAngle = (el.startAngle + el.endAngle) / 2;
                const midRadius = (el.innerRadius + el.outerRadius) / 2;
                return {
                    x: el.centerX + Math.cos(midAngle) * midRadius,
                    y: el.centerY + Math.sin(midAngle) * midRadius,
                    tooltip: el.tooltip,
                    eventData: el.eventData
                };
            }
        }
        return null;
    }
}
VikCraft.registerChartType('radialBar', RadialBarChart);

class TreemapChart extends BaseChart {
    constructor(ctx, data, options) {
        super(ctx, data, options);
        // Pre-calculate the color scale helper
        if (this.options.colorScale) {
            const allValues = this.getValues(this.data.root);
            this.colorScaleMin = Math.min(...allValues);
            this.colorScaleMax = Math.max(...allValues);
        }
    }
    
    // Treemaps have a custom render flow without a standard grid
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawChart();
    }

    // Recursively get all values from the data tree for color scaling
    getValues(node) {
        let values = [];
        if (node.children) {
            node.children.forEach(child => {
                values.push(...this.getValues(child));
            });
        } else {
            values.push(node.value);
        }
        return values;
    }

    // Helper to get a color for a value based on the scale
    getColorForValue(value) {
        if (!this.options.colorScale) return null;
        const percentage = (value - this.colorScaleMin) / (this.colorScaleMax - this.colorScaleMin);
        const startColor = this.options.colorScale[0];
        const endColor = this.options.colorScale[1];
        
        const r1 = parseInt(startColor.slice(1, 3), 16), g1 = parseInt(startColor.slice(3, 5), 16), b1 = parseInt(startColor.slice(5, 7), 16);
        const r2 = parseInt(endColor.slice(1, 3), 16), g2 = parseInt(endColor.slice(3, 5), 16), b2 = parseInt(endColor.slice(5, 7), 16);
        
        const r = Math.round(r1 + percentage * (r2 - r1));
        const g = Math.round(g1 + percentage * (g2 - g1));
        const b = Math.round(b1 + percentage * (b2 - b1));

        return `rgb(${r},${g},${b})`;
    }

    // The main drawing function that kicks off the recursion
    drawChart() {
        const { canvas } = this.ctx;
        const root = this.data.root;
        const area = { x: 0, y: 0, width: canvas.width, height: canvas.height };
        this.squarify(root, area);
    }

    // The treemap layout algorithm
    squarify(node, area) {
        if (!node.children || node.children.length === 0) return;

        // Create a copy and sort children by value, descending
        let children = [...node.children].sort((a, b) => b.value - a.value);
        
        let currentRow = [];
        let remainingChildren = children;

        while (remainingChildren.length > 0) {
            const rowWidth = Math.min(area.width, area.height);
            currentRow.push(remainingChildren[0]);
            remainingChildren = remainingChildren.slice(1);

            const rowSum = currentRow.reduce((sum, child) => sum + child.value, 0);
            const parentSum = node.value;
            const rowArea = (rowSum / parentSum) * area.width * area.height;
            const rowHeight = rowArea / rowWidth;

            // Layout the rectangles in the current row
            let x = area.x;
            let y = area.y;
            currentRow.forEach(child => {
                const childArea = (child.value / rowSum) * rowArea;
                const childWidth = childArea / rowHeight;
                const childRect = { x: x, y: y, width: childWidth, height: rowHeight };
                
                // Recursively call squarify for the child's children
                if (child.children) {
                    this.squarify(child, childRect);
                }
                
                // Draw the rectangle for the current child
                this.drawNode(child, childRect);
                x += childWidth;
            });
            
            // Update the remaining area for the next row
            if (area.width > area.height) {
                area.y += rowHeight;
                area.height -= rowHeight;
            } else {
                area.x += rowWidth;
                area.width -= rowWidth;
            }
            currentRow = []; // Reset for the next iteration
        }
    }

    // Helper function to draw a single rectangle and its label
    drawNode(node, rect) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        
        // Use a color from the scale if available, otherwise use a default or dataset color
        const color = this.getColorForValue(node.value) || this.options.colors?.[0] || '#0096c7';
        this.ctx.fillStyle = color;
        
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        
        // Draw label if the rectangle is large enough
        if (rect.width > 40 && rect.height > 20) {
            this.ctx.fillStyle = this.options.labelColor || '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.name, rect.x + rect.width / 2, rect.y + rect.height / 2);
        }

        this.chartElements.push({
            x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            tooltipX: rect.x + rect.width / 2, tooltipY: rect.y + rect.height / 2,
            tooltip: `${node.name}: ${node.value}`,
            eventData: { name: node.name, value: node.value, path: node.path }
        });
    }
}
VikCraft.registerChartType('treemap', TreemapChart);

class SunburstChart extends BaseChart {
    constructor(ctx, data, options) {
        super(ctx, data, options);
        // We will assign colors during the drawing phase
    }

    // Sunbursts have a custom render flow
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawChart();
        // A standard legend is not typically used; the chart is self-labeling.
    }
    
    // The main drawing function that kicks off the recursion
    drawChart() {
        const { canvas } = this.ctx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const root = this.data.root;

        // Start the recursive drawing process
        this.drawNode(root, 0, 2 * Math.PI, 0, centerX, centerY);
    }
    
    // The recursive function to draw each node and its children
    drawNode(node, startAngle, endAngle, level, centerX, centerY) {
        const radius = Math.min(centerX, centerY);
        const ringWidth = (radius * 0.8) / (this.getDepth(this.data.root)); // Width of each ring
        
        const innerRadius = level * ringWidth;
        const outerRadius = (level + 1) * ringWidth;

        // --- Draw the arc for the current node ---
        // Don't draw the root node itself, only its children
        if (level > 0) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true); // Inner arc
            this.ctx.closePath();
            
            // Determine color
            this.ctx.fillStyle = node.color || this.options.colors?.[0] || '#ccc';
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.fill();
            this.ctx.stroke();

            this.chartElements.push({
                type: 'arc', centerX, centerY, innerRadius, outerRadius, startAngle, endAngle,
                tooltip: `${node.name}: ${node.value}`,
                eventData: { name: node.name, value: node.value }
            });
        }
        
        // --- Recurse for children ---
        if (node.children && node.children.length > 0) {
            let currentAngle = startAngle;
            const totalValue = node.children.reduce((sum, child) => sum + child.value, 0);

            node.children.forEach((child, index) => {
                const angleSlice = (child.value / totalValue) * (endAngle - startAngle);
                
                // Assign a color to the child node for its descendants to use
                if(level === 0) {
                     child.color = this.options.colors[index % this.options.colors.length];
                } else {
                     child.color = lightenColor(node.color, 15);
                }
                
                this.drawNode(child, currentAngle, currentAngle + angleSlice, level + 1, centerX, centerY);
                currentAngle += angleSlice;
            });
        }
    }
    
    // Helper to find the max depth of the tree to size the rings
    getDepth(node) {
        if (!node.children || node.children.length === 0) {
            return 1;
        }
        return 1 + Math.max(...node.children.map(child => this.getDepth(child)));
    }

    getElementAt(mouseX, mouseY) {
        for (let i = this.chartElements.length - 1; i >= 0; i--) {
            const el = this.chartElements[i];
            if (el.type !== 'arc') continue;

            const distance = Math.sqrt((mouseX - el.centerX)**2 + (mouseY - el.centerY)**2);
            if (distance < el.innerRadius || distance > el.outerRadius) continue;

            let angle = Math.atan2(mouseY - el.centerY, mouseX - el.centerX);
            if (angle < el.startAngle) { angle += 2 * Math.PI; } // Normalize angle

            if (angle >= el.startAngle && angle <= el.endAngle) {
                const midAngle = (el.startAngle + el.endAngle) / 2;
                const midRadius = (el.innerRadius + el.outerRadius) / 2;
                return {
                    x: el.centerX + Math.cos(midAngle) * midRadius,
                    y: el.centerY + Math.sin(midAngle) * midRadius,
                    tooltip: el.tooltip,
                    eventData: el.eventData
                };
            }
        }
        return null;
    }
}
VikCraft.registerChartType('sunburst', SunburstChart);

// Helper function to create lighter shades for child nodes
function lightenColor(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, r + Math.floor(percent / 100 * 255));
    g = Math.min(255, g + Math.floor(percent / 100 * 255));
    b = Math.min(255, b + Math.floor(percent / 100 * 255));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}


class OrgChart extends BaseChart {
    constructor(ctx, data, options) {
        super(ctx, data, options);
        // Pan & Zoom state
        this.transform = { x: 0, y: 50, scale: 1 };
        this.isPanning = false;
        this.lastPanPosition = { x: 0, y: 0 };
        
        // --- NEW: A flag to handle the initial centering ---
        this.isInitialRender = true;
        
        // Run the layout algorithm once to prepare the data
        this.layout(this.data.root);
    }

    // This is the updated render method
    render() {
        // --- NEW: Logic to center the chart on the first draw ---
        if (this.isInitialRender) {
            // Find the full bounds of the tree
            let minX = Infinity, maxX = -Infinity;
            const findBounds = (node) => {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x);
                if (node.children) node.children.forEach(findBounds);
            };
            findBounds(this.data.root);
            
            const treeWidth = maxX - minX;
            const nodeWidth = 140; // As defined in drawNode
            
            // Calculate the initial horizontal shift to center the tree
            const canvasWidth = this.ctx.canvas.width;
            this.transform.x = (canvasWidth / 2) - ((treeWidth + nodeWidth) / 2);
            
            this.isInitialRender = false; // Ensure this only runs once
        }
        // --- End of new logic ---

        this.clearCanvas();
        this.ctx.save();
        
        this.ctx.translate(this.transform.x, this.transform.y);
        this.ctx.scale(this.transform.scale, this.transform.scale);
        
        this.resetElements();
        this.drawRecursive(this.data.root);

        this.ctx.restore();
    }

    // The main drawing function that kicks off the recursion
    drawRecursive(node) {
        // Draw the line to the parent first (so it's underneath the node)
        if (node.parent) {
            this.ctx.beginPath();
            this.ctx.moveTo(node.parent.x, node.parent.y);
            this.ctx.lineTo(node.x, node.y);
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw the node itself
        this.drawNode(node);

        // Recurse for children
        if (node.children) {
            node.children.forEach(child => this.drawRecursive(child));
        }
    }
    
    // Draws a single node box
    drawNode(node) {
        const nodeWidth = 140;
        const nodeHeight = 60;
        const x = node.x - nodeWidth / 2;
        const y = node.y - nodeHeight / 2;

        this.ctx.fillStyle = node.color || this.options.colors?.[0] || '#00b4d8';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, nodeWidth, nodeHeight, [8]); // Use roundRect for nice corners
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.name, node.x, node.y);
        
        if (node.title) {
            this.ctx.font = '12px Arial';
            this.ctx.fillText(node.title, node.x, node.y + 20);
        }
        
        this.chartElements.push({
            x, y, width: nodeWidth, height: nodeHeight,
            tooltipX: node.x, tooltipY: y, tooltip: `${node.name} - ${node.title || ''}`,
            eventData: { name: node.name, title: node.title, children: node.children }
        });
    }

    // --- Tree Layout Algorithm (Based on Buchheim-Walker) ---
    layout(root) {
        const nodeSize = { width: 160, height: 100 }; // Includes spacing
        
        function firstWalk(node, level = 0) {
            node.y = level * nodeSize.height;
            node.mod = 0;
            
            if (!node.children || node.children.length === 0) {
                node.x = 0;
                return;
            }

            let previousChild = null;
            node.children.forEach(child => {
                child.parent = node;
                firstWalk(child, level + 1);
                if (previousChild) {
                    // Position child relative to its left sibling
                    child.x = previousChild.x + nodeSize.width;
                } else {
                    child.x = 0;
                }
                previousChild = child;
            });
            
            // Center parent over its children
            const midPoint = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
            node.x = midPoint;
            
            // Push subtrees apart if they conflict
            for (let i = 0; i < node.children.length - 1; i++) {
                const leftChild = node.children[i];
                const rightChild = node.children[i+1];
                const shift = (leftChild.x + nodeSize.width) - rightChild.x;
                if(shift > 0) {
                    rightChild.x += shift;
                    rightChild.mod += shift;
                }
            }
        }
        
        function secondWalk(node, modSum = 0) {
            node.x += modSum;
            if (node.children) {
                node.children.forEach(child => {
                    secondWalk(child, modSum + node.mod);
                });
            }
        }

        firstWalk(root);
        secondWalk(root);
    }
    
    // --- Pan and Zoom Interactivity ---
    addInteractivityListeners(canvas) {
        canvas.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.lastPanPosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isPanning) return;
            const dx = e.clientX - this.lastPanPosition.x;
            const dy = e.clientY - this.lastPanPosition.y;
            this.transform.x += dx;
            this.transform.y += dy;
            this.lastPanPosition = { x: e.clientX, y: e.clientY };
            this.render(); // Re-render on pan
        });

        canvas.addEventListener('mouseup', () => { this.isPanning = false; });
        canvas.addEventListener('mouseout', () => { this.isPanning = false; });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scaleAmount = 1.1;
            const mouseX = e.clientX - canvas.getBoundingClientRect().left;
            const mouseY = e.clientY - canvas.getBoundingClientRect().top;
            
            if (e.deltaY < 0) { // Zoom in
                this.transform.scale *= scaleAmount;
            } else { // Zoom out
                this.transform.scale /= scaleAmount;
            }
            this.render(); // Re-render on zoom
        });
        
        // Also call the standard click listener for tooltips etc.
        super.addInteractivityListeners(canvas);
    }
    
    // Override base class interactivity as it needs to account for transforms
    getElementAt(mouseX, mouseY) {
        // Convert screen coordinates to canvas/world coordinates
        const worldX = (mouseX - this.transform.x) / this.transform.scale;
        const worldY = (mouseY - this.transform.y) / this.transform.scale;

        return super.getElementAt(worldX, worldY);
    }
}
VikCraft.registerChartType('org', OrgChart);

class FlowChart extends OrgChart {
    // Override the node drawing method to support different shapes
    drawNode(node) {
        const nodeWidth = 140;
        const nodeHeight = 60;
        const x = node.x;
        const y = node.y;

        this.ctx.fillStyle = node.color || this.options.colors?.[0] || '#6c757d';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        
        // --- NEW: Draw shape based on a property in the data ---
        this.ctx.beginPath();
        switch (node.shape) {
            case 'decision': // Diamond shape
                this.ctx.moveTo(x, y - nodeHeight / 2);
                this.ctx.lineTo(x + nodeWidth / 2, y);
                this.ctx.lineTo(x, y + nodeHeight / 2);
                this.ctx.lineTo(x - nodeWidth / 2, y);
                this.ctx.closePath();
                break;
            case 'terminator': // Rounded rectangle for Start/End
                this.ctx.roundRect(x - nodeWidth / 2, y - nodeHeight / 2, nodeWidth, nodeHeight, [nodeHeight / 2]);
                break;
            default: // Default to a rectangle for 'process'
                this.ctx.roundRect(x - nodeWidth / 2, y - nodeHeight / 2, nodeWidth, nodeHeight, [8]);
                break;
        }
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.name, x, y);
        
        this.chartElements.push({
            x: x - nodeWidth / 2, y: y - nodeHeight / 2, width: nodeWidth, height: nodeHeight,
            tooltipX: x, tooltipY: y - nodeHeight / 2, tooltip: node.name,
            eventData: { name: node.name, shape: node.shape }
        });
    }
    
    // Override the recursive drawing to add link labels
    drawRecursive(node) {
        // Draw the link to the parent
        if (node.parent) {
            const parentX = node.parent.x;
            const parentY = node.parent.y + 30; // Move start of line to bottom of parent node
            const childX = node.x;
            const childY = node.y - 30; // Move end of line to top of child node
            
            this.ctx.beginPath();
            this.ctx.moveTo(parentX, parentY);
            this.ctx.lineTo(childX, childY);
            this.ctx.strokeStyle = '#adb5bd';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // --- NEW: Draw label on the link ---
            if (node.linkLabel) {
                const midX = (parentX + childX) / 2;
                const midY = (parentY + childY) / 2;
                this.ctx.fillStyle = '#495057';
                this.ctx.font = 'italic 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(node.linkLabel, midX + 10, midY);
            }
        }
        
        // Draw the node itself
        this.drawNode(node);

        // Recurse for children
        if (node.children) {
            node.children.forEach(child => this.drawRecursive(child));
        }
    }
}
VikCraft.registerChartType('flow', FlowChart);

class StackedComboChart extends BaseChart {
    // This chart needs a custom grid to handle two different kinds of totals
    drawGridAndAxes() {
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0 || !labels) return;

        // Separate datasets by their specified type
        const barDatasets = visibleDatasets.filter(ds => ds.type === 'stackedBar');
        const areaDatasets = visibleDatasets.filter(ds => ds.type === 'stackedArea');

        // Calculate the max value needed for each type
        const barTotals = labels.map((_, i) => barDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const areaTotals = labels.map((_, i) => areaDatasets.reduce((sum, set) => sum + set.data[i], 0));
        
        // The final scale must accommodate the largest total from either group
        const maxValue = Math.max(0, ...barTotals, ...areaTotals);
        if (maxValue === 0) return;

        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;

        // Draw the unified Y-axis and grid
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= numTicks; i++) {
            const value = Math.round((maxValue / numTicks) * i);
            const tickY = y + height - (i / numTicks) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(value, x - 8, tickY);
        }
        this.ctx.stroke();

        // Draw the base X-axis
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ccc';
        this.ctx.moveTo(x, y + height);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.stroke();
    }

    drawChart() {
        // First, draw the stacked area chart in the background
        this.drawStackedAreas();
        // Then, draw the stacked bar chart on top
        this.drawStackedBars();
    }

    drawStackedBars() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const barDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'stackedBar');
        if (barDatasets.length === 0) return;

        const allDatasets = this.getVisibleDatasets();
        const areaDatasets = allDatasets.filter(ds => ds.type === 'stackedArea');
        const barTotals = labels.map((_, i) => barDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const areaTotals = labels.map((_, i) => areaDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const maxValue = Math.max(0, ...barTotals, ...areaTotals);
        if (maxValue === 0) return;

        const categoryWidth = width / labels.length;
        const barWidth = categoryWidth * 0.5; // Make bars a bit narrower

        labels.forEach((label, i) => {
            let currentY = chartY + height;
            const x = chartX + i * categoryWidth + (categoryWidth * 0.25); // Center the narrower bar

            barDatasets.forEach(dataset => {
                const value = dataset.data[i];
                if (value > 0) {
                    const barHeight = (value / maxValue) * height;
                    currentY -= barHeight;
                    this.ctx.fillStyle = dataset.color || 'grey';
                    this.ctx.fillRect(x, currentY, barWidth, barHeight);
                }
            });
        });
    }

    drawStackedAreas() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const areaDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'stackedArea');
        if (areaDatasets.length === 0) return;
        
        const allDatasets = this.getVisibleDatasets();
        const barDatasets = allDatasets.filter(ds => ds.type === 'stackedBar');
        const barTotals = labels.map((_, i) => barDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const areaTotals = labels.map((_, i) => areaDatasets.reduce((sum, set) => sum + set.data[i], 0));
        const maxValue = Math.max(0, ...barTotals, ...areaTotals);
        if (maxValue === 0) return;

        const getY = (value) => chartY + height - (value / maxValue) * height;
        const getX = (i) => chartX + (i / (labels.length - 1)) * width;

        const cumulativeData = [];
        areaDatasets.forEach((dataset, i) => {
            const cumulativeValues = i === 0 ? [...dataset.data] : dataset.data.map((val, j) => val + cumulativeData[i - 1][j]);
            cumulativeData.push(cumulativeValues);
        });

        for (let i = areaDatasets.length - 1; i >= 0; i--) {
            this.ctx.beginPath();
            this.ctx.fillStyle = areaDatasets[i].color || 'grey';
            const topLineData = cumulativeData[i];
            const bottomLineData = (i === 0) ? labels.map(() => 0) : cumulativeData[i - 1];
            this.ctx.moveTo(getX(0), getY(topLineData[0]));
            for (let j = 1; j < labels.length; j++) this.ctx.lineTo(getX(j), getY(topLineData[j]));
            for (let j = labels.length - 1; j >= 0; j--) this.ctx.lineTo(getX(j), getY(bottomLineData[j]));
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
}
VikCraft.registerChartType('stackedCombo', StackedComboChart);

class RadarNightingaleChart extends BaseChart {
    // This chart has a custom render flow
    render() {
        this.clearCanvas();
        this.resetElements();
        this.drawUnifiedPolarGrid();
        this.drawChart();
        this.layoutLegend(true);
    }

    // A grid that works for both chart types
    drawUnifiedPolarGrid() {
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.7;
        
        const allData = visibleDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        const numTicks = 4;

        // Draw concentric circle grid lines for scale
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        for (let i = 1; i <= numTicks; i++) {
            const tickRadius = (i / numTicks) * maxRadius;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, tickRadius, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.fillText((maxValue * i / numTicks).toFixed(0), centerX, centerY - tickRadius - 5);
        }
        
        // Draw spokes and category labels
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#333';
        const angleSlice = (2 * Math.PI) / labels.length;
        labels.forEach((label, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const labelX = centerX + (maxRadius + 30) * Math.cos(angle);
            const labelY = centerY + (maxRadius + 30) * Math.sin(angle);
            this.ctx.fillText(label, labelX, labelY);
        });
    }

    drawChart() {
        // Draw the Nightingale areas first, in the background
        this.drawNightingaleSlices();
        // Draw the Radar lines on top
        this.drawRadarLines();
    }
    
    drawNightingaleSlices() {
        const nightingaleDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'nightingale');
        if (nightingaleDatasets.length === 0) return;
        
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.7;
        const angleSlice = (2 * Math.PI) / labels.length;
        
        const allData = this.getVisibleDatasets().flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);

        nightingaleDatasets.forEach(dataset => {
            dataset.data.forEach((value, i) => {
                const sliceRadius = (value / maxValue) * maxRadius;
                const startAngle = angleSlice * i - Math.PI / 2;
                const endAngle = angleSlice * (i + 1) - Math.PI / 2;

                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.arc(centerX, centerY, sliceRadius, startAngle, endAngle);
                this.ctx.closePath();
                
                this.ctx.fillStyle = dataset.color || 'rgba(200, 200, 200, 0.5)';
                this.ctx.fill();
            });
        });
    }

    drawRadarLines() {
        const radarDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'radar');
        if (radarDatasets.length === 0) return;
        
        const { canvas } = this.ctx;
        const { labels } = this.data;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.7;
        const angleSlice = (2 * Math.PI) / labels.length;

        const allData = this.getVisibleDatasets().flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);

        radarDatasets.forEach(dataset => {
            const points = dataset.data.map((value, i) => {
                const distance = (value / maxValue) * maxRadius;
                const angle = angleSlice * i - Math.PI / 2;
                return { x: centerX + distance * Math.cos(angle), y: centerY + distance * Math.sin(angle) };
            });

            this.ctx.beginPath();
            points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
            this.ctx.closePath();
            
            this.ctx.strokeStyle = dataset.color || 'grey';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            points.forEach((p, i) => {
                this.ctx.fillStyle = dataset.color || 'grey';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        });
    }

    // A simple getElementAt that prioritizes the top layer (Radar points) would be complex.
    // For now, we omit detailed interactivity on this specific combo chart.
    getElementAt(mouseX, mouseY) {
        return null;
    }
}
VikCraft.registerChartType('radarNightingale', RadarNightingaleChart);


class AdvancedComboChart extends BaseChart {
    // Override axis drawing to create a unified scale for all types
    drawGridAndAxes() {
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        if (visibleDatasets.length === 0 || !labels) return;

        // Separate datasets by type
        const barDatasets = visibleDatasets.filter(ds => ds.type === 'stackedBar');
        const lineData = visibleDatasets.filter(ds => ds.type === 'line').flatMap(ds => ds.data);
        const areaData = visibleDatasets.filter(ds => ds.type === 'area').flatMap(ds => ds.data);

        // Calculate the maximum height of the stacked bars for each category
        const stackedBarTotals = labels.map((_, i) =>
            barDatasets.reduce((sum, set) => sum + (set.data[i] || 0), 0)
        );

        // The final scale must accommodate the largest value from any group
        const maxValue = Math.max(0, ...stackedBarTotals, ...lineData, ...areaData);
        if (maxValue === 0) return;

        // Now draw the grid using this unified max value
        const { width, height, x, y } = this.chartArea;
        const numTicks = 5;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= numTicks; i++) {
            const value = Math.round((maxValue / numTicks) * i);
            const tickY = y + height - (value / maxValue) * height;
            this.ctx.moveTo(x, tickY);
            this.ctx.lineTo(x + width, tickY);
            this.ctx.fillText(value, x - 8, tickY);
        }
        this.ctx.stroke();
        super.drawGridAndAxes(); // Call base to draw the main X-axis line
    }

    // Draw chart types in a specific order for visual clarity
    drawChart() {
        this.drawAreas();
        this.drawStackedBars();
        this.drawLines();
    }

    getUnifiedMaxValue() {
        const { labels } = this.data;
        const visibleDatasets = this.getVisibleDatasets();
        const barDatasets = visibleDatasets.filter(ds => ds.type === 'stackedBar');
        const lineData = visibleDatasets.filter(ds => ds.type === 'line').flatMap(ds => ds.data);
        const areaData = visibleDatasets.filter(ds => ds.type === 'area').flatMap(ds => ds.data);
        const stackedBarTotals = labels.map((_, i) => barDatasets.reduce((sum, set) => sum + (set.data[i] || 0), 0));
        return Math.max(0, ...stackedBarTotals, ...lineData, ...areaData);
    }

    drawStackedBars() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const barDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'stackedBar');
        if (barDatasets.length === 0) return;

        const maxValue = this.getUnifiedMaxValue();
        if (maxValue === 0) return;

        const categoryWidth = width / labels.length;
        const barWidth = categoryWidth * 0.6; // A bit narrower for combo charts

        labels.forEach((label, i) => {
            let currentY = chartY + height;
            const x = chartX + i * categoryWidth + (categoryWidth * 0.2);

            barDatasets.forEach(dataset => {
                const value = dataset.data[i] || 0;
                if (value > 0) {
                    const barHeight = (value / maxValue) * height;
                    currentY -= barHeight;
                    this.ctx.fillStyle = dataset.color || 'grey';
                    this.ctx.fillRect(x, currentY, barWidth, barHeight);
                }
            });
        });
    }

    drawAreas() {
        // This is simplified to draw single area series
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const areaDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'area');
        if (areaDatasets.length === 0) return;

        const maxValue = this.getUnifiedMaxValue();
        if (maxValue === 0) return;

        areaDatasets.forEach(dataset => {
            const getY = (value) => chartY + height - (value / maxValue) * height;
            const getX = (i) => chartX + (i / (labels.length - 1)) * width;
            
            const points = dataset.data.map((val, i) => ({ x: getX(i), y: getY(val) }));
            
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => this.ctx.lineTo(p.x, p.y));
            this.ctx.lineTo(chartX + width, chartY + height);
            this.ctx.lineTo(chartX, chartY + height);
            this.ctx.closePath();
            
            this.ctx.fillStyle = dataset.color || 'rgba(200, 200, 200, 0.5)';
            this.ctx.fill();
        });
    }

    drawLines() {
        // This is simplified to draw single line series
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const lineDatasets = this.getVisibleDatasets().filter(ds => ds.type === 'line');
        if (lineDatasets.length === 0) return;

        const maxValue = this.getUnifiedMaxValue();
        if (maxValue === 0) return;
        
        lineDatasets.forEach(dataset => {
            const getY = (value) => chartY + height - (value / maxValue) * height;
            const getX = (i) => chartX + (i / (labels.length - 1)) * width;
            const points = dataset.data.map((val, i) => ({ x: getX(i), y: getY(val) }));
            
            this.ctx.beginPath();
            points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
            
            this.ctx.strokeStyle = dataset.color || 'grey';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw points on top
            points.forEach(p => {
                this.ctx.fillStyle = dataset.color || 'grey';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        });
    }
}
VikCraft.registerChartType('advancedCombo', AdvancedComboChart);


class Bar3DChart extends BarChart {
    drawChart() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        const visibleDataset = this.getVisibleDatasets()[0];
        if (!visibleDataset) return;
        
        const dataValues = visibleDataset.data.map(item => (typeof item === 'object' ? item.value : item));
        const numBars = labels.length;
        const maxValue = Math.max(0, ...dataValues);
        if (maxValue === 0) return;

        const categoryWidth = width / numBars;
        const barWidth = categoryWidth * 0.6;
        const barSpacing = categoryWidth * 0.4;
        
        // Define the 3D perspective depth
        const depth = barWidth * 0.3;

        dataValues.forEach((value, i) => {
            const barHeight = (value / maxValue) * height;
            const x = chartX + i * categoryWidth + barSpacing / 2;
            const y = chartY + height - barHeight;
            
            const baseColor = this.options.colors?.[i] || this.options.colors?.[0] || '#3a86ff';
            
            // Darken the color for the side and top faces to create a lighting effect
            const topColor = lightenColor(baseColor, -15);
            const sideColor = lightenColor(baseColor, -30);

            // --- Draw the 3D faces ---

            // 1. Draw Top Face (a parallelogram)
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + depth, y - depth);
            this.ctx.lineTo(x + barWidth + depth, y - depth);
            this.ctx.lineTo(x + barWidth, y);
            this.ctx.closePath();
            this.ctx.fillStyle = topColor;
            this.ctx.fill();

            // 2. Draw Side Face (a parallelogram)
            this.ctx.beginPath();
            this.ctx.moveTo(x + barWidth, y);
            this.ctx.lineTo(x + barWidth + depth, y - depth);
            this.ctx.lineTo(x + barWidth + depth, chartY + height - depth);
            this.ctx.lineTo(x + barWidth, chartY + height);
            this.ctx.closePath();
            this.ctx.fillStyle = sideColor;
            this.ctx.fill();
            
            // 3. Draw Front Face (a rectangle)
            this.ctx.fillStyle = baseColor;
            this.ctx.fillRect(x, y, barWidth, barHeight);

            // Add interactivity element
            this.chartElements.push({
                x, y: y - depth, width: barWidth + depth, height: barHeight + depth,
                tooltipX: x + barWidth / 2, tooltipY: y, tooltip: `${labels[i]}: ${value}`,
                eventData: { label: labels[i], value, datasetLabel: visibleDataset.label, index: i, datasetIndex: 0 }
            });
        });
    }
}
VikCraft.registerChartType('bar3d', Bar3DChart);


class MultiBar3DChart extends BaseChart {
    constructor(ctx, data, options) {
        super(ctx, data, options);
        const perspective = this.options.perspective || {};
        this.depthX = perspective.depthX ?? 10;
        this.depthY = perspective.depthY ?? 8;
    }

    // A standard 2D grid is cleaner for this chart type.
    // The base method already handles vertical/horizontal orientation.
    drawGridAndAxes() {
        super.drawGridAndAxes();
    }

    drawChart() {
        const orient = this.options.orient || 'vertical';
        if (orient === 'vertical') {
            this.drawVerticalBars();
        } else {
            this.drawHorizontalBars();
        }
    }
    
    drawVerticalBars() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        
        // --- FIX: Filter to only include bar datasets ---
        const barDatasets = this.getVisibleDatasets().filter(ds => ds.type !== 'line' && ds.type !== 'area');
        if (barDatasets.length === 0) return;
        
        const allData = barDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;

        const numCategories = labels.length;
        const numSeries = barDatasets.length;
        
        const categoryWidth = width / numCategories;
        const groupPadding = 0.2;
        const groupWidth = categoryWidth * (1 - groupPadding);
        const barWidth = groupWidth / numSeries;

        labels.forEach((label, i) => {
            const categoryStartX = chartX + i * categoryWidth + (categoryWidth * groupPadding / 2);
            barDatasets.forEach((dataset, j) => {
                const value = dataset.data[i];
                const barHeight = (value / maxValue) * height;
                const x = categoryStartX + j * barWidth;
                const y = chartY + height - barHeight;
                this.draw3DBar(x, y, barWidth, barHeight, dataset.color || this.options.colors[j]);
            });
        });
    }

    drawHorizontalBars() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        
        // --- FIX: Filter to only include bar datasets ---
        const barDatasets = this.getVisibleDatasets().filter(ds => ds.type !== 'line' && ds.type !== 'area');
        if (barDatasets.length === 0) return;

        const allData = barDatasets.flatMap(d => d.data);
        const maxValue = Math.max(0, ...allData);
        if (maxValue === 0) return;

        const numCategories = labels.length;
        const numSeries = barDatasets.length;
        
        const categoryHeight = height / numCategories;
        const groupPadding = 0.2;
        const groupHeight = categoryHeight * (1 - groupPadding);
        const barHeight = groupHeight / numSeries;
        
        labels.forEach((label, i) => {
            const categoryStartY = chartY + i * categoryHeight + (categoryHeight * groupPadding / 2);
            barDatasets.forEach((dataset, j) => {
                const value = dataset.data[i];
                const barWidth = (value / maxValue) * width;
                const x = chartX;
                const y = categoryStartY + j * barHeight;
                this.draw3DHorizontalBar(x, y, barWidth, barHeight, dataset.color || this.options.colors[j]);
            });
        });
    }

    // Helper for vertical bars
    draw3DBar(x, y, barWidth, barHeight, color) {
        if (!color) color = '#cccccc';
        const topColor = lightenColor(color, -15);
        const sideColor = lightenColor(color, -30);
        
        // Draw Top Face
        this.ctx.fillStyle = topColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + this.depthX, y - this.depthY);
        this.ctx.lineTo(x + barWidth + this.depthX, y - this.depthY);
        this.ctx.lineTo(x + barWidth, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw Side Face
        this.ctx.fillStyle = sideColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x + barWidth, y);
        this.ctx.lineTo(x + barWidth + this.depthX, y - this.depthY);
        this.ctx.lineTo(x + barWidth + this.depthX, y + barHeight - this.depthY);
        this.ctx.lineTo(x + barWidth, y + barHeight);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw Front Face
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Helper for horizontal bars
    draw3DHorizontalBar(x, y, barWidth, barHeight, color) {
        if (!color) color = '#cccccc';
        const topColor = lightenColor(color, -15);
        const sideColor = lightenColor(color, -30); // This is the bottom face in this orientation

        // --- NEW DRAWING ORDER ---

        // 1. Draw Front Face FIRST
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // 2. Draw Top Face (The "Roof")
        this.ctx.fillStyle = topColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + this.depthX, y - this.depthY);
        this.ctx.lineTo(x + barWidth + this.depthX, y - this.depthY);
        this.ctx.lineTo(x + barWidth, y);
        this.ctx.closePath();
        this.ctx.fill();

        // 3. Draw Bottom Face
        this.ctx.fillStyle = sideColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + barHeight);
        this.ctx.lineTo(x + this.depthX, y + barHeight - this.depthY);
        this.ctx.lineTo(x + barWidth + this.depthX, y + barHeight - this.depthY);
        this.ctx.lineTo(x + barWidth, y + barHeight);
        this.ctx.closePath();
        this.ctx.fill();
    }
}
VikCraft.registerChartType('multiBar3d', MultiBar3DChart);

class Mixed3DChart extends MultiBar3DChart {
    // Override the main drawChart method to orchestrate the layers
    drawChart() {
        // 1. Draw the 3D bars in the background by calling the parent's method
        super.drawChart();
        
        // 2. Draw the 2D line chart on the "front plane"
        this.drawFrontLine();
    }

    drawFrontLine() {
        const { width, height, x: chartX, y: chartY } = this.chartArea;
        const { labels } = this.data;
        
        // Find the dataset specifically marked as 'line'
        const lineDataset = this.getVisibleDatasets().find(ds => ds.type === 'line');
        if (!lineDataset) return;
        
        const allBarData = this.getVisibleDatasets()
            .filter(ds => ds.type !== 'line')
            .flatMap(d => d.data);
            
        // The scale must accommodate both the bar data and the line data
        const maxValue = Math.max(0, ...allBarData, ...lineDataset.data);
        if (maxValue === 0) return;

        const getY = (value) => chartY + height - (value / maxValue) * height;
        const getX = (i) => chartX + i * (width / (labels.length -1));

        const points = lineDataset.data.map((val, i) => ({ x: getX(i), y: getY(val) }));

        // Draw the line
        this.ctx.beginPath();
        points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
        this.ctx.strokeStyle = lineDataset.color || 'red';
        this.ctx.lineWidth = 3; // Make the line thick to stand out
        this.ctx.stroke();

        // Draw points on the line
        points.forEach(p => {
            this.ctx.fillStyle = lineDataset.color || 'red';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
}
VikCraft.registerChartType('mixed3d', Mixed3DChart);