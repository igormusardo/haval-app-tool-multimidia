import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';

import { Chart, registerables } from 'chart.js';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables, streamingPlugin);

export const graphList = [
    {id: 'evConsumption', displayLabel: 'Consumo EV', dataKey: 'evConsumption', unity: '%', decimalPlaces: 0 },
    {id: 'gasConsumption', displayLabel: 'Consumo Combustão', dataKey: 'gasConsumption', unity: 'km/l' , decimalPlaces: 1 },
    {id: 'carSpeed', displayLabel: 'Velocidade', dataKey: 'carSpeed', unity: 'km/h', decimalPlaces: 0 },
];

const graphController = {
    chartInstance: null,
    currentDataKey: null,
    unsubscribeFromData: null,
    isInitialized: false,

    init(canvasContext) {
        if (this.isInitialized) return;

        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: { datasets: [{
                label: '',
                backgroundColor: 'rgba(0, 120, 255, 0.15)',
                borderColor: '#00c3ff',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.3,
                shadowColor: 'rgba(0, 195, 255, 0.5)',
                shadowBlur: 10,
            }]},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    streaming: {
                        duration: 20000,
                        refresh: 500,
                        frameRate: 30
                    },
                },
                scales: {
                    x: {
                        type: 'realtime',
                        display: false
                    },
                    y: {
                        min: -20,
                        max: 120,
                        ticks: {
                            display: true,
                            padding: 10,
                            stepsSize: 10,
                            color: 'rgba(100,172,255,0.7)',
                        },
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: false,
                            color: 'rgba(0,160,255,0.3)',
                            zeroLineColor: 'rgba(100, 172, 255, 0.8)',
                            zeroLineWidth: 3
                        },
                    }
                }
            }
        });
        this.isInitialized = true;
    },

    switchTo(graphId) {
        if (!this.isInitialized) {
            return;
        }

        const graphInfo = graphList.find(g => g.id === graphId);
        if (!graphInfo || graphInfo.dataKey === this.currentDataKey) {
            return;
        }

        if (graphId === 'gasConsumption') {
            this.chartInstance.options.scales.y.min = 0;
            this.chartInstance.options.scales.y.max = null;
            this.chartInstance.options.scales.y.grace = '50%';
            graphInfo.unity = getState('gasConsumptionMetric');
        } else if (graphId === 'carSpeed') {
            this.chartInstance.options.scales.y.min = 0;
            this.chartInstance.options.scales.y.max = null;
            this.chartInstance.options.scales.y.stepsSize = 1;
            this.chartInstance.options.scales.y.grace = '50%';
        } else if (graphId === 'evConsumption') {
            this.chartInstance.options.scales.y.min = -100;
            this.chartInstance.options.scales.y.max = 100;
            this.chartInstance.options.scales.y.grace = '100%';
        } else {
            this.chartInstance.options.scales.y.min = 0;
            this.chartInstance.options.scales.y.max = 100;
            this.chartInstance.options.scales.y.grace = '50%';

        }

        const tooltipEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip');
        const lineEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip-line');
        if (tooltipEl && lineEl) {
            tooltipEl.style.opacity = 0;
            lineEl.style.opacity = 0;
        }

        if (this.dataUpdater) {
            clearInterval(this.dataUpdater);
            this.dataUpdater = null;
        }

        this.currentDataKey = graphInfo.dataKey;
        this.chartInstance.canvas.style.transition = 'opacity 0.3s ease-out';
        this.chartInstance.canvas.style.opacity = 0;

        setTimeout(() => {
            this.chartInstance.data.datasets[0].label = graphInfo.displayLabel;
            this.chartInstance.data.datasets[0].data = [];
            this.chartInstance.update({ duration: 0 });

            this.dataUpdater = setInterval(() => {
                if (!this.chartInstance) return;

                const currentValue = getState(this.currentDataKey);
                if (currentValue === undefined) return;

                this.chartInstance.data.datasets[0].data.push({
                    x: Date.now(),
                    y: currentValue
                });

                const tooltipEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip');
                const lineEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip-line');

                if (tooltipEl && lineEl) {
                    const yAxis = this.chartInstance.scales.y;
                    const newYpos = yAxis.getPixelForValue(currentValue) + 5;

                    tooltipEl.textContent = currentValue.toFixed(graphInfo.decimalPlaces || 0) + " " + graphInfo.unity;
                    tooltipEl.style.opacity = 1;

                    lineEl.style.top = `${newYpos}px`;
                    lineEl.style.opacity = 1;
                }

            });

            this.chartInstance.canvas.style.opacity = 1;
        }, 100);
    },

    cleanup() {
        if (this.unsubscribeFromData) {
            this.unsubscribeFromData();
            this.unsubscribeFromData = null;
        }

        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        this.isInitialized = false;
        this.currentDataKey = null;
    }

};

export function createGraphScreen() {

    var main = div({className: 'main-container'});

    const container = div({className: 'graph-screen'});

    const graphProgressRing = div({className: 'graph-progress-ring'});
    graphProgressRing.id = 'graph-progress-ring';
    container.appendChild(graphProgressRing);

    const divider = div({className: 'graph-selector-line'});
    const outerRing = div({className: 'graph-outer-ring'});
    const innerRingShadow = div({className: 'graph-inner-ring-shadow'});
    const innerRing = div({className: 'graph-inner-ring'});

    const dynamicTooltip = div({ className: 'dynamic-tooltip' });
    innerRing.appendChild(dynamicTooltip);
    const dynamicTooltipLine = div({ className: 'dynamic-tooltip-line' });
    innerRing.appendChild(dynamicTooltipLine);

    const canvas = document.createElement('canvas');
    canvas.className = 'graph-chart';
    canvas.id = 'graph-chart';
    innerRing.appendChild(canvas);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    const bulletContainer = div({ className: 'graph-bullet-container' });
    const bulletElements = {};

    graphList.forEach((itemData) => {
        const bulletEl = div({
            id: `bullet-${itemData.id}`,
            className: 'graph-bullet',
            'data-id': itemData.id
        });
        bulletContainer.appendChild(bulletEl);
        bulletElements[itemData.id] = bulletEl;
    });

    container.appendChild(bulletContainer);

    const graphTitleLabel = div({ className: 'graph-title-label' });
    container.appendChild(graphTitleLabel);

    setTimeout(() => {
        const ctx = document.getElementById('graph-chart');
        if (ctx) {
            graphController.init(ctx);
            graphController.switchTo(getState('currentGraph'));
        }

        subscribe('currentGraph', (newGraphId) => {
            graphController.switchTo(newGraphId);
            updateFocus(newGraphId);
        });

        updateFocus(getState('currentGraph'));

    }, 0);

   main.cleanup = () => {
        graphController.cleanup();
    };

    const updateFocus = (currentGraphId) => {
        Object.values(bulletElements).forEach(bullet => {
            if (bullet.dataset.id === currentGraphId) {
                bullet.classList.add('active');
            } else {
                bullet.classList.remove('active');
            }
        });

        const currentItem = graphList.find(item => item.id === currentGraphId);
        if (currentItem) {
            var currentLabel = currentItem.displayLabel;
        }
        graphTitleLabel.textContent = currentLabel;
    };

    return main;
}
