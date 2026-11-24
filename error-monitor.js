(function () {
            const errorLog = window.__iconMakerErrorLog = [];
            const maxErrors = 30;

            function describe(value) {
                if (value instanceof Error) return value.stack || value.message;
                if (typeof value === "string") return value;
                try {
                    return JSON.stringify(value);
                } catch (_) {
                    return String(value);
                }
            }

            function recordError(source, message, details) {
                const entry = {
                    time: new Date().toISOString(),
                    source: source,
                    message: String(message || "Unknown error"),
                    details: details ? String(details) : ""
                };
                errorLog.push(entry);
                if (errorLog.length > maxErrors) errorLog.shift();

                const button = document.getElementById("copy-error-button");
                const label = document.getElementById("copy-error-button-label");
                if (button) {
                    button.hidden = false;
                    if (label) label.textContent = "Copy error (" + errorLog.length + ")";
                }
            }

            window.__iconMakerRecordError = recordError;

            window.addEventListener("error", function (event) {
                const target = event.target;
                const resource = target && target !== window
                    ? (target.src || target.href || target.tagName || "Unknown resource")
                    : "";
                recordError(
                    "Browser error",
                    event.message || (resource ? "Resource failed to load: " + resource : "Uncaught browser error"),
                    event.error ? describe(event.error) : (event.filename ? event.filename + ":" + event.lineno + ":" + event.colno : resource)
                );
            }, true);

            window.addEventListener("unhandledrejection", function (event) {
                recordError("Unhandled promise rejection", describe(event.reason), event.reason instanceof Error ? event.reason.stack : "");
            });

            const originalConsoleError = console.error.bind(console);
            console.error = function (...args) {
                originalConsoleError(...args);
                recordError("console.error", args.map(describe).join(" "));
            };

            function inspectErrorElement(element) {
                if (!(element instanceof Element)) return;
                const selectors = ".toast-error, [role='alert'], .error-message, .error-banner, .form-error, .icon-library-metadata-feedback.error";
                const matches = [];
                if (element.matches(selectors)) matches.push(element);
                matches.push(...element.querySelectorAll(selectors));
                matches.forEach(node => {
                    const message = (node.innerText || node.textContent || "").trim();
                    if (message && node.dataset.copyErrorCaptured !== "true") {
                        node.dataset.copyErrorCaptured = "true";
                        recordError("Displayed app error", message);
                    }
                });
            }

            document.addEventListener("DOMContentLoaded", function () {
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        if (mutation.type === "characterData") {
                            inspectErrorElement(mutation.target.parentElement);
                        } else {
                            mutation.addedNodes.forEach(inspectErrorElement);
                            if (mutation.target instanceof Element) inspectErrorElement(mutation.target);
                        }
                    });
                });
                if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });

                const copyButton = document.getElementById("copy-error-button");
                if (!copyButton) return;

                copyButton.addEventListener("click", async function () {
                    const report = errorLog.map((entry, index) =>
                        "[" + (index + 1) + "] " + entry.time + " | " + entry.source + "\n" +
                        entry.message + (entry.details ? "\n" + entry.details : "")
                    ).join("\n\n");

                    try {
                        let copied = false;
                        if (navigator.clipboard && window.isSecureContext) {
                            try {
                                await navigator.clipboard.writeText(report);
                                copied = true;
                            } catch (_) {
                                // Try the legacy clipboard method if browser permission blocks the modern API.
                            }
                        }

                        if (!copied) {
                            const textarea = document.createElement("textarea");
                            textarea.value = report;
                            textarea.style.position = "fixed";
                            textarea.style.opacity = "0";
                            document.body.appendChild(textarea);
                            textarea.select();
                            copied = document.execCommand("copy");
                            textarea.remove();
                            if (!copied) throw new Error("Clipboard copy was blocked by the browser.");
                        }

                        errorLog.length = 0;
                        copyButton.hidden = true;
                        const label = document.getElementById("copy-error-button-label");
                        if (label) label.textContent = "Copy error";
                        copyButton.blur();
                    } catch (error) {
                        recordError("Copy error report failed", describe(error));
                        copyButton.title = "Copy was blocked. Try using the browser's clipboard permission.";
                    }
                });
            });
        })();

