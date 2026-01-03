import { App, Modal, Setting } from "obsidian";
import { CommentsNotice } from "utils/helpers";

interface ModalResult {
        text: string;
}

type ModalOptionsType = {
        header: string;
        description: string;
        initial?: ModalResult;
        canBeEmpty?: boolean;
};

interface ModalOptions {
        header: string;
        description: DocumentFragment;
        initial: ModalResult;
        canBeEmpty: boolean;
}

class EnterTextModal extends Modal {
        input: ModalResult;
        options: ModalOptions;

        constructor(app: App, options: ModalOptionsType, public callback: (result: ModalResult) => unknown) {
                super(app);
                const df = new DocumentFragment();
                options.description.split("\n").forEach((line, index, { length }) => {
                        df.createSpan({
                                text: line,
                        });
                        if (index === length - 1) return;

                        df.createEl("br");
                });
                this.options = {
                        header: options.header,
                        description: df,
                        initial: options.initial || { text: "" },
                        canBeEmpty: options.canBeEmpty ?? true,
                };
                this.input = this.options.initial;
        }

        onOpen() {
                this.setHeading();
                this.setField();
                this.setButtons();
        }

        onClose() {
                const { contentEl } = this;
                contentEl.empty();
        }

        protected setHeading() {
                new Setting(this.contentEl).setName(this.options.header).setHeading();
        }

        protected setField() {
                new Setting(this.contentEl)
                        .addText(
                                (text) =>
                                        (text.setValue(this.input.text).onChange((value) => {
                                                this.input.text = value;
                                        }).inputEl.onkeydown = (ev) => {
                                                if (ev.key !== "Enter") return;

                                                ev.preventDefault();
                                                this.onEnterHandler(ev);
                                        })
                        )
                        .setDesc(this.options.description);
        }

        protected setButtons() {
                new Setting(this.contentEl)
                        .addButton((btn) => btn.setButtonText("Cancel").onClick(() => this.close()))
                        .addButton((btn) =>
                                btn
                                        .setButtonText("OK")
                                        .setCta()
                                        .onClick((ev) => this.onEnterHandler(ev))
                        );
        }

        protected onEnterHandler(_ev: UIEvent) {
                if (!this.input.text.trim() && !this.options.canBeEmpty) {
                        new CommentsNotice("This field cannot be empty");
                        return;
                }

                this.close();
                this.callback(this.input);
        }
}

// TODO: Improve class in general lol
// Consider making an abstract class and/or make it more flexible/complex
class EnterTextAreaModal extends EnterTextModal {
        protected setField() {
                new Setting(this.contentEl)
                        .addTextArea(
                                (text) =>
                                        (text.setValue(this.input.text).onChange((value) => {
                                                this.input.text = value;
                                        }).inputEl.onkeydown = (ev) => {
                                                if (!ev.ctrlKey || ev.key !== "Enter") return;

                                                ev.preventDefault();
                                                this.onEnterHandler(ev);
                                        })
                        )
                        .setDesc(this.options.description)
                        .setClass("comment-bigger-input");
        }

        // protected onEnterHandler(_ev: UIEvent): void {
        //         if (!this.input.text.replace(/\s/g, "") && !this.options.canBeEmpty) {
        //                 new CommentsNotice("This field cannot be empty");
        //                 return;
        //         }

        //         this.close();
        //         this.callback(this.input);
        // }
}

export const promptForText = (app: App, options: ModalOptionsType) => {
        return new Promise<ModalResult | void>((resolve) => {
                new EnterTextModal(app, options, (callback) => resolve(callback)).open();
        });
};

export const promptForTextArea = (app: App, options: ModalOptionsType) => {
        return new Promise<ModalResult | void>((resolve) => {
                new EnterTextAreaModal(app, options, (callback) => resolve(callback)).open();
        });
};

export const promptForDefaultName = (app: App) => {
        return promptForText(app, {
                header: "Enter your default name",
                description: "This name will be used by default in comments.",
        });
};

export const promptForCommentName = (app: App, text: string = "") => {
        return promptForText(app, {
                header: "Enter the comment name",
                description: "This name will be included in the comment.\nYou can skip this step by defining a default name in the plugin settings.",
                // canBeEmpty: false,
                initial: { text },
        });
};

export const promptForCommentContent = (app: App) => {
        return promptForTextArea(app, {
                header: "Enter the comment content",
                description: "",
                canBeEmpty: false,
        });
};
