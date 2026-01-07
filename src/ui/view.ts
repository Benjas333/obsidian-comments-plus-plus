import CommentsPlusPlus from "main";
import { IconName, ItemView, MarkdownView, Menu, WorkspaceLeaf } from "obsidian";
import { AllComments, CommentPP, MouseButton } from "types";
import { ICON_NAME, PLUGIN_NAME, VIEW_TYPE_COMMENT } from "utils/constants";
import { CommentsNotice, hideChildren, isHidden, toggleChildren } from "utils/helpers";
import { DateTime } from "luxon";

// TODO: Improve class in general lol x2
// Make a separate manager/storage class
// Make an actual Comment++ class or Thread + Reply classes
export class CommentsPPView extends ItemView {
        private comments: AllComments = {};
        private commentsEl: HTMLElement;

        constructor(leaf: WorkspaceLeaf, private plugin: CommentsPlusPlus) {
                super(leaf);
        }

        getIcon(): IconName {
                return ICON_NAME;
        }

        getViewType(): string {
                return VIEW_TYPE_COMMENT;
        }

        getDisplayText(): string {
                return PLUGIN_NAME;
        }

        setComments(comments: CommentPP[], fileName: string) {
                // console.debug(this.comments[fileName]);
                // console.debug(comments);
                this.comments[fileName]?.forEach((prevComment) => {
                        const newComment = comments.find(c => prevComment.id && c.id && c.id === prevComment.id);
                        if (newComment) {
                                newComment.childrenHiddenView = prevComment.childrenHiddenView;
                                newComment.childrenHiddenEditor = prevComment.childrenHiddenEditor;
                        }
                });

                this.comments[fileName] = comments;
                this.renderComments(fileName);
        }

        renderComments(fileName: string) {
                this.commentsEl.empty();

                this.comments[fileName]?.forEach((comment) => {
                        const commentContainer = this.commentsEl.createDiv({
                                cls: "comment-item-container",
                        });

                        const headerDiv = commentContainer.createDiv({
                                cls: "comment-header",
                        });

                        const infoDiv = headerDiv.createDiv({
                                cls: "comment-info",
                        });
                        infoDiv.createEl("b", {
                                text: comment.name,
                                cls: "comment-name",
                        });
                        infoDiv.createEl("i", {
                                text: comment.timestamp?.toLocaleString(DateTime.DATETIME_MED),
                                cls: "comment-item-date",
                        });

                        const minimizeEl = headerDiv.createEl("button", {
                                text: comment.childrenHiddenView ? "+" : "-",
                                cls: "comment-minimize",
                        });
                        headerDiv.createEl("b", {
                                text: `Line ${comment.contentPos.line}`,
                                cls: "comment-line",
                        });

                        const commentItem = commentContainer.createDiv({
                                cls: "comment-item",
                        });
                        const p = commentItem.createEl("p", {
                                cls: "comment-item-text",
                        });
                        comment.content.trim().split("\n").forEach((line, index, { length }) => {
                                p.createSpan({ text: line });
                                if (index === length - 1) return;

                                p.createEl("br");
                        });

                        commentItem.onClickEvent((ev) => {
                                if (ev.button === MouseButton.RIGHT.valueOf()) {
                                        this.showCommentOptions(ev, comment, false);
                                        return;
                                }

                                if (ev.button !== MouseButton.LEFT.valueOf()) return;

                                const handler = async () => await this.navigateToComment(comment, fileName);
                                handler().catch((e) => new CommentsNotice(`${e}`, 0));
                        });

                        if (!comment.children.length) {
                                minimizeEl.hide();
                                minimizeEl.setAttr("hidden", true);
                                return;
                        }

                        const childrenCommentsEl = commentContainer.createDiv({
                                cls: "comment-children",
                        });
                        if (comment.childrenHiddenView) hideChildren(childrenCommentsEl);

                        this.renderChildrenComments(comment.children, fileName, childrenCommentsEl);

                        minimizeEl.onClickEvent((ev) => {
                                if (ev.button !== MouseButton.LEFT.valueOf()) return;

                                comment.childrenHiddenView = !comment.childrenHiddenView;
                                toggleChildren(childrenCommentsEl);
                                if (isHidden(childrenCommentsEl)) {
                                        minimizeEl.setText("+");
                                        return;
                                }

                                minimizeEl.setText("-");
                        });
                });
        }

        renderChildrenComments(comments: CommentPP[], fileName: string, element: HTMLElement) {
                element.empty();

                comments.forEach((comment) => {
                        const commentContainer = element.createDiv({
                                cls: "comment-child-container",
                        });
                        commentContainer.createDiv({
                                cls: "comment-child-separator",
                        });

                        const headerDiv = commentContainer.createDiv({
                                cls: "comment-header",
                        });

                        const infoDiv = headerDiv.createDiv({
                                cls: "comment-info",
                        });
                        infoDiv.createEl("b", {
                                text: comment.name,
                                cls: "comment-name",
                        });
                        infoDiv.createEl("i", {
                                text: comment.timestamp?.toLocaleString(DateTime.DATETIME_MED),
                                cls: "comment-child-date",
                        });

                        const commentItem = commentContainer.createDiv({
                                cls: "comment-child",
                        });
                        const p = commentItem.createEl("p", {
                                cls: "comment-child-text",
                        });
                        comment.content.trim().split("\n").forEach((line, index, { length }) => {
                                p.createSpan({ text: line });
                                if (index === length - 1) return;

                                p.createEl("br");
                        });

                        commentItem.onClickEvent((ev) => {
                                if (ev.button === MouseButton.RIGHT.valueOf()) {
                                        this.showCommentOptions(ev, comment, true);
                                        return;
                                }

                                if (ev.button !== MouseButton.LEFT.valueOf()) return;

                                const handler = async () => await this.navigateToComment(comment, fileName);
                                handler().catch((e) => new CommentsNotice(`${e}`, 0));
                        });
                });
        }

        private async navigateToComment(comment: CommentPP, fileName: string) {
                await this.app.workspace.openLinkText("", fileName);
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                const file = this.app.workspace.getActiveFile();

                if (!editor || !file) return;

                editor.setCursor(comment.contentPos);
                editor.scrollIntoView(
                        {
                                from: comment.contentPos,
                                to: comment.contentPos,
                        },
                        true
                );
        }

        private showCommentOptions(ev: MouseEvent, comment: CommentPP, child: boolean) {
                const menu = new Menu();
                let addTitle = "Add sub-comment";
                let removeTitle = "Remove entire comment";

                if (child) {
                        addTitle = "Add follow-up sub-comment";
                        removeTitle = "Remove sub-comment";
                }

                menu.addItem((item) =>
                        item
                                .setTitle(addTitle)
                                .setIcon("plus")
                                .onClick(async () => await this.addComment(comment))
                );

                menu.addItem((item) =>
                        item
                                .setTitle(removeTitle)
                                .setIcon("trash")
                                .onClick(async () => await this.removeComment(comment))
                );

                menu.showAtMouseEvent(ev);
        }

        private async addComment(comment: CommentPP) {
                await this.plugin.addReply(comment);
        }

        private async removeComment(comment: CommentPP) {
                await this.plugin.removeComment(comment);

                this.comments[comment.file.name]!.remove(comment);
                this.renderComments(comment.file.name);
        }

        async onOpen() {
                const container = this.containerEl.children[1];
                if (!container) {
                        new CommentsNotice("Container not found", 0);
                        return;
                }

                container.empty();
                const commentContainer = container.createDiv();
                commentContainer.createEl("h2", {
                        text: PLUGIN_NAME,
                        cls: "comments-title",
                });
                this.commentsEl = commentContainer.createDiv();

                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) await this.plugin.updateComments(activeFile);
                // const files = this.app.vault.getFiles()
                // for (const file of files) {
                //         await this.plugin.updateComments(file);
                // }
        }
}
