(() => {
    const overlay = document.querySelector("[data-loading-overlay]");

    if (!overlay) {
        return;
    }

    const showLoading = () => {
        overlay.classList.add("is-visible");
        overlay.setAttribute("aria-hidden", "false");
    };

    document.querySelectorAll("[data-weather-form]").forEach((form) => {
        form.addEventListener("submit", showLoading);
    });

    document.querySelectorAll("[data-weather-link]").forEach((link) => {
        link.addEventListener("click", showLoading);
    });

    window.addEventListener("pageshow", () => {
        overlay.classList.remove("is-visible");
        overlay.setAttribute("aria-hidden", "true");
    });
})();
