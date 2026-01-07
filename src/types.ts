import { DateTime } from "luxon";
import { App, EditorPosition, TFile } from "obsidian";

export interface CommentPP {
        id?: string;
        name: string;
        content: string;
        startPos: EditorPosition;
        endPos: EditorPosition;
        contentPos: EditorPosition;
        children: CommentPP[];
        parent?: CommentPP;
        file: TFile;
        timestamp?: DateTime;
        childrenHiddenView: boolean;
        childrenHiddenEditor: boolean;
}

export interface AllComments {
        [key: string]: CommentPP[];
}

export interface GenericDict {
        [key: string]: unknown;
}

interface AppPlugins {
        plugins: GenericDict;
}

export interface FixedApp extends App {
        plugins: AppPlugins;
}

export enum MouseButton {
        LEFT,
        MIDDLE,
        RIGHT,
        FOURTH,
        FIFTH,
}
