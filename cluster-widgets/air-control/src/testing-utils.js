import { setState, stateManager } from './state.js';
import { menuItems } from './components/mainMenu.js';

const focusableAreas = {
  main_menu: menuItems.map(item => item.id),
  ac_control: ['fan', 'temp'],
  regen: ['Baixo', 'Normal', 'Alto'],
  graph: ['evConsumption', 'gasConsumption', 'carSpeed']
};

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const currentState = stateManager.getState();
  const currentScreen = currentState.screen;

  if (e.key === 'Backspace') {
      if (currentScreen !== 'main_menu') {
          window.showScreen('main_menu');
      }
      return;
  }

  if (currentScreen === 'main_menu') {
      const menuItems = focusableAreas.main_menu;
      const currentIndex = menuItems.indexOf(currentState.focusedMenuItem);

      if (e.key === 'ArrowUp') {
          const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
          window.focus(menuItems[prevIndex]);
      } else if (e.key === 'ArrowDown') {
          const nextIndex = (currentIndex + 1) % menuItems.length;
          window.focus(menuItems[nextIndex]);

      } else if (e.key === 'Enter') {
          if (currentState.focusedMenuItem === 'option_1') {
              const currentStatus = stateManager.getState().espStatus;
              const newStatus = (currentStatus === 'ON') ? 'OFF' : 'ON';
              setState('espStatus', newStatus);
          } else if (currentState.focusedMenuItem === 'option_2') {
              const modes = ['HEV', 'PHEV', 'EV'];
              const currentMode = stateManager.getState().evMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              setState('evMode', newMode);
          } else if (currentState.focusedMenuItem === 'option_3') {
              const modes = ['Normal', 'Eco', 'Sport'];
              const currentMode = stateManager.getState().drivingMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              setState('drivingMode', newMode);
          } else if (currentState.focusedMenuItem === 'option_4') {
              window.showScreen('aircon');
          } else if (currentState.focusedMenuItem === 'option_5') {
              const modes = ['Normal', 'Conforto', 'Esportiva'];
              const currentMode = stateManager.getState().steerMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              setState('steerMode', newMode);
          } else if (currentState.focusedMenuItem === 'option_6') {
              window.showScreen('regen');
          } else if (currentState.focusedMenuItem === 'option_7') {
              window.showScreen('graph');
          }


      }
  }

  else if (currentScreen === 'aircon') {
      const focusedArea = currentState.focusArea;

      if (e.key === 'Enter') {
          const controls = focusableAreas.ac_control;
          const currentIndex = controls.indexOf(focusedArea);
          const nextIndex = (currentIndex + 1) % controls.length;
          window.focus(controls[nextIndex]);
      } else if (e.key === ' ') {
           e.preventDefault();
           const newAutoModeState = (currentState.auto == 0 ? 1 : 0);
           setState('auto', newAutoModeState);
      }

      switch (focusedArea) {
          case 'fan':
              const currentFan = parseInt(currentState.fan, 10) || 0;
              if (e.key === 'ArrowUp' && currentFan < 7) {
                  window.control('fan', String(currentFan + 1));
              } else if (e.key === 'ArrowDown' && currentFan > 0) {
                  window.control('fan', String(currentFan - 1));
              }
              break;

          case 'temp':
              const currentTemp = parseFloat(currentState.temp) || 21.0;
              if (e.key === 'ArrowUp' && currentTemp < 26.0) {
                  window.control('temp', (currentTemp + 0.5).toFixed(1));
              } else if (e.key === 'ArrowDown' && currentTemp > 16.0) {
                  window.control('temp', (currentTemp - 0.5).toFixed(1));
              }
              break;

          default:
              break;
      }
  }

  else if (currentScreen === 'regen') {
      const regenMode = currentState.regenMode;

      if (e.key === 'Enter') {
          window.control('onepedal', !currentState.onepedal);
      } else if (e.key === 'ArrowUp') {
          const controls = focusableAreas.regen;
          const currentIndex = controls.indexOf(regenMode);
          if (currentIndex < 2) {
             const nextIndex = (currentIndex + 1) % controls.length;
             window.control('regenMode', controls[nextIndex]);
          }
      } else if (e.key === 'ArrowDown') {
          const controls = focusableAreas.regen;
          const currentIndex = controls.indexOf(regenMode);
          if (currentIndex > 0) {
             const nextIndex = (currentIndex - 1) % controls.length;
             window.control('regenMode', controls[nextIndex]);
          }
      }
  }
  else if (currentScreen === 'graph') {
      const currentGraph = currentState.currentGraph;

      if ((e.key === 'Enter') || (e.key === 'ArrowDown')) {
          const controls = focusableAreas.graph;
          const currentIndex = controls.indexOf(currentGraph);
          if (currentIndex < 2) {
             const nextIndex = (currentIndex + 1) % controls.length;
             window.control('currentGraph', controls[nextIndex]);
          }
      } else if (e.key === 'ArrowUp') {
          const controls = focusableAreas.graph;
          const currentIndex = controls.indexOf(currentGraph);
          if (currentIndex > 0) {
             const nextIndex = (currentIndex - 1) % controls.length;
             window.control('currentGraph', controls[nextIndex]);
          }
      }
  }
});

let lastValue = 0;
const smoothingFactor = 0.1;

setInterval(() => {
  const randomTarget = Math.floor(Math.random() * 101);
  lastValue = (lastValue * (1 - smoothingFactor)) + (randomTarget * smoothingFactor);
  setState('evConsumption', Math.round(lastValue) - 50);
  setState('lastRegenValue', Math.round(lastValue));
  setState('gasConsumption', Math.round(lastValue)/3);
  setState('carSpeed', Math.round(lastValue));

}, 200);
