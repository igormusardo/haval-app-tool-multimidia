package br.com.redesurftank.havalshisuku.models.screens;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;

public interface Screen {
    public static enum Key {
        UP, DOWN, ENTER, HOME, BACK, ENTER_LONG, BACK_LONG
    }

    String getJsName();

    void processKey(Key key);

    void initialize();

    void setReturnScreen(Screen previousScreen);

}
