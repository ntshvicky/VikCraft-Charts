// vikcraft-chart-3d.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

class VikCraft3D {
    constructor(element, config) {
        this.element = element;
        this.config = config;
        this.interactiveObjects = [];
        this.intersected = null;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);

        this.camera = new THREE.PerspectiveCamera(75, this.element.clientWidth / this.element.clientHeight, 0.1, 1000);
        this.camera.position.set(10, 8, 15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
        this.element.appendChild(this.renderer.domElement);
        
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(this.element.clientWidth, this.element.clientHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.element.appendChild(this.labelRenderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.addLighting();
        this.addGridAndAxes();

        // Router to create the correct chart type
        switch (config.type) {
            case 'scatter3d':
                this.createScatterPlot(config.data);
                break;
            case 'bar3d':
                this.createBarChart(config.data);
                break;
            case 'line3d':
                this.createLineChart(config.data);
                break;
            case 'pie3d':
                this.createPieChart(config.data);
                break;
            default:
                console.error(`3D chart type "${config.type}" is not supported.`);
        }
        
        this.createLegend(config.data);
        this.setupInteractivity();
        this.animate();
        new ResizeObserver(() => this.onResize()).observe(this.element);
    }

    addLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);
    }

    addGridAndAxes() {
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);
        const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
    }
    
    createTextLabel(text, position) {
        const div = document.createElement('div');
        div.className = 'chart-label';
        div.textContent = text;
        
        const label = new CSS2DObject(div);
        label.position.copy(position);
        
        return label;
    }

    createScatterPlot(data) {
        const pointGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        data.datasets.forEach((dataset, i) => {
            const material = new THREE.MeshStandardMaterial({
                color: this.config.options.colors[i] || 0xcccccc
            });
            dataset.data.forEach(point => {
                const sphere = new THREE.Mesh(pointGeometry, material);
                sphere.position.set(point.x, point.y, point.z);

                sphere.userData = {
                    type: 'point',
                    datasetLabel: dataset.label,
                    value: point
                };

                this.scene.add(sphere);
                this.interactiveObjects.push(sphere);
            });
        });
    }

    createBarChart(data) {
        const datasets = data.datasets;
        const allValues = datasets.flatMap(ds => ds.data);
        const maxValue = Math.max(...allValues);

        const barDepth = 1, barWidth = 1;
        const spacingZ = 2, spacingX = 2;

        datasets.forEach((dataset, zIndex) => {
            const material = new THREE.MeshStandardMaterial({
                color: this.config.options.colors[zIndex] || 0xcccccc
            });
            dataset.data.forEach((value, xIndex) => {
                const barHeight = (value / maxValue) * 10;
                const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
                const bar = new THREE.Mesh(geometry, material);
                bar.position.set(xIndex * spacingX, barHeight / 2, zIndex * spacingZ);
                
                bar.userData = {
                    type: 'bar',
                    datasetLabel: dataset.label,
                    category: data.labels[xIndex],
                    value: value
                };

                const labelPosition = new THREE.Vector3(bar.position.x, bar.position.y + barHeight / 2 + 0.5, bar.position.z);
                const label = this.createTextLabel(value, labelPosition);
                bar.add(label);

                this.scene.add(bar);
                this.interactiveObjects.push(bar);
            });
        });
    }

    createLineChart(data) {
        const datasets = data.datasets;

        datasets.forEach((dataset, i) => {
            const points = dataset.data.map(p => new THREE.Vector3(p.x, p.y, p.z));
            
            let geometry;
            if (this.config.options.spline) {
                const curve = new THREE.CatmullRomCurve3(points);
                const curvePoints = curve.getPoints(50); 
                geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
            } else {
                geometry = new THREE.BufferGeometry().setFromPoints(points);
            }

            const material = new THREE.LineBasicMaterial({
                color: this.config.options.colors[i] || 0xcccccc,
                linewidth: 2
            });

            const line = new THREE.Line(geometry, material);
            line.userData = {
                type: 'line',
                datasetLabel: dataset.label,
                value: dataset.data,
                isLine: true
            };
            
            this.scene.add(line);
            this.interactiveObjects.push(line);
        });
    }

    createPieChart(data) {
        const dataset = data.datasets[0].data;
        const total = dataset.reduce((sum, val) => sum + val, 0);
        const pieOptions = this.config.options.pie || {};
        
        const pieRadius = 5;
        const pieDepth = pieOptions.depth || 1;
        const sliceSeparation = 0.2;

        let currentAngle = 0;

        dataset.forEach((value, i) => {
            const sliceAngle = (value / total) * (2 * Math.PI);
            
            const sliceShape = new THREE.Shape();
            sliceShape.moveTo(0, 0);
            sliceShape.arc(0, 0, pieRadius, currentAngle, currentAngle + sliceAngle);
            sliceShape.lineTo(0, 0);

            const extrudeSettings = {
                depth: pieDepth,
                bevelEnabled: false
            };

            const geometry = new THREE.ExtrudeGeometry(sliceShape, extrudeSettings);
            const material = new THREE.MeshStandardMaterial({
                color: this.config.options.colors[i] || 0xcccccc,
                roughness: 0.6
            });

            const slice = new THREE.Mesh(geometry, material);
            slice.rotation.x = -Math.PI / 2;

            const midAngle = currentAngle + sliceAngle / 2;
            slice.position.x = Math.cos(midAngle) * sliceSeparation;
            slice.position.z = Math.sin(midAngle) * sliceSeparation;
            
            slice.userData = {
                type: 'pieSlice',
                datasetLabel: data.labels[i],
                value: value,
                percentage: (value / total) * 100
            };

            const labelRadius = pieRadius * 0.7;
            const labelPosition = new THREE.Vector3(
                (Math.cos(midAngle) * labelRadius) + slice.position.x,
                pieDepth / 2,
                (Math.sin(midAngle) * labelRadius) + slice.position.z
            );
            const label = this.createTextLabel(`${data.labels[i]}: ${value}`, labelPosition);
            slice.add(label);
            
            this.scene.add(slice);
            this.interactiveObjects.push(slice);

            currentAngle += sliceAngle;
        });
    }

    createLegend(data) {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'vc-legend';
        
        const datasets = this.config.type === 'pie3d'
            ? [{ data: data.datasets[0].data, labels: data.labels }]
            : data.datasets;

        datasets.forEach((dataset, i) => {
            const labels = this.config.type === 'pie3d' ? dataset.labels : [dataset.label];
            const colors = this.config.options.colors;

            if (this.config.type === 'pie3d') {
                labels.forEach((label, j) => {
                    const legendItem = this.createLegendItem(label, colors[j], j);
                    legendContainer.appendChild(legendItem);
                });
            } else {
                 const legendItem = this.createLegendItem(dataset.label, colors[i], i);
                 legendContainer.appendChild(legendItem);
            }
        });

        this.element.style.position = 'relative';
        this.element.appendChild(legendContainer);
    }
    
    createLegendItem(label, color, index) {
        const item = document.createElement('div');
        item.className = 'vc-legend-item';
        item.innerHTML = `<span class="vc-legend-color" style="background-color: #${new THREE.Color(color).getHexString()}"></span> ${label}`;
        item.dataset.index = index;

        item.addEventListener('click', () => {
            const objectsToToggle = this.interactiveObjects.filter(obj => {
                return (this.config.type === 'pie3d' && obj.userData.datasetLabel === label) ||
                       (this.config.type !== 'pie3d' && obj.userData.datasetLabel === label);
            });

            objectsToToggle.forEach(obj => {
                obj.visible = !obj.visible;
                obj.children.forEach(child => { if(child instanceof CSS2DObject) child.visible = obj.visible; });
            });
            item.classList.toggle('disabled');
        });
        return item;
    }

    setupInteractivity() {
        this.element.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.element.addEventListener('click', this.onMouseClick.bind(this), false);
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects.filter(o => o.visible));

        if (intersects.length > 0) {
            const newIntersected = intersects[0].object;
            if (this.intersected !== newIntersected) {
                this.clearHoverEffect();
                this.applyHoverEffect(newIntersected);
                this.intersected = newIntersected;
            }
        } else {
            this.clearHoverEffect();
            this.intersected = null;
        }
    }
    
    onMouseClick() {
        if (this.intersected) {
            const event = new CustomEvent('viz-click', {
                detail: this.intersected.userData,
                bubbles: true,
                composed: true
            });
            this.element.dispatchEvent(event);
        }
    }

    applyHoverEffect(object) {
        if (object.userData.isLine) return; 
        object.currentHex = object.material.emissive.getHex();
        object.material.emissive.setHex(0x555555);
    }

    clearHoverEffect() {
        if (this.intersected && !this.intersected.userData.isLine) {
            this.intersected.material.emissive.setHex(this.intersected.currentHex);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = this.element.clientWidth / this.element.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
        this.labelRenderer.setSize(this.element.clientWidth, this.element.clientHeight);
    }
}

export default VikCraft3D;