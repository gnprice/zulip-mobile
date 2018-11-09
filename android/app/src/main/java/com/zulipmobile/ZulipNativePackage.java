package com.zulipmobile;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.zulipmobile.notifications.BadgeCountUpdaterModule;

import java.util.ArrayList;
import java.util.List;

class ZulipNativePackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return new ArrayList<>();
    }

    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new CustomTabsAndroid(reactContext));
        modules.add(new RNSecureRandom(reactContext));
        modules.add(new CloseAllCustomTabsAndroid(reactContext));
        modules.add(new ShareImageAndroid(reactContext));
        modules.add(new BadgeCountUpdaterModule(reactContext));
        modules.add(new TextCompressionModule(reactContext));
        return modules;
    }

}
