package br.com.redesurftank.havalshisuku.models;

import android.content.SharedPreferences;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.screens.MainMenu;
import br.com.redesurftank.havalshisuku.models.screens.Screen;

public class MainUiManager {

    // These fields are not declared in the original file. I'm declaring them here to make the code compile.
    private SharedPreferences sharedPreferences;

    private static volatile MainUiManager INSTANCE;

    // Estado atual da tela (MainMenu ou um sub-menu)
    private Screen currentScreen;

    private MainUiManager() {
        MainMenu initialMenu = new MainMenu();
        initialMenu.initialize();
        this.currentScreen = initialMenu.setInitialScreen(this);
        this.sharedPreferences = ServiceManager.getInstance().getSharedPreferences();
    }

    public void updateScreen() {
        this.currentScreen.initialize();
        if (sharedPreferences != null) sharedPreferences.edit().putString(SharedPreferencesKeys.LAST_CLUSTER_SCREEN.getKey(), this.currentScreen.getJsName()).apply();
    }

    public void updateScreen(Screen newScreen) {
        newScreen.initialize();
        this.currentScreen = newScreen;
        if (sharedPreferences != null) sharedPreferences.edit().putString(SharedPreferencesKeys.LAST_CLUSTER_SCREEN.getKey(), this.currentScreen.getJsName()).apply();
    }

    public static MainUiManager getInstance() {
        if (INSTANCE == null) {
            synchronized (MainUiManager.class) {
                if (INSTANCE == null) {
                    INSTANCE = new MainUiManager();
                }
            }
        }
        return INSTANCE;
    }



    public void handleGeneralKeyEvents(Screen.Key key) {
        this.currentScreen.processKey(key);
    }

}
