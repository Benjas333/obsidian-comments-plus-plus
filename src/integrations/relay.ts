import { App } from "obsidian";
import { FixedApp, GenericDict } from "types";

// TODO: add relay color integration with comments
interface UserColor {
        color: string;
        light: string;
}

interface User {
        color: UserColor;
        email: string;
        id: string;
        name: string;
        picture: string;
        token: string;
}

interface LoginManager extends GenericDict {
        user?: User;
}

interface RelayPlugin extends GenericDict {
        loginManager: LoginManager;
}

export function isRelayInstalled(app: App): boolean {
        return "system3-relay" in (app as FixedApp).plugins.plugins;
}

export function getRelayUsername(app: App): string | undefined {
        const relayPlugin = (app as FixedApp).plugins.plugins["system3-relay"] as RelayPlugin | undefined;
        if (!relayPlugin) return;

        const user = relayPlugin.loginManager.user;
        if (!user) return;

        return user.name;
}
