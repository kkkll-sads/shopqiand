package com.shuquan.billing;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int STARTUP_PERMISSION_REQUEST_CODE = 1001;
    private boolean isPermissionDialogShowing = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestStartupPermissions();

        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }

        WebSettings settings = webView.getSettings();
        settings.setTextZoom(100);
    }

    private void requestStartupPermissions() {
        List<String> requiredPermissions = new ArrayList<>();

        // Camera
        addIfNotGranted(requiredPermissions, Manifest.permission.CAMERA);

        // Photo album permissions by Android version.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            addIfNotGranted(requiredPermissions, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            addIfNotGranted(requiredPermissions, Manifest.permission.READ_MEDIA_IMAGES);
            addIfNotGranted(requiredPermissions, Manifest.permission.POST_NOTIFICATIONS);
        } else {
            addIfNotGranted(requiredPermissions, Manifest.permission.READ_EXTERNAL_STORAGE);
        }

        // Location
        addIfNotGranted(requiredPermissions, Manifest.permission.ACCESS_COARSE_LOCATION);
        addIfNotGranted(requiredPermissions, Manifest.permission.ACCESS_FINE_LOCATION);

        if (!requiredPermissions.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                requiredPermissions.toArray(new String[0]),
                STARTUP_PERMISSION_REQUEST_CODE
            );
        }
    }

    private void addIfNotGranted(List<String> target, String permission) {
        if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
            target.add(permission);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != STARTUP_PERMISSION_REQUEST_CODE) {
            return;
        }

        boolean hasDenied = false;
        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                hasDenied = true;
                break;
            }
        }

        if (hasDenied) {
            showPermissionSettingsDialog();
        }
    }

    private void showPermissionSettingsDialog() {
        if (isPermissionDialogShowing || isFinishing()) {
            return;
        }

        isPermissionDialogShowing = true;

        new AlertDialog.Builder(this)
            .setTitle(getString(R.string.permission_denied_title))
            .setMessage(getString(R.string.permission_denied_message))
            .setNegativeButton(getString(R.string.permission_later), (dialog, which) -> {
                isPermissionDialogShowing = false;
                dialog.dismiss();
            })
            .setPositiveButton(getString(R.string.permission_go_settings), (dialog, which) -> {
                isPermissionDialogShowing = false;
                openAppSettings();
            })
            .setOnCancelListener(dialog -> isPermissionDialogShowing = false)
            .show();
    }

    private void openAppSettings() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.fromParts("package", getPackageName(), null));
        startActivity(intent);
    }
}
