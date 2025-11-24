package br.com.redesurftank.havalshisuku.models.screens;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.CarConstants;
import br.com.redesurftank.havalshisuku.models.MainUiManager;
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType;
import br.com.redesurftank.havalshisuku.models.SharedPreferencesKeys;
import br.com.redesurftank.havalshisuku.models.SteeringWheelAcControlType;

import java.util.Arrays;
import java.util.Objects;

public class AcControlScreen implements Screen {

    private ServiceManager serviceManager;
    private Screen previousScreen = this;
    private int steeringWheelAcControlTypeIndex = 0;
    private SteeringWheelAcControlType steeringWheelAcControlType = SteeringWheelAcControlType.TEMPERATURE;

    @Override
    public String getJsName() {
        return "aircon";
    }

    @Override
    public void processKey(Key key) {
        switch (key) {
            case ENTER: // Enter
                if (steeringWheelAcControlTypeIndex == 0) steeringWheelAcControlTypeIndex = 1;
                else steeringWheelAcControlTypeIndex = 0;
                steeringWheelAcControlType = SteeringWheelAcControlType.values()[steeringWheelAcControlTypeIndex];
                serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL, steeringWheelAcControlType);
                serviceManager.getSharedPreferences().edit().putString(SharedPreferencesKeys.LAST_CLUSTER_AC_CONFIG.getKey(), steeringWheelAcControlType.name()).apply();
                break;
            case UP: // Up & Down
            case DOWN: {
                switch (steeringWheelAcControlType) {
                    case TEMPERATURE: {
                        var currentTemperature = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue());
                        if (currentTemperature != null) {
                            float temperature = Float.parseFloat(currentTemperature);
                            if (key == Key.UP) {
                                temperature += 0.5f;
                                if (temperature > 30.0f)
                                    temperature = 30.0f;
                            } else {
                                temperature -= 0.5f;
                                if (temperature < 16.0f)
                                    temperature = 16.0f;
                            }
                            serviceManager.updateData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue(), String.valueOf(temperature));
                        }
                    }
                    break;
                    case FAN_SPEED: {
                        var currentFanSpeed = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_FAN_SPEED.getValue());
                        if (currentFanSpeed != null) {
                            int speed = Integer.parseInt(currentFanSpeed);
                            if (key == Key.UP) {
                                speed++;
                                if (speed > 7)
                                    speed = 7;
                            } else {
                                speed--;
                                if (speed < 0)
                                    speed = 0;
                            }

                            boolean powerMode = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_POWER_MODE.getValue()).equals("1");
                            if (speed == 0) {
                                serviceManager.updateData(CarConstants.CAR_HVAC_POWER_MODE.getValue(), "0");
                            } else if (!powerMode) {
                                serviceManager.updateData(CarConstants.CAR_HVAC_POWER_MODE.getValue(), "1");
                            }
                            serviceManager.updateData(CarConstants.CAR_HVAC_FAN_SPEED.getValue(), String.valueOf(speed));
                        }
                    }
                    break;
                }
            }
            break;
            case BACK: {
                MainUiManager.getInstance().updateScreen(previousScreen);
            }
            break;
            case BACK_LONG: {
                var currentCycleMode = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue());
                if (currentCycleMode != null) {
                    boolean cycleMode = currentCycleMode.equals("1");
                    cycleMode = !cycleMode;
                    serviceManager.updateData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue(), cycleMode ? "1" : "0");
                }
                break;
            }
            case ENTER_LONG: {
                var currentAutoMode = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_AUTO_ENABLE.getValue());
                if (currentAutoMode != null) {
                    boolean autoMode = currentAutoMode.equals("1");
                    autoMode = !autoMode;
                    serviceManager.updateData(CarConstants.CAR_HVAC_AUTO_ENABLE.getValue(), autoMode ? "1" : "0");
                }
                break;
            }
        }
    }

    @Override
    public void initialize() {
        this.serviceManager = ServiceManager.getInstance();
        var lastAcConfig = this.serviceManager.getSharedPreferences().getString(SharedPreferencesKeys.LAST_CLUSTER_AC_CONFIG.getKey(), SteeringWheelAcControlType.FAN_SPEED.name());
        steeringWheelAcControlType = SteeringWheelAcControlType.valueOf(Objects.requireNonNullElse(lastAcConfig, SteeringWheelAcControlType.FAN_SPEED.name()));
        steeringWheelAcControlTypeIndex = Arrays.asList(SteeringWheelAcControlType.values()).indexOf(steeringWheelAcControlType);

        // Forces AC screen to be displayed
        serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.UPDATE_SCREEN,this);

        // Updates focus to latest focused item
        serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL, steeringWheelAcControlType);
    }


    @Override
    public void setReturnScreen(Screen previousScreen) {
        this.previousScreen = previousScreen;
    }


}
