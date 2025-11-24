import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';

import { Chart, registerables } from 'chart.js';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables, streamingPlugin);

export const regenItems = [
    {id: 'Alto', displayLabel: 'ALTO'},
    {id: 'Normal', displayLabel: 'NORMAL'},
    {id: 'Baixo', displayLabel: 'BAIXO'},
];

const regenChartController = {
    chartInstance: null,
    isInitialized: false,
    watchdogTimer: null,
    unsubscribeFromData: null,

    init(canvasContext) {
        if (this.isInitialized) return;

        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Regen Power',
                    backgroundColor: 'rgba(0, 120, 255, 0.1)',
                    borderColor: 'rgba(0, 195, 255, 0.3)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    streaming: {
                        duration: 30000,
                        refresh: 1000,
                    }
                },
                scales: {
                    x: { type: 'realtime', display: false },
                    y: {
                        min: -10,
                        max: 110,
                        grace: 20,
                        display: true,
                        ticks: {
                            stepSize: 10,
                            padding: 17,
                            color: 'rgba(100,172,255,0.7)',
                            callback: function(value, index, ticks) { return value >= 30 && value <= 70 ? value : ''; },

                        },
                        grid: {
                          display: true,
                          drawOnChartArea: true,
                          drawTicks: true,
                          color: 'rgba(0,160,255,0.1)'
                        },
                    }
                }
            }
        });

        this.isInitialized = true;
        this.startDataSubscription();
    },

    startDataSubscription() {
        if (!this.isInitialized || this.dataUpdater) return;

        this.dataUpdater = setInterval(() => {
            if (!this.chartInstance) return;

            const data = this.chartInstance.data.datasets[0].data;
            const newValue = getState('lastRegenValue') || 0;

            data.push({
                x: Date.now(),
                y: newValue
            });

            while (data.length > 30) {
                data.shift();
            }

            this.chartInstance.update('quiet');
        }, 1000);
    },

    cleanup() {
        if (this.dataUpdater) {
            clearInterval(this.dataUpdater);
            this.dataUpdater = null;
        }
        if(this.chartInstance) {
            this.chartInstance.destroy();
        }
        this.isInitialized = false;
        this.chartInstance = null;
    }
};

export function createRegenScreen() {

    const regenStatus = getState('regenMode');

    var main = div({className: 'main-container'});
    const container = div({className: 'regen-screen'});

    const regenProgressRing = div({className: 'regen-progress-ring'});
    regenProgressRing.id = 'regen-progress-ring';
    container.appendChild(regenProgressRing);

    const divider = div({className: 'regen-selector-line'});
    const outerRing = div({className: 'regen-outer-ring'});
    const innerRingShadow = div({className: 'regen-inner-ring-shadow'});
    const innerRing = div({className: 'regen-inner-ring'});

    const canvas = document.createElement('canvas');
    canvas.className = 'regen-chart';
    canvas.id = 'regen-chart';
    innerRing.appendChild(canvas);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    const itemElements = {};
    regenItems.forEach((itemData, index) => {
        const isFocused = itemData.id === regenStatus;

        const itemEl = div({
            id: itemData.id,
            className: `regen-item ${isFocused ? 'focused' : ''}`,
            'data-index': index,
            children: [
                span({
                    className: 'regen-label',
                    children: [itemData.displayLabel]
                })
            ]
        });

        innerRing.appendChild(itemEl);
        itemElements[itemData.id] = itemEl;
    });

    const onePedalInstruction = div({
        className: 'one-pedal-instruction',
        children: [
            'Long press ',
            span({
                className: 'font-bold',
                children: ['OK']
            }),
            ' toggles One-Pedal'
        ]
    });
    innerRing.appendChild(onePedalInstruction);

    const onePedalModeLabel = div({
        id: 'one-pedal-mode-label',
        className: `one-pedal-mode-label ${getState('onepedal') ? '' : 'hidden'}`,
        children: ['One-Pedal']
    });
    innerRing.appendChild(onePedalModeLabel);

    innerRing.appendChild(divider);

    setTimeout(() => {
        const ctx = document.getElementById('regen-chart');
        if (ctx) {
            regenChartController.init(ctx);
        }
    }, 0);

    const updateFocus = (regenStatus) => {
        Object.values(itemElements).forEach(el => {
            if (el.id === regenStatus) {
                el.classList.add('focused');
            } else {
                el.classList.remove('focused');
            }
        });
        updateProgressRings();
    };

    updateFocus(regenStatus);
    const unsubscribe = subscribe('regenMode', updateFocus);

    const toggleOnePedalView = (isOnePedalActive) => {
        const elementsToHide = [
            ...Object.values(itemElements),
            divider,
            regenProgressRing
        ];

        const onePedalLabel = document.getElementById('one-pedal-mode-label');

        if (isOnePedalActive) {
            elementsToHide.forEach(el => el.classList.add('hidden'));
            if (onePedalLabel) onePedalLabel.classList.remove('hidden');
        } else {
            elementsToHide.forEach(el => el.classList.remove('hidden'));
            if (onePedalLabel) onePedalLabel.classList.add('hidden');
            updateFocus(getState('regenMode'));
        }
    };
    const unsubscribeOnePedal = subscribe('onepedal', toggleOnePedalView);
    toggleOnePedalView(getState('onepedal'));

    main.cleanup = () => {
        unsubscribe();
        unsubscribeOnePedal();
        regenChartController.cleanup();
    };

    return {
        element: main,
        onMount: () => { updateProgressRings(); }
    };

}


export function updateProgressRings() {
    const regenRing = document.getElementById('regen-progress-ring');

    var position = 0;
    const regenMode = getState('regenMode');
    regenItems.forEach((itemData, index) => {
        if (itemData.id === regenMode) {
            position = 3 - index;
        }
    });

    if (regenRing) {
        regenRing.style.setProperty('--regen-segment-active-level', position);
    }

}